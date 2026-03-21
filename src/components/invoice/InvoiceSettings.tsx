import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Upload, FileText, Loader2, X, Eye, Hash, Percent, DollarSign, Image, Banknote, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceSettings as ISettings, Invoice } from '@/services/invoiceService';
import { ImageUploadService } from '@/services/imageUploadService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface InvoiceSettingsProps {
  settings: ISettings | null;
  onBack: () => void;
  onSave: (settings: Partial<ISettings>) => void;
}

export const InvoiceSettings: React.FC<InvoiceSettingsProps> = ({
  settings,
  onBack,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    default_vat_rate: 18,
    prefix: 'FAC-2025-',
    next_number: 1,
    legal_mentions: '',
    bank_details: '',
    default_payment_terms: '',
    logo_url: '',
    pdf_template: 'modern' as 'modern' | 'minimal' | 'classic' | 'premium' | 'elegant' | 'corporate' | 'light',
    apply_css: true,
    // Informations d'entreprise
    tax_regime: 'tva_css' as 'tva_css' | 'css_only' | 'precompte',
    company_nif: '',
    company_vat_number: '',
    company_name: '',
    company_siret: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (settings) {
      setFormData({
        default_vat_rate: settings.default_vat_rate,
        prefix: settings.prefix,
        next_number: settings.next_number,
        legal_mentions: settings.legal_mentions || '',
        bank_details: settings.bank_details || '',
        default_payment_terms: (settings as { default_payment_terms?: string }).default_payment_terms || '',
        logo_url: settings.logo_url || '',
        pdf_template: settings.pdf_template || 'modern',
        apply_css: settings.apply_css || true,
        tax_regime: (settings.tax_regime as 'tva_css' | 'css_only' | 'precompte') || 'tva_css',
        company_nif: settings.company_nif || '',
        company_vat_number: settings.company_vat_number || '',
        // Informations d'entreprise
        company_name: settings.company_name || '',
        company_siret: settings.company_siret || '',
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filtrer les champs pour ne garder que ceux qui existent en base de données
      const settingsToSave: any = {
        default_vat_rate: formData.default_vat_rate,
        prefix: formData.prefix,
        next_number: formData.next_number,
        legal_mentions: formData.legal_mentions,
        bank_details: formData.bank_details,
        default_payment_terms: formData.default_payment_terms,
        logo_url: formData.logo_url,
        pdf_template: formData.pdf_template,
        company_name: formData.company_name,
        company_siret: formData.company_siret,
        company_address: formData.company_address,
        company_phone: formData.company_phone,
        company_email: formData.company_email,
        company_website: formData.company_website,
        apply_css: formData.apply_css,
        tax_regime: formData.tax_regime,
        company_nif: formData.company_nif || undefined,
        company_vat_number: formData.company_vat_number || undefined,
      };
      await onSave(settingsToSave);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: t('invoice.settings.logo.errors.invalidFormat.title'),
        description: t('invoice.settings.logo.errors.invalidFormat.description'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 500 * 1024) { // 500KB
      toast({
        title: t('invoice.settings.logo.errors.fileTooLarge.title'),
        description: t('invoice.settings.logo.errors.fileTooLarge.description'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Upload vers Supabase Storage
      const result = await ImageUploadService.uploadImage(file, 'logo');

      setFormData({ ...formData, logo_url: result.url });

      toast({
        title: t('invoice.settings.logo.success.uploaded.title'),
        description: t('invoice.settings.logo.success.uploaded.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.settings.logo.errors.uploadError.title'),
        description: t('invoice.settings.logo.errors.uploadError.description'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: '' });
    toast({
      title: t('invoice.settings.logo.success.removed.title'),
      description: t('invoice.settings.logo.success.removed.description'),
    });
  };

  // Générer une facture d'exemple pour la prévisualisation
  const createSampleInvoice = (): Invoice => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);

    return {
      id: 'sample-preview',
      user_id: 'sample',
      invoice_number: `${formData.prefix}001`,
      client_name: 'Client Exemple SARL',
      client_email: 'client@exemple.com',
      client_phone: '+225 XX XX XX XX XX',
      client_address: '123 Avenue de la République, Abidjan, Côte d\'Ivoire',
      issue_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'sent',
      total_ht: 100000,
      total_vat: 18000,
      total_ttc: 118000,
      vat_rate: formData.default_vat_rate,
      items: [
        {
          description: 'Prestation de service - Développement web',
          quantity: 1,
          unit_price_ht: 50000,
          vat_rate: formData.default_vat_rate,
          total_ht: 50000,
          total_vat: 9000,
          total_ttc: 59000,
        },
        {
          description: 'Consultation stratégique et accompagnement',
          quantity: 2,
          unit_price_ht: 25000,
          vat_rate: formData.default_vat_rate,
          total_ht: 50000,
          total_vat: 9000,
          total_ttc: 59000,
        },
      ],
      notes: 'Merci pour votre confiance. Paiement par virement bancaire ou Mobile Money.',
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
    };
  };

  // Prévisualiser le template PDF
  const handlePreviewTemplate = async () => {
    // Import dynamique pour éviter le warning Vite
    const { PDFGenerationService } = await import('@/services/pdfGenerationService');
    setIsGeneratingPreview(true);
    try {
      toast({
        title: t('invoice.settings.preview.generating.title'),
        description: t('invoice.settings.preview.generating.description'),
      });

      // Créer une facture d'exemple avec les paramètres actuels
      const sampleInvoice = createSampleInvoice();

      // Créer un objet settings temporaire avec les valeurs actuelles du formulaire
      const tempSettings: ISettings = {
        ...formData,
        id: settings?.id || 'temp',
        user_id: settings?.user_id || 'temp',
        created_at: settings?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ISettings;

      // Générer le PDF
      const { blobUrl } = await PDFGenerationService.generateInvoicePDF(
        sampleInvoice,
        tempSettings
      );

      // Ouvrir dans un nouvel onglet
      window.open(blobUrl, '_blank');

      toast({
        title: t('invoice.settings.preview.success.title'),
        description: t('invoice.settings.preview.success.description'),
      });

      // Nettoyer après 5 secondes
      setTimeout(() => {
        PDFGenerationService.revokeBlobUrl(blobUrl);
      }, 5000);
    } catch (error) {
      // Error log removed
      toast({
        title: t('invoice.settings.preview.errors.error.title'),
        description: t('invoice.settings.preview.errors.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Ultra-Moderne */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 overflow-hidden"
      >
        {/* Orbe décoratif */}
        <motion.div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="relative z-10 flex flex-row justify-between items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button 
              variant="outline" 
              size="sm"
              onClick={onBack} 
              className="w-full bg-white/90 backdrop-blur-xl border border-gray-200 text-gray-900 hover:bg-gray-50/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-3 md:px-4 py-2"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('invoice.settings.back')}</span>
              <span className="sm:hidden">{t('invoice.settings.back')}</span>
              </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group flex-1"
          >
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl blur-lg opacity-50 pointer-events-none"
              animate={{ opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white px-3 md:px-6 py-2 rounded-lg shadow-sm transition-all duration-200 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              <span>{t('invoice.settings.save')}</span>
            </Button>
          </motion.div>
          </div>
      </motion.div>

      {/* Section Informations d'entreprise Ultra-Moderne */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 md:p-8">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              {/* Icon Container Ultra-Moderne - Fond noir avec icône blanche */}
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <FileText className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            {t('invoice.settings.companyInfo.title')}
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base ml-16">
            {t('invoice.settings.companyInfo.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="company_name" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.companyName')}
              </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder={t('invoice.settings.companyInfo.companyNamePlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
            />
              <p className="text-xs text-gray-600 mt-2">{t('invoice.settings.companyInfo.officialName')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Label htmlFor="company_siret" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.siret')}
              </Label>
            <Input
              id="company_siret"
              value={formData.company_siret}
              onChange={(e) => setFormData({ ...formData, company_siret: e.target.value })}
              placeholder={t('invoice.settings.companyInfo.siretPlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
            />
              <p className="text-xs text-gray-600 mt-2">{t('invoice.settings.companyInfo.identificationNumber')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
            >
              <Label htmlFor="tax_regime" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.taxRegime')}
              </Label>
              <Select
                value={formData.tax_regime}
                onValueChange={(v: 'tva_css' | 'css_only' | 'precompte') => setFormData({ ...formData, tax_regime: v })}
              >
                <SelectTrigger className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tva_css">{t('invoice.settings.companyInfo.taxRegimeOptions.tvaCss')}</SelectItem>
                  <SelectItem value="css_only">{t('invoice.settings.companyInfo.taxRegimeOptions.cssOnly')}</SelectItem>
                  <SelectItem value="precompte">{t('invoice.settings.companyInfo.taxRegimeOptions.precompte')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-2">{t('invoice.settings.companyInfo.taxRegimeHelp')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <Label htmlFor="company_nif" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.nif')}
              </Label>
              <Input
                id="company_nif"
                value={formData.company_nif}
                onChange={(e) => setFormData({ ...formData, company_nif: e.target.value })}
                placeholder={t('invoice.settings.companyInfo.nifPlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              />
              <p className="text-xs text-gray-600 mt-2">{t('invoice.settings.companyInfo.nifHelp')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.29 }}
            >
              <Label htmlFor="company_vat_number" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.vatNumber')}
              </Label>
              <Input
                id="company_vat_number"
                value={formData.company_vat_number}
                onChange={(e) => setFormData({ ...formData, company_vat_number: e.target.value })}
                placeholder={t('invoice.settings.companyInfo.vatNumberPlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              />
              <p className="text-xs text-gray-600 mt-2">{t('invoice.settings.companyInfo.vatNumberHelp')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="company_address" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.address')}
              </Label>
            <Input
              id="company_address"
              value={formData.company_address}
              onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
              placeholder={t('invoice.settings.companyInfo.addressPlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
            />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Label htmlFor="company_phone" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.phone')}
              </Label>
            <Input
              id="company_phone"
              value={formData.company_phone}
              onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
              placeholder={t('invoice.settings.companyInfo.phonePlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
            />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="company_email" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.email')}
              </Label>
            <Input
              id="company_email"
              type="email"
              value={formData.company_email}
              onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
              placeholder={t('invoice.settings.companyInfo.emailPlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
            />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Label htmlFor="company_website" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.companyInfo.website')}
              </Label>
            <Input
              id="company_website"
              value={formData.company_website}
              onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
              placeholder={t('invoice.settings.companyInfo.websitePlaceholder')}
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
            />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Numérotation Ultra-Moderne */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <motion.div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <Hash className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {t('invoice.settings.numbering.title')}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 ml-16">
              {t('invoice.settings.numbering.description')}
            </p>
            <div className="space-y-4">
            <div>
                <Label htmlFor="prefix" className="text-sm font-semibold text-gray-900 mb-2 block">
                  {t('invoice.settings.numbering.prefix')}
                </Label>
              <Input
                id="prefix"
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="FAC-2025-"
                  className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              />
                <p className="text-sm text-gray-600 mt-2">
                {t('invoice.settings.numbering.example')}: {formData.prefix}
                {formData.next_number.toString().padStart(3, '0')}
              </p>
            </div>
            <div>
                <Label htmlFor="next_number" className="text-sm font-semibold text-gray-900 mb-2 block">
                  {t('invoice.settings.numbering.nextNumber')}
                </Label>
              <Input
                id="next_number"
                type="number"
                min="1"
                value={formData.next_number}
                onChange={(e) =>
                  setFormData({ ...formData, next_number: parseInt(e.target.value) || 1 })
                }
                  className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              />
                <p className="text-sm text-gray-600 mt-2">
                {t('invoice.settings.numbering.nextInvoice')}: {formData.prefix}
                {formData.next_number.toString().padStart(3, '0')}
              </p>
            </div>
            </div>
          </div>
        </motion.div>

        {/* TVA Ultra-Moderne */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <motion.div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-400/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <Percent className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {t('invoice.settings.vat.title')}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 ml-16">
              {t('invoice.settings.vat.description')}
            </p>
            <div>
              <Label htmlFor="default_vat_rate" className="text-sm font-semibold text-gray-900 mb-2 block">
                {t('invoice.settings.vat.rate')}
              </Label>
              <Input
                id="default_vat_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.default_vat_rate}
                onChange={(e) =>
                  setFormData({ ...formData, default_vat_rate: parseFloat(e.target.value) || 0 })
                }
                className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              />
              <p className="text-sm text-gray-600 mt-2">
                {t('invoice.settings.vat.standardRate')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CSS - Contribution à la Solidarité Sociale Ultra-Moderne */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <Scale className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {t('invoice.settings.css.title')}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 ml-16">
              {t('invoice.settings.css.description')}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="apply_css" className="text-sm font-semibold text-gray-900">
                  {t('invoice.settings.css.apply')}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {t('invoice.settings.css.info')}
                </p>
              </div>
              <Switch
                id="apply_css"
                checked={formData.apply_css}
                onCheckedChange={(value) =>
                  setFormData({ ...formData, apply_css: value })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Mentions légales Ultra-Modernes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <motion.div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <FileText className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {t('invoice.settings.legalMentions.title')}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 ml-16">
              {t('invoice.settings.legalMentions.description')}
            </p>
            <Textarea
              value={formData.legal_mentions}
              onChange={(e) => setFormData({ ...formData, legal_mentions: e.target.value })}
              placeholder={t('invoice.settings.legalMentions.placeholder')}
              className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              rows={5}
            />
          </div>
        </motion.div>

        {/* Coordonnées bancaires Ultra-Modernes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <motion.div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-green-400/10 to-emerald-400/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <Banknote className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {t('invoice.settings.bankDetails.title')}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 ml-16">
              {t('invoice.settings.bankDetails.description')}
            </p>
            <Textarea
              value={formData.bank_details}
              onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
              placeholder={t('invoice.settings.bankDetails.placeholder')}
              className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              rows={5}
            />
          </div>
        </motion.div>

        {/* Conditions de règlement par défaut (devis et factures) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Banknote className="w-6 h-6 text-gray-600" />
              </motion.div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900">
                  Conditions de règlement par défaut
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Pré-remplies sur les devis (modifiables par devis)
                </p>
              </div>
            </div>
            <Input
              value={formData.default_payment_terms}
              onChange={(e) => setFormData({ ...formData, default_payment_terms: e.target.value })}
              placeholder="Ex: Paiement à 30 jours, Acompte 30% à la commande"
              className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium"
            />
          </div>
        </motion.div>

        {/* Logo Ultra-Moderne */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <motion.div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/10 to-cyan-400/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <Image className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {t('invoice.settings.logo.title')}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 ml-16">
              {t('invoice.settings.logo.description')}
            </p>
            <div className="space-y-4">
            <div className='none'>
                <Label htmlFor="logo_url" className="text-sm font-semibold text-gray-900 mb-2 block">
                  {t('invoice.settings.logo.url')}
                </Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://exemple.com/logo.png"
                  className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300"
              />
            </div>
            {formData.logo_url && (
                <div className="mt-4 p-4 bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200 shadow-lg relative">
                  <p className="text-sm text-gray-900 mb-2 font-semibold">{t('invoice.settings.logo.preview')}</p>
                <div className="relative inline-block">
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                      className="max-h-24 object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-red-600 hover:bg-red-700"
                    onClick={handleRemoveLogo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
              <div className="pt-2 border-t border-gray-200/60">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                  className="w-full bg-white/90 backdrop-blur-xl border border-gray-200 text-gray-900 hover:bg-gray-50/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('invoice.settings.logo.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('invoice.settings.logo.upload')}
                  </>
                )}
              </Button>
                <p className="text-xs text-gray-600 mt-2 text-center">
                {t('invoice.settings.logo.recommendedFormat')}
              </p>
            </div>
            </div>
          </div>
        </motion.div>

        {/* Modèle PDF Ultra-Moderne */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <motion.div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-violet-400/10 to-purple-400/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="relative w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3, type: "tween" }}
              >
                <FileText className="w-6 h-6 text-gray-600" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                {t('invoice.settings.pdfTemplate.title')}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 ml-16">
              {t('invoice.settings.pdfTemplate.description')}
            </p>
            <div className="space-y-4">
            <div>
                <Label htmlFor="pdf_template" className="text-sm font-semibold text-gray-900 mb-2 block">
                  {t('invoice.settings.pdfTemplate.style')}
                </Label>
              <Select
                value={formData.pdf_template}
                onValueChange={(value: any) => setFormData({ ...formData, pdf_template: value })}
              >
                  <SelectTrigger className="rounded-xl bg-white/90 backdrop-blur-xl border border-gray-200 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 shadow-lg text-gray-900 font-medium transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl">
                  <SelectItem value="modern">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{t('invoice.settings.pdfTemplate.options.modern')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="minimal">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{t('invoice.settings.pdfTemplate.options.minimal')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="classic">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{t('invoice.settings.pdfTemplate.options.classic')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{t('invoice.settings.pdfTemplate.options.premium')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="elegant">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{t('invoice.settings.pdfTemplate.options.elegant')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="corporate">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{t('invoice.settings.pdfTemplate.options.corporate')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{t('invoice.settings.pdfTemplate.options.light')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-xl border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">{t('invoice.settings.pdfTemplate.previewLabel', { template: formData.pdf_template })}</p>
                <Button
                  onClick={handlePreviewTemplate}
                  disabled={isGeneratingPreview}
                  size="sm"
                  className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 text-gray-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isGeneratingPreview ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      {t('invoice.settings.pdfTemplate.generating')}
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-2" />
                      {t('invoice.settings.pdfTemplate.previewPDF')}
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-lg border border-gray-200">
                {/* Template Modern */}
                {formData.pdf_template === 'modern' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-gradient-to-r gray-600">
                      <div className="bg-gray-900 gray-600 text-gray-600 px-3 py-1 rounded text-xs font-bold">
                        FACTURE
                      </div>
                      <div className="text-xs text-gray-700">FAC-2025-001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-900 gray-600 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-2 bg-gray-900 gray-600 rounded w-3/4 ml-auto"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2 ml-auto"></div>
                      </div>
                    </div>
                    <div className="h-12 bg-gray-900 gray-600 rounded"></div>
                    <div className="text-xs text-center font-medium bg-gray-900 gray-600 bg-clip-text text-transparent">
                      {t('invoice.settings.pdfTemplate.previews.modern')}
                    </div>
                  </div>
                )}

                {/* Template Minimal */}
                {formData.pdf_template === 'minimal' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-300">
                      <div className="text-xs font-bold text-gray-900">FACTURE</div>
                      <div className="text-xs text-gray-700">FAC-2025-001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-2 bg-gray-300 rounded w-3/4 ml-auto"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2 ml-auto"></div>
                      </div>
                    </div>
                    <div className="h-12 bg-gray-50 rounded border border-gray-200"></div>
                    <div className="text-xs text-center font-medium text-gray-900">
                      {t('invoice.settings.pdfTemplate.previews.minimal')}
                    </div>
                  </div>
                )}

                {/* Template Classic */}
                {formData.pdf_template === 'classic' && (
                  <div className="space-y-3">
                    <div className="text-center pb-2 border-b-2 border-gray-800">
                      <div className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                        Facture
                      </div>
                      <div className="text-xs text-gray-900 mt-1">N° FAC-2025-001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 border-r border-gray-300 pr-2">
                        <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-400 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                      </div>
                      <div className="space-y-1 pl-2">
                        <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-400 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-12 bg-gray-100 rounded border-2 border-gray-800"></div>
                    <div className="text-xs text-center font-medium text-gray-700">
                      {t('invoice.settings.pdfTemplate.previews.classic')}
                    </div>
                  </div>
                )}

                {/* Template Premium */}
                {formData.pdf_template === 'premium' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                      <div className="text-sm font-light tracking-widest text-gray-900">INVOICE</div>
                      <div className="text-xs text-gray-500">FAC-2025-001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="h-1.5 bg-gray-400 rounded w-2/3"></div>
                        <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-1.5 bg-gray-400 rounded w-2/3 ml-auto"></div>
                        <div className="h-1.5 bg-gray-200 rounded w-1/2 ml-auto"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gradient-to-r from-gray-50 to-white rounded"></div>
                    <div className="text-xs text-center font-light text-gray-600">
                      {t('invoice.settings.pdfTemplate.previews.premium')}
                    </div>
                  </div>
                )}

                {/* Template Elegant */}
                {formData.pdf_template === 'elegant' && (
                  <div className="space-y-3">
                    <div className="pb-3 border-b border-gray-300">
                      <div className="text-xs font-semibold text-gray-900 mb-1">FACTURE</div>
                      <div className="text-xs text-gray-500">Numéro: FAC-2025-001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5 bg-gray-50 p-2 rounded">
                        <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-1.5 bg-gray-50 p-2 rounded">
                        <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-white rounded border-l-2 border-gray-800 pl-2"></div>
                    <div className="text-xs text-center font-medium text-gray-700">
                      {t('invoice.settings.pdfTemplate.previews.elegant')}
                    </div>
                  </div>
                )}

                {/* Template Corporate */}
                {formData.pdf_template === 'corporate' && (
                  <div className="space-y-3">
                    <div className="bg-gray-800 text-gray-600 px-3 py-2 rounded">
                      <div className="text-xs font-bold">FACTURE OFFICIELLE</div>
                      <div className="text-xs mt-1 text-gray-300">Réf: FAC-2025-001</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="space-y-1.5 border-r border-gray-300 pr-2">
                        <div className="h-1 bg-gray-600 rounded w-full"></div>
                        <div className="h-1 bg-gray-400 rounded w-3/4"></div>
                      </div>
                      <div className="space-y-1.5 border-r border-gray-300 px-2">
                        <div className="h-1 bg-gray-600 rounded w-full"></div>
                        <div className="h-1 bg-gray-400 rounded w-3/4"></div>
                      </div>
                      <div className="space-y-1.5 pl-2">
                        <div className="h-1 bg-gray-600 rounded w-full"></div>
                        <div className="h-1 bg-gray-400 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-100 rounded border border-gray-600"></div>
                    <div className="text-xs text-center font-medium text-gray-800">
                      {t('invoice.settings.pdfTemplate.previews.corporate')}
                    </div>
                  </div>
                )}

                {/* Template Light */}
                {formData.pdf_template === 'light' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2">
                      <div className="text-xs font-medium text-gray-700">Facture</div>
                      <div className="text-xs text-gray-400 font-light">FAC-2025-001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-1.5 bg-gray-100 rounded w-1/2"></div>
                        <div className="h-1.5 bg-gray-100 rounded w-2/3"></div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-1.5 bg-gray-200 rounded w-3/4 ml-auto"></div>
                        <div className="h-1.5 bg-gray-100 rounded w-1/2 ml-auto"></div>
                        <div className="h-1.5 bg-gray-100 rounded w-2/3 ml-auto"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-50 rounded border border-gray-100"></div>
                    <div className="text-xs text-center text-gray-500 font-light">
                      {t('invoice.settings.pdfTemplate.previews.light')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
