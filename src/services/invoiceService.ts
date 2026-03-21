import { supabase } from '@/integrations/supabase/client';
import { StockService } from '@/services/stockService';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';

export interface InvoiceSettings {
  id: string;
  user_id: string;
  default_vat_rate: number;
  default_tps_rate?: number; // Taux TPS (9.5% par défaut)
  apply_tps?: boolean; // Activer/désactiver la TPS
  apply_css?: boolean; // Activer/désactiver la CSS
  prefix: string;
  next_number: number;
  legal_mentions?: string;
  bank_details?: string;
  default_payment_terms?: string;
  logo_url?: string;
  pdf_template?: 'modern' | 'minimal' | 'classic' | 'premium' | 'elegant' | 'corporate' | 'light';
  // Régime fiscal DGI
  tax_regime?: 'tva_css' | 'css_only' | 'precompte';
  company_nif?: string;
  company_vat_number?: string;
  // Informations d'entreprise
  company_name?: string;
  company_siret?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  is_service?: boolean; // Indique si c'est une prestation de service (pour la TPS)
}

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_nif?: string;
  order_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  total_ht: number;
  total_vat: number;
  total_tps?: number; // TPS (9.5% sur prestations de services)
  total_css?: number; // CSS (1% sur total)
  total_ttc: number;
  status: InvoiceStatus;
  payment_method?: string;
  payment_date?: string;
  pdf_url?: string;
  notes?: string;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceData {
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_nif?: string;
  order_id?: string;
  issue_date: string;
  due_date: string;
  vat_rate: number;
  payment_method?: string;
  notes?: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[];
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  status?: InvoiceStatus;
  payment_date?: string;
  pdf_url?: string;
}

export class InvoiceService {
  /**
   * Récupère les paramètres de facturation de l'utilisateur
   */
  static async getSettings(userId: string): Promise<InvoiceSettings | null> {
    const { data, error } = await supabase
      .from('invoice_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas de paramètres, créer les valeurs par défaut
        return await this.createDefaultSettings(userId);
      }
      throw error;
    }

