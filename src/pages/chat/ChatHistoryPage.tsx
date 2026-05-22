import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import {
  BadgeQuestionMark,
  BookOpenCheck,
  FileText,
  Cpu,
  Leaf,
  Calendar,
  Sparkles,
  ChevronRight,
  Home,
  MessageCircle,
  Check,
  X,
  UserRound,
} from 'lucide-react';
import { Button } from '../../components/ui/button';

import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { BACKEND_ROUTES, buildBackendUrl } from '../../config/backend';
import { getAuthHeaders } from '../../utils/backendClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatIcon = 'ai' | 'tool' | 'doc' | 'code';

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
  attachmentName?: string;
  backendMessageId?: number;
  chips?: ChatChipType['type'][];
  flashcards?: Flashcard[];
  quizData?: QuizQuestion[];
  artifactId?: number;
  artifactTitle?: string;
  artifactTopic?: string;
  artifactCount?: number;
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

const CHAT_HISTORY_FLASHCARDS_KEY = 'focusspark-chat-history-flashcards';
const CHAT_HISTORY_QUIZ_KEY = 'focusspark-chat-history-quiz';

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

const getAttachmentNameFromText = (text: string) => {
  const attachmentMatch = text.match(/(?:^|\n)\s*Attached:\s*(.+?)\s*(?:\n|$)/i);
  return attachmentMatch?.[1]?.trim() || '';
};

const getDisplayUserText = (text: string) => {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const plainLines = lines.filter(
    (line) => !/^Attached:\s*/i.test(line) && !/^(AI|USER):\s*/i.test(line),
  );

  if (plainLines.length > 0) {
    return plainLines.join('\n');
  }

  const userLines = lines
    .filter((line) => /^USER:\s*/i.test(line))
    .map((line) => line.replace(/^USER:\s*/i, '').trim())
    .filter(Boolean);

  return userLines.at(-1) ?? '';
};

const ICON_MAP: Record<ChatIcon, { Icon: React.ElementType; colorClass: string }> = {
  ai: { Icon: MessageCircle, colorClass: 'bg-blue-500/10 text-blue-500' },
  tool: { Icon: Leaf, colorClass: 'bg-teal-500/15 text-teal-400' },
  doc: { Icon: FileText, colorClass: 'bg-blue-500/15 text-blue-400' },
  code: { Icon: Cpu, colorClass: 'bg-amber-500/15 text-amber-400' },
};

// ─── Gradient — exact copy from ChatbotWorkspace ──────────────────────────────

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

