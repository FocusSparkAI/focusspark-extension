import { motion } from 'motion/react';
import { usePomodoro } from '../context/PomodoroContext';

/**
 * Thin timer progress line that overlays on the Dynamic Island
 * Shows real-time Pomodoro progress without disrupting existing content
 */
export function PomodoroProgressLine() {
  const { phase, progress, isActive } = usePomodoro();

  // Only show when timer is active
  if (phase === 'idle') return null;

  const isWarning = phase === 'focus' && progress > 80; // Last 20% is warning

  // Progress gradient based on phase
  const progressGradient = 
    phase === 'break' 
      ? 'from-green-500 to-teal-500'
      : phase === 'paused'
      ? 'from-purple-500 to-pink-500'
      : isWarning
      ? 'from-amber-500 to-orange-500'
      : 'from-blue-500 to-teal-500';

  const glowColor = 
    phase === 'break'
      ? 'rgba(16, 185, 129, 0.6)'
      : phase === 'paused'
      ? 'rgba(139, 92, 246, 0.4)'
      : isWarning
      ? 'rgba(245, 158, 11, 0.7)'
      : 'rgba(59, 130, 246, 0.6)';

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 px-4 sm:px-6 flex items-end">
      {/* Container for the progress line - positioned at the bottom edge */}
      <div className="w-full h-0.5 bg-muted/20 rounded-full overflow-hidden">
        {/* Animated progress fill */}
        <motion.div
          className={`h-full bg-gradient-to-r ${progressGradient} rounded-full relative`}
          initial={{ width: 0 }}
          animate={{ 
            width: `${progress}%`,
          }}
          transition={{ 
            duration: 0.5, 
            ease: 'easeOut',
          }}
        >
          {/* Shimmer effect on the progress line */}
          {isActive && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: isWarning ? 1.5 : 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                `0 0 4px ${glowColor}`,
                `0 0 8px ${glowColor}`,
                `0 0 4px ${glowColor}`,
              ],
            }}
            transition={{
              duration: isWarning ? 1 : 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
