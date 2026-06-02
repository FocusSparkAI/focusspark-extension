import { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  ChevronLeft,
  GraduationCap,
  ListChecks,
  Home,
  BarChart2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast, type ExternalToast } from 'sonner';
import axios from 'axios';
import { useFocus } from '../../hooks/useFocus';
import { DynamicAttentionBar } from '../../features/focus/DynamicAttentionBar';
import { EmotionalFeedbackPopup } from '../../features/focus/EmotionalFeedbackPopup';
import { MotivationalPopup } from '../../components/shared/MotivationalPopup';
import { TimerButton } from '../../features/pomodoro/TimerButton';
import { TimerDropdown } from '../../features/pomodoro/TimerDropdown';
import { PomodoroControlPanel } from '../../features/pomodoro/PomodoroControlPanel';
import { BACKEND_ROUTES, buildBackendUrl, buildBackendWsUrl } from '../../config/backend';
import {
  chatWithAITutor,
  type AIProvider,
  fetchFlashcardsFromChat,
  fetchQuizFromChat,
  getOrCreateTutorThreadId,
  resetTutorThread,
} from '../../utils/aiClient';
import { getAccessToken, getAuthHeaders } from '../../utils/backendClient';
import { usePomodoro } from '../../hooks/usePomodoro';
import { ChatComposer } from '../../components/chat/ChatComposer';
import { ChatMessageList } from '../../components/chat/ChatMessageList';
import { ChatSidePanel } from '../../components/chat/ChatSidePanel';
import { UploadModal } from '../../components/chat/UploadModal';
import { useChatbotWorkspace } from '../../hooks/chat/useChatbotWorkspace';
import {
  AI_MODELS,
  CHAT_FLASHCARD_PROGRESS_KEY,
  CHAT_QUIZ_PROGRESS_KEY,
  createInitialMessages,
  type Flashcard,
  type Message,
  type QuizQuestion,
  type UploadedDocument,
} from '../../types/ChatTypes';

interface ChatbotWorkspaceProps {
  onNavigate?: (page: string) => void;
}

type ChromeWorkspaceApi = {
  runtime?: {
    onMessage?: {
      addListener: (listener: (message: unknown) => void) => void;
      removeListener?: (listener: (message: unknown) => void) => void;
    };
    sendMessage?: (message: unknown, callback?: () => void) => void;
  };
  tabs?: {
    getCurrent?: (callback: (tab?: { id?: number }) => void) => void;
  };
};

