import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Plus,
  Upload,
  Camera,
  FileText,
  Presentation,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  GraduationCap,
  Layers,
  ListChecks,
  Eye,
  X,
  Check,
  Home,
  ShieldAlert,
  BarChart2,
  UserRound,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { toast } from 'sonner';
import axios from 'axios';
import { useFocus } from '../../context/FocusContext';
import { FormattedAIMessage } from '../../components/shared/FormattedAIMessage';
import { DynamicAttentionBar } from '../../features/focus/DynamicAttentionBar';
import { EmotionalFeedbackPopup } from '../../features/focus/EmotionalFeedbackPopup';
import { MotivationalPopup } from '../../components/shared/MotivationalPopup';
import { TimerButton } from '../../features/pomodoro/TimerButton';
import { TimerDropdown } from '../../features/pomodoro/TimerDropdown';
import { PomodoroControlPanel } from '../../features/pomodoro/PomodoroControlPanel';
import { BACKEND_ROUTES, buildBackendUrl } from '../../config/backend';
import {
  chatWithAITutor,
  fetchFlashcardsFromChat,
  fetchQuizFromChat,
  getOrCreateTutorThreadId,
  resetTutorThread,
} from '../../utils/aiClient';
import { getAuthHeaders } from '../../utils/backendClient';
import { usePomodoro } from '../../context/PomodoroContext';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'flashcard' | 'quiz' | 'system';
  content: string;
  timestamp: Date;
  attachmentName?: string;
  backendMessageId?: number;
  flashcards?: Flashcard[];
  quizData?: QuizQuestion[];
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
  known: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'ppt' | 'Word' | 'text' | 'image';
  uploadDate: Date;
  processed: boolean;
}

const LEARNING_PERSONAS = [
  { id: 'sensei', name: 'Ultra Instinct Sensei', icon: 'Target', style: 'Mastery-focused with clear examples' },
  { id: 'tutor', name: 'AI Tutor', icon: 'GraduationCap', style: 'Structured and academic' },
  { id: 'partner', name: 'Study Partner', icon: 'Users', style: 'Friendly and collaborative' },
  { id: 'coach', name: 'Focus Coach', icon: 'Dumbbell', style: 'Motivational and actionable' },
];

interface ChatbotWorkspaceProps {
  onNavigate?: (page: string) => void;
}

