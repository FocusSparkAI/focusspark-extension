import { motion } from 'motion/react';
import { TrendingUp, Flame, Upload, CreditCard, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export function ProgressStats() {
  const weeklyProgress = 65; // 65% of weekly goal
  const currentStreak = 7;

  const weeklyData = [
    { day: 'Mon', hours: 3 },
    { day: 'Tue', hours: 4 },
    { day: 'Wed', hours: 2 },
    { day: 'Thu', hours: 5 },
    { day: 'Fri', hours: 3 },
    { day: 'Sat', hours: 4 },
    { day: 'Sun', hours: 2 },
  ];

  const maxHours = Math.max(...weeklyData.map((d) => d.hours));

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Progress & Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        {/* Circular Progress */}
        <div className="relative">
          <div className="text-center mb-4">
            <p className="text-sm text-secondary mb-2">Weekly Goal Progress</p>
            <div className="relative inline-block">
              {/* Background Circle */}
              <svg width="160" height="160" className="transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#progressGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 70 * (1 - weeklyProgress / 100),
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-4xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                >
                  {weeklyProgress}%
                </motion.span>
                <span className="text-sm text-secondary">13/20 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div>
          <p className="text-sm text-secondary mb-3">This Week</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map((item, index) => (
              <motion.div
                key={item.day}
                className="flex-1 flex flex-col items-center gap-2"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t-lg"
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.hours / maxHours) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  style={{ minHeight: '8px' }}
                />
                <span className="text-xs text-secondary">{item.day}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Streak Counter */}
        <motion.div
          className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className="w-8 h-8 text-orange-400" />
              </motion.div>
              <div>
                <p className="text-sm text-secondary">Current Streak</p>
                <motion.p
                  className="text-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {currentStreak} days 🔥
                </motion.p>
              </div>
            </div>
          </div>
          <p className="text-xs text-secondary mt-2">
            Your focus improved by 22% this week! Keep the streak alive 🔥
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="mt-auto">
          <p className="text-sm text-secondary mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Notes
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Generate Flashcards
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Take Quick Quiz
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
