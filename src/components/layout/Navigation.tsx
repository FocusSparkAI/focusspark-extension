import { LayoutDashboard, Moon, Sparkles, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { getAccessToken } from '../../utils/backendClient';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Navigation({ currentPage, onNavigate, theme, onThemeToggle }: NavigationProps) {
  void currentPage;

  const openDashboard = async () => {
    const token = await getAccessToken();
    onNavigate(token ? 'dashboard' : 'signin');
  };

  return (
    <nav className="sticky left-0 right-0 top-0 z-50 mb-6 px-3 py-3">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-background/90 px-4 shadow-sm backdrop-blur-xl sm:px-5">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-85"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 glow-blue-purple">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="truncate text-lg font-bold text-foreground">FocusSpark</span>
            <span className="hidden rounded-full border border-border bg-card px-2 py-0.5 text-xs text-secondary sm:inline-flex">
              Extension
            </span>
          </button>

          <div className="flex items-center gap-3">
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

            <Button
              variant="ghost"
              onClick={() => onNavigate('signin')}
              className="hidden md:inline-flex"
            >
              Sign In
            </Button>
            <Button
              onClick={() => void openDashboard()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all"
            >
              <LayoutDashboard className="mr-2 hidden h-4 w-4 sm:block" />
              Open Dashboard
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