export function ChatbotWorkspace({ onNavigate }: ChatbotWorkspaceProps = {}) {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: any }).chrome;
  const { setIsFocused, isDetectionEnabled, setIsDetectionEnabled, focusScore: contextFocusScore, setFocusScore: setContextFocusScore, setEmotionalState } = useFocus();
  const { phase } = usePomodoro();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi, I'm your AI tutor. Ask a question, upload study material, or turn this chat into flashcards and quizzes.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fileAccept, setFileAccept] = useState('.pdf,.ppt,.pptx,.doc,.docx,.txt');
  const [selectedPersona] = useState('sensei');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: number }>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true); // Start open by default
  const [showEmotionalFeedback, setShowEmotionalFeedback] = useState(false);

  // Pomodoro Timer States
  const [timerDropdownOpen, setTimerDropdownOpen] = useState(false);
  const [timerControlPanelOpen, setTimerControlPanelOpen] = useState(false);

  useEffect(() => {
    resetTutorThread();
  }, []);

  // Full-Screen Dynamic Environment States
  const [focusState, setFocusState] = useState<'focused' | 'attention' | 'idle'>('focused');
  const [emotionState, setEmotionState] = useState<'happy' | 'tired' | 'neutral' | 'sad'>('neutral');
  const [showMotivationalPopup, setShowMotivationalPopup] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [transportMode, setTransportMode] = useState<'connecting' | 'ws' | 'http'>('connecting');
  const [focusDriftCount, setFocusDriftCount] = useState(0);

  void quizMode;
  void setQuizMode;
  void currentQuizIndex;
  void setCurrentQuizIndex;
  void quizComplete;
  void setQuizComplete;

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
  const [isStrictMode, setIsStrictMode] = useState(() => {
    return localStorage.getItem('focusspark-strict-mode') === 'true';
  });
  const [distractionCount, setDistractionCount] = useState(0);
  const focusTabIdRef = useRef<number | null>(null);
  const websocketUrl = buildBackendUrl(BACKEND_ROUTES.ws).replace(/^http/i, 'ws');

  const normalizeEmotion = (value: string): 'happy' | 'tired' | 'neutral' | 'sad' => {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'happy') return 'happy';
    if (normalized === 'sad') return 'sad';
    if (normalized === 'tired') return 'tired';
    return 'neutral';
  };

  const notifyDistracted = () => {
    const now = Date.now();
    if (now - warnCooldownRef.current < 5000) return;

    warnCooldownRef.current = now;
    setFocusDriftCount((count) => count + 1);
    toast.warning('You are distracted. Refocus on your session.', {
      position: 'top-right',
      duration: 3000,
    });
  };

  const applyDetectionResult = (incomingEmotion: string, incomingFocused: boolean) => {
    const mappedEmotion = normalizeEmotion(incomingEmotion || 'neutral');
    setEmotionState(mappedEmotion);
    setEmotionalState(mappedEmotion === 'happy' ? 'happy' : mappedEmotion === 'sad' ? 'sad' : mappedEmotion === 'tired' ? 'tired' : 'neutral');

    setIsFocused(incomingFocused);
    setContextFocusScore(incomingFocused ? 85 : 35);
    setFocusState(incomingFocused ? 'focused' : 'attention');

    if (prevFocusedRef.current && !incomingFocused) {
      notifyDistracted();
      setMotivationalMessage('Wake Up — Concentrate Now!');
      setShowMotivationalPopup(true);
      setTimeout(() => setShowMotivationalPopup(false), 3000);
    }

    prevFocusedRef.current = incomingFocused;
  };

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

  const runHttpDetection = async (imageData: string) => {
    if (detectInFlightRef.current) return;
    detectInFlightRef.current = true;

    try {
      const response = await fetch(buildBackendUrl(BACKEND_ROUTES.analyze), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP detection failed: ${response.status}`);
      }

      const data = await response.json();
      applyDetectionResult(data?.emotion || 'neutral', Boolean(data?.focused));
      if (transportMode !== 'http') {
        setTransportMode('http');
      }
    } catch {
      // Keep UI stable if backend analyze endpoint is unavailable.
    } finally {
      detectInFlightRef.current = false;
    }
  };

  const stopCameraStream = () => {
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
  };

  const syncStrictModeToBackground = (enabled: boolean) => {
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
  };

  const handleToggleStrictMode = () => {
    const nextMode = !isStrictMode;
    setIsStrictMode(nextMode);
    localStorage.setItem('focusspark-strict-mode', String(nextMode));
    setDistractionCount(0);
    syncStrictModeToBackground(nextMode);

    if (nextMode) {
      toast.info('🔒 Strict Mode ON — distractions blocked!', {
        position: 'top-right',
        duration: 3000,
      });
      return;
    }

    toast.info('🔓 Strict Mode OFF.', {
      position: 'top-right',
      duration: 2500,
    });
  };

  useEffect(() => {
    if (!chromeApi?.tabs?.getCurrent) return;

    chromeApi.tabs.getCurrent((tab: { id?: number }) => {
      if (typeof tab?.id === 'number') {
        focusTabIdRef.current = tab.id;
        // Always sync on mount so background does not keep stale strict state.
        syncStrictModeToBackground(isStrictMode);
      }
    });
  }, []);

  useEffect(() => {
    if (!chromeApi?.runtime?.onMessage) return;

    const listener = (message: any) => {
      if (!message || typeof message !== 'object') return;

      if (message.type === 'DISTRACTION_DETECTED') {
        if (!isStrictMode) return;

        const nextCount = Number(message.count || 1);
        setDistractionCount(nextCount);

        toast.warning('Tab changed detected. Please return to your study tab.', {
          position: 'top-right',
          duration: 3500,
        });

        if (nextCount >= 3) {
          toast.error('Distracted multiple times. Lock back in now.', {
            position: 'top-right',
            duration: 4000,
          });
        }
      }

      if (message.type === 'DISTRACTION_TAB_CLOSED') {
        if (!isStrictMode) return;
      }

      if (message.type === 'STRICT_MODE_FORCED_OFF') {
        setIsStrictMode(false);
        localStorage.setItem('focusspark-strict-mode', 'false');
        toast.info('Strict Mode was disabled because the focus tab was closed.', {
          position: 'top-right',
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
  }, [isStrictMode]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;

      const now = Date.now();
      if (now - tabSwitchWarnCooldownRef.current < 2000) return;
      tabSwitchWarnCooldownRef.current = now;

      if (isStrictMode) {
        return;
      }

      toast.info('You switched tabs. Stay focused on your study session.', {
        position: 'top-right',
        duration: 2500,
      });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isStrictMode]);
  // Hide welcome animation after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Emotional Feedback Popup - Show every 30 seconds when detection is disabled
  useEffect(() => {
    if (isDetectionEnabled) {
      setShowEmotionalFeedback(false);
      return;
    }

    if (!isDetectionEnabled) {
      const interval = setInterval(() => {
        setShowEmotionalFeedback(true);
      }, 30000); // Show every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isDetectionEnabled]);

  // Start or stop camera when detection mode changes.
  useEffect(() => {
    if (!isDetectionEnabled) {
      stopCameraStream();
      setTransportMode('connecting');
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

          setTimeout(() => {
            cameraReadyRef.current = true;
          }, 3000);
        };
      } catch {
        toast.error('Camera access failed. Detection unavailable.', {
          position: 'top-right',
          duration: 3000,
        });
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [isDetectionEnabled]);

  // Prefer WebSocket transport and fall back to HTTP if socket fails.
  useEffect(() => {
    if (!isDetectionEnabled) return;

    setTransportMode('connecting');
    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setTransportMode('ws');
      toast.success('Socket connected', {
        position: 'top-right',
        duration: 2000,
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        applyDetectionResult(data?.emotion || 'neutral', Boolean(data?.focused));
      } catch {
        // Ignore malformed payloads.
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      if (isDetectionEnabled) {
        setTransportMode('http');
        toast.info('Realtime socket unavailable. Switched to HTTP mode.', {
          position: 'top-right',
          duration: 3000,
        });
      }
    };

    ws.onerror = () => {
      setTransportMode('http');
      toast.error('Socket connection failed. Using HTTP fallback.', {
        position: 'top-right',
        duration: 3000,
      });
    };

    return () => {
      if (wsRef.current === ws) {
        ws.close();
        wsRef.current = null;
      }
    };
  }, [isDetectionEnabled, websocketUrl]);

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
  }, [isDetectionEnabled, transportMode]);

  // Reset focus state when detection is disabled
  useEffect(() => {
    if (!isDetectionEnabled) {
      // When detection is disabled, reset the focused state
      setIsFocused(false);
      setContextFocusScore(0);
      setFocusState('idle');
    }
  }, [isDetectionEnabled, setContextFocusScore, setIsFocused]);

  const handleCameraToggle = () => {
    const nextEnabled = !isDetectionEnabled;
    setIsDetectionEnabled(nextEnabled);

    if (nextEnabled) {
      toast.success('✅ Camera enabled! Focus detection started.', { duration: 3000 });
    } else {
      toast.info('📵 Camera disabled. Emotional feedback activated.', { duration: 3000 });
    }
  };

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
  }, []);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput && !pendingFile) return;

    if (pendingFile) {
      const file = pendingFile;
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      const userInput = trimmedInput || `Uploaded file: ${file.name}`;

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: trimmedInput,
        attachmentName: file.name,
        timestamp: new Date(),
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
        const threadId = await getOrCreateTutorThreadId();
        const authHeaders = await getAuthHeaders();
        const form = new FormData();
        form.append('thread_id', String(threadId));
        form.append('message', userInput);
        form.append('file', file);

        await axios.post(buildBackendUrl(BACKEND_ROUTES.chatDocument), form, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        });

        const newDoc: UploadedDocument = {
          id: Date.now().toString(),
          name: file.name,
          type: extension === 'pdf' ? 'pdf' : extension === 'ppt' || extension === 'pptx' ? 'ppt' : extension === 'doc' || extension === 'docx' ? 'Word' : 'text',
          uploadDate: new Date(),
          processed: true,
        };

        setUploadedDocs((prev) => [...prev, newDoc]);

        const summaryMessage: Message = {
          id: Date.now().toString(),
          type: 'system',
          content: `Document "${file.name}" processed successfully!`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, summaryMessage]);
        toast.success('Document uploaded and processed!');
      } catch (error) {
        console.error('Document upload failed:', error);
        toast.error('Upload failed. Please try another supported file.');
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
      id: Date.now().toString(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date(),
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

      // Determine persona from selected persona state
      const personaMap: { [key: string]: 'sensei' | 'tutor' | 'partner' | 'coach' } = {
        sensei: 'sensei',
        tutor: 'tutor',
        partner: 'partner',
        coach: 'coach',
      };
      const currentPersona = personaMap[selectedPersona] || 'sensei';

      // Call real AI
      const response = await chatWithAITutor(userInput, conversationHistory, currentPersona);

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: response.text,
        timestamp: new Date(),
        backendMessageId: response.messageId,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSampleFlashcards = (): Flashcard[] => {
    return [
      {
        id: '1',
        title: 'Quantum Mechanics',
        front: 'What is the Heisenberg Uncertainty Principle?',
        back: 'It states that you cannot simultaneously know both the exact position and exact momentum of a particle.',
        example: 'Like trying to measure the exact speed of a moving car while pinpointing its exact location at the same instant.',
        memoryTip: 'Think: "Heisen-BLUR" - the more precisely you know one thing, the blurrier the other becomes',
        examShortcut: 'ΔxΔp ≥ ℏ/2',
        tags: ['physics', 'quantum', 'core-concept'],
        difficulty: 'hard',
        known: false,
      },
      {
        id: '2',
        title: 'Photosynthesis',
        front: 'What are the two main stages of photosynthesis?',
        back: 'Light-dependent reactions (in thylakoids) and Light-independent reactions / Calvin Cycle (in stroma)',
        example: 'Stage 1: Sun energy → ATP. Stage 2: ATP → Glucose',
        memoryTip: 'Light first, then Dark. L comes before D in alphabet!',
        tags: ['biology', 'plants', 'energy'],
        difficulty: 'medium',
        known: false,
      },
      {
        id: '3',
        title: 'Mitochondria',
        front: 'Why is mitochondria called the powerhouse of the cell?',
        back: 'Because it produces ATP through cellular respiration, which is the main energy currency of the cell.',
        memoryTip: 'Might-o-chondria = Mighty power!',
        tags: ['biology', 'cell', 'energy'],
        difficulty: 'easy',
        known: false,
      },
    ];
  };

  const generateSampleQuiz = (): QuizQuestion[] => {
    return [
      {
        id: '1',
        question: 'Which organelle is responsible for protein synthesis?',
        options: ['Mitochondria', 'Ribosome', 'Nucleus', 'Golgi Apparatus'],
        correctAnswer: 1,
        explanation: 'Ribosomes are the cellular machinery responsible for translating mRNA into proteins.',
      },
      {
        id: '2',
        question: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Ribosome', 'Mitochondria', 'ER'],
        correctAnswer: 2,
        explanation: 'Mitochondria produce ATP through cellular respiration.',
      },
    ];
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
      toast.error('Wrong file type. Please select a PDF, PPT, Word, or TXT file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (!selectedExtensions.includes(extension)) {
      toast.error('Please select the same file type you clicked.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setPendingFile(file);
    setUploadModalOpen(false);
  };




  const handleFlashcardKnown = (_cardId: string, known: boolean) => {
    const motivationalMessages = [
      'Your focus is glowing strong 💡',
      'Keep up the momentum! 🚀',
      'You\'re on fire! 🔥',
      'Learning mastery unlocked! ⚡',
      'Brain power activated! 🧠',
    ];

    const reviewMessages = [
      'Practice makes perfect! 📚',
      'Growth mindset activated! 🌱',
      'Every review strengthens memory! 💪',
      'You got this! Keep reviewing! 🎯',
    ];

    if (known) {
      const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      toast.success(msg);
    } else {
      const msg = reviewMessages[Math.floor(Math.random() * reviewMessages.length)];
      toast.info(msg);
    }
  };

  const getLatestChatMessageId = () => {
    const latestRelevantMessage = [...messages].reverse().find((message) => message.type === 'ai' || message.type === 'user');

    if (!latestRelevantMessage) {
      return null;
    }

    if (typeof latestRelevantMessage.backendMessageId === 'number') {
      return latestRelevantMessage.backendMessageId;
    }

    const parsedId = Number.parseInt(latestRelevantMessage.id, 10);
    return Number.isFinite(parsedId) ? parsedId : null;
  };

  const hasUserChatMessage = () => messages.some((message) => message.type === 'user');

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
      return generateSampleFlashcards();
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
      return generateSampleQuiz();
    }
  };

  const handleCreateFlashcardsFromChat = async () => {
    if (!hasUserChatMessage()) {
      toast.info('Start a chat first, then create flashcards from it.', { duration: 3500 });
      return;
    }

    const messageId = getLatestChatMessageId();
    if (messageId === null) {
      toast.info('Send a chat message first, then create flashcards from it.', { duration: 3500 });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetchFlashcardsFromChat(messageId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create flashcards from chat');
      }

      const flashcards = mapFlashcardsResponse(response.text);
      const flashcardMessage: Message = {
        id: Date.now().toString(),
        type: 'flashcard',
        content: '🔥 Flashcards created from this chat thread.',
        timestamp: new Date(),
        flashcards,
      };

      setMessages((prev) => [...prev, flashcardMessage]);
      toast.success('Flashcards created from chat.', { duration: 3000 });
    } catch (error) {
      console.error('Flashcards from chat failed:', error);
      toast.error('Could not create flashcards from chat. Please try again.', { duration: 3500 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateQuizFromChat = async () => {
    if (!hasUserChatMessage()) {
      toast.info('Start a chat first, then create a quiz from it.', { duration: 3500 });
      return;
    }

    const messageId = getLatestChatMessageId();
    if (messageId === null) {
      toast.info('Send a chat message first, then create a quiz from it.', { duration: 3500 });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetchQuizFromChat(messageId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create quiz from chat');
      }

      const quizData = mapQuizResponse(response.text);
      const quizMessage: Message = {
        id: Date.now().toString(),
        type: 'quiz',
        content: '📝 Quiz created from this chat thread.',
        timestamp: new Date(),
        quizData,
      };

      setMessages((prev) => [...prev, quizMessage]);
      toast.success('Quiz created from chat.', { duration: 3000 });
    } catch (error) {
      console.error('Quiz from chat failed:', error);
      toast.error('Could not create quiz from chat. Please try again.', { duration: 3500 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDeck = () => {
    toast.success('🎉 Deck saved to your library! Access it anytime from your collection.', {
      duration: 4000,
    });
  };

  void handleSaveDeck;

  const handleExportDeck = () => {
    toast.success('⬇️ Exporting deck as CSV... Check your downloads folder!', {
      duration: 4000,
    });
    // Simulate download
    setTimeout(() => {
      toast.success('✅ Export complete! Your flashcards are ready.');
    }, 2000);
  };

  const handleShareDeck = () => {
    toast.success('🔗 Share link copied to clipboard! Send it to your study group.', {
      duration: 4000,
    });
  };

  const getCurrentPersona = () => {
    return LEARNING_PERSONAS.find((p) => p.id === selectedPersona) || LEARNING_PERSONAS[0];
  };

  const handleEmotionalFeedback = (emotion: 'focused' | 'tired' | 'distracted') => {
    const responses = {
      focused: 'Great! Keep up the momentum! 🚀',
      tired: 'Consider taking a short break. A 5-minute walk can help! ☕',
      distracted: 'Let\'s refocus together. Try the Pomodoro technique! 🎯',
    };

    toast.success(responses[emotion], {
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

    // Log feedback for analytics (optional)
    console.log('Emotional feedback:', emotion, new Date());
  };

  // Get full-screen gradient based on current state
  const getFullScreenGradient = () => {
    // Check if dark mode is active
    const isDark = document.documentElement.classList.contains('dark');

    if (!isDetectionEnabled) {
      // Dynamic emotional gradient when camera is disabled - Amazing color transitions
      switch (emotionState) {
        case 'happy':
          // Vibrant energetic greens and teals for happiness
          if (isDark) {
            return 'linear-gradient(135deg, #1a4a3a 0%, #1a3a4a 25%, #2a4a3a 50%, #1a4a45 75%, #1a3a3a 100%)';
          }
          return 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 25%, #34D399 50%, #10B981 75%, #059669 100%)';
        case 'sad':
          // Moody reds and deep oranges for sadness
          if (isDark) {
            return 'linear-gradient(135deg, #4a1a1a 0%, #4a2a1a 25%, #3a1a2a 50%, #4a1a2a 75%, #3a1a1a 100%)';
          }
          return 'linear-gradient(135deg, #FCA5A5 0%, #F87171 25%, #EF4444 50%, #DC2626 75%, #B91C1C 100%)';
        case 'tired':
          // Soft warm tones for low-energy study mode
          if (isDark) {
            return 'linear-gradient(135deg, #3d2f1f 0%, #4a3a24 35%, #3a3325 70%, #2f2d28 100%)';
          }
          return 'linear-gradient(135deg, #FFE8A3 0%, #FDCB6E 35%, #F6B35B 70%, #E8A24A 100%)';
        case 'neutral':
        default:
          // Balanced neutral tones while waiting for feedback
          if (isDark) {
            return 'linear-gradient(135deg, #27313f 0%, #263a37 45%, #34372f 100%)';
          }
          return 'linear-gradient(135deg, #EEF6FF 0%, #E4F7F1 45%, #FFF7D6 100%)';
      }
    }

    switch (focusState) {
      case 'focused':
        // Cool tones for calm focus and deep flow
        if (isDark) {
          return 'linear-gradient(135deg, #1a2a4a 0%, #1a3d4a 50%, #1a4a47 100%)';
        }
        return 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 50%, #B2FEFA 100%)';
      case 'attention':
        // Warm vibrant tones to trigger alertness - ORANGE/YELLOW for ATTENTION NEEDED
        if (isDark) {
          return 'linear-gradient(135deg, #4a2a1a 0%, #4a3d1a 50%, #4a3a1a 100%)';
        }
        return 'linear-gradient(135deg, #FF9966 0%, #FFD200 50%, #F7971E 100%)';
      case 'idle':
        // Gentle neutral hues for balance - GRAY/MUTED for IDLE
        if (isDark) {
          return 'linear-gradient(135deg, #2a2d3a 0%, #2d3a2d 50%, #3a3d2a 100%)';
        }
        return 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 50%, #DCE35B 100%)';
      default:
        if (isDark) {
          return 'linear-gradient(135deg, #1a2a4a 0%, #1a3d4a 100%)';
        }
        return 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)';
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

        {/* Chat Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 chatbot-messages-scroll">
          <div className="max-w-5xl mx-auto space-y-6 pb-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* User Messages */}
                  {message.type === 'user' && (
                    <div className="max-w-2xl rounded-3xl px-5 py-4 bg-card dark:bg-gray-900/70 backdrop-blur-md border border-blue-500/30 dark:border-gray-700 shadow-lg">
                      <div className="flex flex-row-reverse items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <UserRound className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-3 text-right">
                          {message.content && (
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          )}
                          {message.attachmentName && (
                            <div className="ml-auto flex max-w-full items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-left">
                              <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />
                              <span className="truncate text-sm font-medium text-foreground">{message.attachmentName}</span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground mt-2 block">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Messages */}
                  {message.type === 'ai' && (
                    <FormattedAIMessage
                      content={message.content}
                      timestamp={message.timestamp}
                    />
                  )}

                  {/* System Messages */}
                  {message.type === 'system' && (
                    <div className="w-full rounded-2xl px-6 py-4 border border-teal-500/30 bg-card dark:bg-gray-900/70 backdrop-blur-md shadow-lg">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-teal-400" />
                        <p className="text-foreground">{message.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Flashcard Messages */}
                  {message.type === 'flashcard' && message.flashcards && (
                    <div className="w-full space-y-4">
                      <div className="rounded-2xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg">
                        <p className="mb-4 text-foreground">{message.content}</p>

                        {/* Flashcard Carousel */}
                        <div className="relative">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentFlashcardIndex}
                              initial={{ opacity: 0, rotateY: 90 }}
                              animate={{ opacity: 1, rotateY: 0 }}
                              exit={{ opacity: 0, rotateY: -90 }}
                              transition={{ duration: 0.5 }}
                              className="min-h-[300px]"
                            >
                              <Card
                                className="cursor-pointer hover:shadow-2xl transition-shadow border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-600/10"
                                onClick={() => setShowFlashcardBack(!showFlashcardBack)}
                              >
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="gradient-text mb-2">
                                        {message.flashcards[currentFlashcardIndex].title}
                                      </CardTitle>
                                      <div className="flex gap-2">
                                        {message.flashcards[currentFlashcardIndex].tags.map((tag) => (
                                          <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        message.flashcards[currentFlashcardIndex].difficulty === 'easy'
                                          ? 'default'
                                          : message.flashcards[currentFlashcardIndex].difficulty === 'medium'
                                            ? 'secondary'
                                            : 'destructive'
                                      }
                                    >
                                      {message.flashcards[currentFlashcardIndex].difficulty}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {!showFlashcardBack ? (
                                    <div>
                                      <p className="text-lg mb-4 text-foreground">
                                        {message.flashcards[currentFlashcardIndex].front}
                                      </p>
                                      <p className="text-sm text-muted-foreground text-center">
                                        Click to reveal answer
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="p-4 rounded-xl bg-card border border-border">
                                        <p className="text-lg text-foreground">
                                          {message.flashcards[currentFlashcardIndex].back}
                                        </p>
                                      </div>

                                      {message.flashcards[currentFlashcardIndex].example && (
                                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                          <p className="text-sm text-muted-foreground mb-1">💡 Example:</p>
                                          <p className="text-foreground">{message.flashcards[currentFlashcardIndex].example}</p>
                                        </div>
                                      )}

                                      {message.flashcards[currentFlashcardIndex].memoryTip && (
                                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                          <p className="text-sm text-muted-foreground mb-1">🧠 Memory Tip:</p>
                                          <p className="text-foreground">{message.flashcards[currentFlashcardIndex].memoryTip}</p>
                                        </div>
                                      )}

                                      {message.flashcards[currentFlashcardIndex].examShortcut && (
                                        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                                          <p className="text-sm text-muted-foreground mb-1">⚡ Exam Shortcut:</p>
                                          <p className="font-mono text-foreground">
                                            {message.flashcards[currentFlashcardIndex].examShortcut}
                                          </p>
                                        </div>
                                      )}

                                      <div className="flex gap-3 pt-4">
                                        <Button
                                          className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-foreground"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFlashcardKnown(message.flashcards![currentFlashcardIndex].id, true);
                                          }}
                                        >
                                          <ThumbsUp className="w-4 h-4 mr-2" />
                                          I Know It
                                        </Button>
                                        <Button
                                          variant="outline"
                                          className="flex-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFlashcardKnown(message.flashcards![currentFlashcardIndex].id, false);
                                          }}
                                        >
                                          <ThumbsDown className="w-4 h-4 mr-2" />
                                          Review Again
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          </AnimatePresence>

                          {/* Navigation Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={currentFlashcardIndex === 0}
                              onClick={() => {
                                setCurrentFlashcardIndex((prev) => prev - 1);
                                setShowFlashcardBack(false);
                              }}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </Button>

                            <span className="text-sm text-muted-foreground">
                              {currentFlashcardIndex + 1} / {message.flashcards.length}
                            </span>

                            <Button
                              variant="outline"
                              size="icon"
                              disabled={currentFlashcardIndex === message.flashcards.length - 1}
                              onClick={() => {
                                setCurrentFlashcardIndex((prev) => prev + 1);
                                setShowFlashcardBack(false);
                              }}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quiz Messages */}
                  {message.type === 'quiz' && message.quizData && (
                    <div className="w-full rounded-2xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg">
                      <p className="mb-6 text-foreground">{message.content}</p>

                      <div className="space-y-6">
                        {message.quizData.map((question, qIndex) => (
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
                                  className={`w-full justify-start text-left ${quizAnswers[question.id] === oIndex
                                      ? 'border-blue-500 bg-blue-500/10'
                                      : ''
                                    }`}
                                  onClick={() => {
                                    setQuizAnswers((prev) => ({
                                      ...prev,
                                      [question.id]: oIndex,
                                    }));
                                  }}
                                >
                                  <span className="mr-3 text-muted-foreground">{String.fromCharCode(65 + oIndex)}.</span>
                                  {option}
                                  {quizAnswers[question.id] === oIndex && (
                                    <Check className="w-4 h-4 ml-auto text-blue-400" />
                                  )}
                                </Button>
                              ))}
                            </div>

                            {quizAnswers[question.id] !== undefined && (
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

                        {Object.keys(quizAnswers).length === message.quizData.length && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30"
                          >
                            <p className="text-2xl mb-2 text-foreground">
                              🎉 Quiz Complete!
                            </p>
                            <p className="text-muted-foreground">
                              Score: {Object.values(quizAnswers).filter((answer, idx) => answer === message.quizData![idx].correctAnswer).length} / {message.quizData.length}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="rounded-3xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Tutor is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <p className="text-foreground">Uploading and processing document...</p>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Bottom Input Bar - Always Visible */}
        <div className="border-t border-border p-4 flex-shrink-0 bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="max-w-5xl mx-auto">
            {/* Active Persona Tag & Shortcuts */}



            {pendingFile && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />
                  <span className="truncate text-sm text-foreground">{pendingFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 rounded-full"
                  onClick={() => {
                    setPendingFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full flex-shrink-0"
                onClick={() => setUploadModalOpen(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>

              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${getCurrentPersona().name} anything...`}
                  className="rounded-full pr-24  border-2 border-blue-500/30 focus:border-blue-500/50 glow-blue-purple"
                />
              </div>

              <Button
                size="icon"
                className="rounded-full flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && !pendingFile}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Desktop */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="hidden lg:flex w-80 border-l border-border p-6 flex-col gap-6 h-screen overflow-y-auto bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl fixed lg:relative z-30 right-0"
          >
            {/* Close Button */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg">Session Info</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightSidebarOpen(false)}
                className="hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Focus Meter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-400" />
                  Focus Meter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - contextFocusScore / 100)}`}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - contextFocusScore / 100) }}
                      transition={{ duration: 1 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl gradient-text">{contextFocusScore}%</p>
                    <p className="text-xs text-secondary">Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Documents */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents ({uploadedDocs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {uploadedDocs.length === 0 ? (
                    <p className="text-sm text-secondary text-center py-8">
                      No documents uploaded yet
                    </p>
                  ) : (
                    uploadedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg bg-card border border-border hover:border-blue-500/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {doc.type === 'pdf' && <FileText className="w-4 h-4 text-red-400" />}
                          {doc.type === 'Word' && <FileText className="w-4 h-4 text-blue-400" />}
                          {doc.type === 'ppt' && <Presentation className="w-4 h-4 text-orange-400" />}
                          {doc.type === 'image' && <Camera className="w-4 h-4 text-cyan-400" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-secondary">
                              {doc.uploadDate.toLocaleDateString()}
                            </p>
                          </div>
                          {doc.processed && (
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                variant="outline"
                onClick={() => {
                  void handleCreateFlashcardsFromChat();
                  setRightSidebarOpen(false);
                }}
              >
                <Layers className="w-4 h-4" />
                Create Flashcards from Chat
              </Button>

              <Button
                className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                variant="outline"
                onClick={() => {
                  void handleCreateQuizFromChat();
                  setRightSidebarOpen(false);
                }}
              >
                <ListChecks className="w-4 h-4" />
                Create Quiz from Chat
              </Button>

              <Button
                className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                variant="outline"
                onClick={handleExportDeck}
              >
                <Download className="w-4 h-4" />
                Export Deck
              </Button>

              <Button
                className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                variant="outline"
                onClick={handleShareDeck}
              >
                <Share2 className="w-4 h-4" />
                Share Deck
              </Button>
            </div>

            {/* Session Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Total Cards:</span>
                  <span>12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Known:</span>
                  <span className="text-green-400">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">To Review:</span>
                  <span className="text-yellow-400">4</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Focus Score:</span>
                  <span className="gradient-text">{contextFocusScore}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Sidebar - Mobile Sheet */}
      <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
        <SheetContent side="right" className="w-80 p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Session Info
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Focus Meter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-400" />
                  Focus Meter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient-mobile)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - contextFocusScore / 100)}`}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - contextFocusScore / 100) }}
                      transition={{ duration: 1 }}
                    />
                    <defs>
                      <linearGradient id="gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl gradient-text">{contextFocusScore}%</p>
                    <p className="text-xs text-secondary">Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── STRICT MODE ── */}
            <Card className={`transition-all duration-300 ${isStrictMode
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-border'
              }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${isStrictMode ? 'text-amber-400' : 'text-slate-400'}`} />
                  Strict Mode
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isStrictMode
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-500/20 text-slate-400'
                    }`}>
                    {isStrictMode ? 'ON' : 'OFF'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-secondary leading-relaxed">
                  {isStrictMode
                    ? 'Distractions are blocked. Stay locked in and finish your session.'
                    : 'Enable to block distractions and enforce deep focus during your session.'}
                </p>
                {isStrictMode && (
                  <p className="text-xs text-amber-400">
                    Tab distractions blocked: {distractionCount}
                  </p>
                )}
                <p className="text-xs text-secondary">
                  Focus drifts detected: {focusDriftCount}
                </p>
                <Button
                  className={`w-full h-10 gap-2 font-medium transition-all ${isStrictMode
                      ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-500/40 hover:from-amber-500/30 hover:to-red-500/30 text-amber-400'
                      : 'bg-gradient-to-r from-slate-500/10 to-slate-400/10 border-slate-400/30 hover:from-slate-500/20 hover:to-slate-400/20 text-slate-400'
                    }`}
                  variant="outline"
                  onClick={handleToggleStrictMode}
                >
                  <ShieldAlert className="w-4 h-4" />
                  {isStrictMode ? 'Disable Strict Mode' : 'Enable Strict Mode'}
                </Button>
              </CardContent>
            </Card>
            {/* ── END STRICT MODE ── */}

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                variant="outline"
                onClick={() => {
                  void handleCreateFlashcardsFromChat();
                  setRightSidebarOpen(false);
                }}
              >
                <Layers className="w-4 h-4" />
                Create Flashcards from Chat
              </Button>

              <Button
                className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
                variant="outline"
                onClick={() => {
                  void handleCreateQuizFromChat();
                  setRightSidebarOpen(false);
                }}
              >
                <ListChecks className="w-4 h-4" />
                Create Quiz from Chat
              </Button>

            </div>

            {/* Session Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Total Cards:</span>
                  <span>12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Known:</span>
                  <span className="text-green-400">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">To Review:</span>
                  <span className="text-yellow-400">4</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Focus Score:</span>
                  <span className="gradient-text">{contextFocusScore}%</span>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-secondary text-center pt-4">
              Documents: {uploadedDocs.length}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* File Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload PDFs, PowerPoints, Ms Word, or text files for AI analysis and flashcard generation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">

            <input
              ref={fileInputRef}
              type="file"
              accept={fileAccept}
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => openFilePicker('.pdf')}
              >
                <FileText className="w-8 h-8 text-red-400" />
                <span className="text-sm">PDF</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => openFilePicker('.ppt,.pptx')}
              >
                <Presentation className="w-8 h-8 text-orange-400" />
                <span className="text-sm">PowerPoint</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => openFilePicker('.doc,.docx')}
              >
                <FileText className="w-8 h-8 text-blue-400" />
                <span className="text-sm">Ms Word</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => openFilePicker('.txt')}
              >
                <FileText className="w-8 h-8 text-green-400" />
                <span className="text-sm">Text File</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {false && (
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
                <p>• When camera is off, emotional feedback popups appear every 30 seconds</p>
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
