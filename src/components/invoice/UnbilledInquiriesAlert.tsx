import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Zap,
  FileText,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useInquiryInvoiceSync } from '@/hooks/useInquiryInvoiceSync';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnbilledInquiriesAlertProps {
  onInvoicesGenerated?: () => void;
}

export const UnbilledInquiriesAlert: React.FC<UnbilledInquiriesAlertProps> = ({
  onInvoicesGenerated,
}) => {
  const { unbilledCount, autoGenerating, autoGenerateInvoices, checkUnbilledInquiries } =
    useInquiryInvoiceSync();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleAutoGenerate = async () => {
    setShowDialog(false);

    const results = await autoGenerateInvoices();

    if (results.success > 0) {
      toast({
        title: 'Factures générées avec succès',
        description: `${results.success} facture${results.success > 1 ? 's' : ''} générée${results.success > 1 ? 's' : ''} automatiquement.`,
      });

      // Recharger les données
      await checkUnbilledInquiries();
      onInvoicesGenerated?.();
    }

    if (results.errors > 0) {
      toast({
        title: 'Erreurs lors de la génération',
        description: `${results.errors} erreur${results.errors > 1 ? 's' : ''} lors de la génération.`,
        variant: 'destructive',
      });
    }
  };

  // Ne rien afficher si pas de demandes ou si dismissed
  if (unbilledCount === 0 || dismissed) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-gray-900" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">
                      Demandes en attente de facturation
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-gray-900 text-white font-bold text-sm">
                      {unbilledCount}
                    </span>
                  </div>

                  <Alert className="mb-3 border-gray-200/50 bg-gray-50">
                    <FileText className="w-4 h-4 text-gray-900" />
                    <AlertDescription className="text-gray-700">
                      Vous avez <strong>{unbilledCount}</strong> demande
                      {unbilledCount > 1 ? 's' : ''} avec le statut{' '}
                      <strong>"completed"</strong> qui {unbilledCount > 1 ? 'ne sont' : "n'est"} pas
                      encore facturée{unbilledCount > 1 ? 's' : ''}.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setShowDialog(true)}
                      disabled={autoGenerating}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-bold shadow-sm"
                    >
                      {autoGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Générer toutes les factures automatiquement
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setDismissed(true)}
                      className="border-gray-200/50 text-gray-900 hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Masquer
                    </Button>
                  </div>

                  <p className="text-xs text-gray-600 mt-2">
                    💡 Astuce : Les factures seront générées avec les prix actuels des produits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Dialog de confirmation */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-md rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-gray-900" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                Génération automatique de factures
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-gray-700">
                <p className="mb-4">
                  Cette action va générer <strong>{unbilledCount}</strong> facture
                  {unbilledCount > 1 ? 's' : ''} automatiquement pour toutes les demandes
                  "completed" non facturées.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/50">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <div className="font-semibold mb-1">Ce qui sera fait :</div>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Informations client pré-remplies</li>
                        <li>Prix récupérés depuis les produits</li>
                        <li>Calculs HT/TVA/TTC automatiques</li>
                        <li>Numéros de facture auto-générés</li>
                        <li>Liaison inquiry ↔ facture créée</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-gray-200/50 text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 rounded-lg">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAutoGenerate}
              className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-300 rounded-lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Générer {unbilledCount} facture{unbilledCount > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
