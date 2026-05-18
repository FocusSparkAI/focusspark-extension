import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  FileText,
  Cpu,
  Leaf,
  Calendar,
  Sparkles,
  ChevronRight,
  Download,
  Share2,
  Home,
  MessageCircle,
  Check,
  ThumbsUp,
  ThumbsDown,
  X,
  BarChart2,
} from 'lucide-react';
import { Button } from './ui/button';

import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { toast } from 'sonner';
import { BACKEND_ROUTES, buildBackendUrl } from '../config/backend';
import { getAuthHeaders } from '../utils/backendClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatIcon = 'ai' | 'tool' | 'doc' | 'code';
type EmotionState = 'happy' | 'tired' | 'neutral' | 'sad';
type FocusState = 'focused' | 'attention' | 'idle';

interface ChatChipType {
  type: 'flashcard' | 'quiz';
}

interface Flashcard {
  id: string;
  title: string;
  front: string;
  back: string;
  example?: string;
  memoryTip?: string;
  examShortcut?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system' | 'flashcard' | 'quiz';
  text: string;
  time: string;
  backendMessageId?: number;
  chips?: ChatChipType['type'][];
  flashcards?: Flashcard[];
  quizData?: QuizQuestion[];
}

interface Chat {
  id: string;
  name: string;
  preview: string;
  time: string;
  icon: ChatIcon;
  section: 'Today' | 'Yesterday' | 'Earlier';
  messages: ChatMessage[];
}

const stripTutorPromptWrapper = (text: string) => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return '';
  }

  if (!/CONVERSATION HISTORY:|Respond naturally, helpfully, and in character\.|\bUSER:\s*/i.test(trimmedText)) {
    return trimmedText;
  }

  const userMessageMatch = trimmedText.match(/(?:^|\n)USER:\s*([\s\S]*?)(?:\n\s*Respond naturally[\s\S]*)?$/i);
  return userMessageMatch?.[1]?.trim() || trimmedText;
};

const ICON_MAP: Record<ChatIcon, { Icon: React.ElementType; colorClass: string }> = {
  ai: { Icon: Brain, colorClass: 'bg-purple-500/15 text-purple-400' },
  tool: { Icon: Leaf, colorClass: 'bg-teal-500/15 text-teal-400' },
  doc: { Icon: FileText, colorClass: 'bg-blue-500/15 text-blue-400' },
  code: { Icon: Cpu, colorClass: 'bg-amber-500/15 text-amber-400' },
};

// ─── Gradient — exact copy from ChatbotWorkspace ──────────────────────────────

