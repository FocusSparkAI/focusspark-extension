import React, { useState } from 'react';
import { FocusContext, type EmotionalState } from './focusContextValue';

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDetectionEnabled, setDetectionEnabledState] = useState(() => {
    const saved = localStorage.getItem('focusspark-camera-detection');
    return saved === 'true';
  });
  const [focusScore, setFocusScore] = useState(50); // Default to idle state
  const [totalFocusedMinutes, setTotalFocusedMinutes] = useState(() => {
    const saved = localStorage.getItem('focusspark-total-focus-time');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('neutral');

  const setIsDetectionEnabled = (value: boolean) => {
    localStorage.setItem('focusspark-camera-detection', value.toString());
    setDetectionEnabledState(value);

    if (!value) {
      setIsFocused(false);
      setFocusScore(50);
    }
  };

  const addFocusedTime = (minutes: number) => {
    setTotalFocusedMinutes((prev) => {
      const newTotal = prev + minutes;
      localStorage.setItem('focusspark-total-focus-time', newTotal.toString());
      return newTotal;
    });
  };

  return (
    <FocusContext.Provider
      value={{
        isFocused,
        setIsFocused,
        isDetectionEnabled,
        setIsDetectionEnabled,
        focusScore,
        setFocusScore,
        totalFocusedMinutes,
        addFocusedTime,
        emotionalState,
        setEmotionalState,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};
