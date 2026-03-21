import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

type Payment = {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  payment_method: 'mobile_money' | 'bank_transfer' | 'cash';
  transaction_reference: string | null;
  payer_phone: string | null;
  payer_name: string;
  payment_proof_url: string | null;
  admin_notes: string | null;
  created_at: string;
  user: {
    email: string;
  };
};

export default function PaymentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, currentLanguage } = useLanguage();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Récupérer tous les paiements
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_history')
        .select(`
          *,
          subscription:subscriptions(
            user:user_id(
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  // Mutation pour confirmer un paiement
  const confirmPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', selectedPayment?.subscription_id);

      if (subscriptionError) throw subscriptionError;

      const { error: paymentError } = await supabase
        .from('payment_history')
        .update({
          status: 'confirmed',
          admin_notes: adminNotes,
          confirmed_at: new Date().toISOString(),
          confirmed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast({
        title: t('admin.paymentManager.success'),
        description: t('admin.paymentManager.paymentConfirmed'),
      });
      setSelectedPayment(null);
    },
    onError: (error) => {
      // Error log removed
      toast({
        title: t('admin.errors.error'),
        description: t('admin.paymentManager.confirmationError'),
        variant: 'destructive',
      });
    },
  });

  // Mutation pour rejeter un paiement
  const rejectPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error: paymentError } = await supabase
        .from('payment_history')
        .update({
          status: 'failed',
          admin_notes: adminNotes,
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast({
        title: t('admin.paymentManager.paymentRejected'),
        description: t('admin.paymentManager.paymentRejectedDescription'),
      });
      setSelectedPayment(null);
    },
    onError: (error) => {
      // Error log removed
      toast({
        title: t('admin.errors.error'),
        description: t('admin.paymentManager.rejectionError'),
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: Payment['status']) => {
    const variants: Record<Payment['status'], 'default' | 'destructive' | 'outline' | 'secondary'> = {
      pending: 'secondary',
      confirmed: 'default',
      failed: 'destructive',
      refunded: 'outline',
    };
    const labels = {
      pending: t('admin.paymentManager.statuses.pending'),
      confirmed: t('admin.paymentManager.statuses.confirmed'),
      failed: t('admin.paymentManager.statuses.failed'),
      refunded: t('admin.paymentManager.statuses.refunded'),
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">{t('admin.paymentManager.title')}</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.paymentManager.date')}</TableHead>
              <TableHead>{t('admin.paymentManager.client')}</TableHead>
              <TableHead>{t('admin.paymentManager.amount')}</TableHead>
              <TableHead>{t('admin.paymentManager.method')}</TableHead>
              <TableHead>{t('admin.paymentManager.status')}</TableHead>
              <TableHead>{t('admin.paymentManager.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {format(new Date(payment.created_at), 'Pp', { locale: currentLanguage === 'fr' ? fr : enUS })}
                </TableCell>
                <TableCell>
                  <div>
                    <div>{payment.payer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {payment.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {payment.amount.toLocaleString()} {payment.currency}
                </TableCell>
                <TableCell className="capitalize">
                  {payment.payment_method.replace('_', ' ')}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>
                  {payment.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      {t('admin.paymentManager.verify')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('admin.paymentManager.verifyDialog.title')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <p className="font-medium">{t('admin.paymentManager.verifyDialog.paymentDetails')}</p>
              <ul className="text-sm">
                <li>{t('admin.paymentManager.verifyDialog.client')} : {selectedPayment?.payer_name}</li>
                <li>{t('admin.paymentManager.verifyDialog.amount')} : {selectedPayment?.amount.toLocaleString()} {selectedPayment?.currency}</li>
                <li>{t('admin.paymentManager.verifyDialog.method')} : {selectedPayment?.payment_method.replace('_', ' ')}</li>
                {selectedPayment?.payer_phone && (
                  <li>{t('admin.paymentManager.verifyDialog.phone')} : {selectedPayment.payer_phone}</li>
                )}
                {selectedPayment?.transaction_reference && (
                  <li>{t('admin.paymentManager.verifyDialog.reference')} : {selectedPayment.transaction_reference}</li>
                )}
              </ul>
            </div>

            {selectedPayment?.payment_proof_url && (
              <div className="grid gap-2">
                <p className="font-medium">{t('admin.paymentManager.verifyDialog.proof')}</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${selectedPayment.payment_proof_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('admin.paymentManager.verifyDialog.viewProof')}
                </a>
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="notes" className="font-medium">
                {t('admin.paymentManager.verifyDialog.adminNotes')}
              </label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('admin.paymentManager.verifyDialog.notesPlaceholder')}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => rejectPayment.mutate(selectedPayment!.id)}
              disabled={rejectPayment.isPending}
            >
              {t('admin.paymentManager.verifyDialog.reject')}
            </Button>
            <Button
              onClick={() => confirmPayment.mutate(selectedPayment!.id)}
              disabled={confirmPayment.isPending}
            >
              {t('admin.paymentManager.verifyDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 