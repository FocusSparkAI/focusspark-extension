import { useState, useEffect } from 'react';
import { Navigation } from '../components/layout/Navigation';
import { HeroSection } from '../pages/home/HeroSection';
import { HeroSectionDark } from '../pages/home/HeroSectionDark';
import { ProblemSolution } from '../pages/home/ProblemSolution';
import { Features } from '../pages/home/Features';
import { Testimonials } from '../pages/home/Testimonials';

import { SignInPage } from '../pages/auth/SignInPage';
import { SignUpPage } from '../pages/auth/SignUpPage';

import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import { ChatbotWorkspace } from '../pages/chat/ChatbotWorkspace';
import { FlashcardDeckScreen } from '../pages/flashcards/FlashcardDeckScreen';
import { QuizScreen } from '../pages/quiz/QuizScreen';
import { ChatHistoryPage } from '../pages/chat/ChatHistoryPage';
import { FocusToolsPage } from '../pages/webcam/FocusToolsPage';
import { ErrorHandlingDemo } from '../pages/demos/ErrorHandlingDemo';
import { FocusModeEnvironment } from '../pages/focus/FocusModeEnvironment';
import { Footer } from '../components/layout/Footer';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { Toaster } from '../components/ui/sonner';
import { FocusProvider } from '../context/FocusContext';
import { PomodoroProvider } from '../context/PomodoroContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
 
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
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleAuthSuccess = () => {
    // After successful authentication, go to dashboard
    setCurrentPage('dashboard');
  };


  // Pages that don't show nav and footer
  const isSpecialPage = ['signin', 'signup', 'forgot-password', 'onboarding', 'dashboard', 'chatbot', 'flashcards','chat-history','quiz', 'achievements', 'profile', 'settings', 'webcam-test', 'error-demo', 'focus-env'].includes(currentPage);

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
        
        {currentPage === 'home' && (
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
        )}


        {currentPage === 'signin' && (
          <SignInPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />
        )}

        {currentPage === 'signup' && (
          <SignUpPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />
        )}

      
        {currentPage === 'dashboard' && (
          <StudentDashboard onNavigate={handleNavigate} />
        )}

        {currentPage === 'chatbot' && (
          <ChatbotWorkspace onNavigate={handleNavigate} />
        )}

        {currentPage === 'flashcards' && (
          <FlashcardDeckScreen onNavigate={handleNavigate} />
        )}

        {currentPage === 'quiz' && (
          <QuizScreen onNavigate={handleNavigate} />
        )}


        {currentPage === 'chat-history' && (
          <ChatHistoryPage onNavigate={handleNavigate} />
        )}

       
        {currentPage === 'webcam-test' && (
          <FocusToolsPage onNavigate={handleNavigate} />
        )}

      
        {currentPage === 'error-demo' && (
          <ErrorHandlingDemo onNavigate={handleNavigate} />
        )}

        {currentPage === 'focus-env' && (
          <FocusModeEnvironment />
        )}

          {!isSpecialPage && <Footer onNavigate={handleNavigate} />}
          <Toaster />
        </div>
      </PomodoroProvider>
    </FocusProvider>
  );
}
