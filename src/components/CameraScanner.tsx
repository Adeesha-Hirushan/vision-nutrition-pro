import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, RotateCcw, Loader2, ScanLine } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface CameraScannerProps {
  onCapture: (dataUrl: string) => void;
  isAnalyzing: boolean;
}

export function CameraScanner({ onCapture, isAnalyzing }: CameraScannerProps) {
  const { videoRef, canvasRef, isActive, error, startCamera, stopCamera, captureFrame, toggleCamera } = useCamera();
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = () => {
    const frame = captureFrame();
    if (frame) {
      onCapture(frame);
      setHasScanned(true);
      stopCamera();
    }
  };

  const handleScanAgain = () => {
    setHasScanned(false);
    startCamera();
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-muted shadow-lg">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

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
        </>
      )}

      {/* Analyzing indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-card rounded-full px-4 py-2 flex items-center gap-2 shadow-md"
          >
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-display text-foreground">Analyzing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="bg-card rounded-2xl p-6 text-center max-w-xs shadow-lg">
            <CameraOff className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-foreground text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {!isActive && !hasScanned && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={startCamera}
            className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-display font-semibold shadow-lg flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Start Camera
          </motion.button>
        )}

        {isActive && !isAnalyzing && (
          <>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleScan}
              className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-display font-semibold shadow-lg flex items-center gap-2"
            >
              <ScanLine className="w-5 h-5" />
              Scan
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleCamera}
              className="bg-card rounded-full p-3 shadow-md"
            >
              <RotateCcw className="w-5 h-5 text-foreground" />
            </motion.button>
          </>
        )}

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
