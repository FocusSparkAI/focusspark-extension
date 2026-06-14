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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BACKEND_BASE_URL, BACKEND_ROUTES } from '../../config/backend';
import { FRONTEND_ROUTES, buildFrontendUrl } from '../../config/frontend';
import backendClient, { getAuthHeaders } from '../../utils/backendClient';
import { playSoundForNewUnreadNotifications, unlockNotificationSound } from '../../utils/notificationSound';
import { formatUserDate, parseBackendDate, setUserTimeZone } from '../../utils/timezone';
import { setStoredValue } from '../../utils/chromeStorage';

interface DashboardNavbarProps {
  onLogout: () => void | Promise<void>;
  bootstrapData?: DashboardNavbarBootstrap | null;
  deferInitialLoad?: boolean;
}

type DashboardNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type DashboardNavbarBootstrap = {
  profile?: {
    full_name?: string;
    fullName?: string;
    name?: string;
    avatar_url?: string;
    avatarUrl?: string;
    timezone?: string;
  };
  settings?: {
    notifications_enabled?: boolean;
    dark_mode?: boolean;
    appearance?: {
      theme?: string;
    };
    accessibility?: {
      notification_sound?: boolean;
    };
  };
  notifications?: {
    items?: DashboardNotification[];
  };
};

type ChromeTabsApi = {
  tabs?: {
    create?: (details: { url: string }) => void;
  };
};

function formatNotificationTime(value: string) {
  const createdAt = parseBackendDate(value).getTime();
  if (!Number.isFinite(createdAt)) return '';

  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (diffSeconds < 60) return 'Just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return formatUserDate(value);
}

function getNotificationIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('achievement')) return Award;
  if (normalized.includes('reminder') || normalized.includes('pomodoro')) return Clock;
  if (normalized.includes('warning') || normalized.includes('alert')) return AlertCircle;
  return Info;
}

function getNotificationIconClass(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('achievement')) return 'bg-purple-500/12 text-purple-500';
  if (normalized.includes('reminder') || normalized.includes('pomodoro')) return 'bg-blue-500/12 text-blue-500';
  if (normalized.includes('warning') || normalized.includes('alert')) return 'bg-amber-500/12 text-amber-500';
  return 'bg-slate-500/12 text-slate-500';
}

function openFrontendRoute(path: string) {
  const url = buildFrontendUrl(path);
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeTabsApi }).chrome;

  if (chromeApi?.tabs?.create) {
    chromeApi.tabs.create({ url });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

function resolveAssetUrl(value: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, BACKEND_BASE_URL).toString();
}

function getUserInitial(name: string) {
  const firstInitial = name.trim().charAt(0);
  return firstInitial ? firstInitial.toUpperCase() : null;
}

