import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, ClipboardCheck, Layers, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BACKEND_ROUTES } from '../../config/backend';
import backendClient, { getAuthHeaders } from '../../utils/backendClient';

interface ProgressStatsProps {
  onNavigate?: (page: string) => void;
}

type DailyFocus = {
  day: string;
  minutes: number;
};

type StudyDashboardStats = {
  weekly_focus_minutes: number;
  weekly_focus_hours: number;
  daily_focus: DailyFocus[];
};

const WEEKLY_TARGET_HOURS = 20;
const WEEKLY_TARGET_MINUTES = WEEKLY_TARGET_HOURS * 60;

export function ProgressStats({ onNavigate }: ProgressStatsProps) {
  const [stats, setStats] = useState<StudyDashboardStats>({
    weekly_focus_minutes: 0,
    weekly_focus_hours: 0,
    daily_focus: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadProgressStats = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await backendClient.get(BACKEND_ROUTES.studyDashboardStats, {
          headers: authHeaders,
        });

        if (!isMounted) return;

        setStats({
          weekly_focus_minutes: Number(response.data?.weekly_focus_minutes) || 0,
          weekly_focus_hours: Number(response.data?.weekly_focus_hours) || 0,
          daily_focus: Array.isArray(response.data?.daily_focus) ? response.data.daily_focus : [],
        });
      } catch {
        if (isMounted) {
          setStats({
            weekly_focus_minutes: 0,
            weekly_focus_hours: 0,
            daily_focus: [],
          });
        }
      }
    };

    void loadProgressStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const weeklyProgress = Math.min(
    100,
    Math.max(0, Math.round((stats.weekly_focus_minutes / WEEKLY_TARGET_MINUTES) * 100)),
  );

  const weeklyData = useMemo(() => {
    const fallbackDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const realRows = stats.daily_focus.map((row) => ({
      day: row.day,
      hours: Math.round((Number(row.minutes) || 0) / 6) / 10,
    }));

    return realRows.length > 0
      ? realRows
      : fallbackDays.map((day) => ({ day, hours: 0 }));
  }, [stats.daily_focus]);

  const actions = [
    { label: 'Open AI Tutor', icon: Bot, page: 'chatbot' },
    { label: 'Review Flashcards', icon: Layers, page: 'flashcards' },
    { label: 'Take Quiz', icon: ClipboardCheck, page: 'quiz' },
  ];

  const maxHours = Math.max(1, ...weeklyData.map((day) => day.hours));
  const weeklyHoursLabel = `${stats.weekly_focus_hours.toFixed(1).replace(/\.0$/, '')}/${WEEKLY_TARGET_HOURS} hrs`;

  return (
    <Card className="h-full border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Study Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center">
          <div className="relative mx-auto grid h-32 w-32 place-items-center">
            <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-slate-200 dark:text-slate-700"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="54"
                stroke="url(#progressGradient)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 54 * (1 - weeklyProgress / 100),
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
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center">
              <div className="flex flex-col items-center justify-center leading-none">
                <span className="block text-2xl font-semibold leading-none">{weeklyProgress}%</span>
                <span className="mt-2 block text-xs leading-none text-secondary">{weeklyHoursLabel}</span>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium">This week</p>
            <div className="mt-3 flex h-28 items-end justify-between gap-2">
              {weeklyData.map((item, index) => (
                <div key={item.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <motion.div
                    className="w-full max-w-9 rounded-t-lg bg-gradient-to-t from-blue-500 to-purple-600"
                    initial={{ height: 8 }}
                    animate={{ height: item.hours > 0 ? Math.max(18, (item.hours / maxHours) * 88) : 4 }}
                    transition={{ delay: index * 0.08, duration: 0.5 }}
                  />
                  <span className="text-xs text-secondary">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-2 sm:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => onNavigate?.(action.page)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
