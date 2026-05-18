import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  DistractionPopup,
  AttentionNudgeBanner,
  QuizPrompt,
  AchievementUnlockPopup,
  CustomToast,
} from './GlobalNotifications';
import { Trophy, Home } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationDemoProps {
  onNavigate: (page: string) => void;
}

export function NotificationDemo({ onNavigate }: NotificationDemoProps) {
  const [showDistraction, setShowDistraction] = useState(false);
  const [showAttention, setShowAttention] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  return (
    <div className="min-h-screen gradient-wave">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
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
              <h1 className="gradient-text">Notification Demo</h1>
              <p className="text-sm text-secondary">Test all notification types</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle>Notification Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={() => setShowDistraction(true)} variant="outline">
                Show Distraction Popup
              </Button>

              <Button onClick={() => setShowAttention(true)} variant="outline">
                Show Attention Nudge
              </Button>

              <Button onClick={() => setShowQuiz(true)} variant="outline">
                Show Quiz Prompt
              </Button>

              <Button onClick={() => setShowAchievement(true)} variant="outline">
                Show Achievement Unlock
              </Button>

              <Button
                onClick={() => {
                  setToastType('success');
                  setShowCustomToast(true);
                }}
                variant="outline"
              >
                Show Success Toast
              </Button>

              <Button
                onClick={() => {
                  setToastType('error');
                  setShowCustomToast(true);
                }}
                variant="outline"
              >
                Show Error Toast
              </Button>

              <Button
                onClick={() => toast.success('✅ This is a Sonner toast!')}
                variant="outline"
              >
                Show Sonner Toast
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Components */}
      <DistractionPopup
        isVisible={showDistraction}
        distractionApp="YouTube"
        onDismiss={() => setShowDistraction(false)}
        onBackToStudy={() => {
          setShowDistraction(false);
          toast.success('✅ Back to studying!');
        }}
      />

      <AttentionNudgeBanner
        isVisible={showAttention}
        secondsAway={25}
        onDismiss={() => setShowAttention(false)}
        onBreathingExercise={() => {
          setShowAttention(false);
          toast('🧘 Starting breathing exercise...');
        }}
      />

      <QuizPrompt
        isVisible={showQuiz}
        onStartQuiz={() => {
          setShowQuiz(false);
          onNavigate('quiz');
        }}
        onLater={() => {
          setShowQuiz(false);
          toast('Quiz scheduled for later!');
        }}
      />

      <AchievementUnlockPopup
        isVisible={showAchievement}
        achievementTitle="7-Day Streak"
        achievementIcon={<Trophy className="w-12 h-12 text-white" />}
        achievementReward="Fire avatar border unlocked"
        onClose={() => setShowAchievement(false)}
        onViewBadges={() => {
          setShowAchievement(false);
          onNavigate('achievements');
        }}
      />

      <CustomToast
        isVisible={showCustomToast}
        type={toastType}
        message={
          toastType === 'success'
            ? '✅ Operation completed successfully!'
            : toastType === 'error'
            ? '❌ An error occurred. Please try again.'
            : toastType === 'warning'
            ? '⚠ This action requires confirmation.'
            : 'ℹ️ Here is some helpful information.'
        }
        onDismiss={() => setShowCustomToast(false)}
      />
    </div>
  );
}
