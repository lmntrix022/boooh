import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AIParsingService, AIParsingResult, ProgressCallback } from '@/services/aiParsingService';
import { ScannedContactsService, CreateScannedContactData } from '@/services/scannedContactsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { preprocessImageForOCR, analyzeImageQuality } from '@/utils/imagePreprocessing';

interface CardScannerProps {
  onContactCreated?: (contact: any) => void;
  onClose?: () => void;
}

const CardScanner: React.FC<CardScannerProps> = ({ onContactCreated, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsingResult, setParsingResult] = useState<AIParsingResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<CreateScannedContactData>({});
  const [liveQuality, setLiveQuality] = useState<{
    brightness: number;
    sharpness: number;
    isGood: boolean;
  } | null>(null);

  // Nettoyer les URLs blob au démontage du composant
  useEffect(() => {
    return () => {
      if (capturedImage && capturedImage.startsWith('blob:')) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  // Nettoyer les URLs blob quand le composant se démonte
  useEffect(() => {
    return () => {
      // Nettoyer toutes les URLs blob orphelines
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    };
  }, []);

  // Précharger Tesseract.js en arrière-plan pour accélérer le premier scan
  useEffect(() => {
    AIParsingService.preloadTesseractWorker();
  }, []);

  // Phase 3: Analyse de qualité en temps réel pendant la capture
  useEffect(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      setLiveQuality(null);
      return;
    }

    const analyzeInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      // Capturer une frame pour analyse (petite taille pour performance)
      canvas.width = 640;
      canvas.height = 480;
      context.drawImage(video, 0, 0, 640, 480);

      const frameData = canvas.toDataURL('image/jpeg', 0.8);

      // Analyser la qualité de cette frame
      const quality = await analyzeImageQuality(frameData);

      setLiveQuality({
        brightness: quality.brightness,
        sharpness: quality.sharpness,
        isGood: quality.isQualityGood
      });
    }, 1000); // Analyser toutes les secondes

    return () => clearInterval(analyzeInterval);
  }, [isScanning]);

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Configuration optimale pour OCR de cartes de visite
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Caméra arrière
          width: { min: 1920, ideal: 3840, max: 4096 },    // 4K si disponible, sinon Full HD
          height: { min: 1080, ideal: 2160, max: 2160 },   // Résolution optimale pour OCR
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 }
          // Note: focusMode, exposureMode, whiteBalanceMode ne sont pas standard mais auto-gérés par le navigateur
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      // Error log removed
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.');
      setIsScanning(false);
    }
  }, []);

  // Arrêter la caméra
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Capturer une photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Qualité JPEG maximale pour OCR (95% au lieu de 80%)
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
    setShowPreview(true);
    stopCamera();
  }, [stopCamera]);

  // Traiter l'image avec progression détaillée
  const processImage = useCallback(async (imageFile: File) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      setProgressMessage('Démarrage...');

      // Callback de progression
      const onProgress: ProgressCallback = (stage, progressValue, detail) => {
        setProgress(progressValue);
        if (detail) {
          setProgressMessage(detail);
        }
      };

      // Phase 1 - Prétraitement de l'image pour optimiser l'OCR
      setProgressMessage('Prétraitement de l\'image...');
      
      // Convertir le fichier en data URL pour le prétraitement
      const reader = new FileReader();
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Analyser la qualité de l'image avant prétraitement
      const qualityBefore = await analyzeImageQuality(imageDataUrl);
      setProgressMessage(`Qualité image: ${qualityBefore.isQualityGood ? '✓ Bonne' : '⚠ Moyenne'}`);

      // Appliquer le prétraitement d'image (amélioration OCR)
      const preprocessedDataUrl = await preprocessImageForOCR(imageDataUrl, {
        enhanceContrast: true,
        reduceNoise: true,
        sharpen: true,
        deskew: true,
        binarize: qualityBefore.brightness < 0.3 || qualityBefore.brightness > 0.7
      });

      // Convertir le data URL prétraité en File (sans fetch pour éviter CSP)
      const base64Data = preprocessedDataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const preprocessedBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/jpeg' });
      const preprocessedFile = new File(
        [preprocessedBlob],
        `preprocessed-${imageFile.name}`,
        { type: 'image/jpeg' }
      );

      // Phase 2 - Parsing avec IA (avec callback de progression)
      const result = await AIParsingService.parseBusinessCard(preprocessedFile, onProgress);
      
      setProgress(100);
      setProgressMessage('Scan terminé!');
      
      setParsingResult(result);
      setEditedData({
        first_name: result.firstName || '',
        last_name: result.lastName || '',
        full_name: result.name || '',
        title: result.title || '',
        company: result.company || '',
        email: result.email || '',
        email_alt: result.emailAlt || '',  // Nouveau: email alternatif
        phone: result.phone || '',
        phone_alt: result.phoneAlt || '',  // Nouveau: téléphone alternatif
        website: result.website || '',
        address: result.address?.full || '',
        city: result.address?.city || '',
        postal_code: result.address?.postalCode || '',
        country: result.address?.country || '',
        social_media: result.socialMedia,
        scan_confidence: result.confidence,
        raw_ocr_text: result.rawData.rawText,
        tags: ['scanner', 'imported'],
        notes: result.suggestions.join('; ')
      });
      
      setIsEditing(true);
      
      // Toast avec informations détaillées
      const confidence = Math.round(result.confidence * 100);
      const socialCount = Object.keys(result.socialMedia || {}).length;
      const hasBrands = result.suggestions?.some(s => s.includes('Marques détectées')) || false;
      
      toast({
        title: "✅ Carte scannée avec succès",
        description: `Confiance: ${confidence}% | Réseaux: ${socialCount} | ${hasBrands ? '🏢 Marques détectées' : ''}`,
      });
    } catch (err) {
      setError('Erreur lors du traitement de l\'image. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage('');
    }
  }, [user, toast]);

  // Gérer l'upload de fichier
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    } else {
      setError('Veuillez sélectionner une image valide');
    }
  }, [processImage]);

  // Gérer la capture depuis la caméra
  const handleCapture = useCallback(() => {
    if (!capturedImage) return;
    
    try {
      // Convertir l'image capturée en File sans utiliser fetch (évite CSP)
      const base64Data = capturedImage.split(',')[1];
      const mimeType = capturedImage.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const file = new File([blob], 'captured-card.jpg', { type: 'image/jpeg' });
      
      processImage(file);
    } catch (error) {
      setError('Erreur lors du traitement de l\'image');
    }
  }, [capturedImage, processImage]);

  // Sauvegarder le contact
  const saveContact = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      
      const contact = await ScannedContactsService.createContact(user.id, editedData, 'scanner');
      
      toast({
        title: "Contact créé",
        description: "Le contact a été ajouté à votre liste.",
      });
      
      onContactCreated?.(contact);
      handleReset();
    } catch (err) {
      // Error log removed
      setError('Erreur lors de la sauvegarde du contact');
    } finally {
      setIsProcessing(false);
    }
  }, [user, editedData, toast, onContactCreated]);

  // Réinitialiser le scanner
  const handleReset = useCallback(() => {
    // Nettoyer l'URL blob si elle existe
    if (capturedImage && capturedImage.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage);
    }
    
    setCapturedImage(null);
    setParsingResult(null);
    setShowPreview(false);
    setIsEditing(false);
    setEditedData({});
    setError(null);
    setProgress(0);
    stopCamera();
  }, [stopCamera, capturedImage]);

  // Fermer le scanner
  const handleClose = useCallback(() => {
    handleReset();
    onClose?.();
  }, [handleReset, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="relative z-10 p-4 sm:p-6 md:p-8 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <motion.div
                  className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Camera className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-600" />
                </motion.div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 truncate tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Scanner de carte
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-light hidden sm:block"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    Scannez votre carte de visite en quelques secondes
                  </p>
              </div>
            </div>
              <motion.button
              onClick={handleClose}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>
            </div>
          </div>
          
          <div className="relative z-10 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            {/* Erreur */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-light text-red-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{error}</p>
                </div>
              </motion.div>
            )}

            {/* Scanner principal */}
            {!showPreview && !isEditing && (
              <div className="space-y-4">
                {/* Caméra */}
                {isScanning ? (
                  <motion.div
                    className="relative rounded-xl md:rounded-2xl overflow-hidden bg-black shadow-2xl border-2 border-gray-200/60"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 sm:h-80 md:h-96 object-cover"
                    />

                    {/* Guide visuel amélioré pour carte de visite */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Overlay sombre pour mettre en valeur le cadre */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/50"></div>

                      {/* Rectangle de cadrage optimal (ratio carte de visite: 85.6mm x 53.98mm ≈ 1.586:1) */}
                      <motion.div
                        className="relative w-[85%] sm:w-[75%] bg-transparent border-4 border-white rounded-xl shadow-2xl z-10"
                        style={{ aspectRatio: '1.586/1' }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        {/* Coins animés avec gradient */}
                        <motion.div
                          className="absolute -top-2 -left-2 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-xl"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute -top-2 -right-2 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-xl"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="absolute -bottom-2 -left-2 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-xl"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        />
                        <motion.div
                          className="absolute -bottom-2 -right-2 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-xl"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        />

                        {/* Instructions claires */}
                        <motion.div
                          className="absolute -top-16 sm:-top-20 left-0 right-0 text-center px-2"
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <p className="text-white text-xs sm:text-sm font-black bg-white/20 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-xl border-2 border-white/30 inline-block">
                            📸 Placez la carte de visite dans le cadre
                          </p>
                        </motion.div>

                        {/* Conseils de qualité */}
                        <motion.div
                          className="absolute -bottom-16 sm:-bottom-20 left-0 right-0 text-center px-2"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          <p className="text-white text-xs font-semibold bg-white/20 backdrop-blur-xl px-4 py-2 rounded-xl shadow-xl border-2 border-white/30 inline-block">
                            💡 Bon éclairage et appareil stable
                          </p>
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Phase 3: Indicateurs de qualité en temps réel */}
                    {liveQuality && (
                      <motion.div
                        className="absolute top-4 left-4 right-4 z-20 space-y-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Indicateur général de qualité */}
                        <motion.div
                          className={`px-4 py-2.5 rounded-lg shadow-sm inline-flex items-center gap-2 border ${
                          liveQuality.isGood
                              ? 'bg-green-500 text-white border-green-400'
                              : 'bg-yellow-500 text-white border-yellow-400'
                          }`}
                          animate={{ scale: liveQuality.isGood ? [1, 1.01, 1] : 1 }}
                          transition={{ duration: 2, repeat: liveQuality.isGood ? Infinity : 0 }}
                        >
                          {liveQuality.isGood ? (
                            <>
                              <Check className="w-5 h-5" />
                              <span className="text-xs font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >Qualité excellente - Prêt à scanner</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5" />
                              <span className="text-xs font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >Ajustez l'éclairage ou la netteté</span>
                            </>
                          )}
                        </motion.div>

                        {/* Détails de qualité (mini) */}
                        <div className="flex gap-2">
                          {/* Luminosité */}
                          <motion.div
                            className={`px-3 py-1.5 rounded-lg text-xs font-light border ${
                            liveQuality.brightness >= 0.3 && liveQuality.brightness <= 0.7
                                ? 'bg-green-500 text-white border-green-400'
                                : 'bg-red-500 text-white border-red-400'
                            }`}
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                            whileHover={{ scale: 1.02 }}
                          >
                            {liveQuality.brightness < 0.3 ? '🌑 Trop sombre' :
                             liveQuality.brightness > 0.7 ? '☀️ Trop clair' :
                             '✓ Éclairage OK'}
                          </motion.div>

                          {/* Netteté */}
                          <motion.div
                            className={`px-3 py-1.5 rounded-lg text-xs font-light border ${
                            liveQuality.sharpness > 100
                                ? 'bg-green-500 text-white border-green-400'
                                : 'bg-red-500 text-white border-red-400'
                            }`}
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                            whileHover={{ scale: 1.02 }}
                          >
                            {liveQuality.sharpness > 100 ? '✓ Net' : '⚠️ Flou'}
                          </motion.div>
                          </div>
                      </motion.div>
                    )}

                    {/* Bouton de capture */}
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                      <motion.button
                        onClick={capturePhoto}
                        className="bg-white hover:bg-gray-50 text-gray-900 rounded-full w-20 h-20 sm:w-24 sm:h-24 shadow-lg border-2 border-gray-900 flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="w-10 h-10 sm:w-12 sm:h-12" />
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="w-full h-48 sm:h-64 md:h-80 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-center px-4">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Camera className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-900 font-light text-base sm:text-lg mb-2 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >Scanner une carte de visite</p>
                      <p className="text-gray-500 text-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Positionnez la carte dans le cadre</p>
                    </div>
                  </motion.div>
                )}

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!isScanning ? (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={startCamera}
                        className="w-full sm:w-auto h-12 rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light text-sm sm:text-base"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    >
                        <Camera className="w-5 h-5 mr-2" />
                      Démarrer la caméra
                    </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                        className="w-full sm:w-auto h-12 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm text-sm sm:text-base"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    >
                        <X className="w-5 h-5 mr-2" />
                      Arrêter
                    </Button>
                    </motion.div>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                      className="w-full sm:w-auto h-12 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                  >
                      <Upload className="w-5 h-5 mr-2" />
                    Upload fichier
                  </Button>
                  </motion.div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Prévisualisation de l'image capturée */}
            {showPreview && capturedImage && !isEditing && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
                  <img
                    src={capturedImage}
                    alt="Carte capturée"
                    className="w-full h-48 sm:h-64 md:h-80 object-contain"
                  />
                  <motion.button
                      onClick={() => setShowPreview(false)}
                    className="absolute top-3 right-3 h-10 w-10 rounded-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 flex items-center justify-center shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleCapture}
                      className="w-full sm:w-auto h-12 rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                  >
                      <Sparkles className="w-5 h-5 mr-2" />
                    Analyser avec IA
                  </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                      className="w-full sm:w-auto h-12 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                  >
                      <RotateCcw className="w-5 h-5 mr-2" />
                    Reprendre
                  </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Progression du traitement avec détails */}
            {isProcessing && (
              <motion.div
                className="space-y-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-gray-600" />
                    </motion.div>
                    <motion.span
                      className="absolute text-lg sm:text-xl font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {progress}%
                    </motion.span>
                  </div>
                  <p className="text-gray-900 font-light text-base sm:text-lg mb-2 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {progressMessage || 'Traitement en cours...'}
                  </p>
                  <p className="text-gray-500 text-sm font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {progress < 30 && '📷 Prétraitement de l\'image'}
                    {progress >= 30 && progress < 60 && '🔍 Reconnaissance du texte (OCR)'}
                    {progress >= 60 && progress < 85 && '🤖 Analyse intelligente des données'}
                    {progress >= 85 && progress < 100 && '✅ Validation des informations'}
                    {progress >= 100 && '🎉 Terminé!'}
                  </p>
                </div>
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gray-900 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-xs font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <span className={progress >= 0 ? 'text-gray-900' : ''}>Prétraitement</span>
                    <span className={progress >= 30 ? 'text-gray-900' : ''}>OCR</span>
                    <span className={progress >= 60 ? 'text-gray-900' : ''}>Analyse IA</span>
                    <span className={progress >= 85 ? 'text-gray-900' : ''}>Validation</span>
                </div>
              </div>
              </motion.div>
            )}

            {/* Résultats et édition */}
            {parsingResult && isEditing && (
              <motion.div
                className="space-y-4 sm:space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >Informations extraites</h3>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg shadow-sm">
                    <span className="text-xs sm:text-sm text-white font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Confiance:</span>
                    <span className="text-sm sm:text-base font-light text-white tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {Math.round(parsingResult.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Suggestions */}
                {parsingResult.suggestions.length > 0 && (
                  <motion.div
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-light text-blue-900 mb-1 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >Suggestions:</p>
                        <p className="text-sm font-light text-blue-800"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{parsingResult.suggestions.join(', ')}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Formulaire d'édition */}
                <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Prénom</label>
                    <input
                      type="text"
                      value={editedData.first_name || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Nom</label>
                    <input
                      type="text"
                      value={editedData.last_name || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-xl shadow-lg"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Titre/Poste</label>
                    <input
                      type="text"
                      value={editedData.title || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Entreprise</label>
                    <input
                      type="text"
                      value={editedData.company || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Email</label>
                    <input
                      type="email"
                      value={editedData.email || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    />
                  </div>
                  {editedData.email_alt && (
                    <div>
                        <label className="block text-sm font-light text-gray-700 mb-2"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >Email alternatif</label>
                      <input
                        type="email"
                        value={editedData.email_alt || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, email_alt: e.target.value }))}
                          className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                      />
                    </div>
                  )}
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Téléphone</label>
                    <input
                      type="tel"
                      value={editedData.phone || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    />
                  </div>
                  {editedData.phone_alt && (
                    <div>
                        <label className="block text-sm font-light text-gray-700 mb-2"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >Téléphone alternatif</label>
                      <input
                        type="tel"
                        value={editedData.phone_alt || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, phone_alt: e.target.value }))}
                          className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                      />
                    </div>
                  )}
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Site web</label>
                    <input
                      type="url"
                      value={editedData.website || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-light text-gray-700 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Adresse</label>
                    <input
                      type="text"
                      value={editedData.address || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full h-12 px-4 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                    />
                  </div>
                </div>

                {/* Champ Notes - pleine largeur */}
                  <div className="mt-4 sm:mt-6">
                    <label className="block text-sm font-light text-gray-700 mb-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Notes</label>
                  <textarea
                    value={editedData.notes || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ajouter des notes personnelles sur ce contact..."
                    rows={3}
                      className="w-full px-4 py-3 text-sm bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm resize-none font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                  />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                      className="w-full sm:w-auto h-12 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                  >
                      <RotateCcw className="w-5 h-5 mr-2" />
                    Recommencer
                  </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={saveContact}
                    disabled={isProcessing}
                      className="w-full sm:w-auto h-12 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm text-sm sm:text-base"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                  >
                    {isProcessing ? (
                      <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                          <Check className="w-5 h-5 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Canvas caché pour la capture */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
};

export default CardScanner;
