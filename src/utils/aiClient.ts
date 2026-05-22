import { BACKEND_ROUTES } from '../config/backend';
import backendClient, { getAuthHeaders } from './backendClient';

export interface AIResponse {
  success: boolean;
  text: string;
  error?: string;
  messageId?: number;
}

export type AIProvider = 'openai' | 'gemini';

let tutorThreadIdPromise: Promise<number> | null = null;
let tutorThreadProvider: AIProvider | null = null;

async function createTutorThread(provider: AIProvider): Promise<number> {
  const authHeaders = await getAuthHeaders();
  const response = await backendClient.post(
    BACKEND_ROUTES.chatThreads,
    {
      title: 'FocusSpark AI Tutor',
      ai_provider: provider,
    },
    { headers: authHeaders },
  );

  const threadId = response.data?.id ?? response.data?.thread?.id;
  if (typeof threadId !== 'number') {
    throw new Error('Backend did not return a valid chat thread id');
  }

  return threadId;
}

async function getTutorThreadId(provider: AIProvider): Promise<number> {
  if (!tutorThreadIdPromise || tutorThreadProvider !== provider) {
    tutorThreadProvider = provider;
    tutorThreadIdPromise = createTutorThread(provider).catch((error) => {
      tutorThreadIdPromise = null;
      tutorThreadProvider = null;
      throw error;
    });
  }

  return tutorThreadIdPromise;
}

export async function getOrCreateTutorThreadId(provider: AIProvider = 'openai'): Promise<number> {
  return getTutorThreadId(provider);
}

export function resetTutorThread(): void {
  tutorThreadIdPromise = null;
  tutorThreadProvider = null;
}

async function sendChatPrompt(prompt: string, provider: AIProvider = 'openai'): Promise<AIResponse> {
  try {
    const threadId = await getTutorThreadId(provider);
    const authHeaders = await getAuthHeaders();
    const response = await backendClient.post(
      BACKEND_ROUTES.chatMessages,
      {
        thread_id: threadId,
        message: prompt,
      },
      { headers: authHeaders },
    );

    const text = response.data?.response;
    const messageId = response.data?.message_id;
    if (typeof text === 'string' && text.trim()) {
      return {
        success: true,
        text,
        messageId: typeof messageId === 'number' ? messageId : undefined,
      };
    }

    return {
      success: false,
      text: '',
      error: 'Backend returned an empty AI response',
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'AI request failed',
    };
  }
}

export async function generateAIResponse(
  prompt: string,
  context: string = '',
  provider: AIProvider = 'openai',
): Promise<AIResponse> {
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
  return sendChatPrompt(fullPrompt, provider);
}

export async function generateFlashcards(
  content: string,
  count: number = 10,
): Promise<AIResponse> {
  const authHeaders = await getAuthHeaders();
  const response = await backendClient.post(
    BACKEND_ROUTES.flashcardGenerate,
    { topic: content, card_count: count },
    { headers: authHeaders },
  );

  return {
    success: true,
    text: JSON.stringify(response.data),
  };
}

export async function generateQuiz(
  content: string,
  questionCount: number = 5,
): Promise<AIResponse> {
  void questionCount;
  const authHeaders = await getAuthHeaders();
  const response = await backendClient.post(
    BACKEND_ROUTES.quizGenerate,
    { topic: content },
    { headers: authHeaders },
  );

  return {
    success: true,
    text: JSON.stringify(response.data),
  };
}

export async function summarizeContent(
  content: string,
  bulletPoints: number = 5,
): Promise<AIResponse> {
  const context = `You are an expert at distilling complex information. Create a concise summary with exactly ${bulletPoints} key points from the following content. Format as:\n\n📚 SUMMARY:\n[2-sentence overview]\n\n🔑 KEY POINTS:\n1. [First key point]\n2. [Second key point]\n...\n\nMake it clear, actionable, and perfect for quick review.`;

  return generateAIResponse(content, context);
}

export async function getStudySuggestions(
  topic: string,
  progress: string,
): Promise<AIResponse> {
  const context = `You are FocusSpark AI Tutor, an expert study coach. Provide 3 personalized, actionable study suggestions based on:\n- Topic: ${topic}\n- Current situation: ${progress}\n\nFormat as:\n💡 SUGGESTION 1: [Title]\n[Brief explanation]\n\n💡 SUGGESTION 2: [Title]\n[Brief explanation]\n\n💡 SUGGESTION 3: [Title]\n[Brief explanation]\n\nKeep suggestions practical, motivating, and science-backed.`;

  return generateAIResponse('', context);
}

export async function chatWithAITutor(
  message: string,
  conversationHistory: string = '',
  provider: AIProvider = 'openai',
): Promise<AIResponse> {
  const context = `You are FocusSpark AI Tutor, an expert study coach. Provide clear, actionable guidance with real-world examples. Be direct, motivating, and focus on deep understanding.\n${conversationHistory ? `\nCONVERSATION HISTORY:\n${conversationHistory}\n` : ''}\nUSER: ${message}\n\nRespond naturally, helpfully, and in character. Keep responses concise but complete (2-4 paragraphs max).`;

  return generateAIResponse('', context, provider);
}

export async function explainConcept(
  concept: string,
  level: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
): Promise<AIResponse> {
  const context = `Explain "${concept}" for a ${level} learner. Use:\n- Simple language and clear examples\n- Real-world analogies\n- Step-by-step breakdown if needed\n\nFormat:\n🎯 SIMPLE EXPLANATION:\n[2-3 sentences]\n\n📖 DETAILED BREAKDOWN:\n[Clear explanation with examples]\n\n💡 KEY TAKEAWAY:\n[One memorable insight]`;

  return generateAIResponse('', context);
}

export async function generatePracticeProblems(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  count: number = 3,
): Promise<AIResponse> {
  const context = `Generate ${count} ${difficulty} practice problems for: ${topic}\n\nFormat each as:\nPROBLEM X:\n[Problem statement]\n\nHINT: [Helpful hint]\nSOLUTION: [Step-by-step solution]\n\n---\n\nMake problems realistic and educational.`;

  return generateAIResponse('', context);
}

export async function fetchFlashcardsFromChat(messageId: number): Promise<AIResponse> {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await backendClient.post(
      BACKEND_ROUTES.flashcardFromChat,
      { message_id: messageId },
      { headers: authHeaders },
    );

    return { success: true, text: JSON.stringify(response.data) };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to fetch flashcards from chat',
    };
  }
}

export async function fetchQuizFromChat(messageId: number): Promise<AIResponse> {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await backendClient.post(
      BACKEND_ROUTES.quizFromChat,
      { message_id: messageId },
      { headers: authHeaders },
    );

    return { success: true, text: JSON.stringify(response.data) };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to fetch quiz from chat',
    };
  }
}
