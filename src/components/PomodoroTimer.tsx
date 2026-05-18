import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

export function PomodoroTimer() {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const sessions = [
    { id: 1, duration: '25m', completed: true },
    { id: 2, duration: '25m', completed: true },
    { id: 3, duration: '25m', completed: false },
  ];

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && time > 0) {
      interval = window.setInterval(() => {
        setTime((t) => t - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  const handleTimerComplete = () => {
    setIsActive(false);

    if (isBreak) {
      toast.success('Break complete! Ready to focus?', {
        icon: <Zap className="w-4 h-4" />,
      });
      setTime(25 * 60);
      setIsBreak(false);
    } else {
      toast.success('Session complete! Take a break.');
      setTime(5 * 60);
      setIsBreak(true);
    }
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  const progress = isBreak
    ? ((5 * 60 - time) / (5 * 60)) * 100
    : ((25 * 60 - time) / (25 * 60)) * 100;

  const circumference = 2 * Math.PI * 112;
  const offset = circumference * (1 - progress / 100);

  return (
    <Card className="h-full flex flex-col bg-card text-card-foreground border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Pomodoro Timer
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        {/* Timer */}
        <div className="flex items-center justify-center flex-1 py-4">
          <div className="relative w-full max-w-[280px] aspect-square">
            {/* Background Circle */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 256 256"
            >
              <circle
                cx="128"
                cy="128"
                r="112"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-300 "
              />
            </svg>

            {/* Progress Circle with Gradient */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 256 256"
            >
              <defs>
                <linearGradient
                  id="pomodoroGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="128"
                cy="128"
                r="112"
                stroke="url(#pomodoroGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </svg>

            {/* Glow */}
          
            {/* Time */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl sm:text-5xl font-semibold text-foreground">
                {String(minutes).padStart(2, '0')}:
                {String(seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {isBreak ? 'Break Time' : 'Focus Session'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <Button
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white"
            size="lg"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>

          {isBreak && (
            <Button variant="outline" size="lg">
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          )}
        </div>

        {/* Sessions */}
        <div className="mt-auto">
          <p className="text-sm text-muted-foreground mb-3">
            Recent Sessions
          </p>

          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
              >
                <span className="text-sm text-foreground">
                  Session #{s.id}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {s.duration}
                  </span>
                  {s.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}