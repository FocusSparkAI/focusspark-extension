export interface Message {
  id: string;
  type: 'user' | 'ai' | 'flashcard' | 'quiz' | 'system';
  content: string;
  timestamp: Date;
  attachmentName?: string;
  backendMessageId?: number;
  artifactId?: number;
  artifactTitle?: string;
  artifactTopic?: string;
  flashcards?: Flashcard[];
  quizData?: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  title: string;
  topic?: string;
  front: string;
  back: string;
  example?: string;
  memoryTip?: string;
  examShortcut?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  known: boolean;
  reviewed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'ppt' | 'Word' | 'text' | 'image';
  uploadDate: Date;
  processed: boolean;
}

export const AI_MODELS = [
  { id: 'openai', name: 'ChatGPT', description: 'Balanced and conversational' },
  { id: 'gemini', name: 'Gemini', description: 'Structured and analytical' },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]['id'];

export const CHAT_QUIZ_PROGRESS_KEY = 'focusspark-chat-quiz-progress';
export const CHAT_FLASHCARD_PROGRESS_KEY = 'focusspark-chat-flashcard-progress';

export const createInitialMessages = (): Message[] => [
  {
    id: '1',
    type: 'ai',
    content: "Hi, I'm your AI tutor. Ask a question or upload study material whenever you're ready.",
    timestamp: new Date(),
  },
];