    return data as unknown as InvoiceSettings;
  }

  /**
   * Crée les paramètres par défaut pour un utilisateur
   */
  static async createDefaultSettings(userId: string): Promise<InvoiceSettings> {
    const defaultSettings = {
      user_id: userId,
      default_vat_rate: 18,
      prefix: 'FAC-2025-',
      next_number: 1,
      pdf_template: 'modern' as const,
    };

    const { data, error } = await supabase
      .from('invoice_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as InvoiceSettings;
  }

  /**
   * Met à jour les paramètres de facturation
   */
  static async updateSettings(
    userId: string,
    settings: Partial<Omit<InvoiceSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<InvoiceSettings> {
    const { data, error } = await supabase
      .from('invoice_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as InvoiceSettings;
  }

  /**
   * Génère le prochain numéro de facture
   */
  static async generateInvoiceNumber(userId: string): Promise<string> {
    const settings = await this.getSettings(userId);
    if (!settings) throw new Error('Settings not found');

    const invoiceNumber = `${settings.prefix}${settings.next_number.toString().padStart(3, '0')}`;

    // Incrémenter le compteur
    await this.updateSettings(userId, {
      next_number: settings.next_number + 1,
    });

    return invoiceNumber;
  }

  /**
   * Récupère toutes les factures d'un utilisateur
   * Inclut les factures créées directement ET celles liées aux demandes (inquiries) de toutes ses cartes
   */
  static async getUserInvoices(userId: string): Promise<Invoice[]> {
    // Récupérer toutes les cartes de l'utilisateur
    const { data: cards, error: cardsError } = await supabase
      .from('business_cards')
      .select('id')
      .eq('user_id', userId);

    if (cardsError) throw cardsError;

    // Si pas de cartes, récupérer uniquement les factures directes
    if (!cards || cards.length === 0) {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((invoice: any) => ({
        ...invoice,
        items: invoice.invoice_items || [],
      }));
    }

    const cardIds = cards.map(c => c.id);

    // Récupérer les IDs des factures liées aux product_inquiries de ses cartes
    const { data: productInquiries } = await supabase
      .from('product_inquiries')
      .select('invoice_id')
      .in('card_id', cardIds)
      .not('invoice_id', 'is', null);

    // Récupérer les IDs des factures liées aux digital_inquiries de ses cartes
    const { data: digitalInquiries } = await supabase
      .from('digital_inquiries')
      .select('invoice_id')
      .in('card_id', cardIds)
      .not('invoice_id', 'is', null);

    // Collecter tous les invoice_ids uniques
    const invoiceIds = new Set<string>();
    productInquiries?.forEach(pi => pi.invoice_id && invoiceIds.add(pi.invoice_id));
    digitalInquiries?.forEach(di => di.invoice_id && invoiceIds.add(di.invoice_id));

    // Récupérer les factures : celles de l'utilisateur OU celles liées aux inquiries de ses cartes
    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .order('created_at', { ascending: false });

    // Construire la clause OR pour inclure les factures directes et celles des inquiries
    if (invoiceIds.size > 0) {
      const invoiceIdArray = Array.from(invoiceIds);
      query = query.or(`user_id.eq.${userId},id.in.(${invoiceIdArray.join(',')})`);
    } else {
      // Pas d'inquiries facturées, juste les factures directes
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((invoice: any) => ({
      ...invoice,
      items: invoice.invoice_items || [],
    }));
  }

  /**
   * Récupère les statuts de factures par IDs (léger, pour afficher "payé" sur les commandes liées).
   */
  static async getInvoiceStatusesByIds(invoiceIds: string[]): Promise<Record<string, InvoiceStatus>> {
    if (!invoiceIds.length) return {};
    const { data, error } = await supabase
      .from('invoices')
      .select('id, status')
      .in('id', invoiceIds);
    if (error) return {};
    const map: Record<string, InvoiceStatus> = {};
    (data || []).forEach((row: { id: string; status: InvoiceStatus }) => {
      map[row.id] = row.status;
    });
    return map;
  }

  /**
   * Récupère une facture par son ID
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      ...data,
      items: (data.invoice_items || []) as InvoiceItem[],
    } as Invoice;
  }

  /**
   * Crée une nouvelle facture
   */
  static async createInvoice(userId: string, invoiceData: CreateInvoiceData): Promise<Invoice> {
    const settings = await this.getSettings(userId);
    const taxRegime = (settings?.tax_regime as 'tva_css' | 'css_only' | 'precompte') ?? 'tva_css';
    const applyCss = settings?.apply_css ?? true;

    const invoiceNumber = await this.generateInvoiceNumber(userId);

    const totals = this.calculateTotals(
      invoiceData.items,
      invoiceData.vat_rate,
      -9.5,
      applyCss,
      1,
      taxRegime
    );

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        client_name: invoiceData.client_name,
        client_email: invoiceData.client_email,
        client_address: invoiceData.client_address,
        client_phone: invoiceData.client_phone,
        client_nif: invoiceData.client_nif,
        order_id: invoiceData.order_id,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        vat_rate: invoiceData.vat_rate,
        total_ht: totals.totalHT,
        total_vat: totals.totalVAT,
        total_tps: totals.totalTPS,
        total_css: totals.totalCSS,
        total_ttc: totals.totalTTC,
        status: 'draft',
        payment_method: invoiceData.payment_method,
        notes: invoiceData.notes,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Créer les lignes de facturation
    const itemsToInsert = invoiceData.items.map(item => ({
      invoice_id: invoice.id,
      ...item,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) throw itemsError;

    return {
      ...invoice,
      items: (items || []) as InvoiceItem[],
    } as Invoice;
  }

  /**
   * Met à jour une facture
   */
  static async updateInvoice(
    invoiceId: string,
    updateData: UpdateInvoiceData
  ): Promise<Invoice> {
    let totals = { totalHT: 0, totalVAT: 0, totalTPS: 0, totalCSS: 0, totalTTC: 0 };

    if (updateData.items) {
      const existing = await this.getInvoiceById(invoiceId);
      const userId = existing?.user_id;
      const settings = userId ? await this.getSettings(userId) : null;
      const taxRegime = (settings?.tax_regime as 'tva_css' | 'css_only' | 'precompte') ?? 'tva_css';
      const applyCss = settings?.apply_css ?? true;

      totals = this.calculateTotals(
        updateData.items,
        updateData.vat_rate || 18,
        -9.5,
        applyCss,
        1,
        taxRegime
      );

      // Supprimer les anciens items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      // Créer les nouveaux items
      const itemsToInsert = updateData.items.map(item => ({
        invoice_id: invoiceId,
        ...item,
      }));

      await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
    }

    // Préparer les données de mise à jour
    const updatePayload: any = {
      ...updateData,
      items: undefined, // Retirer items du payload principal
    };

    if (updateData.items) {
      updatePayload.total_ht = totals.totalHT;
      updatePayload.total_vat = totals.totalVAT;
      updatePayload.total_tps = totals.totalTPS;
      updatePayload.total_css = totals.totalCSS;
      updatePayload.total_ttc = totals.totalTTC;
    }

    // Mettre à jour la facture
    const { error } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    // Récupérer la facture complète avec les items
    return await this.getInvoiceById(invoiceId) as Invoice;
  }

  /**
   * Supprime une facture
   */
  static async deleteInvoice(invoiceId: string): Promise<void> {
    // Supprimer d'abord les items (cascade devrait le faire automatiquement)
    await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    // Supprimer la facture
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  }

  /**
   * Calcule les totaux d'une facture selon le régime fiscal DGI
   * - tva_css: TVA + CSS (CA > 60 M) — TVA produits, TPS services, CSS 1%
   * - css_only: CSS seul (CA 30–60 M) — Pas de TVA, CSS 1%
   * - precompte: Précompte TPS 9,5% (CA < 30 M) — Retenue à la source, HT - 9,5%
   */
  static calculateTotals(
    items: Array<{ quantity: number; unit_price_ht: number; vat_rate: number; is_service?: boolean }>,
    defaultVatRate: number = 18,
    tpsRate: number = -9.5,
    applyCss: boolean = true,
    cssRate: number = 1,
    taxRegime: 'tva_css' | 'css_only' | 'precompte' = 'tva_css'
  ): { totalHT: number; totalVAT: number; totalTPS: number; totalCSS: number; totalTTC: number } {
    let totalHT = 0;
    let totalVAT = 0;
    let totalTPS = 0;
    let totalCSS = 0;

    items.forEach(item => {
      const itemHT = item.quantity * item.unit_price_ht;
      totalHT += itemHT;

      if (taxRegime === 'precompte') {
        // Régime précompte : seule la retenue TPS 9,5% sur le total (pas de TVA, pas de TPS par type)
        // On calculera totalTPS une seule fois après la boucle
      } else if (taxRegime === 'css_only') {
        // Pas de TVA ni TPS
      } else {
        // tva_css : TPS (-9,5%) aux services, TVA aux produits
        if (item.is_service) {
          totalTPS += itemHT * (tpsRate / 100);
        } else {
          totalVAT += itemHT * ((item.vat_rate ?? defaultVatRate) / 100);
        }
      }
    });

    if (taxRegime === 'precompte') {
      totalTPS = totalHT * (tpsRate / 100); // -9,5% = retenue
      totalCSS = 0;
    } else if (taxRegime === 'css_only') {
      totalVAT = 0;
      totalTPS = 0;
      if (applyCss) totalCSS = totalHT * (cssRate / 100);
    } else {
      if (applyCss) totalCSS = totalHT * (cssRate / 100);
    }

    const totalTTC = totalHT + totalVAT + totalTPS + totalCSS;

    return {
      totalHT: Math.round(totalHT * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      totalTPS: Math.round(totalTPS * 100) / 100,
      totalCSS: Math.round(totalCSS * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100,
    };
  }

  /**
   * Calcule le total d'une ligne selon le régime fiscal DGI
   */
  static calculateItemTotal(
    quantity: number,
    unitPrice: number,
    vatRate: number,
    isService: boolean = false,
    tpsRate: number = -9.5,
    applyCss: boolean = true,
    cssRate: number = 1,
    taxRegime: 'tva_css' | 'css_only' | 'precompte' = 'tva_css'
  ): { totalHT: number; totalVAT: number; totalTPS: number; totalCSS: number; totalTTC: number } {
    const totalHT = quantity * unitPrice;
    let totalVAT = 0;
    let totalTPS = 0;
    let totalCSS = 0;

    if (taxRegime === 'precompte') {
      totalTPS = totalHT * (tpsRate / 100);
    } else if (taxRegime === 'css_only') {
      if (applyCss) totalCSS = totalHT * (cssRate / 100);
    } else {
      if (isService) {
        totalTPS = totalHT * (tpsRate / 100);
      } else {
        totalVAT = totalHT * (vatRate / 100);
      }
      if (applyCss) totalCSS = totalHT * (cssRate / 100);
    }

    const totalTTC = totalHT + totalVAT + totalTPS + totalCSS;

    return {
      totalHT: Math.round(totalHT * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      totalTPS: Math.round(totalTPS * 100) / 100,
      totalCSS: Math.round(totalCSS * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100,
    };
  }

  /**
   * Met à jour le statut d'une facture.
   * Si la facture passe à "payée" et qu'elle provient d'un devis (order_id = quote_id),
   * les produits physiques des lignes du devis sont déduits du stock.
   */
  static async updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceStatus,
    paymentDate?: string
  ): Promise<Invoice> {
    const updateData: any = { status };
    if (status === 'paid' && paymentDate) {
      updateData.payment_date = paymentDate;
    }

    const updated = await this.updateInvoice(invoiceId, updateData);

    if (status === 'paid' && updated?.order_id) {
      const orderId = updated.order_id;

      // 1) Facture issue d'un devis (order_id = quote_id) : déduction stock des quote_items
      const { data: quoteItems } = await supabase
        .from('quote_items')
        .select('product_id, card_id, quantity')
        .eq('quote_id', orderId)
        .not('product_id', 'is', null);

      const isFromQuote = (quoteItems?.length ?? 0) > 0;
      for (const row of quoteItems || []) {
        if (!row.card_id || !row.product_id) continue;
        const qty = Math.max(0, Number(row.quantity) || 0);
        if (qty <= 0) continue;
        try {
          await StockService.recordProductMovement(
            row.card_id,
            row.product_id,
            'out',
            qty,
            `Facture payée (issu du devis) - Facture #${invoiceId}`,
            invoiceId
          );
        } catch (err) {
          console.warn(`Déduction stock facture payée (produit ${row.product_id}):`, err);
        }
      }

      // 2) Facture issue d'une commande (order_id = inquiry id, pas un devis) : sync payment_status sur la commande
      if (!isFromQuote) {
        const paidAt = paymentDate || new Date().toISOString();
        const updatePayload: { payment_status: string; paid_at?: string } = { payment_status: 'paid' };
        if (paymentDate) updatePayload.paid_at = paidAt;
        await supabase.from('product_inquiries').update(updatePayload).eq('id', orderId);
        await supabase.from('digital_inquiries').update(updatePayload).eq('id', orderId);
      }
    }

    return updated;
  }

  /**
   * Récupère les statistiques de facturation
   */
  static async getInvoiceStats(userId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> {
    const invoices = await this.getUserInvoices(userId);

    const stats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'sent').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total_ttc, 0),
      paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_ttc, 0),
      pendingAmount: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total_ttc, 0),
    };

    return stats;
  }

  /**
   * Récupère les demandes de produits (inquiries) non facturées d'un utilisateur
   * Combine product_inquiries et digital_inquiries
   */
  static async getUnbilledInquiries(userId: string): Promise<any[]> {
    try {
      // Récupérer toutes les cartes de l'utilisateur
      const { data: cards, error: cardsError } = await supabase
        .from('business_cards')
        .select('id')
        .eq('user_id', userId);

      if (cardsError) throw cardsError;
      if (!cards || cards.length === 0) return [];

      const cardIds = cards.map(c => c.id);

      // Récupérer les product_inquiries non facturées
      const { data: productInquiries, error: productError } = await supabase
        .from('product_inquiries')
        .select(`
          *,
          products (
            id,
            name,
            price,
            description
          )
        `)
        .in('card_id', cardIds)
        .is('invoice_id', null)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (productError) throw productError;

      // Récupérer les digital_inquiries non facturées
      const { data: digitalInquiries, error: digitalError } = await supabase
        .from('digital_inquiries')
        .select(`
          *,
          digital_products (
            id,
            title,
            price,
            description
          )
        `)
        .in('card_id', cardIds)
        .is('invoice_id', null)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (digitalError) throw digitalError;

      // Formater les résultats pour avoir une structure unifiée
      const formattedProductInquiries = (productInquiries || []).map((inquiry: any) => ({
        ...inquiry,
        type: 'product',
        product_name: inquiry.products?.name || 'Produit',
        product_price: inquiry.products?.price || 0,
        product_description: inquiry.products?.description,
      }));

      const formattedDigitalInquiries = (digitalInquiries || []).map((inquiry: any) => ({
        ...inquiry,
        type: 'digital',
        product_name: inquiry.digital_products?.title || 'Produit numérique',
        product_price: inquiry.digital_products?.price || 0,
        product_description: inquiry.digital_products?.description,
      }));

      // Combiner et trier par date
      const allInquiries = [...formattedProductInquiries, ...formattedDigitalInquiries];
      allInquiries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return allInquiries;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Génère une facture à partir d'une inquiry (product_inquiry ou digital_inquiry)
   */
  static async createInvoiceFromInquiry(userId: string, inquiryId: string, inquiryType: 'product' | 'digital'): Promise<Invoice> {
    try {
      // Récupérer l'inquiry selon son type
      let inquiry: any;
      let productInfo: any;

      if (inquiryType === 'product') {
        const { data, error } = await supabase
          .from('product_inquiries')
          .select(`
            *,
            products (
              id,
              name,
              price,
              description
            )
          `)
          .eq('id', inquiryId)
          .single();

        if (error) throw error;
        inquiry = data;
        productInfo = inquiry.products;
      } else {
        const { data, error } = await supabase
          .from('digital_inquiries')
          .select(`
            *,
            digital_products (
              id,
              title,
              price,
              description
            )
          `)
          .eq('id', inquiryId)
          .single();

        if (error) throw error;
        inquiry = data;
        productInfo = inquiry.digital_products;
      }

      if (!inquiry) throw new Error('Inquiry not found');

      // Récupérer les paramètres de facturation
      const settings = await this.getSettings(userId);
      if (!settings) throw new Error('Invoice settings not found');

      // Préparer l'item de la facture
      const quantity = inquiry.quantity || 1;
      const unitPrice = productInfo?.price || 0;
      const vatRate = settings.default_vat_rate;
      const taxRegime = (settings.tax_regime as 'tva_css' | 'css_only' | 'precompte') ?? 'tva_css';
      const totals = this.calculateItemTotal(
        quantity,
        unitPrice,
        vatRate,
        inquiryType === 'digital', // produit numérique = service
        -9.5,
        settings.apply_css ?? true,
        1,
        taxRegime
      );

      const invoiceItems: Omit<InvoiceItem, 'id' | 'invoice_id'>[] = [{
        description: productInfo?.name || productInfo?.title || 'Produit',
        quantity,
        unit_price_ht: unitPrice,
        vat_rate: vatRate,
        total_ht: totals.totalHT,
        total_vat: totals.totalVAT,
        total_ttc: totals.totalTTC,
      }];

      // Créer la facture
      const invoiceData: CreateInvoiceData = {
        client_name: inquiry.client_name || 'Client',
        client_email: inquiry.client_email ?? undefined,
        client_address: undefined,
        client_phone: inquiry.client_phone ?? undefined,
        order_id: inquiryId, // On stocke l'ID de l'inquiry comme order_id
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vat_rate: settings.default_vat_rate,
        payment_method: undefined,
        notes: `Facture générée pour ${inquiryType === 'product' ? 'produit' : 'produit numérique'}: ${productInfo?.name || productInfo?.title}${inquiry.notes ? `\nNotes: ${inquiry.notes}` : ''}`,
        items: invoiceItems,
      };

      const createdInvoice = await this.createInvoice(userId, invoiceData);

      // Mettre à jour l'inquiry avec l'ID de la facture
      const tableName = inquiryType === 'product' ? 'product_inquiries' : 'digital_inquiries';
      await supabase
        .from(tableName)
        .update({ invoice_id: createdInvoice.id })
        .eq('id', inquiryId);

      return createdInvoice;
    } catch (error) {
      // Error log removed
      throw error;
    }
  }

  /**
   * Récupère les devis acceptés sans facture pour un utilisateur
   */
  static async getUnbilledAcceptedQuotes(userId: string): Promise<{ id: string; quote_number?: string }[]> {
    const { data, error } = await supabase
      .from('service_quotes')
      .select('id, quote_number')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .is('converted_to_invoice_id', null)
      .gt('quote_amount', 0);

    if (error) throw error;
    return (data || []) as { id: string; quote_number?: string }[];
  }

  /**
   * Génère une facture à partir d'un devis accepté
   */
  static async createInvoiceFromQuote(userId: string, quoteId: string): Promise<Invoice> {
    const { data: quote, error: quoteError } = await supabase
      .from('service_quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('user_id', userId)
      .single();

    if (quoteError || !quote) throw new Error('Quote not found');

    if (quote.status !== 'accepted') {
      throw new Error('Seuls les devis acceptés peuvent être convertis en facture');
    }

    if (quote.converted_to_invoice_id) {
      throw new Error('Ce devis a déjà une facture associée');
    }

    const amount = Number(quote.quote_amount) || 0;
    if (amount <= 0) throw new Error('Le devis doit avoir un montant');

    const settings = await this.getSettings(userId);
    if (!settings) throw new Error('Paramètres de facturation non configurés');

    const vatRate = settings.default_vat_rate;

    // Récupérer les lignes du devis
    const { data: quoteItems = [] } = await supabase
      .from('quote_items')
      .select('title, quantity, unit_price')
      .eq('quote_id', quoteId)
      .order('order_index');

    const taxRegime = (settings.tax_regime as 'tva_css' | 'css_only' | 'precompte') ?? 'tva_css';
    const applyCss = settings.apply_css ?? true;

    const invoiceItems: Omit<InvoiceItem, 'id' | 'invoice_id'>[] =
      quoteItems.length > 0
        ? quoteItems.map((it: { title: string; quantity: number; unit_price: number }) => {
            const qty = Number(it.quantity) || 1;
            const unitPrice = Number(it.unit_price) || 0;
            const totals = this.calculateItemTotal(qty, unitPrice, vatRate, true, -9.5, applyCss, 1, taxRegime);
            return {
              description: it.title || 'Prestation',
              quantity: qty,
              unit_price_ht: unitPrice,
              vat_rate: vatRate,
              total_ht: totals.totalHT,
              total_vat: totals.totalVAT,
              total_ttc: totals.totalTTC,
              is_service: true,
            };
          })
        : (() => {
            const totalHT = taxRegime === 'precompte'
              ? amount / (1 + -9.5 / 100)
              : taxRegime === 'css_only'
                ? amount / (1 + (applyCss ? 0.01 : 0))
                : amount / (1 + vatRate / 100 + (applyCss ? 0.01 : 0));
            const totals = this.calculateItemTotal(1, totalHT, vatRate, true, -9.5, applyCss, 1, taxRegime);
            return [
              {
                description: quote.service_requested || 'Prestation',
                quantity: 1,
                unit_price_ht: totalHT,
                vat_rate: vatRate,
                total_ht: totals.totalHT,
                total_vat: totals.totalVAT,
                total_ttc: totals.totalTTC,
                is_service: true,
              },
            ];
          })();

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const invoiceData: CreateInvoiceData = {
      client_name: quote.client_company || quote.client_name || 'Client',
      client_email: quote.client_email ?? undefined,
      client_phone: quote.client_phone ?? undefined,
      order_id: quoteId,
      issue_date: today,
      due_date: dueDate,
      vat_rate: vatRate,
      notes: `Facture générée depuis le devis pour: ${quote.service_requested}${quote.project_description ? `\n\n${quote.project_description}` : ''}`,
      items: invoiceItems,
    };

    const createdInvoice = await this.createInvoice(userId, invoiceData);

    await supabase
      .from('service_quotes')
      .update({ converted_to_invoice_id: createdInvoice.id })
      .eq('id', quoteId);

    return createdInvoice;
  }

  /**
   * Vérifie si une inquiry a déjà une facture
   */
  static async isInquiryBilled(inquiryId: string, inquiryType: 'product' | 'digital'): Promise<boolean> {
    const tableName = inquiryType === 'product' ? 'product_inquiries' : 'digital_inquiries';
    const { data, error } = await supabase
      .from(tableName)
      .select('invoice_id')
      .eq('id', inquiryId)
      .single();

    if (error) return false;
    return !!data?.invoice_id;
  }

  /**
   * Export des factures en format CSV
   */
  static exportToCSV(invoices: Invoice[]): string {
    const headers = [
      'Numéro',
      'Date émission',
      'Date échéance',
      'Client',
      'Email',
      'Téléphone',
      'Adresse',
      'Total HT',
      'Total TVA',
      'Total TTC',
      'Statut',
      'Date paiement',
      'Méthode paiement'
    ];

    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.issue_date,
      inv.due_date,
      inv.client_name,
      inv.client_email || '',
      inv.client_phone || '',
      inv.client_address || '',
      inv.total_ht.toFixed(2),
      inv.total_vat.toFixed(2),
      inv.total_ttc.toFixed(2),
      inv.status,
      inv.payment_date || '',
      inv.payment_method || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Export des factures en format FEC (Fichier des Écritures Comptables)
   * Format normalisé pour la comptabilité française
   */
  static exportToFEC(invoices: Invoice[], settings: InvoiceSettings): string {
    const headers = [
      'JournalCode',
      'JournalLib',
      'EcritureNum',
      'EcritureDate',
      'CompteNum',
      'CompteLib',
      'CompAuxNum',
      'CompAuxLib',
      'PieceRef',
      'PieceDate',
      'EcritureLib',
      'Debit',
      'Credit',
      'EcritureLet',
      'DateLet',
      'ValidDate',
      'Montantdevise',
      'Idevise'
    ];

    const rows: string[][] = [];
    const journalCode = 'VT'; // VT = Ventes
    const journalLib = 'Journal des ventes';

    invoices.forEach(inv => {
      const dateFormat = inv.issue_date.replace(/-/g, '');

      // Ligne de débit client (411xxx)
      rows.push([
        journalCode,
        journalLib,
        inv.invoice_number,
        dateFormat,
        '411000', // Compte client
        'Clients',
        inv.client_name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase(),
        inv.client_name,
        inv.invoice_number,
        dateFormat,
        `Facture ${inv.invoice_number}`,
        inv.total_ttc.toFixed(2),
        '0.00',
        inv.status === 'paid' && inv.payment_date ? inv.payment_date.replace(/-/g, '') : '',
        inv.status === 'paid' && inv.payment_date ? inv.payment_date.replace(/-/g, '') : '',
        dateFormat,
        inv.total_ttc.toFixed(2),
        'FCFA'
      ]);

      // Ligne de crédit vente (707xxx)
      rows.push([
        journalCode,
        journalLib,
        inv.invoice_number,
        dateFormat,
        '707000', // Compte ventes
        'Ventes de marchandises',
        '',
        '',
        inv.invoice_number,
        dateFormat,
        `Facture ${inv.invoice_number}`,
        '0.00',
        inv.total_ht.toFixed(2),
        '',
        '',
        dateFormat,
        inv.total_ht.toFixed(2),
        'FCFA'
      ]);

      // Ligne de crédit TVA (445xxx)
      if (inv.total_vat > 0) {
        rows.push([
          journalCode,
          journalLib,
          inv.invoice_number,
          dateFormat,
          '445710', // TVA collectée
          'TVA collectée',
          '',
          '',
          inv.invoice_number,
          dateFormat,
          `TVA ${inv.vat_rate}% - Facture ${inv.invoice_number}`,
          '0.00',
          inv.total_vat.toFixed(2),
          '',
          '',
          dateFormat,
          inv.total_vat.toFixed(2),
          'FCFA'
        ]);
      }
    });

    const fecContent = [
      headers.join('|'),
      ...rows.map(row => row.join('|'))
    ].join('\n');

    return fecContent;
  }

  /**
   * Télécharge un fichier d'export
   */
  static downloadExport(content: string, filename: string, mimeType: string): void {
    const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Export et téléchargement en CSV
   */
  static async exportAndDownloadCSV(userId: string): Promise<void> {
    const invoices = await this.getUserInvoices(userId);
    const csv = this.exportToCSV(invoices);
    const filename = `factures_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadExport(csv, filename, 'text/csv');
  }

  /**
   * Export et téléchargement en FEC
   */
  static async exportAndDownloadFEC(userId: string): Promise<void> {
    const invoices = await this.getUserInvoices(userId);
    const settings = await this.getSettings(userId);
    if (!settings) throw new Error('Settings not found');

    const fec = this.exportToFEC(invoices, settings);
    const year = new Date().getFullYear();
    const filename = `${year}FEC${new Date().toISOString().split('T')[0].replace(/-/g, '')}.txt`;
    this.downloadExport(fec, filename, 'text/plain');
  }
}
