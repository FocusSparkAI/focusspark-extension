import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import {
  Home,
  Camera,
  CameraOff,
  Eye,
  AlertCircle,
  Check,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface WebcamTestScreenProps {
  onNavigate: (page: string) => void;
}

export function WebcamTestScreen({ onNavigate }: WebcamTestScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [focusScore, setFocusScore] = useState(85);
  const [feedbackInterval, setFeedbackInterval] = useState(5);
  const [isTracking, setIsTracking] = useState(false);

  // Simulated tracking boxes
  const [faceBox] = useState({ x: 40, y: 30, width: 20, height: 30 });
  const [eyesDetected, setEyesDetected] = useState(true);

  useEffect(() => {
    // Simulate focus score changes
    if (isWebcamEnabled && isTracking) {
      const interval = setInterval(() => {
        setFocusScore((prev) => {
          const change = Math.random() * 10 - 5;
          return Math.max(0, Math.min(100, prev + change));
        });
        setEyesDetected(Math.random() > 0.2); // 80% chance eyes detected
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isWebcamEnabled, isTracking]);

  const handleEnableWebcam = async () => {
    if (!isWebcamEnabled) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsWebcamEnabled(true);
        setIsTracking(true);
        toast.success('✅ Webcam enabled!');
      } catch (error) {
        toast.error('❌ Could not access webcam. Please check permissions.');
      }
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
      setIsWebcamEnabled(false);
      setIsTracking(false);
      toast('Webcam disabled.');
    }
  };

  return (
    <div className="min-h-screen gradient-wave">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('settings')}
                className="hover:bg-accent"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="gradient-text">Webcam & Focus Detection Test</h1>
                <p className="text-sm text-secondary">
                  Test your camera and adjust privacy settings
                </p>
              </div>
            </div>

            <Button
              onClick={handleEnableWebcam}
              variant={isWebcamEnabled ? 'destructive' : 'default'}
              className="gap-2"
            >
              {isWebcamEnabled ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  Disable Webcam
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Enable Webcam
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Camera Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-green-400" />
                  Live Camera Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {isWebcamEnabled ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Tracking Overlay */}
                      {isTracking && (
                        <motion.div
                          className="absolute border-2 border-green-400 rounded-lg"
                          style={{
                            left: `${faceBox.x}%`,
                            top: `${faceBox.y}%`,
                            width: `${faceBox.width}%`,
                            height: `${faceBox.height}%`,
                          }}
                          animate={{
                            borderColor: eyesDetected ? '#4ade80' : '#f59e0b',
                          }}
                        >
                          <div className="absolute -top-6 left-0 bg-green-500/90 px-2 py-1 rounded text-xs text-white">
                            {eyesDetected ? 'Eyes Detected' : 'Looking Away'}
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary">
                      <CameraOff className="w-16 h-16 mb-4" />
                      <p className="text-sm">Webcam is disabled</p>
                      <p className="text-xs">Click "Enable Webcam" to start</p>
                    </div>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-start gap-2">
                    <Eye className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm mb-1">
                        <strong>Privacy Protected</strong>
                      </p>
                      <p className="text-xs text-secondary">
                        No video is saved — all processing happens locally on your device. Only focus metrics are recorded.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Detection Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Enable Focus Tracking</p>
                    <p className="text-xs text-secondary">
                      Track eye movement and attention
                    </p>
                  </div>
                  <Switch
                    checked={isTracking}
                    onCheckedChange={setIsTracking}
                    disabled={!isWebcamEnabled}
                  />
                </div>

                {!isWebcamEnabled && (
                  <div>
                    <label className="text-sm mb-2 block">
                      Feedback Interval (minutes)
                    </label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[feedbackInterval]}
                        onValueChange={(v) => setFeedbackInterval(v[0])}
                        min={1}
                        max={30}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-secondary w-12">{feedbackInterval}m</span>
                    </div>
                    <p className="text-xs text-secondary mt-2">
                      Ask for focus feedback every {feedbackInterval} minutes when webcam is off
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Focus Score & Stats */}
          <div className="space-y-6">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  Focus Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Circular Progress */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-muted"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#gradient-focus)"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - focusScore / 100)}`}
                        strokeLinecap="round"
                        animate={{
                          strokeDashoffset: 2 * Math.PI * 70 * (1 - focusScore / 100),
                        }}
                        transition={{ duration: 0.5 }}
                      />
                      <defs>
                        <linearGradient id="gradient-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.p
                        className="text-4xl gradient-text"
                        key={Math.floor(focusScore)}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                      >
                        {Math.round(focusScore)}%
                      </motion.p>
                      <p className="text-xs text-secondary">Focus Level</p>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <motion.div
                    className={`w-3 h-3 rounded-full ${
                      eyesDetected ? 'bg-green-400' : 'bg-yellow-400'
                    }`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm">
                    {eyesDetected ? 'Focused' : 'Attention Needed'}
                  </span>
                </div>

                {/* Tips */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <Check className="w-4 h-4 text-green-400 mt-0.5" />
                    <p className="text-secondary">
                      Maintain eye contact with screen for best results
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <Check className="w-4 h-4 text-green-400 mt-0.5" />
                    <p className="text-secondary">
                      Good lighting improves detection accuracy
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <p className="text-secondary">
                      Looking away frequently lowers your score
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Time Focused:</span>
                  <span className="gradient-text">12:34</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Distractions:</span>
                  <span className="text-yellow-400">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Avg Score:</span>
                  <span className="text-green-400">87%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
