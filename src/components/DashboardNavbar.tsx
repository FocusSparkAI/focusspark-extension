import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function DashboardNavbar() {
  const [isDark, setIsDark] = useState(true);
  const [focusStatus] = useState<'focused' | 'attention' | 'break'>('focused');

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const getFocusStatusConfig = () => {
    switch (focusStatus) {
      case 'focused':
        return {
          text: 'Focused',
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          icon: CheckCircle2,
        };
      case 'attention':
        return {
          text: 'Attention Needed ⚠',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/20',
          icon: AlertTriangle,
        };
      case 'break':
        return {
          text: 'Break Recommended',
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          icon: AlertTriangle,
        };
    }
  };

  const statusConfig = getFocusStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
            <Input
              type="search"
              placeholder="Search notes, flashcards, sessions..."
              className="pl-10 bg-background/50 border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Focus Detection Status */}
          <motion.div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} border border-border`}
            animate={{
              borderColor:
                focusStatus === 'focused'
                  ? 'rgb(34, 197, 94)'
                  : focusStatus === 'attention'
                  ? 'rgb(234, 179, 8)'
                  : 'rgb(239, 68, 68)',
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
            </motion.div>
            <span className={`text-sm ${statusConfig.color}`}>{statusConfig.text}</span>
          </motion.div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-accent/50"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full relative hover:bg-accent/50 p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm">New achievement unlocked: 7-day streak!</p>
                  <p className="text-xs text-secondary mt-1">2 minutes ago</p>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <p className="text-sm">📚 Auto-summary ready for your last session</p>
                  <p className="text-xs text-secondary mt-1">15 minutes ago</p>
                </div>
                <div className="p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <p className="text-sm">⏰ Break time in 5 minutes</p>
                  <p className="text-xs text-secondary mt-1">20 minutes ago</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full p-1 hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2 text-current" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
