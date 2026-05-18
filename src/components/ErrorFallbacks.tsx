import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import {
  AlertTriangle,
  WifiOff,
  Camera,
  Battery,
  RefreshCw,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';

// API Timeout Fallback
interface ApiTimeoutFallbackProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ApiTimeoutFallback({ onRetry, isRetrying = false }: ApiTimeoutFallbackProps) {
  const [progress, setProgress] = useState(0);

  const handleRetry = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    onRetry();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card border-amber-500/50 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 flex items-center gap-2">
                <span>AI Response Delayed</span>
              </h3>
              <p className="text-sm text-secondary mb-4">
                The AI is taking longer than usual. You can use the local summarizer while
                we retry the connection.
              </p>
              {isRetrying && (
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-secondary mt-2">Retrying connection...</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleRetry} disabled={isRetrying}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  Retry AI
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Use Local Summarizer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Camera Blocked Fallback
interface CameraBlockedFallbackProps {
  onEnableCamera: () => void;
}

export function CameraBlockedFallback({ onEnableCamera }: CameraBlockedFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card border-red-500/50 bg-red-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2">Camera Access Blocked</h3>
              <p className="text-sm text-secondary mb-4">
                FocusSpark needs camera access to track your attention and provide focus
                insights. Your privacy is protected — all processing happens locally on your
                device.
              </p>
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-2" />
                  <p className="text-secondary">No video is stored or transmitted</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-2" />
                  <p className="text-secondary">Only focus scores are saved locally</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-2" />
                  <p className="text-secondary">You can disable this anytime in settings</p>
                </div>
              </div>
              <Button onClick={onEnableCamera} className="gap-2">
                <Camera className="w-4 h-4" />
                Enable Camera Access
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Low Battery Mode
interface LowBatteryModeProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  batteryLevel: number;
}

export function LowBatteryMode({ isEnabled, onToggle, batteryLevel }: LowBatteryModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 right-6 z-50"
    >
      <Card className="glass-card border-yellow-500/50 bg-yellow-500/5 w-80">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Battery className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm mb-1">Low Battery Detected</h4>
              <p className="text-xs text-secondary mb-3">
                Battery at {batteryLevel}%. Enable Low-Power Mode to extend your study session?
              </p>
              <Button
                size="sm"
                variant={isEnabled ? 'outline' : 'default'}
                onClick={() => onToggle(!isEnabled)}
                className="w-full gap-2"
              >
                <Zap className="w-4 h-4" />
                {isEnabled ? 'Disable' : 'Enable'} Low-Power Mode
              </Button>
              {isEnabled && (
                <p className="text-xs text-secondary mt-2">
                  ✓ Animations reduced · Camera paused
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Offline Mode Banner
interface OfflineModeBannerProps {
  isOnline: boolean;
  queuedActions: number;
}

export function OfflineModeBanner({ isOnline, queuedActions }: OfflineModeBannerProps) {
  if (isOnline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-md px-6 py-3 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5" />
            <div>
              <p className="text-sm">
                <strong>You're offline.</strong> Don't worry — you can still review flashcards
                and access your saved content.
              </p>
              {queuedActions > 0 && (
                <p className="text-xs opacity-90">
                  {queuedActions} action(s) queued for sync when you're back online.
                </p>
              )}
            </div>
          </div>
          <div className="animate-pulse">
            <div className="w-3 h-3 rounded-full bg-amber-200" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Multi-Device Sync Conflict
interface SyncConflictDialogProps {
  isVisible: boolean;
  localData: { timestamp: string; device: string };
  remoteData: { timestamp: string; device: string };
  onResolve: (choice: 'local' | 'remote') => void;
}

export function SyncConflictDialog({
  isVisible,
  localData,
  remoteData,
  onResolve,
}: SyncConflictDialogProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <Card className="glass-card border-blue-500/50 w-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Sync Conflict Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-secondary">
              We found different versions of your data. Which one would you like to keep?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onResolve('local')}
                className="p-4 rounded-lg border-2 border-border hover:border-blue-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <p className="text-sm">This Device</p>
                </div>
                <p className="text-xs text-secondary mb-1">
                  <strong>Modified:</strong> {localData.timestamp}
                </p>
                <p className="text-xs text-secondary">
                  <strong>Device:</strong> {localData.device}
                </p>
                <div className="mt-3 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to use this version →
                </div>
              </button>

              <button
                onClick={() => onResolve('remote')}
                className="p-4 rounded-lg border-2 border-border hover:border-purple-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <p className="text-sm">Cloud Version</p>
                </div>
                <p className="text-xs text-secondary mb-1">
                  <strong>Modified:</strong> {remoteData.timestamp}
                </p>
                <p className="text-xs text-secondary">
                  <strong>Device:</strong> {remoteData.device}
                </p>
                <div className="mt-3 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to use this version →
                </div>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-secondary">
                💡 <strong>Tip:</strong> Keep the newer version if you're unsure. You can
                always export your data before making changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Generic Retry Component
interface RetryableErrorProps {
  title: string;
  description: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function RetryableError({
  title,
  description,
  onRetry,
  isRetrying = false,
}: RetryableErrorProps) {
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    onRetry();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center p-8"
    >
      <Card className="glass-card border-border max-w-md">
        <CardContent className="p-6 text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: isRetrying ? Infinity : 0 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>

          <h3 className="mb-2">{title}</h3>
          <p className="text-sm text-secondary mb-4">{description}</p>

          {retryCount > 0 && (
            <p className="text-xs text-secondary mb-4">
              Retry attempt: {retryCount}
            </p>
          )}

          <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>

          <p className="text-xs text-secondary mt-4">
            No worries — we'll retry shortly. 😊
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