const createRuntimeId = () => `runtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createRuntimeDate = () => new Date();

const readStoredRecord = (key: string): Record<string, unknown> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const getArtifactNumber = (payload: Record<string, unknown>) => {
  const value = payload.id ?? payload.quiz_id ?? payload.quizId ?? payload.deck_id ?? payload.deckId ?? payload.artifact_id ?? payload.artifactId;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const getArtifactTitle = (payload: Record<string, unknown>, fallback: string) => {
  const value = payload.title ?? payload.name ?? payload.topic ?? payload.subject;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};

const getProgressKeys = (message: Pick<Message, 'artifactId' | 'artifactTitle' | 'artifactTopic' | 'content'>) => {
  return [
    message.artifactId ? `id:${message.artifactId}` : '',
    message.artifactTitle ? `title:${message.artifactTitle.trim().toLowerCase()}` : '',
    message.artifactTopic ? `title:${message.artifactTopic.trim().toLowerCase()}` : '',
    message.content ? `title:${message.content.trim().toLowerCase()}` : '',
  ].filter(Boolean);
};

export function ChatbotWorkspace({ onNavigate }: ChatbotWorkspaceProps = {}) {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeWorkspaceApi }).chrome;
  const { setIsFocused, isDetectionEnabled, setIsDetectionEnabled, focusScore: contextFocusScore, setFocusScore: setContextFocusScore, setEmotionalState } = useFocus();
  const { phase, setSessionDistractionCount } = usePomodoro();
  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    uploadModalOpen,
    setUploadModalOpen,
    fileAccept,
    setFileAccept,
    selectedModel,
    setSelectedModel,
    setCurrentThreadProvider,
    pendingFile,
    setPendingFile,
    uploadedDocs,
    setUploadedDocs,
    isProcessing,
    setIsProcessing,
    setUploadProgress,
    currentFlashcardIndex,
    setCurrentFlashcardIndex,
    revealedFlashcardIds,
    setRevealedFlashcardIds,
    quizMode,
    setQuizMode,
    currentQuizIndex,
    setCurrentQuizIndex,
    quizAnswers,
    setQuizAnswers,
    quizComplete,
    setQuizComplete,
    showWelcome,
    setShowWelcome,
    rightSidebarOpen,
    setRightSidebarOpen,
    showEmotionalFeedback,
    setShowEmotionalFeedback,
    isThreadModelLocked,
    activeModel,
    activeModelDetails,
  } = useChatbotWorkspace();

  // Pomodoro Timer States
  const [timerDropdownOpen, setTimerDropdownOpen] = useState(false);
  const [timerControlPanelOpen, setTimerControlPanelOpen] = useState(false);
  const showWorkspaceGuide = false;

  const showTopToast = useCallback((
    kind: 'success' | 'info' | 'warning' | 'error',
    message: string,
    options: ExternalToast = {},
  ) => {
    toast[kind](message, {
      position: 'top-right',
      ...options,
    });
  }, []);

  const showBottomToast = useCallback((
    kind: 'success' | 'info' | 'warning' | 'error',
    message: string,
    options: ExternalToast = {},
  ) => {
    toast[kind](message, {
      position: 'bottom-right',
      ...options,
    });
  }, []);

  const startNewThread = () => {
    resetTutorThread();
    setCurrentThreadProvider(null);
    setMessages(createInitialMessages());
    setInputValue('');
    setPendingFile(null);
    setUploadedDocs([]);
    setUploadProgress(0);
    setCurrentFlashcardIndex(0);
    setRevealedFlashcardIds(new Set());
    setQuizAnswers({});
    setQuizComplete(false);
    setCurrentQuizIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showBottomToast('success', 'Started a new AI Tutor thread.', {
      id: 'chat-new-thread',
      duration: 2500,
    });
  };

  // Full-Screen Dynamic Environment States
  const [focusState, setFocusState] = useState<'focused' | 'attention' | 'idle'>('focused');
  const [emotionState, setEmotionState] = useState<'happy' | 'tired' | 'neutral' | 'sad'>('neutral');
  const [showMotivationalPopup, setShowMotivationalPopup] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [transportMode, setTransportMode] = useState<'connecting' | 'ws' | 'http'>('connecting');
  const [focusDriftCount, setFocusDriftCount] = useState(0);
  const [preferredChatProvider, setPreferredChatProvider] = useState<AIProvider>('openai');
  const [preferredChatModel, setPreferredChatModel] = useState<string | null>(null);

  void quizMode;
  void setQuizMode;
  void currentQuizIndex;
  void setCurrentQuizIndex;
  void quizComplete;
  void setQuizComplete;

  useEffect(() => {
    resetTutorThread();
    void Promise.resolve().then(() => {
      setEmotionState('neutral');
      setEmotionalState('neutral');
      setFocusState('idle');
      setIsFocused(false);
      setContextFocusScore(50);
    });
  }, [setContextFocusScore, setEmotionalState, setIsFocused]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const cameraReadyRef = useRef(false);
  const detectInFlightRef = useRef(false);
  const warnCooldownRef = useRef(0);
  const tabSwitchWarnCooldownRef = useRef(0);
  const prevFocusedRef = useRef(true);
  const strictDistractionCountRef = useRef(0);
  const pomodoroDistractionBaseRef = useRef(0);
  const previousPomodoroPhaseRef = useRef(phase);
  const strictModeBeforePomodoroRef = useRef(false);
  const autoStrictModeActiveRef = useRef(false);
  const strictModeManualOverrideRef = useRef(false);
  const [isStrictMode, setIsStrictMode] = useState(() => {
    return localStorage.getItem('focusspark-strict-mode') === 'true';
  });
  const [distractionCount, setDistractionCount] = useState(0);
  const focusTabIdRef = useRef<number | null>(null);
  const detectionEnabledRef = useRef(isDetectionEnabled);
  const websocketUrl = buildBackendWsUrl(BACKEND_ROUTES.ws);

  useEffect(() => {
    detectionEnabledRef.current = isDetectionEnabled;
  }, [isDetectionEnabled]);

  useEffect(() => {
    if (phase === 'focus') {
      pomodoroDistractionBaseRef.current = strictDistractionCountRef.current;
    }

    if (phase === 'idle') {
      setSessionDistractionCount(0);
    }
  }, [phase, setSessionDistractionCount]);

  useEffect(() => {
    let cancelled = false;

    const loadAiDefaults = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await axios.get(buildBackendUrl(BACKEND_ROUTES.studySettings), {
          headers: authHeaders,
        });
        if (cancelled) return;

        const provider = response.data?.preferred_ai_provider;
        const model = response.data?.preferred_ai_model;
        if (typeof response.data?.focus_alerts_enabled === 'boolean') {
          setIsDetectionEnabled(response.data.focus_alerts_enabled);
        }
        if (provider === 'openai' || provider === 'gemini') {
          setPreferredChatProvider(provider);
          setSelectedModel(provider);
        }
        if (typeof model === 'string' && model.trim()) {
          setPreferredChatModel(model.trim());
        } else {
          setPreferredChatModel(null);
        }
      } catch {
        // Keep the built-in default if settings cannot be loaded.
      }
    };

    void loadAiDefaults();

    return () => {
      cancelled = true;
    };
  }, [setIsDetectionEnabled, setSelectedModel]);

  const resolveChatModel = (provider: AIProvider) => {
    return provider === preferredChatProvider ? preferredChatModel : null;
  };

  const normalizeEmotion = (value: string): 'happy' | 'tired' | 'neutral' | 'sad' => {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'happy') return 'happy';
    if (normalized === 'sad') return 'sad';
    if (normalized === 'tired') return 'tired';
    return 'neutral';
  };

  const notifyDistracted = useCallback(() => {
    const now = Date.now();
    if (now - warnCooldownRef.current < 5000) return;

    warnCooldownRef.current = now;
    setFocusDriftCount((count) => count + 1);
    showTopToast('warning', 'You are distracted. Refocus on your session.', {
      id: 'chat-focus-distracted',
      duration: 3000,
    });
  }, [showTopToast]);

  const normalizeFocused = (value: unknown): boolean | null => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return null;

    const normalized = value.trim().toLowerCase();
    if (['focused', 'focus', 'true', 'yes'].includes(normalized)) return true;
    if (['unfocused', 'distracted', 'false', 'no'].includes(normalized)) return false;
    return null;
  };

  const applyDetectionResult = useCallback((incomingEmotion: string, incomingFocused: boolean | null) => {
    if (incomingFocused === null) return;

    const mappedEmotion = normalizeEmotion(incomingEmotion || 'neutral');
    setEmotionState(mappedEmotion);
    setEmotionalState(mappedEmotion === 'happy' ? 'happy' : mappedEmotion === 'sad' ? 'sad' : mappedEmotion === 'tired' ? 'tired' : 'neutral');

    setIsFocused(incomingFocused);
    setContextFocusScore(incomingFocused ? 85 : 35);
    setFocusState(incomingFocused ? 'focused' : 'attention');

    if (prevFocusedRef.current && !incomingFocused) {
      notifyDistracted();
      setMotivationalMessage('Wake Up - Concentrate Now!');
      setShowMotivationalPopup(true);
      setTimeout(() => setShowMotivationalPopup(false), 3000);
    }

    prevFocusedRef.current = incomingFocused;
  }, [notifyDistracted, setContextFocusScore, setEmotionalState, setIsFocused]);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) return null;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg');
    } catch {
      return null;
    }
  };

  const runHttpDetection = useCallback(async (imageData: string) => {
    if (detectInFlightRef.current) return;
    detectInFlightRef.current = true;

    try {
      const authHeaders = await getAuthHeaders();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      const response = await fetch(buildBackendUrl(BACKEND_ROUTES.analyze), {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP detection failed: ${response.status}`);
      }

      const data = await response.json();
      applyDetectionResult(data?.emotion || 'neutral', normalizeFocused(data?.focused));
      if (transportMode !== 'http') {
        setTransportMode('http');
      }
    } catch {
      // Keep UI stable if backend analyze endpoint is unavailable.
    } finally {
      detectInFlightRef.current = false;
    }
  }, [applyDetectionResult, transportMode]);

  const stopCameraStream = useCallback(() => {
    cameraReadyRef.current = false;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (video) {
      video.srcObject = null;
    }
  }, []);

  const syncStrictModeToBackground = useCallback((enabled: boolean) => {
    if (!chromeApi?.runtime?.sendMessage) return;

    const payload = {
      enabled,
      focusTabId: focusTabIdRef.current,
    };

    chromeApi.runtime.sendMessage(
      { type: 'SET_STRICT_MODE', ...payload },
      () => {
        // Ignore unchecked runtime errors when extension page reloads.
      },
    );

    chromeApi.runtime.sendMessage(
      { type: 'STRICT_MODE_CHANGED', ...payload },
      () => {
        // Backward-compatible message shape used by temporary frontend flow.
      },
    );
  }, [chromeApi?.runtime]);

  const handleToggleStrictMode = () => {
    const nextMode = !isStrictMode;
    if (phase === 'focus' || phase === 'paused') {
      strictModeManualOverrideRef.current = true;
      autoStrictModeActiveRef.current = false;
    }
    setIsStrictMode(nextMode);
    localStorage.setItem('focusspark-strict-mode', String(nextMode));
    setDistractionCount(0);
    strictDistractionCountRef.current = 0;
    syncStrictModeToBackground(nextMode);

    if (nextMode) {
      showTopToast('info', 'Strict Mode ON - distractions blocked!', {
        id: 'chat-strict-mode',
        duration: 3000,
      });
      return;
    }

    showTopToast('info', 'Strict Mode OFF.', {
      id: 'chat-strict-mode',
      duration: 2500,
    });
  };

  useEffect(() => {
    if (!chromeApi?.tabs?.getCurrent) return;

    chromeApi.tabs.getCurrent((tab?: { id?: number }) => {
      if (typeof tab?.id === 'number') {
        focusTabIdRef.current = tab.id;
        // Always sync on mount so background does not keep stale strict state.
        syncStrictModeToBackground(isStrictMode);
      }
    });
  }, [chromeApi?.tabs, isStrictMode, syncStrictModeToBackground]);

  useEffect(() => {
    if (!chromeApi?.runtime?.onMessage) return;

    const listener = (message: unknown) => {
      if (!message || typeof message !== 'object') return;
      const runtimeMessage = message as { type?: string; count?: number };

      if (runtimeMessage.type === 'DISTRACTION_DETECTED') {
        if (!isStrictMode) return;

        const nextCount = Number(runtimeMessage.count || 1);
        strictDistractionCountRef.current = nextCount;
        setDistractionCount(nextCount);
        if (phase === 'focus' || phase === 'paused') {
          setSessionDistractionCount(Math.max(0, nextCount - pomodoroDistractionBaseRef.current));
        }

        showTopToast('warning', 'Tab changed detected. Please return to your study tab.', {
          id: 'chat-tab-changed',
          duration: 3500,
        });

        if (nextCount >= 3) {
          showTopToast('error', 'Distracted multiple times. Lock back in now.', {
            id: 'chat-repeated-distraction',
            duration: 4000,
          });
        }
      }

      if (runtimeMessage.type === 'DISTRACTION_TAB_CLOSED') {
        if (!isStrictMode) return;
      }

      if (runtimeMessage.type === 'STRICT_MODE_FORCED_OFF') {
        setIsStrictMode(false);
        localStorage.setItem('focusspark-strict-mode', 'false');
        showTopToast('info', 'Strict Mode was disabled because the focus tab was closed.', {
          id: 'chat-strict-mode-forced-off',
          duration: 4000,
        });
      }
    };

    chromeApi.runtime.onMessage.addListener(listener);
    return () => {
      if (chromeApi?.runtime?.onMessage?.removeListener) {
        chromeApi.runtime.onMessage.removeListener(listener);
      }
    };
  }, [chromeApi?.runtime?.onMessage, isStrictMode, phase, setSessionDistractionCount, showTopToast]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;

      const now = Date.now();
      if (now - tabSwitchWarnCooldownRef.current < 2000) return;
      tabSwitchWarnCooldownRef.current = now;

      if (isStrictMode) {
        return;
      }

      showTopToast('info', 'You switched tabs. Stay focused on your study session.', {
        id: 'chat-visibility-warning',
        duration: 2500,
      });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isStrictMode, showTopToast]);
  // Hide welcome animation after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [setShowWelcome]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const records = { ...readStoredRecord(CHAT_QUIZ_PROGRESS_KEY) };
    let changed = false;

    messages.forEach((message) => {
      if (message.type !== 'quiz' || !message.quizData?.length) return;

      const answered = message.quizData.filter((question) => typeof quizAnswers[question.id] === 'number');
      if (answered.length === 0) return;

      const correct = answered.filter((question) => quizAnswers[question.id] === question.correctAnswer).length;
      const score = Math.round((correct / message.quizData.length) * 100);
      const record = {
        totalAttempts: 1,
        answered: answered.length,
        correct,
        bestScore: score,
        averageScore: score,
        lastAttempted: new Date().toISOString(),
      };

      getProgressKeys(message).forEach((key) => {
        records[key] = record;
        changed = true;
      });
    });

    if (changed) {
      localStorage.setItem(CHAT_QUIZ_PROGRESS_KEY, JSON.stringify(records));
    }
  }, [messages, quizAnswers]);

  useEffect(() => {
    const records = { ...readStoredRecord(CHAT_FLASHCARD_PROGRESS_KEY) };
    let changed = false;

    messages.forEach((message) => {
      if (message.type !== 'flashcard' || !message.flashcards?.length) return;

      const reviewed = message.flashcards.filter((card) => card.known);
      if (reviewed.length === 0) return;

      const progress = Math.round((reviewed.length / message.flashcards.length) * 100);
      const record = {
        progress,
        accuracy: 100,
        reviewCount: reviewed.length,
        knownCardIds: reviewed.map((card) => card.id),
        lastReviewed: new Date().toISOString(),
      };

      getProgressKeys(message).forEach((key) => {
        records[key] = record;
        changed = true;
      });
    });

    if (changed) {
      localStorage.setItem(CHAT_FLASHCARD_PROGRESS_KEY, JSON.stringify(records));
    }
  }, [messages]);

  // Emotional Feedback Popup - show at camera-off start, then periodically.
  useEffect(() => {
    if (isDetectionEnabled) {
      setShowEmotionalFeedback(false);
      return;
    }

    if (!isDetectionEnabled) {
      const initialTimer = window.setTimeout(() => {
        setShowEmotionalFeedback(true);
      }, 2400);

      let repeatTimer: number | undefined;
      const scheduleNextFeedback = () => {
        const delay = 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000;
        repeatTimer = window.setTimeout(() => {
          setShowEmotionalFeedback(true);
          scheduleNextFeedback();
        }, delay);
      };

      scheduleNextFeedback();

      return () => {
        window.clearTimeout(initialTimer);
        if (repeatTimer) window.clearTimeout(repeatTimer);
      };
    }
  }, [isDetectionEnabled, setShowEmotionalFeedback]);

  // Start or stop camera when detection mode changes.
  useEffect(() => {
    if (!isDetectionEnabled) {
      stopCameraStream();
      void Promise.resolve().then(() => setTransportMode('connecting'));
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {
            // Ignore autoplay errors in extension context.
          });

          if (video.videoWidth > 0 && video.videoHeight > 0) {
            cameraReadyRef.current = true;
          }
          window.setTimeout(() => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              cameraReadyRef.current = true;
            }
          }, 500);
        };
      } catch {
        showTopToast('error', 'Camera access failed. Detection unavailable.', {
          id: 'chat-camera-access-failed',
          duration: 3000,
        });
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [isDetectionEnabled, showTopToast, stopCameraStream]);

  // Prefer WebSocket transport and fall back to HTTP if socket fails.
  useEffect(() => {
    if (!isDetectionEnabled) return;

    void Promise.resolve().then(() => setTransportMode('connecting'));
    let ws: WebSocket | null = null;

    void getAccessToken().then((token) => {
      if (!isDetectionEnabled) return;

      if (!token) {
        setTransportMode('http');
        showTopToast('error', 'Please sign in again to use camera detection.', {
          id: 'chat-camera-auth-required',
          duration: 3000,
        });
        return;
      }

      const wsUrl = new URL(websocketUrl);
      wsUrl.searchParams.set('token', token);
      ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setTransportMode('ws');
        showTopToast('success', 'Socket connected', {
          id: 'chat-socket-status',
          duration: 2000,
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          applyDetectionResult(data?.emotion || 'neutral', normalizeFocused(data?.focused));
        } catch {
          // Ignore malformed payloads.
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        if (detectionEnabledRef.current) {
          setTransportMode('http');
          showTopToast('info', 'Realtime socket unavailable. Switched to HTTP mode.', {
            id: 'chat-socket-status',
            duration: 3000,
          });
        }
      };

      ws.onerror = () => {
        setTransportMode('http');
        showTopToast('error', 'Socket connection failed. Using HTTP fallback.', {
          id: 'chat-socket-status',
          duration: 3000,
        });
      };
    });

    return () => {
      if (ws && wsRef.current === ws) {
        ws.close();
        wsRef.current = null;
      }
    };
  }, [applyDetectionResult, isDetectionEnabled, showTopToast, websocketUrl]);

  // Send camera frames periodically through WebSocket or HTTP fallback.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isDetectionEnabled || !cameraReadyRef.current) return;

      const imageData = captureFrame();
      if (!imageData) return;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ image: imageData }));
        return;
      }

      void runHttpDetection(imageData);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isDetectionEnabled, runHttpDetection]);

  // Reset focus state when detection is disabled
  useEffect(() => {
    if (!isDetectionEnabled) {
      // When detection is disabled, reset the focused state
      void Promise.resolve().then(() => {
        setIsFocused(false);
        setContextFocusScore(50);
        setFocusState('idle');
        setEmotionState('neutral');
        setEmotionalState('neutral');
      });
    }
  }, [isDetectionEnabled, setContextFocusScore, setEmotionalState, setIsFocused]);

  const handleCameraToggle = () => {
    const nextEnabled = !isDetectionEnabled;
    setIsDetectionEnabled(nextEnabled, { persist: false });

    if (nextEnabled) {
      showTopToast('success', 'Camera enabled! Focus detection started.', {
        id: 'chat-camera-toggle',
        duration: 3000,
      });
    } else {
      showTopToast('info', 'Camera disabled. Emotional feedback activated.', {
        id: 'chat-camera-toggle',
        duration: 3000,
      });
    }
  };

  const applyStrictMode = useCallback((enabled: boolean) => {
    setIsStrictMode(enabled);
    localStorage.setItem('focusspark-strict-mode', String(enabled));
    if (!enabled) {
      setDistractionCount(0);
      strictDistractionCountRef.current = 0;
    }
    syncStrictModeToBackground(enabled);
  }, [syncStrictModeToBackground]);

  useEffect(() => {
    const previousPhase = previousPomodoroPhaseRef.current;
    const wasPomodoroFocus = previousPhase === 'focus' || previousPhase === 'paused';
    const isPomodoroFocus = phase === 'focus' || phase === 'paused';

    if (!wasPomodoroFocus && isPomodoroFocus) {
      strictModeBeforePomodoroRef.current = isStrictMode;
      strictModeManualOverrideRef.current = false;

      if (!isStrictMode) {
        autoStrictModeActiveRef.current = true;
        applyStrictMode(true);
        showTopToast('info', 'Strict Mode ON for this Pomodoro session.', {
          id: 'chat-strict-mode',
          duration: 3000,
        });
      } else {
        autoStrictModeActiveRef.current = false;
      }
    }

    if (wasPomodoroFocus && !isPomodoroFocus) {
      const shouldRestoreOff =
        autoStrictModeActiveRef.current &&
        !strictModeBeforePomodoroRef.current &&
        !strictModeManualOverrideRef.current;

      if (shouldRestoreOff) {
        applyStrictMode(false);
      }

      autoStrictModeActiveRef.current = false;
      strictModeManualOverrideRef.current = false;
    }

    previousPomodoroPhaseRef.current = phase;
  }, [applyStrictMode, isStrictMode, phase, showTopToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      }

      // Ctrl/Cmd + U to open upload modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        setUploadModalOpen(true);
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        setUploadModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setUploadModalOpen]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput && !pendingFile) return;

    if (pendingFile) {
      const file = pendingFile;
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      const userInput = trimmedInput || `Uploaded file: ${file.name}`;

      const userMessage: Message = {
        id: createRuntimeId(),
        type: 'user',
        content: trimmedInput,
        attachmentName: file.name,
        timestamp: createRuntimeDate(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setPendingFile(null);
      setIsProcessing(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const threadProvider = activeModel;
        const threadModel = resolveChatModel(threadProvider);
        const threadId = await getOrCreateTutorThreadId(threadProvider, threadModel);
        setCurrentThreadProvider(threadProvider);
        const authHeaders = await getAuthHeaders();
        const form = new FormData();
        form.append('thread_id', String(threadId));
        form.append('message', userInput);
        form.append('file', file);

        const response = await axios.post(buildBackendUrl(BACKEND_ROUTES.chatDocument), form, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        });

        const newDoc: UploadedDocument = {
          id: createRuntimeId(),
          name: file.name,
          type: extension === 'pdf' ? 'pdf' : extension === 'ppt' || extension === 'pptx' ? 'ppt' : extension === 'doc' || extension === 'docx' ? 'Word' : 'text',
          uploadDate: createRuntimeDate(),
          processed: true,
        };

        setUploadedDocs((prev) => [...prev, newDoc]);

        const responseText = response.data?.response;
        const messageId = response.data?.message_id;
        const aiMessage: Message = {
          id: createRuntimeId(),
          type: 'ai',
          content: typeof responseText === 'string' && responseText.trim()
            ? responseText
            : `Document "${file.name}" processed successfully!`,
          timestamp: createRuntimeDate(),
          attachmentName: file.name,
          backendMessageId: typeof messageId === 'number' ? messageId : undefined,
        };

        setMessages((prev) => [...prev, aiMessage]);
        showBottomToast('success', 'Document uploaded and processed!', {
          id: 'chat-document-uploaded',
          duration: 3000,
        });
      } catch (error) {
        console.error('Document upload failed:', error);
        showBottomToast('error', 'Upload failed. Please try another supported file.', {
          id: 'chat-document-upload-failed',
          duration: 3500,
        });
        setPendingFile(file);
      } finally {
        clearInterval(interval);
        setIsProcessing(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      return;
    }

    const userMessage: Message = {
      id: createRuntimeId(),
      type: 'user',
      content: trimmedInput,
      timestamp: createRuntimeDate(),
    };

    const userInput = trimmedInput;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Get conversation history for context
      const conversationHistory = messages
        .slice(-5)
        .map((m) => `${m.type === 'user' ? 'USER' : 'AI'}: ${m.content}`)
        .join('\n');

      const simpleReply = getSimpleReply(trimmedInput);

      if (simpleReply) {
        const greetingMessage: Message = {
          id: `${createRuntimeId()}-simple`,
          type: 'ai',
          content: simpleReply,
          timestamp: createRuntimeDate(),
        };

        setMessages((prev) => [...prev, greetingMessage]);
        setIsProcessing(false);
        return;
      }

      // Call real AI
      const threadProvider = activeModel;
      const threadModel = resolveChatModel(threadProvider);
      const response = await chatWithAITutor(userInput, conversationHistory, threadProvider, threadModel);
      if (!response.success) {
        throw new Error(response.error || 'AI request failed');
      }
      setCurrentThreadProvider(threadProvider);

      const aiMessage: Message = {
        id: createRuntimeId(),
        type: 'ai',
        content: response.text,
        timestamp: createRuntimeDate(),
        backendMessageId: response.messageId,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: createRuntimeId(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: createRuntimeDate(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const openFilePicker = (accept: string) => {
    setFileAccept(accept);
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const supportedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'txt'];
    const selectedExtensions = fileAccept
      .split(',')
      .map((value) => value.replace('.', '').trim().toLowerCase())
      .filter(Boolean);

    if (!supportedExtensions.includes(extension)) {
      showBottomToast('error', 'Wrong file type. Please select a PDF, PPT, Word, or TXT file.', {
        id: 'chat-wrong-file-type',
        duration: 3500,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (!selectedExtensions.includes(extension)) {
      showBottomToast('error', 'Please select the same file type you clicked.', {
        id: 'chat-file-type-mismatch',
        duration: 3500,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setPendingFile(file);
    setUploadModalOpen(false);
  };




  const handleFlashcardKnown = (cardId: string, known: boolean) => {
    const motivationalMessages = [
      'Your focus is strong.',
      'Keep up the momentum!',
      'You are on a roll.',
      'Learning mastery unlocked.',
      'Brain power activated.',
    ];

    const reviewMessages = [
      'Practice makes perfect.',
      'Growth mindset activated.',
      'Every review strengthens memory.',
      'You got this. Keep reviewing!',
    ];

    if (known) {
      const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      showBottomToast('success', msg, {
        id: `chat-flashcard-known-${cardId}`,
        duration: 2200,
      });
    } else {
      const msg = reviewMessages[Math.floor(Math.random() * reviewMessages.length)];
      showBottomToast('info', msg, {
        id: `chat-flashcard-review-${cardId}`,
        duration: 2200,
      });
    }

    setMessages((prev) =>
      prev.map((message) => {
        if (message.type !== 'flashcard' || !message.flashcards) return message;

        return {
          ...message,
          flashcards: message.flashcards.map((card) =>
            card.id === cardId ? { ...card, known } : card,
          ),
        };
      }),
    );
  };

  const getLatestChatMessageId = () => {
    const latestRelevantMessage = [...messages]
      .reverse()
      .find((message) => (
        (message.type === 'ai' || message.type === 'user') &&
        typeof message.backendMessageId === 'number'
      ));

    return latestRelevantMessage?.backendMessageId ?? null;
  };

  const hasUserChatMessage = () => messages.some((message) => message.type === 'user');

  const getSimpleReply = (text: string) => {
    const normalized = text
      .trim()
      .toLowerCase()
      .replace(/[!?.]+$/g, '')
      .replace(/\s+/g, ' ');

    const simpleReplies: Record<string, string> = {
      hi: "Hi. I'm FocusSpark AI Tutor. Tell me what you want to learn, and I'll keep it simple and useful.",
      hello: "Hello. I'm FocusSpark AI Tutor. Share a topic or question, and I'll help you work through it step by step.",
      hey: "Hey. I'm FocusSpark AI Tutor. Ask me about any topic, and I'll help you break it down clearly.",
      bye: 'Bye. Come back anytime when you want to study again.',
      goodbye: 'Goodbye. I will be here when you are ready to keep learning.',
      thanks: "You're welcome. Send me a real question whenever you're ready.",
      'thank you': "You're welcome. Send me a real question whenever you're ready.",
      thankyou: "You're welcome. Send me a real question whenever you're ready.",
    };

    return simpleReplies[normalized] ?? null;
  };

  const mapFlashcardsResponse = (rawText: string): Flashcard[] => {
    try {
      const payload = JSON.parse(rawText) as {
        flashcards?: Array<Record<string, unknown>>;
        data?: { flashcards?: Array<Record<string, unknown>> };
      } | Array<Record<string, unknown>>;
      const sourceFlashcards = Array.isArray(payload)
        ? payload
        : payload.flashcards ?? payload.data?.flashcards ?? [];

      return sourceFlashcards
        .map((card, index) => ({
          id: String(card.id ?? card.card_id ?? `${Date.now()}-${index}`),
          title: String(card.title ?? card.topic ?? 'Chat Flashcards'),
          topic: String(card.topic ?? card.subject ?? card.category ?? '').trim() || undefined,
          front: String(card.front ?? card.question ?? ''),
          back: String(card.back ?? card.answer ?? card.explanation ?? ''),
          example: typeof card.example === 'string' ? card.example : undefined,
          memoryTip: typeof card.memoryTip === 'string' ? card.memoryTip : typeof card.memory_tip === 'string' ? card.memory_tip : undefined,
          examShortcut: typeof card.examShortcut === 'string' ? card.examShortcut : typeof card.exam_shortcut === 'string' ? card.exam_shortcut : undefined,
          tags: Array.isArray(card.tags) ? card.tags.map((tag) => String(tag)) : [],
          known: Boolean(card.known),
          difficulty:
            card.difficulty === 'easy' || card.difficulty === 'medium' || card.difficulty === 'hard'
              ? (card.difficulty as Flashcard['difficulty'])
              : 'medium',
        }))
        .filter((card) => card.front.length > 0 && card.back.length > 0);
    } catch {
      return [];
    }
  };

  const mapQuizResponse = (rawText: string): QuizQuestion[] => {
    try {
      const payload = JSON.parse(rawText) as {
        questions?: Array<Record<string, unknown>>;
        data?: { questions?: Array<Record<string, unknown>> };
      } | Array<Record<string, unknown>>;

      const sourceQuestions = Array.isArray(payload)
        ? payload
        : payload.questions ?? payload.data?.questions ?? [];

      return sourceQuestions
        .map((question, index) => ({
          id: String(question.id ?? question.question_id ?? `${Date.now()}-${index}`),
          question: String(question.question ?? question.prompt ?? ''),
          options: Array.isArray(question.options) ? question.options.map((option) => String(option)) : [],
          correctAnswer: Number(
            question.correct_answer_index ?? question.correctAnswer ?? question.correct_answer ?? 0,
          ),
          explanation: String(question.explanation ?? ''),
        }))
        .filter((question) => question.question.length > 0 && question.options.length > 0);
    } catch {
      return [];
    }
  };

  const handleCreateFlashcardsFromChat = async () => {
    if (!hasUserChatMessage()) {
      showBottomToast('info', 'Start a chat first, then create flashcards from it.', {
        id: 'chat-flashcards-no-chat',
        duration: 3500,
      });
      return;
    }

    const messageId = getLatestChatMessageId();
    if (messageId === null) {
      showBottomToast('info', 'Send a chat message first, then create flashcards from it.', {
        id: 'chat-flashcards-no-message',
        duration: 3500,
      });
      return;
    }

    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      {
        id: createRuntimeId(),
        type: 'user',
        content: 'Create flashcards from this chat.',
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetchFlashcardsFromChat(messageId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create flashcards from chat');
      }

      const payload = JSON.parse(response.text) as Record<string, unknown>;
      const flashcards = mapFlashcardsResponse(response.text);
      if (flashcards.length === 0) {
        throw new Error('The server returned flashcards in an unexpected format.');
      }

      const artifactTitle = getArtifactTitle(payload, flashcards[0]?.front || 'Chat Flashcards');
      const flashcardMessage: Message = {
        id: createRuntimeId(),
        type: 'flashcard',
        content: 'Flashcards created from this chat.',
        timestamp: new Date(),
        artifactId: getArtifactNumber(payload),
        artifactTitle,
        artifactTopic: typeof payload.topic === 'string' ? payload.topic : undefined,
        flashcards,
      };

      setCurrentFlashcardIndex(0);
      setRevealedFlashcardIds(new Set());
      setMessages((prev) => [...prev, flashcardMessage]);
      showBottomToast('success', 'Flashcards created from chat.', {
        id: 'chat-flashcards-created',
        duration: 3000,
      });
    } catch (error) {
      console.error('Flashcards from chat failed:', error);
      showBottomToast('error', 'Could not create flashcards from chat. Please try again.', {
        id: 'chat-flashcards-error',
        duration: 3500,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateQuizFromChat = async () => {
    if (!hasUserChatMessage()) {
      showBottomToast('info', 'Start a chat first, then create a quiz from it.', {
        id: 'chat-quiz-no-chat',
        duration: 3500,
      });
      return;
    }

    const messageId = getLatestChatMessageId();
    if (messageId === null) {
      showBottomToast('info', 'Send a chat message first, then create a quiz from it.', {
        id: 'chat-quiz-no-message',
        duration: 3500,
      });
      return;
    }

    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      {
        id: createRuntimeId(),
        type: 'user',
        content: 'Create a quiz from this chat.',
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetchQuizFromChat(messageId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create quiz from chat');
      }

      const payload = JSON.parse(response.text) as Record<string, unknown>;
      const quizData = mapQuizResponse(response.text);
      if (quizData.length === 0) {
        throw new Error('The server returned quiz questions in an unexpected format.');
      }

      const artifactTitle = getArtifactTitle(payload, quizData[0]?.question || 'Chat Quiz');
      const quizMessage: Message = {
        id: createRuntimeId(),
        type: 'quiz',
        content: 'Quiz created from this chat.',
        timestamp: new Date(),
        artifactId: getArtifactNumber(payload),
        artifactTitle,
        artifactTopic: typeof payload.topic === 'string' ? payload.topic : undefined,
        quizData,
      };

      setMessages((prev) => [...prev, quizMessage]);
      showBottomToast('success', 'Quiz created from chat.', {
        id: 'chat-quiz-created',
        duration: 3000,
      });
    } catch (error) {
      console.error('Quiz from chat failed:', error);
      showBottomToast('error', 'Could not create quiz from chat. Please try again.', {
        id: 'chat-quiz-error',
        duration: 3500,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDeck = () => {
    showBottomToast('success', 'Deck saved to your library. Access it anytime from your collection.', {
      id: 'chat-deck-saved',
      duration: 4000,
    });
  };

  void handleSaveDeck;

  const handleExportDeck = () => {
    showBottomToast('success', 'Exporting deck as CSV... Check your downloads folder!', {
      id: 'chat-deck-exporting',
      duration: 4000,
    });
    // Simulate download
    setTimeout(() => {
      showBottomToast('success', 'Export complete. Your flashcards are ready.', {
        id: 'chat-deck-export-complete',
        duration: 3000,
      });
    }, 2000);
  };

  const handleShareDeck = () => {
    showBottomToast('success', 'Share link copied to clipboard. Send it to your study group.', {
      id: 'chat-deck-shared',
      duration: 4000,
    });
  };

  const flashcardStats = messages.reduce(
    (stats, message) => {
      if (message.type !== 'flashcard' || !message.flashcards) return stats;

      message.flashcards.forEach((card) => {
        stats.total += 1;
        if (card.known) {
          stats.known += 1;
        }
      });

      return stats;
    },
    { total: 0, known: 0 },
  );

  const cardsToReview = flashcardStats.total - flashcardStats.known;

  const quizStats = messages.reduce(
    (stats, message) => {
      if (message.type !== 'quiz' || !message.quizData) return stats;

      message.quizData.forEach((question) => {
        stats.total += 1;
        const answer = quizAnswers[question.id];
        if (answer === undefined) return;

        stats.answered += 1;
        if (answer === question.correctAnswer) {
          stats.correct += 1;
        }
      });

      return stats;
    },
    { total: 0, answered: 0, correct: 0 },
  );

  const handleEmotionalFeedback = (emotion: 'focused' | 'tired' | 'distracted') => {
    const responses = {
      focused: 'Great. Keep up the momentum!',
      tired: 'Consider taking a short break. A 5-minute walk can help.',
      distracted: 'Let\'s refocus together. Try the Pomodoro technique.',
    };

    showTopToast('success', responses[emotion], {
      id: 'chat-emotional-feedback',
      duration: 4000,
    });

    // Update emotional state in context for Dynamic Attention Bar
    const emotionalStateMap: { [key: string]: 'happy' | 'tired' | 'neutral' | 'sad' } = {
      focused: 'happy',
      tired: 'tired',
      distracted: 'sad',
    };

    const workspaceEmotionMap: Record<typeof emotion, 'happy' | 'tired' | 'sad'> = {
      focused: 'happy',
      tired: 'tired',
      distracted: 'sad',
    };

    setEmotionState(workspaceEmotionMap[emotion]);
    setEmotionalState(emotionalStateMap[emotion]);

  };

  // Get full-screen gradient based on current state
  const getFullScreenGradient = () => {
    // Check if dark mode is active
    const isDark = document.documentElement.classList.contains('dark');

    switch (emotionState) {
      case 'happy':
        // Focused/happy emotion uses the calm blue focus family.
        if (isDark) {
          return 'linear-gradient(135deg, #1A2A4A 0%, #1A3D4A 50%, #1A4A47 100%)';
        }
        return 'linear-gradient(135deg, #DBEAFE 0%, #BAE6FD 45%, #99F6E4 100%)';
      case 'sad':
        // Distracted/sad emotion uses a red/rose warning palette.
        if (isDark) {
          return 'linear-gradient(135deg, #4A1D2F 0%, #581C2A 45%, #3B2247 100%)';
        }
        return 'linear-gradient(135deg, #FFF1F2 0%, #FECACA 45%, #FDA4AF 100%)';
      case 'tired':
        // Tired emotion uses a softer amber palette.
        if (isDark) {
          return 'linear-gradient(135deg, #3B2F1D 0%, #4A351D 45%, #343629 100%)';
        }
        return 'linear-gradient(135deg, #FFFBEB 0%, #FDE68A 45%, #FCD34D 100%)';
      case 'neutral':
      default:
        // Neutral keeps the workspace quiet.
        if (isDark) {
          return 'linear-gradient(135deg, #1F2937 0%, #243744 45%, #27313F 100%)';
        }
        return 'linear-gradient(135deg, #EEF6FF 0%, #EAF4FF 45%, #F8FAFC 100%)';
    }
  };

  return (
    <motion.div
      className="h-screen flex overflow-hidden relative"
      style={{
        background: getFullScreenGradient(),
      }}
      animate={{
        background: getFullScreenGradient(),
      }}
      transition={{
        duration: 4,
        ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for ultra-smooth transitions
      }}
    >
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0 pointer-events-none">
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={canvasRef} />
      </div>

      {/* Welcome Animation Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: 1,
                  ease: 'easeInOut'
                }}
                className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-blue-purple"
              >
                <GraduationCap className="w-16 h-16 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl gradient-text"
              >
                AI Tutor Workspace
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-secondary"
              >
                Study smarter with guided explanations
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top Bar with Dynamic Attention Bar */}
        <div className="border-b border-border p-3 sm:p-4 flex-shrink-0 bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            {/* Left: Navigation buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {onNavigate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:bg-accent"
                >
                  <Home className="w-5 h-5" />
                </Button>
              )}

              <div className="hidden sm:flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-500" />
                <h2 className="text-lg lg:text-xl whitespace-nowrap">AI Tutor</h2>
              </div>

            </div>

            {/* Center: Dynamic Attention Bar with integrated Pomodoro progress */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2 md:px-4">
              <DynamicAttentionBar />
            </div>

            {/* Right: Camera Controls, Strict Mode, Timer & Action buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Camera Enable/Disable Button - Desktop */}
              {!isDetectionEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCameraToggle}
                  className="hidden sm:flex gap-2 bg-gradient-to-r from-green-500/20 to-teal-500/20 border-green-500/40 hover:from-green-500/30 hover:to-teal-500/30 transition-all"
                >
                  <Camera className="w-4 h-4 text-green-400" />
                  <span className="hidden lg:inline">Enable Camera</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCameraToggle}
                  className="hidden sm:flex gap-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40 hover:from-red-500/30 hover:to-orange-500/30 transition-all"
                >
                  <Camera className="w-4 h-4 text-red-400" />
                  <span className="hidden lg:inline">Disable Camera</span>
                </Button>
              )}

              {/* Camera Toggle - Mobile Icon Only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCameraToggle}
                className={`sm:hidden ${isDetectionEnabled ? 'text-red-400' : 'text-green-400'}`}
                title={isDetectionEnabled ? 'Disable Camera' : 'Enable Camera'}
              >
                <Camera className="w-5 h-5" />
              </Button>

              {/* Timer Button */}
              <TimerButton
                onClick={() => {
                  if (phase === 'idle') {
                    setTimerDropdownOpen(true);
                  } else {
                    setTimerControlPanelOpen(true);
                  }
                }}
              />

              {!rightSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightSidebarOpen(true)}
                  className="hover:bg-accent"
                  title="Open Sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}

              {!rightSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightSidebarOpen(true)}
                  className="lg:hidden hover:bg-accent"
                  title="Session Info"
                >
                  <BarChart2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <ChatMessageList
          messages={messages}
          isProcessing={isProcessing}
          chatEndRef={chatEndRef}
          currentFlashcardIndex={currentFlashcardIndex}
          revealedFlashcardIds={revealedFlashcardIds}
          quizAnswers={quizAnswers}
          onRevealFlashcard={(cardId) => {
            setRevealedFlashcardIds((current) => new Set(current).add(cardId));
          }}
          onCurrentFlashcardIndexChange={setCurrentFlashcardIndex}
          onQuizAnswersChange={setQuizAnswers}
          onFlashcardKnown={handleFlashcardKnown}
        />

        <ChatComposer
          inputValue={inputValue}
          onInputValueChange={setInputValue}
          onSendMessage={() => void handleSendMessage()}
          onOpenUploadModal={() => setUploadModalOpen(true)}
          pendingFile={pendingFile}
          onClearPendingFile={() => {
            setPendingFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          selectedModel={selectedModel}
          onSelectedModelChange={setSelectedModel}
          models={AI_MODELS}
          activeModelDescription={activeModelDetails.description}
          isThreadModelLocked={isThreadModelLocked}
          onStartNewThread={startNewThread}
        />
      </div>

      <ChatSidePanel
        open={rightSidebarOpen}
        onOpenChange={setRightSidebarOpen}
        uploadedDocs={uploadedDocs}
        flashcardStats={flashcardStats}
        quizStats={quizStats}
        cardsToReview={cardsToReview}
        focusScore={contextFocusScore}
        isFocusTrackingEnabled={isDetectionEnabled}
        isStrictMode={isStrictMode}
        distractionCount={distractionCount}
        focusDriftCount={focusDriftCount}
        onToggleStrictMode={handleToggleStrictMode}
        onCreateFlashcardsFromChat={() => void handleCreateFlashcardsFromChat()}
        onCreateQuizFromChat={() => void handleCreateQuizFromChat()}
        onExportDeck={handleExportDeck}
        onShareDeck={handleShareDeck}
      />

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        fileInputRef={fileInputRef}
        fileAccept={fileAccept}
        onFileUpload={handleFileUpload}
        onOpenFilePicker={openFilePicker}
      />

            {/* ── STRICT MODE ── */}
            {/* ── END STRICT MODE ── */}

      {showWorkspaceGuide && (
        <Dialog open={false} onOpenChange={() => undefined}>
          <DialogContent className=" max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI Learning Workspace Guide</DialogTitle>
              <DialogDescription>
                Learn how to use the AI chatbot workspace for maximum productivity.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Quick Start */}
            <div>
              <h3 className="text-lg mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-yellow-500" />
                Quick Start
              </h3>
              <div className="space-y-2 text-sm text-secondary">
                <p>• Use <strong>Enable/Disable Camera</strong> buttons to control focus detection</p>
                <p>• Watch the <strong>Dynamic Attention Bar</strong> for real-time focus feedback</p>
                <p>• When camera is off, emotional feedback appears at the start and every 5-10 minutes</p>
                <p>• Upload documents (PDF, PPT, Ms Word) to analyze</p>
                <p>• Chat with AI to ask questions or generate flashcards</p>
                <p>• Use voice input for hands-free interaction</p>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-500" />
                Key Features
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="mb-1">💬 Chat Interface</p>
                  <p className="text-xs text-secondary">Real-time AI conversations</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="mb-1">🗂️ Document Upload</p>
                  <p className="text-xs text-secondary">PDF, PPT, Images, Text</p>
                </div>
                <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                  <p className="mb-1">🎴 Flashcards</p>
                  <p className="text-xs text-secondary">AI-generated study cards</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="mb-1">📝 Quiz Mode</p>
                  <p className="text-xs text-secondary">Interactive testing</p>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-lg mb-3 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-teal-500" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 rounded bg-card">
                  <span className="text-secondary">Focus input</span>
                  <Badge variant="outline">⌘ K</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-card">
                  <span className="text-secondary">Upload document</span>
                  <Badge variant="outline">⌘ U</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-card">
                  <span className="text-secondary">Close dialogs</span>
                  <Badge variant="outline">ESC</Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-card">
                  <span className="text-secondary">Send message</span>
                  <Badge variant="outline">Enter</Badge>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-lg mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-500" />
                Pro Tips
              </h3>
              <div className="space-y-2 text-sm text-secondary">
                <p>💡 Try: "Generate flashcards from my notes"</p>
                <p>💡 Try: "Create a quiz on quantum physics"</p>
                <p>💡 Try: "Explain this concept with examples"</p>
                <p>💡 Upload your study materials for instant summaries</p>
                <p>💡 Enable focus detection for real-time attention tracking</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button onClick={() => undefined}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Emotional Feedback Popup */}
      <EmotionalFeedbackPopup
        isVisible={showEmotionalFeedback}
        onClose={() => setShowEmotionalFeedback(false)}
        onFeedback={handleEmotionalFeedback}
      />

      {/* Motivational Popup - Focus Detection Mode */}
      <MotivationalPopup
        isVisible={showMotivationalPopup}
        message={motivationalMessage}
        type={focusState}
        onClose={() => setShowMotivationalPopup(false)}
      />

      {/* Pomodoro Timer Dropdown */}
      <TimerDropdown
        isOpen={timerDropdownOpen}
        onClose={() => setTimerDropdownOpen(false)}
      />

      {/* Pomodoro Control Panel */}
      <PomodoroControlPanel
        isOpen={timerControlPanelOpen}
        onClose={() => setTimerControlPanelOpen(false)}
      />
    </motion.div>
  );
}