function getFullScreenGradient(focusState: FocusState, emotionState: EmotionState, isDetectionEnabled: boolean) {
  const isDark = document.documentElement.classList.contains('dark');

  if (!isDetectionEnabled) {
    switch (emotionState) {
      case 'happy':
        return isDark
          ? 'linear-gradient(135deg, #1a4a3a 0%, #1a3a4a 25%, #2a4a3a 50%, #1a4a45 75%, #1a3a3a 100%)'
          : 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 25%, #34D399 50%, #10B981 75%, #059669 100%)';
      case 'sad':
        return isDark
          ? 'linear-gradient(135deg, #4a1a1a 0%, #4a2a1a 25%, #3a1a2a 50%, #4a1a2a 75%, #3a1a1a 100%)'
          : 'linear-gradient(135deg, #FCA5A5 0%, #F87171 25%, #EF4444 50%, #DC2626 75%, #B91C1C 100%)';
      case 'neutral':
      default:
        return isDark
          ? 'linear-gradient(135deg, #4a3a1a 0%, #3a2a1a 25%, #4a3a2a 50%, #3a3a1a 75%, #2a2a1a 100%)'
          : 'linear-gradient(135deg, #FDE68A 0%, #FCD34D 25%, #FBBF24 50%, #F59E0B 75%, #D97706 100%)';
    }
  }

  switch (focusState) {
    case 'focused':
      return isDark
        ? 'linear-gradient(135deg, #1a2a4a 0%, #1a3d4a 50%, #1a4a47 100%)'
        : 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 50%, #B2FEFA 100%)';
    case 'attention':
      return isDark
        ? 'linear-gradient(135deg, #4a2a1a 0%, #4a3d1a 50%, #4a3a1a 100%)'
        : 'linear-gradient(135deg, #FF9966 0%, #FFD200 50%, #F7971E 100%)';
    case 'idle':
      return isDark
        ? 'linear-gradient(135deg, #2a2d3a 0%, #2d3a2d 50%, #3a3d2a 100%)'
        : 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 50%, #DCE35B 100%)';
    default:
      return isDark
        ? 'linear-gradient(135deg, #1a2a4a 0%, #1a3d4a 100%)'
        : 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatIconBadge({ icon, size = 'sm' }: { icon: ChatIcon; size?: 'sm' | 'md' }) {
  const { Icon, colorClass } = ICON_MAP[icon];
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`${dim} rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      <Icon className={iconSize} />
    </div>
  );
}

function MessageChips({ chips }: { chips: ChatChipType['type'][] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.includes('flashcard') && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Sparkles className="w-3 h-3" />
          Flashcards generated
        </span>
      )}
      {chips.includes('quiz') && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <ChevronRight className="w-3 h-3" />
          Quiz ready
        </span>
      )}
    </div>
  );
}

// Flashcard viewer — same visual style as ChatbotWorkspace, flip still works, react buttons are greyed/disabled
function FlashcardViewer({ flashcards }: { flashcards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.5 }}
            className="min-h-[300px]"
          >
            <Card
              className="cursor-pointer hover:shadow-2xl transition-shadow border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-600/10"
              onClick={() => setShowBack(!showBack)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                      {flashcards[index].title}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {flashcards[index].tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <Badge
                    variant={
                      flashcards[index].difficulty === 'easy'
                        ? 'default'
                        : flashcards[index].difficulty === 'medium'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {flashcards[index].difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showBack ? (
                  <div>
                    <p className="text-lg mb-4 text-foreground">{flashcards[index].front}</p>
                    <p className="text-sm text-muted-foreground text-center">Click to reveal answer</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <p className="text-lg text-foreground">{flashcards[index].back}</p>
                    </div>
                    {flashcards[index].example && (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-muted-foreground mb-1">💡 Example:</p>
                        <p className="text-foreground">{flashcards[index].example}</p>
                      </div>
                    )}
                    {flashcards[index].memoryTip && (
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <p className="text-sm text-muted-foreground mb-1">🧠 Memory Tip:</p>
                        <p className="text-foreground">{flashcards[index].memoryTip}</p>
                      </div>
                    )}
                    {flashcards[index].examShortcut && (
                      <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                        <p className="text-sm text-muted-foreground mb-1">⚡ Exam Shortcut:</p>
                        <p className="font-mono text-foreground">{flashcards[index].examShortcut}</p>
                      </div>
                    )}
                    {/* Greyed-out reaction buttons — read-only */}
                    <div className="flex gap-3 pt-4">
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400/50 text-sm cursor-not-allowed select-none">
                        <ThumbsUp className="w-4 h-4" />
                        I Know It
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-card border border-border text-muted-foreground/40 text-sm cursor-not-allowed select-none">
                        <ThumbsDown className="w-4 h-4" />
                        Review Again
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="icon"
            disabled={index === 0}
            onClick={() => { setIndex((p) => p - 1); setShowBack(false); }}
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <span className="text-sm text-muted-foreground">{index + 1} / {flashcards.length}</span>
          <Button
            variant="outline"
            size="icon"
            disabled={index === flashcards.length - 1}
            onClick={() => { setIndex((p) => p + 1); setShowBack(false); }}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Quiz viewer — same visual as ChatbotWorkspace, answers still selectable so user can review
function QuizViewer({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  return (
    <div className="w-full rounded-2xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg space-y-6">
      {questions.map((question, qIndex) => (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: qIndex * 0.1 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <p className="mb-4 text-foreground">
            <span className="text-blue-400 mr-2">Q{qIndex + 1}.</span>
            {question.question}
          </p>
          <div className="space-y-2">
            {question.options.map((option, oIndex) => (
              <Button
                key={oIndex}
                variant="outline"
                className={`w-full justify-start text-left ${answers[question.id] === oIndex ? 'border-blue-500 bg-blue-500/10' : ''
                  }`}
                onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: oIndex }))}
              >
                <span className="mr-3 text-muted-foreground">{String.fromCharCode(65 + oIndex)}.</span>
                {option}
                {answers[question.id] === oIndex && (
                  <Check className="w-4 h-4 ml-auto text-blue-400" />
                )}
              </Button>
            ))}
          </div>
          {answers[question.id] !== undefined && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 rounded-lg bg-teal-500/10 border border-teal-500/20"
            >
              <p className="text-sm text-foreground">
                <span className="text-teal-400 mr-2">💡</span>
                {question.explanation}
              </p>
            </motion.div>
          )}
        </motion.div>
      ))}
      {Object.keys(answers).length === questions.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30"
        >
          <p className="text-2xl mb-2 text-foreground">🎉 Quiz Complete!</p>
          <p className="text-muted-foreground">
            Score: {Object.values(answers).filter((a, i) => a === questions[i].correctAnswer).length} / {questions.length}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ChatHistoryPageProps {
  onNavigate?: (page: string) => void;
}

export function ChatHistoryPage({ onNavigate }: ChatHistoryPageProps = {}) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [expectedFileType, setExpectedFileType] = useState<'txt' | 'pdf' | 'word'>('txt');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizeRole = (value: unknown): ChatMessage['role'] => {
    const role = String(value ?? '').toLowerCase();
    if (role === 'assistant') return 'ai';
    if (role === 'flashcard' || role === 'quiz' || role === 'system' || role === 'user' || role === 'ai') {
      return role;
    }
    return 'ai';
  };

  const formatTimeLabel = (value: unknown, fallback: string) => {
    if (typeof value === 'string' && value.trim()) {
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }

      return value;
    }

    return fallback;
  };

  const getSectionLabel = (value: unknown): Chat['section'] => {
    const parsedDate = typeof value === 'string' ? new Date(value) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      return 'Earlier';
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (parsedDate >= startOfToday) return 'Today';
    if (parsedDate >= startOfYesterday) return 'Yesterday';
    return 'Earlier';
  };

  const resolveIcon = (thread: Record<string, unknown>, messages: ChatMessage[]): ChatIcon => {
    const iconHint = String(thread.icon ?? thread.type ?? thread.kind ?? '').toLowerCase();
    if (iconHint.includes('doc') || iconHint.includes('file') || iconHint.includes('upload')) return 'doc';
    if (iconHint.includes('quiz') || iconHint.includes('tool')) return 'tool';
    if (iconHint.includes('code')) return 'code';

    const hasFlashcards = messages.some((message) => message.role === 'flashcard');
    const hasQuiz = messages.some((message) => message.role === 'quiz');
    if (hasFlashcards && !hasQuiz) return 'doc';
    if (hasQuiz) return 'tool';

    return 'ai';
  };

  const mapFlashcards = (value: unknown): Flashcard[] => {
    const payload = value as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const payloadObject = !Array.isArray(payload) ? payload : undefined;
    const nestedData = payloadObject && typeof payloadObject.data === 'object' && payloadObject.data !== null
      ? (payloadObject.data as Record<string, unknown>)
      : undefined;
    const source = Array.isArray(payload)
      ? payload
      : Array.isArray(payloadObject?.flashcards)
        ? (payloadObject.flashcards as Record<string, unknown>[])
        : Array.isArray(nestedData?.flashcards)
          ? (nestedData.flashcards as Record<string, unknown>[])
          : [];

    return source
      .map((card, index) => ({
        id: String(card.id ?? card.card_id ?? `${Date.now()}-${index}`),
        title: String(card.title ?? card.topic ?? 'Chat Flashcards'),
        front: String(card.front ?? card.question ?? ''),
        back: String(card.back ?? card.answer ?? card.explanation ?? ''),
        example: typeof card.example === 'string' ? card.example : undefined,
        memoryTip: typeof card.memoryTip === 'string' ? card.memoryTip : typeof card.memory_tip === 'string' ? card.memory_tip : undefined,
        examShortcut: typeof card.examShortcut === 'string' ? card.examShortcut : typeof card.exam_shortcut === 'string' ? card.exam_shortcut : undefined,
        tags: Array.isArray(card.tags) ? card.tags.map((tag) => String(tag)) : [],
        difficulty: (() => {
          const difficultyValue = String(card.difficulty ?? '').toLowerCase();
          if (difficultyValue === 'easy' || difficultyValue === 'medium' || difficultyValue === 'hard') {
            return difficultyValue as Flashcard['difficulty'];
          }

          return 'medium' as Flashcard['difficulty'];
        })(),
        known: Boolean(card.known),
      }))
      .filter((card) => card.front.length > 0 && card.back.length > 0);
  };

  const mapQuizQuestions = (value: unknown): QuizQuestion[] => {
    const payload = value as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const source = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.questions)
        ? (payload?.questions as Record<string, unknown>[])
        : Array.isArray((payload as Record<string, any> | undefined)?.data?.questions)
          ? ((payload as Record<string, any>)?.data?.questions as Record<string, unknown>[])
          : [];

    return source
      .map((question, index) => ({
        id: String(question.id ?? question.question_id ?? `${Date.now()}-${index}`),
        question: String(question.question ?? question.prompt ?? ''),
        options: Array.isArray(question.options) ? question.options.map((option) => String(option)) : [],
        correctAnswer: Number(question.correct_answer_index ?? question.correctAnswer ?? question.correct_answer ?? 0),
        explanation: String(question.explanation ?? ''),
      }))
      .filter((question) => question.question.length > 0 && question.options.length > 0);
  };

  const resolveThreadDisplayName = (thread: Record<string, unknown>, messages: ChatMessage[], index: number) => {
    const fallbackName = `Chat ${index + 1}`;
    const firstUserMessage = stripTutorPromptWrapper(messages.find((message) => message.role === 'user')?.text ?? '');
    if (firstUserMessage) {
      return firstUserMessage.length > 40 ? `${firstUserMessage.slice(0, 40)}...` : firstUserMessage;
    }

    const title = String(thread.name ?? thread.title ?? thread.subject ?? '').trim();
    if (title && title.toLowerCase() !== 'focusspark ai tutor') {
      return title;
    }

    const preview = String(thread.preview ?? thread.summary ?? '').trim();
    if (preview && preview.toLowerCase() !== 'focusspark ai tutor') {
      return preview.length > 40 ? `${preview.slice(0, 40)}...` : preview;
    }

    const firstAiMessage = messages.find((message) => message.role === 'ai')?.text.trim();
    if (firstAiMessage) {
      return firstAiMessage.length > 40 ? `${firstAiMessage.slice(0, 40)}...` : firstAiMessage;
    }

    return fallbackName;
  };

  const normalizeThreadMessages = async (threadId: string, backendMessages: unknown[], authHeaders: Record<string, string | undefined>) => {
    const normalizedMessages: ChatMessage[] = [];

    for (let messageIndex = 0; messageIndex < backendMessages.length; messageIndex += 1) {
      const rawMessage = (backendMessages[messageIndex] ?? {}) as Record<string, unknown>;
      const messageId = String(rawMessage.id ?? rawMessage.message_id ?? `${threadId}-${messageIndex}`);
      const role = normalizeRole(rawMessage.role);
      const text = stripTutorPromptWrapper(String(rawMessage.text ?? rawMessage.content ?? rawMessage.message ?? ''));
      const time = formatTimeLabel(rawMessage.created_at ?? rawMessage.timestamp, '');
      const chips = Array.isArray(rawMessage.chips)
        ? rawMessage.chips.filter((chip): chip is 'flashcard' | 'quiz' => chip === 'flashcard' || chip === 'quiz')
        : [];

      normalizedMessages.push({
        id: messageId,
        role,
        text,
        time,
        backendMessageId: Number.isFinite(Number.parseInt(messageId, 10)) ? Number.parseInt(messageId, 10) : undefined,
        chips: chips.length > 0 ? chips : undefined,
      });

      try {
        const numericMessageId = Number.parseInt(messageId, 10);
        if (!Number.isFinite(numericMessageId)) continue;

        const artifactRoute = BACKEND_ROUTES.chatMessageArtifacts.replace('{message_id}', String(numericMessageId));
        const artifactResponse = await axios.get(buildBackendUrl(artifactRoute), {
          headers: authHeaders,
        });
        const artifactPayload = artifactResponse.data?.data ?? artifactResponse.data;

        const flashcards = mapFlashcards(artifactPayload);
        if (flashcards.length > 0) {
          normalizedMessages.push({
            id: `${messageId}-flashcards`,
            role: 'flashcard',
            text: '🔥 Generated flashcards from this chat thread.',
            time,
            flashcards,
          });
        }

        const quizData = mapQuizQuestions(artifactPayload);
        if (quizData.length > 0) {
          normalizedMessages.push({
            id: `${messageId}-quiz`,
            role: 'quiz',
            text: '📝 Quick knowledge check! Answer these questions:',
            time,
            quizData,
          });
        }
      } catch {
        // Ignore missing artifacts for messages that do not generate them.
      }
    }

    return normalizedMessages;
  };

  const normalizeThread = async (thread: Record<string, unknown>, index: number, authHeaders: Record<string, string | undefined>): Promise<Chat> => {
    const threadId = String(thread.id ?? thread.thread_id ?? thread.chat_id ?? index + 1);
    const rawMessages = Array.isArray(thread.messages)
      ? thread.messages
      : Array.isArray((thread as Record<string, any>).data?.messages)
        ? ((thread as Record<string, any>).data?.messages as unknown[])
        : [];
    const messages = await normalizeThreadMessages(threadId, rawMessages, authHeaders);
    const previewSource = String(thread.preview ?? thread.summary ?? messages.find((message) => message.role === 'ai')?.text ?? 'Open chat history');
    const timeSource = thread.updated_at ?? thread.created_at ?? thread.last_message_at ?? thread.timestamp;

    return {
      id: threadId,
      name: resolveThreadDisplayName(thread, messages, index),
      preview: previewSource,
      time: formatTimeLabel(timeSource, 'Recently'),
      icon: resolveIcon(thread, messages),
      section: getSectionLabel(timeSource),
      messages,
    };
  };

  const fetchAndNormalizeThread = async (threadId: string, index: number, authHeaders: Record<string, string | undefined>): Promise<Chat | null> => {
    try {
      const response = await axios.get(buildBackendUrl(`${BACKEND_ROUTES.chatThreads}/${threadId}`), { headers: authHeaders });
      const threadPayload = response.data;
      const rawMessages = Array.isArray(threadPayload)
        ? threadPayload
        : Array.isArray(threadPayload?.messages)
          ? threadPayload.messages
          : Array.isArray(threadPayload?.data?.messages)
            ? threadPayload.data.messages
            : [];

      const messages = await normalizeThreadMessages(threadId, rawMessages as unknown[], authHeaders);
      const threadObject = (Array.isArray(threadPayload) ? {} : (threadPayload as Record<string, unknown>)) as Record<string, unknown>;
      const displayName = resolveThreadDisplayName(threadObject, messages, index);
      const previewSource = String(threadObject.preview ?? threadObject.summary ?? messages.find((message) => message.role === 'ai')?.text ?? 'Open chat history');
      const timeSource = threadObject.updated_at ?? threadObject.created_at ?? threadObject.last_message_at ?? threadObject.timestamp;

      return {
        id: threadId,
        name: displayName,
        preview: previewSource,
        time: formatTimeLabel(timeSource, 'Recently'),
        icon: resolveIcon(threadObject, messages),
        section: getSectionLabel(timeSource),
        messages,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadChats = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const authHeaders = await getAuthHeaders();
        const response = await axios.get(buildBackendUrl(BACKEND_ROUTES.chatThreads), { headers: authHeaders });
        const rawThreads = Array.isArray(response.data)
          ? response.data
          : response.data?.results ?? response.data?.threads ?? response.data?.data ?? [];

        const normalizedChats = await Promise.all(
          rawThreads.map((thread: Record<string, unknown>, index: number) => normalizeThread(thread, index, authHeaders)),
        );

        if (cancelled) return;

        setChats(normalizedChats);
        setActiveId((current) => {
          if (current && normalizedChats.some((chat) => chat.id === current)) {
            return current;
          }

          return normalizedChats[0]?.id ?? null;
        });
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to load chat history:', error);
        setChats([]);
        setActiveId(null);
        setLoadError('Unable to load chat history from the backend.');
        toast.error('Unable to load chat history from the backend.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadChats();

    return () => {
      cancelled = true;
    };
  }, []);

  // Mirror ChatbotWorkspace dynamic background states
  const [focusState, setFocusState] = useState<FocusState>('focused');
  const [emotionState, setEmotionState] = useState<EmotionState>('neutral');
  const [, forceUpdate] = useState(0);

  // Same rotation timings as ChatbotWorkspace
  useEffect(() => {
    const interval = setInterval(() => {
      const states: FocusState[] = ['focused', 'attention', 'idle'];
      setFocusState((prev) => {
        const i = states.indexOf(prev);
        return states[(i + 1) % states.length];
      });
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const emotions: EmotionState[] = ['happy', 'tired', 'neutral', 'sad'];
      setEmotionState(emotions[Math.floor(Math.random() * emotions.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Recompute gradient when dark mode toggles
  useEffect(() => {
    const observer = new MutationObserver(() => forceUpdate((n) => n + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const activeChat = chats.find((c) => c.id === activeId) ?? null;

  const sections = ['Today', 'Yesterday', 'Earlier'] as const;
  const grouped = sections.reduce<Record<string, Chat[]>>((acc, s) => {
    acc[s] = chats.filter((c) => c.section === s);
    return acc;
  }, {});


  const handleSelectChat = async (chat: Chat) => {
    setActiveId(chat.id);

    try {
      const authHeaders = await getAuthHeaders();

      const detailedChat = await fetchAndNormalizeThread(chat.id, Number.parseInt(chat.id, 10), authHeaders);
      if (detailedChat) {
        setChats((prev) => prev.map((item) => (item.id === chat.id ? detailedChat : item)));
      }
    } catch {
      // Keep the selected chat usable even if the detail request fails.
    }
  };

  // Example: upload a document to chat/document endpoint
  // (upload handled inline in file input change handler)

  return (
    <motion.div
      className="h-screen flex overflow-hidden relative"
      style={{ background: getFullScreenGradient(focusState, emotionState, false) }}
      animate={{ background: getFullScreenGradient(focusState, emotionState, false) }}
      transition={{ duration: 4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Left Sidebar ── */}
      <AnimatePresence initial={false}>
        {leftPanelOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-80 border-r border-border p-0 flex flex-col fixed lg:relative z-30 h-screen bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg">Chat History</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLeftPanelOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto py-2">
              {isLoading && (
                <p className="text-center text-xs text-muted-foreground py-10">Loading chat history...</p>
              )}
              {!isLoading && loadError && (
                <p className="text-center text-xs text-destructive py-10 px-4">{loadError}</p>
              )}
              {!isLoading && !loadError && chats.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-10">No chats found</p>
              )}
              {!isLoading && !loadError && sections.map((section) => {
                const items = grouped[section];
                if (!items?.length) return null;
                return (
                  <div key={section}>
                    <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {section}
                    </p>
                    {items.map((chat) => (
                      <motion.div
                        key={chat.id}
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.1 }}
                        onClick={() => {
                          void handleSelectChat(chat);
                        }}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors relative group border-l-2 ${chat.id === activeId
                            ? 'bg-accent border-blue-500 pl-[14px]'
                            : 'hover:bg-accent/50 border-transparent'
                          }`}
                      >
                        <ChatIconBadge icon={chat.icon} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{chat.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.preview}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">

        {/* Top Bar — same structure/classes as ChatbotWorkspace */}
        <div className="border-b border-border p-3 sm:p-4 flex-shrink-0 bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 md:gap-4">

            {/* Left */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {onNavigate && (
                <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')} className="hover:bg-accent">
                  <Home className="w-5 h-5" />
                </Button>
              )}
              {!leftPanelOpen && (
                <Button variant="ghost" size="icon" onClick={() => setLeftPanelOpen(true)} className="hover:bg-accent">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
              <div className="hidden sm:flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-500" />
                <h2 className="text-lg lg:text-xl whitespace-nowrap">Chat History</h2>
              </div>
            </div>

            {/* Center — active chat name */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2 md:px-4">
              {activeChat && (
                <div className="flex items-center gap-2.5">
                  <ChatIconBadge icon={activeChat.icon} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{activeChat.name}</p>
                    <p className="text-xs text-muted-foreground">{activeChat.messages.length} messages · read-only</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right — action buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {activeChat && (
                <>
                  {/* File type selector and upload */}
                  <div className="hidden sm:flex items-center gap-2">
                    <select
                      value={expectedFileType}
                      onChange={(e) => setExpectedFileType(e.target.value as any)}
                      className="rounded-full border px-2 py-1 text-sm bg-white/95 dark:bg-[#0f1720]/95"
                      aria-label="Expected file type"
                    >
                      <option value="txt">.txt</option>
                      <option value="pdf">.pdf</option>
                      <option value="word">.docx/.doc</option>
                    </select>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const name = file.name.toLowerCase();
                        const ext = name.split('.').pop() || '';

                        const allowed: Record<string, string[]> = {
                          txt: ['txt'],
                          pdf: ['pdf'],
                          word: ['doc', 'docx'],
                        };

                        if (!allowed[expectedFileType].includes(ext)) {
                          toast.error(`File type mismatch — expected .${allowed[expectedFileType].join('/.')} but got .${ext}. Please choose another file.`);
                          // reset input so user can pick again
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          return;
                        }

                        // Basic additional MIME check for txt
                        if (expectedFileType === 'txt' && file.type && !file.type.startsWith('text')) {
                          toast.error('Selected file does not appear to be plain text. Please choose a .txt file.');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          return;
                        }

                        // Proceed to upload (if activeChat exists)
                        if (!activeChat) {
                          toast.error('Select a chat thread first');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          return;
                        }

                        try {
                          const threadId = Number(activeChat.id);
                          if (Number.isNaN(threadId)) {
                            toast.error('Thread ID is invalid for upload');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            return;
                          }

                          const form = new FormData();
                          form.append('thread_id', String(threadId));
                          form.append('message', `Uploaded file: ${file.name}`);
                          form.append('file', file);

                          const url = buildBackendUrl(BACKEND_ROUTES.chatDocument);
                          const authHeaders = await getAuthHeaders();
                          const headers = { ...authHeaders, 'Content-Type': 'multipart/form-data' };
                          await axios.post(url, form, { headers });
                          toast.success('File uploaded successfully');
                        } catch (err: any) {
                          console.error(err);
                          toast.error(err?.response?.data?.detail || 'Upload failed');
                        } finally {
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                      }}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload document"
                      className="hover:bg-accent"
                      disabled={!activeChat}
                    >
                      <FileText className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => toast.success('🔗 Share link copied!')}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => toast.success('⬇️ Downloading chat…')}>
                    <Download className="w-5 h-5" />
                  </Button>
                </>
              )}
              {!leftPanelOpen && (
                <Button variant="ghost" size="icon" onClick={() => setLeftPanelOpen(true)} className="lg:hidden hover:bg-accent">
                  <BarChart2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages — same scroll area style as ChatbotWorkspace */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 chatbot-messages-scroll">
          <div className="max-w-5xl mx-auto space-y-6 pb-6">
            <AnimatePresence mode="wait">
              {!activeChat ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground"
                >
                  <div className="w-24 h-24 rounded-3xl bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md border border-border flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-12 h-12 text-blue-500/40" />
                  </div>
                  <p className="text-base">
                    {isLoading ? 'Loading chat history from the backend...' : 'Select a chat to view the conversation'}
                  </p>
                  <p className="text-xs opacity-60">
                    {isLoading ? 'Please wait while threads and artifacts are loaded.' : 'All messages are read-only'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeChat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Date divider */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-border/60" />
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {activeChat.section}
                    </span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>

                  {activeChat.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* User Messages — exact ChatbotWorkspace style */}
                      {msg.role === 'user' && (
                        <div className="max-w-2xl rounded-3xl px-6 py-4 bg-card dark:bg-gray-900/70 backdrop-blur-md border border-blue-500/30 dark:border-gray-700 shadow-lg">
                          <p className="text-foreground whitespace-pre-wrap">{msg.text}</p>
                          <span className="text-xs text-muted-foreground mt-2 block">{msg.time}</span>
                        </div>
                      )}

                      {/* AI Messages */}
                      {msg.role === 'ai' && (
                        <div className="max-w-2xl w-full rounded-3xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md border border-border shadow-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                              {msg.chips && msg.chips.length > 0 && <MessageChips chips={msg.chips} />}
                              <span className="text-xs text-muted-foreground mt-2 block">{msg.time}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* System Messages — exact ChatbotWorkspace style */}
                      {msg.role === 'system' && (
                        <div className="w-full rounded-2xl px-6 py-4 border border-teal-500/30 bg-card dark:bg-gray-900/70 backdrop-blur-md shadow-lg">
                          <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />
                            <p className="text-foreground">{msg.text}</p>
                          </div>
                        </div>
                      )}

                      {/* Flashcard Messages */}
                      {msg.role === 'flashcard' && msg.flashcards && (
                        <div className="w-full space-y-2">
                          <p className="text-foreground px-1">{msg.text}</p>
                          <FlashcardViewer flashcards={msg.flashcards} />
                        </div>
                      )}

                      {/* Quiz Messages */}
                      {msg.role === 'quiz' && msg.quizData && (
                        <div className="w-full space-y-2">
                          <p className="text-foreground px-1">{msg.text}</p>
                          <QuizViewer questions={msg.quizData} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Read-only footer — no input, matches bottom bar height/style */}
        <div className="border-t border-border p-4 flex-shrink-0 bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4 text-blue-500/50 flex-shrink-0" />
            <span>Read-only view — messages cannot be edited or continued here.</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('chatbot')}
                className="text-blue-400 hover:text-blue-500 underline underline-offset-2 transition-colors whitespace-nowrap ml-1"
              >
                Go to workspace →
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
