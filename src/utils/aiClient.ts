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
let tutorThreadModel: string | null = null;

async function createTutorThread(provider: AIProvider, model?: string | null): Promise<number> {
  const authHeaders = await getAuthHeaders();
  const response = await backendClient.post(
    BACKEND_ROUTES.chatThreads,
    {
      title: 'FocusSpark AI Tutor',
      ai_provider: provider,
      ai_model: model?.trim() || undefined,
    },
    { headers: authHeaders },
  );

  const threadId = response.data?.id ?? response.data?.thread?.id;
  if (typeof threadId !== 'number') {
    throw new Error('Backend did not return a valid chat thread id');
  }

  return threadId;
}

async function getTutorThreadId(provider: AIProvider, model?: string | null): Promise<number> {
  const normalizedModel = model?.trim() || null;
  if (!tutorThreadIdPromise || tutorThreadProvider !== provider || tutorThreadModel !== normalizedModel) {
    tutorThreadProvider = provider;
    tutorThreadModel = normalizedModel;
    tutorThreadIdPromise = createTutorThread(provider, normalizedModel).catch((error) => {
      tutorThreadIdPromise = null;
      tutorThreadProvider = null;
      tutorThreadModel = null;
      throw error;
    });
  }

  return tutorThreadIdPromise;
}

export async function getOrCreateTutorThreadId(
  provider: AIProvider = 'openai',
  model?: string | null,
): Promise<number> {
  return getTutorThreadId(provider, model);
}

export function resetTutorThread(): void {
  tutorThreadIdPromise = null;
  tutorThreadProvider = null;
  tutorThreadModel = null;
}

async function sendChatPrompt(
  prompt: string,
  provider: AIProvider = 'openai',
  model?: string | null,
): Promise<AIResponse> {
  try {
    const threadId = await getTutorThreadId(provider, model);
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
  model?: string | null,
): Promise<AIResponse> {
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
  return sendChatPrompt(fullPrompt, provider, model);
}

export async function chatWithAITutor(
  message: string,
  conversationHistory: string = '',
  provider: AIProvider = 'openai',
  model?: string | null,
): Promise<AIResponse> {
  const context = `You are FocusSpark AI Tutor, an expert study coach. Provide clear, actionable guidance with real-world examples. Be direct, motivating, and focus on deep understanding.\n${conversationHistory ? `\nCONVERSATION HISTORY:\n${conversationHistory}\n` : ''}\nUSER: ${message}\n\nRespond naturally, helpfully, and in character. Keep responses concise but complete (2-4 paragraphs max).`;

  return generateAIResponse('', context, provider, model);
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
