import { motion, AnimatePresence } from 'motion/react';
import { Smile, Meh, Frown, X } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface EmotionalFeedbackPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onFeedback: (emotion: 'focused' | 'tired' | 'distracted') => void;
}

export function EmotionalFeedbackPopup({
  isVisible,
  onClose,
  onFeedback,
}: EmotionalFeedbackPopupProps) {
  const handleFeedback = (emotion: 'focused' | 'tired' | 'distracted') => {
    onFeedback(emotion);
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
        >
          <div className="relative rounded-2xl p-6 border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
            {/* Glowing gradient border */}
            <div className="absolute inset-0 rounded-2xl emotional-popup-blue-glow pointer-events-none" />

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Content */}
            <div className="space-y-4">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <h3 className="text-lg mb-2">How are you feeling right now?</h3>
                <p className="text-sm text-secondary">
                  Your answer will adjust the workspace mood and focus guidance.
                </p>
              </motion.div>

              {/* Emotion Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* Focused */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleFeedback('focused')}
                    className="flex-col h-28 w-full px-3 py-4 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all group"
                  >
                    <Smile className="w-8 h-8 mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Focused</span>
                  </Button>
                </motion.div>

                {/* Tired */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleFeedback('tired')}
                    className="flex-col h-28 w-full px-3 py-4 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all group"
                  >
                    <Meh className="w-8 h-8 mb-2 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Tired</span>
                  </Button>
                </motion.div>

                {/* Distracted */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleFeedback('distracted')}
                    className="flex-col h-28 w-full px-3 py-4 hover:bg-red-500/10 hover:border-red-500/40 transition-all group"
                  >
                    <Frown className="w-8 h-8 mb-2 text-red-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Distracted</span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-5 pointer-events-none"
              animate={{
                background: [
                  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #14B8A6 100%)',
                  'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)',
                  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
