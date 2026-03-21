import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  Building2,
  Download,
  PenLine
} from 'lucide-react';
import { SignaturePad } from '@/components/quotes/SignaturePad';
import { Button } from '@/components/ui/button';
import { PortfolioService } from '@/services/portfolioService';
import { QuotePdfService } from '@/services/quotePdfService';
import { formatAmount } from '@/utils/format';
import type { QuoteWithItems } from '@/services/portfolio/portfolioQuoteService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const PublicQuoteView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [isResponding, setIsResponding] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [acceptSignatureDialogOpen, setAcceptSignatureDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-quote', token],
    queryFn: () => PortfolioService.getQuoteByPublicToken(token!),
    enabled: !!token
  });

  const handleAcceptClick = () => {
    setAcceptSignatureDialogOpen(true);
  };

  const handleAcceptWithSignature = async (signatureDataUrl: string) => {
    if (!token) return;
    setIsResponding(true);
    try {
      const result = await PortfolioService.respondQuotePublic(token, 'accept', undefined, signatureDataUrl);
      if (result.success) {
        setAcceptSignatureDialogOpen(false);
        refetch();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } finally {
      setIsResponding(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    const { quote, items, card, company, brandColor } = data as QuoteWithItems;
    const q = quote as any;
    const cardData = card || {};
    const companyData = company || {};
    setIsGeneratingPdf(true);
    try {
      const lineItems = items?.map((i) => ({ title: i.title, quantity: i.quantity, unit_price: i.unit_price })) ?? [];
      await QuotePdfService.downloadQuotePDF({
        quote: q,
        items: lineItems.length > 0 ? lineItems : undefined,
        cardOwnerName: cardData.name || companyData.company_name || 'Prestataire',
        cardOwnerEmail: companyData.company_email || cardData.email,
        cardOwnerPhone: companyData.company_phone || cardData.phone,
        cardOwnerAddress: companyData.company_address || cardData.address,
        companyName: companyData.company_name || cardData.company,
        companyLogo: companyData.logo_url || cardData.company_logo_url,
        companySiret: companyData.company_siret,
        companyNif: companyData.company_nif,
        companyVatNumber: companyData.company_vat_number,
        companyAddress: companyData.company_address,
        companyPhone: companyData.company_phone,
        companyEmail: companyData.company_email,
        companyWebsite: companyData.company_website,
        brandColor: brandColor || '#8B5CF6'
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    setIsResponding(true);
    try {
      const result = await PortfolioService.respondQuotePublic(token, 'reject', rejectionReason);
      if (result.success) {
        setRejectDialogOpen(false);
        setRejectionReason('');
        refetch();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } finally {
      setIsResponding(false);
    }
  };

  if (isLoading || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !data?.quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-gray-900 mb-2">Devis introuvable</h1>
          <p className="text-gray-500">Ce lien est invalide ou le devis a été supprimé.</p>
        </div>
      </div>
    );
  }

  const { quote, items } = data as QuoteWithItems;
  const q = quote as any;
  const status = q.status || 'new';
  const canRespond = status === 'quoted';
  const isAccepted = status === 'accepted';
  const isRefused = status === 'refused';
  const isExpired = q.valid_until && new Date(q.valid_until) < new Date();
  const totalFromItems = Array.isArray(items) && items.length > 0
    ? items.reduce((sum: number, i: any) => sum + ((Number(i.quantity) || 1) * (Number(i.unit_price) || 0)), 0)
    : null;
  const totalAmount = totalFromItems ?? Number(q.quote_amount) ?? 0;
  const currency = q.quote_currency || 'FCFA';

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto"
      >
        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête */}
          <div className="bg-gray-900 text-white px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 opacity-90" />
              <h1 className="text-xl md:text-2xl font-light tracking-tight">
                Devis {q.quote_number || '#' + (q.id || '').slice(0, 8)}
              </h1>
            </div>
            <p className="text-gray-300 text-sm">
              Émis le {q.created_at ? new Date(q.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              {q.valid_until && (
                <> • Valide jusqu'au {new Date(q.valid_until).toLocaleDateString('fr-FR')}</>
              )}
            </p>
          </div>

          {/* Contenu */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Client */}
            <div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Destinataire</h2>
              <div className="space-y-2 text-gray-900">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{q.client_name}</span>
                </div>
                {q.client_company && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    {q.client_company}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  {q.client_email}
                </div>
                {q.client_phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    {q.client_phone}
                  </div>
                )}
              </div>
            </div>

            {/* Service demandé */}
            <div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Prestation</h2>
              <p className="text-gray-900">{q.service_requested}</p>
              {q.project_description && (
                <p className="text-gray-600 mt-2 text-sm">{q.project_description}</p>
              )}
            </div>

            {/* Lignes de devis */}
            {Array.isArray(items) && items.length > 0 ? (
              <div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Détail</h2>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-3 font-medium text-gray-700">Description</th>
                        <th className="px-4 py-3 font-medium text-gray-700 text-right">Qté</th>
                        <th className="px-4 py-3 font-medium text-gray-700 text-right">Prix unit.</th>
                        <th className="px-4 py-3 font-medium text-gray-700 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any) => {
                        const qty = Number(item.quantity) || 1;
                        const pu = Number(item.unit_price) || 0;
                        const total = qty * pu;
                        return (
                          <tr key={item.id} className="border-t border-gray-100">
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-900">{item.title}</span>
                              {item.description && <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">{qty}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatAmount(pu)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatAmount(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Conditions de règlement */}
            {q.payment_terms && (
              <div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Conditions de règlement</h2>
                <p className="text-gray-700">{q.payment_terms}</p>
              </div>
            )}

            {/* Délai d'exécution */}
            {q.execution_delay && (
              <div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Délai d'exécution</h2>
                <p className="text-gray-700">{q.execution_delay}</p>
              </div>
            )}

            {/* Notes de proposition */}
            {q.proposal_notes && (
              <div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Détails de la proposition</h2>
                <p className="text-gray-700 whitespace-pre-line">{q.proposal_notes}</p>
              </div>
            )}

            {/* Montant total */}
            <div className="flex justify-end pt-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total TTC</p>
                <p className="text-2xl font-light text-gray-900">{formatAmount(totalAmount)} </p>
              </div>
            </div>

            {/* Statut déjà répondu */}
            {isAccepted && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-900">Devis accepté</p>
                    <p className="text-sm text-green-700">
                      {q.accepted_at ? new Date(q.accepted_at).toLocaleDateString('fr-FR') : ''}
                    </p>
                    {q.client_signature && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={q.client_signature}
                          alt="Signature"
                          className="h-10 border border-gray-200 rounded bg-white"
                        />
                        <span className="text-xs text-green-700">Signature enregistrée</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    variant="outline"
                    className="border-green-300 text-green-800 hover:bg-green-100"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Télécharger le PDF
                  </Button>
                </div>
              </div>
            )}
            {isRefused && (
              <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-xl border border-gray-200">
                <XCircle className="h-8 w-8 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Devis refusé</p>
                  {q.rejection_reason && <p className="text-sm text-gray-600 mt-1">{q.rejection_reason}</p>}
                </div>
              </div>
            )}

            {/* Actions Accepter / Refuser */}
            {canRespond && !isExpired && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleAcceptClick}
                  disabled={isResponding}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Accepter avec signature
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={isResponding}
                  className="flex-1 border-gray-300"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </div>
            )}
            {canRespond && isExpired && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
                Ce devis a expiré. Contactez le prestataire pour une nouvelle proposition.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal Signature électronique */}
      <Dialog open={acceptSignatureDialogOpen} onOpenChange={setAcceptSignatureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Signer pour accepter le devis</DialogTitle>
            <DialogDescription>
              Signez ci-dessous pour valider votre acceptation du devis. Cette signature sera enregistrée et figurera sur le document.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SignaturePad
              onConfirm={handleAcceptWithSignature}
              onCancel={() => setAcceptSignatureDialogOpen(false)}
              disabled={isResponding}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Refus */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le devis</DialogTitle>
            <DialogDescription>
              Indiquez éventuellement la raison de votre refus (optionnel).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection_reason">Raison du refus</Label>
            <Textarea
              id="rejection_reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Budget insuffisant, délais non conformes..."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isResponding}>
              {isResponding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicQuoteView;
