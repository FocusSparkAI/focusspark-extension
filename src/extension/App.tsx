import { useState, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { ExtensionHomePage } from '../pages/home/ExtensionHomePage';
import { SignInPage } from '../pages/auth/SignInPage';
import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import { ChatbotWorkspace } from '../pages/chat/ChatbotWorkspace';
import { FlashcardDeckScreen } from '../pages/flashcards/FlashcardDeckScreen';
import { QuizScreen } from '../pages/quiz/QuizScreen';
import { ChatHistoryPage } from '../pages/chat/ChatHistoryPage';
import { FocusToolsPage } from '../pages/webcam/FocusToolsPage';
import { Footer } from '../components/layout/Footer';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { Toaster } from '../components/ui/sonner';
import { FocusProvider } from '../context/FocusContext';
import { PomodoroProvider, usePomodoro } from '../context/PomodoroContext';
import { clearAccessToken } from '../utils/backendClient';
import { FRONTEND_ROUTES, buildFrontendUrl } from '../config/frontend';
import { ProtectedRoute } from './ProtectedRoute';

const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  signin: '/signin',
  dashboard: '/dashboard',
  chatbot: '/chatbot',
  flashcards: '/flashcards',
  'chat-history': '/chat-history',
  quiz: '/quiz',
  achievements: '/achievements',
  'webcam-test': '/webcam-test',
};

const PATH_TO_PAGE = Object.entries(PAGE_TO_PATH).reduce<Record<string, string>>(
  (accumulator, [page, path]) => {
    accumulator[path] = page;
    return accumulator;
  },
  {},
);

const SPECIAL_PAGES = new Set([
  'signin',
  'dashboard',
  'chatbot',
  'flashcards',
  'chat-history',
  'quiz',
  'achievements',
  'webcam-test',
]);

const readSavedPomodoroMinutes = (key: string, fallback: number, min: number, max: number) => {
  const value = Number(localStorage.getItem(key));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function getPageFromPath(pathname: string) {
  return PATH_TO_PAGE[normalizePath(pathname)] ?? null;
}

function getPathFromPage(page: string) {
  return PAGE_TO_PATH[page] ?? '/';
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = getPageFromPath(location.pathname) ?? 'home';
  const { phase, timeRemaining, startSession } = usePomodoro();
  const isPomodoroLocked = phase === 'focus' || phase === 'paused';
  const lastSyncedPomodoroPhaseRef = useRef<string | null>(null);
  const lastBreakEndsAtRef = useRef<number | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Prevent flash of unstyled content
    document.documentElement.classList.add('preload');

    const savedTheme = localStorage.getItem('focusspark-theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    setTheme(initialTheme);

    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Remove preload class after a brief delay to enable transitions
    setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('focusspark-theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (isPomodoroLocked && currentPage !== 'chatbot') {
      navigate(getPathFromPage('chatbot'), { replace: true });
    }
  }, [currentPage, isPomodoroLocked, navigate]);

  useEffect(() => {
    const previousPhase = lastSyncedPomodoroPhaseRef.current;
    if (previousPhase === phase) return;

    const chromeApi = (globalThis as typeof globalThis & { chrome?: any }).chrome;
    if (!chromeApi?.runtime?.sendMessage) return;

    const sendPomodoroState = (focusTabId: number | null) => {
      const breakEndsAt = phase === 'break' ? Date.now() + timeRemaining * 1000 : null;

      if (previousPhase === 'break' && phase === 'idle') {
        chromeApi.runtime.sendMessage(
          {
            type: 'POMODORO_BREAK_COMPLETED',
            focusTabId,
            breakEndsAt: lastBreakEndsAtRef.current,
          },
          () => {
            // Ignore unchecked runtime errors when no background listener is available.
          },
        );
      }

      chromeApi.runtime.sendMessage(
        {
          type: 'POMODORO_STATE_CHANGED',
          phase,
          focusTabId,
          breakEndsAt,
        },
        () => {
          // Ignore unchecked runtime errors when no background listener is available.
        },
      );

      lastBreakEndsAtRef.current = breakEndsAt;
      lastSyncedPomodoroPhaseRef.current = phase;
    };

    if (chromeApi?.tabs?.getCurrent) {
      chromeApi.tabs.getCurrent((tab: { id?: number }) => {
        sendPomodoroState(typeof tab?.id === 'number' ? tab.id : null);
      });
      return;
    }

    sendPomodoroState(null);
  }, [phase, timeRemaining]);

  useEffect(() => {
    if (!isPomodoroLocked) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPomodoroLocked]);

  const handleNavigate = (page: string) => {
    if (page === 'signup' || page === 'forgot-password') {
      const frontendRoute =
        page === 'signup' ? FRONTEND_ROUTES.signup : FRONTEND_ROUTES.forgotPassword;
      window.open(buildFrontendUrl(frontendRoute), '_blank', 'noopener,noreferrer');
      return;
    }

    if (page === 'achievements') {
      window.open(buildFrontendUrl(FRONTEND_ROUTES.achievements), '_blank', 'noopener,noreferrer');
      return;
    }

    if (page === 'quick-start') {
      const focusMinutes = readSavedPomodoroMinutes('focusspark-extension-focus-minutes', 25, 5, 120);
      const breakMinutes = readSavedPomodoroMinutes('focusspark-extension-break-minutes', 5, 1, 60);

      startSession('custom', { focusMinutes, breakMinutes });
      navigate(getPathFromPage('chatbot'));
      return;
    }

    if (isPomodoroLocked && page !== 'chatbot') {
      navigate(getPathFromPage('chatbot'));
      return;
    }

    navigate(getPathFromPage(page));
  };

  const handleAuthSuccess = () => {
    // After successful authentication, go to dashboard
    navigate(getPathFromPage('dashboard'));
  };

  const handleLogout = async () => {
    await clearAccessToken();
    navigate(getPathFromPage('home'));
  };

  // Pages that don't show nav and footer
  const isSpecialPage = SPECIAL_PAGES.has(currentPage);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Theme Toggle - Position adjusted for special pages */}
      <ThemeToggle
        theme={theme}
        onToggle={toggleTheme}
        isSpecialPage={isSpecialPage}
      />

      {!isSpecialPage && (
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={<ExtensionHomePage onNavigate={handleNavigate} />}
        />
        <Route
          path="/signin"
          element={<SignInPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/signup"
          element={<Navigate to="/signin" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <ChatbotWorkspace onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards"
          element={
            <ProtectedRoute>
              <FlashcardDeckScreen onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-history"
          element={
            <ProtectedRoute>
              <ChatHistoryPage onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizScreen onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
        <Route path="/achievements" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/webcam-test"
          element={
            <ProtectedRoute>
              <FocusToolsPage onNavigate={handleNavigate} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isSpecialPage && <Footer onNavigate={handleNavigate} />}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <FocusProvider>
      <PomodoroProvider>
        <AppContent />
      </PomodoroProvider>
    </FocusProvider>
  );
}
