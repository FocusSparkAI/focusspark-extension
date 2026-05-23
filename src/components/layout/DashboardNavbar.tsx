import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  Bell,
  Clock,
  Info,
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
import { BACKEND_ROUTES } from '../../config/backend';
import backendClient, { getAuthHeaders } from '../../utils/backendClient';

interface DashboardNavbarProps {
  onLogout: () => void | Promise<void>;
}

type DashboardNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

function formatNotificationTime(value: string) {
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return '';

  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (diffSeconds < 60) return 'Just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return new Date(value).toLocaleDateString();
}

function getNotificationIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('achievement')) return Award;
  if (normalized.includes('reminder') || normalized.includes('pomodoro')) return Clock;
  if (normalized.includes('warning') || normalized.includes('alert')) return AlertCircle;
  return Info;
}

function openFrontendNotifications() {
  const url = 'https://www.google.com/';
  const chromeApi = (globalThis as typeof globalThis & { chrome?: any }).chrome;

  if (chromeApi?.tabs?.create) {
    chromeApi.tabs.create({ url });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function DashboardNavbar({ onLogout }: DashboardNavbarProps) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(false);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(false);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await backendClient.get(BACKEND_ROUTES.studyNotifications, {
        headers: authHeaders,
        params: { limit: 10 },
      });
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch {
      setNotificationsError(true);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markNotificationRead = async (notification: DashboardNotification) => {
    if (notification.read) return;

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );

    try {
      const authHeaders = await getAuthHeaders();
      await backendClient.patch(
        BACKEND_ROUTES.studyNotification.replace('{notification_id}', String(notification.id)),
        { read: true },
        { headers: authHeaders },
      );
    } catch {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: false } : item,
        ),
      );
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );

    try {
      const authHeaders = await getAuthHeaders();
      await backendClient.patch(
        BACKEND_ROUTES.studyNotificationsReadAll,
        {},
        { headers: authHeaders },
      );
    } catch {
      setNotifications((current) =>
        current.map((notification) =>
          unreadIds.includes(notification.id)
            ? { ...notification, read: false }
            : notification,
        ),
      );
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('focusspark-theme', nextDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', nextDark);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
            <LayoutDashboard className="h-5 w-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold leading-tight tracking-normal">Dashboard</h2>
            <p className="truncate text-xs text-secondary">Overview</p>
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

          <DropdownMenu onOpenChange={(open) => {
            if (open) void loadNotifications();
          }}>
            <DropdownMenuTrigger className="relative rounded-full p-2 transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between gap-3">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void markAllNotificationsRead();
                    }}
                    className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500/20"
                  >
                    Mark all as read
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 space-y-2 overflow-y-auto p-2">
                {notificationsLoading && (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm text-secondary">
                    Loading notifications...
                  </div>
                )}

                {!notificationsLoading && notificationsError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    Could not load notifications.
                  </div>
                )}

                {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm text-secondary">
                    No important notifications yet.
                  </div>
                )}

                {!notificationsLoading && !notificationsError && notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void markNotificationRead(notification)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        notification.read
                          ? 'border-transparent hover:bg-accent/50'
                          : 'border-blue-500/20 bg-blue-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-5">{notification.title}</p>
                          <p className="mt-1 text-sm leading-5 text-secondary">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-secondary">
                            {formatNotificationTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <DropdownMenuSeparator />
              <button
                type="button"
                onClick={openFrontendNotifications}
                className="w-full rounded-sm px-2 py-2 text-left text-sm font-medium text-blue-500 transition-colors hover:bg-accent/50"
              >
                View all notifications
              </button>
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
              <DropdownMenuItem onClick={() => window.open('https://www.google.com/', '_blank', 'noopener,noreferrer')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('https://www.google.com/', '_blank', 'noopener,noreferrer')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onLogout}
              >
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
