import { useRef, useState, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setIsActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, [isActive]);

  const toggleCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopCamera]);

  useEffect(() => {
    if (facingMode && !isActive) {
      // Auto-restart handled by caller
    }
    return () => { stopCamera(); };
  }, []);

  return { videoRef, canvasRef, isActive, error, startCamera, stopCamera, captureFrame, toggleCamera };
}
