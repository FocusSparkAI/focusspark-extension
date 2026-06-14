import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { toast } from 'sonner';
import { FocusProvider } from '../context/FocusContext';
import { PomodoroProvider } from '../context/PomodoroContext';
import { usePomodoro } from '../hooks/usePomodoro';
import { clearStoredValuesExcept, getStoredValue, setStoredValue } from '../utils/chromeStorage';
import { loadSavedPomodoroTimings } from '../utils/pomodoroSettings';
import { FRONTEND_ROUTES, buildFrontendUrl } from '../config/frontend';
import { BACKEND_ROUTES } from '../config/backend';
import backendClient from '../utils/backendClient';
import { ProtectedRoute } from './ProtectedRoute';

type ChromeRuntimeApi = {
  runtime?: {
    sendMessage?: (message: unknown, callback?: () => void) => void;
  };
  tabs?: {
    getCurrent?: (callback: (tab?: { id?: number }) => void) => void;
  };
};

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
  const [isStrictModeLocked, setIsStrictModeLocked] = useState(false);
  const guardedLocation = useMemo(() => {
    if (!isStrictModeLocked || currentPage === 'chatbot') return location;
    return {
      ...location,
      pathname: getPathFromPage('chatbot'),
    };
  }, [currentPage, isStrictModeLocked, location]);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    void setStoredValue('focusspark-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  }, []);

  const loadThemePreference = useCallback(async () => {
    try {
      const response = await backendClient.get(BACKEND_ROUTES.studySettings);
      const data = response.data ?? {};
      const savedTheme =
        data?.appearance?.theme ??
        (typeof data?.dark_mode === 'boolean' ? (data.dark_mode ? 'dark' : 'light') : null);

      if (savedTheme === 'light' || savedTheme === 'dark') {
        applyTheme(savedTheme);
      }
    } catch {
      // Keep the locally selected theme if backend settings are unavailable.
    }
  }, [applyTheme]);

  const saveThemePreference = async (nextTheme: 'light' | 'dark') => {
    try {
      await backendClient.put(BACKEND_ROUTES.studySettings, {
        dark_mode: nextTheme === 'dark',
        appearance: { theme: nextTheme },
      });
    } catch {
      // Local theme still applies immediately; backend sync can recover later.
    }
  };

  useEffect(() => {
    let isMounted = true;

    void getStoredValue('focusspark-theme').then((savedTheme) => {
      if (!isMounted) return;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        applyTheme(savedTheme);
      }
    });

    const themePreferenceTimeoutId = window.setTimeout(() => void loadThemePreference(), 0);

    void getStoredValue('focusspark-strict-mode').then((storedStrictMode) => {
      if (!isMounted) return;
      setIsStrictModeLocked(storedStrictMode === 'true');
    });

    return () => {
      isMounted = false;
      window.clearTimeout(themePreferenceTimeoutId);
    };
  }, [applyTheme, loadThemePreference]);

  // Initialize theme from Chrome storage, defaulting to light on first run
  useEffect(() => {
    // Prevent flash of unstyled content
    document.documentElement.classList.add('preload');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Remove preload class after a brief delay to enable transitions
    setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    void saveThemePreference(newTheme);
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
    if (isStrictModeLocked && currentPage !== 'chatbot') {
      toast.info('Strict Mode is on. Stay in the AI Tutor workspace to keep focus.', {
        id: 'strict-mode-route-blocked',
        duration: 3000,
      });
      navigate(getPathFromPage('chatbot'), { replace: true });
    }
  }, [currentPage, isStrictModeLocked, navigate]);

  useEffect(() => {
    const previousPhase = lastSyncedPomodoroPhaseRef.current;
    if (previousPhase === phase) return;

    const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeRuntimeApi }).chrome;
    const sendRuntimeMessage = chromeApi?.runtime?.sendMessage;
    if (!sendRuntimeMessage) return;

    const sendPomodoroState = (focusTabId: number | null) => {
      const breakEndsAt = phase === 'break' ? Date.now() + timeRemaining * 1000 : null;

      if (previousPhase === 'break' && phase === 'idle') {
        sendRuntimeMessage(
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

      sendRuntimeMessage(
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
      chromeApi.tabs.getCurrent((tab?: { id?: number }) => {
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

  const handleNavigate = async (page: string) => {
    if (isStrictModeLocked && currentPage === 'chatbot' && page !== 'chatbot') {
      toast.info('Strict Mode is on. Stay in the AI Tutor workspace to keep focus.', {
        id: 'strict-mode-navigation-blocked',
        duration: 3000,
      });
      navigate(getPathFromPage('chatbot'));
      return;
    }

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
      const { focusMinutes, breakMinutes } = await loadSavedPomodoroTimings();

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
    void loadThemePreference();
    // After successful authentication, go to dashboard
    navigate(getPathFromPage('dashboard'));
  };

  const handleLogout = async () => {
    try {
      await backendClient.post(BACKEND_ROUTES.authLogout);
    } catch {
      // Local logout should still complete if the server is unavailable.
    } finally {
      await clearStoredValuesExcept(['focusspark-theme']);
      setIsStrictModeLocked(false);
      navigate(getPathFromPage('home'));
    }
  };

  // Pages that don't show nav and footer
  const isSpecialPage = SPECIAL_PAGES.has(currentPage);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={currentPage === 'home' ? { background: theme === 'dark' ? '#0F121A' : '#F7FAFC' } : undefined}
    >
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

      <Routes location={guardedLocation}>
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
              <ChatbotWorkspace
                onNavigate={handleNavigate}
                onStrictModeChange={setIsStrictModeLocked}
              />
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
