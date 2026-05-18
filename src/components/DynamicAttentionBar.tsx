import { motion, AnimatePresence } from 'motion/react';
import { UserCircle2, AlertCircle, Smile, Meh, Frown } from 'lucide-react';
import { useFocus } from '../context/FocusContext';
import { usePomodoro } from '../context/PomodoroContext';
import { useEffect, useState } from 'react';

interface DynamicAttentionBarProps {
  className?: string;
}

type StateType = {
  type: 'happy' | 'sad' | 'neutral' | 'focused' | 'idle' | 'attention';
  label: string;
  icon: any;
  color: string;
  borderColor: string;
  glowColor: string;
};

export function DynamicAttentionBar({ className = '' }: DynamicAttentionBarProps) {
  const { isDetectionEnabled, isFocused, focusScore, emotionalState } = useFocus();
  const { phase, progress, isActive } = usePomodoro();
  const [displayState, setDisplayState] = useState<StateType | null>(null);

  // Check if Pomodoro timer is running
  const isPomodoroRunning = phase !== 'idle';
  const isWarning = phase === 'focus' && progress > 80; // Last 20% is warning

  // Pomodoro progress gradient based on phase
  const pomodoroGradient = 
    phase === 'break' 
      ? 'from-green-500 to-teal-500'
      : phase === 'paused'
      ? 'from-purple-500 to-pink-500'
      : isWarning
      ? 'from-amber-500 to-orange-500'
      : 'from-blue-500 to-teal-500';

  const pomodoroGlow = 
    phase === 'break'
      ? 'rgba(16, 185, 129, 0.6)'
      : phase === 'paused'
      ? 'rgba(139, 92, 246, 0.4)'
      : isWarning
      ? 'rgba(245, 158, 11, 0.7)'
      : 'rgba(59, 130, 246, 0.6)';

  // Update display state with smooth transitions whenever dependencies change
  useEffect(() => {
    let newState: StateType;

    if (!isDetectionEnabled) {
      // When camera is disabled, show emotional state
      if (emotionalState === 'happy') {
        newState = {
          type: 'happy',
          label: 'Happy',
          icon: Smile,
          color: 'text-green-400',
          borderColor: 'border-green-500/50',
          glowColor: 'rgba(16, 185, 129, 0.5)',
        };
      } else if (emotionalState === 'sad') {
        newState = {
          type: 'sad',
          label: 'Sad',
          icon: Frown,
          color: 'text-red-400',
          borderColor: 'border-red-500/50',
          glowColor: 'rgba(239, 68, 68, 0.5)',
        };
      } else {
        // Default to neutral
        newState = {
          type: 'neutral',
          label: 'Neutral',
          icon: Meh,
          color: 'text-amber-400',
          borderColor: 'border-amber-500/50',
          glowColor: 'rgba(245, 158, 11, 0.5)',
        };
      }
    } else {
      // When detection is enabled, use camera-based states
      if (isFocused && focusScore >= 70) {
        newState = {
          type: 'focused',
          label: 'Focused',
          icon: UserCircle2,
          color: 'text-blue-400',
          borderColor: 'border-blue-500/40',
          glowColor: 'rgba(59, 130, 246, 0.4)',
        };
      } else if (focusScore >= 40) {
        newState = {
          type: 'idle',
          label: 'Idle',
          icon: UserCircle2,
          color: 'text-gray-400',
          borderColor: 'border-gray-500/30',
          glowColor: 'rgba(156, 163, 175, 0.3)',
        };
      } else {
        newState = {
          type: 'attention',
          label: 'Attention Needed',
          icon: AlertCircle,
          color: 'text-amber-400',
          borderColor: 'border-amber-500/40',
          glowColor: 'rgba(245, 158, 11, 0.4)',
        };
      }
    }

    setDisplayState(newState);
  }, [isDetectionEnabled, isFocused, focusScore, emotionalState, isPomodoroRunning]);

  if (!displayState) return null;

  const state = displayState;
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 0.5,
        opacity: { duration: 0.4 },
        y: { duration: 0.5 },
      }}
      className={`
        relative w-full 
        max-w-[400px] sm:max-w-[380px] md:max-w-[420px] 
        mx-auto px-4 sm:px-6 py-3 pb-4 rounded-[20px]
        border
        bg-background/40
        backdrop-blur-xl overflow-hidden
        smooth-gradient-transition
        ${state.borderColor}
        ${className}
      `}
    >
      {/* Animated gradient flow background - Enhanced for emotional states */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: state.type === 'happy' ? 4 : state.type === 'sad' ? 8 : 6,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
      
      {/* Additional emotional gradient layer for camera disabled mode */}
      {!isDetectionEnabled && (
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: 
              state.type === 'happy'
                ? [
                    'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(20, 184, 166, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.2) 100%)',
                  ]
                : state.type === 'sad'
                ? [
                    'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(220, 38, 38, 0.2) 0%, rgba(248, 113, 113, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                  ]
                : [
                    'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(217, 119, 6, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
                  ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Content */}
      <div className="relative flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Animated Face Icon */}
        <motion.div
          animate={
            state.type === 'focused'
              ? {
                  scale: [1, 1.1, 1],
                  filter: ['hue-rotate(0deg) brightness(1)', 'hue-rotate(10deg) brightness(1.1)', 'hue-rotate(0deg) brightness(1)'],
                }
              : state.type === 'attention'
              ? {
                  scale: [1, 1.15, 1],
                  filter: ['hue-rotate(0deg) brightness(1)', 'hue-rotate(30deg) brightness(0.9)', 'hue-rotate(0deg) brightness(1)'],
                }
              : state.type === 'happy'
              ? {
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, 0, -5, 0],
                }
              : state.type === 'sad'
              ? {
                  scale: [1, 0.95, 1],
                  opacity: [1, 0.7, 1],
                }
              : state.type === 'neutral'
              ? {
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8],
                }
              : {
                  opacity: [0.7, 1, 0.7],
                }
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex-shrink-0"
        >
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${state.color}`} />
        </motion.div>

        {/* Center: Dynamic Status Text */}
        <div className="flex-1 text-center min-w-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={state.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.3,
                ease: 'easeInOut'
              }}
              className={`inline-block text-xs sm:text-sm font-medium whitespace-nowrap smooth-gradient-transition ${state.color}`}
            >
              {state.label}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Right: Energy Wave Effect */}
        {state.type === 'focused' && (
          <motion.div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 sm:w-1 h-3 sm:h-4 bg-gradient-to-t from-blue-500 to-teal-500 rounded-full"
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

        {state.type === 'attention' && (
          <motion.div
            className="flex-shrink-0"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
          </motion.div>
        )}

        {state.type === 'idle' && (
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
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-500" />
          </motion.div>
        )}

        {/* Emotional State Indicators */}
        {state.type === 'happy' && (
          <motion.div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 sm:w-1 h-3 sm:h-4 bg-gradient-to-t from-green-500 to-teal-500 rounded-full"
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

        {state.type === 'neutral' && (
          <motion.div
            className="flex-shrink-0"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-600" />
          </motion.div>
        )}

        {state.type === 'sad' && (
          <motion.div
            className="flex-shrink-0"
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
          </motion.div>
        )}
      </div>

      {/* Glowing border effect - transitions smoothly between states */}
      <motion.div
        className="absolute inset-0 rounded-[20px] pointer-events-none smooth-gradient-transition"
        animate={{
          boxShadow: [
            `0 0 10px ${state.glowColor}`,
            `0 0 20px ${state.glowColor}`,
            `0 0 10px ${state.glowColor}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Integrated Pomodoro Progress Line - Appears when timer is running */}
      <AnimatePresence>
        {isPomodoroRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-2"
          >
            {/* Progress line container */}
            <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
              {/* Animated progress fill */}
              <motion.div
                className={`h-full bg-gradient-to-r ${pomodoroGradient} rounded-full relative`}
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
                      `0 0 4px ${pomodoroGlow}`,
                      `0 0 8px ${pomodoroGlow}`,
                      `0 0 4px ${pomodoroGlow}`,
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}