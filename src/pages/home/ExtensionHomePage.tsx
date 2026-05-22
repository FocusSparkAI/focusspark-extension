import { motion } from 'motion/react';
import {
  Bot,
  ClipboardCheck,
  History,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getAccessToken } from '../../utils/backendClient';
import { toast } from 'sonner';

interface ExtensionHomePageProps {
  onNavigate: (page: string) => void;
}

const featureHighlights = [
  {
    title: 'AI study assistant',
    description: 'Ask focused questions and turn explanations into study material.',
    icon: Bot,
    color: 'text-blue-500',
  },
  {
    title: 'Flashcards and quizzes',
    description: 'Practice with generated decks and quiz sets from your study sessions.',
    icon: Layers,
    color: 'text-emerald-500',
  },
  {
    title: 'Focus sessions',
    description: 'Use Pomodoro-style sessions and lightweight focus tools while studying.',
    icon: Timer,
    color: 'text-purple-500',
  },
  {
    title: 'Study history',
    description: 'Revisit past tutor conversations and saved practice material.',
    icon: History,
    color: 'text-sky-500',
  },
];

const browserStudyFlow = [
  {
    label: 'Plan',
    text: 'Open the dashboard and set your focus timer.',
    icon: LayoutDashboard,
  },
  {
    label: 'Learn',
    text: 'Use the AI tutor beside your study material.',
    icon: Sparkles,
  },
  {
    label: 'Practice',
    text: 'Convert useful answers into flashcards or quizzes.',
    icon: ClipboardCheck,
  },
  {
    label: 'Stay steady',
    text: 'Keep sessions intentional with focus tools and streaks.',
    icon: ShieldCheck,
  },
];

const staticInfo = [
  {
    value: '1',
    label: 'Workspace',
    text: 'Dashboard, tutor, practice, and focus tools live in one extension flow.',
  },
  {
    value: '4',
    label: 'Study modes',
    text: 'Learn, review, quiz, and revisit previous study conversations.',
  },
  {
    value: '0',
    label: 'Setup friction',
    text: 'Sign in, open the dashboard, and continue studying from the browser.',
  },
];

export function ExtensionHomePage({ onNavigate }: ExtensionHomePageProps) {
  const openDashboard = async () => {
    const token = await getAccessToken();
    if (token) {
      onNavigate('dashboard');
      return;
    }

    onNavigate('signin');
    toast.info('Please sign in first.');
  };

  return (
    <main className="bg-background text-foreground">
      <section className="px-5 pb-10 pt-4 sm:px-6 lg:px-12 lg:pb-12 xl:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-secondary shadow-sm">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Browser study workspace
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl lg:text-[3.25rem]">
              FocusSpark Extension
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-secondary sm:text-lg">
              Study from one compact workspace: chat with the AI tutor, generate flashcards,
              practice quizzes, revisit history, and keep focus sessions moving.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => void openDashboard()}
                className="h-11 bg-gradient-to-r from-blue-500 to-purple-600 px-5 hover:opacity-90"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Open Dashboard
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-sm text-secondary">Today</p>
                <h2 className="text-xl font-semibold">Study controls</h2>
              </div>
              <Timer className="h-6 w-6 text-blue-500" />
            </div>
            <div className="mt-5 space-y-3">
              {browserStudyFlow.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="mt-0.5 text-sm leading-5 text-secondary">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-card/60 px-5 py-8 sm:px-6 lg:px-12 xl:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal">What the extension helps with</h2>
              <p className="mt-2 max-w-2xl text-secondary">
                A quick overview for students landing here before opening their workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featureHighlights.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="flex min-h-[160px] flex-col rounded-xl border border-border bg-background p-6 text-left shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card">
                      <Icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <h3 className="min-w-0 text-base font-semibold leading-tight">{feature.title}</h3>
                  </div>
                  <p className="text-sm leading-6 text-secondary">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-6 lg:px-12 xl:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {staticInfo.map((item) => (
              <div key={item.label} className="min-h-[150px] rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl font-semibold leading-none text-foreground">{item.value}</span>
                  <p className="text-base font-semibold leading-tight text-foreground">{item.label}</p>
                </div>
                <p className="text-sm leading-6 text-secondary">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
