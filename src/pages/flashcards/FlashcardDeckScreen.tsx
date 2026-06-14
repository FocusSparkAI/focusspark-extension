import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Search,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Check,
  Sparkles,
  Home,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_ROUTES } from '../../config/backend';
import backendClient, { getAuthHeaders } from '../../utils/backendClient';
import type { Deck, Flashcard } from '../../types/FlashcardTypes';
import {
  CHAT_HISTORY_FLASHCARDS_KEY,
  getDifficultyBadgeClassName,
  getSourceBadgeClassName,
  isGenericChatFlashcardTitle,
  isSameLabel,
  mapCard,
  mapDeck,
  normalizeDeckTitle,
} from '../../types/FlashcardTypes';
import { CHAT_FLASHCARD_PROGRESS_KEY } from '../../types/ChatTypes';
import { formatUserDate } from '../../utils/timezone';
import { getStoredValue, setStoredValue } from '../../utils/chromeStorage';
import { FlashcardReviewSummaryDialog } from './FlashcardReviewSummaryDialog';

interface FlashcardDeckScreenProps {
  onNavigate: (page: string) => void;
}

let chatFlashcardProgressCache: Record<string, Record<string, unknown>> = {};
let flashcardReviewProgressCache: Record<string, Record<string, unknown>> = {};

const FLASHCARD_REVIEW_PROGRESS_KEY = 'focusspark-flashcard-review-progress';

const chatFlashcardProgressReady = getStoredValue(CHAT_FLASHCARD_PROGRESS_KEY).then((raw) => {
  try {
    if (!raw) return;
    const parsed = JSON.parse(raw);
    chatFlashcardProgressCache = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, Record<string, unknown>>
      : {};
  } catch {
    chatFlashcardProgressCache = {};
  }
});

const readChatFlashcardProgress = (): Record<string, Record<string, unknown>> => chatFlashcardProgressCache;

const flashcardReviewProgressReady = getStoredValue(FLASHCARD_REVIEW_PROGRESS_KEY).then((raw) => {
  try {
    if (!raw) return;
    const parsed = JSON.parse(raw);
    flashcardReviewProgressCache = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, Record<string, unknown>>
      : {};
  } catch {
    flashcardReviewProgressCache = {};
  }
});

const readFlashcardReviewProgress = (): Record<string, Record<string, unknown>> => flashcardReviewProgressCache;
const storedFlashcardProgressReady = Promise.all([chatFlashcardProgressReady, flashcardReviewProgressReady]);

const parseProgressDate = (value: unknown) => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getDeckProgressRecord = (deck: Deck) => {
  const records = readChatFlashcardProgress();
  return records[`id:${deck.id}`] ?? records[`title:${deck.title.trim().toLowerCase()}`];
};

const getCardProgressRecord = (deck: Deck, card: Flashcard) => {
  const records = readFlashcardReviewProgress();
  return records[`deck:${deck.id}:card:${card.id}`] ?? records[`card:${card.id}`];
};

const getDeckReviewProgressRecord = (deck: Deck) => readFlashcardReviewProgress()[`deck:${deck.id}`];

const applyFlashcardReviewProgress = (deck: Deck): Deck => {
  const deckRecord = getDeckReviewProgressRecord(deck);
  const savedReviewCount = Number(deckRecord?.reviewCount);
  const savedAccuracy = Number(deckRecord?.accuracy);
  const savedProgress = Number(deckRecord?.progress);
  const savedLastReviewed = parseProgressDate(deckRecord?.lastReviewed);
  const totalCards = deck.totalCards || deck.cards.length;
  const hasCompletedSavedAttempt = totalCards > 0 && Number.isFinite(savedReviewCount) && savedReviewCount >= totalCards;
  const cards = deck.cards.map((card) => {
    const record = hasCompletedSavedAttempt ? getCardProgressRecord(deck, card) : undefined;
    if (!record) return card;

    const correctCount = Number(record.correctCount);
    const incorrectCount = Number(record.incorrectCount);
    const lastReviewed = parseProgressDate(record.lastReviewed);

    return {
      ...card,
      correctCount: Number.isFinite(correctCount) ? Math.max(card.correctCount, correctCount) : card.correctCount,
      incorrectCount: Number.isFinite(incorrectCount) ? Math.max(card.incorrectCount, incorrectCount) : card.incorrectCount,
      known: typeof record.known === 'boolean' ? record.known : card.known,
      lastReviewed: lastReviewed ?? card.lastReviewed,
    };
  });

  const lastReviewedTimes = cards
    .map((card) => card.lastReviewed?.getTime())
    .filter((time): time is number => typeof time === 'number' && Number.isFinite(time));
  const reviewedCount = cards.filter((card) => card.lastReviewed).length;
  const totalCorrect = cards.reduce((sum, card) => sum + card.correctCount, 0);
  const totalIncorrect = cards.reduce((sum, card) => sum + card.incorrectCount, 0);
  const totalAttempts = totalCorrect + totalIncorrect;
  const latestKnownCount = cards.filter((card) => card.known === true).length;
  const hasLatestAttemptResult = totalCards > 0 && reviewedCount >= totalCards && cards.some((card) => typeof card.known === 'boolean');
  const latestAttemptProgress = hasLatestAttemptResult ? Math.round((latestKnownCount / totalCards) * 100) : undefined;

  return {
    ...deck,
    cards,
    reviewCount: Math.max(deck.reviewCount, reviewedCount, hasCompletedSavedAttempt ? savedReviewCount : 0),
    progress: totalCards > 0
      ? latestAttemptProgress ?? Math.max(
        deck.progress,
        Number.isFinite(savedProgress) ? savedProgress : 0,
      )
      : deck.progress,
    accuracy: totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : hasCompletedSavedAttempt && Number.isFinite(savedAccuracy) ? savedAccuracy : deck.accuracy,
    lastReviewed:
      deck.lastReviewed ??
      (hasCompletedSavedAttempt ? savedLastReviewed : undefined) ??
      (lastReviewedTimes.length > 0 ? new Date(Math.max(...lastReviewedTimes)) : undefined),
  };
};

