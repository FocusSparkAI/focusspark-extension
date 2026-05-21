import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';

export type PomodoroSessionType = '25/5' | '50/10' | 'custom';
export type PomodoroPhase = 'idle' | 'focus' | 'break' | 'paused';

interface PomodoroSession {
  id: string;
  type: PomodoroSessionType;
  focusMinutes: number;
  breakMinutes: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  cancelledEarly?: boolean;
}

interface PomodoroContextType {
  // State
  isActive: boolean;
  phase: PomodoroPhase;
  sessionType: PomodoroSessionType;
  focusMinutes: number;
  breakMinutes: number;
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  progress: number; // 0-100
  sessions: PomodoroSession[];
  
  // Actions
  startSession: (type: PomodoroSessionType, customTimings?: { focusMinutes: number; breakMinutes: number }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  completeEarly: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  endSession: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const POMODORO_STORAGE_KEY = 'focusspark-pomodoro-session';

type StoredPomodoroSession = {
  phase: PomodoroPhase;
  isActive: boolean;
  sessionType: PomodoroSessionType;
  focusMinutes: number;
  breakMinutes: number;
  timeRemaining: number;
  totalTime: number;
  endAt: number | null;
};

function readStoredPomodoroSession(): StoredPomodoroSession | null {
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredPomodoroSession;
    if (!stored || stored.phase === 'idle') return null;

    if (stored.isActive && typeof stored.endAt === 'number') {
      const nextRemaining = Math.max(0, Math.ceil((stored.endAt - Date.now()) / 1000));
      if (nextRemaining <= 0) return null;
      return { ...stored, timeRemaining: nextRemaining };
    }

    return stored;
  } catch {
    return null;
  }
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const initialStoredSession = readStoredPomodoroSession();
  const [isActive, setIsActive] = useState(initialStoredSession?.isActive ?? false);
  const [phase, setPhase] = useState<PomodoroPhase>(initialStoredSession?.phase ?? 'idle');
  const [sessionType, setSessionType] = useState<PomodoroSessionType>(initialStoredSession?.sessionType ?? '25/5');
  const [focusMinutes, setFocusMinutes] = useState(initialStoredSession?.focusMinutes ?? 25);
  const [breakMinutes, setBreakMinutes] = useState(initialStoredSession?.breakMinutes ?? 5);
  const [timeRemaining, setTimeRemaining] = useState(initialStoredSession?.timeRemaining ?? 0);
  const [totalTime, setTotalTime] = useState(initialStoredSession?.totalTime ?? 0);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Milestone tracking
  const [milestoneTracking, setMilestoneTracking] = useState({
    fifteenMinutes: false,
    fiveMinutes: false,
  });
  
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'idle') {
      localStorage.removeItem(POMODORO_STORAGE_KEY);
      return;
    }

