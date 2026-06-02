export interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  example?: string;
  memoryTip?: string;
  source: 'Topic' | 'Chat' | 'Document';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lastReviewed?: Date;
  correctCount: number;
  reviewInterval: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  topic?: string;
  cards: Flashcard[];
  totalCards: number;
  progress: number;
  accuracy: number;
  reviewCount: number;
  createdAt?: Date;
  lastReviewed?: Date;
  sourceType: 'Topic' | 'Chat' | 'Document';
  linkedDocument?: string;
}

export const CHAT_HISTORY_FLASHCARDS_KEY = 'focusspark-chat-history-flashcards';

export const getReviewIntervalDays = (known: boolean) => (known ? 3 : 1);

type RawRecord = Record<string, unknown>;

const parseDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getDeckSourceType = (d: RawRecord): Deck['sourceType'] => {
  const sourceText = String(d.source_type ?? d.sourceType ?? d.source ?? '').toLowerCase();
  if (sourceText.includes('chat') || d.chat_id || d.thread_id || d.message_id) return 'Chat';
  if (sourceText.includes('document') || d.document_id || d.linked_document_id) return 'Document';
  return 'Topic';
};

export const getSourceBadgeClassName = (sourceType: Deck['sourceType']) => {
  if (sourceType === 'Chat') {
    return 'flashcard-source-badge flashcard-source-badge-chat';
  }

  if (sourceType === 'Document') {
    return 'flashcard-source-badge flashcard-source-badge-document';
  }

  return 'flashcard-source-badge flashcard-source-badge-topic';
};

export const getDifficultyBadgeClassName = (difficulty: Flashcard['difficulty']) => {
  if (difficulty === 'Easy') return 'flashcard-difficulty-badge flashcard-difficulty-easy';
  if (difficulty === 'Hard') return 'flashcard-difficulty-badge flashcard-difficulty-hard';
  return 'flashcard-difficulty-badge flashcard-difficulty-medium';
};

export const isGenericChatFlashcardTitle = (value: unknown) => {
  const title = String(value ?? '').trim().toLowerCase();
  return !title || title === 'chat flashcards' || title === 'flashcards' || title === 'flashcard deck';
};

export const normalizeDeckTitle = (value: unknown) => {
  const title = String(value ?? '').trim();
  if (!title) return '';
  const strippedTitle = title.replace(/\s+flashcards$/i, '').trim() || title;
  return strippedTitle.charAt(0).toUpperCase() + strippedTitle.slice(1);
};

export const isSameLabel = (left: unknown, right: unknown) =>
  String(left ?? '').trim().toLowerCase() === String(right ?? '').trim().toLowerCase();

const getTitleFromRawCards = (value: unknown) => {
  const payload = value as Record<string, unknown> | undefined;
  const cards = Array.isArray(payload?.flashcards)
    ? payload.flashcards
    : Array.isArray(payload?.cards)
      ? payload.cards
      : [];
  const firstCard = cards[0] as Record<string, unknown> | undefined;
  const firstQuestion = String(firstCard?.front ?? firstCard?.question ?? firstCard?.title ?? '').trim();
  return firstQuestion;
};

export const mapDeck = (value: unknown): Deck => {
  const d = (value ?? {}) as RawRecord;
  const rawTitle = normalizeDeckTitle(d.title || d.name);
  const topicTitle = normalizeDeckTitle(d.topic ?? d.subject);
  const firstCardTitle = normalizeDeckTitle(getTitleFromRawCards(d));
  const title = isGenericChatFlashcardTitle(rawTitle)
    ? firstCardTitle || topicTitle || 'Untitled Flashcards'
    : rawTitle;
  const rawDescription = normalizeDeckTitle(d.description);
  const description = rawDescription && !isSameLabel(rawDescription, title)
    ? rawDescription
    : topicTitle && !isSameLabel(topicTitle, title)
      ? topicTitle
      : firstCardTitle && !isSameLabel(firstCardTitle, title)
        ? firstCardTitle
        : '';

  return {
    id: String(d.id),
    title,
    description,
    topic: topicTitle || undefined,
    cards: [],
    totalCards: Number(d.total_cards ?? 0),
    progress: Number(d.progress ?? d.completion_percentage ?? 0),
    accuracy: Number(d.accuracy ?? d.correct_percentage ?? 0),
    reviewCount: Number(d.review_count ?? d.reviewCount ?? d.total_reviews ?? d.totalReviews ?? 0),
    createdAt: parseDate(d.created_at ?? d.createdAt),
    lastReviewed: parseDate(d.last_reviewed ?? d.lastReviewed),
    sourceType: getDeckSourceType(d),
    linkedDocument: d.linked_document ?? d.linkedDocument ?? d.linked_document_id
      ? String(d.linked_document ?? d.linkedDocument ?? d.linked_document_id)
      : undefined,
  };
};

export const mapCard = (value: unknown): Flashcard => {
  const c = (value ?? {}) as RawRecord;
  const sourceText = String(c.source_type ?? c.sourceType ?? c.source ?? '').toLowerCase();
  const source = sourceText.includes('chat')
    ? 'Chat'
    : sourceText.includes('document')
      ? 'Document'
      : 'Topic';
  const difficulty = ['Easy', 'Medium', 'Hard'].includes(String(c.difficulty))
    ? String(c.difficulty) as Flashcard['difficulty']
    : 'Medium';

  return {
    id: String(c.id),
    front: String(c.front ?? ''),
    back: String(c.back ?? ''),
    explanation: String(c.explanation ?? ''),
    example: String(c.example ?? ''),
    memoryTip: String(c.memory_tip ?? c.memoryTip ?? ''),
    source,
    difficulty,
    lastReviewed: parseDate(c.last_reviewed ?? c.lastReviewed),
    correctCount: Number(c.correct_count ?? c.correctCount ?? 0),
    reviewInterval: Number(c.review_interval ?? c.reviewInterval ?? 1),
  };
};
