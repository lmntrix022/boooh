import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download as DownloadIcon, Lock, AlertTriangle, CheckCircle2, Clock, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface TokenValidation {
  isValid: boolean;
  inquiry?: any;
  product?: any;
  error?: string;
  downloadsRemaining?: number;
}

export default function Download() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setValidation({ isValid: false, error: 'Token manquant' });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Chercher l'inquiry avec ce token
      const { data: inquiry, error: inquiryError } = await supabase
        .from('digital_inquiries')
        .select(`
          *,
          digital_product:digital_products(*)
        `)
        .eq('download_token', token)
        .single();

      if (inquiryError || !inquiry) {
        setValidation({ isValid: false, error: 'Token invalide ou expiré' });
        setIsLoading(false);
        return;
      }

      // 2. Vérifier l'expiration
      if (inquiry.expires_at && new Date(inquiry.expires_at) < new Date()) {
        setValidation({ isValid: false, error: 'Ce lien a expiré' });
        setIsLoading(false);
        return;
      }

      // 3. Vérifier le nombre de téléchargements
      const downloadsRemaining = (inquiry.max_downloads || 3) - (inquiry.download_count || 0);
      if (downloadsRemaining <= 0) {
        setValidation({ isValid: false, error: 'Limite de téléchargements atteinte' });
        setIsLoading(false);
        return;
      }

      setValidation({
        isValid: true,
        inquiry,
        product: inquiry.digital_product,
        downloadsRemaining,
      });
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({ isValid: false, error: 'Erreur de validation' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!validation?.isValid || !validation.product || !token) return;

    setIsDownloading(true);

    try {
      // Appeler l'Edge Function via fetch pour gérer le fichier binaire

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/download-digital-product`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ token }),
      });


      if (!response.ok) {
        // Essayer de lire le message d'erreur JSON
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          console.error('❌ Error from Edge Function:', errorData);
          throw new Error(errorData.error || 'Erreur de téléchargement');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Vérifier si c'est une redirection vers URL signée
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonData = await response.json();
        if (jsonData.redirect && jsonData.signed_url) {
          const a = document.createElement('a');
          a.href = jsonData.signed_url;
          a.download = validation.product.name || 'download';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      }

      // C'est un fichier binaire
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = validation.product.name || 'download.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);


      // Revalider le token pour mettre à jour l'affichage (compteur mis à jour par l'Edge Function)
      await validateToken();

    } catch (error: any) {
      console.error('Download error:', error);
      alert(`Erreur de téléchargement: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (!validation?.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Lien Invalide
            </h1>
            <p className="text-gray-600 mb-8">
              {validation?.error || 'Ce lien de téléchargement n\'est pas valide.'}
            </p>
            <Button
              onClick={() => navigate('/')}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const { product, downloadsRemaining, inquiry } = validation;
  const expiresAt = inquiry.expires_at ? new Date(inquiry.expires_at) : null;
  const timeRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
              <FileDown className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">
            Téléchargement Sécurisé
          </h1>
          <p className="text-center text-blue-100">
            Votre fichier est prêt
          </p>
        </div>

        {/* Contenu */}
        <div className="p-8">
          {/* Informations produit */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>
            {product.description && (
              <p className="text-gray-600 mb-4">{product.description}</p>
            )}
            {product.price && (
              <p className="text-lg font-semibold text-green-600">
                {product.price} FCFA
              </p>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">Téléchargements restants</p>
                  <p className="text-2xl font-bold text-green-900">{downloadsRemaining}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Expire dans</p>
                  <p className="text-2xl font-bold text-blue-900">{timeRemaining}h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sécurité DRM */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">
                  🔐 Protection DRM Active
                </h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>✓ Lien unique et sécurisé (256 bits)</li>
                  <li>✓ Expiration automatique après {timeRemaining} heures</li>
                  <li>✓ Maximum {inquiry.max_downloads || 3} téléchargements</li>
                  <li>✓ Traçabilité complète</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bouton de téléchargement */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading || (downloadsRemaining || 0) <= 0}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Téléchargement en cours...
              </>
            ) : (
              <>
                <DownloadIcon className="w-5 h-5 mr-3" />
                Télécharger le fichier
              </>
            )}
          </Button>

          {/* Informations client */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Commande pour : <span className="font-medium text-gray-700">{inquiry.client_email}</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