const applyStoredFlashcardProgress = (deck: Deck): Deck =>
  applyFlashcardReviewProgress(applyChatFlashcardProgress(deck));

const applyChatFlashcardProgress = (deck: Deck): Deck => {
  const record = getDeckProgressRecord(deck);
  if (!record) return deck;

  const reviewCount = Number(record.reviewCount ?? 0);
  const progress = Number(record.progress ?? deck.progress);
  const accuracy = Number(record.accuracy ?? deck.accuracy);
  const lastReviewed = parseProgressDate(record.lastReviewed);
  const knownCardIds = Array.isArray(record.knownCardIds)
    ? new Set(record.knownCardIds.map((cardId) => String(cardId)))
    : new Set<string>();

  return {
    ...deck,
    reviewCount: Math.max(deck.reviewCount, Number.isFinite(reviewCount) ? reviewCount : 0),
    progress: Number.isFinite(progress) ? Math.max(deck.progress, progress) : deck.progress,
    accuracy: Number.isFinite(accuracy) ? Math.max(deck.accuracy, accuracy) : deck.accuracy,
    lastReviewed: deck.lastReviewed ?? lastReviewed,
    cards: deck.cards.map((card) =>
      knownCardIds.has(card.id)
        ? {
            ...card,
            correctCount: Math.max(card.correctCount, 1),
            known: true,
            lastReviewed: card.lastReviewed ?? lastReviewed,
          }
        : card,
    ),
  };
};

const getDeckAccuracyFromCards = (cards: Flashcard[], fallback = 0) => {
  const totalCorrect = cards.reduce((sum, card) => sum + card.correctCount, 0);
  const totalIncorrect = cards.reduce((sum, card) => sum + card.incorrectCount, 0);
  const totalAttempts = totalCorrect + totalIncorrect;
  return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : fallback;
};

const saveFlashcardReviewProgress = async (deck: Deck, reviewedDeck: Deck, cardsToSave: Flashcard[] = []) => {
  const deckRecord = {
    deckId: deck.id,
    progress: reviewedDeck.progress,
    accuracy: reviewedDeck.accuracy,
    reviewCount: reviewedDeck.reviewCount,
    lastReviewed: reviewedDeck.lastReviewed?.toISOString(),
  };

  flashcardReviewProgressCache = {
    ...flashcardReviewProgressCache,
    [`deck:${deck.id}`]: deckRecord,
  };

  cardsToSave.forEach((card) => {
    const record = {
      deckId: deck.id,
      cardId: card.id,
      correctCount: card.correctCount,
      incorrectCount: card.incorrectCount,
      known: card.known,
      lastReviewed: card.lastReviewed?.toISOString(),
    };

    flashcardReviewProgressCache[`deck:${deck.id}:card:${card.id}`] = record;
    flashcardReviewProgressCache[`card:${card.id}`] = record;
  });

  await setStoredValue(FLASHCARD_REVIEW_PROGRESS_KEY, JSON.stringify(flashcardReviewProgressCache));
};

type FlashcardKeyboardHandlers = {
  revealCurrentCard: () => void;
  handleCardReview: (known: boolean) => Promise<void>;
  handlePreviousCard: () => void;
  handleNextCard: () => void;
  handleShuffle: () => void;
};

const getResponseStatus = (error: unknown) =>
  (error as { response?: { status?: number } }).response?.status;

const getResponseDetail = (error: unknown) =>
  (error as { response?: { data?: { detail?: string } } }).response?.data?.detail;

