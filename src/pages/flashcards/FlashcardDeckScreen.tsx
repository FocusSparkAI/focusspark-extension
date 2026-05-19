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
  Plus,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  RotateCcw,
  Check,
  RotateCw,
  Sparkles,
  Home,
  Zap,
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
  source: 'AI' | 'Manual' | 'Imported';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lastReviewed?: Date;
  correctCount: number;
  reviewInterval: number;
}

interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  totalCards: number;
  progress: number;
  accuracy: number;
  lastReviewed: Date;
  tags: ('AI' | 'Manual' | 'Imported')[];
  linkedDocument?: string;
}

interface FlashcardDeckScreenProps {
  onNavigate: (page: string) => void;
}

export function FlashcardDeckScreen({ onNavigate }: FlashcardDeckScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [isLoadingDeckDetails, setIsLoadingDeckDetails] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [repetitionMode, setRepetitionMode] = useState<'Daily' | '3 Days' | 'Weekly'>('Daily');
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const mapDeck = (d: any): Deck => {
    return {
      id: String(d.id),
      title: d.title || `${d.topic || 'Untitled'} Flashcards`,
      description: d.topic || 'Flashcard deck',
      cards: [],
      totalCards: Number(d.total_cards ?? 0),
      progress: 0,
      accuracy: 0,
      lastReviewed: d.created_at ? new Date(d.created_at) : new Date(),
      tags: ['AI'],
      linkedDocument: d.linked_document_id ? String(d.linked_document_id) : undefined,
    };
  };

  const mapCard = (c: any): Flashcard => {
    return {
      id: String(c.id),
      front: c.front || '',
      back: c.back || '',
      explanation: c.explanation || '',
      example: c.example || '',
      memoryTip: c.memory_tip || c.memoryTip || '',
      source: 'AI',
      difficulty: 'Medium',
      lastReviewed: undefined,
      correctCount: 0,
      reviewInterval: 1,
    };
  };

  const fetchDecks = async () => {
    setIsLoadingDecks(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await backendClient.get(BACKEND_ROUTES.flashcards, { headers: authHeaders });
      const data = Array.isArray(res.data) ? res.data : [];
      setDecks(data.map((d: any) => mapDeck(d)));
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

      setSelectedDeck({ ...deck, cards, totalCards: cards.length });
      setCurrentCardIndex(0);
      setIsFlipped(false);
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
        { topic: newTopic.trim(), count: 10 },
        { headers: authHeaders },
      );

      const createdDeck = mapDeck(res.data?.deck ?? {});
      const createdCards = Array.isArray(res.data?.flashcards)
        ? res.data.flashcards.map((c: any) => mapCard(c))
        : [];

      await fetchDecks();

      if (createdDeck.id && createdDeck.id !== 'undefined') {
        setSelectedDeck({ ...createdDeck, cards: createdCards, totalCards: createdCards.length });
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }

      setShowCreateDialog(false);
      setNewTopic('');
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

  const filteredDecks = decks.filter((deck) =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardReview = async (known: boolean) => {
    if (!selectedDeck) return;

    const newStreak = known ? streak + 1 : 0;
    setStreak(newStreak);

    // Trigger confetti on milestone
    if (newStreak > 0 && newStreak % 5 === 0) {
      setShowConfetti(true);
      toast.success(`🔥 ${newStreak} card streak! You're on fire!`);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    if (known) {
      toast.success('✅ Nice! Card marked as known.');
    } else {
      toast('🔁 Card added to review queue.');
    }

    // Move to next card
    setTimeout(() => {
      setIsFlipped(false);
      if (currentCardIndex < selectedDeck.cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        toast.success('🎉 Deck complete! Great job!');
        setSelectedDeck(null);
      }
    }, 500);
  };

  const handleShuffle = () => {
    if (!selectedDeck) return;
    const shuffled = [...selectedDeck.cards].sort(() => Math.random() - 0.5);
    setSelectedDeck({ ...selectedDeck, cards: shuffled });
    setCurrentCardIndex(0);
    setIsFlipped(false);
    toast('🔀 Deck shuffled!');
  };

  const handleReset = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStreak(0);
    toast('🔄 Progress reset.');
  };

  const currentCard = selectedDeck?.cards[currentCardIndex];

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
                  setIsFlipped(false);
                  setStreak(0);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Decks
              </Button>
            )}
          </div>

          {/* Search Bar */}
          {!selectedDeck && (
            <div className="flashcard-search-container">
              <Search className="flashcard-search-icon" />
              <Input
                type="text"
                placeholder="Search by title, topic, or difficulty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flashcard-search-input"
              />
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
                >
                  <CardHeader>
                    <div className="flashcard-deck-header">
                      <CardTitle className="flashcard-deck-title">
                        {deck.title}
                      </CardTitle>
                      <div className="flex gap-1">
                        {deck.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="flashcard-deck-description">{deck.description}</p>
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
                        <span className="text-green-600 dark:text-green-400">{deck.accuracy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flashcard-stat-label">Last Reviewed:</span>
                        <span className="flashcard-date-text">
                          {deck.lastReviewed.toLocaleDateString()}
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
              <div className="col-span-full text-center py-10 text-gray-500">
                No flashcard decks found.
              </div>
            )}

            {(isLoadingDecks || isLoadingDeckDetails) && (
              <div className="col-span-full text-center py-10 text-gray-500">
                {isLoadingDecks ? 'Loading decks...' : 'Loading deck cards...'}
              </div>
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
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flashcard-repetition-label">
                  Spaced Repetition:
                </div>
                <Select value={repetitionMode} onValueChange={(v: any) => setRepetitionMode(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="3 Days">3 Days</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
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
                  onClick={() => setIsFlipped(!isFlipped)}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
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
                      <Badge variant="secondary">{currentCard.difficulty}</Badge>
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
                variant="outline"
                onClick={() => handleCardReview(false)}
                className="flashcard-review-again-btn"
              >
                <RotateCw className="w-5 h-5" />
                Review Again 🔁
              </Button>

              <Button
                size="lg"
                onClick={() => handleCardReview(true)}
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
                    <Badge variant="secondary">{currentCard.source}</Badge>
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
                      {currentCard.lastReviewed?.toLocaleDateString()}
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
                    setIsFlipped(false);
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
                    setIsFlipped(false);
                  }
                }}
                disabled={currentCardIndex === selectedDeck.cards.length - 1}
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