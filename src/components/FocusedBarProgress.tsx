import { motion } from 'motion/react';
import { Clock, AlertCircle, Coffee } from 'lucide-react';
import { usePomodoro } from '../context/PomodoroContext';

interface FocusedBarProgressProps {
  className?: string;
}

export function FocusedBarProgress({ className = '' }: FocusedBarProgressProps) {
  const { phase, isActive, timeRemaining, progress } = usePomodoro();

  // Only show when timer is active or paused
  if (phase === 'idle') return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isWarning = phase === 'focus' && minutes < 5;

  // Variant styles
  const variantStyles = {
    focus: {
      icon: Clock,
      iconColor: 'text-blue-400',
      gradient: 'from-blue-500/20 to-teal-500/20',
      borderColor: 'border-blue-500/40',
      progressGradient: 'from-blue-500 to-teal-500',
      glowColor: 'rgba(59, 130, 246, 0.4)',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-amber-400',
      gradient: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/40',
      progressGradient: 'from-amber-500 to-orange-500',
      glowColor: 'rgba(245, 158, 11, 0.5)',
    },
    break: {
      icon: Coffee,
      iconColor: 'text-green-400',
      gradient: 'from-green-500/20 to-teal-500/20',
      borderColor: 'border-green-500/40',
      progressGradient: 'from-green-500 to-teal-500',
      glowColor: 'rgba(16, 185, 129, 0.4)',
    },
    paused: {
      icon: Clock,
      iconColor: 'text-purple-400',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/40',
      progressGradient: 'from-purple-500 to-pink-500',
      glowColor: 'rgba(139, 92, 246, 0.3)',
    },
  };

  const currentVariant = phase === 'break' ? 'break' : phase === 'paused' ? 'paused' : isWarning ? 'warning' : 'focus';
  const styles = variantStyles[currentVariant];
  const Icon = styles.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        relative w-full max-w-[420px] sm:max-w-[380px] md:max-w-[460px] lg:max-w-[520px] xl:max-w-[580px]
        mx-auto px-4 sm:px-6 py-3 rounded-[20px]
        glass-card border
        bg-gradient-to-r
        backdrop-blur-xl overflow-hidden
        ${styles.borderColor}
        ${styles.gradient}
        ${className}
      `}
    >
      {/* Animated gradient flow background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: isWarning ? 3 : 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Warning pulse effect */}
      {isWarning && isActive && (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30" />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Icon */}
        <motion.div
          animate={
            isWarning && isActive
              ? {
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, 0, -5, 0],
                }
              : isActive
              ? {
                  scale: [1, 1.05, 1],
                }
              : {}
          }
          transition={{
            duration: isWarning ? 1.5 : 2,
            repeat: isActive ? Infinity : 0,
            ease: 'easeInOut',
          }}
          className="flex-shrink-0"
        >
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${styles.iconColor}`} />
        </motion.div>

        {/* Center: Progress bar with countdown */}
        <div className="flex-1 min-w-0">
          {/* Countdown label - Hidden on very small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-1.5 hidden xs:block"
          >
            <span className={`text-sm sm:text-base font-medium ${styles.iconColor}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </motion.div>

          {/* Progress bar */}
          <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${styles.progressGradient} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />

            {/* Shimmer effect */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
          </div>

          {/* Phase label */}
          <div className="text-center mt-1">
            <span className="text-xs text-secondary">
              {phase === 'break' ? 'Break Time' : phase === 'paused' ? 'Paused' : 'Focus Session'}
            </span>
          </div>
        </div>

        {/* Right: Energy wave or status indicator */}
        {isActive && phase === 'focus' && !isWarning && (
          <motion.div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-0.5 sm:w-1 h-3 sm:h-4 bg-gradient-to-t ${styles.progressGradient} rounded-full`}
                animate={{
                  height: ['10px', '14px', '10px'],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}

        {isWarning && isActive && (
          <motion.div
            className="flex-shrink-0"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
          </motion.div>
        )}

        {phase === 'break' && isActive && (
          <motion.div
            className="flex-shrink-0"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
          </motion.div>
        )}

        {!isActive && (
          <motion.div
            className="flex-shrink-0"
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500" />
          </motion.div>
        )}
      </div>

      {/* Glowing border effect */}
      <motion.div
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        animate={{
          boxShadow: [
            `0 0 10px ${styles.glowColor}`,
            `0 0 20px ${styles.glowColor}`,
            `0 0 10px ${styles.glowColor}`,
          ],
        }}
        transition={{
          duration: isWarning ? 1.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
