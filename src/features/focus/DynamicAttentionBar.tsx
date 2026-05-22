import { motion, AnimatePresence } from 'motion/react';
import { UserCircle2, AlertCircle, Smile, Meh, Frown } from 'lucide-react';
import { useFocus } from '../../context/FocusContext';
import { usePomodoro } from '../../context/PomodoroContext';
import { useEffect, useState } from 'react';

interface DynamicAttentionBarProps {
  className?: string;
}

type StateType = {
  type: 'happy' | 'tired' | 'sad' | 'neutral' | 'focused' | 'idle' | 'attention';
  label: string;
  icon: any;
  color: string;
  darkColor: string;
  borderColor: string;
  glowColor: string;
};

export function DynamicAttentionBar({ className = '' }: DynamicAttentionBarProps) {
  const { isDetectionEnabled, isFocused, focusScore, emotionalState } = useFocus();
  const { phase } = usePomodoro();
  const [displayState, setDisplayState] = useState<StateType | null>(null);

  // Check if Pomodoro timer is running
  const isPomodoroRunning = phase !== 'idle';

  // Update display state with smooth transitions whenever dependencies change
  useEffect(() => {
    let newState: StateType;

    if (!isDetectionEnabled) {
      // When camera is disabled, show emotional state
      if (emotionalState === 'happy') {
        newState = {
          type: 'happy',
          label: 'Focused',
          icon: Smile,
          color: '#2563EB',
          darkColor: '#93C5FD',
          borderColor: 'border-blue-500/45 dark:border-blue-300/40',
          glowColor: 'rgba(37, 99, 235, 0.38)',
        };
      } else if (emotionalState === 'tired') {
        newState = {
          type: 'tired',
          label: 'Tired',
          icon: Meh,
          color: '#D97706',
          darkColor: '#FCD34D',
          borderColor: 'border-amber-500/45 dark:border-amber-300/45',
          glowColor: 'rgba(245, 158, 11, 0.42)',
        };
      } else if (emotionalState === 'sad') {
        newState = {
          type: 'sad',
          label: 'Distracted',
          icon: Frown,
          color: '#E11D48',
          darkColor: '#FDA4AF',
          borderColor: 'border-rose-500/45 dark:border-rose-300/45',
          glowColor: 'rgba(244, 63, 94, 0.42)',
        };
      } else {
        // Default to neutral
        newState = {
          type: 'neutral',
          label: 'Neutral',
          icon: Meh,
          color: '#475569',
          darkColor: '#CBD5E1',
          borderColor: 'border-slate-400/45 dark:border-slate-300/35',
          glowColor: 'rgba(148, 163, 184, 0.35)',
        };
      }
    } else {
      // When detection is enabled, use camera-based states
      if (isFocused && focusScore >= 70) {
        newState = {
          type: 'focused',
          label: 'Focused',
          icon: UserCircle2,
          color: '#2563EB',
          darkColor: '#93C5FD',
          borderColor: 'border-blue-500/45 dark:border-blue-300/40',
          glowColor: 'rgba(37, 99, 235, 0.38)',
        };
      } else if (focusScore >= 40) {
        newState = {
          type: 'idle',
          label: 'Idle',
          icon: UserCircle2,
          color: '#64748B',
          darkColor: '#CBD5E1',
          borderColor: 'border-gray-500/30',
          glowColor: 'rgba(156, 163, 175, 0.3)',
        };
      } else {
        newState = {
          type: 'attention',
          label: 'Distracted',
          icon: AlertCircle,
          color: '#E11D48',
          darkColor: '#FDA4AF',
          borderColor: 'border-rose-500/45 dark:border-rose-300/45',
          glowColor: 'rgba(244, 63, 94, 0.42)',
        };
      }
    }

    setDisplayState(newState);
  }, [isDetectionEnabled, isFocused, focusScore, emotionalState, isPomodoroRunning]);

  if (!displayState) return null;

  const state = displayState;
  const Icon = state.icon;
  const isDark = document.documentElement.classList.contains('dark');
  const stateColor = isDark ? state.darkColor : state.color;

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
            duration: state.type === 'happy' ? 4 : state.type === 'sad' ? 8 : state.type === 'tired' ? 7 : 6,
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
                    'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(14, 165, 233, 0.18) 100%)',
                    'linear-gradient(90deg, rgba(14, 165, 233, 0.18) 0%, rgba(45, 212, 191, 0.14) 100%)',
                    'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(14, 165, 233, 0.18) 100%)',
                  ]
                : state.type === 'tired'
                ? [
                    'linear-gradient(90deg, rgba(245, 158, 11, 0.16) 0%, rgba(251, 191, 36, 0.16) 100%)',
                    'linear-gradient(90deg, rgba(251, 191, 36, 0.16) 0%, rgba(217, 119, 6, 0.16) 100%)',
                    'linear-gradient(90deg, rgba(245, 158, 11, 0.16) 0%, rgba(251, 191, 36, 0.16) 100%)',
                  ]
                : state.type === 'sad'
                ? [
                    'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(220, 38, 38, 0.2) 0%, rgba(248, 113, 113, 0.2) 100%)',
                    'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                  ]
                : [
                    'linear-gradient(90deg, rgba(148, 163, 184, 0.16) 0%, rgba(203, 213, 225, 0.16) 100%)',
                    'linear-gradient(90deg, rgba(203, 213, 225, 0.16) 0%, rgba(148, 163, 184, 0.16) 100%)',
                    'linear-gradient(90deg, rgba(148, 163, 184, 0.16) 0%, rgba(203, 213, 225, 0.16) 100%)',
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
              : state.type === 'tired'
              ? {
                  scale: [1, 1.03, 1],
                  opacity: [0.75, 1, 0.75],
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
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" strokeWidth={2.4} style={{ color: stateColor }} />
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
              className="inline-block text-xs sm:text-sm font-medium whitespace-nowrap smooth-gradient-transition"
              style={{ color: stateColor }}
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
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500" />
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
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-400" />
          </motion.div>
        )}

        {state.type === 'tired' && (
          <motion.div
            className="flex-shrink-0"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.45, 0.85, 0.45],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
            }}
          >
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
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

    </motion.div>
  );
}