export function FlashcardDeckScreen({ onNavigate }: FlashcardDeckScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [isLoadingDeckDetails, setIsLoadingDeckDetails] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newCardCount, setNewCardCount] = useState('5');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(() => new Set());
  const [studyControlsLocked, setStudyControlsLocked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [answeredCardIds, setAnsweredCardIds] = useState<Set<string>>(() => new Set());
  const [attemptResults, setAttemptResults] = useState<Record<string, boolean>>({});
  const keyboardHandlersRef = useRef<FlashcardKeyboardHandlers>({
    revealCurrentCard: () => undefined,
    handleCardReview: (known: boolean) => {
      void known;
      return Promise.resolve();
    },
    handlePreviousCard: () => undefined,
    handleNextCard: () => undefined,
    handleShuffle: () => undefined,
  });

  const fetchDecks = async () => {
    setIsLoadingDecks(true);
    try {
      await storedFlashcardProgressReady;
      const authHeaders = await getAuthHeaders();
      const res = await backendClient.get(BACKEND_ROUTES.flashcards, { headers: authHeaders });
      const data = Array.isArray(res.data) ? res.data : [];
      const mappedDecks = data.map((d: unknown) => applyStoredFlashcardProgress(mapDeck(d)));
      setDecks(mappedDecks);

      const titledDecks = await Promise.all(
        mappedDecks.map(async (deck) => {
          if (!isGenericChatFlashcardTitle(deck.title)) return deck;

          try {
            const detailResponse = await backendClient.get(`${BACKEND_ROUTES.flashcards}/${deck.id}`, {
              headers: authHeaders,
            });
            const cards = (Array.isArray(detailResponse.data) ? detailResponse.data : []).map((c: unknown) => mapCard(c));
            const firstCardTitle = cards[0]?.front;
            if (!firstCardTitle) return deck;

            return applyStoredFlashcardProgress({
              ...deck,
              title: firstCardTitle,
              description: isGenericChatFlashcardTitle(deck.description) ? firstCardTitle : deck.description,
              cards,
              totalCards: cards.length,
            });
          } catch {
            return deck;
          }
        }),
      );

      setDecks(titledDecks.map((deck) => applyStoredFlashcardProgress(deck)));
    } catch (err: unknown) {
      const status = getResponseStatus(err);
      if (status === 401) {
        toast.error('Unauthorized. Please sign in to load flashcards.');
      } else {
        toast.error('Failed to load flashcard decks.');
      }
    } finally {
      setIsLoadingDecks(false);
    }
  };

  const fetchDeckById = async (deck: Deck) => {
    setIsLoadingDeckDetails(true);
    try {
      await storedFlashcardProgressReady;
      const authHeaders = await getAuthHeaders();
      const res = await backendClient.get(`${BACKEND_ROUTES.flashcards}/${deck.id}`, {
        headers: authHeaders,
      });
      const cards = (Array.isArray(res.data) ? res.data : []).map((c: unknown) => mapCard(c));
      if (cards.length === 0) {
        toast('This deck has no cards yet.');
        return;
      }

      setSelectedDeck(applyStoredFlashcardProgress({
        ...deck,
        title: isGenericChatFlashcardTitle(deck.title) ? cards[0].front : deck.title,
        description: isGenericChatFlashcardTitle(deck.description) ? cards[0].front : deck.description,
        cards,
        totalCards: cards.length,
      }));
      setCurrentCardIndex(0);
      setRevealedCardIds(new Set());
      setStudyControlsLocked(false);
      setAnsweredCardIds(new Set());
      setAttemptResults({});
      setShowSummary(false);
    } catch (err: unknown) {
      const status = getResponseStatus(err);
      if (status === 401) {
        toast.error('Unauthorized. Please sign in to open this deck.');
      } else {
        toast.error('Failed to load deck cards.');
      }
    } finally {
      setIsLoadingDeckDetails(false);
    }
  };

  const handleCreateDeck = () => {
    setShowCreateDialog(true);
  };

  const handleSubmitCreateDeck = async () => {
    if (!newTopic.trim()) {
      toast.error('Please enter a topic.');
      return;
    }

    const topicLabel = normalizeDeckTitle(newTopic);
    const previousDeckIds = new Set(decks.map((deck) => deck.id));

    setIsCreatingDeck(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await backendClient.post(
        BACKEND_ROUTES.flashcardGenerate,
        { topic: newTopic.trim(), card_count: Number(newCardCount) },
        { headers: authHeaders },
      );

      const createdDeck = mapDeck(res.data?.deck ?? {});
      const createdCards = Array.isArray(res.data?.flashcards)
        ? res.data.flashcards.map((c: unknown) => mapCard(c))
        : [];
      const createdTitle = isGenericChatFlashcardTitle(createdDeck.title) && createdCards[0]?.front
        ? createdCards[0].front
        : createdDeck.title;

      await fetchDecks();

      if (createdDeck.id && createdDeck.id !== 'undefined') {
        setSelectedDeck({ ...createdDeck, title: createdTitle, cards: createdCards, totalCards: createdCards.length });
        setCurrentCardIndex(0);
        setRevealedCardIds(new Set());
        setStudyControlsLocked(false);
        setAnsweredCardIds(new Set());
        setAttemptResults({});
        setShowSummary(false);
      }

      setShowCreateDialog(false);
      setNewTopic('');
      setNewCardCount('5');
      toast.success('Flashcard deck created successfully.');
    } catch (err: unknown) {
      const status = getResponseStatus(err);
      if (status === 401) {
        toast.error('Unauthorized. Please sign in to create flashcards.');
      } else {
        try {
          await storedFlashcardProgressReady;
          const authHeaders = await getAuthHeaders();
          const decksResponse = await backendClient.get(BACKEND_ROUTES.flashcards, { headers: authHeaders });
          const refreshedDecks = (Array.isArray(decksResponse.data) ? decksResponse.data : []).map((deck: unknown) => applyStoredFlashcardProgress(mapDeck(deck)));
          setDecks(refreshedDecks);

          const recoveredDeck = refreshedDecks.find((deck) =>
            !previousDeckIds.has(deck.id) &&
            (isSameLabel(deck.title, topicLabel) || isSameLabel(deck.topic, topicLabel)),
          );

          if (recoveredDeck) {
            await fetchDeckById(recoveredDeck);
            setShowCreateDialog(false);
            setNewTopic('');
            setNewCardCount('5');
            toast.success('Flashcard deck created successfully.');
            return;
          }
        } catch {
          // Keep the original create error message below.
        }

        if (status === 502) {
          toast.error('Flashcard generation failed at the backend. Please try again in a moment.');
        } else {
          toast.error(getResponseDetail(err) || 'Failed to create flashcard deck.');
        }
      }
    } finally {
      setIsCreatingDeck(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchDecks);
  }, []);

  useEffect(() => {
    const rawPendingDeck = sessionStorage.getItem(CHAT_HISTORY_FLASHCARDS_KEY);
    if (!rawPendingDeck) return;

    sessionStorage.removeItem(CHAT_HISTORY_FLASHCARDS_KEY);

    try {
      const payload = JSON.parse(rawPendingDeck) as {
        id?: string;
        deckId?: string | number;
        title?: string;
        topic?: string;
        description?: string;
        cards?: Array<Record<string, unknown>>;
      };
      const pendingDeckId = payload.deckId ?? payload.id;
      if (pendingDeckId && Number.isFinite(Number(pendingDeckId))) {
        void (async () => {
          try {
            await storedFlashcardProgressReady;
            const authHeaders = await getAuthHeaders();
            const decksResponse = await backendClient.get(BACKEND_ROUTES.flashcards, { headers: authHeaders });
            const deckList = Array.isArray(decksResponse.data) ? decksResponse.data : [];
            const matchingDeck = deckList.find((deck: Record<string, unknown>) => String(deck.id) === String(pendingDeckId));
            const deck = applyStoredFlashcardProgress(mapDeck(matchingDeck ?? {
              id: pendingDeckId,
              title: payload.title,
              topic: payload.topic,
              description: payload.description,
              source: 'chat',
            }));

            await fetchDeckById(deck);
          } catch {
            toast.error('Could not open the saved flashcard deck from chat history.');
          }
        })();
        return;
      }

      const cards = (payload.cards ?? [])
        .map((card, index): Flashcard => {
          const difficultyText = String(card.difficulty ?? '').toLowerCase();
          const difficulty: Flashcard['difficulty'] =
            difficultyText === 'easy' ? 'Easy' : difficultyText === 'hard' ? 'Hard' : 'Medium';

          return {
            id: String(card.id ?? `chat-history-card-${index}`),
            front: String(card.front ?? card.question ?? ''),
            back: String(card.back ?? card.answer ?? card.explanation ?? ''),
            explanation: typeof card.explanation === 'string' ? card.explanation : '',
            example: typeof card.example === 'string' ? card.example : '',
            memoryTip:
              typeof card.memoryTip === 'string'
                ? card.memoryTip
                : typeof card.memory_tip === 'string'
                  ? card.memory_tip
                  : '',
            source: 'Chat',
            difficulty,
            correctCount: Number(card.correctCount ?? card.correct_count ?? 0),
            incorrectCount: Number(card.incorrectCount ?? card.incorrect_count ?? 0),
            reviewInterval: 1,
          };
        })
        .filter((card) => card.front.length > 0 && card.back.length > 0);

      if (cards.length === 0) return;

      void Promise.resolve().then(async () => {
        await storedFlashcardProgressReady;
        setSelectedDeck(applyStoredFlashcardProgress({
          id: String(payload.id ?? `chat-history-flashcards-${Date.now()}`),
          title: isGenericChatFlashcardTitle(payload.title) ? cards[0].front : normalizeDeckTitle(payload.title) || cards[0].front,
          description: payload.description || cards[0].front || 'Flashcards generated from chat history.',
          cards,
          totalCards: cards.length,
          progress: 0,
          accuracy: 0,
          reviewCount: 0,
          createdAt: new Date(),
          sourceType: 'Chat',
        }));
        setCurrentCardIndex(0);
        setRevealedCardIds(new Set());
        setStudyControlsLocked(false);
        setStreak(0);
        setAnsweredCardIds(new Set());
        setAttemptResults({});
        setShowSummary(false);
      });
    } catch {
      toast.error('Could not open the generated flashcards from chat history.');
    }
  }, []);

  const filteredDecks = decks.filter((deck) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const searchableText = [
      deck.title,
      deck.description,
      deck.totalCards,
      deck.sourceType,
      ...deck.cards.map((card) => `${card.difficulty} ${card.source}`),
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  });

  const currentCard = selectedDeck?.cards[currentCardIndex];
  const hasAnsweredCurrentCard = currentCard ? answeredCardIds.has(currentCard.id) : false;
  const isCurrentCardRevealed = currentCard ? revealedCardIds.has(currentCard.id) : false;
  const canAnswerCurrentCard = !hasAnsweredCurrentCard && !isSavingReview;
  const attemptKnownCount = Object.values(attemptResults).filter(Boolean).length;
  const attemptTotal = selectedDeck?.cards.length ?? 0;
  const attemptReviewedCount = Object.keys(attemptResults).length;
  const attemptNeedsReviewCount = Math.max(0, attemptTotal - attemptKnownCount);
  const attemptMastery = attemptTotal > 0 ? Math.round((attemptKnownCount / attemptTotal) * 100) : 0;

  const isKeyboardInputTarget = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    if (!element) return false;
    return Boolean(element.closest('input, textarea, select, button, [contenteditable="true"]'));
  };

  const revealCurrentCard = () => {
    if (currentCard && !isCurrentCardRevealed) {
      setRevealedCardIds((current) => new Set(current).add(currentCard.id));
      if (!hasAnsweredCurrentCard) {
        void handleCardReview(false, { autoAdvance: false });
      }
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (selectedDeck && currentCardIndex < selectedDeck.cards.length - 1 && isCurrentCardRevealed) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const submitCompletedDeckReview = async (deck: Deck, results: Record<string, boolean>) => {
    const deckId = Number(deck.id);
    if (!Number.isFinite(deckId)) return;

    const reviews = deck.cards.map((card) => ({
      flashcard_id: Number(card.id),
      known: results[card.id] === true,
      correct_count: results[card.id] === true ? 1 : 0,
      incorrect_count: results[card.id] === true ? 0 : 1,
    }));

    if (reviews.some((review) => !Number.isFinite(review.flashcard_id) || typeof review.known !== 'boolean')) {
      return;
    }

    setIsSavingReview(true);
    try {
      const authHeaders = await getAuthHeaders();
      await backendClient.put(
        BACKEND_ROUTES.flashcardReviewComplete.replace('{deck_id}', deck.id),
        { reviews },
        { headers: authHeaders },
      );
    } catch (err: unknown) {
      const status = getResponseStatus(err);
      if (status === 401) {
        toast.error('Unauthorized. Please sign in to save review progress.');
      } else {
        toast.warning('Completed review could not be saved, but your local progress is kept.');
      }
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleCardReview = async (known: boolean, options: { autoAdvance?: boolean } = {}) => {
    if (!selectedDeck || !currentCard || !canAnswerCurrentCard) return;

    setStudyControlsLocked(true);

    const newStreak = known ? streak + 1 : 0;
    setStreak(newStreak);

    const nextAttemptResults = {
      ...attemptResults,
      [currentCard.id]: known,
    };
    const answeredCount = Object.keys(nextAttemptResults).length;
    const reviewedAt = new Date();
    const isAttemptComplete = answeredCount === selectedDeck.cards.length;
    const knownCount = Object.values(nextAttemptResults).filter(Boolean).length;
    const nextProgress = isAttemptComplete
      ? Math.round((knownCount / selectedDeck.cards.length) * 100)
      : selectedDeck.progress;

    const reviewedCards = selectedDeck.cards.map((card) =>
      isAttemptComplete
        ? {
            ...card,
            known: nextAttemptResults[card.id] === true,
            correctCount: nextAttemptResults[card.id] === true ? card.correctCount + 1 : card.correctCount,
            incorrectCount: nextAttemptResults[card.id] === true ? card.incorrectCount : card.incorrectCount + 1,
            lastReviewed: reviewedAt,
          }
        : card.id === currentCard.id
          ? {
              ...card,
              lastReviewed: reviewedAt,
            }
          : card,
    );
    const lifetimeAccuracy = isAttemptComplete
      ? getDeckAccuracyFromCards(reviewedCards, selectedDeck.accuracy)
      : selectedDeck.accuracy;

    const reviewedDeck = {
      ...selectedDeck,
      progress: nextProgress,
      accuracy: lifetimeAccuracy,
      reviewCount: isAttemptComplete ? selectedDeck.cards.length : selectedDeck.reviewCount,
      lastReviewed: isAttemptComplete ? reviewedAt : selectedDeck.lastReviewed,
      cards: reviewedCards,
    };
    void saveFlashcardReviewProgress(selectedDeck, reviewedDeck, isAttemptComplete ? reviewedCards : []);
    setSelectedDeck(reviewedDeck);
    setAnsweredCardIds((current) => new Set(current).add(currentCard.id));
    setAttemptResults(nextAttemptResults);
    setDecks((currentDecks) =>
      currentDecks.map((deck) =>
        deck.id === selectedDeck.id
          ? {
              ...deck,
              progress: nextProgress,
              accuracy: lifetimeAccuracy,
              reviewCount: isAttemptComplete ? selectedDeck.cards.length : deck.reviewCount,
              lastReviewed: isAttemptComplete ? reviewedAt : deck.lastReviewed,
            }
          : deck,
      ),
    );

    // Trigger confetti on milestone
    if (newStreak > 0 && newStreak % 5 === 0) {
      setShowConfetti(true);
      toast.success(`${newStreak} card streak! You're on fire!`);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    if (known) {
      toast.success('Nice! Card marked as known.');
    }

    if (isAttemptComplete) {
      await submitCompletedDeckReview(reviewedDeck, nextAttemptResults);
      setShowSummary(true);
      toast.success('Deck complete! Great job!');

      if (nextProgress >= 80) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }

    if (options.autoAdvance !== false && !isAttemptComplete) {
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 500);
    }
  };

  const handleAttemptAgain = () => {
    if (!selectedDeck) return;
    setCurrentCardIndex(0);
    setRevealedCardIds(new Set());
    setAnsweredCardIds(new Set());
    setAttemptResults({});
    setStudyControlsLocked(false);
    setStreak(0);
    setShowSummary(false);
    toast('Deck reset. Ready for another pass.');
  };

  const handleBackToDecks = () => {
    setSelectedDeck(null);
    setCurrentCardIndex(0);
    setRevealedCardIds(new Set());
    setStreak(0);
    setAnsweredCardIds(new Set());
    setAttemptResults({});
    setShowSummary(false);
  };

  const handleShuffle = () => {
    if (!selectedDeck) return;
    const shuffled = [...selectedDeck.cards].sort(() => Math.random() - 0.5);
    setSelectedDeck({ ...selectedDeck, cards: shuffled });
    setCurrentCardIndex(0);
    setRevealedCardIds(new Set());
    setAnsweredCardIds(new Set());
    setAttemptResults({});
    setShowSummary(false);
    toast('Deck shuffled!');
  };

  useEffect(() => {
    keyboardHandlersRef.current = {
      revealCurrentCard,
      handleCardReview,
      handlePreviousCard,
      handleNextCard,
      handleShuffle,
    };
  });

  useEffect(() => {
    if (!selectedDeck || showCreateDialog || showSummary) return;

    const handleFlashcardKeyDown = (event: KeyboardEvent) => {
      if (isKeyboardInputTarget(event.target)) return;

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        keyboardHandlersRef.current.revealCurrentCard();
        return;
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        void keyboardHandlersRef.current.handleCardReview(true);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        keyboardHandlersRef.current.handlePreviousCard();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        keyboardHandlersRef.current.handleNextCard();
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        keyboardHandlersRef.current.handleShuffle();
      }
    };

    window.addEventListener('keydown', handleFlashcardKeyDown);
    return () => window.removeEventListener('keydown', handleFlashcardKeyDown);
  }, [
    canAnswerCurrentCard,
    currentCard,
    currentCardIndex,
    isCurrentCardRevealed,
    selectedDeck,
    showCreateDialog,
    showSummary,
    studyControlsLocked,
  ]);

  // Confetti particles
  useEffect(() => {
    if (showConfetti) {
      const particles = 30;
      const colors = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'];
      
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

  return (
    <div className="flashcard-deck-container">
      {/* Header */}
      <div className="flashcard-header">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('dashboard')}
                className="flashcard-home-btn"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="flashcard-title">
                  {selectedDeck ? selectedDeck.title : 'Flashcard Decks'}
                </h1>
                {selectedDeck && (
                  <p className="flashcard-subtitle">{selectedDeck.description}</p>
                )}
              </div>
            </div>

            {!selectedDeck && (
              <Button className="flashcard-create-btn" onClick={() => void handleCreateDeck()} disabled={isCreatingDeck}>
                <Plus className="w-4 h-4" />
                {isCreatingDeck ? 'Creating...' : 'Create Deck'}
              </Button>
            )}

            {selectedDeck && (
              <Button
                variant="outline"
                onClick={handleBackToDecks}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Decks
              </Button>
            )}
          </div>

          {/* Search Bar */}
          {!selectedDeck && (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-sm:grid-cols-1">
              <div className="relative min-w-0">
                <Search className="flashcard-search-icon" />
                <Input
                  type="text"
                  placeholder="Search flashcards by title, topic, or source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flashcard-search-input"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flashcard-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear flashcard search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="flashcard-search-count">
                {isLoadingDecks
                  ? 'Loading flashcards'
                  : `${filteredDecks.length} ${filteredDecks.length === 1 ? 'deck' : 'decks'} found`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {!selectedDeck ? (
          /* Deck Grid View */
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredDecks.map((deck, index) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="flashcard-deck-card"
                  onClick={() => void fetchDeckById(deck)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void fetchDeckById(deck);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${deck.title} flashcard deck`}
                >
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <CardTitle className="flashcard-deck-title">
                        {deck.title}
                      </CardTitle>
                            <div className="flex items-center gap-2">
                              {deck.topic && !isSameLabel(deck.title, deck.topic) && (
                                <Badge variant="outline" className="text-xs flashcard-source-badge flashcard-source-badge-topic">
                                  {deck.topic}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs ${getSourceBadgeClassName(deck.sourceType)}`}
                              >
                                {deck.sourceType}
                              </Badge>
                            </div>
                    </div>
                    {deck.description && !isSameLabel(deck.description, deck.title) && !isSameLabel(deck.description, deck.topic) && (
                      <p className="flashcard-deck-description">{deck.description}</p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Ring */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 96 96">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="flashcard-progress-ring-bg"
                          />
                          <motion.circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="url(#gradient)"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - deck.progress / 100)}`}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                            animate={{
                              strokeDashoffset: 2 * Math.PI * 40 * (1 - deck.progress / 100),
                            }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="flashcard-progress-percentage">{deck.progress}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="flashcard-stat-label"># Cards:</span>
                        <span className="flashcard-stat-value">{deck.totalCards || deck.cards.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flashcard-stat-label">Accuracy:</span>
                        <span className="text-green-600 dark:text-green-400">
                          {deck.reviewCount > 0 ? `${deck.accuracy}%` : 'Not reviewed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flashcard-stat-label">Created:</span>
                        <span className="flashcard-date-text">
                          {deck.createdAt ? formatUserDate(deck.createdAt) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flashcard-stat-label">Last Reviewed:</span>
                        <span className="flashcard-date-text">
                          {deck.lastReviewed ? formatUserDate(deck.lastReviewed) : 'Not reviewed'}
                        </span>
                      </div>
                    </div>

                    {deck.linkedDocument && (
                      <div className="flashcard-linked-doc">
                        <p className="flashcard-linked-doc-text">
                          <Sparkles className="w-3 h-3" />
                          Linked: {deck.linkedDocument}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {!isLoadingDecks && filteredDecks.length === 0 && (
              <Card className="flashcard-deck-card md:col-span-2 lg:col-span-3">
                <CardContent className="py-10 text-center">
                  <p className="flashcard-stat-value">
                    {searchQuery.trim() ? 'No flashcard decks match your search.' : 'No flashcard decks yet.'}
                  </p>
                  <p className="flashcard-stat-label mt-2">
                    {searchQuery.trim()
                      ? 'Try a different title, topic, or source.'
                      : 'Create a deck to start studying.'}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={() => void fetchDecks()}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(isLoadingDecks || isLoadingDeckDetails) && (
              <Card className="flashcard-deck-card md:col-span-2 lg:col-span-3">
                <CardContent className="py-10 text-center">
                  <p className="flashcard-stat-value">
                    {isLoadingDecks ? 'Loading flashcards...' : 'Loading deck cards...'}
                  </p>
                  <p className="flashcard-stat-label mt-2">
                    {isLoadingDecks
                      ? 'Fetching your latest study decks.'
                      : 'Preparing this deck for review.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          /* Card Review View */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Controls Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShuffle}
                  className="gap-2"
                  disabled={studyControlsLocked}
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </Button>
              </div>

              <div className="flashcard-repetition-label">
                {hasAnsweredCurrentCard
                  ? 'Answered'
                  : isCurrentCardRevealed
                    ? 'Answer revealed'
                    : 'Mark known or reveal'}
              </div>
            </div>

            {/* Streak Badge */}
            {streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flashcard-streak-badge"
              >
                <Zap className="w-5 h-5 text-orange-400" />
                <span className="flashcard-streak-text">
                  {streak} Card Streak! 🔥
                </span>
              </motion.div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flashcard-progress-text">
                  Card {currentCardIndex + 1} of {selectedDeck.cards.length}
                </span>
                <span className="flashcard-progress-percent">
                  {Math.round(((currentCardIndex + 1) / selectedDeck.cards.length) * 100)}%
                </span>
              </div>
              <Progress
                value={((currentCardIndex + 1) / selectedDeck.cards.length) * 100}
                className="h-2"
              />
            </div>

            {/* Flashcard */}
            {currentCard && (
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="relative h-96 cursor-pointer"
                  onClick={revealCurrentCard}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      revealCurrentCard();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={isCurrentCardRevealed ? 'Flashcard answer revealed' : 'Reveal flashcard answer'}
                  animate={{ rotateY: isCurrentCardRevealed ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <div
                    className="flashcard-front"
                    style={{
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="text-center space-y-4">
                      <Badge className={getDifficultyBadgeClassName(currentCard.difficulty)}>
                        {currentCard.difficulty}
                      </Badge>
                      <p className="flashcard-front-text">{currentCard.front}</p>
                      <p className="flashcard-hint-text">Click, Enter, or Space to reveal answer</p>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="flashcard-back"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="flashcard-back-content space-y-4">
                      <div>
                        <h3 className="flashcard-section-title">Answer:</h3>
                        <p className="flashcard-answer-text">{currentCard.back}</p>
                      </div>

                      {currentCard.explanation && (
                        <div>
                          <h3 className="flashcard-section-title">Explanation:</h3>
                          <p className="flashcard-explanation-text">{currentCard.explanation}</p>
                        </div>
                      )}

                      {currentCard.example && (
                        <div>
                          <h3 className="flashcard-section-title">Example:</h3>
                          <p className="flashcard-example-text">{currentCard.example}</p>
                        </div>
                      )}

                      {currentCard.memoryTip && (
                        <div className="flashcard-memory-tip">
                          <h3 className="flashcard-memory-tip-title">💡 Memory Tip:</h3>
                          <p className="flashcard-memory-tip-text">{currentCard.memoryTip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => handleCardReview(true)}
                disabled={!canAnswerCurrentCard}
                className="flashcard-know-btn"
              >
                <Check className="w-5 h-5" />
                I Know It ✅
              </Button>
            </div>

            {/* Metadata Panel */}
            {currentCard && (
              <Card className="flashcard-metadata-card">
                <CardHeader>
                  <CardTitle className="text-sm">Card Metadata</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="flashcard-metadata-label">Source</p>
                    <Badge
                      variant="outline"
                      className={getSourceBadgeClassName(selectedDeck.sourceType)}
                    >
                      {selectedDeck.sourceType}
                    </Badge>
                  </div>
                  <div>
                    <p className="flashcard-metadata-label">Times Correct</p>
                    <p className="flashcard-metadata-value">{currentCard.correctCount}</p>
                  </div>
                  <div>
                    <p className="flashcard-metadata-label">Created</p>
                    <p className="flashcard-metadata-date">
                      {selectedDeck.createdAt ? formatUserDate(selectedDeck.createdAt) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="flashcard-metadata-label">Last Reviewed</p>
                    <p className="flashcard-metadata-date">
                      {currentCard.lastReviewed ? formatUserDate(currentCard.lastReviewed) : 'Not reviewed'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={handleNextCard}
                disabled={
                  currentCardIndex === selectedDeck.cards.length - 1 || !isCurrentCardRevealed
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Create Flashcard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Flashcard Deck</DialogTitle>
            <DialogDescription>
              Generate flashcards from backend by topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="flashcardTopic">Topic</Label>
              <Input
                id="flashcardTopic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Binary Trees"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="flashcardCount">Number of cards</Label>
              <Select value={newCardCount} onValueChange={setNewCardCount}>
                <SelectTrigger id="flashcardCount" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 cards</SelectItem>
                  <SelectItem value="10">10 cards</SelectItem>
                  <SelectItem value="15">15 cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreatingDeck}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmitCreateDeck()} disabled={isCreatingDeck}>
                {isCreatingDeck ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FlashcardReviewSummaryDialog
        open={showSummary}
        mastery={attemptMastery}
        knownCount={attemptKnownCount}
        needsReviewCount={attemptNeedsReviewCount}
        totalCards={attemptTotal}
        reviewedCount={attemptReviewedCount}
        allTimeAccuracy={selectedDeck?.accuracy}
        onOpenChange={setShowSummary}
        onAttemptAgain={handleAttemptAgain}
        onBackToDecks={handleBackToDecks}
      />
    </div>
  );
}
