import { type ReactNode, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Pause, Play, SkipForward, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface PomodoroTimerProps {
  focusMinutes?: number;
  breakMinutes?: number;
  settingsSlot?: ReactNode;
}

export function PomodoroTimer({
  focusMinutes = 25,
  breakMinutes = 5,
  settingsSlot,
}: PomodoroTimerProps) {
  const focusSeconds = focusMinutes * 60;
  const breakSeconds = breakMinutes * 60;
  const [time, setTime] = useState(focusSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const sessions = [
    { id: 1, duration: `${focusMinutes}m`, completed: true },
    { id: 2, duration: `${focusMinutes}m`, completed: true },
    { id: 3, duration: `${focusMinutes}m`, completed: false },
  ];

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && time > 0) {
      interval = window.setInterval(() => {
        setTime((currentTime) => currentTime - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  useEffect(() => {
    if (!isActive) {
      setTime(isBreak ? breakSeconds : focusSeconds);
    }
  }, [focusSeconds, breakSeconds, isActive, isBreak]);

  const handleTimerComplete = () => {
    setIsActive(false);

    if (isBreak) {
      toast.success('Break complete! Ready to focus?', {
        icon: <Zap className="h-4 w-4" />,
      });
      setTime(focusSeconds);
      setIsBreak(false);
    } else {
      toast.success('Session complete! Take a break.');
      setTime(breakSeconds);
      setIsBreak(true);
    }
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const totalSeconds = isBreak ? breakSeconds : focusSeconds;
  const progress = Math.min(100, Math.max(0, ((totalSeconds - time) / totalSeconds) * 100));

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-blue-500" />
          Pomodoro
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {settingsSlot}

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-secondary">{isBreak ? 'Short Break' : 'Focus Session'}</p>
              <p className="mt-1 text-5xl font-semibold leading-none tracking-normal">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-secondary">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
            size="lg"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>

          {isBreak && (
            <Button variant="outline" size="lg">
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm text-secondary">Today</p>
          <div className="grid grid-cols-3 gap-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary">#{session.id}</span>
                  {session.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border" />
                  )}
                </div>
                <p className="mt-2 text-sm font-medium">{session.duration}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
