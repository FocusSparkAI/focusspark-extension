import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, CameraOff, Menu, X, Eye, Zap, Coffee, Sparkles, AlertCircle, Brain, Book, FileText } from 'lucide-react';
import { Button } from './ui/button';

type FocusState = 'focused' | 'attention' | 'idle';
type EmotionState = 'happy' | 'tired' | 'neutral';

interface GradientConfig {
  background: string;
  barGradient: string;
  message: string;
  icon: typeof Sparkles;
  iconColor: string;
  glowColor: string;
}

export function FocusModeEnvironment() {
  // State Management
  const [focusState, setFocusState] = useState<FocusState>('focused');
  const [emotionState, setEmotionState] = useState<EmotionState>('neutral');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Auto-cycle focus states every 30 seconds when camera is enabled
  useEffect(() => {
    if (cameraEnabled) {
      const states: FocusState[] = ['focused', 'attention', 'idle'];
      let currentIndex = states.indexOf(focusState);

      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % states.length;
        setFocusState(states[currentIndex]);
        
        // Show popup on state change
        setShowFeedback(true);
        
        // Auto-hide popup after 9 seconds
        setTimeout(() => setShowFeedback(false), 9000);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [cameraEnabled, focusState]);

  // Auto-cycle emotion states every 10 seconds when camera is disabled
  useEffect(() => {
    if (!cameraEnabled) {
      const interval = setInterval(() => {
        const emotions: EmotionState[] = ['happy', 'tired', 'neutral'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        setEmotionState(randomEmotion);
        
        // Show emotional feedback popup
        setShowFeedback(true);
        
        // Auto-hide after 7 seconds
        setTimeout(() => setShowFeedback(false), 7000);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [cameraEnabled]);

  // Toggle camera handler
  const handleCameraToggle = () => {
    setCameraEnabled(!cameraEnabled);
    setShowFeedback(false);
  };

  // Get gradient configuration based on current state
  const getGradientConfig = (): GradientConfig => {
    // Check dark mode
    const isDark = document.documentElement.classList.contains('dark');

    if (!cameraEnabled) {
      // Emotional Feedback Mode - Calm neutral gradient
      return {
        background: isDark 
          ? 'linear-gradient(135deg, #1C1F2A 0%, #2A2D3A 50%, #1C1F2A 100%)'
          : 'linear-gradient(135deg, #F0F4F8 0%, #E6ECF3 50%, #F0F4F8 100%)',
        barGradient: 'from-gray-500/20 to-gray-600/20',
        message: 'Emotional Feedback Mode',
        icon: Brain,
        iconColor: 'text-gray-400',
        glowColor: 'rgba(156, 163, 175, 0.3)',
      };
    }

    // Focus Detection Mode
    switch (focusState) {
      case 'focused':
        return {
          background: isDark
            ? 'linear-gradient(135deg, #1a2a4a 0%, #1a3d4a 50%, #1a4a47 100%)'
            : 'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 50%, #B2FEFA 100%)',
          barGradient: 'from-blue-500/20 to-cyan-500/20',
          message: 'Focused',
          icon: Sparkles,
          iconColor: 'text-blue-400',
          glowColor: 'rgba(59, 130, 246, 0.4)',
        };
      case 'attention':
        return {
          background: isDark
            ? 'linear-gradient(135deg, #4a2a1a 0%, #4a3d1a 50%, #4a3a1a 100%)'
            : 'linear-gradient(135deg, #FF9966 0%, #FFD200 50%, #F7971E 100%)',
          barGradient: 'from-orange-500/20 to-yellow-500/20',
          message: 'Attention Needed',
          icon: AlertCircle,
          iconColor: 'text-orange-400',
          glowColor: 'rgba(251, 146, 60, 0.4)',
        };
      case 'idle':
        return {
          background: isDark
            ? 'linear-gradient(135deg, #2a2d3a 0%, #2d3a2d 50%, #3a3d2a 100%)'
            : 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 50%, #DCE35B 100%)',
          barGradient: 'from-gray-400/20 to-green-400/20',
          message: 'Idle',
          icon: Coffee,
          iconColor: 'text-gray-400',
          glowColor: 'rgba(156, 163, 175, 0.3)',
        };
    }
  };

  const config = getGradientConfig();
  const BarIcon = config.icon;

  // Get motivational message for popups
  const getPopupMessage = () => {
    if (!cameraEnabled) {
      const emotionMessages = {
        happy: 'Feeling Great',
        tired: 'Take a Break',
        neutral: 'Stay Balanced',
      };
      return emotionMessages[emotionState];
    }

    const focusMessages = {
      focused: "You're Doing Amazing — Keep It Up!",
      attention: "Wake Up — Concentrate Now!",
      idle: "Calm but Neutral — Be Energetic!",
    };
    return focusMessages[focusState];
  };

  const getPopupIcon = () => {
    if (!cameraEnabled) {
      const emotionIcons = {
        happy: Sparkles,
        tired: Coffee,
        neutral: Brain,
      };
      return emotionIcons[emotionState];
    }
    return config.icon;
  };

  const PopupIcon = getPopupIcon();

  return (
    <motion.div
      className="relative h-screen w-full overflow-hidden flex"
      style={{ background: config.background }}
      animate={{ background: config.background }}
      transition={{
        duration: 6,
        ease: 'easeInOut',
      }}
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Dynamic Attention Bar - Compact iOS-style */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[85%] md:w-[65%] lg:w-[45%]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              relative rounded-2xl px-6 py-3
              bg-gradient-to-r ${config.barGradient}
              backdrop-blur-xl
              border border-white/10 dark:border-white/5
              shadow-xl
            `}
          >
            {/* Subtle animated glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 20px ${config.glowColor}`,
                  `0 0 40px ${config.glowColor}`,
                  `0 0 20px ${config.glowColor}`,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            />

            {/* Bar Content */}
            <div className="relative flex items-center justify-between gap-4">
              {/* Left: Animated Face Icon */}
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <BarIcon className={`w-6 h-6 ${config.iconColor}`} />
              </motion.div>

              {/* Center: Status Text */}
              <div className="flex-1 text-center">
                <motion.span
                  key={config.message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white"
                >
                  {config.message}
                </motion.span>
              </div>

              {/* Right: Camera Toggle */}
              <Button
                onClick={handleCameraToggle}
                variant="ghost"
                size="sm"
                className="h-8 px-3 bg-white/10 hover:bg-white/20 border border-white/20"
              >
                {cameraEnabled ? (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Disable</span>
                  </>
                ) : (
                  <>
                    <CameraOff className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Enable</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Main Content - Centered Placeholder */}
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-6 max-w-2xl"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Eye className="w-24 h-24 mx-auto text-white/40" />
            </motion.div>
            <h2 className="text-white/90 text-3xl md:text-4xl">
              {cameraEnabled ? 'Focus Detection Active' : 'Emotional Feedback Mode'}
            </h2>
            <p className="text-white/60 text-lg">
              {cameraEnabled 
                ? 'Your environment adapts to your focus state'
                : 'Monitoring emotional wellness without camera'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Sidebar - Collapsible */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-xl border-l border-white/10 dark:border-white/5 shadow-2xl flex flex-col relative z-20"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/10 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-lg text-gray-900 dark:text-white">Tools & Insights</h3>
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* AI Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <h4 className="text-gray-900 dark:text-white">AI Suggestions</h4>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Try the Pomodoro technique for better focus
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Take a 5-minute break soon
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Documents */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-teal-500" />
                  <h4 className="text-gray-900 dark:text-white">Recent Documents</h4>
                </div>
                <div className="space-y-2">
                  {['Math Notes.pdf', 'Chemistry Study.docx', 'History Essay.txt'].map((doc, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-white/50 dark:bg-white/5 border border-white/10 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{doc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h4 className="text-gray-900 dark:text-white">Session Stats</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-2xl text-green-600 dark:text-green-400">87%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Focus Rate</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-2xl text-blue-600 dark:text-blue-400">42m</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Session Time</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button (when closed) */}
      {!isSidebarOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSidebarOpen(true)}
          className="fixed top-6 right-6 z-40 p-3 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-colors shadow-xl"
        >
          <Menu className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Emotional/Motivational Feedback Popup */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div
              className={`
                relative rounded-2xl p-6 border
                bg-gradient-to-r ${config.barGradient}
                backdrop-blur-xl shadow-2xl
                border-white/20 dark:border-white/10
              `}
            >
              {/* Glowing border effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: [
                    `0 0 20px ${config.glowColor}`,
                    `0 0 40px ${config.glowColor}`,
                    `0 0 20px ${config.glowColor}`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />

              {/* Content */}
              <div className="relative flex items-center gap-4">
                {/* Icon */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <PopupIcon className={`w-8 h-8 ${config.iconColor}`} />
                </motion.div>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1"
                >
                  <p className="text-lg text-white">{getPopupMessage()}</p>
                </motion.div>

                {/* Close Button */}
                <Button
                  onClick={() => setShowFeedback(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-white/80 hover:text-white hover:bg-white/10"
                >
                  OK
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Animation Layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: `radial-gradient(circle at 20% 50%, ${config.glowColor}, transparent 50%)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
