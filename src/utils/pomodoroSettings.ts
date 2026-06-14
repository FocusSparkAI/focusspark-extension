import { BACKEND_ROUTES } from '../config/backend';
import backendClient from './backendClient';
import { getStoredValue, setStoredValue } from './chromeStorage';

export const EXTENSION_FOCUS_MINUTES_KEY = 'focusspark-extension-focus-minutes';
export const EXTENSION_BREAK_MINUTES_KEY = 'focusspark-extension-break-minutes';

export type PomodoroTimings = {
  focusMinutes: number;
  breakMinutes: number;
};

const clampMinutes = (value: unknown, fallback: number, min: number, max: number) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return fallback;
  return Math.min(max, Math.max(min, Math.round(minutes)));
};

const saveLocalPomodoroTimings = async ({ focusMinutes, breakMinutes }: PomodoroTimings) => {
  await Promise.all([
    setStoredValue(EXTENSION_FOCUS_MINUTES_KEY, String(focusMinutes)),
    setStoredValue(EXTENSION_BREAK_MINUTES_KEY, String(breakMinutes)),
  ]);
};

const loadLocalPomodoroTimings = async (): Promise<PomodoroTimings> => {
  const [storedFocus, storedBreak] = await Promise.all([
    getStoredValue(EXTENSION_FOCUS_MINUTES_KEY),
    getStoredValue(EXTENSION_BREAK_MINUTES_KEY),
  ]);

  return {
    focusMinutes: clampMinutes(storedFocus, 25, 5, 120),
    breakMinutes: clampMinutes(storedBreak, 5, 1, 60),
  };
};

export const loadSavedPomodoroTimings = async (): Promise<PomodoroTimings> => {
  try {
    const response = await backendClient.get(BACKEND_ROUTES.studySettings);
    const data = response.data ?? {};
    const timings = {
      focusMinutes: clampMinutes(data.pomodoro_duration_minutes, 25, 5, 120),
      breakMinutes: clampMinutes(data.break_duration_minutes, 5, 1, 60),
    };

    await saveLocalPomodoroTimings(timings);
    return timings;
  } catch {
    return loadLocalPomodoroTimings();
  }
};

export const saveSavedPomodoroTimings = async (
  focusMinutes: number,
  breakMinutes: number,
): Promise<PomodoroTimings> => {
  const timings = {
    focusMinutes: clampMinutes(focusMinutes, 25, 5, 120),
    breakMinutes: clampMinutes(breakMinutes, 5, 1, 60),
  };

  await saveLocalPomodoroTimings(timings);

  try {
    await backendClient.put(BACKEND_ROUTES.studySettings, {
      pomodoro_duration_minutes: timings.focusMinutes,
      break_duration_minutes: timings.breakMinutes,
    });
  } catch {
    // Local storage keeps the extension usable if settings sync is temporarily unavailable.
  }

  return timings;
};
