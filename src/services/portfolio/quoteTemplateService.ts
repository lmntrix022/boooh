/**
 * Quote Template Service - Phase 2
 * CRUD for reusable quote templates
 */

import { supabase } from '@/integrations/supabase/client';

export interface QuoteTemplateItem {
  id: string;
  template_id: string;
  title: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  unit?: string;
  vat_rate?: number;
  order_index: number;
}

export interface QuoteTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteTemplateWithItems extends QuoteTemplate {
  items: QuoteTemplateItem[];
}

export class QuoteTemplateService {
  static async getTemplates(userId: string): Promise<QuoteTemplateWithItems[]> {
    const { data: templates, error: tError } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (tError) throw tError;

    const results: QuoteTemplateWithItems[] = [];
    for (const t of templates || []) {
      const { data: items } = await supabase
        .from('quote_template_items')
        .select('*')
        .eq('template_id', t.id)
        .order('order_index')
        .order('created_at');

      results.push({
        ...t,
        items: (items || []) as QuoteTemplateItem[],
      });
    }
    return results;
  }

  static async getTemplate(
    templateId: string,
    userId: string
  ): Promise<QuoteTemplateWithItems | null> {
    const { data: template, error: tError } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (tError || !template) return null;

    const { data: items } = await supabase
      .from('quote_template_items')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index')
      .order('created_at');

    return {
      ...template,
      items: (items || []) as QuoteTemplateItem[],
    };
  }

  static async createTemplate(
    userId: string,
    data: { name: string; description?: string; items: Omit<QuoteTemplateItem, 'id' | 'template_id'>[] }
  ): Promise<QuoteTemplateWithItems> {
    const { data: template, error: tError } = await supabase
      .from('quote_templates')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description || null,
      })
      .select()
      .single();

    if (tError) throw tError;

    const items: QuoteTemplateItem[] = [];
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      const { data: inserted } = await supabase
        .from('quote_template_items')
        .insert({
          template_id: template.id,
          title: it.title,
          description: it.description || null,
          quantity: it.quantity ?? 1,
          unit_price: it.unit_price,
          unit: it.unit || 'unité',
          vat_rate: it.vat_rate ?? 0,
          order_index: i,
        })
        .select()
        .single();
      if (inserted) items.push(inserted as QuoteTemplateItem);
    }

    return { ...template, items };
  }

  static async updateTemplate(
    templateId: string,
    userId: string,
    data: { name?: string; description?: string; items?: Omit<QuoteTemplateItem, 'id' | 'template_id'>[] }
  ): Promise<QuoteTemplateWithItems> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name != null) updates.name = data.name;
    if (data.description != null) updates.description = data.description;

    const { data: template, error: tError } = await supabase
      .from('quote_templates')
      .update(updates)
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .single();

    if (tError) throw tError;

    if (data.items != null) {
      await supabase.from('quote_template_items').delete().eq('template_id', templateId);
      for (let i = 0; i < data.items.length; i++) {
        const it = data.items[i];
        await supabase.from('quote_template_items').insert({
          template_id: templateId,
          title: it.title,
          description: it.description || null,
          quantity: it.quantity ?? 1,
          unit_price: it.unit_price,
          unit: it.unit || 'unité',
          vat_rate: it.vat_rate ?? 0,
          order_index: i,
        });
      }
    }

    return this.getTemplate(templateId, userId) as Promise<QuoteTemplateWithItems>;
  }

  static async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('quote_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  /** Calcule le total HT d'un template */
  static getTemplateTotal(items: { quantity: number; unit_price: number }[]): number {
    return items.reduce((sum, it) => sum + (it.quantity || 1) * (it.unit_price || 0), 0);
  }
}
