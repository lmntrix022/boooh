import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  Download,
  Send,
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Invoice, InvoiceItem, InvoiceService } from '@/services/invoiceService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceFormProps {
  invoice: Invoice | null;
  defaultVatRate: number;
  taxRegime?: 'tva_css' | 'css_only' | 'precompte';
  applyCss?: boolean;
  onBack: () => void;
  onSave: (invoice: Invoice) => void;
  onGeneratePdf: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  defaultVatRate,
  taxRegime = 'tva_css',
  applyCss = true,
  onBack,
  onSave,
  onGeneratePdf,
  onSend,
}) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_address: '',
    client_phone: '',
    client_nif: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_method: '',
    notes: '',
    vat_rate: defaultVatRate,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: '',
      quantity: 1,
      unit_price_ht: 0,
      vat_rate: defaultVatRate,
      total_ht: 0,
      total_vat: 0,
      total_ttc: 0,
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [unbilledInquiries, setUnbilledInquiries] = useState<any[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const { user } = useAuth();

  // Charger les demandes (inquiries) non facturées
  useEffect(() => {
    const loadInquiries = async () => {
      if (!user?.id || invoice) return; // Ne charger que pour les nouvelles factures

      setLoadingInquiries(true);
      try {
        const inquiries = await InvoiceService.getUnbilledInquiries(user.id);
        setUnbilledInquiries(inquiries);
      } catch (error) {
        // Error log removed
      } finally {
        setLoadingInquiries(false);
      }
    };

    loadInquiries();
  }, [user?.id, invoice]);

  // Charger les données de la facture si en mode édition
  useEffect(() => {
    if (invoice) {
      setFormData({
        client_name: invoice.client_name,
        client_email: invoice.client_email || '',
        client_address: invoice.client_address || '',
        client_phone: invoice.client_phone || '',
        client_nif: invoice.client_nif || '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        payment_method: invoice.payment_method || '',
        notes: invoice.notes || '',
        vat_rate: invoice.vat_rate,
      });

      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items);
      }
    }
  }, [invoice]);

  const calculateItemTotals = (quantity: number, unitPrice: number, vatRate: number, isService: boolean = false) => {
    return InvoiceService.calculateItemTotal(quantity, unitPrice, vatRate, isService, -9.5, applyCss, 1, taxRegime);
  };

  // Charger les données d'une inquiry sélectionnée
  const handleInquirySelect = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId);

    // Si "manual" est sélectionné, réinitialiser le formulaire
    if (!inquiryId || inquiryId === 'manual') {
      setFormData({
        client_name: '',
        client_email: '',
        client_address: '',
        client_phone: '',
        client_nif: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_method: '',
        notes: '',
        vat_rate: defaultVatRate,
      });
      setItems([{
        description: '',
        quantity: 1,
        unit_price_ht: 0,
        vat_rate: defaultVatRate,
        total_ht: 0,
        total_vat: 0,
        total_ttc: 0,
      }]);
      setSelectedInquiryId('');
      return;
    }

    const inquiry = unbilledInquiries.find((inq: any) => inq.id === inquiryId);
    if (!inquiry) return;

    // Remplir les informations client
    setFormData(prev => ({
      ...prev,
      client_name: inquiry.client_name || '',
      client_email: inquiry.client_email || '',
      client_address: '',
      client_phone: inquiry.client_phone || '',
      payment_method: '',
      notes: `Facture pour ${inquiry.type === 'product' ? 'produit' : 'produit numérique'}: ${inquiry.product_name}${inquiry.notes ? `\nNotes: ${inquiry.notes}` : ''}`,
    }));

    // Remplir l'item unique
    const quantity = inquiry.quantity || 1;
    const unitPrice = inquiry.product_price || 0;
    const isService = false; // Les inquiries sont toujours des produits
    const totals = calculateItemTotals(quantity, unitPrice, defaultVatRate, isService);

    setItems([{
      description: inquiry.product_name || 'Produit',
      quantity,
      unit_price_ht: unitPrice,
      vat_rate: defaultVatRate,
      is_service: isService,
      total_ht: totals.totalHT,
      total_vat: totals.totalVAT,
      total_ttc: totals.totalTTC,
    }]);
  };

  // Ajouter une ligne
  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unit_price_ht: 0,
        vat_rate: defaultVatRate,
        total_ht: 0,
        total_vat: 0,
        total_ttc: 0,
      },
    ]);
  };

  // Supprimer une ligne
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Mettre à jour une ligne
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculer les totaux si nécessaire
    if (['quantity', 'unit_price_ht', 'vat_rate', 'is_service'].includes(field)) {
      const totals = calculateItemTotals(
        newItems[index].quantity,
        newItems[index].unit_price_ht,
        newItems[index].vat_rate,
        newItems[index].is_service || false
      );
      newItems[index].total_ht = totals.totalHT;
      newItems[index].total_vat = totals.totalVAT;
      newItems[index].total_ttc = totals.totalTTC;
    }

    setItems(newItems);
  };

  const totals = InvoiceService.calculateTotals(items, formData.vat_rate, -9.5, applyCss, 1, taxRegime);

  // Sauvegarder
  const handleSave = async () => {
    if (!formData.client_name || items.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      // Logique de sauvegarde (appel au service)
      // Cette partie sera gérée par le parent
      onSave({
        ...formData,
        items,
      } as any);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.client_name && items.some(item => item.description);

  return (
    <div className="space-y-6">
      {/* Header avec boutons d'action */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <CardTitle className="text-2xl font-bold bg-gray-900 gray-600 bg-clip-text text-transparent">
                {invoice ? `Facture ${invoice.invoice_number}` : 'Nouvelle Facture'}
              </CardTitle>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={handleSave}
                disabled={!isFormValid || isSaving}
                className="flex-1 md:flex-none bg-gray-900 gray-600 hover:gray-600 hover:to-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              {invoice && (
                <>
                  <Button
                    onClick={() => onGeneratePdf(invoice)}
                    variant="outline"
                    className="border-blue-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => onSend(invoice)}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sélecteur de demande (seulement pour nouvelle facture) */}
          {!invoice && unbilledInquiries.length > 0 && (
            <Card className="bg-white border border-blue-200 bg-gray-100 gray-600">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gray-900" />
                  <CardTitle className="text-blue-900">Lier à une demande existante</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <AlertCircle className="w-4 h-4 text-gray-900" />
                  <AlertDescription className="text-blue-900">
                    Vous avez <strong>{unbilledInquiries.length}</strong> demande{unbilledInquiries.length > 1 ? 's' : ''} non facturée{unbilledInquiries.length > 1 ? 's' : ''}.
                    Sélectionnez-en une pour générer automatiquement la facture.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="inquiry_select">Sélectionner une demande</Label>
                  <Select value={selectedInquiryId || 'manual'} onValueChange={handleInquirySelect}>
                    <SelectTrigger className="rounded-lg border-blue-200 bg-white">
                      <SelectValue placeholder="-- Créer une facture manuelle --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">-- Créer une facture manuelle --</SelectItem>
                      {unbilledInquiries.map((inquiry: any) => (
                        <SelectItem key={inquiry.id} value={inquiry.id}>
                          <div className="flex flex-col w-full gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-light text-sm">
                                {inquiry.product_name}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {inquiry.type === 'product' ? 'Produit' : 'Numérique'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-900">
                              {inquiry.client_name} - Qté: {inquiry.quantity} - {inquiry.product_price * inquiry.quantity} FCFA
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedInquiryId && selectedInquiryId !== 'manual' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInquirySelect('manual')}
                    className="mt-2 text-gray-900 hover:text-gray-900 hover:bg-blue-50"
                  >
                    Réinitialiser et créer manuellement
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informations client */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Informations Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Nom du client *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Nom complet ou entreprise"
                    className="rounded-lg border-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="email@exemple.com"
                    className="rounded-lg border-blue-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_phone">Téléphone</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    placeholder="+225 XX XX XX XX XX"
                    className="rounded-lg border-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="client_nif">NIF du client</Label>
                  <Input
                    id="client_nif"
                    value={formData.client_nif}
                    onChange={(e) => setFormData({ ...formData, client_nif: e.target.value })}
                    placeholder="NIF (pour QR Code DGI)"
                    className="rounded-lg border-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Mode de paiement</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger className="rounded-lg border-blue-200">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="card">Carte bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="client_address">Adresse</Label>
                <Textarea
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                  placeholder="Adresse complète du client"
                  className="rounded-lg border-blue-200"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates et conditions */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issue_date">Date d'émission</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="rounded-lg border-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Date d'échéance</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="rounded-lg border-blue-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lignes de facturation */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Produits / Services</CardTitle>
                <Button onClick={addItem} size="sm" variant="outline" className="border-blue-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Désignation</TableHead>
                      <TableHead className="w-[12%]">Type</TableHead>
                      <TableHead className="w-[8%]">Qté</TableHead>
                      <TableHead className="w-[12%]">Prix HT</TableHead>
                      <TableHead className="w-[10%]">Taxe</TableHead>
                      <TableHead className="w-[12%] text-right">Total TTC</TableHead>
                      <TableHead className="w-[8%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Description du produit/service"
                            className="rounded-lg"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.is_service ? 'service' : 'product'}
                            onValueChange={(value) => updateItem(index, 'is_service', value === 'service')}
                          >
                            <SelectTrigger className="rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="product">
                                <span className="flex items-center gap-2">
                                  Produit
                                </span>
                              </SelectItem>
                              <SelectItem value="service">
                                <span className="flex items-center gap-2">
                                  Service
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="rounded-lg"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price_ht}
                            onChange={(e) =>
                              updateItem(index, 'unit_price_ht', parseFloat(e.target.value) || 0)
                            }
                            className="rounded-lg"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            {item.is_service ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-light">
                                TPS -9,5%
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-light">
                                TVA {item.vat_rate}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.total_ttc.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="text-gray-900 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle>Notes et mentions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes supplémentaires ou mentions légales..."
                className="rounded-lg border-blue-200"
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Résumé */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-6"
          >
            <Card className="bg-white border border-blue-200 bg-gray-100 gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Résumé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">Total HT</span>
                    <span className="font-semibold">{totals.totalHT.toFixed(2)} FCFA</span>
                  </div>
                  {totals.totalVAT > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">TVA ({formData.vat_rate}%) - Produits</span>
                      <span className="font-semibold text-gray-900">{totals.totalVAT.toFixed(2)} FCFA</span>
                    </div>
                  )}
                  {totals.totalTPS !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">TPS (-9,5%) - Services</span>
                      <span className="font-semibold text-gray-900">{totals.totalTPS.toFixed(2)} FCFA</span>
                    </div>
                  )}
                  {totals.totalCSS > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">CSS (1%) - Solidarité</span>
                      <span className="font-semibold text-gray-900">{totals.totalCSS.toFixed(2)} FCFA</span>
                    </div>
                  )}
                  <div className="border-t-2 border-blue-300 pt-3 flex justify-between">
                    <span className="text-lg font-bold">Total TTC</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {totals.totalTTC.toFixed(2)} FCFA
                    </span>
                  </div>
                  {(totals.totalTPS !== 0 || totals.totalVAT > 0 || totals.totalCSS > 0) && (
                    <div className="text-xs text-gray-700 italic space-y-1">
                      {totals.totalVAT > 0 && (
                        <div>* TVA appliquée uniquement aux produits</div>
                      )}
                      {totals.totalTPS !== 0 && (
                        <div>* TPS (-9,5%) déduction appliquée uniquement aux services</div>
                      )}
                      {totals.totalCSS > 0 && (
                        <div>* CSS (1%) : Contribution à la Solidarité Sociale</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-blue-200 space-y-2 text-sm text-gray-900">
                  <div className="flex justify-between">
                    <span>Lignes</span>
                    <span className="font-light">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Émission</span>
                    <span className="font-light">
                      {new Date(formData.issue_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Échéance</span>
                    <span className="font-light">
                      {new Date(formData.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
