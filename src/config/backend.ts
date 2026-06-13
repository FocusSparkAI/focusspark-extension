const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;

export const BACKEND_BASE_URL = backendBaseUrl.replace(/\/+$/, '');

export const BACKEND_ROUTES = {
  // AI endpoints (use specific feature endpoints on backend)
  aiGenerate: '/flashcards/generate', // frontend uses backend AI via feature endpoints (flashcards/quiz/chat)
  faceApiWeights: '/models/face-api/weights',
  analyze: '/analyze',
  ws: '/ws',

  // Auth endpoints
  authLogin: '/auth/login',
  authProfile: '/auth/profile',

  // Chat endpoints
  chatThreads: '/chat/threads',
  chatMessages: '/chat',
  chatDocument: '/chat/document',
  chatMessageArtifacts: '/chat/message/{message_id}/artifacts', // replace {message_id}

  // Flashcards
  flashcards: '/flashcards',
  flashcardGenerate: '/flashcards/generate',
  flashcardFromChat: '/flashcards/from-chat',
  flashcardReviews: '/flashcards/reviews',
  flashcardReviewComplete: '/flashcards/{deck_id}/review-complete', // replace {deck_id}

  // Quizzes
  quiz: '/quiz',
  quizGenerate: '/quiz/generate',
  quizFromChat: '/quiz/from-chat',
  quizAttempts: '/quiz/{quiz_id}/attempts', // replace {quiz_id}

  // Study notifications
  studyNotifications: '/study/notifications',
  studyNotification: '/study/notifications/{notification_id}', // replace {notification_id}
  studyNotificationsReadAll: '/study/notifications/read-all',
  studyDashboardStats: '/study/stats/dashboard',
  studyGoals: '/study/goals',
  studySettings: '/study/settings',
  studySessions: '/study/sessions',
  studySessionComplete: '/study/sessions/{session_id}/complete',
} as const;

export function buildBackendUrl(path: string): string {
  return new URL(path, BACKEND_BASE_URL).toString();
}

export function buildBackendWsUrl(path: string): string {
  const url = new URL(path, BACKEND_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
