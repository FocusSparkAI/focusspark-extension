import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useFocus } from '../context/FocusContext';
import { toast } from 'sonner';
import { BACKEND_ROUTES, buildBackendUrl } from '../config/backend';

// TODO: Replace MODEL_URL with backend-served model endpoint before production.
const BACKEND_MODEL_URL = buildBackendUrl(BACKEND_ROUTES.faceApiWeights);
const FALLBACK_MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

interface FocusDetectorProps {
  variant?: 'full' | 'compact' | 'hidden';
  autoStart?: boolean;
  demoMode?: boolean; // NEW: Enable automatic state cycling for demo
}

export const FocusDetector: React.FC<FocusDetectorProps> = ({ variant = 'full', autoStart = false, demoMode = true }) => {
  const { setIsFocused, isDetectionEnabled, setFocusScore } = useFocus();
  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'focused' | 'unfocused' | 'error'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const demoIntervalRef = useRef<number | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      // Silently handle error - user will see toast notification
      setStatus('error');
      setIsFocused(false);
      setIsProcessing(false);
      
      // Show user-friendly error message
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera Access Denied', {
          description: 'Please allow camera access in your browser settings to use focus detection. Click the camera icon in your address bar.',
          duration: 6000,
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
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
      
      throw err; // Re-throw to be caught by handleStart
    }
  };

  // Demo mode: Cycle through different focus states automatically
  const startDemoMode = () => {
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    
    // Define demo state cycle: Focused -> Idle -> Attention Needed -> Focused
    const demoStates = [
      { focused: true, score: 85, status: 'focused' as const },  // Focused
      { focused: false, score: 55, status: 'active' as const },  // Idle
      { focused: false, score: 25, status: 'unfocused' as const }, // Attention Needed
    ];
    
    let currentIndex = 0;
    
    // Apply initial state
    const applyDemoState = () => {
      const state = demoStates[currentIndex];
      setIsFocused(state.focused);
      setFocusScore(state.score);
      setStatus(state.status);
      currentIndex = (currentIndex + 1) % demoStates.length;
    };
    
    // Apply first state immediately
    applyDemoState();
    
    // Cycle every 20 seconds
    demoIntervalRef.current = window.setInterval(() => {
      applyDemoState();
    }, 20000);
  };

  const startDetectionLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    
    // If demo mode is enabled, use demo cycling instead of real detection
    if (demoMode) {
      startDemoMode();
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    (window as any).faceapi.matchDimensions(canvas, displaySize);

    detectIntervalRef.current = window.setInterval(async () => {
      try {
        const options = new (window as any).faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        });
        const detection = await (window as any).faceapi.detectSingleFace(video, options);
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setStatus('focused');
          setIsFocused(true);
          setFocusScore(85); // High score indicates focused state
          const resized = (window as any).faceapi.resizeResults(detection, displaySize);
          (window as any).faceapi.draw.drawDetections(canvas, resized);
        } else {
          setStatus('unfocused');
          setIsFocused(false);
          setFocusScore(30); // Low score indicates attention needed
        }
      } catch (err) {
        // Silently handle detection errors to avoid console spam
      }
    }, 300);
  };

  const handleStart = async () => {
    if (!isDetectionEnabled) return;
    
    setIsProcessing(true);
    setStatus('loading');
    
    try {
      // If demo mode is enabled, skip camera/model loading
      if (demoMode) {
        setStatus('active');
        setIsProcessing(true);
        startDetectionLoop(); // This will start demo cycling
        toast.success('Demo Mode Active', {
          description: 'Focus states will cycle every 20 seconds for demonstration',
          duration: 4000,
        });
        return;
      }
      
      // Real camera detection mode
      // Load face-api.js models
      if (!(window as any).faceapi) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      try {
        await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri(BACKEND_MODEL_URL);
      } catch {
        await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri(FALLBACK_MODEL_URL);
      }
      await startWebcam();
      setStatus('active');
      startDetectionLoop();
    } catch (err) {
      // Silently handle error - user already saw toast from startWebcam
      setStatus('error');
      setIsProcessing(false);
    }
  };

  const handleStop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setStatus('idle');
    setIsProcessing(false);
    setIsFocused(false);
    setFocusScore(50); // Reset to idle state
  };

  useEffect(() => {
    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Auto-stop if detection is disabled
  useEffect(() => {
    if (!isDetectionEnabled && isProcessing) {
      handleStop();
    }
  }, [isDetectionEnabled]);

  // Auto-start when detection is enabled (for hidden variant)
  useEffect(() => {
    if (autoStart && isDetectionEnabled && !isProcessing && status === 'idle') {
      handleStart();
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
        <video
          ref={videoRef}
          onPlay={startDetectionLoop}
          playsInline
          autoPlay
          muted
          className="w-1 h-1"
        />
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
                {status === 'loading' && 'Loading...'}
                {status === 'active' && 'Detecting...'}
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
          {status === 'loading' && 'Loading Models...'}
          {status === 'active' && 'Detecting...'}
          {status === 'focused' && 'Focused'}
          {status === 'unfocused' && 'Not Focused'}
          {status === 'error' && 'Error - Check Camera'}
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-black/20 border border-border">
        <video
          ref={videoRef}
          onPlay={startDetectionLoop}
          playsInline
          autoPlay
          muted
          className="w-full h-auto max-h-64 object-cover"
        />
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
        <Button
          onClick={handleStart}
          disabled={isProcessing || status === 'loading'}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          {status === 'loading' ? 'Loading...' : 'Start Detection'}
        </Button>
        <Button
          onClick={handleStop}
          disabled={!isProcessing}
          variant="outline"
          className="flex-1"
        >
          <CameraOff className="w-4 h-4 mr-2" />
          Stop Detection
        </Button>
      </div>
    </div>
  );
};
