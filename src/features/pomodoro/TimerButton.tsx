import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePomodoro } from '../../hooks/usePomodoro';

interface TimerButtonProps {
  onClick: () => void;
  className?: string;
}

export function TimerButton({ onClick, className = '' }: TimerButtonProps) {
  const { phase, isActive, timeRemaining } = usePomodoro();

  // Determine variant based on phase
  const getVariant = () => {
    if (phase === 'focus' && isActive) return 'running';
    if (phase === 'paused') return 'paused';
    if (phase === 'break' && isActive) return 'break';
    return 'idle';
  };

  const variant = getVariant();
  const showTime = phase !== 'idle';
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const phaseLabel =
    phase === 'break'
      ? 'Break'
      : phase === 'paused'
      ? 'Paused'
      : 'Focus';

  // Colors and styles based on variant
  const variantStyles = {
    idle: {
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      bgGradient: 'from-purple-500/10 to-blue-500/10',
      hoverGradient: 'hover:from-purple-500/20 hover:to-blue-500/20',
      glow: 'rgba(139, 92, 246, 0)',
    },
    running: {
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      bgGradient: 'from-blue-500/20 to-teal-500/20',
      hoverGradient: 'hover:from-blue-500/30 hover:to-teal-500/30',
      glow: 'rgba(59, 130, 246, 0.5)',
    },
    paused: {
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      bgGradient: 'from-amber-500/20 to-orange-500/20',
      hoverGradient: 'hover:from-amber-500/30 hover:to-orange-500/30',
      glow: 'rgba(245, 158, 11, 0.4)',
    },
    break: {
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/40',
      bgGradient: 'from-green-500/20 to-teal-500/20',
      hoverGradient: 'hover:from-green-500/30 hover:to-teal-500/30',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div className="relative">
      <Button
        variant="outline"
        size={showTime ? 'sm' : 'icon'}
        onClick={onClick}
        className={`
          relative
          ${showTime ? 'h-10 min-w-[92px] gap-2 px-3 justify-center' : ''}
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

        {showTime && (
          <span className="flex items-center gap-1.5 whitespace-nowrap leading-none">
            <span className={`hidden sm:inline text-xs font-semibold leading-none ${styles.iconColor}`}>{phaseLabel}</span>
            <span className="font-mono text-sm leading-none tabular-nums text-foreground">{formattedTime}</span>
          </span>
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
