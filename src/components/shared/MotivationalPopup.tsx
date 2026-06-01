import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertCircle, Coffee } from 'lucide-react';

interface MotivationalPopupProps {
  isVisible: boolean;
  message: string;
  type: 'focused' | 'attention' | 'idle';
  onClose: () => void;
}

export function MotivationalPopup({
  isVisible,
  message,
  type,
  onClose,
}: MotivationalPopupProps) {
  void onClose;

  const getConfig = () => {
    switch (type) {
      case 'focused':
        return {
          icon: Sparkles,
          gradient: 'from-blue-400/20 to-cyan-400/20',
          borderColor: 'border-blue-400/40',
          iconColor: 'text-blue-400',
          glowColor: 'rgba(59, 130, 246, 0.4)',
        };
      case 'attention':
        return {
          icon: AlertCircle,
          gradient: 'from-orange-400/20 to-amber-400/20',
          borderColor: 'border-orange-400/40',
          iconColor: 'text-orange-400',
          glowColor: 'rgba(251, 146, 60, 0.4)',
        };
      case 'idle':
        return {
          icon: Coffee,
          gradient: 'from-gray-400/20 to-green-400/20',
          borderColor: 'border-gray-400/40',
          iconColor: 'text-gray-400',
          glowColor: 'rgba(156, 163, 175, 0.4)',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -30 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div
            className={`
              relative  rounded-2xl p-6 border ${config.borderColor}
              bg-gradient-to-r ${config.gradient}
              backdrop-blur-xl shadow-2xl
            `}
          >
            {/* Glowing border effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 20px ${config.glowColor}`,
                  `0 0 40px ${config.glowColor}`,
                  `0 0 20px ${config.glowColor}`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-4">
              {/* Icon */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Icon className={`w-8 h-8 ${config.iconColor}`} />
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1"
              >
                <p className="text-lg">{message}</p>
              </motion.div>
            </div>

            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
              animate={{
                background: [
                  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  'linear-gradient(135deg, #8B5CF6 0%, #14B8A6 100%)',
                  'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)',
                  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                ],
              }}
              transition={{
                duration: 6,
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
