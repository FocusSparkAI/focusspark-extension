import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { BACKEND_ROUTES, buildBackendUrl } from '../../config/backend';

interface FocusToolsPageProps {
  onNavigate: (page: string) => void;
}

type DetectionState =
  | 'idle'
  | 'waiting'
  | 'focused'
  | 'distracted'
  | 'eyes_closed'
  | 'looking_away'
  | 'no_face';

const detectionContent: Record<
  DetectionState,
  {
    label: string;
    description: string;
    panelClassName: string;
    textClassName: string;
    Icon: typeof Check;
  }
> = {
  idle: {
    label: 'Camera off',
    description: 'Enable the camera to start checking focus detection.',
    panelClassName: 'border-border bg-background',
    textClassName: 'text-muted-foreground',
    Icon: CameraOff,
  },
  waiting: {
    label: 'Waiting for detection',
    description: 'Camera is active. Waiting for the backend to return a result.',
    panelClassName: 'border-blue-500/30 bg-blue-500/10',
    textClassName: 'text-blue-500',
    Icon: Eye,
  },
  focused: {
    label: 'Focused',
    description: 'Backend detection currently reports that you are focused.',
    panelClassName: 'border-emerald-500/30 bg-emerald-500/10',
    textClassName: 'text-emerald-500',
    Icon: Check,
  },
  distracted: {
    label: 'Distracted',
    description: 'Backend detection currently reports reduced attention.',
    panelClassName: 'border-amber-500/30 bg-amber-500/10',
    textClassName: 'text-amber-500',
    Icon: AlertCircle,
  },
  eyes_closed: {
    label: 'Eyes closed',
    description: 'Backend detection reports that your eyes appear closed.',
    panelClassName: 'border-amber-500/30 bg-amber-500/10',
    textClassName: 'text-amber-500',
    Icon: AlertCircle,
  },
  looking_away: {
    label: 'Looking away',
    description: 'Backend detection reports that your gaze is away from the screen.',
    panelClassName: 'border-amber-500/30 bg-amber-500/10',
    textClassName: 'text-amber-500',
    Icon: AlertCircle,
  },
  no_face: {
    label: 'No face detected',
    description: 'Backend detection cannot find a visible face in the camera frame.',
    panelClassName: 'border-destructive/30 bg-destructive/10',
    textClassName: 'text-destructive',
    Icon: AlertCircle,
  },
};

const normalizeDetectionState = (value: unknown): DetectionState | null => {
  if (typeof value !== 'string') return null;

  const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');

  if (normalized.includes('eye') && normalized.includes('closed')) return 'eyes_closed';
  if (normalized.includes('look') && normalized.includes('away')) return 'looking_away';
  if (normalized.includes('no_face') || normalized.includes('face_not')) return 'no_face';
  if (normalized.includes('distract') || normalized.includes('unfocus')) return 'distracted';
  if (normalized.includes('focus')) return 'focused';

  return null;
};

