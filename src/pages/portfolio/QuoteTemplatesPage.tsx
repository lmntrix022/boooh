import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2, Loader2, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { QuoteTemplateService, QuoteTemplateWithItems } from '@/services/portfolio/quoteTemplateService';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

export const QuoteTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', items: [{ title: '', quantity: 1, unit_price: 0 }] });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['quote-templates', user?.id],
    queryFn: () => (user?.id ? QuoteTemplateService.getTemplates(user.id) : []),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; items: { title: string; quantity: number; unit_price: number }[] }) =>
      user?.id ? QuoteTemplateService.createTemplate(user.id, { ...data, items: data.items.filter(i => i.title.trim()) }) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
      toast({ title: t('portfolio.quoteTemplates.created') || 'Modèle créé', description: t('portfolio.quoteTemplates.createdDesc') || 'Le modèle a été enregistré.' });
      setIsCreateOpen(false);
      setNewTemplate({ name: '', description: '', items: [{ title: '', quantity: 1, unit_price: 0 }] });
    },
    onError: () => toast({ title: t('portfolio.quoteTemplates.error') || 'Erreur', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => user?.id ? QuoteTemplateService.deleteTemplate(id, user.id) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-templates'] });
      toast({ title: t('portfolio.quoteTemplates.deleted') || 'Modèle supprimé' });
    },
    onError: () => toast({ title: t('portfolio.quoteTemplates.error') || 'Erreur', variant: 'destructive' }),
  });

  const handleCreate = () => {
    if (!newTemplate.name.trim()) {
      toast({ title: t('portfolio.quoteTemplates.nameRequired') || 'Nom requis', variant: 'destructive' });
      return;
    }
    const validItems = newTemplate.items.filter(i => i.title.trim() && i.unit_price >= 0);
    if (validItems.length === 0) {
      toast({ title: t('portfolio.quoteTemplates.itemsRequired') || 'Ajoutez au moins une ligne', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim() || undefined,
      items: validItems,
    });
  };

  const addItem = () => setNewTemplate(prev => ({ ...prev, items: [...prev.items, { title: '', quantity: 1, unit_price: 0 }] }));
  const removeItem = (i: number) => setNewTemplate(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: 'title' | 'quantity' | 'unit_price', value: string | number) => {
    setNewTemplate(prev => ({
      ...prev,
      items: prev.items.map((it, idx) => idx === i ? { ...it, [field]: value } : it),
    }));
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate('/portfolio/quotes')} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('portfolio.quotesList.title')}
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-gray-900">{t('portfolio.quoteTemplates.title') || 'Modèles de devis'}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('portfolio.quoteTemplates.subtitle') || 'Créez des modèles réutilisables pour répondre plus vite.'}</p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('portfolio.quoteTemplates.new') || 'Nouveau modèle'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">{t('portfolio.quoteTemplates.empty') || 'Aucun modèle. Créez-en un pour gagner du temps.'}</p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('portfolio.quoteTemplates.new') || 'Nouveau modèle'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {templates.map((t: QuoteTemplateWithItems) => (
              <Card key={t.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{t.name}</CardTitle>
                    {t.description && <CardDescription>{t.description}</CardDescription>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(t.id)} disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-1">
                    {t.items.map((it, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{it.title} × {it.quantity}</span>
                        <span>{((it.quantity || 1) * (it.unit_price || 0)).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-medium text-gray-900">
                    Total : {QuoteTemplateService.getTemplateTotal(t.items).toLocaleString()} FCFA
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg mx-4 sm:mx-auto portfolio-modal-fix rounded-2xl border border-gray-200 shadow-lg bg-white">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-semibold text-gray-900 tracking-tight">
                {t('portfolio.quoteTemplates.createTitle') || 'Nouveau modèle'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                {t('portfolio.quoteTemplates.createDesc') || 'Ajoutez des lignes réutilisables pour vos devis.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('portfolio.quoteTemplates.nameLabel') || 'Nom du modèle'}</Label>
                <Input
                  value={newTemplate.name}
                  onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Forfait développement web"
                  className="border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('portfolio.quoteTemplates.itemsLabel') || 'Lignes'}</Label>
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  {newTemplate.items.map((it, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        placeholder="Description"
                        value={it.title}
                        onChange={e => updateItem(i, 'title', e.target.value)}
                        className="flex-1 border-gray-200 bg-white"
                      />
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        placeholder="Qté"
                        value={it.quantity}
                        onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 border-gray-200 bg-white"
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="PU"
                        value={it.unit_price || ''}
                        onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-24 border-gray-200 bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(i)}
                        disabled={newTemplate.items.length === 1}
                        className="shrink-0 border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="w-full border-gray-200 border-dashed hover:border-gray-300 hover:bg-gray-100"
                  >
                    {t('portfolio.quoteTemplates.addLine') || 'Ajouter une ligne'}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-row gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              >
                {t('portfolio.quotesList.dialog.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-gray-900 hover:bg-gray-800 text-white border-0"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('portfolio.quoteTemplates.save') || 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default QuoteTemplatesPage;
