import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, RotateCcw, Loader2 } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface CameraScannerProps {
  onFrame: (dataUrl: string) => void;
  isAnalyzing: boolean;
  captureInterval?: number;
}

export function CameraScanner({ onFrame, isAnalyzing, captureInterval = 2500 }: CameraScannerProps) {
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera, captureFrame, toggleCamera } = useCamera();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) onFrame(frame);
      }, captureInterval);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, captureFrame, onFrame, captureInterval]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-secondary">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanner overlay */}
      {isActive && (
        <>
          {/* Corner brackets */}
          <div className="absolute inset-8 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
          </div>
          {/* Scan line */}
          <div className="absolute inset-x-8 top-8 pointer-events-none">
            <div className="scanner-line w-full" />
          </div>
          {/* Analyzing indicator */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm font-display text-foreground">Analyzing...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="glass-strong rounded-2xl p-6 text-center max-w-xs">
            <CameraOff className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-foreground text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={isActive ? stopCamera : startCamera}
          className="glass-strong rounded-full p-4 glow"
        >
          {isActive ? (
            <CameraOff className="w-6 h-6 text-primary" />
          ) : (
            <Camera className="w-6 h-6 text-primary" />
          )}
        </motion.button>
        {isActive && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleCamera}
            className="glass rounded-full p-3"
          >
            <RotateCcw className="w-5 h-5 text-foreground" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
