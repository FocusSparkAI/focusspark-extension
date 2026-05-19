import { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { HeroSection } from '../pages/home/HeroSection';
import { HeroSectionDark } from '../pages/home/HeroSectionDark';
import { ProblemSolution } from '../pages/home/ProblemSolution';
import { Features } from '../pages/home/Features';
import { Testimonials } from '../pages/home/Testimonials';

import { SignInPage } from '../pages/auth/SignInPage';
import { SignUpPage } from '../pages/auth/SignUpPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import { ChatbotWorkspace } from '../pages/chat/ChatbotWorkspace';
import { FlashcardDeckScreen } from '../pages/flashcards/FlashcardDeckScreen';
import { QuizScreen } from '../pages/quiz/QuizScreen';
import { ChatHistoryPage } from '../pages/chat/ChatHistoryPage';
import { FocusToolsPage } from '../pages/webcam/FocusToolsPage';
import { FocusModeEnvironment } from '../pages/focus/FocusModeEnvironment';
import { Footer } from '../components/layout/Footer';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { Toaster } from '../components/ui/sonner';
import { FocusProvider } from '../context/FocusContext';
import { PomodoroProvider } from '../context/PomodoroContext';
import { clearAccessToken } from '../utils/backendClient';

const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  signin: '/signin',
  signup: '/signup',
  'forgot-password': '/forgot-password',
  dashboard: '/dashboard',
  chatbot: '/chatbot',
  flashcards: '/flashcards',
  'chat-history': '/chat-history',
  quiz: '/quiz',
  achievements: '/achievements',
  'webcam-test': '/webcam-test',
  'focus-env': '/focus-env',
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
  'signup',
  'forgot-password',
  'dashboard',
  'chatbot',
  'flashcards',
  'chat-history',
  'quiz',
  'achievements',
  'webcam-test',
  'focus-env',
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

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = getPageFromPath(location.pathname) ?? 'home';
 
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

  const handleNavigate = (page: string) => {
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
    <FocusProvider>
      <PomodoroProvider>
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
              element={
                <>
                  {theme === 'dark' ? (
                    <HeroSectionDark onNavigate={handleNavigate} />
                  ) : (
                    <HeroSection onNavigate={handleNavigate} />
                  )}
                  <ProblemSolution />
                  <Features />
                  <Testimonials />
                </>
              }
            />
            <Route
              path="/signin"
              element={<SignInPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />}
            />
            <Route
              path="/signup"
              element={<SignUpPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />}
            />
            <Route
              path="/forgot-password"
              element={<ForgotPasswordPage onNavigate={handleNavigate} />}
            />
            <Route
              path="/dashboard"
              element={<StudentDashboard onNavigate={handleNavigate} onLogout={handleLogout} />}
            />
            <Route path="/chatbot" element={<ChatbotWorkspace onNavigate={handleNavigate} />} />
            <Route
              path="/flashcards"
              element={<FlashcardDeckScreen onNavigate={handleNavigate} />}
            />
            <Route path="/chat-history" element={<ChatHistoryPage onNavigate={handleNavigate} />} />
            <Route path="/quiz" element={<QuizScreen onNavigate={handleNavigate} />} />
            <Route path="/achievements" element={<Navigate to="/dashboard" replace />} />
            <Route path="/webcam-test" element={<FocusToolsPage onNavigate={handleNavigate} />} />
            <Route path="/focus-env" element={<FocusModeEnvironment />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {!isSpecialPage && <Footer onNavigate={handleNavigate} />}
          <Toaster />
        </div>
      </PomodoroProvider>
    </FocusProvider>
  );
}
