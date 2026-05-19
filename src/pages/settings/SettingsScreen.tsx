import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Slider } from '../../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import {
  Home,
  User,
  Lock,
  Clock,
  Brain,
  Camera,
  Bell,
  Plug,
  Palette,
  Eye,
  Shield,
  ChevronRight,
  Check,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFocus } from '../../context/FocusContext';

interface SettingsScreenProps {
  onNavigate: (page: string) => void;
}

const categories = [
  { id: 'account', label: 'Account & Auth', icon: User },
  { id: 'pomodoro', label: 'Pomodoro & Session', icon: Clock },
  { id: 'ai', label: 'AI & Chatbot', icon: Brain },
  { id: 'focus', label: 'Focus Detection', icon: Camera },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'accessibility', label: 'Accessibility', icon: Eye },
  { id: 'privacy', label: 'Privacy & Data', icon: Shield },
];

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { isDetectionEnabled, setIsDetectionEnabled } = useFocus();
  const [activeCategory, setActiveCategory] = useState('account');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Account settings
  const [email, setEmail] = useState('alex.chen@example.com');
  const [lastLogin] = useState('October 18, 2025 at 2:30 PM');
  const [googleLinked] = useState(true);

  // Pomodoro settings
  const [pomodoroWork, setPomodoroWork] = useState(25);
  const [pomodoroBreak, setPomodoroBreak] = useState(5);
  const [autoStartNext, setAutoStartNext] = useState(true);
  const [skipBreaks, setSkipBreaks] = useState(false);
  const [quizOnFinish, setQuizOnFinish] = useState(true);
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);

  // AI settings
  const [aiPersona, setAiPersona] = useState('ultra-instinct');
  const [flashcardGranularity, setFlashcardGranularity] = useState(50);
  const [autoGenerateFlashcards, setAutoGenerateFlashcards] = useState(true);

  // Focus Detection settings - using context for camera enablement
  const [focusSensitivity, setFocusSensitivity] = useState(50);
  const [fallbackMethod, setFallbackMethod] = useState('prompts');

  // Notification settings
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reminderInterval, setReminderInterval] = useState(30);

  // Integration settings
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'adaptive'>('dark');
  const [accentIntensity, setAccentIntensity] = useState(70);
  const [fontSize, setFontSize] = useState(100);

  // Accessibility settings
  const [highContrast, setHighContrast] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [screenReaderLabels, setScreenReaderLabels] = useState(true);

  const handleCategoryChange = (newCategory: string) => {
    const oldIndex = categories.findIndex((c) => c.id === activeCategory);
    const newIndex = categories.findIndex((c) => c.id === newCategory);
    setSlideDirection(newIndex > oldIndex ? 'right' : 'left');
    setActiveCategory(newCategory);
  };

  const handleSavePassword = () => {
    toast.success('✅ Password updated successfully!');
  };

  const handleConnectGoogle = () => {
    toast.success('🔗 Connecting to Google Drive...');
    setTimeout(() => {
      setGoogleDriveConnected(true);
      toast.success('✅ Google Drive connected!');
    }, 1500);
  };

  const handleOpenWebcamTest = () => {
    onNavigate('webcam-test');
  };

  return (
    <div className="min-h-screen gradient-wave">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('dashboard')}
                className="hover:bg-accent"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="gradient-text">Settings</h1>
                <p className="text-sm text-secondary">Customize your FocusSpark experience</p>
              </div>
            </div>

            <Button variant="outline" onClick={() => onNavigate('profile')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-border sticky top-24">
              <CardContent className="p-4 space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-l-4 border-blue-500'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-secondary'}`} />
                      <span className={`text-sm ${isActive ? '' : 'text-secondary'}`}>
                        {category.label}
                      </span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Settings Panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: slideDirection === 'right' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === 'right' ? -50 : 50 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Account & Auth */}
                {activeCategory === 'account' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-400" />
                        Account & Authentication
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="password">Change Password</Label>
                        <div className="flex gap-2 mt-2">
                          <Input id="password" type="password" placeholder="New password" />
                          <Button onClick={handleSavePassword}>Update</Button>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="mb-3">Linked Logins</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                <span className="text-xl">G</span>
                              </div>
                              <div>
                                <p className="text-sm">Google</p>
                                <p className="text-xs text-secondary">
                                  {googleLinked ? 'Connected' : 'Not connected'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={googleLinked ? 'default' : 'secondary'}>
                              {googleLinked ? 'Linked' : 'Unlinked'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-sm text-secondary">
                          <strong>Last Login:</strong> {lastLogin}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pomodoro & Session */}
                {activeCategory === 'pomodoro' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        Pomodoro & Session Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="work-duration">Work Duration (minutes)</Label>
                          <Input
                            id="work-duration"
                            type="number"
                            value={pomodoroWork}
                            onChange={(e) => setPomodoroWork(parseInt(e.target.value))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="break-duration">Break Duration (minutes)</Label>
                          <Input
                            id="break-duration"
                            type="number"
                            value={pomodoroBreak}
                            onChange={(e) => setPomodoroBreak(parseInt(e.target.value))}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-start Next Session</Label>
                            <p className="text-xs text-secondary">
                              Automatically begin the next Pomodoro after break
                            </p>
                          </div>
                          <Switch checked={autoStartNext} onCheckedChange={setAutoStartNext} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Skip Breaks</Label>
                            <p className="text-xs text-secondary">
                              Go straight to next work session
                            </p>
                          </div>
                          <Switch checked={skipBreaks} onCheckedChange={setSkipBreaks} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Quiz on Finish</Label>
                            <p className="text-xs text-secondary">
                              Take a mini quiz after each session
                            </p>
                          </div>
                          <Switch checked={quizOnFinish} onCheckedChange={setQuizOnFinish} />
                        </div>

                        {quizOnFinish && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 border-l-2 border-blue-500/30"
                          >
                            <Label htmlFor="quiz-count">Number of Quiz Questions</Label>
                            <Input
                              id="quiz-count"
                              type="number"
                              value={quizQuestionCount}
                              onChange={(e) => setQuizQuestionCount(parseInt(e.target.value))}
                              className="mt-2 w-32"
                            />
                          </motion.div>
                        )}
                      </div>

                      <Separator />

                      {/* Timer Preview */}
                      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                        <p className="text-sm text-secondary mb-3">Preview:</p>
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <div className="w-20 h-20 rounded-full border-4 border-blue-500 flex items-center justify-center mb-2">
                              <p className="gradient-text">{pomodoroWork}</p>
                            </div>
                            <p className="text-xs text-secondary">Work</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-secondary" />
                          <div className="text-center">
                            <div className="w-20 h-20 rounded-full border-4 border-purple-500 flex items-center justify-center mb-2">
                              <p className="gradient-text">{pomodoroBreak}</p>
                            </div>
                            <p className="text-xs text-secondary">Break</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI & Chatbot */}
                {activeCategory === 'ai' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-teal-400" />
                        AI & Chatbot Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="ai-persona">AI Persona Template</Label>
                        <Select value={aiPersona} onValueChange={setAiPersona}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ultra-instinct">Ultra Instinct Sensei</SelectItem>
                            <SelectItem value="socratic">Socratic Guide</SelectItem>
                            <SelectItem value="friendly">Friendly Tutor</SelectItem>
                            <SelectItem value="expert">Domain Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Flashcard Granularity</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-secondary">Basic</span>
                          <Slider
                            value={[flashcardGranularity]}
                            onValueChange={(v) => setFlashcardGranularity(v[0])}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-secondary">Detailed</span>
                        </div>
                        <p className="text-xs text-secondary mt-2">
                          Current: {flashcardGranularity}% detailed
                        </p>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-generate Flashcards on Upload</Label>
                          <p className="text-xs text-secondary flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            Auto-flashcards save 5 minutes per document!
                          </p>
                        </div>
                        <Switch
                          checked={autoGenerateFlashcards}
                          onCheckedChange={setAutoGenerateFlashcards}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Focus Detection */}
                {activeCategory === 'focus' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-green-400" />
                        Focus Detection Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Camera-based Focus Detection</Label>
                          <p className="text-xs text-secondary">
                            Use webcam to detect attention and focus in real-time
                          </p>
                        </div>
                        <Switch checked={isDetectionEnabled} onCheckedChange={(checked) => {
                          setIsDetectionEnabled(checked);
                          toast.success(checked ? 'Focus Detection enabled' : 'Focus Detection disabled');
                        }} />
                      </div>

                      {isDetectionEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4"
                        >
                          <div>
                            <Label>Detection Sensitivity</Label>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-secondary">Gentle</span>
                              <Slider
                                value={[focusSensitivity]}
                                onValueChange={(v) => setFocusSensitivity(v[0])}
                                max={100}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-secondary">Aggressive</span>
                            </div>
                          </div>

                          <Button onClick={handleOpenWebcamTest} className="w-full gap-2">
                            <Camera className="w-4 h-4" />
                            Open Webcam Test
                          </Button>
                        </motion.div>
                      )}

                      {!isDetectionEnabled && (
                        <div>
                          <Label htmlFor="fallback">Fallback Method</Label>
                          <Select value={fallbackMethod} onValueChange={setFallbackMethod}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="prompts">Feedback Prompts</SelectItem>
                              <SelectItem value="timer">Timer-based</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Separator />

                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm flex items-start gap-2">
                          <Shield className="w-4 h-4 mt-0.5 text-green-400" />
                          <span>
                            <strong>Privacy Notice:</strong> All detection runs locally on your device. No video data is stored or transmitted.
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notifications */}
                {activeCategory === 'notifications' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-yellow-400" />
                        Notification Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Desktop Notifications</Label>
                          <p className="text-xs text-secondary">
                            Show system notifications for focus alerts
                          </p>
                        </div>
                        <Switch
                          checked={desktopNotifications}
                          onCheckedChange={setDesktopNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Sound Enabled</Label>
                          <p className="text-xs text-secondary">
                            Play audio alerts for notifications
                          </p>
                        </div>
                        <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="reminder-interval">Refocus Reminder Interval (minutes)</Label>
                        <Input
                          id="reminder-interval"
                          type="number"
                          value={reminderInterval}
                          onChange={(e) => setReminderInterval(parseInt(e.target.value))}
                          className="mt-2 w-32"
                        />
                        <p className="text-xs text-secondary mt-2">
                          Example: Remind me every {reminderInterval} minutes to refocus
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => toast('🔔 Test notification sent!')}
                      >
                        Preview Notification
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Integrations */}
                {activeCategory === 'integrations' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plug className="w-5 h-5 text-blue-400" />
                        Integrations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                              <span className="text-xl">📁</span>
                            </div>
                            <div>
                              <p>Google Drive</p>
                              <p className="text-xs text-secondary">
                                {googleDriveConnected ? 'Connected' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={googleDriveConnected ? 'outline' : 'default'}
                            onClick={handleConnectGoogle}
                            disabled={googleDriveConnected}
                          >
                            {googleDriveConnected ? (
                              <>
                                <Check className="w-4 h-4 mr-2 text-green-400" />
                                Connected
                              </>
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-xl">📅</span>
                            </div>
                            <div>
                              <p>Google Calendar</p>
                              <p className="text-xs text-secondary">
                                {calendarConnected ? 'Connected' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={calendarConnected ? 'outline' : 'default'}
                            onClick={() => {
                              setCalendarConnected(true);
                              toast.success('✅ Calendar connected!');
                            }}
                            disabled={calendarConnected}
                          >
                            {calendarConnected ? (
                              <>
                                <Check className="w-4 h-4 mr-2 text-green-400" />
                                Connected
                              </>
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="mb-3">Export Options</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            Export as PDF
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Export as CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Appearance */}
                {activeCategory === 'appearance' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-pink-400" />
                        Appearance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="theme">Theme</Label>
                        <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="adaptive">Adaptive (Auto)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Accent Color Intensity</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-secondary">Blue</span>
                          <Slider
                            value={[accentIntensity]}
                            onValueChange={(v) => setAccentIntensity(v[0])}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-secondary">Purple</span>
                        </div>
                        <div
                          className="mt-4 h-12 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, rgb(59, 130, 246) ${100 - accentIntensity}%, rgb(139, 92, 246) ${accentIntensity}%)`,
                          }}
                        />
                      </div>

                      <div>
                        <Label>Font Size</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Slider
                            value={[fontSize]}
                            onValueChange={(v) => setFontSize(v[0])}
                            min={80}
                            max={120}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm text-secondary w-16">{fontSize}%</span>
                        </div>
                        <div className="mt-4 p-4 rounded-lg bg-muted/50">
                          <p style={{ fontSize: `${fontSize}%` }}>
                            The quick brown fox jumps over the lazy dog
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Accessibility */}
                {activeCategory === 'accessibility' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-teal-400" />
                        Accessibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>High-Contrast Mode</Label>
                          <p className="text-xs text-secondary">
                            Increase contrast for better visibility
                          </p>
                        </div>
                        <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Reduce Animations</Label>
                          <p className="text-xs text-secondary">
                            Minimize motion for comfort
                          </p>
                        </div>
                        <Switch
                          checked={reduceAnimations}
                          onCheckedChange={setReduceAnimations}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Screen Reader Labels</Label>
                          <p className="text-xs text-secondary">
                            Enhanced ARIA labels for assistive tech
                          </p>
                        </div>
                        <Switch
                          checked={screenReaderLabels}
                          onCheckedChange={setScreenReaderLabels}
                        />
                      </div>

                      <Separator />

                      <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/30">
                        <h4 className="mb-2">Preview Zone</h4>
                        <p className="text-sm" style={{ filter: highContrast ? 'contrast(1.5)' : 'none' }}>
                          This text demonstrates the current accessibility settings. High-contrast mode
                          enhances readability.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Privacy & Data */}
                {activeCategory === 'privacy' && (
                  <Card className="glass-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-400" />
                        Privacy & Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <ExternalLink className="w-4 h-4" />
                          View Data Log
                        </Button>

                        <Button variant="outline" className="w-full justify-start gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Download All Data
                        </Button>

                        <Button variant="outline" className="w-full justify-start gap-2">
                          <Lock className="w-4 h-4" />
                          Revoke API Keys
                        </Button>
                      </div>

                      <Separator />

                      <Button
                        variant="outline"
                        className="w-full border-red-500/50 hover:bg-red-500/10 text-red-400"
                        onClick={() => onNavigate('profile')}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>

                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <p className="text-xs text-secondary">
                          <strong>Note:</strong> Deleting your account removes all stored data permanently. This action cannot be undone.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
