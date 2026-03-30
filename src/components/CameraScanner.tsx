import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraOff, RotateCcw, Loader2, UtensilsCrossed } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface CameraScannerProps {
  onCapture: (dataUrl: string) => void;
  isAnalyzing: boolean;
  capturedImage?: string | null;
  onCameraOpened?: () => void;
}

export function CameraScanner({ onCapture, isAnalyzing, capturedImage, onCameraOpened }: CameraScannerProps) {
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera, captureFrame } = useCamera();
  const [hasScanned, setHasScanned] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown + auto-scan after camera opens
  useEffect(() => {
    if (isActive && !isAnalyzing && !hasScanned && countdown === null) {
      setCountdown(5);
    }
  }, [isActive, isAnalyzing, hasScanned, countdown]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown !== null && countdown > 0]); // eslint-disable-line

  // Capture when countdown hits 0
  useEffect(() => {
    if (countdown === 0 && isActive && !hasScanned) {
      const frame = captureFrame();
      if (frame) {
        onCapture(frame);
        setHasScanned(true);
        stopCamera();
      }
      setCountdown(null);
    }
  }, [countdown, isActive, hasScanned, captureFrame, onCapture, stopCamera]);

  const handleOpenCamera = () => {
    if (!isActive && !hasScanned && !error) {
      startCamera();
      onCameraOpened?.();
    }
  };

  const handleScanAgain = () => {
    setHasScanned(false);
    setCountdown(null);
    startCamera();
    onCameraOpened?.();
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl bg-muted shadow-lg">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Captured image preview */}
      {hasScanned && capturedImage && !isActive && (
        <div className="absolute inset-0">
          <img src={capturedImage} alt="Captured food" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Empty state placeholder — clickable to open camera */}
      {!isActive && !hasScanned && !error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted cursor-pointer active:bg-muted/80 transition-colors"
          onClick={handleOpenCamera}
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center px-6">
            <p className="text-foreground font-display font-semibold text-base">Point your camera at food</p>
            <p className="text-muted-foreground text-xs mt-1">Tap here to start scanning</p>
          </div>
        </div>
      )}

      {/* Scanner overlay when active */}
      {isActive && (
        <>
          <div className="absolute inset-8 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
          </div>
          <div className="absolute inset-x-8 top-8 pointer-events-none">
            <div className="scanner-line w-full" />
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2 shadow-md">
            {countdown !== null && countdown > 0 ? (
              <span className="text-xs font-display text-foreground">Scanning in {countdown}s...</span>
            ) : (
              <>
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-xs font-display text-foreground">Scanning...</span>
              </>
            )}
          </div>
        </>
      )}

      {/* Analyzing indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-md"
          >
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-display text-foreground">Analyzing food...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-muted">
          <div className="bg-card rounded-3xl p-6 text-center max-w-xs shadow-lg">
            <CameraOff className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-foreground text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Scan Again button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {hasScanned && !isAnalyzing && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleScanAgain}
            className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-display font-semibold shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Scan Again
          </motion.button>
        )}
      </div>
    </div>
  );
}
