import { createContext } from 'react';

export type EmotionalState = 'happy' | 'tired' | 'neutral' | 'sad';

export interface FocusContextType {
  isFocused: boolean;
  setIsFocused: (value: boolean) => void;
  isDetectionEnabled: boolean;
  setIsDetectionEnabled: (value: boolean) => void;
  focusScore: number;
  setFocusScore: (value: number) => void;
  totalFocusedMinutes: number;
  addFocusedTime: (minutes: number) => void;
  emotionalState: EmotionalState;
  setEmotionalState: (value: EmotionalState) => void;
}

export const FocusContext = createContext<FocusContextType>({
  isFocused: false,
  setIsFocused: () => {},
  isDetectionEnabled: false,
  setIsDetectionEnabled: () => {},
  focusScore: 0,
  setFocusScore: () => {},
  totalFocusedMinutes: 0,
  addFocusedTime: () => {},
  emotionalState: 'neutral',
  setEmotionalState: () => {},
});
