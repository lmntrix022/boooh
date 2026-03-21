import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Send } from 'lucide-react';
import { formatAmount } from '@/utils/format';
import { Invoice, InvoiceSettings } from '@/services/invoiceService';
import { generateInvoiceQrDataUrl } from '@/services/invoiceQrCodeService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoicePreviewDialogProps {
  invoice: Invoice | null;
  settings: InvoiceSettings | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGeneratePdf?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
}

/** QR Code de facturation DGI (génération asynchrone) */
const InvoiceQrPreview: React.FC<{ invoice: Invoice; settings: InvoiceSettings | null }> = ({ invoice, settings }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    generateInvoiceQrDataUrl(invoice, settings, { size: 140, margin: 1 }).then(setQrDataUrl);
  }, [invoice, settings]);
  if (!qrDataUrl) return null;
  return (
    <div className="flex flex-col items-center shrink-0">
      <img src={qrDataUrl} alt="QR Code facture DGI" className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded border border-gray-200" />
      <p className="text-[10px] text-gray-500 mt-1">Empreinte unique</p>
    </div>
  );
};

export const InvoicePreviewDialog: React.FC<InvoicePreviewDialogProps> = ({
  invoice,
  settings,
  open,
  onOpenChange,
  onGeneratePdf,
  onSend,
}) => {
  if (!invoice) return null;

  const items = invoice.items || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-screen sm:h-auto max-h-[95vh] mx-auto p-3 sm:p-6 overflow-y-auto bg-white border border-gray-200 shadow-sm">
        <DialogHeader className="border-b pb-3 sm:pb-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-light tracking-tight text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              Prévisualisation de la facture
            </DialogTitle>
            <div className="flex gap-2 flex-wrap">
              {onGeneratePdf && (
                <Button
                  onClick={() => onGeneratePdf(invoice)}
                  variant="outline"
                  size="sm"
                  className="border border-gray-200 text-gray-900 hover:bg-gray-50 text-xs sm:text-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Télécharger PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              )}
              {onSend && invoice.client_email && (
                <Button
                  onClick={() => onSend(invoice)}
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Envoyer</span>
                  <span className="sm:hidden">Envoy</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-8 bg-white rounded-lg border border-gray-200 shadow-md"
        >
          {/* Header de la facture */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:justify-between sm:items-start mb-8">
            {/* Informations de l'entreprise */}
            <div className="flex-1">
              {settings?.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-12 sm:h-16 w-auto mb-3 sm:mb-4 object-contain"
                />
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {settings?.company_name || 'Votre Entreprise'}
              </h1>
              {settings?.company_address && (
                <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-line">
                  {settings.company_address}
                </p>
              )}
              {settings?.company_phone && (
                <p className="text-xs sm:text-sm text-gray-900">Tél: {settings.company_phone}</p>
              )}
              {settings?.company_email && (
                <p className="text-xs sm:text-sm text-gray-900">Email: {settings.company_email}</p>
              )}
              {settings?.company_siret && (
                <p className="text-xs sm:text-sm text-gray-900">RCCM: {settings.company_siret}</p>
              )}
              {settings?.company_nif && (
                <p className="text-xs sm:text-sm text-gray-900">NIF: {settings.company_nif}</p>
              )}
              {settings?.company_vat_number && (
                <p className="text-xs sm:text-sm text-gray-900">N° TVA: {settings.company_vat_number}</p>
              )}
            </div>

            {/* Informations de la facture */}
            <div className="text-left sm:text-right">
              <div className="inline-block bg-gray-900 gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-semibold">FACTURE</p>
                <p className="text-xl sm:text-2xl font-bold">{invoice.invoice_number}</p>
              </div>
              <div className="text-xs sm:text-sm text-gray-900 space-y-1">
                <p>
                  <span className="font-semibold">Date d'émission:</span>{' '}
                  {format(new Date(invoice.issue_date), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p>
                  <span className="font-semibold">Date d'échéance:</span>{' '}
                  {format(new Date(invoice.due_date), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p>
                  <span className="font-semibold">Statut:</span>{' '}
                  <span
                    className="inline-block px-2 py-1 rounded text-xs font-light bg-gray-100 text-gray-700 border border-gray-200"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {invoice.status === 'paid'
                      ? 'Payée'
                      : invoice.status === 'sent'
                      ? 'Envoyée'
                      : invoice.status === 'overdue'
                      ? 'En retard'
                      : invoice.status === 'cancelled'
                      ? 'Annulée'
                      : 'Brouillon'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Informations du client */}
          <div className="mb-8 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">FACTURÉ À</p>
            <p className="font-bold text-sm sm:text-base text-gray-800">{invoice.client_name}</p>
            {invoice.client_address && (
              <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-line">{invoice.client_address}</p>
            )}
            {invoice.client_email && <p className="text-xs sm:text-sm text-gray-900">{invoice.client_email}</p>}
            {invoice.client_phone && <p className="text-xs sm:text-sm text-gray-900">{invoice.client_phone}</p>}
            {invoice.client_nif && (
              <p className="text-xs sm:text-sm text-gray-900">NIF: {invoice.client_nif}</p>
            )}
          </div>

          {/* Tableau des articles - Responsive */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-900 gray-600 text-white">
                  <th className="text-left p-2 sm:p-3 font-semibold">Description</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">Qty</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">Prix</th>
                  <th className="text-right p-2 sm:p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-2 sm:p-3">
                      <p className="font-medium text-gray-800">{item.description}</p>
                    </td>
                    <td className="text-right p-2 sm:p-3 text-gray-700">{item.quantity}</td>
                    <td className="text-right p-2 sm:p-3 text-gray-700">
                      {item.unit_price_ht.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="text-right p-2 sm:p-3 font-medium text-gray-800">
                      {item.total_ht.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux + QR Code DGI */}
          <div className="flex flex-col sm:flex-row justify-end items-end gap-6 mb-8">
            <InvoiceQrPreview invoice={invoice} settings={settings} />
            <div className="w-full sm:w-80">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-900">
                  <span>Total HT:</span>
                  <span className="font-medium">{formatAmount(invoice.total_ht)}</span>
                </div>
                {invoice.total_vat > 0 && (
                  <div className="flex justify-between text-gray-900">
                    <span>TVA ({invoice.vat_rate}%):</span>
                    <span className="font-medium text-gray-900">{formatAmount(invoice.total_vat)}</span>
                  </div>
                )}
                {invoice.total_tps && invoice.total_tps !== 0 && (
                  <div className="flex justify-between text-gray-900">
                    <span>TPS (-9,5%):</span>
                    <span className="font-medium text-gray-900">{formatAmount(invoice.total_tps)}</span>
                  </div>
                )}
                {invoice.total_css && invoice.total_css !== 0 && (
                  <div className="flex justify-between text-gray-900">
                    <span>CSS (1%):</span>
                    <span className="font-medium text-gray-900">{formatAmount(invoice.total_css)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                  <span className="text-base sm:text-lg font-bold text-gray-800">Total TTC:</span>
                  <span className="text-lg sm:text-2xl font-bold bg-gray-900 gray-600 bg-clip-text text-transparent">
                    {formatAmount(invoice.total_ttc)}
                  </span>
                </div>
                {invoice.total_tps && invoice.total_tps !== 0 && (
                  <div className="text-xs text-gray-700 italic pt-2">
                    * TPS (-9,5%) : Services
                  </div>
                )}
                {invoice.total_vat > 0 && (
                  <div className="text-xs text-gray-700 italic">
                    * TVA : Produits
                  </div>
                )}
                {invoice.total_css && invoice.total_css > 0 && (
                  <div className="text-xs text-gray-700 italic">
                    * CSS (1%) : Solidarité Sociale
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6 bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700 mb-2">NOTES</p>
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Mentions légales */}
          {settings?.legal_mentions && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">MENTIONS LÉGALES</p>
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">{settings.legal_mentions}</p>
            </div>
          )}

          {/* Coordonnées bancaires */}
          {settings?.bank_details && (
            <div className="mt-4 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">COORDONNÉES BANCAIRES</p>
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">{settings.bank_details}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-700">
            <p>Merci pour votre confiance</p>
            {settings?.company_name && <p className="mt-1">{settings.company_name}</p>}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
