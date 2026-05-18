import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Scan, Smile, Frown, Meh, X } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

interface FocusDetectionDemoProps {
  hasActiveChat: boolean;
}

type FocusState = 'Focused' | 'Attention Needed' | 'Idle';
type EmotionType = 'neutral' | 'motivated' | 'tired';

export function FocusDetectionDemo({ hasActiveChat }: FocusDetectionDemoProps) {
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [focusState, setFocusState] = useState<FocusState>('Idle');
  const [emotionFeedbackOpen, setEmotionFeedbackOpen] = useState(false);

  // Simulate focus state changes when enabled
  useEffect(() => {
    if (!focusEnabled) return;

    const states: FocusState[] = ['Focused', 'Attention Needed', 'Idle'];
    const interval = setInterval(() => {
      const randomState = states[Math.floor(Math.random() * states.length)];
      setFocusState(randomState);
    }, 5000);

    return () => clearInterval(interval);
  }, [focusEnabled]);

  // Show emotion feedback popup when disabled and has active chat
  useEffect(() => {
    if (focusEnabled || !hasActiveChat) return;

    const interval = setInterval(() => {
      setEmotionFeedbackOpen(true);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [focusEnabled, hasActiveChat]);

  const handleEmotionSelect = (_emotion: EmotionType) => {
    setEmotionFeedbackOpen(false);
    // Could send this data to analytics
  };

  const getFocusColor = () => {
    switch (focusState) {
      case 'Focused':
        return {
          text: 'text-focus-green',
          glow: 'shadow-[0_0_20px_rgba(0,230,168,0.4)]',
          bg: 'bg-focus-green/20',
        };
      case 'Attention Needed':
        return {
          text: 'text-focus-amber',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
          bg: 'bg-focus-amber/20',
        };
      default:
        return {
          text: 'text-muted-foreground',
          glow: 'shadow-[0_0_10px_rgba(176,184,196,0.2)]',
          bg: 'bg-muted/20',
        };
    }
  };

  if (!focusEnabled) {
    return (
      <>
        {/* Start Focus Detection Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <Button
            onClick={() => setFocusEnabled(true)}
            className="glass-card px-6 py-6 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300 glow-hover"
            style={{
              borderImage: 'linear-gradient(90deg, #8B5CF6, #3B82F6) 1',
            }}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Focus Detection Demo
          </Button>
        </motion.div>

        {/* Emotion Feedback Popup */}
        <AnimatePresence>
          {emotionFeedbackOpen && (
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="fixed bottom-6 right-6 z-50 w-80 glass-card rounded-2xl p-6 border border-border shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="gradient-text">How focused are you?</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEmotionFeedbackOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                How focused do you feel right now?
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 flex flex-col items-center gap-2 h-auto py-3 hover:bg-muted/50"
                  onClick={() => handleEmotionSelect('neutral')}
                >
                  <Meh className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs">Neutral</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 flex flex-col items-center gap-2 h-auto py-3 hover:bg-green-500/10 hover:border-green-500/30"
                  onClick={() => handleEmotionSelect('motivated')}
                >
                  <Smile className="w-6 h-6 text-green-500" />
                  <span className="text-xs">Motivated</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 flex flex-col items-center gap-2 h-auto py-3 hover:bg-amber-500/10 hover:border-amber-500/30"
                  onClick={() => handleEmotionSelect('tired')}
                >
                  <Frown className="w-6 h-6 text-amber-500" />
                  <span className="text-xs">Tired</span>
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-xs text-center text-muted-foreground"
              >
                Your feedback helps us understand your study patterns
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const colors = getFocusColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="glass-card rounded-2xl p-4 border border-border/50 relative overflow-hidden">
        {/* Sheen effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[sheen_3s_infinite] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Animated Face Icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg} ${colors.glow} transition-all duration-500`}
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Scan className={`w-6 h-6 ${colors.text}`} />
            </motion.div>
          </motion.div>

          {/* Status Bar */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${colors.bg.replace('/20', '')} status-pulse`} />
              <motion.span
                key={focusState}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`${colors.text} transition-colors duration-500`}
              >
                {focusState}
              </motion.span>
            </div>

            {/* Gradient Progress Bar */}
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all duration-500`}
                style={{
                  width: focusState === 'Focused' ? '100%' : focusState === 'Attention Needed' ? '60%' : '30%',
                  background:
                    focusState === 'Focused'
                      ? 'linear-gradient(90deg, #00e6a8, #00b386)'
                      : focusState === 'Attention Needed'
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : 'linear-gradient(90deg, #6B7280, #4B5563)',
                }}
                initial={{ width: 0 }}
                animate={{
                  width: focusState === 'Focused' ? '100%' : focusState === 'Attention Needed' ? '60%' : '30%',
                }}
              />
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">Disable</span>
            <Switch
              checked={focusEnabled}
              onCheckedChange={setFocusEnabled}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
