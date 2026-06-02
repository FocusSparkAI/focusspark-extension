import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CameraOff, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { useFocus } from '../../hooks/useFocus';
import { BACKEND_ROUTES, buildBackendUrl, buildBackendWsUrl } from '../../config/backend';
import { getAccessToken, getAuthHeaders } from '../../utils/backendClient';

interface FocusDetectorProps {
  variant?: 'full' | 'compact' | 'hidden';
  autoStart?: boolean;
}

type FocusStatus = 'idle' | 'loading' | 'active' | 'focused' | 'unfocused' | 'error';

export const FocusDetector: React.FC<FocusDetectorProps> = ({
  variant = 'full',
  autoStart = false,
}) => {
  const { setIsFocused, isDetectionEnabled, setFocusScore } = useFocus();
  const [status, setStatus] = useState<FocusStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const analysisInFlightRef = useRef(false);
  const fallbackToastShownRef = useRef(false);
  const authErrorToastShownRef = useRef(false);
  const handleStartRef = useRef<() => Promise<void>>(async () => undefined);
  const handleStopRef = useRef<() => void>(() => undefined);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      const cameraError = err as { name?: string };
      setStatus('error');
      setIsFocused(false);
      setIsProcessing(false);

      if (cameraError.name === 'NotAllowedError' || cameraError.name === 'PermissionDeniedError') {
        toast.error('Camera Access Denied', {
          description:
            'Please allow camera access in your browser settings to use focus detection. Click the camera icon in your address bar.',
          duration: 6000,
        });
      } else if (cameraError.name === 'NotFoundError' || cameraError.name === 'DevicesNotFoundError') {
        toast.error('No Camera Found', {
          description: 'Please connect a camera to use focus detection.',
          duration: 5000,
        });
      } else {
        toast.error('Camera Error', {
          description: 'Unable to access camera. Please check your camera settings and try again.',
          duration: 5000,
        });
      }

      throw err;
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) return null;

    try {
      const context = canvas.getContext('2d');
      if (!context) return null;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg');
    } catch {
      return null;
    }
  };

  const applyBackendResult = (data: Record<string, unknown>) => {
    const backendFocused = typeof data.focused === 'boolean' ? data.focused : null;
    const metrics = (data.metrics ?? {}) as Record<string, unknown>;
    const rawScore = metrics.focus_score ?? data.focus_score ?? data.focusScore ?? data.score;
    const normalizedScore =
      typeof rawScore === 'number'
        ? rawScore <= 1
          ? Math.round(rawScore * 100)
          : Math.round(rawScore)
        : null;

    if (backendFocused !== null) {
      setIsFocused(backendFocused);
      setStatus(backendFocused ? 'focused' : 'unfocused');
      setFocusScore(normalizedScore ?? (backendFocused ? 85 : 30));
      return;
    }

    setIsFocused(false);
    setStatus('unfocused');
    setFocusScore(normalizedScore ?? 30);
  };

  const stopBackendDetectionLoop = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    analysisInFlightRef.current = false;
  };

  const closeWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.onopen = null;
      websocketRef.current.onmessage = null;
      websocketRef.current.onerror = null;
      websocketRef.current.onclose = null;
      websocketRef.current.close();
      websocketRef.current = null;
    }
  };

  const showAuthError = () => {
    closeWebSocket();
    stopBackendDetectionLoop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setStatus('error');
    setIsProcessing(false);
    setIsFocused(false);
    setFocusScore(50);

    if (!authErrorToastShownRef.current) {
      authErrorToastShownRef.current = true;
      toast.error('Sign in required', {
        description: 'Please sign in again to use camera-based focus detection.',
        duration: 5000,
      });
    }
  };

  const runBackendDetectionLoop = () => {
    stopBackendDetectionLoop();

    detectIntervalRef.current = window.setInterval(async () => {
      if (analysisInFlightRef.current) return;

      const imageData = captureFrame();
      if (!imageData) return;

      analysisInFlightRef.current = true;
      try {
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.Authorization) {
          showAuthError();
          stopBackendDetectionLoop();
          return;
        }

        const response = await fetch(buildBackendUrl(BACKEND_ROUTES.analyze), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ image: imageData }),
        });

        if (response.status === 401 || response.status === 403) {
          showAuthError();
          stopBackendDetectionLoop();
          return;
        }

        if (!response.ok) {
          throw new Error(`Focus detection request failed with status ${response.status}`);
        }

        const data = await response.json();
        applyBackendResult(data ?? {});
      } catch {
        // Keep the UI stable if the backend temporarily fails.
      } finally {
        analysisInFlightRef.current = false;
      }
    }, 2000);
  };

  const fallBackToHttpDetection = () => {
    closeWebSocket();
    runBackendDetectionLoop();

    if (!fallbackToastShownRef.current) {
      fallbackToastShownRef.current = true;
      toast.info('Using backup focus detection', {
        description: 'Live connection was unavailable, so FocusSpark switched to standard analysis.',
        duration: 4000,
      });
    }
  };

  const runWebSocketDetectionLoop = async () => {
    closeWebSocket();
    stopBackendDetectionLoop();

    const token = await getAccessToken();
    if (!token) {
      showAuthError();
      return;
    }

    let socket: WebSocket;
    try {
      const wsUrl = new URL(buildBackendWsUrl(BACKEND_ROUTES.ws));
      wsUrl.searchParams.set('token', token);
      socket = new WebSocket(wsUrl.toString());
    } catch {
      fallBackToHttpDetection();
      return;
    }

    websocketRef.current = socket;

    socket.onopen = () => {
      if (websocketRef.current !== socket) return;

      detectIntervalRef.current = window.setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) return;

        const imageData = captureFrame();
        if (!imageData) return;

        socket.send(JSON.stringify({ image: imageData }));
      }, 2000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.error) return;
        applyBackendResult(data ?? {});
      } catch {
        // Ignore malformed messages and wait for the next frame.
      }
    };

    socket.onerror = () => {
      if (websocketRef.current === socket) {
        fallBackToHttpDetection();
      }
    };

    socket.onclose = (event) => {
      if (websocketRef.current === socket && isProcessing) {
        if (event.code === 1008) {
          showAuthError();
          return;
        }

        fallBackToHttpDetection();
      }
    };
  };

  const handleStart = async () => {
    if (!isDetectionEnabled) return;

    setIsProcessing(true);
    setStatus('loading');

    try {
      await startWebcam();
      setStatus('active');
      fallbackToastShownRef.current = false;
      authErrorToastShownRef.current = false;
      void runWebSocketDetectionLoop();
    } catch {
      setStatus('error');
      setIsProcessing(false);
    }
  };

  const handleStop = () => {
    closeWebSocket();
    stopBackendDetectionLoop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setStatus('idle');
    setIsProcessing(false);
    setIsFocused(false);
    setFocusScore(50);
  };

  useEffect(() => {
    handleStartRef.current = handleStart;
    handleStopRef.current = handleStop;
  });

  useEffect(() => {
    return () => {
      closeWebSocket();
      stopBackendDetectionLoop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isDetectionEnabled && isProcessing) {
      void Promise.resolve().then(() => handleStopRef.current());
    }
  }, [isDetectionEnabled, isProcessing]);

  useEffect(() => {
    if (autoStart && isDetectionEnabled && !isProcessing && status === 'idle') {
      void Promise.resolve().then(() => handleStartRef.current());
    }
  }, [autoStart, isDetectionEnabled, isProcessing, status]);

  if (!isDetectionEnabled) {
    if (variant === 'hidden') {
      return null;
    }

    return (
      <div className="glass-card p-6 rounded-lg">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <CameraOff className="w-5 h-5" />
          <p>Camera-based Focus Detection is disabled</p>
        </div>
      </div>
    );
  }

  if (variant === 'hidden') {
    return (
      <div className="hidden">
        <video ref={videoRef} playsInline autoPlay muted className="w-1 h-1" />
        <canvas ref={canvasRef} className="w-1 h-1" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="glass-card p-4 rounded-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {status === 'focused' ? (
              <Eye className="w-5 h-5 text-focus-green" />
            ) : status === 'unfocused' ? (
              <EyeOff className="w-5 h-5 text-focus-amber" />
            ) : (
              <Camera className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Focus Detection</p>
              <p
                className={`text-xs ${
                  status === 'focused'
                    ? 'text-focus-green'
                    : status === 'unfocused'
                      ? 'text-focus-amber'
                      : 'text-muted-foreground'
                }`}
              >
                {status === 'idle' && 'Not Active'}
                {status === 'loading' && 'Starting...'}
                {status === 'active' && 'Analyzing...'}
                {status === 'focused' && 'Focused'}
                {status === 'unfocused' && 'Attention Needed'}
                {status === 'error' && 'Error - Check Settings'}
              </p>
            </div>
          </div>
          {!isProcessing ? (
            <Button onClick={handleStart} size="sm" variant="outline">
              Start
            </Button>
          ) : (
            <Button onClick={handleStop} size="sm" variant="outline">
              Stop
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Focus Detection</h4>
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
            status === 'focused'
              ? 'bg-focus-bg text-focus-green border border-focus-green/30'
              : status === 'unfocused'
                ? 'bg-focus-amber/10 text-focus-amber border border-focus-amber/30'
                : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          {status === 'focused' && <Eye className="w-4 h-4" />}
          {status === 'unfocused' && <EyeOff className="w-4 h-4" />}
          {status === 'idle' && 'Idle — Click Start'}
          {status === 'loading' && 'Starting...'}
          {status === 'active' && 'Analyzing...'}
          {status === 'focused' && 'Focused'}
          {status === 'unfocused' && 'Not Focused'}
          {status === 'error' && 'Error - Check Camera'}
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-black/20 border border-border">
        <video ref={videoRef} playsInline autoPlay muted className="w-full h-auto max-h-64 object-cover" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {!isProcessing && status !== 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Camera className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-sm text-red-300 mb-2">Camera Access Required</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Please allow camera access in your browser settings and try again
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleStart} disabled={isProcessing || status === 'loading'} className="flex-1">
          <Camera className="w-4 h-4 mr-2" />
          {status === 'loading' ? 'Starting...' : 'Start Detection'}
        </Button>
        <Button onClick={handleStop} disabled={!isProcessing} variant="outline" className="flex-1">
          <CameraOff className="w-4 h-4 mr-2" />
          Stop Detection
        </Button>
      </div>
    </div>
  );
};
