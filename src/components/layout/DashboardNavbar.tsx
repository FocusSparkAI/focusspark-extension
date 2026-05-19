import { useState } from 'react';
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function DashboardNavbar() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('focusspark-theme', nextDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', nextDark);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
            <LayoutDashboard className="h-5 w-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold leading-tight tracking-normal">Dashboard</h2>
            <p className="truncate text-xs text-secondary">FocusSpark extension workspace</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-accent/50"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="relative rounded-full p-2 transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                  <p className="text-sm">New achievement unlocked: 7-day streak!</p>
                  <p className="mt-1 text-xs text-secondary">2 minutes ago</p>
                </div>
                <div className="rounded-lg p-3 transition-colors hover:bg-accent/50">
                  <p className="text-sm">Auto-summary ready for your last session</p>
                  <p className="mt-1 text-xs text-secondary">15 minutes ago</p>
                </div>
                <div className="rounded-lg p-3 transition-colors hover:bg-accent/50">
                  <p className="text-sm">Break time in 5 minutes</p>
                  <p className="mt-1 text-xs text-secondary">20 minutes ago</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full p-1 transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/25">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4 text-current" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
