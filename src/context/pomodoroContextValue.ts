import { createContext } from 'react';

export type PomodoroSessionType = '25/5' | '50/10' | 'custom';
export type PomodoroPhase = 'idle' | 'focus' | 'break' | 'paused';

export interface PomodoroSession {
  id: string;
  type: PomodoroSessionType;
  focusMinutes: number;
  breakMinutes: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  cancelledEarly?: boolean;
}

export interface PomodoroContextType {
  isActive: boolean;
  phase: PomodoroPhase;
  sessionType: PomodoroSessionType;
  focusMinutes: number;
  breakMinutes: number;
  timeRemaining: number;
  totalTime: number;
  progress: number;
  sessions: PomodoroSession[];
  startSession: (type: PomodoroSessionType, customTimings?: { focusMinutes: number; breakMinutes: number }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  cancelSession: () => void;
  completeEarly: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  endSession: () => void;
}

export const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);
