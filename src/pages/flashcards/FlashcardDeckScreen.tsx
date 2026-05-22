import { useState, useEffect } from 'react';
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

interface Flashcard {
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

interface Deck {
  id: string;
  title: string;
  description: string;
  topic?: string;
  cards: Flashcard[];
  totalCards: number;
  progress: number;
  accuracy: number;
  reviewCount: number;
  lastReviewed?: Date;
  sourceType: 'Topic' | 'Chat' | 'Document';
  linkedDocument?: string;
}

interface FlashcardDeckScreenProps {
  onNavigate: (page: string) => void;
}

const CHAT_HISTORY_FLASHCARDS_KEY = 'focusspark-chat-history-flashcards';

export function FlashcardDeckScreen({ onNavigate }: FlashcardDeckScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [isLoadingDeckDetails, setIsLoadingDeckDetails] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newCardCount, setNewCardCount] = useState('10');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(() => new Set());
  const [studyControlsLocked, setStudyControlsLocked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [answeredCardIds, setAnsweredCardIds] = useState<Set<string>>(() => new Set());
  const [attemptResults, setAttemptResults] = useState<Record<string, boolean>>({});

  const getReviewIntervalDays = (known: boolean) => (known ? 3 : 1);

  const parseDate = (value: unknown) => {
    if (!value) return undefined;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date;
  };

  const getDeckSourceType = (d: any): Deck['sourceType'] => {
    const sourceText = String(d.source_type ?? d.sourceType ?? d.source ?? '').toLowerCase();
    if (sourceText.includes('chat') || d.chat_id || d.thread_id || d.message_id) return 'Chat';
    if (sourceText.includes('document') || d.document_id || d.linked_document_id) return 'Document';
    return 'Topic';
  };

  const getSourceBadgeClassName = (sourceType: Deck['sourceType']) => {
    if (sourceType === 'Chat') {
      return 'flashcard-source-badge flashcard-source-badge-chat';
    }

    if (sourceType === 'Document') {
      return 'flashcard-source-badge flashcard-source-badge-document';
    }

    return 'flashcard-source-badge flashcard-source-badge-topic';
  };

  const getDifficultyBadgeClassName = (difficulty: Flashcard['difficulty']) => {
    if (difficulty === 'Easy') return 'flashcard-difficulty-badge flashcard-difficulty-easy';
    if (difficulty === 'Hard') return 'flashcard-difficulty-badge flashcard-difficulty-hard';
    return 'flashcard-difficulty-badge flashcard-difficulty-medium';
  };

  const isGenericChatFlashcardTitle = (value: unknown) => {
    const title = String(value ?? '').trim().toLowerCase();
    return !title || title === 'chat flashcards' || title === 'flashcards' || title === 'flashcard deck';
  };

  const normalizeDeckTitle = (value: unknown) => {
    const title = String(value ?? '').trim();
    if (!title) return '';
    const strippedTitle = title.replace(/\s+flashcards$/i, '').trim() || title;
    return strippedTitle.charAt(0).toUpperCase() + strippedTitle.slice(1);
  };

  const isSameLabel = (left: unknown, right: unknown) =>
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

  const mapDeck = (d: any): Deck => {
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
      lastReviewed: parseDate(d.last_reviewed ?? d.lastReviewed),
      sourceType: getDeckSourceType(d),
      linkedDocument: d.linked_document ?? d.linkedDocument ?? d.linked_document_id ? String(d.linked_document ?? d.linkedDocument ?? d.linked_document_id) : undefined,
    };
  };

  const mapCard = (c: any): Flashcard => {
    const sourceText = String(c.source_type ?? c.sourceType ?? c.source ?? '').toLowerCase();
    const source = sourceText.includes('chat')
      ? 'Chat'
      : sourceText.includes('document')
        ? 'Document'
        : 'Topic';
    const difficulty = ['Easy', 'Medium', 'Hard'].includes(c.difficulty) ? c.difficulty : 'Medium';

    return {
      id: String(c.id),
      front: c.front || '',
      back: c.back || '',
      explanation: c.explanation || '',
      example: c.example || '',
      memoryTip: c.memory_tip || c.memoryTip || '',
      source,
      difficulty,
      lastReviewed: parseDate(c.last_reviewed ?? c.lastReviewed),
      correctCount: Number(c.correct_count ?? c.correctCount ?? 0),
      reviewInterval: Number(c.review_interval ?? c.reviewInterval ?? 1),
    };
  };