export function DashboardNavbar({
  onLogout,
  bootstrapData,
  deferInitialLoad = false,
}: DashboardNavbarProps) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(false);
  const [extensionNotificationsEnabled, setExtensionNotificationsEnabled] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');

  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const unreadCount = extensionNotificationsEnabled ? unreadNotifications.length : 0;

  useEffect(() => {
    if (!bootstrapData) return;

    const timeoutId = window.setTimeout(() => {
      const profile = bootstrapData.profile ?? {};
      setUserTimeZone(profile.timezone);
      setAvatarUrl(resolveAssetUrl(profile.avatar_url ?? profile.avatarUrl ?? ''));
      setDisplayName(profile.full_name ?? profile.fullName ?? profile.name ?? '');

      const settings = bootstrapData.settings ?? {};
      const notificationsEnabled = settings.notifications_enabled !== false;
      setExtensionNotificationsEnabled(notificationsEnabled);
      if (!notificationsEnabled) {
        setNotifications([]);
        setNotificationsError(false);
        setNotificationsLoading(false);
      }

      const savedTheme =
        settings.appearance?.theme ??
        (typeof settings.dark_mode === 'boolean' ? (settings.dark_mode ? 'dark' : 'light') : null);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        const nextDark = savedTheme === 'dark';
        setIsDark(nextDark);
        void setStoredValue('focusspark-theme', savedTheme);
        document.documentElement.classList.toggle('dark', nextDark);
      }

      const bootstrapNotifications = bootstrapData.notifications?.items;
      if (Array.isArray(bootstrapNotifications)) {
        setNotifications(bootstrapNotifications);
        setNotificationsError(false);
        setNotificationsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [bootstrapData]);

  const loadProfile = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await backendClient.get(BACKEND_ROUTES.authProfile, {
        headers: authHeaders,
      });
      const data = response.data;
      setUserTimeZone(data?.timezone);
      setAvatarUrl(resolveAssetUrl(data?.avatar_url ?? data?.avatarUrl ?? ''));
      setDisplayName(data?.full_name ?? data?.fullName ?? data?.name ?? '');
    } catch {
      setAvatarUrl('');
      setDisplayName('');
    }
  }, []);

  const loadNotificationPreference = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await backendClient.get(BACKEND_ROUTES.studySettings, {
        headers: authHeaders,
      });
      const enabled = response.data?.notifications_enabled !== false;
      const soundEnabled = response.data?.accessibility?.notification_sound !== false;
      setExtensionNotificationsEnabled(enabled);
      if (!enabled) {
        setNotifications([]);
        setNotificationsError(false);
        setNotificationsLoading(false);
      }
      return { enabled, soundEnabled };
    } catch {
      setExtensionNotificationsEnabled(true);
      return { enabled: true, soundEnabled: false };
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    const { enabled: notificationsEnabled, soundEnabled } = await loadNotificationPreference();
    if (!notificationsEnabled) return;

    setNotificationsLoading(true);
    setNotificationsError(false);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await backendClient.get(BACKEND_ROUTES.studyNotifications, {
        headers: authHeaders,
      });
      const nextNotifications = Array.isArray(response.data) ? response.data : [];
      setNotifications(nextNotifications);
      if (soundEnabled) {
        playSoundForNewUnreadNotifications(nextNotifications);
      }
    } catch {
      setNotificationsError(true);
    } finally {
      setNotificationsLoading(false);
    }
  }, [loadNotificationPreference]);

  useEffect(() => {
    unlockNotificationSound();
    if (deferInitialLoad) return;
    void Promise.resolve().then(loadNotifications);
  }, [deferInitialLoad, loadNotifications]);

  useEffect(() => {
    if (deferInitialLoad) return;
    void Promise.resolve().then(loadProfile);
  }, [deferInitialLoad, loadProfile]);

  useEffect(() => {
    if (deferInitialLoad) return;
    const loadThemePreference = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await backendClient.get(BACKEND_ROUTES.studySettings, {
          headers: authHeaders,
        });
        const data = response.data ?? {};
        const savedTheme =
          data?.appearance?.theme ??
          (typeof data?.dark_mode === 'boolean' ? (data.dark_mode ? 'dark' : 'light') : null);

        if (savedTheme === 'light' || savedTheme === 'dark') {
          const nextDark = savedTheme === 'dark';
          setIsDark(nextDark);
          void setStoredValue('focusspark-theme', savedTheme);
          document.documentElement.classList.toggle('dark', nextDark);
        }
      } catch {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    void loadThemePreference();
  }, [deferInitialLoad]);

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
    const nextTheme = nextDark ? 'dark' : 'light';
    setIsDark(nextDark);
    void setStoredValue('focusspark-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextDark);
    void backendClient.put(BACKEND_ROUTES.studySettings, {
      dark_mode: nextDark,
      appearance: { theme: nextTheme },
    });
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
                {extensionNotificationsEnabled && unreadCount > 0 && (
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
              <div
                className="space-y-2 overflow-y-auto p-2"
                style={{ maxHeight: 'calc(100vh - 10rem)', scrollbarGutter: 'stable' }}
              >
                {!extensionNotificationsEnabled && (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm text-secondary">
                    <p className="font-medium text-foreground">Notifications off</p>
                    <p className="mt-1">
                      Extension notifications are disabled in settings.
                    </p>
                  </div>
                )}

                {extensionNotificationsEnabled && notificationsLoading && (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm text-secondary">
                    Loading notifications...
                  </div>
                )}

                {extensionNotificationsEnabled && !notificationsLoading && notificationsError && (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm text-secondary">
                    No notifications found.
                  </div>
                )}

                {extensionNotificationsEnabled && !notificationsLoading && !notificationsError && unreadNotifications.length === 0 && (
                  <div className="rounded-lg border border-border bg-background p-3 text-sm text-secondary">
                    No unread notifications.
                  </div>
                )}

                {extensionNotificationsEnabled && !notificationsLoading && !notificationsError && unreadNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconClass = getNotificationIconClass(notification.type);

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
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                          <Icon className="h-5 w-5" />
                        </span>
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
                onClick={() => openFrontendRoute(FRONTEND_ROUTES.notifications)}
                className="w-full rounded-sm px-2 py-2 text-left text-sm font-medium text-blue-500 transition-colors hover:bg-accent/50"
              >
                View all notifications
              </button>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full p-1 transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <Avatar className="h-10 w-10 border border-blue-500/20 shadow-lg shadow-purple-500/20">
                <AvatarImage src={avatarUrl} alt={displayName || 'Profile'} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getUserInitial(displayName) ?? <UserIcon className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{displayName || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openFrontendRoute(FRONTEND_ROUTES.profile)}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFrontendRoute(FRONTEND_ROUTES.settings)}>
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
