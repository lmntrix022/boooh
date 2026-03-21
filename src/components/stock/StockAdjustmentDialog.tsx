import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  cardId: string;
  productName: string;
  currentStock: number;
  onSuccess?: () => void;
}

const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({
  open,
  onOpenChange,
  productId,
  cardId,
  productName,
  currentStock,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Raisons prédéfinies pour les ajustements
  const getAdjustmentReasons = () => [
    { value: 'damage', label: t('stock.adjustmentDialog.reasons.damage.label'), description: t('stock.adjustmentDialog.reasons.damage.description') },
    { value: 'loss', label: t('stock.adjustmentDialog.reasons.loss.label'), description: t('stock.adjustmentDialog.reasons.loss.description') },
    { value: 'inventory', label: t('stock.adjustmentDialog.reasons.inventory.label'), description: t('stock.adjustmentDialog.reasons.inventory.description') },
    { value: 'return', label: t('stock.adjustmentDialog.reasons.return.label'), description: t('stock.adjustmentDialog.reasons.return.description') },
    { value: 'expired', label: t('stock.adjustmentDialog.reasons.expired.label'), description: t('stock.adjustmentDialog.reasons.expired.description') },
    { value: 'correction', label: t('stock.adjustmentDialog.reasons.correction.label'), description: t('stock.adjustmentDialog.reasons.correction.description') },
    { value: 'other', label: t('stock.adjustmentDialog.reasons.other.label'), description: t('stock.adjustmentDialog.reasons.other.description') },
  ];
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculer le nouveau stock
  const calculateNewStock = (): number => {
    const qty = parseInt(quantity) || 0;
    switch (adjustmentType) {
      case 'add':
        return currentStock + qty;
      case 'remove':
        return Math.max(0, currentStock - qty);
      case 'set':
        return Math.max(0, qty);
      default:
        return currentStock;
    }
  };

  const newStock = calculateNewStock();
  const stockDifference = newStock - currentStock;

  // Réinitialiser le formulaire
  const resetForm = () => {
    setAdjustmentType('add');
    setQuantity('');
    setReason('');
    setNotes('');
    setReference('');
  };

  // Soumettre l'ajustement
  const handleSubmit = async () => {
    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: t('stock.adjustmentDialog.errors.invalidQuantity.title'),
        description: t('stock.adjustmentDialog.errors.invalidQuantity.description'),
        variant: 'destructive'
      });
      return;
    }

    if (!reason) {
      toast({
        title: t('stock.adjustmentDialog.errors.noReason.title'),
        description: t('stock.adjustmentDialog.errors.noReason.description'),
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Déterminer le type de mouvement
      let movementType: 'purchase' | 'sale' | 'adjustment';
      let movementQuantity: number;

      if (adjustmentType === 'add') {
        movementType = 'purchase';
        movementQuantity = parseInt(quantity);
      } else if (adjustmentType === 'remove') {
        movementType = 'sale';
        movementQuantity = -parseInt(quantity);
      } else {
        // Pour 'set', c'est un ajustement direct
        movementType = 'adjustment';
        movementQuantity = stockDifference;
      }

      // Créer le mouvement de stock
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          card_id: cardId,
          movement_type: movementType,
          quantity: movementQuantity,
          stock_before: currentStock,
          stock_after: newStock,
          reason: reason,
          reference_id: reference || null,
          reference_type: adjustmentType === 'set' ? 'manual_adjustment' : null,
          notes: notes || null,
          operator_id: user?.id || null
        });

      if (movementError) throw movementError;

      // Mettre à jour le stock du produit
      const { error: stockError } = await supabase
        .from('product_stock')
        .upsert({
          product_id: productId,
          card_id: cardId,
          current_stock: newStock
        }, {
          onConflict: 'product_id,card_id'
        });

      if (stockError) throw stockError;

      toast({
        title: t('stock.adjustmentDialog.success.title'),
        description: t('stock.adjustmentDialog.success.description', { current: currentStock, new: newStock }),
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();

    } catch (error) {
      // Error log removed
      toast({
        title: t('stock.adjustmentDialog.errors.error.title'),
        description: t('stock.adjustmentDialog.errors.error.description'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Package className="h-5 w-5" />
            {t('stock.adjustmentDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('stock.adjustmentDialog.product')} <strong className="text-gray-900">{productName}</strong> | {t('stock.adjustmentDialog.currentStock')} <strong className="text-gray-900">{currentStock}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type d'ajustement */}
          <div className="space-y-2">
            <Label className="text-gray-900">{t('stock.adjustmentDialog.adjustmentType')}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('add')}
                className={adjustmentType === 'add' ? 'gap-2 bg-gray-900 text-white hover:bg-gray-800' : 'gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}
              >
                <ArrowUpCircle className="h-4 w-4" />
                {t('stock.adjustmentDialog.add')}
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('remove')}
                className={adjustmentType === 'remove' ? 'gap-2 bg-gray-900 text-white hover:bg-gray-800' : 'gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}
              >
                <ArrowDownCircle className="h-4 w-4" />
                {t('stock.adjustmentDialog.remove')}
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'set' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('set')}
                className={adjustmentType === 'set' ? 'gap-2 bg-gray-900 text-white hover:bg-gray-800' : 'gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}
              >
                <Package className="h-4 w-4" />
                {t('stock.adjustmentDialog.set')}
              </Button>
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-gray-900">
              {adjustmentType === 'set' ? t('stock.adjustmentDialog.newStockTotal') : t('stock.adjustmentDialog.quantity')}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={adjustmentType === 'set' ? t('stock.adjustmentDialog.stockTotalPlaceholder') : t('stock.adjustmentDialog.quantityPlaceholder')}
              className="bg-white text-gray-900 border-gray-300"
            />
            {quantity && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={stockDifference >= 0 ? 'default' : 'destructive'}>
                  {stockDifference > 0 ? `+${stockDifference}` : stockDifference}
                </Badge>
                <span className="text-gray-600">
                  {t('stock.adjustmentDialog.newStock')} <strong className="text-gray-900">{newStock}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Raison */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-900">{t('stock.adjustmentDialog.reason')}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className="bg-white text-gray-900 border-gray-300">
                <SelectValue placeholder={t('stock.adjustmentDialog.reasonPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {getAdjustmentReasons().map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-gray-900">
                    <div>
                      <div className="font-medium text-gray-900">{r.label}</div>
                      <div className="text-xs text-gray-500">{r.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Référence */}
          <div className="space-y-2">
            <Label htmlFor="reference" className="text-gray-900">{t('stock.adjustmentDialog.reference')}</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('stock.adjustmentDialog.referencePlaceholder')}
              className="bg-white text-gray-900 border-gray-300"
            />
            <p className="text-xs text-gray-500">
              {t('stock.adjustmentDialog.referenceHelp')}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-900">{t('stock.adjustmentDialog.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('stock.adjustmentDialog.notesPlaceholder')}
              rows={3}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>

          {/* Avertissement */}
          {newStock < currentStock && (
            <div className="flex items-start gap-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-900">
                <strong>{t('stock.adjustmentDialog.warning')}</strong> {t('stock.adjustmentDialog.warningMessage', { current: currentStock, new: newStock })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
            className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
          >
            {t('stock.adjustmentDialog.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !quantity || !reason}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            {isSubmitting ? t('stock.adjustmentDialog.saving') : t('stock.adjustmentDialog.validate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
