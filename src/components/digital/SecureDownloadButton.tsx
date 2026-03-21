import React, { useState } from 'react';
import { Download, Lock, Loader2, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecureDownloadService } from '@/services/secureDownloadService';
import { useToast } from '@/hooks/use-toast';

interface SecureDownloadButtonProps {
  downloadToken: string;
  productTitle: string;
  productType?: string;
  applyWatermark?: boolean;
  validateDevice?: boolean;
  className?: string;
}

/**
 * Bouton de téléchargement sécurisé avec DRM et Watermarking
 * Affiche le statut de validation et de téléchargement
 */
const SecureDownloadButton: React.FC<SecureDownloadButtonProps> = ({
  downloadToken,
  productTitle,
  productType = 'pdf',
  applyWatermark = true,
  validateDevice = true,
  className = '',
}) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'validating' | 'downloading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSecureDownload = async () => {
    setIsDownloading(true);
    setDownloadStatus('validating');
    setErrorMessage('');

    try {
      // Validation du token
      const validation = await SecureDownloadService.validateDownloadToken(downloadToken);

      if (!validation.isValid) {
        setDownloadStatus('error');
        setErrorMessage(validation.errorMessage || 'Token invalide');
        toast({
          title: 'Téléchargement refusé',
          description: validation.errorMessage,
          variant: 'destructive',
        });
        return;
      }

      setDownloadStatus('downloading');

      // Téléchargement sécurisé
      await SecureDownloadService.downloadFile(downloadToken, {
        applyWatermark,
        validateDevice,
        trackDownload: true,
      });

      setDownloadStatus('success');
      toast({
        title: 'Téléchargement réussi',
        description: applyWatermark 
          ? 'Le fichier a été téléchargé avec watermark de protection' 
          : 'Le fichier a été téléchargé',
      });

      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3000);

    } catch (error: any) {
      // Error log removed
      setDownloadStatus('error');
      setErrorMessage(error.message);
      toast({
        title: 'Erreur de téléchargement',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton de téléchargement */}
      <Button
        onClick={handleSecureDownload}
        disabled={isDownloading}
        className={`w-full h-14 bg-black hover:bg-gray-800 text-white rounded-2xl font-semibold text-base transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 ${className}`}
      >
        {downloadStatus === 'validating' && (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Validation du téléchargement...
          </>
        )}
        {downloadStatus === 'downloading' && (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Téléchargement en cours...
          </>
        )}
        {downloadStatus === 'success' && (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Téléchargé avec succès !
          </>
        )}
        {(downloadStatus === 'idle' || downloadStatus === 'error') && (
          <>
            <Download className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Télécharger {productTitle}
          </>
        )}
      </Button>

      {/* Badge de protection */}
      {applyWatermark && downloadStatus === 'idle' && (
        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4 text-green-700" />
          <AlertDescription className="text-green-800 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>
                Téléchargement protégé avec watermark personnalisé
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Message d'erreur */}
      {downloadStatus === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Informations de sécurité */}
      {downloadStatus === 'success' && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">Fichier téléchargé et protégé</span>
              </div>
              {applyWatermark && (
                <p className="text-xs">
                  Ce fichier contient un watermark avec vos informations personnelles.
                  Toute redistribution non autorisée est traçable et interdite.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SecureDownloadButton;





















