import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import {
  X,
  Check,
  Eye,
  AlertTriangle,
  Trophy,
  HelpCircle,
  Sparkles,
  Wind,
} from 'lucide-react';

// Distraction Popup
interface DistractionPopupProps {
  isVisible: boolean;
  distractionApp: string;
  onDismiss: () => void;
  onBackToStudy: () => void;
}

export function DistractionPopup({
  isVisible,
  distractionApp,
  onDismiss,
  onBackToStudy,
}: DistractionPopupProps) {
  const [dismissCount, setDismissCount] = useState(0);

  const handleDismiss = () => {
    setDismissCount((prev) => prev + 1);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 100 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Card className=" border-2 border-yellow-500/50 w-96 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="mb-1">Distraction Detected</h3>
                    <p className="text-sm text-secondary">
                      You opened <strong className="text-yellow-400">{distractionApp}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-secondary hover:text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm mb-4">Continue studying?</p>

              <div className="flex gap-3">
                <Button
                  onClick={onBackToStudy}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Back to Study ✅
                </Button>
                <Button variant="outline" onClick={handleDismiss} className="flex-1">
                  Dismiss ❌
                </Button>
              </div>

              {dismissCount >= 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30"
                >
                  <p className="text-xs text-orange-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    ⚠ A typical session loses 12 minutes every time you open a distractor.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Attention Nudge Banner
interface AttentionNudgeBannerProps {
  isVisible: boolean;
  secondsAway: number;
  onDismiss: () => void;
  onBreathingExercise?: () => void;
}

export function AttentionNudgeBanner({
  isVisible,
  secondsAway,
  onDismiss,
  onBreathingExercise,
}: AttentionNudgeBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 right-6 z-50"
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Card className="border-2 border-blue-500/50 w-80 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <h4 className="text-sm">Attention Nudge</h4>
                  </div>
                  <button
                    onClick={onDismiss}
                    className="text-secondary hover:text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm mb-3">
                  👁 Eyes away <strong className="text-blue-400">{secondsAway}s</strong> — refocus?
                </p>

                {onBreathingExercise && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onBreathingExercise}
                    className="w-full gap-2"
                  >
                    <Wind className="w-4 h-4" />
                    Try a 2-min breathing exercise
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Quiz Prompt (Post-Pomodoro)
interface QuizPromptProps {
  isVisible: boolean;
  onStartQuiz: () => void;
  onLater: () => void;
}

export function QuizPrompt({ isVisible, onStartQuiz, onLater }: QuizPromptProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <Card className=" border-2 border-purple-500/50 w-[500px] shadow-2xl">
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-block mb-4"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
                    <HelpCircle className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <h2 className="text-2xl gradient-text mb-2">Great session! 🎉</h2>
                <p className="text-secondary mb-6">Ready for your mini quiz?</p>

                <div className="flex gap-3">
                  <Button
                    onClick={onStartQuiz}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Start Quiz Now
                  </Button>
                  <Button variant="outline" onClick={onLater} className="flex-1">
                    Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Achievement Unlock Popup
interface AchievementUnlockPopupProps {
  isVisible: boolean;
  achievementTitle: string;
  achievementIcon: React.ReactNode;
  achievementReward?: string;
  onClose: () => void;
  onViewBadges?: () => void;
}

export function AchievementUnlockPopup({
  isVisible,
  achievementTitle,
  achievementIcon,
  achievementReward,
  onClose,
  onViewBadges,
}: AchievementUnlockPopupProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isVisible]);

  useEffect(() => {
    if (showConfetti) {
      const particles = 50;
      const colors = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

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
          animation-delay: ${Math.random() * 0.5}s;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 3000);
      }
    }
  }, [showConfetti]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Card className=" border-2 border-yellow-500/50 w-[450px] shadow-2xl">
              <CardContent className="p-8 text-center relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 blur-3xl" />

                <div className="relative z-10">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center glow-blue-purple">
                      {achievementIcon}
                    </div>
                  </motion.div>

                  <h2 className="text-3xl gradient-text mb-2">Achievement Unlocked!</h2>
                  <p className="text-xl mb-4">{achievementTitle}</p>

                  {achievementReward && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <p className="text-sm">
                          <strong>Reward:</strong> {achievementReward}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {onViewBadges && (
                      <Button
                        onClick={onViewBadges}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                      >
                        View My Badges
                      </Button>
                    )}
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Error/Success Toast Notifications (using sonner, but here's a custom alternative)
interface CustomToastProps {
  isVisible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
}

export function CustomToast({ isVisible, type, message, onDismiss }: CustomToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            onDismiss();
            return 0;
          }
          return prev - 2;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isVisible, onDismiss]);

  const config = {
    success: {
      icon: <Check className="w-5 h-5" />,
      color: 'border-green-500/50 bg-green-500/10',
      iconColor: 'text-green-400',
    },
    error: {
      icon: <X className="w-5 h-5" />,
      color: 'border-red-500/50 bg-red-500/10',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'border-yellow-500/50 bg-yellow-500/10',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: <Sparkles className="w-5 h-5" />,
      color: 'border-blue-500/50 bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
  };

  const currentConfig = config[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-6 right-6 z-50"
        >
          <Card className={` border-2 ${currentConfig.color} w-80 shadow-xl`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className={currentConfig.iconColor}>{currentConfig.icon}</div>
                <p className="text-sm flex-1">{message}</p>
                <button
                  onClick={onDismiss}
                  className="text-secondary hover:text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Progress value={progress} className="h-1" />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
