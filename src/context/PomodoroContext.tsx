import { useCallback, useState, useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { BACKEND_ROUTES } from '../config/backend';
import backendClient, { getAuthHeaders } from '../utils/backendClient';
import {
  PomodoroContext,
  type PomodoroPhase,
  type PomodoroSession,
  type PomodoroSessionType,
} from './pomodoroContextValue';

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
  startedAt?: string | null;
  sessionDistractionCount?: number;
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
  const [activeStudyStartedAt, setActiveStudyStartedAt] = useState<Date | null>(
    initialStoredSession?.startedAt ? new Date(initialStoredSession.startedAt) : null,
  );
  const [sessionDistractionCount, setSessionDistractionCountState] = useState(
    initialStoredSession?.sessionDistractionCount ?? 0,
  );
  
  const milestoneTrackingRef = useRef({
    fifteenMinutes: false,
    fiveMinutes: false,
  });
  
  const intervalRef = useRef<number | null>(null);
  const activeStudyStartedAtRef = useRef<Date | null>(
    initialStoredSession?.startedAt ? new Date(initialStoredSession.startedAt) : null,
  );
  const sessionDistractionCountRef = useRef(initialStoredSession?.sessionDistractionCount ?? 0);

  useEffect(() => {
    activeStudyStartedAtRef.current = activeStudyStartedAt;
  }, [activeStudyStartedAt]);

  const setSessionDistractionCount = useCallback((count: number) => {
    const nextCount = Math.max(0, Math.floor(count));
    sessionDistractionCountRef.current = nextCount;
    setSessionDistractionCountState(nextCount);
  }, []);

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
      startedAt: activeStudyStartedAt?.toISOString() ?? null,
      sessionDistractionCount,
    };

    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(stored));
  }, [phase, isActive, sessionType, focusMinutes, breakMinutes, timeRemaining, totalTime, activeStudyStartedAt, sessionDistractionCount]);

  // Milestone notifications
  useEffect(() => {
    if (!isActive || phase !== 'focus') return;

    const elapsed = totalTime - timeRemaining;
    const elapsedMinutes = Math.floor(elapsed / 60);
    const remainingMinutes = Math.floor(timeRemaining / 60);

    // 15 minutes milestone
    if (elapsedMinutes >= 15 && !milestoneTrackingRef.current.fifteenMinutes) {
      milestoneTrackingRef.current.fifteenMinutes = true;
      toast.info('15 minutes done — time is going really fast, stay focused!', {
        duration: 5000,
      });
    }

    // 5 minutes remaining milestone
    if (remainingMinutes <= 5 && remainingMinutes > 0 && !milestoneTrackingRef.current.fiveMinutes) {
      milestoneTrackingRef.current.fiveMinutes = true;
      toast.warning(`Only ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} left — finish it strong!`, {
        duration: 5000,
      });
    }
  }, [isActive, phase, timeRemaining, totalTime]);

  const saveCompletedBackendStudySession = useCallback(async (
    plannedDurationMinutes: number,
    actualDurationMinutes: number,
    startedAt: Date,
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await backendClient.post(
        BACKEND_ROUTES.studySessions,
        {
          session_type: 'work',
          planned_duration_minutes: plannedDurationMinutes,
          started_at: startedAt.toISOString(),
        },
        { headers },
      );
      const sessionId = Number(response.data?.id);
      if (!Number.isFinite(sessionId)) {
        return;
      }

      await backendClient.patch(
        BACKEND_ROUTES.studySessionComplete.replace('{session_id}', String(sessionId)),
        {
          ended_at: new Date().toISOString(),
          actual_duration_minutes: Math.max(0, actualDurationMinutes),
          distraction_count: sessionDistractionCountRef.current,
        },
        { headers },
      );
    } catch {
      // Saving should not interrupt the user's timer flow.
    }
  }, []);

  const completeBackendStudySession = useCallback((actualDurationMinutes: number) => {
    const startedAt = activeStudyStartedAtRef.current;
    if (!startedAt) return;

    activeStudyStartedAtRef.current = null;
    setActiveStudyStartedAt(null);
    void saveCompletedBackendStudySession(focusMinutes, actualDurationMinutes, startedAt);
  }, [focusMinutes, saveCompletedBackendStudySession]);

  const startSession = useCallback((type: PomodoroSessionType, customTimings?: { focusMinutes: number; breakMinutes: number }) => {
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
    milestoneTrackingRef.current = { fifteenMinutes: false, fiveMinutes: false };
    
    const startedAt = new Date();
    setActiveStudyStartedAt(startedAt);
    activeStudyStartedAtRef.current = startedAt;
    setSessionDistractionCount(0);

    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      type,
      focusMinutes: nextFocusMinutes,
      breakMinutes: nextBreakMinutes,
      startTime: startedAt,
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
  }, [setSessionDistractionCount]);

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
    setActiveStudyStartedAt(null);
    activeStudyStartedAtRef.current = null;
    
    // Mark session as cancelled
    if (currentSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, cancelledEarly: true, endTime: new Date() } : s
        )
      );
    }
    
    setCurrentSessionId(null);
    setSessionDistractionCount(0);
    toast.info('Session cancelled', { duration: 2000 });
  };

  const completeEarly = () => {
    setIsActive(false);
    const actualDurationMinutes = Math.max(0, Math.ceil((totalTime - timeRemaining) / 60));
    void completeBackendStudySession(actualDurationMinutes);
    
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

  const startBreak = useCallback(() => {
    const duration = breakMinutes * 60;
    
    setPhase('break');
    setTimeRemaining(duration);
    setTotalTime(duration);
    setIsActive(true);
    
    toast.success(`Break started! (${breakMinutes} minute${breakMinutes === 1 ? '' : 's'})`, {
      duration: 3000,
    });
  }, [breakMinutes]);

  const handlePhaseComplete = useCallback(() => {
    if (phase === 'focus') {
      setIsActive(false);

      if (currentSessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, completed: true, endTime: new Date() } : s
          )
        );
      }
      void completeBackendStudySession(focusMinutes);

      toast.success('Session complete. Start break?', {
        duration: 8000,
        action: {
          label: 'Start Break',
          onClick: () => startBreak(),
        },
      });
    } else if (phase === 'break') {
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
  }, [completeBackendStudySession, currentSessionId, focusMinutes, phase, startBreak, startSession]);

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
  }, [isActive, timeRemaining, handlePhaseComplete]);

  const skipBreak = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeRemaining(0);
    setTotalTime(0);
    setCurrentSessionId(null);
    setSessionDistractionCount(0);
    setActiveStudyStartedAt(null);
    activeStudyStartedAtRef.current = null;
    
    toast.info('Break skipped', { duration: 2000 });
  };

  const endSession = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeRemaining(0);
    setTotalTime(0);
    setCurrentSessionId(null);
    setActiveStudyStartedAt(null);
    activeStudyStartedAtRef.current = null;
    setSessionDistractionCount(0);
    
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
        sessionDistractionCount,
        sessions,
        setSessionDistractionCount,
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
