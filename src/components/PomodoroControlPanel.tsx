import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, X, CheckCircle, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { usePomodoro } from '../context/PomodoroContext';

interface PomodoroControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PomodoroControlPanel({ isOpen, onClose }: PomodoroControlPanelProps) {
  const {
    phase,
    isActive,
    sessionType,
    pauseSession,
    resumeSession,
    cancelSession,
    completeEarly,
    skipBreak,
    endSession,
  } = usePomodoro();

  // Only show panel when timer is active or paused
  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-20 right-4 sm:right-8 md:right-12 lg:right-16 z-50 w-80 sm:w-96"
          >
            <div className="bg-white dark:bg-[#1C1F2A] border border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Header */}
              <div className="p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {phase === 'break' ? 'Break Time' : 'Focus Session'}
                    </h3>
                    <p className="text-sm text-secondary mt-0.5">
                      {sessionType} session
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-accent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 space-y-3">
                {/* Focus Session Controls */}
                {(phase === 'focus' || phase === 'paused') && (
                  <>
                    {/* Pause/Resume */}
                    <Button
                      onClick={isActive ? pauseSession : resumeSession}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                      size="lg"
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>

                    {/* I Have Done */}
                    <Button
                      onClick={completeEarly}
                      variant="outline"
                      className="w-full border-green-500/40 bg-gradient-to-r from-green-500/10 to-teal-500/10 hover:from-green-500/20 hover:to-teal-500/20"
                      size="lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                      I have done
                    </Button>

                    {/* Cancel */}
                    <Button
                      onClick={cancelSession}
                      variant="outline"
                      className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
                      size="lg"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}

                {/* Break Controls */}
                {phase === 'break' && (
                  <>
                    {/* Pause/Resume Break */}
                    <Button
                      onClick={isActive ? pauseSession : resumeSession}
                      className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:opacity-90"
                      size="lg"
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pause Break
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Resume Break
                        </>
                      )}
                    </Button>

                    {/* Skip Break */}
                    <Button
                      onClick={skipBreak}
                      variant="outline"
                      className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                      size="lg"
                    >
                      <SkipForward className="w-5 h-5 mr-2" />
                      Skip Break
                    </Button>

                    {/* End Session */}
                    <Button
                      onClick={endSession}
                      variant="outline"
                      className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
                      size="lg"
                    >
                      <X className="w-5 h-5 mr-2" />
                      End
                    </Button>
                  </>
                )}
              </div>

              {/* Tips */}
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="text-xs text-secondary">
                  {phase === 'break'
                    ? '☕ Take a break! Stretch, hydrate, and rest your eyes.'
                    : '🎯 Stay focused! Minimize distractions and work on one task at a time.'}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
