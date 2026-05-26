export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  relatedFlashcardId?: string;
  topic: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  topic?: string;
  sourceType?: QuizSourceType;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: QuizQuestion[];
  timeLimit?: number;
  passingScore: number;
  totalAttempts: number;
  questionCount: number;
  bestScore: number;
  averageScore: number;
  createdAt?: Date;
  lastAttempted?: Date;
  tags: string[];
  linkedDocument?: string;
}

export type QuizSourceType = 'Chat' | 'Topic';

export const CHAT_HISTORY_QUIZ_KEY = 'focusspark-chat-history-quiz';

const DIFFICULTY_TIME_LIMITS: Record<Quiz['difficulty'], number> = {
  Beginner: 5 * 60,
  Intermediate: 10 * 60,
  Advanced: 15 * 60,
};

export const normalizeDifficulty = (difficulty: unknown): Quiz['difficulty'] => {
  const value = String(difficulty || '').toLowerCase();
  if (value === 'advanced') return 'Advanced';
  if (value === 'intermediate') return 'Intermediate';
  return 'Beginner';
};

export const getQuizTimeLimit = (quiz: Pick<Quiz, 'difficulty' | 'timeLimit'>) =>
  quiz.timeLimit ?? DIFFICULTY_TIME_LIMITS[quiz.difficulty];

export const isGenericChatQuizTitle = (title: unknown) => {
  const normalized = String(title ?? '').trim().toLowerCase();
  return (
    normalized === '' ||
    normalized === 'chat quiz' ||
    normalized === 'quiz' ||
    normalized === 'chat' ||
    normalized === 'generated quiz'
  );
};

export const toQuizHeadingFromQuestion = (question: unknown) => {
  const text = String(question ?? '').trim();
  if (!text) return 'Quiz';
  const heading = text.length > 80 ? `${text.slice(0, 77).trimEnd()}...` : text;
  return heading.charAt(0).toUpperCase() + heading.slice(1);
};

const stripTrailingQuizWord = (title: unknown) => {
  const rawTitle = String(title ?? '').trim();
  if (!rawTitle) return '';
  const strippedTitle = rawTitle.replace(/\s+quiz$/i, '').trim();
  return strippedTitle || rawTitle;
};

const capitalizeFirstLetter = (value: unknown) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const normalizeQuizTitle = (value: unknown) => capitalizeFirstLetter(stripTrailingQuizWord(value));

export const parseQuizDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getFirstQuestionTitle = (questions: unknown) => {
  if (!Array.isArray(questions) || questions.length === 0) return '';
  const first = questions[0] as Record<string, unknown> | undefined;
  const question = String(first?.question ?? first?.title ?? '').trim();
  return question;
};

export const deriveDisplayQuizTitle = ({
  rawTitle,
  fallbackTopic,
  questions,
}: {
  rawTitle: unknown;
  fallbackTopic?: unknown;
  questions?: unknown;
}) => {
  if (!isGenericChatQuizTitle(rawTitle)) {
    return normalizeQuizTitle(rawTitle);
  }

  const firstQuestion = getFirstQuestionTitle(questions);
  if (firstQuestion) return toQuizHeadingFromQuestion(firstQuestion);

  const topic = String(fallbackTopic ?? '').trim();
  if (topic && topic.toLowerCase() !== 'general') {
    return normalizeQuizTitle(topic);
  }

  return 'Untitled Quiz';
};

export const normalizeQuizSourceType = (value: unknown): QuizSourceType | undefined => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return undefined;
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
  if (tokens.includes('chat')) return 'Chat';
  if (tokens.includes('topic')) return 'Topic';
  if (normalized === 'chat') return 'Chat';
  if (normalized === 'topic') return 'Topic';
  return undefined;
};

export const getQuizSourceType = (
  quiz: Pick<Quiz, 'sourceType' | 'category' | 'tags' | 'description'>,
): QuizSourceType => {
  if (quiz.sourceType) return quiz.sourceType;

  const category = String(quiz.category ?? '').trim().toLowerCase();
  const tags = Array.isArray(quiz.tags) ? quiz.tags.map((tag) => String(tag).trim().toLowerCase()) : [];

  if (category === 'chat' || tags.includes('chat')) {
    return 'Chat';
  }

  return 'Topic';
};

export const getQuizSourceBadgeClassName = (source: QuizSourceType) =>
  source === 'Chat'
    ? 'flashcard-source-badge flashcard-source-badge-chat'
    : 'flashcard-source-badge flashcard-source-badge-topic';

const normalizeCorrectAnswerIndex = (
  value: unknown,
  choices: string[],
  preferOneBased = false,
) => {
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    const letterMatch = normalizedValue.match(/(?:^|\b)(?:option\s*)?([a-z])(?:\b|$)/);
    if (letterMatch) {
      const letterIndex = letterMatch[1].charCodeAt(0) - 'a'.charCodeAt(0);
      if (letterIndex >= 0 && letterIndex < choices.length) return letterIndex;
    }
  }

  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numericValue)) return 0;

  const index = Math.trunc(numericValue);
  if (preferOneBased && index >= 1 && index <= choices.length) return index - 1;
  if (index >= 0 && index < choices.length) return index;
  if (index >= 1 && index - 1 < choices.length) return index - 1;

  return 0;
};

export const normalizeCorrectAnswer = (question: any, choices: string[]) => {
  const candidateKeys = [
    'correct_answer_index',
    'correctAnswer',
    'correct_answer',
    'correct_option',
    'correctOption',
    'correct_choice',
    'correctChoice',
    'answer_index',
    'answerIndex',
    'answer',
  ];

  for (const key of candidateKeys) {
    const candidate = question[key];
    if (candidate === undefined || candidate === null || candidate === '') continue;

    if (typeof candidate === 'string') {
      const answerText = candidate.trim().toLowerCase();
      const answerIndex = choices.findIndex((choice) => String(choice).trim().toLowerCase() === answerText);
      if (answerIndex >= 0) return answerIndex;
    }

    const preferOneBased =
      key === 'correct_answer' ||
      key === 'correct_option' ||
      key === 'correctOption' ||
      key === 'correct_choice' ||
      key === 'correctChoice';
    const answerIndex = normalizeCorrectAnswerIndex(candidate, choices, preferOneBased);
    if (answerIndex >= 0 && answerIndex < choices.length) return answerIndex;
  }

  return 0;
};

export const mapQuizQuestion = (question: any): QuizQuestion => {
  const choices = question.choices || question.options || [];
  const mappedQuestion = {
    id: String(question.id),
    question: question.question,
    choices,
    correctAnswer: normalizeCorrectAnswer(question, choices),
    explanation: question.explanation || '',
    relatedFlashcardId: question.related_flashcard_id ?? question.relatedFlashcardId,
    topic: question.topic || '',
  };

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[QuizScreen] mapped question answer', {
      id: mappedQuestion.id,
      rawCorrectAnswer: question.correct_answer,
      rawCorrectAnswerIndex: question.correct_answer_index,
      rawCorrectOption: question.correct_option ?? question.correctOption,
      rawCorrectChoice: question.correct_choice ?? question.correctChoice,
      rawAnswerIndex: question.answer_index ?? question.answerIndex,
      rawAnswer: question.answer,
      mappedCorrectAnswer: mappedQuestion.correctAnswer,
      choices,
    });
  }

  return mappedQuestion;
};
