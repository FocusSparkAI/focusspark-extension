import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  Eye,
  Lock,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Slider } from '../../components/ui/slider';
import { Switch } from '../../components/ui/switch';

interface FocusToolsPageProps {
  onNavigate: (page: string) => void;
}

export function FocusToolsPage({ onNavigate }: FocusToolsPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [focusScore, setFocusScore] = useState(85);
  const [feedbackInterval, setFeedbackInterval] = useState(5);
  const [isTracking, setIsTracking] = useState(false);
  const [eyesDetected, setEyesDetected] = useState(true);
  const [faceBox] = useState({ x: 40, y: 30, width: 20, height: 30 });

  useEffect(() => {
    if (isWebcamEnabled && isTracking) {
      const interval = window.setInterval(() => {
        setFocusScore((previousScore) => {
          const change = Math.random() * 10 - 5;
          return Math.max(0, Math.min(100, previousScore + change));
        });
        setEyesDetected(Math.random() > 0.2);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isWebcamEnabled, isTracking]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const handleEnableWebcam = async () => {
    if (!isWebcamEnabled) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 960, height: 540 },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsWebcamEnabled(true);
        setIsTracking(true);
        toast.success('Webcam enabled');
      } catch {
        toast.error('Could not access webcam. Please check permissions.');
      }
      return;
    }

    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsWebcamEnabled(false);
    setIsTracking(false);
    toast('Webcam disabled');
  };

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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-emerald-500" />
                  Camera Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                  {isWebcamEnabled ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                      {isTracking && (
                        <motion.div
                          className="absolute rounded-lg border-2"
                          style={{
                            left: `${faceBox.x}%`,
                            top: `${faceBox.y}%`,
                            width: `${faceBox.width}%`,
                            height: `${faceBox.height}%`,
                          }}
                          animate={{
                            borderColor: eyesDetected ? '#10b981' : '#f59e0b',
                          }}
                        >
                          <div className="absolute -top-7 left-0 rounded bg-emerald-500 px-2 py-1 text-xs text-white">
                            {eyesDetected ? 'Eyes detected' : 'Looking away'}
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <CameraOff className="mb-3 h-12 w-12" />
                      <p className="text-sm font-medium">Camera is off</p>
                      <p className="text-xs">Enable camera to preview focus detection</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium">Privacy protected</p>
                      <p className="mt-1 text-sm leading-6 text-secondary">
                        Video is not saved. Camera checks run locally and only focus metrics are
                        used inside the extension.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Detection Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
                  <div>
                    <p className="font-medium">Focus tracking</p>
                    <p className="mt-1 text-sm text-secondary">
                      Track eye attention while the camera is enabled.
                    </p>
                  </div>
                  <Switch
                    checked={isTracking}
                    onCheckedChange={setIsTracking}
                    disabled={!isWebcamEnabled}
                  />
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium">Feedback interval</label>
                    <span className="text-sm text-secondary">{feedbackInterval} min</span>
                  </div>
                  <Slider
                    value={[feedbackInterval]}
                    onValueChange={(value) => setFeedbackInterval(value[0])}
                    min={1}
                    max={30}
                    step={1}
                  />
                  <p className="mt-2 text-xs text-secondary">
                    How often FocusSpark should remind you to check your attention.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-purple-500" />
                  Focus Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-secondary">Current level</p>
                      <p className="mt-1 text-4xl font-semibold">{Math.round(focusScore)}%</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        eyesDetected
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {eyesDetected ? 'Focused' : 'Attention'}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${focusScore}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <p className="text-secondary">Good lighting improves detection accuracy.</p>
                  </div>
                  <div className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <p className="text-secondary">Keep your face visible for best results.</p>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                    <p className="text-secondary">Looking away often lowers the score.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Time focused</span>
                  <span className="font-medium text-blue-500">12:34</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Distractions</span>
                  <span className="font-medium text-amber-500">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Average score</span>
                  <span className="font-medium text-emerald-500">87%</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
