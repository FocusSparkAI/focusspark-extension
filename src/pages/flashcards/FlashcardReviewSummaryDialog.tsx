import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

interface FlashcardReviewSummaryDialogProps {
  open: boolean;
  mastery: number;
  knownCount: number;
  needsReviewCount: number;
  totalCards: number;
  reviewedCount: number;
  allTimeAccuracy?: number;
  onOpenChange: (open: boolean) => void;
  onAttemptAgain: () => void;
  onBackToDecks: () => void;
}

export function FlashcardReviewSummaryDialog({
  open,
  mastery,
  knownCount,
  needsReviewCount,
  totalCards,
  reviewedCount,
  allTimeAccuracy,
  onOpenChange,
  onAttemptAgain,
  onBackToDecks,
}: FlashcardReviewSummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="quiz-summary-dialog">
        <DialogHeader>
          <DialogTitle className="quiz-summary-title">Deck Complete!</DialogTitle>
          <DialogDescription className="quiz-summary-description">
            {mastery >= 80
              ? 'Strong recall. Keep the momentum with another pass when you are ready.'
              : 'Good pass. The cards marked for review are exactly where the next study session should focus.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="quiz-score-ring-bg"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#flashcard-gradient-score)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - mastery / 100)}`}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - mastery / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="flashcard-gradient-score" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="quiz-score-percentage">{mastery}%</p>
                <p className="quiz-score-label">Mastery</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="quiz-stat-card">
              <CardContent className="pt-4">
                <p className="text-2xl text-green-600 dark:text-green-400 font-bold">{knownCount}</p>
                <p className="quiz-stat-label">Known</p>
              </CardContent>
            </Card>

            <Card className="quiz-stat-card">
              <CardContent className="pt-4">
                <p className="text-2xl text-red-600 dark:text-red-400 font-bold">{needsReviewCount}</p>
                <p className="quiz-stat-label">Review</p>
              </CardContent>
            </Card>

            <Card className="quiz-stat-card">
              <CardContent className="pt-4">
                <p className="quiz-stat-total">{totalCards}</p>
                <p className="quiz-stat-label">Total</p>
              </CardContent>
            </Card>
          </div>

          {typeof allTimeAccuracy === 'number' && (
            <div className="quiz-pass-indicator quiz-pass">
              <p className="quiz-pass-text">All-time deck accuracy: {allTimeAccuracy}%</p>
              <p className="quiz-pass-requirement">
                This attempt reviewed {reviewedCount} of {totalCards} cards.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onAttemptAgain} className="flex-1 gap-2">
              <RotateCcw className="w-4 h-4" />
              Attempt Again
            </Button>

            <Button onClick={onBackToDecks} className="quiz-schedule-review-btn">
              <ArrowLeft className="w-4 h-4" />
              Back to Decks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
