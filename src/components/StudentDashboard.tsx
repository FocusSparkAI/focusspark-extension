import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Lightbulb, Zap } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardNavbar } from './DashboardNavbar';
import { PomodoroTimer } from './PomodoroTimer';
import { ProgressStats } from './ProgressStats';
import { AISuggestionsFeed } from './AISuggestionsFeed';
import { FocusDetector } from './FocusDetector';
import { AchievementUnlockPopup } from './GlobalNotifications';
import { useFocus } from '../context/FocusContext';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showWelcomeAchievement, setShowWelcomeAchievement] = useState(false);
  const { isDetectionEnabled } = useFocus();

  // Show welcome achievement on first load (demo)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeAchievement(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <DashboardNavbar />

        {/* Dashboard Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="text-4xl mb-2">Welcome back, Learner!</h1>
              <p className="text-secondary">
                Ready to spark your focus? Let's make today productive.
              </p>
            </div>

            {/* AI Chatbot Quick Access */}
  
            {/* Focus Detection Section (if enabled) */}
            {isDetectionEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <FocusDetector variant="compact" demoMode={true} />
              </motion.div>
            )}

            {/* 6-Card Dashboard Grid */}
            <div className="dashboard-grid">
              {/* Top Row - Main Focus Metrics */}
              <div className="dashboard-row top">
                {/* Card 1: Pomodoro Timer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="card-wrapper"
                >
                  <PomodoroTimer />
                </motion.div>

                {/* Card 2: Progress & Goals */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card-wrapper"
                >
                  <ProgressStats />
                </motion.div>

                {/* Card 3: AI Suggestions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card-wrapper"
                >
                  <AISuggestionsFeed />
                </motion.div>
              </div>

              {/* Bottom Row - Supporting Data */}
             
            </div>
          </div>
        </main>

        {/* Footer Tooltip */}
        <footer className="p-4 border-t border-border/50 bg-card/50">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-secondary text-center flex items-center justify-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>Tip: Try Focus Mode for Deep Work</span>
              <Zap className="w-4 h-4 text-blue-400" />
            </p>
          </div>
        </footer>
      </div>

      {/* Welcome Achievement Demo */}
      <AchievementUnlockPopup
        isVisible={showWelcomeAchievement}
        achievementTitle="Welcome to FocusSpark!"
        achievementIcon={<Trophy className="w-12 h-12 text-white" />}
        achievementReward="Blue gradient theme unlocked"
        onClose={() => setShowWelcomeAchievement(false)}
       
      />
    </div>
  );
}
