import { useState } from 'react';
import type { AIProvider } from '../../utils/aiClient';
import {
  AI_MODELS,
  createInitialMessages,
  type AIModelId,
  type Message,
  type UploadedDocument,
} from '../../pages/chat/types/ChatTypes';

export function useChatbotWorkspace() {
  const [messages, setMessages] = useState<Message[]>(createInitialMessages);
  const [inputValue, setInputValue] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fileAccept, setFileAccept] = useState('.pdf,.ppt,.pptx,.doc,.docx,.txt');
  const [selectedModel, setSelectedModel] = useState<AIModelId>('openai');
  const [currentThreadProvider, setCurrentThreadProvider] = useState<AIProvider | null>(null);
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
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const [showEmotionalFeedback, setShowEmotionalFeedback] = useState(false);

  const isThreadModelLocked = currentThreadProvider !== null;
  const activeModel = currentThreadProvider ?? selectedModel;
  const activeModelDetails = AI_MODELS.find((model) => model.id === activeModel) ?? AI_MODELS[0];

  return {
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
    currentThreadProvider,
    setCurrentThreadProvider,
    pendingFile,
    setPendingFile,
    uploadedDocs,
    setUploadedDocs,
    isProcessing,
    setIsProcessing,
    uploadProgress,
    setUploadProgress,
    currentFlashcardIndex,
    setCurrentFlashcardIndex,
    showFlashcardBack,
    setShowFlashcardBack,
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
  };
}
