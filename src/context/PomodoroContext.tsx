import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';

export type PomodoroSessionType = '25/5' | '50/10';
export type PomodoroPhase = 'idle' | 'focus' | 'break' | 'paused';

interface PomodoroSession {
  id: string;
  type: PomodoroSessionType;
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
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  progress: number; // 0-100
  sessions: PomodoroSession[];
  
  // Actions
  startSession: (type: PomodoroSessionType) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  completeEarly: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  endSession: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const SESSION_DURATIONS: Record<PomodoroSessionType, { focus: number; break: number }> = {
  '25/5': { focus: 25 * 60, break: 5 * 60 },
  '50/10': { focus: 50 * 60, break: 10 * 60 },
};

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<PomodoroPhase>('idle');
  const [sessionType, setSessionType] = useState<PomodoroSessionType>('25/5');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Milestone tracking
  const [milestoneTracking, setMilestoneTracking] = useState({
    fifteenMinutes: false,
    fiveMinutes: false,
  });
  
  const intervalRef = useRef<number | null>(null);

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
      toast.warning('Only 5 minutes left — finish it strong!', {
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

  const startSession = (type: PomodoroSessionType) => {
    const duration = SESSION_DURATIONS[type].focus;
    
    setSessionType(type);
    setPhase('focus');
    setTimeRemaining(duration);
    setTotalTime(duration);
    setIsActive(true);
    setMilestoneTracking({ fifteenMinutes: false, fiveMinutes: false });
    
    // Create new session record
    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      type,
      startTime: new Date(),
      completed: false,
    };
    
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    
    toast.success(`Started ${type.split('/')[0]} min focus session!`, {
      duration: 3000,
    });
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
    const duration = SESSION_DURATIONS[sessionType].break;
    
    setPhase('break');
    setTimeRemaining(duration);
    setTotalTime(duration);
    setIsActive(true);
    
    toast.success(`Break started! (${duration / 60} minutes)`, {
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
