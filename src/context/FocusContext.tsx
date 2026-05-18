import React, { createContext, useContext, useState, useEffect } from 'react';

interface FocusContextType {
  isFocused: boolean;
  setIsFocused: (value: boolean) => void;
  isDetectionEnabled: boolean;
  setIsDetectionEnabled: (value: boolean) => void;
  focusScore: number;
  setFocusScore: (value: number) => void;
  totalFocusedMinutes: number;
  addFocusedTime: (minutes: number) => void;
  emotionalState: 'happy' | 'neutral' | 'sad';
  setEmotionalState: (value: 'happy' | 'neutral' | 'sad') => void;
}

const FocusContext = createContext<FocusContextType>({
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

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(() => {
    const saved = localStorage.getItem('focusspark-camera-detection');
    return saved === 'true';
  });
  const [focusScore, setFocusScore] = useState(50); // Default to idle state
  const [totalFocusedMinutes, setTotalFocusedMinutes] = useState(() => {
    const saved = localStorage.getItem('focusspark-total-focus-time');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [emotionalState, setEmotionalState] = useState<'happy' | 'neutral' | 'sad'>('neutral');

  const addFocusedTime = (minutes: number) => {
    setTotalFocusedMinutes((prev) => {
      const newTotal = prev + minutes;
      localStorage.setItem('focusspark-total-focus-time', newTotal.toString());
      return newTotal;
    });
  };

  // Save detection enabled state and reset focus state when disabled
  useEffect(() => {
    localStorage.setItem('focusspark-camera-detection', isDetectionEnabled.toString());
    
    // Reset focus state when detection is disabled to prevent stuck states
    if (!isDetectionEnabled) {
      setIsFocused(false);
      setFocusScore(50); // Reset to idle state
    }
  }, [isDetectionEnabled]);

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

export const useFocus = () => useContext(FocusContext);