    const stored: StoredPomodoroSession = {
      phase,
      isActive,
      sessionType,
      focusMinutes,
      breakMinutes,
      timeRemaining,
      totalTime,
      endAt: isActive ? Date.now() + timeRemaining * 1000 : null,
    };

    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(stored));
  }, [phase, isActive, sessionType, focusMinutes, breakMinutes, timeRemaining, totalTime]);

  // Timer countdown effect
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  // Milestone notifications
  useEffect(() => {
    if (!isActive || phase !== 'focus') return;

    const elapsed = totalTime - timeRemaining;
    const elapsedMinutes = Math.floor(elapsed / 60);
    const remainingMinutes = Math.floor(timeRemaining / 60);

    // 15 minutes milestone
    if (elapsedMinutes >= 15 && !milestoneTracking.fifteenMinutes) {
      setMilestoneTracking((prev) => ({ ...prev, fifteenMinutes: true }));
      toast.info('15 minutes done — time is going really fast, stay focused!', {
        duration: 5000,
      });
    }

    // 5 minutes remaining milestone
    if (remainingMinutes <= 5 && remainingMinutes > 0 && !milestoneTracking.fiveMinutes) {
      setMilestoneTracking((prev) => ({ ...prev, fiveMinutes: true }));
      toast.warning(`Only ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} left — finish it strong!`, {
        duration: 5000,
      });
    }
  }, [isActive, phase, timeRemaining, totalTime, milestoneTracking]);

  const handlePhaseComplete = () => {
    if (phase === 'focus') {
      // Focus session complete
      setIsActive(false);
      
      // Update session as completed
      if (currentSessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, completed: true, endTime: new Date() } : s
          )
        );
      }

      // Show completion toast
      toast.success('Session complete. Start break?', {
        duration: 8000,
        action: {
          label: 'Start Break',
          onClick: () => startBreak(),
        },
      });
    } else if (phase === 'break') {
      // Break complete
      setIsActive(false);
      setPhase('idle');
      setTimeRemaining(0);
      setTotalTime(0);
      setCurrentSessionId(null);
      
      toast.success('Break complete! Ready for another session?', {
        duration: 5000,
        action: {
          label: 'Start 25/5',
          onClick: () => startSession('25/5'),
        },
      });
    }
  };

  const startSession = (type: PomodoroSessionType, customTimings?: { focusMinutes: number; breakMinutes: number }) => {
    const nextFocusMinutes =
      type === 'custom' && customTimings
        ? customTimings.focusMinutes
        : type === '50/10'
        ? 50
        : 25;
    const nextBreakMinutes =
      type === 'custom' && customTimings
        ? customTimings.breakMinutes
        : type === '50/10'
        ? 10
        : 5;
    const duration = nextFocusMinutes * 60;
    
    setSessionType(type);
    setFocusMinutes(nextFocusMinutes);
    setBreakMinutes(nextBreakMinutes);
    setPhase('focus');
    setTimeRemaining(duration);
    setTotalTime(duration);
    setIsActive(true);
    setMilestoneTracking({ fifteenMinutes: false, fiveMinutes: false });
    
    // Create new session record
    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      type,
      focusMinutes: nextFocusMinutes,
      breakMinutes: nextBreakMinutes,
      startTime: new Date(),
      completed: false,
    };
    
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    
    toast.success(
      `Started ${nextFocusMinutes} min focus session with a ${nextBreakMinutes} min break.`,
      {
      duration: 3000,
      },
    );
  };

  const pauseSession = () => {
    setIsActive(false);
    setPhase('paused');
    toast.info('Session paused', { duration: 2000 });
  };

  const resumeSession = () => {
    setIsActive(true);
    setPhase('focus');
    toast.success('Session resumed!', { duration: 2000 });
  };

  const cancelSession = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeRemaining(0);
    setTotalTime(0);
    
    // Mark session as cancelled
    if (currentSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, cancelledEarly: true, endTime: new Date() } : s
        )
      );
    }
    
    setCurrentSessionId(null);
    toast.info('Session cancelled', { duration: 2000 });
  };

  const completeEarly = () => {
    setIsActive(false);
    
    // Mark session as completed early
    if (currentSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, completed: true, endTime: new Date() } : s
        )
      );
    }
    
    toast.success('Session marked complete. Start break?', {
      duration: 8000,
      action: {
        label: 'Start Break',
        onClick: () => startBreak(),
      },
    });
  };

  const startBreak = () => {
    const duration = breakMinutes * 60;
    
    setPhase('break');
    setTimeRemaining(duration);
    setTotalTime(duration);
    setIsActive(true);
    
    toast.success(`Break started! (${breakMinutes} minute${breakMinutes === 1 ? '' : 's'})`, {
      duration: 3000,
    });
  };

  const skipBreak = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeRemaining(0);
    setTotalTime(0);
    setCurrentSessionId(null);
    
    toast.info('Break skipped', { duration: 2000 });
  };

  const endSession = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeRemaining(0);
    setTotalTime(0);
    setCurrentSessionId(null);
    
    toast.success('Session ended', { duration: 2000 });
  };

  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  return (
    <PomodoroContext.Provider
      value={{
        isActive,
        phase,
        sessionType,
        focusMinutes,
        breakMinutes,
        timeRemaining,
        totalTime,
        progress,
        sessions,
        startSession,
        pauseSession,
        resumeSession,
        cancelSession,
        completeEarly,
        startBreak,
        skipBreak,
        endSession,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
}