  const fetchDecks = async () => {
    setIsLoadingDecks(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await backendClient.get(BACKEND_ROUTES.flashcards, { headers: authHeaders });
      const data = Array.isArray(res.data) ? res.data : [];
      const mappedDecks = data.map((d: any) => mapDeck(d));
      setDecks(mappedDecks);

      const titledDecks = await Promise.all(
        mappedDecks.map(async (deck) => {
          if (!isGenericChatFlashcardTitle(deck.title)) return deck;

          try {
            const detailResponse = await backendClient.get(`${BACKEND_ROUTES.flashcards}/${deck.id}`, {
              headers: authHeaders,
            });
            const cards = (Array.isArray(detailResponse.data) ? detailResponse.data : []).map((c: any) => mapCard(c));
            const firstCardTitle = cards[0]?.front;
            if (!firstCardTitle) return deck;

            return {
              ...deck,
              title: firstCardTitle,
              description: isGenericChatFlashcardTitle(deck.description) ? firstCardTitle : deck.description,
              cards,
              totalCards: cards.length,
            };
          } catch {
            return deck;
          }
        }),
      );

      setDecks(titledDecks);
    } catch (err: any) {
      const status = err?.response?.status;
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
      const authHeaders = await getAuthHeaders();
      const res = await backendClient.get(`${BACKEND_ROUTES.flashcards}/${deck.id}`, {
        headers: authHeaders,
      });
      const cards = (Array.isArray(res.data) ? res.data : []).map((c: any) => mapCard(c));
      if (cards.length === 0) {
        toast('This deck has no cards yet.');
        return;
      }

      setSelectedDeck({
        ...deck,
        title: isGenericChatFlashcardTitle(deck.title) ? cards[0].front : deck.title,
        description: isGenericChatFlashcardTitle(deck.description) ? cards[0].front : deck.description,
        cards,
        totalCards: cards.length,
      });
      setCurrentCardIndex(0);
      setRevealedCardIds(new Set());
      setStudyControlsLocked(false);
      setAnsweredCardIds(new Set());
      setAttemptResults({});
    } catch (err: any) {
      const status = err?.response?.status;
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
        ? res.data.flashcards.map((c: any) => mapCard(c))
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
      }

      setShowCreateDialog(false);
      setNewTopic('');
      setNewCardCount('10');
      toast.success('Flashcard deck created successfully.');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized. Please sign in to create flashcards.');
      } else if (status === 502) {
        toast.error('Flashcard generation failed at the backend. Please try again in a moment.');
      } else {
        toast.error('Failed to create flashcard deck.');
      }
    } finally {
      setIsCreatingDeck(false);
    }
  };

  useEffect(() => {
    void fetchDecks();
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
            const authHeaders = await getAuthHeaders();
            const decksResponse = await backendClient.get(BACKEND_ROUTES.flashcards, { headers: authHeaders });
            const deckList = Array.isArray(decksResponse.data) ? decksResponse.data : [];
            const matchingDeck = deckList.find((deck: any) => String(deck.id) === String(pendingDeckId));
            const deck = mapDeck(matchingDeck ?? {
              id: pendingDeckId,
              title: payload.title,
              topic: payload.topic,
              description: payload.description,
              source: 'chat',
            });

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
            reviewInterval: Number(card.reviewInterval ?? card.review_interval ?? 1),
          };
        })
        .filter((card) => card.front.length > 0 && card.back.length > 0);

      if (cards.length === 0) return;

      setSelectedDeck({
        id: String(payload.id ?? `chat-history-flashcards-${Date.now()}`),
        title: isGenericChatFlashcardTitle(payload.title) ? cards[0].front : normalizeDeckTitle(payload.title) || cards[0].front,
        description: payload.description || cards[0].front || 'Flashcards generated from chat history.',
        cards,
        totalCards: cards.length,
        progress: 0,
        accuracy: 0,
        reviewCount: 0,
        sourceType: 'Chat',
      });
      setCurrentCardIndex(0);
      setRevealedCardIds(new Set());
      setStudyControlsLocked(false);
      setStreak(0);
      setAnsweredCardIds(new Set());
      setAttemptResults({});
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
  const canAnswerCurrentCard = !isCurrentCardRevealed && !hasAnsweredCurrentCard && !isSavingReview;

  const handleCardReview = async (known: boolean) => {
    if (!selectedDeck || !currentCard || !canAnswerCurrentCard) return;

    setStudyControlsLocked(true);

    const newStreak = known ? streak + 1 : 0;
    setStreak(newStreak);
    setIsSavingReview(true);
    const reviewInterval = getReviewIntervalDays(known);

    try {
      const authHeaders = await getAuthHeaders();
      await backendClient.put(
        BACKEND_ROUTES.flashcardReview.replace('{flashcard_id}', currentCard.id),
        {
          known,
          repetition_mode: known ? 'known' : 'review_again',
          review_interval_days: reviewInterval,
        },
        { headers: authHeaders },
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error('Unauthorized. Please sign in to save review progress.');
      } else {
        toast.warning('Review progress could not be saved, but you can keep studying.');
      }
    } finally {
      setIsSavingReview(false);
    }

    const nextAttemptResults = {
      ...attemptResults,
      [currentCard.id]: known,
    };
    const answeredCount = Object.keys(nextAttemptResults).length;
    const correctCount = Object.values(nextAttemptResults).filter(Boolean).length;
    const nextProgress = Math.round((answeredCount / selectedDeck.cards.length) * 100);
    const nextAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const reviewedAt = new Date();

    const reviewedDeck = {
      ...selectedDeck,
      progress: nextProgress,
      accuracy: nextAccuracy,
      reviewCount: answeredCount,
      lastReviewed: reviewedAt,
      cards: selectedDeck.cards.map((card) =>
        card.id === currentCard.id
          ? {
              ...card,
              correctCount: known ? card.correctCount + 1 : card.correctCount,
              reviewInterval,
              lastReviewed: reviewedAt,
            }
          : card,
      ),
    };
    setSelectedDeck(reviewedDeck);
    setAnsweredCardIds((current) => new Set(current).add(currentCard.id));
    setAttemptResults(nextAttemptResults);
    setDecks((currentDecks) =>
      currentDecks.map((deck) =>
        deck.id === selectedDeck.id
          ? {
              ...deck,
              progress: nextProgress,
              accuracy: nextAccuracy,
              reviewCount: answeredCount,
              lastReviewed: reviewedAt,
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
    } else {
      toast('Card added to review queue.');
    }

    // Move to next card
    setTimeout(() => {
      if (currentCardIndex < reviewedDeck.cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
          toast.success('Deck complete! Great job!');
        setSelectedDeck(null);
      }
    }, 500);
  };

  const handleShuffle = () => {
    if (!selectedDeck) return;
    const shuffled = [...selectedDeck.cards].sort(() => Math.random() - 0.5);
    setSelectedDeck({ ...selectedDeck, cards: shuffled });
    setCurrentCardIndex(0);
    setRevealedCardIds(new Set());
    setAnsweredCardIds(new Set());
    setAttemptResults({});
    toast('Deck shuffled!');
  };

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
        <div className="flashcard-header-content">
          <div className="flashcard-header-top">
            <div className="flashcard-header-left">
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
                onClick={() => {
                  setSelectedDeck(null);
                  setCurrentCardIndex(0);
                  setRevealedCardIds(new Set());
                  setStreak(0);
                  setAnsweredCardIds(new Set());
                  setAttemptResults({});
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Decks
              </Button>
            )}
          </div>

          {/* Search Bar */}
          {!selectedDeck && (
            <div className="flashcard-search-row">
              <div className="flashcard-search-container">
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

      <div className="flashcard-content">
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
                    <div className="flashcard-deck-header">
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
                        <svg className="w-full h-full -rotate-90">
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
                        <span className="flashcard-stat-label">Last Reviewed:</span>
                        <span className="flashcard-date-text">
                          {deck.lastReviewed?.toLocaleDateString() ?? 'Not reviewed'}
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
            <div className="flex items-center justify-between">
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
                  onClick={() => {
                    if (currentCard && !isCurrentCardRevealed) {
                      setStudyControlsLocked(true);
                      setRevealedCardIds((current) => new Set(current).add(currentCard.id));
                    }
                  }}
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
                      <p className="flashcard-hint-text">Click to reveal answer</p>
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
                    <div className="space-y-4">
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
                    <p className="flashcard-metadata-label">Review Interval</p>
                    <p className="flashcard-metadata-text">{currentCard.reviewInterval} days</p>
                  </div>
                  <div>
                    <p className="flashcard-metadata-label">Last Reviewed</p>
                    <p className="flashcard-metadata-date">
                      {currentCard.lastReviewed?.toLocaleDateString() ?? 'Not reviewed'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentCardIndex > 0) {
                    setCurrentCardIndex(currentCardIndex - 1);
                  }
                }}
                disabled={currentCardIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (currentCardIndex < selectedDeck.cards.length - 1) {
                    setCurrentCardIndex(currentCardIndex + 1);
                  }
                }}
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
    </div>
  );
}
