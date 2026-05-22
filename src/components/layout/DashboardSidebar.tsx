import { motion } from 'motion/react';
import {
  Sparkles,
  LayoutDashboard,
  Bot,
  Layers,
  ClipboardCheck,
  History,
  LogOut,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../utils/classNames';

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void | Promise<void>;
  activePage?: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chatbot', label: 'AI Tutor', icon: Bot },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
  { id: 'chat-history', label: 'Chat History', icon: History },
];

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  onLogout,
  activePage = 'dashboard',
}: DashboardSidebarProps) {
  const primaryMobileItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chatbot', label: 'AI Tutor', icon: Bot },
    { id: 'flashcards', label: 'Cards', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
    { id: 'quick-start', label: 'Start', icon: Play },
  ];

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card lg:flex"
      >
        {/* Header */}
        <div
          className={cn(
            'relative flex h-20 items-center border-b border-border px-4',
            collapsed ? 'justify-center' : 'justify-between gap-3 px-6',
          )}
        >
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 glow-blue-purple">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xl font-semibold leading-tight tracking-normal">FocusSpark</span>
                <span className="block truncate text-xs text-secondary">Extension Workspace</span>
              </div>
            </motion.div>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-secondary shadow-sm transition-colors hover:bg-accent hover:text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50',
              collapsed && 'static',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePage;
            const button = (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                  collapsed ? 'justify-center px-3' : 'px-4',
                  isActive
                    ? 'bg-blue-500/10 text-blue-500 shadow-sm ring-1 ring-blue-500/15'
                    : 'text-secondary hover:bg-accent/60 hover:text-primary',
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
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

            if (!collapsed) {
              return button;
            }

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="space-y-3 border-t border-border p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onLogout}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive/30',
                  collapsed ? 'justify-center px-3' : 'px-4',
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
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
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={10}>
                Logout
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onNavigate('quick-start')}
                className={cn(
                  'w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 glow-blue-purple',
                  collapsed && 'px-0',
                )}
                size={collapsed ? 'icon' : 'lg'}
                title={collapsed ? 'Quick Start' : undefined}
              >
                <Play className="h-5 w-5" />
                {!collapsed && <span className="ml-2">Quick Start</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={10}>
                Quick Start
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-card/95 p-2 shadow-xl shadow-black/10 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {primaryMobileItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePage;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                  isActive
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'text-secondary hover:bg-accent/60 hover:text-primary',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
