import { useContext } from 'react';
import { PomodoroContext } from '../context/pomodoroContextValue';

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
}
