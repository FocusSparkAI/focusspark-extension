import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Home } from 'lucide-react';
import {
  ApiTimeoutFallback,
  CameraBlockedFallback,
  LowBatteryMode,
  OfflineModeBanner,
  SyncConflictDialog,
  RetryableError,
} from '../../components/shared/ErrorFallbacks';
import { toast } from 'sonner';

interface ErrorHandlingDemoProps {
  onNavigate: (page: string) => void;
}

export function ErrorHandlingDemo({ onNavigate }: ErrorHandlingDemoProps) {
  const [showApiTimeout, setShowApiTimeout] = useState(false);
  const [showCameraBlocked, setShowCameraBlocked] = useState(false);
  const [showLowBattery, setShowLowBattery] = useState(false);
  const [showSyncConflict, setShowSyncConflict] = useState(false);
  const [showRetryable, setShowRetryable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedActions] = useState(3);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(15);

  // Simulate battery level changes
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel((prev) => (prev <= 5 ? 100 : prev - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      toast.success('✅ Connection restored!');
    }, 2000);
  };

  const handleEnableCamera = () => {
    toast.success('📷 Camera access enabled!');
    setShowCameraBlocked(false);
  };

  const handleResolveSyncConflict = (choice: 'local' | 'remote') => {
    toast.success(`✅ Using ${choice} version`);
    setShowSyncConflict(false);
  };

  return (
    <div className="min-h-screen gradient-wave">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('dashboard')}
              className="hover:bg-accent"
            >
              <Home className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="gradient-text">Error Handling Demo</h1>
              <p className="text-sm text-secondary">
                Test all error states and recovery UX
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Banner */}
      <OfflineModeBanner isOnline={isOnline} queuedActions={queuedActions} />

      {/* Low Battery Mode */}
      <AnimatePresence>
        {showLowBattery && batteryLevel < 20 && (
          <LowBatteryMode
            isEnabled={lowPowerMode}
            onToggle={setLowPowerMode}
            batteryLevel={batteryLevel}
          />
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Control Panel */}
        <Card className="glass-card border-border mb-6">
          <CardHeader>
            <CardTitle>Trigger Error States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowApiTimeout(!showApiTimeout)}
              >
                API Timeout
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCameraBlocked(!showCameraBlocked)}
              >
                Camera Blocked
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLowBattery(!showLowBattery)}
              >
                Low Battery ({batteryLevel}%)
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOnline(!isOnline)}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSyncConflict(!showSyncConflict)}
              >
                Sync Conflict
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRetryable(!showRetryable)}
              >
                Generic Error
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State Examples */}
        <div className="space-y-6">
          {/* API Timeout */}
          <AnimatePresence>
            {showApiTimeout && (
              <ApiTimeoutFallback onRetry={handleRetry} isRetrying={isRetrying} />
            )}
          </AnimatePresence>

          {/* Camera Blocked */}
          <AnimatePresence>
            {showCameraBlocked && (
              <CameraBlockedFallback onEnableCamera={handleEnableCamera} />
            )}
          </AnimatePresence>

          {/* Retryable Error */}
          <AnimatePresence>
            {showRetryable && (
              <RetryableError
                title="Connection Failed"
                description="We couldn't reach the server. Please check your internet connection and try again."
                onRetry={handleRetry}
                isRetrying={isRetrying}
              />
            )}
          </AnimatePresence>

          {/* Example Content */}
          {!showApiTimeout && !showCameraBlocked && !showRetryable && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card border-border">
                <CardContent className="p-12 text-center">
                  <div className="mb-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-blue-purple">
                      <span className="text-4xl">🛡️</span>
                    </div>
                  </div>
                  <h2 className="text-2xl gradient-text mb-2">
                    Robust Error Handling
                  </h2>
                  <p className="text-secondary mb-6">
                    FocusSpark gracefully handles errors with clear messaging, recovery
                    options, and fallback alternatives. Click the buttons above to test
                    different error states.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm mb-1">
                        <strong>API Failures</strong>
                      </p>
                      <p className="text-xs text-secondary">
                        Local summarizer fallback with retry logic
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <p className="text-sm mb-1">
                        <strong>Offline Mode</strong>
                      </p>
                      <p className="text-xs text-secondary">
                        Queue actions for sync when back online
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/30">
                      <p className="text-sm mb-1">
                        <strong>Battery Optimization</strong>
                      </p>
                      <p className="text-xs text-secondary">
                        Reduce animations and camera usage
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Sync Conflict Dialog */}
      <SyncConflictDialog
        isVisible={showSyncConflict}
        localData={{
          timestamp: 'October 18, 2025 at 2:30 PM',
          device: 'MacBook Pro',
        }}
        remoteData={{
          timestamp: 'October 18, 2025 at 1:45 PM',
          device: 'iPad Pro',
        }}
        onResolve={handleResolveSyncConflict}
      />
    </div>
  );
}
