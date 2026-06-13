import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePomodoro } from '../../hooks/usePomodoro';
import { loadSavedPomodoroTimings } from '../../utils/pomodoroSettings';

interface TimerDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement?: HTMLElement | null;
}

export function TimerDropdown({ isOpen, onClose }: TimerDropdownProps) {
  const { startSession } = usePomodoro();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const handleStart = () => {
    startSession('custom', { focusMinutes, breakMinutes });
    onClose();
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    void loadSavedPomodoroTimings().then(({ focusMinutes: savedFocusMinutes, breakMinutes: savedBreakMinutes }) => {
      if (!isMounted) return;
      setFocusMinutes(savedFocusMinutes);
      setBreakMinutes(savedBreakMinutes);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen]);

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
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-20 right-4 sm:right-8 md:right-12 lg:right-16 z-50 w-80 sm:w-96"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timer-dropdown-title"
          >
            <div className="bg-white dark:bg-[#1C1F2A] border border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h3 id="timer-dropdown-title" className="font-medium">Start Focus Session</h3>
                  </div>
                  <Button
                    ref={closeButtonRef}
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-accent"
                    aria-label="Close timer dialog"
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
