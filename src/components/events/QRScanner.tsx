/**
 * QRScanner Component
 * Camera-based QR code scanner inspired by CardScanner
 * Premium Fullscreen Design
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, AlertCircle, Zap } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/hooks/useLanguage';

interface QRScannerProps {
  onScanSuccess: (qrCode: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

export function QRScanner({
  onScanSuccess,
  onScanError,
  onClose,
  isScanning,
  setIsScanning,
}: QRScannerProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);
  const [manualInput, setManualInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // QR code detection using jsQR
  const detectQRCode = useCallback((imageData: ImageData): string | null => {
    try {
      if (typeof jsQR !== 'function') return null;
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      return code ? code.data : null;
    } catch (err) {
      console.error('Error in detectQRCode:', err);
      return null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;
    if (isProcessingRef.current) return;

    // Scan frequency: ~5 times per second
    const now = Date.now();
    if (now - lastScanTimeRef.current < 200) {
      if (isScanning) requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;

    // Wait for video to be ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0) {
      if (isScanning) requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    lastScanTimeRef.current = now;

    // Match canvas to video size
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      isProcessingRef.current = true;
      const qrCode = detectQRCode(imageData);

      if (qrCode) {
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
        onScanSuccess(qrCode);
        return;
      }
    } catch (err) {
      console.error('Error detecting QR code:', err);
    } finally {
      isProcessingRef.current = false;
    }

    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  }, [isScanning, detectQRCode, onScanSuccess]);

  // Start camera - inspired by CardScanner
  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsScanning(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
      }

      // Configuration optimale pour scan QR
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Caméra arrière
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 },
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Important: wait for metadata and play
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            const onLoadedMetadata = () => {
              videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
              resolve();
            };
            videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
          }
        });
        
        if (videoRef.current) {
          await videoRef.current.play();
          // Start scanning loop
          requestAnimationFrame(scanFrame);
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      const errorMessage = err instanceof Error ? err.message : "Erreur d'accès caméra";
      setError(errorMessage);
      onScanError?.(errorMessage);
      setIsScanning(false);
    }
  }, [scanFrame, setIsScanning, onScanError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, [stream]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
      stopCamera();
      setManualInput('');
      setShowManualInput(false);
    }
  };

  // Start camera when isScanning becomes true
  useEffect(() => {
    if (isScanning && !stream) {
      startCamera();
    } else if (!isScanning && stream) {
      stopCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, stream, startCamera, stopCamera]);

  // Handle close
  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
          {/* Fullscreen Video Feed - Inspired by CardScanner */}
          <div className="absolute inset-0 z-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Overlay with Scan Window - Inspired by CardScanner */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>

            {/* Center scan area - Square for QR codes */}
            <motion.div
              className="relative w-[85%] max-w-[400px] bg-transparent border-4 border-white rounded-3xl shadow-2xl z-10"
              style={{ aspectRatio: '1/1' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Corner markers with animation */}
              <motion.div
                className="absolute -top-2 -left-2 w-10 h-10 border-t-4 border-l-4 border-[#8B5CF6] rounded-tl-xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute -top-2 -right-2 w-10 h-10 border-t-4 border-r-4 border-[#8B5CF6] rounded-tr-xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="absolute -bottom-2 -left-2 w-10 h-10 border-b-4 border-l-4 border-[#8B5CF6] rounded-bl-xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
              <motion.div
                className="absolute -bottom-2 -right-2 w-10 h-10 border-b-4 border-r-4 border-[#8B5CF6] rounded-br-xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              />

              {/* Scan Line Animation */}
              <motion.div
                className="absolute left-0 right-0 h-[3px] bg-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.8)]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />

              {/* Instructions */}
              <motion.div
                className="absolute -top-20 left-0 right-0 text-center px-2"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-white text-sm font-light bg-white/20 backdrop-blur-xl px-6 py-3 rounded-xl shadow-xl border-2 border-white/30 inline-block"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                  📱 Placez le QR Code dans le cadre
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start bg-gradient-to-b from-black/70 via-black/40 to-transparent pt-12 pb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-xl bg-white/10 text-white hover:bg-white/20 backdrop-blur-md w-11 h-11 border border-white/20 transition-all"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
              <span className="text-xs font-light text-white tracking-wide"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                Scanner Actif
              </span>
            </div>

            {/* Spacer for symmetry */}
            <div className="w-11" />
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="absolute top-28 left-6 right-6 z-30">
              <Alert className="bg-white/95 backdrop-blur-xl text-slate-900 border border-slate-200 shadow-xl rounded-2xl p-4">
                <AlertCircle className="h-5 w-5 text-slate-600" />
                <AlertDescription className="font-light ml-2 text-slate-700"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                  {error}
                </AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startCamera()}
                  className="ml-auto bg-slate-900 text-white hover:bg-slate-800 border-none h-8 text-xs rounded-lg font-light"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                >
                  Réessayer
                </Button>
              </Alert>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-8 pb-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <div className="flex flex-col items-center gap-6">
              {/* Manual Input Toggle */}
              {!showManualInput ? (
                <Button
                  onClick={() => setShowManualInput(true)}
                  className="bg-white text-slate-900 hover:bg-slate-50 rounded-2xl px-8 h-14 font-light shadow-xl transition-all active:scale-95 border border-slate-200"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                >
                  Saisir le code manuellement
                </Button>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-slate-200"
                >
                  <div className="flex gap-3">
                    <Input
                      autoFocus
                      placeholder="Code du billet (ex: TICKET-123)"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="h-12 rounded-xl text-base bg-slate-50 border-slate-200 focus:ring-2 ring-[#8B5CF6] focus:border-[#8B5CF6] text-slate-900"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                    />
                    <Button
                      onClick={handleManualSubmit}
                      disabled={!manualInput.trim()}
                      className="h-12 w-12 rounded-xl bg-slate-900 text-white p-0 hover:bg-slate-800 shrink-0 transition-all disabled:opacity-50"
                    >
                      <Zap className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualInput(false)}
                    className="w-full mt-3 text-slate-500 hover:text-slate-900 h-9 text-xs font-light rounded-lg"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                  >
                    Annuler
                  </Button>
                </motion.div>
              )}

              <p className="text-white/40 text-xs font-light tracking-wider"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                Powered by Bööh Event Tech
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default QRScanner;