export function FocusToolsPage({ onNavigate }: FocusToolsPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const cameraReadyRef = useRef(false);
  const detectInFlightRef = useRef(false);
  const socketShouldStayActiveRef = useRef(false);
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [detectionState, setDetectionState] = useState<DetectionState>('idle');
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [transportMode, setTransportMode] = useState<'idle' | 'connecting' | 'ws' | 'http'>('idle');
  const websocketUrl = buildBackendUrl(BACKEND_ROUTES.ws).replace(/^http/i, 'ws');

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) return null;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg');
    } catch {
      return null;
    }
  };

  const applyDetectionResult = (data: Record<string, unknown>) => {
    const backendState =
      normalizeDetectionState(data.status) ||
      normalizeDetectionState(data.state) ||
      normalizeDetectionState(data.result) ||
      normalizeDetectionState(data.label) ||
      normalizeDetectionState(data.reason);

    if (backendState) {
      setDetectionState(backendState);
    } else if (typeof data.focused === 'boolean') {
      setDetectionState(data.focused ? 'focused' : 'distracted');
    } else {
      setDetectionState('waiting');
    }

    const backendScore = data.focus_score ?? data.focusScore ?? data.score ?? data.confidence;
    setFocusScore(typeof backendScore === 'number' ? Math.round(backendScore) : null);
  };

  const runHttpDetection = async (imageData: string) => {
    if (detectInFlightRef.current) return;
    detectInFlightRef.current = true;

    try {
      const response = await fetch(buildBackendUrl(BACKEND_ROUTES.analyze), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP detection failed: ${response.status}`);
      }

      const data = await response.json();
      applyDetectionResult(data ?? {});
      if (transportMode !== 'http') {
        setTransportMode('http');
      }
    } catch {
      // Keep the UI stable if the backend analyze endpoint is unavailable.
    } finally {
      detectInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (isWebcamEnabled && isTracking) {
      const interval = window.setInterval(() => {
        if (!cameraReadyRef.current) return;

        const imageData = captureFrame();
        if (!imageData) return;

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ image: imageData }));
          return;
        }

        void runHttpDetection(imageData);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isWebcamEnabled, isTracking, transportMode]);

  useEffect(() => {
    if (!isWebcamEnabled || !stream || !videoRef.current) return;

    const video = videoRef.current;
    const handleLoadedMetadata = () => {
      video.play().catch(() => {
        // Ignore autoplay errors in extension context.
      });

      setTimeout(() => {
        cameraReadyRef.current = true;
      }, 3000);
    };

    video.srcObject = stream;
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isWebcamEnabled, stream]);

  useEffect(() => {
    if (!isWebcamEnabled || !isTracking) {
      socketShouldStayActiveRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setTransportMode('idle');
      setDetectionState('idle');
      return;
    }

    setTransportMode('connecting');
    setDetectionState('waiting');
    socketShouldStayActiveRef.current = true;
    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setTransportMode('ws');
      toast.success('Socket connected', {
        position: 'top-right',
        duration: 2000,
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        applyDetectionResult(data ?? {});
      } catch {
        // Ignore malformed payloads.
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      if (socketShouldStayActiveRef.current && isWebcamEnabled && isTracking) {
        setTransportMode('http');
        toast.info('Realtime socket unavailable. Switched to HTTP mode.', {
          position: 'top-right',
          duration: 3000,
        });
      }
    };

    ws.onerror = () => {
      setTransportMode('http');
      toast.error('Socket connection failed. Using HTTP fallback.', {
        position: 'top-right',
        duration: 3000,
      });
    };

    return () => {
      if (wsRef.current === ws) {
        ws.close();
        wsRef.current = null;
      }
    };
  }, [isWebcamEnabled, isTracking, websocketUrl]);

  useEffect(() => {
    return () => {
      socketShouldStayActiveRef.current = false;
      stream?.getTracks().forEach((track) => track.stop());
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [stream]);

  const handleEnableWebcam = async () => {
    if (!isWebcamEnabled) {
      try {
        cameraReadyRef.current = false;
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 960, height: 540 },
        });
        setStream(mediaStream);
        setIsWebcamEnabled(true);
        setIsTracking(true);
        setDetectionState('waiting');
        toast.success('Webcam enabled');
      } catch {
        toast.error('Could not access webcam. Please check permissions.');
      }
      return;
    }

    stream?.getTracks().forEach((track) => track.stop());
    cameraReadyRef.current = false;
    socketShouldStayActiveRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsWebcamEnabled(false);
    setIsTracking(false);
    setDetectionState('idle');
    setFocusScore(null);
    setTransportMode('idle');
    toast('Webcam disabled');
  };

  const transportLabel =
    transportMode === 'ws'
      ? 'WebSocket live'
      : transportMode === 'http'
        ? 'HTTP fallback'
        : transportMode === 'connecting'
          ? 'Connecting...'
          : 'Idle';

  const transportClassName =
    transportMode === 'ws'
      ? 'bg-emerald-500/10 text-emerald-500'
      : transportMode === 'http'
        ? 'bg-amber-500/10 text-amber-500'
        : transportMode === 'connecting'
          ? 'bg-blue-500/10 text-blue-500'
          : 'bg-muted text-muted-foreground';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-normal">Focus Tools</h1>
              <p className="truncate text-sm text-secondary">
                Optional camera-based attention checks for study sessions
              </p>
            </div>
          </div>

          <Button
            onClick={handleEnableWebcam}
            variant={isWebcamEnabled ? 'destructive' : 'default'}
            className="shrink-0 gap-2"
          >
            {isWebcamEnabled ? (
              <>
                <CameraOff className="h-4 w-4" />
                Disable Camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Enable Camera
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:py-5">
        <div className="space-y-4">
          <section>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-purple-500" />
                  Focus Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid min-w-[920px] grid-cols-2 items-stretch gap-5 overflow-x-auto pb-1">
                  <div className="flex min-h-[360px] flex-col rounded-lg border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-base font-medium">
                        <Camera className="h-4 w-4 text-emerald-500" />
                        Camera Preview
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${transportClassName}`}>
                        {transportLabel}
                      </span>
                    </div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                      {isWebcamEnabled ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-muted-foreground">
                          <CameraOff className="mb-3 h-10 w-10" />
                          <p className="text-sm font-medium">Camera is off</p>
                          <p className="mt-1 text-xs leading-5">
                            Enable camera to preview focus detection.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border bg-card px-3 py-2">
                        <p className="text-xs text-secondary">Camera</p>
                        <p className="mt-1 font-medium">{isWebcamEnabled ? 'Enabled' : 'Off'}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card px-3 py-2">
                        <p className="text-xs text-secondary">Tracking</p>
                        <p className="mt-1 font-medium">{isTracking ? 'Running' : 'Paused'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-h-[360px] flex-col gap-3 rounded-lg border border-border bg-background p-4">
                    {(() => {
                      const status = detectionContent[detectionState];
                      const StatusIcon = status.Icon;

                      return (
                        <div className={`rounded-lg border p-4 ${status.panelClassName}`}>
                          <div className="flex w-full items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-normal text-secondary">
                                Backend result
                              </p>
                              <p className={`mt-1 text-xl font-semibold ${status.textClassName}`}>
                                {status.label}
                              </p>
                              <p className="mt-1 text-sm leading-5 text-secondary">
                                {status.description}
                              </p>
                            </div>
                            <StatusIcon className={`h-6 w-6 shrink-0 ${status.textClassName}`} />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-secondary">Connection</span>
                        <span className="font-medium">{transportLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                        <span className="text-secondary">Focus score</span>
                        <span className="font-medium">
                          {focusScore === null ? 'Waiting' : `${focusScore}%`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                        <span className="text-secondary">Check rate</span>
                        <span className="font-medium">Every 2 sec</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3">
                      <div>
                        <p className="font-medium">Focus tracking</p>
                        <p className="mt-1 text-sm text-secondary">
                          Send camera frames to the backend while the camera is enabled.
                        </p>
                      </div>
                      <Switch
                        checked={isTracking}
                        onCheckedChange={setIsTracking}
                        disabled={!isWebcamEnabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <canvas ref={canvasRef} className="hidden" />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Detection states</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                  <span className="text-secondary">Focused</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-500">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                  <span className="text-secondary">Distracted</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-500">
                    Warning
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                  <span className="text-secondary">Eyes closed</span>
                  <span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs text-orange-500">
                    Alert
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                  <span className="text-secondary">Looking away</span>
                  <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-500">
                    Alert
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Best setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-secondary">
                <div className="flex gap-2 rounded-lg bg-background/70 px-3 py-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p>Keep your face centered in the camera preview.</p>
                </div>
                <div className="flex gap-2 rounded-lg bg-background/70 px-3 py-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p>Use steady lighting so the backend can read eye position clearly.</p>
                </div>
                <div className="flex gap-2 rounded-lg bg-background/70 px-3 py-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p>Keep the browser camera permission enabled while testing.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-purple-500/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-secondary">
                <div className="flex gap-3 rounded-lg bg-background/70 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-medium text-purple-500">
                    1
                  </span>
                  <p>The page sends camera frames to the connected backend while tracking is on.</p>
                </div>
                <div className="flex gap-3 rounded-lg bg-background/70 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-medium text-purple-500">
                    2
                  </span>
                  <p>Results update the status panel as focused, distracted, eyes closed, or looking away.</p>
                </div>
                <div className="flex gap-3 rounded-lg bg-background/70 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-medium text-purple-500">
                    3
                  </span>
                  <p>Video is used for detection feedback only and is not shown as saved here.</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
