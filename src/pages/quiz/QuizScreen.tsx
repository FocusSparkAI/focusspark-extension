import { useState, useEffect, useRef } from 'react';
import backendClient, { getAuthHeaders } from '../../utils/backendClient';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  RotateCcw,
  Eye,
  Search,
  X,
  Plus,
  Target,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_ROUTES } from '../../config/backend';
import type { Quiz, QuizQuestion } from '../../types/QuizTypes';
import {
  CHAT_HISTORY_QUIZ_KEY,
  deriveDisplayQuizTitle,
  getQuizSourceBadgeClassName,
  getQuizSourceType,
  getQuizTimeLimit,
  isGenericChatQuizTitle,
  mapQuizQuestion,
  normalizeCorrectAnswer,
  normalizeDifficulty,
  normalizeQuizTitle,
  normalizeQuizSourceType,
  parseQuizDate,
  toQuizHeadingFromQuestion,
} from '../../types/QuizTypes';

interface QuizScreenProps {
  onNavigate: (page: string) => void;
}

export function QuizScreen({ onNavigate }: QuizScreenProps) {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: any }).chrome;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [skippedAnswers, setSkippedAnswers] = useState<boolean[]>([]);
  const [reviewedQuestions, setReviewedQuestions] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [, setIsSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [showConfetti, setShowConfetti] = useState(false);
  const attemptStartedAtRef = useRef<Date | null>(null);
  const quizStrictModeRef = useRef(false);
  const focusTabIdRef = useRef<number | null>(null);

  const syncStrictModeToBackground = (enabled: boolean) => {
    if (!chromeApi?.runtime?.sendMessage) return;

    const payload = {
      enabled,
      focusTabId: focusTabIdRef.current,
    };

    chromeApi.runtime.sendMessage({ type: 'SET_STRICT_MODE', ...payload }, () => {
      // Ignore runtime errors during extension reloads.
    });
    chromeApi.runtime.sendMessage({ type: 'STRICT_MODE_CHANGED', ...payload }, () => {
      // Backward compatibility payload.
    });
  };

  const enableQuizStrictMode = () => {
    if (quizStrictModeRef.current) return;
    quizStrictModeRef.current = true;
    localStorage.setItem('focusspark-strict-mode', 'true');
    syncStrictModeToBackground(true);
    toast.warning('Quiz attempt started. Strict Mode is now ON.', {
      duration: 2500,
      position: 'top-right',
    });
  };

  const disableQuizStrictMode = () => {
    if (!quizStrictModeRef.current) return;
    quizStrictModeRef.current = false;
    localStorage.setItem('focusspark-strict-mode', 'false');
    syncStrictModeToBackground(false);
    toast.success('Quiz attempt ended. Strict Mode is now OFF.', {
      duration: 2000,
      position: 'top-right',
    });
  };

  useEffect(() => {
    if (!chromeApi?.tabs?.getCurrent) return;

    chromeApi.tabs.getCurrent((tab: { id?: number }) => {
      if (typeof tab?.id === 'number') {
        focusTabIdRef.current = tab.id;
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      disableQuizStrictMode();
    };
  }, []);

  // Quizzes loaded from backend
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<Quiz['difficulty']>('Beginner');
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  // Fetch quizzes (reusable so we can refetch after creating a quiz)
  const fetchQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await backendClient.get(BACKEND_ROUTES.quiz, { headers: authHeaders });
      const data = Array.isArray(res.data) ? res.data : [];
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[QuizScreen] fetchQuizzes response', { status: res.status, dataLength: data.length, rawData: res.data });
      }
      const mapped = data.map((q: any) => {
        const questionCount =
          q.total_questions ??
          q.question_count ??
          q.questions_count ??
          (Array.isArray(q.questions) ? q.questions.length : 0);

        return {
          id: String(q.id),
          title: deriveDisplayQuizTitle({
            rawTitle: q.title,
            fallbackTopic: q.topic ?? q.category,
            questions: q.questions,
          }),
          description: q.description || '',
          category: q.category || q.topic || 'General',
          topic: q.topic || q.category || 'General',
          sourceType:
            normalizeQuizSourceType(q.sourceType) ||
            normalizeQuizSourceType(q.source_type) ||
            normalizeQuizSourceType(q.source) ||
            normalizeQuizSourceType(q.origin) ||
            normalizeQuizSourceType(q.generated_from),
          difficulty: normalizeDifficulty(q.difficulty),
          timeLimit: q.time_limit_seconds ?? undefined,
          passingScore: q.passing_score ?? 0,
          totalAttempts: q.total_attempts ?? 0,
          questionCount,
          bestScore: q.best_score ?? 0,
          averageScore: q.average_score ?? 0,
          createdAt: parseQuizDate(q.created_at ?? q.createdAt),
          lastAttempted: parseQuizDate(q.last_attempted ?? q.lastAttempted),
          tags: Array.isArray(q.tags) ? q.tags : [],
          linkedDocument: q.linked_document_id ? String(q.linked_document_id) : undefined,
          questions: [],
        } as Quiz;
      });
      setQuizzes(mapped);
    } catch (err: any) {
      console.error('Failed to fetch quizzes', err);
      const status = err?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized — please sign in to load quizzes');
      } else {
        toast.error('Failed to load quizzes from backend');
      }
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    void fetchQuizzes();
  }, []);

  useEffect(() => {
    const rawPendingQuiz = sessionStorage.getItem(CHAT_HISTORY_QUIZ_KEY);
    if (!rawPendingQuiz) return;

    sessionStorage.removeItem(CHAT_HISTORY_QUIZ_KEY);

    try {
      const payload = JSON.parse(rawPendingQuiz) as {
        id?: string;
        quizId?: string | number;
        title?: string;
        topic?: string;
        description?: string;
        questions?: Array<{
          id?: string;
          question?: string;
          options?: string[];
          choices?: string[];
          correctAnswer?: number;
          correct_answer?: number;
          correct_answer_index?: number;
          explanation?: string;
        }>;
      };
      const pendingQuizId = payload.quizId ?? payload.id;
      if (pendingQuizId && Number.isFinite(Number(pendingQuizId))) {
        void (async () => {
          try {
            const authHeaders = await getAuthHeaders();
            const [quizzesResponse, questionsResponse] = await Promise.all([
              backendClient.get(BACKEND_ROUTES.quiz, { headers: authHeaders }),
              backendClient.get(`${BACKEND_ROUTES.quiz}/${pendingQuizId}`, { headers: authHeaders }),
            ]);
            const quizList = Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [];
            const quizMeta = quizList.find((quiz: any) => String(quiz.id) === String(pendingQuizId)) ?? {};
            const rawQuestions = Array.isArray(questionsResponse.data)
              ? questionsResponse.data
              : Array.isArray(questionsResponse.data?.questions)
                ? questionsResponse.data.questions
                : [];
            const questions = rawQuestions.map(mapQuizQuestion);

            if (questions.length === 0) {
              toast.error('This quiz has no questions yet.');
              return;
            }

            const pendingQuiz: Quiz = {
              id: String(pendingQuizId),
              title: deriveDisplayQuizTitle({
                rawTitle: payload.title ?? quizMeta.title,
                fallbackTopic: payload.topic ?? quizMeta.topic ?? quizMeta.category,
                questions,
              }),
              description: payload.description || quizMeta.description || 'Quiz generated from chat history.',
              category: quizMeta.category || payload.topic || quizMeta.topic || 'Chat',
              topic: payload.topic || quizMeta.topic || quizMeta.category || 'Chat',
              sourceType:
                normalizeQuizSourceType(quizMeta.sourceType) ||
                normalizeQuizSourceType(quizMeta.source_type) ||
                normalizeQuizSourceType(quizMeta.source) ||
                'Chat',
              difficulty: normalizeDifficulty(quizMeta.difficulty),
              questions,
              timeLimit: quizMeta.time_limit_seconds ?? undefined,
              passingScore: quizMeta.passing_score ?? 0,
              totalAttempts: quizMeta.total_attempts ?? 0,
              questionCount: questions.length,
              bestScore: quizMeta.best_score ?? 0,
              averageScore: quizMeta.average_score ?? 0,
              createdAt: parseQuizDate(quizMeta.created_at ?? quizMeta.createdAt),
              tags: Array.isArray(quizMeta.tags) ? quizMeta.tags : ['chat'],
              linkedDocument: quizMeta.linked_document_id ? String(quizMeta.linked_document_id) : undefined,
            };

            setSelectedQuiz(pendingQuiz);
            setCurrentQuestionIndex(0);
            setShowFeedback(false);
            setIsSubmitted(false);
            setShowSummary(false);
            setTimerEnabled(true);
            startAttemptTimer();
            enableQuizStrictMode();
          } catch {
            toast.error('Could not open the saved quiz from chat history.');
          }
        })();
        return;
      }

      const questions = (payload.questions ?? [])
        .map((question, index): QuizQuestion => {
          const choices = Array.isArray(question.choices)
            ? question.choices
            : Array.isArray(question.options)
              ? question.options
              : [];

          return {
            id: String(question.id ?? `chat-history-question-${index}`),
            question: String(question.question ?? ''),
            choices,
            correctAnswer: normalizeCorrectAnswer(question, choices),
            explanation: String(question.explanation ?? ''),
            topic: 'Chat',
          };
        })
        .filter((question) => question.question.length > 0 && question.choices.length > 0);

      if (questions.length === 0) return;

      const pendingQuiz: Quiz = {
        id: String(payload.id ?? `chat-history-quiz-${Date.now()}`),
        title: isGenericChatQuizTitle(payload.title)
          ? toQuizHeadingFromQuestion(questions[0]?.question)
          : String(payload.title),
        description: payload.description || 'Quiz generated from chat history.',
        category: 'Chat',
        sourceType: 'Chat',
        difficulty: 'Beginner',
        questions,
        passingScore: 0,
        totalAttempts: 0,
        questionCount: questions.length,
        bestScore: 0,
        averageScore: 0,
        createdAt: new Date(),
        tags: ['chat'],
      };

      setSelectedQuiz(pendingQuiz);
      setCurrentQuestionIndex(0);
      setShowFeedback(false);
      setIsSubmitted(false);
      setShowSummary(false);
      setTimerEnabled(true);
      startAttemptTimer();
      enableQuizStrictMode();
    } catch {
      toast.error('Could not open the generated quiz from chat history.');
    }
  }, []);
 

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Initialize selected answers array when a new quiz is selected.
  useEffect(() => {
    if (selectedQuiz) {
      setSelectedAnswers(new Array(selectedQuiz.questions.length).fill(null));
      setSkippedAnswers(new Array(selectedQuiz.questions.length).fill(false));
      setReviewedQuestions(new Array(selectedQuiz.questions.length).fill(false));
      setTimeRemaining(getQuizTimeLimit(selectedQuiz));
    }
  }, [selectedQuiz?.id]);

  // Timer
  useEffect(() => {
    if (selectedQuiz && timerEnabled && timeRemaining > 0 && !showSummary) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && timerEnabled) {
      void handleSubmitAll(true);
    }
  }, [timerEnabled, timeRemaining, showSummary, selectedQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startAttemptTimer = () => {
    attemptStartedAtRef.current = new Date();
  };

  const getAttemptStartedAt = () => {
    if (!attemptStartedAtRef.current) {
      startAttemptTimer();
    }

    return attemptStartedAtRef.current as Date;
  };

  const currentQuestion = selectedQuiz?.questions[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestionIndex];
  const hasCurrentAnswer = typeof currentAnswer === 'number';

  const isKeyboardInputTarget = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    if (!element) return false;
    return Boolean(element.closest('input, textarea, select, button, [contenteditable="true"]'));
  };

  const handleAnswerSelect = (choiceIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = choiceIndex;
    setSelectedAnswers(newAnswers);

    const newSkippedAnswers = [...skippedAnswers];
    newSkippedAnswers[currentQuestionIndex] = false;
    setSkippedAnswers(newSkippedAnswers);
  };

  const handleNext = () => {
    if (selectedQuiz && currentQuestionIndex < selectedQuiz.questions.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      setShowFeedback(reviewedQuestions[nextQuestionIndex] ?? false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const previousQuestionIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(previousQuestionIndex);
      setShowFeedback(reviewedQuestions[previousQuestionIndex] ?? false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!hasCurrentAnswer) {
      toast.error('Please select an answer first.');
      return;
    }

    setShowFeedback(true);
    const newReviewedQuestions = [...reviewedQuestions];
    newReviewedQuestions[currentQuestionIndex] = true;
    setReviewedQuestions(newReviewedQuestions);
    // Inline feedback below shows the correct answer and explanation.
    return;

    if (false) {
      toast.success('✅ Correct!');
    } else {
      toast.error('❌ Incorrect. Review the explanation.');
    }
  };

  const handleDontKnow = () => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = null;
    setSelectedAnswers(newAnswers);

    const newSkippedAnswers = [...skippedAnswers];
    newSkippedAnswers[currentQuestionIndex] = true;
    setSkippedAnswers(newSkippedAnswers);

    const newReviewedQuestions = [...reviewedQuestions];
    newReviewedQuestions[currentQuestionIndex] = true;
    setReviewedQuestions(newReviewedQuestions);
    setShowFeedback(true);
  };

  const handleSubmitAll = async (allowIncomplete = false) => {
    if (!selectedQuiz) return;

    const unansweredCount = selectedQuiz.questions.filter(
      (_, index) =>
        typeof selectedAnswers[index] !== 'number' &&
        !skippedAnswers[index] &&
        !reviewedQuestions[index]
    ).length;

    if (!allowIncomplete && unansweredCount > 0) {
      toast.error(`Please answer or choose "I don't know" for ${unansweredCount} question${unansweredCount === 1 ? '' : 's'}.`);
      return;
    }

    setIsSubmitted(true);
    setShowSummary(true);
    disableQuizStrictMode();

    const correctCount = selectedQuiz.questions.filter(
      (question, index) => selectedAnswers[index] === question.correctAnswer
    ).length;

    const percentage = Math.round((correctCount / selectedQuiz.questions.length) * 100);

    try {
      const startedAt = getAttemptStartedAt();
      const completedAt = new Date();
      const authHeaders = await getAuthHeaders();
      const answersPayload = selectedQuiz.questions.map((q, i) => ({
        question_id: q.id,
        selected_answer_index: selectedAnswers[i] ?? null,
      }));

      await backendClient.post(
        BACKEND_ROUTES.quizAttempts.replace('{quiz_id}', String(selectedQuiz.id)),
        {
          answers: answersPayload,
          started_at: startedAt.toISOString(),
          completed_at: completedAt.toISOString(),
          time_taken_seconds: Math.max(0, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)),
        },
        { headers: authHeaders }
      );

      const updateQuizStats = (quiz: Quiz): Quiz => {
        const nextAttempts = quiz.totalAttempts + 1;
        return {
          ...quiz,
          totalAttempts: nextAttempts,
          bestScore: Math.max(quiz.bestScore, percentage),
          averageScore: Math.round(((quiz.averageScore * quiz.totalAttempts) + percentage) / nextAttempts),
          lastAttempted: completedAt,
        };
      };

      setSelectedQuiz((currentQuiz) =>
        currentQuiz?.id === selectedQuiz.id ? updateQuizStats(currentQuiz) : currentQuiz
      );
      setQuizzes((currentQuizzes) =>
        currentQuizzes.map((quiz) => (quiz.id === selectedQuiz.id ? updateQuizStats(quiz) : quiz))
      );
    } catch (e) {
      // Keep the result summary local if the backend is unavailable.
    }

    if (percentage >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  useEffect(() => {
    if (!selectedQuiz || showSummary || showCreateDialog) return;

    const handleQuizKeyDown = (event: KeyboardEvent) => {
      if (isKeyboardInputTarget(event.target)) return;

      const numericChoice = Number(event.key);
      if (
        Number.isInteger(numericChoice) &&
        numericChoice >= 1 &&
        currentQuestion &&
        numericChoice <= currentQuestion.choices.length &&
        !showFeedback
      ) {
        event.preventDefault();
        handleAnswerSelect(numericChoice - 1);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (!showFeedback) {
          handleSubmitAnswer();
        } else if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
          handleNext();
        } else {
          void handleSubmitAll();
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
        return;
      }

      if (event.key === 'ArrowRight' && showFeedback) {
        event.preventDefault();
        if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleQuizKeyDown);
    return () => window.removeEventListener('keydown', handleQuizKeyDown);
  }, [
    currentAnswer,
    currentQuestion,
    currentQuestionIndex,
    selectedQuiz,
    showCreateDialog,
    showFeedback,
    showSummary,
    selectedAnswers,
    skippedAnswers,
    reviewedQuestions,
  ]);

  const correctCount = selectedQuiz
    ? selectedQuiz.questions.filter(
        (question, index) => selectedAnswers[index] === question.correctAnswer
      ).length
    : 0;

  const percentage = selectedQuiz
    ? Math.round((correctCount / selectedQuiz.questions.length) * 100)
    : 0;

  const handleRetry = () => {
    if (!selectedQuiz) return;
    setSelectedAnswers(new Array(selectedQuiz.questions.length).fill(null));
    setSkippedAnswers(new Array(selectedQuiz.questions.length).fill(false));
    setReviewedQuestions(new Array(selectedQuiz.questions.length).fill(false));
    setCurrentQuestionIndex(0);
    setShowFeedback(false);
    setIsSubmitted(false);
    setShowSummary(false);
    setTimeRemaining(getQuizTimeLimit(selectedQuiz));
    setTimerEnabled(true);
    startAttemptTimer();
    toast('Quiz reset! Good luck! 🍀');
  };

  const handleStartQuiz = (quiz: Quiz) => {
    // If this quiz doesn't include questions (list view), fetch full quiz details
    const start = async () => {
      try {
          if (!quiz.questions || quiz.questions.length === 0) {
          const authHeaders = await getAuthHeaders();
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug('[QuizScreen] fetching quiz details', `${BACKEND_ROUTES.quiz}/${quiz.id}`, { authHeaders });
          }
          const res = await backendClient.get(`${BACKEND_ROUTES.quiz}/${quiz.id}`, { headers: authHeaders });
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug('[QuizScreen] quiz details response', { status: res.status, data: res.data });
          }
          const full = res.data;
          // Backend may return an array of questions directly for /quiz/{id}
          const questionsSource = Array.isArray(full)
            ? full
            : Array.isArray(full.questions)
            ? full.questions
            : Array.isArray(full.items)
            ? full.items
            : [];

          const mappedQuestions = (questionsSource || []).map(mapQuizQuestion);

          const fullQuiz: Quiz = {
            id: String(full.id ?? quiz.id),
            title: deriveDisplayQuizTitle({
              rawTitle: full.title ?? quiz.title,
              fallbackTopic: full.topic ?? full.category ?? quiz.category,
              questions: questionsSource,
            }),
            description: full.description || quiz.description,
            category: full.category || full.topic || quiz.category,
            topic: full.topic || full.category || quiz.topic || quiz.category,
            sourceType:
              normalizeQuizSourceType(full.sourceType) ||
              normalizeQuizSourceType(full.source_type) ||
              normalizeQuizSourceType(full.source) ||
              normalizeQuizSourceType(full.origin) ||
              normalizeQuizSourceType(full.generated_from) ||
              quiz.sourceType,
            difficulty: normalizeDifficulty(full.difficulty || quiz.difficulty),
            timeLimit: full.time_limit_seconds ?? quiz.timeLimit,
            passingScore: full.passing_score ?? quiz.passingScore ?? 0,
            totalAttempts: full.total_attempts ?? quiz.totalAttempts ?? 0,
            questionCount: full.total_questions ?? full.question_count ?? quiz.questionCount ?? mappedQuestions.length,
            bestScore: full.best_score ?? quiz.bestScore ?? 0,
            averageScore: full.average_score ?? quiz.averageScore ?? 0,
            createdAt: parseQuizDate(full.created_at ?? full.createdAt) ?? quiz.createdAt,
            lastAttempted: parseQuizDate(full.last_attempted ?? full.lastAttempted) ?? quiz.lastAttempted,
            tags: Array.isArray(full.tags) ? full.tags : quiz.tags,
            linkedDocument: full.linked_document_id ? String(full.linked_document_id) : quiz.linkedDocument,
            questions: mappedQuestions,
          } as Quiz;

          if ((fullQuiz.questions?.length ?? 0) === 0) {
            // Try fallback endpoints that may expose questions separately
            try {
              const qsUrl = `${BACKEND_ROUTES.quiz}/${quiz.id}/questions`;
              const authHeaders2 = await getAuthHeaders();
              if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.debug('[QuizScreen] trying fallback questions endpoint', qsUrl, { authHeaders2 });
              }
              const qRes = await backendClient.get(qsUrl, { headers: authHeaders2 });
              const qData = Array.isArray(qRes.data) ? qRes.data : qRes.data?.questions ?? [];
              if (qData && qData.length > 0) {
                fullQuiz.questions = qData.map(mapQuizQuestion);
              } else {
                // try another common fallback
                const itemsUrl = `${BACKEND_ROUTES.quiz}/${quiz.id}/items`;
                if (import.meta.env.DEV) {
                  // eslint-disable-next-line no-console
                  console.debug('[QuizScreen] trying fallback items endpoint', itemsUrl);
                }
                const iRes = await backendClient.get(itemsUrl, { headers: authHeaders2 });
                const iData = Array.isArray(iRes.data) ? iRes.data : iRes.data?.items ?? [];
                if (iData && iData.length > 0) {
                  fullQuiz.questions = iData.map(mapQuizQuestion);
                }
              }
            } catch (fallbackErr) {
              if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.debug('[QuizScreen] fallback fetch failed', fallbackErr);
              }
            }

            if ((fullQuiz.questions?.length ?? 0) === 0) {
              toast.error('This quiz has no questions yet.');
              return;
            }
          }

          fullQuiz.questionCount = fullQuiz.questions.length;

          setSelectedQuiz(fullQuiz);
        } else {
          setSelectedQuiz(quiz);
        }

        setCurrentQuestionIndex(0);
        setShowFeedback(false);
        setIsSubmitted(false);
        setShowSummary(false);
        setTimerEnabled(true);
        startAttemptTimer();
        enableQuizStrictMode();
      } catch (err: any) {
        console.error('Failed to load quiz details', err);
        const status = err?.response?.status;
        if (status === 401) {
          toast.error('Unauthorized — please sign in to view quiz details');
        } else {
          toast.error('Failed to load quiz details');
        }
      }
    };

    void start();
  };

  const handleBackToQuizzes = () => {
    disableQuizStrictMode();
    setSelectedQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setSkippedAnswers([]);
    setReviewedQuestions([]);
    setShowFeedback(false);
    setIsSubmitted(false);
    setShowSummary(false);
    setTimerEnabled(false);
    attemptStartedAtRef.current = null;
  };

  const handleCreateQuiz = () => setShowCreateDialog(true);

  const handleSubmitCreateQuiz = async () => {
    if (!newTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    const topicLabel = normalizeQuizTitle(newTopic);
    const previousQuizIds = new Set(quizzes.map((quiz) => quiz.id));

    setIsCreatingQuiz(true);
    try {
      const authHeaders = await getAuthHeaders();
      const payload = { topic: newTopic.trim(), difficulty: newDifficulty };
      const res = await backendClient.post(BACKEND_ROUTES.quizGenerate, payload, { headers: authHeaders });
      toast.success('Quiz generation started');
      setShowCreateDialog(false);
      setNewTopic('');
      setNewDifficulty('Beginner');
      // Refetch quizzes to show newly created quiz
      await fetchQuizzes();
      // If backend returns created quiz id, optionally open it
      const createdBundle = res.data;
      const created = createdBundle?.quiz ?? createdBundle;
      const createdQuestions = Array.isArray(createdBundle?.questions) ? createdBundle.questions : created?.questions;
      if (created?.id) {
        // navigate to the newly created quiz details
        const createdQuiz: Quiz = {
          id: String(created.id),
          title: deriveDisplayQuizTitle({
            rawTitle: created.title,
            fallbackTopic: created.topic ?? created.category ?? newTopic,
              questions: createdQuestions,
          }),
          description: created.description ?? '',
          category: created.category ?? newTopic,
          topic: created.topic ?? created.category ?? newTopic,
          sourceType:
            normalizeQuizSourceType(created.sourceType) ||
            normalizeQuizSourceType(created.source_type) ||
            normalizeQuizSourceType(created.source) ||
            normalizeQuizSourceType(created.origin) ||
            normalizeQuizSourceType(created.generated_from) ||
            'Topic',
          difficulty: normalizeDifficulty(created.difficulty || newDifficulty),
          timeLimit: created.time_limit_seconds ?? undefined,
          passingScore: created.passing_score ?? 0,
          totalAttempts: created.total_attempts ?? 0,
          questionCount:
            created.total_questions ??
            created.question_count ??
            (Array.isArray(createdQuestions) ? createdQuestions.length : 0),
          bestScore: created.best_score ?? 0,
          averageScore: created.average_score ?? 0,
          createdAt: parseQuizDate(created.created_at ?? created.createdAt),
          lastAttempted: parseQuizDate(created.last_attempted ?? created.lastAttempted),
          tags: Array.isArray(created.tags) ? created.tags : [],
          linkedDocument: created.linked_document_id ? String(created.linked_document_id) : undefined,
          questions: Array.isArray(createdQuestions) ? createdQuestions.map((question: any) => mapQuizQuestion(question)) : [],
        };
        // open the created quiz
        handleStartQuiz(createdQuiz);
      }
    } catch (err: any) {
      console.error('Create quiz failed', err);
      const status = err?.response?.status;
      if (status !== 401) {
        try {
          const authHeaders = await getAuthHeaders();
          const quizzesResponse = await backendClient.get(BACKEND_ROUTES.quiz, { headers: authHeaders });
          const data = Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [];
          const refreshedQuizzes = data.map((q: any) => {
            const questionCount =
              q.total_questions ??
              q.question_count ??
              q.questions_count ??
              (Array.isArray(q.questions) ? q.questions.length : 0);

            return {
              id: String(q.id),
              title: deriveDisplayQuizTitle({
                rawTitle: q.title,
                fallbackTopic: q.topic ?? q.category,
                questions: q.questions,
              }),
              description: q.description || '',
              category: q.category || q.topic || 'General',
              topic: q.topic || q.category || 'General',
              sourceType:
                normalizeQuizSourceType(q.sourceType) ||
                normalizeQuizSourceType(q.source_type) ||
                normalizeQuizSourceType(q.source) ||
                normalizeQuizSourceType(q.origin) ||
                normalizeQuizSourceType(q.generated_from),
              difficulty: normalizeDifficulty(q.difficulty),
              timeLimit: q.time_limit_seconds ?? undefined,
              passingScore: q.passing_score ?? 0,
              totalAttempts: q.total_attempts ?? 0,
              questionCount,
              bestScore: q.best_score ?? 0,
              averageScore: q.average_score ?? 0,
              createdAt: parseQuizDate(q.created_at ?? q.createdAt),
              lastAttempted: parseQuizDate(q.last_attempted ?? q.lastAttempted),
              tags: Array.isArray(q.tags) ? q.tags : [],
              linkedDocument: q.linked_document_id ? String(q.linked_document_id) : undefined,
              questions: [],
            } as Quiz;
          });

          setQuizzes(refreshedQuizzes);

          const recoveredQuiz = refreshedQuizzes.find(
            (quiz) =>
              !previousQuizIds.has(quiz.id) &&
              (normalizeQuizTitle(quiz.title) === topicLabel || normalizeQuizTitle(quiz.topic) === topicLabel),
          );

          if (recoveredQuiz) {
            setShowCreateDialog(false);
            setNewTopic('');
            setNewDifficulty('Beginner');
            toast.success('Quiz created successfully.');
            return;
          }
        } catch {
          // Keep the original create error below when recovery cannot confirm a new quiz.
        }
      }
      if (status === 401) toast.error('Unauthorized — please sign in');
      else toast.error('Failed to create quiz');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const particles = 50;
      const colors = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

      for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti';
        particle.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -20px;
          pointer-events: none;
          z-index: 9999;
          animation: confetti-fall 3s ease-out forwards;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 3000);
      }
    }
  }, [showConfetti]);

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'quiz-difficulty-beginner';
      case 'Intermediate':
        return 'quiz-difficulty-intermediate';
      case 'Advanced':
        return 'quiz-difficulty-advanced';
      default:
        return 'quiz-difficulty-default';
    }
  };

  return (
    <div className="quiz-screen-container">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-header-content">
          <div className="quiz-header-top">
            <div className="quiz-header-left">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('dashboard')}
                className="quiz-home-btn"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="quiz-title">{selectedQuiz ? selectedQuiz.title : 'Available Quizzes'}</h1>
                </div>
                {selectedQuiz ? (
                  <p className="quiz-subtitle">{selectedQuiz.description}</p>
                ) : (
                  <p className="quiz-subtitle">Choose a quiz to test your knowledge</p>
                )}
              </div>
            </div>

            <div className="quiz-header-right">
              {!selectedQuiz && (
                <Button className="quiz-create-btn" onClick={handleCreateQuiz}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quiz
                </Button>
              )}

              {selectedQuiz && !showSummary && (
                <>
                  <Button variant="outline" size="sm" className="quiz-timer-display">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatTime(timeRemaining)}
                  </Button>
                  <Button variant="outline" onClick={handleBackToQuizzes}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quizzes
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {!selectedQuiz && (
            <div className="quiz-search-row">
              <div className="quiz-search-container">
                <Search className="quiz-search-icon" />
                <Input
                  type="text"
                  placeholder="Search quizzes by title, category, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="quiz-search-input"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="quiz-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear quiz search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="quiz-search-count">
                {isLoadingQuizzes
                  ? 'Loading quizzes'
                  : `${filteredQuizzes.length} ${filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'} found`}
              </p>
            </div>
          )}

          {/* Progress Bar - Only show when quiz is active */}
          {selectedQuiz && (
            <div className="quiz-progress-section">
              <div className="quiz-progress-info">
                <span className="quiz-progress-text">
                  Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
                </span>
                <span className="quiz-progress-percentage">
                  {Math.round(((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100)}%
                </span>
              </div>
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.3 }}>
                <Progress
                  value={((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100}
                  className="h-2"
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Create Quiz Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Quiz</DialogTitle>
            <DialogDescription>Generate a quiz from backend AI by topic and difficulty.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="newTopic">Topic</Label>
              <Input
                id="newTopic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Machine Learning"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="newDifficulty">Difficulty</Label>
              <select
                id="newDifficulty"
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as Quiz['difficulty'])}
                className="w-full mt-2 p-2 border rounded"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreatingQuiz}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCreateQuiz} disabled={isCreatingQuiz}>
                {isCreatingQuiz ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="quiz-content">
        {!selectedQuiz ? (
          /* Quiz Selection Grid */
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isLoadingQuizzes ? (
              <Card className="quiz-selection-card md:col-span-2 lg:col-span-3">
                <CardContent className="py-10 text-center">
                  <p className="quiz-stat-value">Loading quizzes...</p>
                  <p className="quiz-stat-label mt-2">Fetching your latest practice sets.</p>
                </CardContent>
              </Card>
            ) : filteredQuizzes.length === 0 ? (
              <Card className="quiz-selection-card md:col-span-2 lg:col-span-3">
                <CardContent className="py-10 text-center">
                  <p className="quiz-stat-value">
                    {searchQuery.trim() ? 'No quizzes match your search.' : 'No quizzes yet.'}
                  </p>
                  <p className="quiz-stat-label mt-2">
                    {searchQuery.trim()
                      ? 'Try a different title, category, or tag.'
                      : 'Create a quiz to start practicing.'}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={() => void fetchQuizzes()}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                className="h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="quiz-selection-card flex h-full flex-col"
                  onClick={() => handleStartQuiz(quiz)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleStartQuiz(quiz);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Start ${quiz.title} quiz`}
                >
                  <CardHeader className="min-h-[116px]">
                    <div className="quiz-selection-header">
                      <CardTitle className="quiz-selection-title">{quiz.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getQuizSourceBadgeClassName(getQuizSourceType(quiz))}>
                          {getQuizSourceType(quiz)}
                        </Badge>
                        <Badge
                          className={`quiz-difficulty-badge ${getDifficultyClass(quiz.difficulty)}`}
                        >
                          {quiz.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <p className="quiz-selection-description">{quiz.description}</p>
                    <div className="quiz-selection-tags">
                      {quiz.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="quiz-stat-item">
                        <Target className="w-4 h-4 quiz-stat-icon" />
                        <div>
                          <p className="quiz-stat-label">Questions</p>
                          <p className="quiz-stat-value">{quiz.questionCount}</p>
                        </div>
                      </div>

                      <div className="quiz-stat-item">
                        <Clock className="w-4 h-4 quiz-stat-icon" />
                        <div>
                          <p className="quiz-stat-label">Time Limit</p>
                          <p className="quiz-stat-value">
                            {`${Math.floor(getQuizTimeLimit(quiz) / 60)} min`}
                          </p>
                        </div>
                      </div>

                      <div className="quiz-stat-item">
                        <Trophy className="w-4 h-4 quiz-stat-icon" />
                        <div>
                          <p className="quiz-stat-label">Best Score</p>
                          <p className="quiz-stat-value">
                            {quiz.totalAttempts > 0 ? `${quiz.bestScore}%` : 'Not attempted'}
                          </p>
                        </div>
                      </div>

                      <div className="quiz-stat-item">
                        <RotateCcw className="w-4 h-4 quiz-stat-icon" />
                        <div>
                          <p className="quiz-stat-label">Attempts</p>
                          <p className="quiz-stat-value">{quiz.totalAttempts}</p>
                        </div>
                      </div>
                    </div>

                    {/* Performance Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="quiz-perf-label">Average Performance</span>
                        <span className="quiz-perf-value">{quiz.averageScore}%</span>
                      </div>
                      <Progress value={quiz.averageScore} className="h-2" />
                    </div>

                    {/* Additional Info */}
                    <div className="quiz-additional-info">
                      <div className="flex justify-between text-xs">
                        <span className="quiz-info-label">Passing Score:</span>
                        <span className="quiz-info-value">{quiz.passingScore}%</span>
                      </div>
                      {quiz.createdAt && (
                        <div className="flex justify-between text-xs">
                          <span className="quiz-info-label">Created:</span>
                          <span className="quiz-info-date">{quiz.createdAt.toLocaleDateString()}</span>
                        </div>
                      )}
                      {quiz.lastAttempted && (
                        <div className="flex justify-between text-xs">
                          <span className="quiz-info-label">Last Attempted:</span>
                          <span className="quiz-info-date">{quiz.lastAttempted.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {quiz.linkedDocument && (
                      <div className="quiz-linked-doc">
                        <p className="quiz-linked-doc-text">
                          <Sparkles className="w-3 h-3" />
                          Linked: {quiz.linkedDocument}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          /* Quiz Taking View */
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Question Card */}
              <Card className="quiz-question-card">
                <CardHeader>
                  <div className="quiz-question-header">
                    <CardTitle className="quiz-question-title">{currentQuestion?.question}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Choices */}
                  <RadioGroup
                    value={currentAnswer?.toString()}
                    onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuestion?.choices.map((choice, index) => {
                      const isSelected = currentAnswer === index;
                      const isCorrect = index === currentQuestion.correctAnswer;
                      const showResult = showFeedback;

                      let choiceClass = 'quiz-choice';
                      if (showResult) {
                        if (isCorrect) {
                          choiceClass += ' quiz-choice-correct';
                        } else if (isSelected && !isCorrect) {
                          choiceClass += ' quiz-choice-incorrect';
                        }
                      } else if (isSelected) {
                        choiceClass += ' quiz-choice-selected';
                      }

                      return (
                        <motion.div
                          key={index}
                          whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                          whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                        >
                          <Label htmlFor={`choice-${index}`} className={choiceClass}>
                            <RadioGroupItem
                              value={index.toString()}
                              id={`choice-${index}`}
                              disabled={showFeedback}
                            />
                            <span className="quiz-choice-text">{choice}</span>
                            {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {showResult && isSelected && !isCorrect && (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </Label>
                        </motion.div>
                      );
                    })}
                  </RadioGroup>

                  {/* Feedback */}
                  <AnimatePresence>
                    {showFeedback && currentQuestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="quiz-feedback"
                      >
                        <h3 className="quiz-feedback-title">Explanation:</h3>
                        <p className="quiz-feedback-text">{currentQuestion.explanation}</p>

                        {currentQuestion.relatedFlashcardId && (
                          <Button
                            variant="link"
                            size="sm"
                            className="quiz-flashcard-link"
                            onClick={() => {
                              toast('Opening related flashcard...');
                              onNavigate('flashcards');
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View related flashcard
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-3">
                  {!showFeedback && (
                    <>
                      <Button variant="outline" onClick={handleDontKnow}>
                        I don't know
                      </Button>
                      <Button onClick={handleSubmitAnswer} disabled={!hasCurrentAnswer}>
                        Submit Answer
                      </Button>
                    </>
                  )}

                  {showFeedback && selectedQuiz && currentQuestionIndex < selectedQuiz.questions.length - 1 && (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {showFeedback && selectedQuiz && currentQuestionIndex === selectedQuiz.questions.length - 1 && (
                    <Button onClick={() => void handleSubmitAll()} className="quiz-submit-all-btn">
                      Finish Quiz
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="quiz-summary-dialog">
          <DialogHeader>
            <DialogTitle className="quiz-summary-title">Quiz Complete! 🎉</DialogTitle>
            <DialogDescription className="quiz-summary-description">
              {selectedQuiz && percentage >= selectedQuiz.passingScore
                ? percentage >= 80
                  ? 'Crushed it! 💥 Outstanding performance!'
                  : 'Great effort! You passed! 💪'
                : 'Good try! Review the material and try again! 📚'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Score Ring */}
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="quiz-score-ring-bg"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#gradient-score)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - percentage / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="gradient-score" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="quiz-score-percentage">{percentage}%</p>
                  <p className="quiz-score-label">Score</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="quiz-stat-card">
                <CardContent className="pt-4">
                  <p className="text-2xl text-green-600 dark:text-green-400 font-bold">{correctCount}</p>
                  <p className="quiz-stat-label">Correct</p>
                </CardContent>
              </Card>

              <Card className="quiz-stat-card">
                <CardContent className="pt-4">
                  <p className="text-2xl text-red-600 dark:text-red-400 font-bold">
                    {selectedQuiz ? selectedQuiz.questions.length - correctCount : 0}
                  </p>
                  <p className="quiz-stat-label">Incorrect</p>
                </CardContent>
              </Card>

              <Card className="quiz-stat-card">
                <CardContent className="pt-4">
                  <p className="quiz-stat-total">{selectedQuiz?.questions.length || 0}</p>
                  <p className="quiz-stat-label">Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Pass/Fail Indicator */}
            {selectedQuiz && (
              <div className={`quiz-pass-indicator ${percentage >= selectedQuiz.passingScore ? 'quiz-pass' : 'quiz-fail'}`}>
                <p className="quiz-pass-text">
                  {percentage >= selectedQuiz.passingScore ? '✅ Passed' : '❌ Not Passed'}
                </p>
                <p className="quiz-pass-requirement">Required: {selectedQuiz.passingScore}%</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry} className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                onClick={handleBackToQuizzes}
                className="quiz-schedule-review-btn"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Quizzes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
