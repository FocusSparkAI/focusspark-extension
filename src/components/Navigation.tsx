import { Moon, Sun, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Navigation({ currentPage, onNavigate, theme, onThemeToggle }: NavigationProps) {
  const navLinks = [
    { name: 'Home', path: 'home' },
  ];
  void currentPage;
  void navLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-blue-purple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">FocusSpark</span>
          </button>

          {/* Nav Links */}
          {/* <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`transition-colors hover:text-foreground ${
                  currentPage === link.path
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div> */}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="rounded-full transition-all hover:scale-110"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* Auth Buttons */}
            <Button
              variant="ghost"
              onClick={() => onNavigate('signin')}
              className="hidden md:inline-flex"
            >
              Sign In
            </Button>
            <Button
              onClick={() => onNavigate('signup')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
