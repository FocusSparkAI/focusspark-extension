import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { Button } from './ui/button';
import { usePomodoro } from '../context/PomodoroContext';

interface TimerButtonProps {
  onClick: () => void;
  className?: string;
}

export function TimerButton({ onClick, className = '' }: TimerButtonProps) {
  const { phase, isActive } = usePomodoro();

  // Determine variant based on phase
  const getVariant = () => {
    if (phase === 'focus' && isActive) return 'running';
    if (phase === 'paused') return 'paused';
    if (phase === 'break' && isActive) return 'break';
    return 'idle';
  };

  const variant = getVariant();

  // Colors and styles based on variant
  const variantStyles = {
    idle: {
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      bgGradient: 'from-purple-500/10 to-blue-500/10',
      hoverGradient: 'hover:from-purple-500/20 hover:to-blue-500/20',
      glow: 'rgba(139, 92, 246, 0)',
      showBadge: false,
    },
    running: {
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      bgGradient: 'from-blue-500/20 to-teal-500/20',
      hoverGradient: 'hover:from-blue-500/30 hover:to-teal-500/30',
      glow: 'rgba(59, 130, 246, 0.5)',
      showBadge: true,
    },
    paused: {
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      bgGradient: 'from-amber-500/20 to-orange-500/20',
      hoverGradient: 'hover:from-amber-500/30 hover:to-orange-500/30',
      glow: 'rgba(245, 158, 11, 0.4)',
      showBadge: true,
    },
    break: {
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/40',
      bgGradient: 'from-green-500/20 to-teal-500/20',
      hoverGradient: 'hover:from-green-500/30 hover:to-teal-500/30',
      glow: 'rgba(16, 185, 129, 0.4)',
      showBadge: true,
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        className={`
          relative
          bg-gradient-to-r ${styles.bgGradient}
          ${styles.borderColor}
          ${styles.hoverGradient}
          transition-all duration-300
          ${className}
        `}
        aria-label="Start Focus Timer"
        title={
          variant === 'running'
            ? 'Focus Timer Running'
            : variant === 'paused'
            ? 'Timer Paused'
            : variant === 'break'
            ? 'On Break'
            : 'Start Focus Timer'
        }
      >
        <motion.div
          animate={
            variant === 'running'
              ? { rotate: [0, 360] }
              : {}
          }
          transition={{
            duration: 2,
            repeat: variant === 'running' ? Infinity : 0,
            ease: 'linear',
          }}
        >
          <Clock className={`w-5 h-5 ${styles.iconColor}`} />
        </motion.div>

        {/* Running Badge - small pulsing dot */}
        {styles.showBadge && (
          <motion.div
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </Button>

      {/* Glowing effect */}
      <motion.div
        className="absolute inset-0 rounded-md pointer-events-none"
        animate={{
          boxShadow: [
            `0 0 10px ${styles.glow}`,
            `0 0 20px ${styles.glow}`,
            `0 0 10px ${styles.glow}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
