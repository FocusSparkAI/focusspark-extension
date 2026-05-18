import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { usePomodoro, type PomodoroSessionType } from '../context/PomodoroContext';

interface TimerDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement?: HTMLElement | null;
}

export function TimerDropdown({ isOpen, onClose }: TimerDropdownProps) {
  const { startSession } = usePomodoro();
  const [selectedType, setSelectedType] = useState<PomodoroSessionType>('25/5');

  const handleStart = () => {
    startSession(selectedType);
    onClose();
  };

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

          {/* Dropdown */}
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

              {/* Session Options */}
              <div className="p-4 space-y-3">
                {/* 25/5 Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType('25/5')}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all text-left
                    ${
                      selectedType === '25/5'
                        ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-blue-500/20'
                        : 'border-border hover:border-purple-500/50 bg-muted/30'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">25 min focus • 5 min break</p>
                      <p className="text-sm text-secondary mt-1">
                        Perfect for quick, focused sessions
                      </p>
                    </div>
                    {selectedType === '25/5' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>

                {/* 50/10 Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType('50/10')}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all text-left
                    ${
                      selectedType === '50/10'
                        ? 'border-blue-500 bg-gradient-to-r from-blue-500/20 to-teal-500/20'
                        : 'border-border hover:border-blue-500/50 bg-muted/30'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">50 min focus • 10 min break</p>
                      <p className="text-sm text-secondary mt-1">
                        Deep work sessions for maximum flow
                      </p>
                    </div>
                    {selectedType === '50/10' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Actions */}
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