function GeneratedArtifactCard({
  kind,
  title,
  description,
  count,
  time,
  onOpen,
}: {
  kind: 'flashcard' | 'quiz';
  title: string;
  description: string;
  count?: number;
  time: string;
  onOpen: () => void;
}) {
  const isQuiz = kind === 'quiz';
  const artifactLabel = isQuiz ? 'Quiz' : 'Flashcard deck';
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedDescription = description.trim().toLowerCase();
  const subtitle =
    !description.trim() || normalizedDescription === normalizedTitle
      ? `${artifactLabel} generated from this chat`
      : `${artifactLabel} • ${description}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[22px] border border-slate-200 bg-white px-8 py-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-[#1C1F2A]"
    >
      <div className="flex min-h-[48px] items-center gap-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isQuiz ? 'bg-teal-100 text-teal-500' : 'bg-blue-100 text-blue-500'
          }`}
        >
          {isQuiz ? <BadgeQuestionMark className="h-4 w-4" /> : <BookOpenCheck className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">{title}</p>
            {typeof count === 'number' && (
              <Badge className="shrink-0 rounded-md bg-slate-600 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-slate-600">
                {count} {isQuiz ? 'questions' : 'cards'}
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-sm leading-snug text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className="hidden w-20 shrink-0 text-right text-sm text-slate-400 sm:block">{time}</span>
        <ChevronRight className="h-6 w-6 shrink-0 text-slate-500" />
      </div>
    </button>
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const normalizeRole = (value: unknown, rawMessage?: Record<string, unknown>): ChatMessage['role'] => {
    const role = String(
      value ??
        rawMessage?.sender ??
        rawMessage?.author ??
        rawMessage?.from ??
        rawMessage?.type ??
        '',
    ).toLowerCase();

    if (role === 'assistant' || role === 'bot' || role === 'tutor' || role === 'ai') return 'ai';
    if (role === 'human' || role === 'student' || role === 'user') return 'user';
    if (role === 'flashcard' || role === 'quiz' || role === 'system') return role;
    if (rawMessage?.is_user === true || rawMessage?.isUser === true) return 'user';
    if (rawMessage?.is_ai === true || rawMessage?.isAi === true) return 'ai';
    return 'ai';
  };

  const getRawText = (rawMessage: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = rawMessage[key];
      if (typeof value === 'string' && value.trim()) {
        return stripTutorPromptWrapper(value);
      }
    }

    return '';
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
    const payloadArray = Array.isArray(payload) ? payload : undefined;
    const payloadObject = !Array.isArray(payload) ? payload : undefined;
    const nestedData = payloadObject && typeof payloadObject.data === 'object' && payloadObject.data !== null
      ? (payloadObject.data as Record<string, unknown>)
      : undefined;
    const nestedArtifact = payloadObject && typeof payloadObject.artifact === 'object' && payloadObject.artifact !== null
      ? (payloadObject.artifact as Record<string, unknown>)
      : undefined;
    const artifactItems = Array.isArray(payloadObject?.artifacts)
      ? (payloadObject.artifacts as Record<string, unknown>[])
      : [];
    const getArtifactFlashcards = (artifact: Record<string, unknown>) => {
      if (Array.isArray(artifact.flashcards)) return artifact.flashcards as Record<string, unknown>[];
      if (Array.isArray(artifact.cards)) return artifact.cards as Record<string, unknown>[];
      if (typeof artifact.data === 'object' && artifact.data !== null) {
        const data = artifact.data as Record<string, unknown>;
        if (Array.isArray(data.flashcards)) return data.flashcards as Record<string, unknown>[];
        if (Array.isArray(data.cards)) return data.cards as Record<string, unknown>[];
      }
      if (typeof artifact.payload === 'object' && artifact.payload !== null) {
        const payloadData = artifact.payload as Record<string, unknown>;
        if (Array.isArray(payloadData.flashcards)) return payloadData.flashcards as Record<string, unknown>[];
        if (Array.isArray(payloadData.cards)) return payloadData.cards as Record<string, unknown>[];
      }
      return [];
    };
    const artifactFlashcards = artifactItems.flatMap((artifact) => {
      return getArtifactFlashcards(artifact);
    });
    const arrayArtifactFlashcards = payloadArray?.flatMap((artifact) => getArtifactFlashcards(artifact)) ?? [];
    const source = payloadArray
      ? (arrayArtifactFlashcards.length > 0 ? arrayArtifactFlashcards : payloadArray)
      : Array.isArray(payloadObject?.flashcards)
        ? (payloadObject.flashcards as Record<string, unknown>[])
        : Array.isArray(payloadObject?.cards)
          ? (payloadObject.cards as Record<string, unknown>[])
        : Array.isArray(nestedData?.flashcards)
          ? (nestedData.flashcards as Record<string, unknown>[])
          : Array.isArray(nestedData?.cards)
            ? (nestedData.cards as Record<string, unknown>[])
            : Array.isArray(nestedArtifact?.flashcards)
              ? (nestedArtifact.flashcards as Record<string, unknown>[])
              : Array.isArray(nestedArtifact?.cards)
                ? (nestedArtifact.cards as Record<string, unknown>[])
                : artifactFlashcards.length > 0
                  ? artifactFlashcards
                  : payloadObject &&
                      (payloadObject.front || payloadObject.question) &&
                      (payloadObject.back || payloadObject.answer)
                    ? [payloadObject]
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
    const payloadArray = Array.isArray(payload) ? payload : undefined;
    const payloadObject = !Array.isArray(payload) ? payload : undefined;
    const artifactItems = Array.isArray(payloadObject?.artifacts)
      ? (payloadObject.artifacts as Record<string, unknown>[])
      : [];
    const getArtifactQuestions = (artifact: Record<string, unknown>) => {
      if (Array.isArray(artifact.questions)) return artifact.questions as Record<string, unknown>[];
      if (Array.isArray(artifact.quizData)) return artifact.quizData as Record<string, unknown>[];
      if (typeof artifact.data === 'object' && artifact.data !== null) {
        const data = artifact.data as Record<string, unknown>;
        if (Array.isArray(data.questions)) return data.questions as Record<string, unknown>[];
        if (Array.isArray(data.quizData)) return data.quizData as Record<string, unknown>[];
      }
      if (typeof artifact.payload === 'object' && artifact.payload !== null) {
        const payloadData = artifact.payload as Record<string, unknown>;
        if (Array.isArray(payloadData.questions)) return payloadData.questions as Record<string, unknown>[];
        if (Array.isArray(payloadData.quizData)) return payloadData.quizData as Record<string, unknown>[];
      }
      return [];
    };
    const artifactQuestions = artifactItems.flatMap((artifact) => getArtifactQuestions(artifact));
    const arrayArtifactQuestions = payloadArray?.flatMap((artifact) => getArtifactQuestions(artifact)) ?? [];
    const source = payloadArray
      ? (arrayArtifactQuestions.length > 0 ? arrayArtifactQuestions : payloadArray)
      : Array.isArray(payloadObject?.questions)
        ? (payloadObject.questions as Record<string, unknown>[])
        : Array.isArray(payloadObject?.quizData)
          ? (payloadObject.quizData as Record<string, unknown>[])
        : Array.isArray((payload as Record<string, any> | undefined)?.data?.questions)
            ? ((payload as Record<string, any>)?.data?.questions as Record<string, unknown>[])
          : Array.isArray((payload as Record<string, any> | undefined)?.data?.quizData)
            ? ((payload as Record<string, any>)?.data?.quizData as Record<string, unknown>[])
            : artifactQuestions.length > 0
              ? artifactQuestions
              : payloadObject && payloadObject.question && (payloadObject.options || payloadObject.choices)
                ? [payloadObject]
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

  const extractArtifactItems = (value: unknown): Record<string, unknown>[] => {
    const payload = value as Record<string, unknown> | Record<string, unknown>[] | undefined;
    if (Array.isArray(payload)) return payload;

    const candidates = [
      payload?.artifacts,
      payload?.data,
      (payload?.data as Record<string, unknown> | undefined)?.artifacts,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
    }

    return payload ? [payload] : [];
  };

  const getArtifactTitle = (
    artifact: Record<string, unknown>,
    fallback: string,
    firstItemText?: string,
  ) => {
    const stripArtifactSuffix = (value: unknown) => {
      const text = String(value ?? '').trim();
      return text.replace(/\s+(flashcards|quiz)$/i, '').trim() || text;
    };
    const title = stripArtifactSuffix(artifact.title ?? artifact.name);
    const topic = String(artifact.topic ?? artifact.subject ?? '').trim();
    const isGenericArtifactLabel = (value: string) =>
      ['', 'chat flashcards', 'chat quiz', 'flashcards', 'quiz', 'focusspark ai tutor', 'ai tutor'].includes(
        value.trim().toLowerCase(),
      );

    if (title && !isGenericArtifactLabel(title)) {
      return title;
    }

    if (topic && !isGenericArtifactLabel(topic)) return topic;
    if (firstItemText) return firstItemText;
    return fallback;
  };

  const createArtifactMessages = (
    artifactPayload: unknown,
    messageId: string,
    time: string,
    directFlashcardsLength = 0,
    directQuizLength = 0,
  ): ChatMessage[] => {
    const messages: ChatMessage[] = [];

    extractArtifactItems(artifactPayload).forEach((artifact, index) => {
      const artifactType = String(
        artifact.artifact_type ?? artifact.type ?? artifact.kind ?? '',
      ).toLowerCase();
      const artifactId = Number(
        artifact.artifact_id ?? artifact.deck_id ?? artifact.quiz_id ?? artifact.id,
      );
      const rawTopic = String(artifact.topic ?? artifact.subject ?? '').trim();

      if (artifactType === 'deck' || artifactType === 'flashcard' || artifactType === 'flashcards') {
        if (directFlashcardsLength > 0) return;

        const flashcards = mapFlashcards(artifact);
        const count = Number(artifact.total_cards ?? artifact.card_count ?? flashcards.length);
        const title = getArtifactTitle(artifact, 'Chat Flashcards', flashcards[0]?.front);
        const topic = title === rawTopic ? rawTopic : '';

        messages.push({
          id: `${messageId}-flashcards-${artifactId || index}`,
          role: 'flashcard',
          text: topic || title || 'Flashcards generated from this chat.',
          time,
          flashcards,
          artifactId: Number.isFinite(artifactId) ? artifactId : undefined,
          artifactTitle: title,
          artifactTopic: topic || undefined,
          artifactCount: Number.isFinite(count) ? count : flashcards.length,
        });
      }

      if (artifactType === 'quiz') {
        if (directQuizLength > 0) return;

        const quizData = mapQuizQuestions(artifact);
        const count = Number(artifact.total_questions ?? artifact.question_count ?? quizData.length);
        const title = getArtifactTitle(artifact, 'Chat Quiz', quizData[0]?.question);
        const topic = title === rawTopic ? rawTopic : '';

        messages.push({
          id: `${messageId}-quiz-${artifactId || index}`,
          role: 'quiz',
          text: topic || title || 'Quiz generated from this chat.',
          time,
          quizData,
          artifactId: Number.isFinite(artifactId) ? artifactId : undefined,
          artifactTitle: title,
          artifactTopic: topic || undefined,
          artifactCount: Number.isFinite(count) ? count : quizData.length,
        });
      }
    });

    return messages;
  };

  const truncateThreadText = (text: string, maxLength = 40) => (
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  );

  const getFirstUserThreadText = (thread: Record<string, unknown>, messages: ChatMessage[]) => {
    const firstUserMessage = stripTutorPromptWrapper(messages.find((message) => message.role === 'user')?.text ?? '');
    if (firstUserMessage) return firstUserMessage;

    return getRawText(thread, [
      'first_user_message',
      'firstUserMessage',
      'first_question',
      'firstQuestion',
      'user_message',
      'userMessage',
      'question',
      'prompt',
      'input',
      'last_user_message',
      'lastUserMessage',
      'uploaded_file',
      'uploadedFile',
      'file_name',
      'fileName',
      'document_name',
      'documentName',
    ]);
  };

  const getThreadPreviewText = (thread: Record<string, unknown>, messages: ChatMessage[]) => {
    const userThreadText = getFirstUserThreadText(thread, messages);
    if (userThreadText) return userThreadText;

    const preview = String(thread.preview ?? thread.summary ?? '').trim();
    if (preview && preview.toLowerCase() !== 'focusspark ai tutor') {
      return preview;
    }

    const title = String(thread.name ?? thread.title ?? thread.subject ?? '').trim();
    if (title && title.toLowerCase() !== 'focusspark ai tutor') {
      return title;
    }

    return '';
  };

  const withThreadContextMessage = (thread: Record<string, unknown>, messages: ChatMessage[], threadId: string) => {
    if (messages.some((message) => message.role === 'user')) {
      return messages;
    }

    const userThreadText = getFirstUserThreadText(thread, messages);
    if (!userThreadText) {
      return messages;
    }

    return [
      {
        id: `${threadId}-thread-context`,
        role: 'user' as const,
        text: userThreadText,
        time: '',
      },
      ...messages,
    ];
  };

  const resolveThreadDisplayName = (thread: Record<string, unknown>, messages: ChatMessage[], index: number) => {
    const fallbackName = `Chat ${index + 1}`;
    const userThreadText = getFirstUserThreadText(thread, messages);
    if (userThreadText) {
      return truncateThreadText(userThreadText);
    }

    const title = String(thread.name ?? thread.title ?? thread.subject ?? '').trim();
    if (title && title.toLowerCase() !== 'focusspark ai tutor') {
      return title;
    }

    const preview = String(thread.preview ?? thread.summary ?? '').trim();
    if (preview && preview.toLowerCase() !== 'focusspark ai tutor') {
      return truncateThreadText(preview);
    }

    return fallbackName;
  };

  const extractThreadList = (payload: any): Record<string, unknown>[] => {
    if (Array.isArray(payload)) {
      return payload as Record<string, unknown>[];
    }

    const candidates = [
      payload?.results,
      payload?.threads,
      payload?.chats,
      payload?.items,
      payload?.data,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as Record<string, unknown>[];
      }
    }

    if (payload?.data && typeof payload.data === 'object') {
      return extractThreadList(payload.data);
    }

    return [];
  };

  const normalizeThreadMessages = async (threadId: string, backendMessages: unknown[], authHeaders: Record<string, string | undefined>) => {
    const normalizedMessages: ChatMessage[] = [];

    for (let messageIndex = 0; messageIndex < backendMessages.length; messageIndex += 1) {
      const rawMessage = (backendMessages[messageIndex] ?? {}) as Record<string, unknown>;
      const messageId = String(rawMessage.id ?? rawMessage.message_id ?? `${threadId}-${messageIndex}`);
      const userText = getRawText(rawMessage, ['user_message', 'userMessage', 'prompt', 'question', 'input']);
      const aiText = getRawText(rawMessage, ['ai_response', 'aiResponse', 'response', 'answer', 'output']);
      const messageText = getRawText(rawMessage, ['text', 'content', 'message']);
      const time = formatTimeLabel(rawMessage.created_at ?? rawMessage.timestamp, '');
      const chips = Array.isArray(rawMessage.chips)
        ? rawMessage.chips.filter((chip): chip is 'flashcard' | 'quiz' => chip === 'flashcard' || chip === 'quiz')
        : [];

      if (messageText && aiText && !rawMessage.role) {
        normalizedMessages.push({
          id: `${messageId}-user`,
          role: 'user',
          text: messageText,
          time,
          backendMessageId: Number.isFinite(Number.parseInt(messageId, 10)) ? Number.parseInt(messageId, 10) : undefined,
        });

        normalizedMessages.push({
          id: `${messageId}-ai`,
          role: 'ai',
          text: aiText,
          time,
          backendMessageId: Number.isFinite(Number.parseInt(messageId, 10)) ? Number.parseInt(messageId, 10) : undefined,
          chips: chips.length > 0 ? chips : undefined,
        });
      } else if (userText && aiText && !rawMessage.role) {
        normalizedMessages.push({
          id: `${messageId}-user`,
          role: 'user',
          text: userText,
          time,
          backendMessageId: Number.isFinite(Number.parseInt(messageId, 10)) ? Number.parseInt(messageId, 10) : undefined,
        });

        normalizedMessages.push({
          id: `${messageId}-ai`,
          role: 'ai',
          text: aiText,
          time,
          backendMessageId: Number.isFinite(Number.parseInt(messageId, 10)) ? Number.parseInt(messageId, 10) : undefined,
          chips: chips.length > 0 ? chips : undefined,
        });
      } else {
        const role = normalizeRole(rawMessage.role, rawMessage);
        const text = messageText || userText || aiText;

        if (text) {
          normalizedMessages.push({
            id: messageId,
            role,
            text,
            time,
            backendMessageId: Number.isFinite(Number.parseInt(messageId, 10)) ? Number.parseInt(messageId, 10) : undefined,
            chips: chips.length > 0 ? chips : undefined,
          });
        }
      }

      const rawMessageData = typeof rawMessage.data === 'object' && rawMessage.data !== null
        ? (rawMessage.data as Record<string, unknown>)
        : undefined;
      const rawKind = String(rawMessage.role ?? rawMessage.type ?? rawMessage.kind ?? '').toLowerCase();
      const hasDirectFlashcardPayload =
        rawKind.includes('flashcard') ||
        Array.isArray(rawMessage.flashcards) ||
        Array.isArray(rawMessage.cards) ||
        Array.isArray(rawMessageData?.flashcards) ||
        Array.isArray(rawMessageData?.cards) ||
        Boolean(rawMessage.artifact) ||
        Array.isArray(rawMessage.artifacts);
      const hasDirectQuizPayload =
        rawKind.includes('quiz') ||
        Array.isArray(rawMessage.questions) ||
        Array.isArray(rawMessage.quizData) ||
        Array.isArray(rawMessageData?.questions) ||
        Array.isArray(rawMessageData?.quizData) ||
        Boolean(rawMessage.artifact) ||
        Array.isArray(rawMessage.artifacts);
      const directFlashcards = hasDirectFlashcardPayload ? mapFlashcards(rawMessage) : [];
      const directQuizData = hasDirectQuizPayload ? mapQuizQuestions(rawMessage) : [];

      if (directFlashcards.length > 0) {
        normalizedMessages.push({
          id: `${messageId}-flashcards-direct`,
          role: 'flashcard',
          text: 'Generated flashcards from this chat.',
          time,
          flashcards: directFlashcards,
        });
      }

      if (directQuizData.length > 0) {
        normalizedMessages.push({
          id: `${messageId}-quiz-direct`,
          role: 'quiz',
          text: 'Generated quiz from this chat.',
          time,
          quizData: directQuizData,
        });
      }

      try {
        const numericMessageId = Number.parseInt(messageId, 10);
        if (!Number.isFinite(numericMessageId)) continue;

        const artifactRoute = BACKEND_ROUTES.chatMessageArtifacts.replace('{message_id}', String(numericMessageId));
        const artifactResponse = await axios.get(buildBackendUrl(artifactRoute), {
          headers: authHeaders,
        });
        const artifactPayload = artifactResponse.data?.data ?? artifactResponse.data;
        normalizedMessages.push(
          ...createArtifactMessages(
            artifactPayload,
            messageId,
            time,
            directFlashcards.length,
            directQuizData.length,
          ),
        );
      } catch {
        // Ignore missing artifacts for messages that do not generate them.
      }
    }

    return normalizedMessages;
  };

  const getThreadArtifactMessages = (thread: Record<string, unknown>, threadId: string, time: string): ChatMessage[] => {
    const data = typeof thread.data === 'object' && thread.data !== null
      ? (thread.data as Record<string, unknown>)
      : undefined;
    const hasFlashcards =
      Array.isArray(thread.flashcards) ||
      Array.isArray(thread.cards) ||
      Array.isArray(data?.flashcards) ||
      Array.isArray(data?.cards) ||
      Boolean(thread.artifact) ||
      Array.isArray(thread.artifacts);
    const hasQuiz =
      Array.isArray(thread.questions) ||
      Array.isArray(thread.quizData) ||
      Array.isArray(data?.questions) ||
      Array.isArray(data?.quizData) ||
      Boolean(thread.artifact) ||
      Array.isArray(thread.artifacts);
    const flashcards = hasFlashcards ? mapFlashcards(thread) : [];
    const quizData = hasQuiz ? mapQuizQuestions(thread) : [];
    const artifactMessages: ChatMessage[] = [];

    if (flashcards.length > 0) {
      artifactMessages.push({
        id: `${threadId}-thread-flashcards`,
        role: 'flashcard',
        text: 'Generated flashcards from this chat.',
        time,
        flashcards,
      });
    }

    if (quizData.length > 0) {
      artifactMessages.push({
        id: `${threadId}-thread-quiz`,
        role: 'quiz',
        text: 'Generated quiz from this chat.',
        time,
        quizData,
      });
    }

    return artifactMessages;
  };

  const normalizeThread = async (thread: Record<string, unknown>, index: number, authHeaders: Record<string, string | undefined>): Promise<Chat> => {
    const threadId = String(thread.id ?? thread.thread_id ?? thread.chat_id ?? index + 1);
    const rawMessages = Array.isArray(thread.messages)
      ? thread.messages
      : Array.isArray((thread as Record<string, any>).data?.messages)
        ? ((thread as Record<string, any>).data?.messages as unknown[])
        : [];
    const timeSource = thread.updated_at ?? thread.created_at ?? thread.last_message_at ?? thread.timestamp;
    const time = formatTimeLabel(timeSource, 'Recently');
    const normalizedMessages = await normalizeThreadMessages(threadId, rawMessages, authHeaders);
    const messages = withThreadContextMessage(
      thread,
      [...normalizedMessages, ...getThreadArtifactMessages(thread, threadId, time)],
      threadId,
    );
    const previewSource = getThreadPreviewText(thread, messages) || 'Open chat history';

    return {
      id: threadId,
      name: resolveThreadDisplayName(thread, messages, index),
      preview: previewSource,
      time,
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

      const threadObject = (Array.isArray(threadPayload) ? {} : (threadPayload as Record<string, unknown>)) as Record<string, unknown>;
      const timeSource = threadObject.updated_at ?? threadObject.created_at ?? threadObject.last_message_at ?? threadObject.timestamp;
      const time = formatTimeLabel(timeSource, 'Recently');
      const normalizedMessages = await normalizeThreadMessages(threadId, rawMessages as unknown[], authHeaders);
      const messages = withThreadContextMessage(
        threadObject,
        [...normalizedMessages, ...getThreadArtifactMessages(threadObject, threadId, time)],
        threadId,
      );
      const displayName = resolveThreadDisplayName(threadObject, messages, index);
      const previewSource = getThreadPreviewText(threadObject, messages) || 'Open chat history';

      return {
        id: threadId,
        name: displayName,
        preview: previewSource,
        time,
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
        const rawThreads = extractThreadList(response.data);

        const normalizedChats = await Promise.all(
          rawThreads.map(async (thread: Record<string, unknown>, index: number) => {
            const normalizedThread = await normalizeThread(thread, index, authHeaders);
            const hasFallbackTitle = normalizedThread.name === `Chat ${index + 1}`;

            if (hasFallbackTitle || normalizedThread.preview === 'Open chat history') {
              const detailedThread = await fetchAndNormalizeThread(normalizedThread.id, index, authHeaders);
              if (detailedThread) {
                return {
                  ...normalizedThread,
                  name: detailedThread.name,
                  preview: detailedThread.messages.find((message) => message.role === 'user')?.text ?? detailedThread.preview,
                  time: detailedThread.time,
                  icon: detailedThread.icon,
                  section: detailedThread.section,
                  messages: [],
                };
              }
            }

            return {
              ...normalizedThread,
              messages: [],
            };
          }),
        );

        if (cancelled) return;

        setChats(normalizedChats);
        setActiveId((current) => (current && normalizedChats.some((chat) => chat.id === current) ? current : null));
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

  const activeChat = chats.find((c) => c.id === activeId) ?? null;

  const sections = ['Today', 'Yesterday', 'Earlier'] as const;
  const grouped = sections.reduce<Record<string, Chat[]>>((acc, s) => {
    acc[s] = chats.filter((c) => c.section === s);
    return acc;
  }, {});


  const handleSelectChat = async (chat: Chat) => {
    setActiveId(chat.id);
    setSelectedLoading(true);

    try {
      const authHeaders = await getAuthHeaders();

      const detailedChat = await fetchAndNormalizeThread(chat.id, Number.parseInt(chat.id, 10), authHeaders);
      if (detailedChat) {
        setChats((prev) => prev.map((item) => (item.id === chat.id ? detailedChat : item)));
      }
    } catch {
      // Keep the selected chat usable even if the detail request fails.
    } finally {
      setSelectedLoading(false);
    }
  };

  const openGeneratedFlashcards = (message: ChatMessage) => {
    if (!message.artifactId && !message.flashcards?.length) return;

    sessionStorage.setItem(
      CHAT_HISTORY_FLASHCARDS_KEY,
      JSON.stringify({
        id: message.artifactId ?? message.id,
        deckId: message.artifactId,
        title: message.artifactTitle || message.artifactTopic || 'Chat Flashcards',
        topic: message.artifactTopic,
        description: message.text || 'Flashcards generated from this chat.',
        cards: message.flashcards ?? [],
      }),
    );
    onNavigate?.('flashcards');
  };

  const openGeneratedQuiz = (message: ChatMessage) => {
    if (!message.artifactId && !message.quizData?.length) return;

    const firstQuestion = String(message.quizData?.[0]?.question || '').trim();
    const derivedTitle = message.artifactTitle || message.artifactTopic || (firstQuestion.length > 0 ? firstQuestion : 'Quiz');

    sessionStorage.setItem(
      CHAT_HISTORY_QUIZ_KEY,
      JSON.stringify({
        id: message.artifactId ?? message.id,
        quizId: message.artifactId,
        title: derivedTitle,
        topic: message.artifactTopic,
        description: message.text || 'Quiz generated from this chat.',
        category: 'Chat',
        tags: ['chat'],
        questions: message.quizData ?? [],
      }),
    );
    onNavigate?.('quiz');
  };

  // Example: upload a document to chat/document endpoint
  // (upload handled inline in file input change handler)

  return (
    <motion.div className="h-screen flex overflow-hidden relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0B1020] dark:via-[#101827] dark:to-[#17122A]">
      {/* ── Right Sidebar ── */}
      <AnimatePresence initial={false}>
        {leftPanelOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ width: '360px', maxWidth: 'calc(100vw - 1rem)' }}
            className="fixed inset-y-0 right-0 z-30 flex flex-col border-l border-border/70 bg-white/90 p-0 shadow-xl backdrop-blur-xl dark:bg-[#10121A]/90"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Chat History</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLeftPanelOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto py-3">
              {isLoading && (
                <div className="mx-5 mt-6 rounded-2xl border border-border bg-card/70 p-5 text-center">
                  <p className="text-sm font-medium text-foreground">Loading conversations</p>
                  <p className="mt-1 text-xs text-muted-foreground">Fetching your saved AI Tutor chats...</p>
                </div>
              )}
              {!isLoading && loadError && (
                <div className="mx-5 mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center">
                  <p className="text-sm text-destructive">{loadError}</p>
                </div>
              )}
              {!isLoading && !loadError && chats.length === 0 && (
                <div className="mx-5 mt-6 rounded-2xl border border-border bg-card/70 p-5 text-center">
                  <p className="text-sm font-medium text-foreground">No chats yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Your AI Tutor conversations will appear here.</p>
                </div>
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
                        className={`mx-3 mb-2 flex items-start gap-3 rounded-2xl border px-3 py-3 cursor-pointer transition-all relative group ${
                          chat.id === activeId
                            ? 'border-blue-500/40 bg-blue-500/10 shadow-sm'
                            : 'border-border/70 hover:border-blue-500/25 hover:bg-accent/60'
                        }`}
                      >
                        <ChatIconBadge icon={chat.icon} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{chat.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-1">{chat.preview}</p>
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
      <div
        style={leftPanelOpen ? { marginRight: '360px' } : undefined}
        className="flex flex-col min-w-0 h-screen transition-[margin] duration-300 w-full"
      >

        {/* Top Bar — same structure/classes as ChatbotWorkspace */}
        <div className="border-b border-border/70 p-3 sm:p-4 flex-shrink-0 bg-white/85 dark:bg-[#10121A]/85 backdrop-blur-xl shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 md:gap-4">

            {/* Left */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {onNavigate && (
                <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')} className="hover:bg-accent">
                  <Home className="w-5 h-5" />
                </Button>
              )}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-semibold whitespace-nowrap">Chat History</h2>
                  <p className="text-xs text-muted-foreground">Select a conversation to review it</p>
                </div>
              </div>
            </div>

            {/* Center — active chat name */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2 md:px-4">
              {activeChat ? (
                <div className="flex max-w-md items-center gap-2.5 rounded-full border border-border bg-card/80 px-3 py-2">
                  <ChatIconBadge icon={activeChat.icon} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{activeChat.name}</p>
                    <p className="text-xs text-muted-foreground">{activeChat.messages.length} messages · read-only</p>
                  </div>
                </div>
              ) : (
                <div className="hidden rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground md:block">
                  No conversation selected
                </div>
              )}
            </div>

            {/* Right action */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {!leftPanelOpen && (
                <Button variant="ghost" size="icon" onClick={() => setLeftPanelOpen(true)} className="hover:bg-accent">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages — same scroll area style as ChatbotWorkspace */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-6 pr-10 chatbot-messages-scroll"
        >
          <div className="w-full space-y-6 pb-6">
            <AnimatePresence mode="wait">
              {!activeChat ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[65vh] gap-4 text-muted-foreground"
                >
                  <div className="w-24 h-24 rounded-3xl bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md border border-border flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-12 h-12 text-blue-500/50" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {isLoading ? 'Loading conversations...' : 'Choose a conversation'}
                  </p>
                  <p className="max-w-md text-center text-sm opacity-70">
                    {isLoading
                      ? 'Fetching your saved AI Tutor chats.'
                      : 'Your chats stay closed until you select one from the history list.'}
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
                  {selectedLoading && activeChat.messages.length === 0 && (
                    <div className="rounded-3xl border border-border bg-white/95 dark:bg-[#1C1F2A]/95 p-6 text-center shadow-lg">
                      <p className="text-sm font-medium text-foreground">Loading this conversation...</p>
                      <p className="mt-1 text-xs text-muted-foreground">Messages will appear here in a moment.</p>
                    </div>
                  )}

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
                      {msg.role === 'user' && (() => {
                        const displayText = getDisplayUserText(msg.text);
                        const attachmentName = msg.attachmentName ?? getAttachmentNameFromText(msg.text);

                        return (
                          <div className="max-w-2xl rounded-3xl px-5 py-4 bg-card dark:bg-gray-900/70 backdrop-blur-md border border-blue-500/30 dark:border-gray-700 shadow-lg">
                            <div className="flex flex-row-reverse items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <UserRound className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-3 text-right">
                                {displayText && (
                                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{displayText}</p>
                                )}
                                {attachmentName && (
                                  <div className="ml-auto flex max-w-full items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-left">
                                    <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />
                                    <span className="truncate text-sm font-medium text-foreground">{attachmentName}</span>
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground mt-2 block">{msg.time}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

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
                        <GeneratedArtifactCard
                          kind="flashcard"
                          title={msg.artifactTitle || msg.artifactTopic || 'Flashcards generated'}
                          description={msg.artifactTopic || 'Open these chat flashcards in the flashcard review page.'}
                          count={msg.artifactCount ?? msg.flashcards.length}
                          time={msg.time}
                          onOpen={() => openGeneratedFlashcards(msg)}
                        />
                      )}

                      {/* Quiz Messages */}
                      {msg.role === 'quiz' && msg.quizData && (
                        <GeneratedArtifactCard
                          kind="quiz"
                          title={msg.artifactTitle || msg.artifactTopic || 'Quiz generated'}
                          description={msg.artifactTopic || 'Open this generated quiz in the quiz attempt page.'}
                          count={msg.artifactCount ?? msg.quizData.length}
                          time={msg.time}
                          onOpen={() => openGeneratedQuiz(msg)}
                        />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Read-only footer — no input, matches bottom bar height/style */}
        <div className="border-t border-border/70 p-4 flex-shrink-0 bg-white/85 dark:bg-[#10121A]/85 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4 text-blue-500/50 flex-shrink-0" />
            <span>Read-only view. Open the AI Tutor workspace to continue chatting.</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
