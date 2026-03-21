import React, { useState } from 'react';
import { CheckCircle, Calendar } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Invoice } from '@/services/invoiceService';

interface MarkAsPaidDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentDate: string) => void;
}

export const MarkAsPaidDialog: React.FC<MarkAsPaidDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleConfirm = () => {
    onConfirm(paymentDate);
    onOpenChange(false);
  };

  if (!invoice) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-sm rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 gray-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-green-900">
              Marquer comme payée
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="text-gray-700">
              <p className="mb-4">
                Confirmer le paiement de la facture{' '}
                <strong>{invoice.invoice_number}</strong> pour un montant de{' '}
                <strong className="text-green-700">
                  {invoice.total_ttc.toLocaleString('fr-FR')} FCFA
                </strong>
              </p>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <div className="font-semibold mb-2">Informations client :</div>
                    <div className="space-y-1">
                      <div>
                        <strong>Nom :</strong> {invoice.client_name}
                      </div>
                      {invoice.client_email && (
                        <div>
                          <strong>Email :</strong> {invoice.client_email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date" className="text-sm font-medium">
                  Date de paiement
                </Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="rounded-lg border-green-200 focus:border-green-400"
                />
                <p className="text-xs text-gray-700">
                  La date ne peut pas être dans le futur
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="glass border border-gray-200/50 text-gray-900 hover:bg-white/80 shadow hover:shadow-md transition-all duration-300 rounded-lg">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-gray-900 gray-600 hover:gray-600 hover:to-emerald-600 text-white shadow-md hover:shadow-md transition-all duration-300 rounded-lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmer le paiement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
