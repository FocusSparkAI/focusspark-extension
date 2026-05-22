import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Layers,
  MousePointerClick,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { PomodoroTimer } from '../../features/pomodoro/PomodoroTimer';
import { ProgressStats } from '../../features/pomodoro/ProgressStats';
import { FocusDetector } from '../../features/focus/FocusDetector';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useFocus } from '../../context/FocusContext';
import { usePomodoro } from '../../context/PomodoroContext';
import { BACKEND_ROUTES } from '../../config/backend';
import backendClient, { getAuthHeaders } from '../../utils/backendClient';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void | Promise<void>;
}

const getFocusStreakDays = (sessions: Array<{ completed: boolean; endTime?: Date; startTime: Date }>) => {
  const completedDays = new Set(
    sessions
      .filter((session) => session.completed)
      .map((session) => {
        const date = new Date(session.endTime ?? session.startTime);
        return Number.isNaN(date.getTime()) ? null : date.toDateString();
      })
      .filter(Boolean),
  );

  let streak = 0;
  const cursor = new Date();
  while (completedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const studyTools = [
  {
    title: 'AI Tutor',
    description: 'Get quick explanations, summaries, and study help from the extension.',
    icon: Bot,
    page: 'chatbot',
    action: 'Open tutor',
  },
  {
    title: 'Flashcards',
    description: 'Review saved concepts and practice active recall without leaving your flow.',
    icon: Layers,
    page: 'flashcards',
    action: 'Review cards',
  },
  {
    title: 'Quiz',
    description: 'Test yourself with focused questions and track weak areas.',
    icon: ClipboardCheck,
    page: 'quiz',
    action: 'Start quiz',
  },
  {
    title: 'Chat History',
    description: 'Return to previous AI conversations and continue from where you stopped.',
    icon: History,
    page: 'chat-history',
    action: 'View history',
  },
];

export function StudentDashboard({ onNavigate, onLogout }: StudentDashboardProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    flashcardDecks: 0,
    quizSets: 0,
    isLoading: true,
  });
  const [savedFocusMinutes, setSavedFocusMinutes] = useState(() => {
    const saved = Number(localStorage.getItem('focusspark-extension-focus-minutes'));
    return Number.isFinite(saved) && saved > 0 ? saved : 25;
  });
  const [savedBreakMinutes, setSavedBreakMinutes] = useState(() => {
    const saved = Number(localStorage.getItem('focusspark-extension-break-minutes'));
    return Number.isFinite(saved) && saved > 0 ? saved : 5;
  });
  const [draftFocusMinutes, setDraftFocusMinutes] = useState(savedFocusMinutes);
  const [draftBreakMinutes, setDraftBreakMinutes] = useState(savedBreakMinutes);
  const { isDetectionEnabled } = useFocus();
  const { startSession, sessions } = usePomodoro();
  const focusStreakDays = useMemo(() => getFocusStreakDays(sessions), [sessions]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardStats = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const [flashcardsResponse, quizzesResponse] = await Promise.all([
          backendClient.get(BACKEND_ROUTES.flashcards, { headers: authHeaders }),
          backendClient.get(BACKEND_ROUTES.quiz, { headers: authHeaders }),
        ]);

        if (!isMounted) return;

        const decks = Array.isArray(flashcardsResponse.data) ? flashcardsResponse.data : [];
        const quizzes = Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [];

        setDashboardStats({
          flashcardDecks: decks.length,
          quizSets: quizzes.length,
          isLoading: false,
        });
      } catch {
        if (isMounted) {
          setDashboardStats((current) => ({ ...current, isLoading: false }));
        }
      }
    };

    void loadDashboardStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const overviewStats = [
    {
      label: 'AI Tutor',
      value: 'Ready',
      helper: 'Ask questions while studying',
      icon: Bot,
      color: 'text-blue-500',
    },
    {
      label: 'Flashcards',
      value: dashboardStats.isLoading ? '...' : String(dashboardStats.flashcardDecks),
      helper: dashboardStats.flashcardDecks === 1 ? 'Deck ready for review' : 'Decks ready for review',
      icon: Layers,
      color: 'text-emerald-500',
    },
    {
      label: 'Quiz Practice',
      value: dashboardStats.isLoading ? '...' : String(dashboardStats.quizSets),
      helper: dashboardStats.quizSets === 1 ? 'Practice set available' : 'Practice sets available',
      icon: ClipboardCheck,
      color: 'text-purple-500',
    },
    {
      label: 'Focus Streak',
      value: `${focusStreakDays}d`,
      helper: focusStreakDays > 0 ? 'Keep your rhythm going' : 'Complete a focus session today',
      icon: Trophy,
      color: 'text-amber-500',
    },
  ];

  const savePomodoroTimings = () => {
    const nextFocus = Math.min(120, Math.max(5, draftFocusMinutes));
    const nextBreak = Math.min(60, Math.max(1, draftBreakMinutes));

    setSavedFocusMinutes(nextFocus);
    setSavedBreakMinutes(nextBreak);
    setDraftFocusMinutes(nextFocus);
    setDraftBreakMinutes(nextBreak);
    localStorage.setItem('focusspark-extension-focus-minutes', String(nextFocus));
    localStorage.setItem('focusspark-extension-break-minutes', String(nextBreak));
    toast.success(`Saved ${nextFocus} min focus / ${nextBreak} min break`);
  };

  const startSavedPomodoroInTutor = () => {
    const nextFocus = Math.min(120, Math.max(5, savedFocusMinutes));
    const nextBreak = Math.min(60, Math.max(1, savedBreakMinutes));

    setSavedFocusMinutes(nextFocus);
    setSavedBreakMinutes(nextBreak);
    localStorage.setItem('focusspark-extension-focus-minutes', String(nextFocus));
    localStorage.setItem('focusspark-extension-break-minutes', String(nextBreak));
    startSession('custom', { focusMinutes: nextFocus, breakMinutes: nextBreak });
    onNavigate('chatbot');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={onNavigate}
        onLogout={onLogout}
        activePage="dashboard"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardNavbar onLogout={onLogout} />

        <main className="flex-1 overflow-auto p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm text-secondary">
                    <LayoutDashboard className="h-4 w-4 text-blue-500" />
                    Extension dashboard
                  </div>
                  <h1 className="text-3xl font-semibold tracking-normal lg:text-4xl">
                    Your FocusSpark study workspace
                  </h1>
                  <p className="mt-3 max-w-xl leading-7 text-secondary">
                    Launch the AI tutor, revise flashcards, start quizzes, and tune your focus
                    sessions from one clean extension dashboard.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Button
                    onClick={() => onNavigate('chatbot')}
                    className="min-w-36 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Open AI Tutor
                  </Button>
                  <Button variant="outline" onClick={() => onNavigate('flashcards')}>
                    <Layers className="mr-2 h-4 w-4" />
                    Flashcards
                  </Button>
                </div>
              </div>
            </motion.section>

            <section className="grid gap-4 lg:grid-cols-4">
              {overviewStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full min-h-28 overflow-hidden border-border bg-card shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-secondary">{stat.label}</p>
                            <p className="mt-1 text-2xl font-semibold leading-tight">{stat.value}</p>
                            <p className="mt-1 text-sm leading-5 text-secondary">{stat.helper}</p>
                          </div>
                          <Icon className={`mt-1 h-5 w-5 shrink-0 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      Extension Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      {studyTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.title}
                            onClick={() => onNavigate(tool.page)}
                            className="group flex min-h-36 rounded-xl border border-border bg-background p-4 text-left transition hover:border-blue-400 hover:shadow-md sm:min-h-40 sm:p-5"
                          >
                            <div className="flex w-full items-start gap-3 sm:gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 sm:h-12 sm:w-12">
                                <Icon className="h-5 w-5 stroke-[2.2]" />
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col self-stretch pt-0.5">
                                <h3 className="text-base font-semibold leading-6 tracking-normal">
                                  {tool.title}
                                </h3>
                                <p className="mt-2 max-w-[34rem] text-sm leading-6 text-secondary">
                                  {tool.description}
                                </p>
                                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-blue-500">
                                  {tool.action}
                                  <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ProgressStats onNavigate={onNavigate} />

                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        Focus Detection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                            <Video className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Camera focus tools</p>
                            <p className="mt-1 text-sm leading-6 text-secondary">
                              Optional local webcam checks for study sessions. Use this only when
                              you want attention feedback.
                            </p>
                          </div>
                        </div>
                      </div>

                      {isDetectionEnabled ? (
                        <FocusDetector variant="compact" demoMode={true} />
                      ) : (
                        <div className="rounded-xl border border-border bg-background p-4">
                          <div className="flex items-center gap-3">
                            <Target className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">Detection is off</p>
                              <p className="text-sm text-secondary">
                                Enable it from the focus tools when you need camera-based checks.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <Button className="w-full" variant="outline" onClick={() => onNavigate('webcam-test')}>
                        Open focus tools
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <aside className="space-y-6">
                <PomodoroTimer
                  focusMinutes={savedFocusMinutes}
                  breakMinutes={savedBreakMinutes}
                  onStart={startSavedPomodoroInTutor}
                  settingsSlot={
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="focus-minutes" className="text-xs">
                            Focus
                          </Label>
                          <div className="mt-1 flex items-center gap-2">
                            <Input
                              id="focus-minutes"
                              type="number"
                              min={5}
                              max={120}
                              value={draftFocusMinutes}
                              className="h-9"
                              onChange={(event) =>
                                setDraftFocusMinutes(Math.max(5, Number(event.target.value) || 5))
                              }
                            />
                            <span className="text-xs text-secondary">min</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="break-minutes" className="text-xs">
                            Break
                          </Label>
                          <div className="mt-1 flex items-center gap-2">
                            <Input
                              id="break-minutes"
                              type="number"
                              min={1}
                              max={60}
                              value={draftBreakMinutes}
                              className="h-9"
                              onChange={(event) =>
                                setDraftBreakMinutes(Math.max(1, Number(event.target.value) || 1))
                              }
                            />
                            <span className="text-xs text-secondary">min</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={savePomodoroTimings}
                        size="sm"
                        className="mt-3 w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save timings
                      </Button>
                    </div>
                  }
                />

                <Card className="overflow-hidden border-border bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <MousePointerClick className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">Quick study actions</p>
                        <p className="mt-1 text-sm leading-5 text-secondary">
                          Jump into AI Tutor, flashcards, quiz, or saved conversations from the
                          sidebar.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
