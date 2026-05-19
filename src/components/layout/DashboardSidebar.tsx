import { motion } from 'motion/react';
import {
  Sparkles,
  LayoutDashboard,
  Bot,
  CreditCard,
  ClipboardCheck,
  History,

  LogOut,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/button';

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chatbot', label: 'AI Tutor', icon: Bot },
  { id: 'flashcards', label: 'Flashcards', icon: CreditCard },
  { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
  { id: 'chat-history', label: 'Chat History', icon: History },
];

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: DashboardSidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card lg:flex"
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-blue-purple">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl">FocusSpark</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-blue-purple mx-auto">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-secondary transition-colors hover:text-primary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-secondary transition-colors hover:bg-accent/50 hover:text-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {/* Logout */}
        <motion.button
          onClick={() => onNavigate('home')}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-destructive transition-colors hover:bg-destructive/10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Logout
            </motion.span>
          )}
        </motion.button>
      </nav>

      {/* Quick Start CTA */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={() => onNavigate('focus-env')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 glow-blue-purple"
          size={collapsed ? 'icon' : 'lg'}
        >
          <Play className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Quick Start</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
