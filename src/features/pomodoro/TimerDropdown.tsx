import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePomodoro } from '../../context/PomodoroContext';

interface TimerDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement?: HTMLElement | null;
}

const readSavedMinutes = (key: string, fallback: number, min: number, max: number) => {
  const value = Number(localStorage.getItem(key));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

export function TimerDropdown({ isOpen, onClose }: TimerDropdownProps) {
  const { startSession } = usePomodoro();
  const focusMinutes = readSavedMinutes('focusspark-extension-focus-minutes', 25, 5, 120);
  const breakMinutes = readSavedMinutes('focusspark-extension-break-minutes', 5, 1, 60);

  const handleStart = () => {
    startSession('custom', { focusMinutes, breakMinutes });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-20 right-4 sm:right-8 md:right-12 lg:right-16 z-50 w-80 sm:w-96"
          >
            <div className="bg-white dark:bg-[#1C1F2A] border border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h3 className="font-medium">Start Focus Session</h3>
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

              <div className="p-4">
                <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500/15 to-teal-500/15 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {focusMinutes} min focus • {breakMinutes} min break
                      </p>
                      <p className="text-sm text-secondary mt-1">
                        Uses your saved Pomodoro timing from the dashboard.
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleStart}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:opacity-90"
                >
                  Start
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
