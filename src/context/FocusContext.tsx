import React, { useCallback, useEffect, useState } from 'react';
import { FocusContext, type EmotionalState } from './focusContextValue';
import { getStoredValue, setStoredValue } from '../utils/chromeStorage';

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDetectionEnabled, setDetectionEnabledState] = useState(false);
  const [focusScore, setFocusScore] = useState(50); // Default to idle state
  const [totalFocusedMinutes, setTotalFocusedMinutes] = useState(0);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('neutral');

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      getStoredValue('focusspark-camera-detection'),
      getStoredValue('focusspark-total-focus-time'),
    ]).then(([savedDetection, savedFocusTime]) => {
      if (!isMounted) return;
      setDetectionEnabledState(savedDetection === 'true');

      const parsedFocusTime = savedFocusTime ? parseInt(savedFocusTime, 10) : 0;
      setTotalFocusedMinutes(Number.isFinite(parsedFocusTime) ? parsedFocusTime : 0);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setIsDetectionEnabled = useCallback((value: boolean, options: { persist?: boolean } = {}) => {
    if (options.persist !== false) {
      void setStoredValue('focusspark-camera-detection', value.toString());
    }
    setDetectionEnabledState(value);

    if (!value) {
      setIsFocused(false);
      setFocusScore(50);
    }
  }, []);

  const addFocusedTime = useCallback((minutes: number) => {
    setTotalFocusedMinutes((prev) => {
      const newTotal = prev + minutes;
      void setStoredValue('focusspark-total-focus-time', newTotal.toString());
      return newTotal;
    });
  }, []);

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
