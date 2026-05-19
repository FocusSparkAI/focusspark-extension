import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target,
  Clock,
  Eye,
  Palette,
  Bell,
  CheckCircle2,
  GraduationCap,
  Brain,
  Zap,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Slider } from '../../components/ui/slider';
import { Checkbox } from '../../components/ui/checkbox';

interface OnboardingFlowProps {
  onComplete: (skipTour?: boolean) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    studyGoals: [] as string[],
    weeklyTargetHours: 20,
    pomodoroPreset: '25/5',
    customPomodoro: 25,
    skipBreaks: false,
    autoQuiz: true,
    focusDetection: false,
    theme: 'dark',
    fontSize: 16,
    desktopNotifications: true,
    googleCalendar: false,
    connectDrive: false,
  });
  const [showConfetti, setShowConfetti] = useState(false);

  const totalSteps = 7;

  const studyGoalOptions = [
    { id: 'exam', label: 'Exam Prep', icon: GraduationCap },
    { id: 'daily', label: 'Daily Study', icon: Brain },
    { id: 'deep', label: 'Deep Work', icon: Zap },
    { id: 'custom', label: 'Custom', icon: Target },
  ];

  const pomodoroPresets = [
    { value: '25/5', label: '25 min / 5 min break' },
    { value: '50/10', label: '50 min / 10 min break' },
    { value: 'custom', label: 'Custom' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', bg: 'bg-white', text: 'text-black' },
    { value: 'dark', label: 'Dark', bg: 'bg-gray-900', text: 'text-white' },
    { value: 'adaptive', label: 'Adaptive', bg: 'bg-gradient-to-br from-blue-500 to-purple-600', text: 'text-white' },
  ];

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      setShowConfetti(true);
      setTimeout(() => {
        // Stay on completion screen
      }, 1000);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const toggleGoal = (goalId: string) => {
    setFormData((prev) => ({
      ...prev,
      studyGoals: prev.studyGoals.includes(goalId)
        ? prev.studyGoals.filter((g) => g !== goalId)
        : [...prev.studyGoals, goalId],
    }));
  };

  const slideVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gradient-wave relative overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                backgroundColor: ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'][
                  Math.floor(Math.random() * 5)
                ],
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Progress Dots */}
      <div className="flex gap-2 mb-8 z-10">
        {[...Array(totalSteps)].map((_, i) => (
          <motion.div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === currentStep
                ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-600'
                : i < currentStep
                ? 'w-2 bg-blue-500'
                : 'w-2 bg-gray-600'
            }`}
            animate={{ scale: i === currentStep ? 1.2 : 1 }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="glass-card rounded-3xl p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="mb-6"
                >
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-blue-purple">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                </motion.div>

                <h1 className="text-4xl mb-4">Welcome to FocusSpark</h1>
                <p className="text-xl text-secondary mb-8">
                  Your AI-powered study partner for focus, learning, and growth.
                </p>

                {/* Animated Illustration */}
                <motion.div
                  className="w-48 h-48 mx-auto mb-8 relative"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                    <Brain className="w-24 h-24 text-blue-400" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-blue-500/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </div>
            )}

            {/* Step 1: Study Goals */}
            {currentStep === 1 && (
              <div className="glass-card rounded-3xl p-12">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-8 h-8 text-blue-400" />
                  <h2 className="text-3xl">Set Your Study Goals</h2>
                </div>
                <p className="text-secondary mb-8">Choose what drives your study sessions.</p>

                {/* Goal Cards Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {studyGoalOptions.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = formData.studyGoals.includes(goal.id);
                    return (
                      <motion.button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`relative p-6 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-border hover:border-blue-500/50 bg-card'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className={`w-10 h-10 mb-3 ${isSelected ? 'text-blue-400' : 'text-secondary'}`} />
                        <p className={isSelected ? 'text-primary' : 'text-secondary'}>{goal.label}</p>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2"
                          >
                            <CheckCircle2 className="w-6 h-6 text-blue-400" />
                          </motion.div>
                        )}
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 rounded-2xl bg-blue-500/20"
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Weekly Target */}
                <div>
                  <Label>Weekly Target Hours: {formData.weeklyTargetHours}h</Label>
                  <Slider
                    value={[formData.weeklyTargetHours]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, weeklyTargetHours: value })
                    }
                    min={5}
                    max={60}
                    step={5}
                    className="mt-3"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Pomodoro Settings */}
            {currentStep === 2 && (
              <div className="glass-card rounded-3xl p-12">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-8 h-8 text-purple-400" />
                  <h2 className="text-3xl">Pomodoro & Session Settings</h2>
                </div>
                <p className="text-secondary mb-8">Customize your focus intervals.</p>

                {/* Presets */}
                <div className="space-y-3 mb-8">
                  {pomodoroPresets.map((preset) => (
                    <motion.button
                      key={preset.value}
                      onClick={() => setFormData({ ...formData, pomodoroPreset: preset.value })}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        formData.pomodoroPreset === preset.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 bg-card'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {preset.label}
                    </motion.button>
                  ))}
                </div>

                {/* Custom Slider */}
                {formData.pomodoroPreset === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8"
                  >
                    <Label>Custom Duration: {formData.customPomodoro} minutes</Label>
                    <Slider
                      value={[formData.customPomodoro]}
                      onValueChange={([value]) =>
                        setFormData({ ...formData, customPomodoro: value })
                      }
                      min={15}
                      max={90}
                      step={5}
                      className="mt-3"
                    />
                  </motion.div>
                )}

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                    <div>
                      <Label>Skip Breaks</Label>
                      <p className="text-sm text-secondary">Continue to next session automatically</p>
                    </div>
                    <Switch
                      checked={formData.skipBreaks}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, skipBreaks: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                    <div>
                      <Label>Auto Quiz After Session</Label>
                      <p className="text-sm text-secondary">Test your knowledge after focus time</p>
                    </div>
                    <Switch
                      checked={formData.autoQuiz}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, autoQuiz: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Focus Detection */}
            {currentStep === 3 && (
              <div className="glass-card rounded-3xl p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Eye className="w-8 h-8 text-teal-400" />
                      <h2 className="text-3xl">Focus Detection & Privacy</h2>
                    </div>
                    <p className="text-secondary mb-6">
                      Enable Camera-Based Focus Detection?
                    </p>
                    <p className="text-sm text-secondary mb-6">
                      We never store your face data — only real-time focus scores.
                    </p>

                    <div className="flex items-center justify-between p-6 rounded-xl bg-card border-2 border-border">
                      <Label>Enable Focus Detection</Label>
                      <Switch
                        checked={formData.focusDetection}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, focusDetection: checked })
                        }
                        className={formData.focusDetection ? 'data-[state=checked]:bg-teal-500' : ''}
                      />
                    </div>
                  </div>

                  {/* Illustration */}
                  <motion.div
                    className="relative"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center">
                      <Eye className="w-32 h-32 text-teal-400" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-4 border-teal-500/30"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Step 4: Theme & Accessibility */}
            {currentStep === 4 && (
              <div className="glass-card rounded-3xl p-12">
                <div className="flex items-center gap-3 mb-6">
                  <Palette className="w-8 h-8 text-blue-400" />
                  <h2 className="text-3xl">Theme & Accessibility</h2>
                </div>
                <p className="text-secondary mb-8">Match your environment or stay adaptive.</p>

                {/* Theme Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {themeOptions.map((theme) => (
                    <motion.button
                      key={theme.value}
                      onClick={() => setFormData({ ...formData, theme: theme.value })}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        formData.theme === theme.value
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-border hover:border-blue-500/50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={`w-full h-24 rounded-xl mb-3 ${theme.bg} ${theme.text} flex items-center justify-center`}>
                        Aa
                      </div>
                      <p className="text-sm">{theme.label}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Font Size */}
                <div>
                  <Label>Font Size: {formData.fontSize}px</Label>
                  <div className="mt-3 p-4 rounded-xl bg-card border border-border">
                    <p style={{ fontSize: `${formData.fontSize}px` }}>
                      The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                  <Slider
                    value={[formData.fontSize]}
                    onValueChange={([value]) => setFormData({ ...formData, fontSize: value })}
                    min={12}
                    max={24}
                    step={1}
                    className="mt-3"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Notifications */}
            {currentStep === 5 && (
              <div className="glass-card rounded-3xl p-12">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-8 h-8 text-yellow-400" />
                  <h2 className="text-3xl">Notifications & Integrations</h2>
                </div>
                <p className="text-secondary mb-8">Stay connected with your study ecosystem.</p>

                <div className="space-y-4">
                  <motion.div
                    className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Checkbox
                      id="notifications"
                      checked={formData.desktopNotifications}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, desktopNotifications: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor="notifications" className="cursor-pointer">
                        <p className="mb-1">Enable Desktop Notifications</p>
                        <p className="text-sm text-secondary">
                          Get reminded about breaks and session completions
                        </p>
                      </label>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Checkbox
                      id="calendar"
                      checked={formData.googleCalendar}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, googleCalendar: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor="calendar" className="cursor-pointer">
                        <Calendar className="w-5 h-5 inline mr-2 text-blue-400" />
                        <span>Google Calendar Sync</span>
                        <p className="text-sm text-secondary mt-1">
                          Automatically block study time in your calendar
                        </p>
                      </label>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Checkbox
                      id="drive"
                      checked={formData.connectDrive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, connectDrive: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor="drive" className="cursor-pointer">
                        <p className="mb-1">Connect Google Drive</p>
                        <p className="text-sm text-secondary">
                          Upload and sync study materials automatically
                        </p>
                      </label>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Step 6: Completion */}
            {currentStep === 6 && (
              <div className="glass-card rounded-3xl p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="mb-6"
                >
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center glow-teal">
                    <CheckCircle2 className="w-16 h-16 text-white" />
                  </div>
                </motion.div>

                <h1 className="text-5xl mb-4">All Set!</h1>
                <p className="text-xl text-secondary mb-12">
                  You're ready to start your focused learning journey with FocusSpark.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => onComplete(false)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 px-8 py-6"
                  >
                    Take a Quick Tour
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => onComplete(true)}
                    className="hover:bg-white/10 px-8 py-6"
                  >
                    Skip Tour
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep < totalSteps - 1 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 glow-blue-purple"
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
