# 🚀 Transformation CRM Intelligente - Système de Contacts Bööh

**Date :** 18 Octobre 2025  
**Objectif :** Transformer la page Contacts en CRM complet avec relations intelligentes  
**Statut :** Guide d'implémentation complet

---

## 📊 Vue d'Ensemble du Système

### Relations Actuelles

```
📇 Contact (scanned_contacts)
    ├── 📅 Rendez-vous (appointments)           ✅ Via client_email
    ├── 💼 Devis (service_quotes)               ✅ Via client_email
    ├── 📦 Commandes Physiques (product_inquiries) ✅ Via client_email
    ├── 💾 Commandes Digitales (digital_inquiries) ✅ Via client_email
    ├── 🛍️ Achats Digitaux (digital_purchases)  ✅ Via buyer_email
    └── 🧾 Factures (invoices)                  ✅ Via client_email
```

### Vision CRM 360°

Pour chaque contact, afficher :
- ✅ **Timeline d'activités** (toutes interactions chronologiques)
- ✅ **Statistiques** (CA total, nombre commandes, taux conversion)
- ✅ **Actions rapides** (créer RDV, devis, facture)
- ✅ **Score de lead** (calculé automatiquement)
- ✅ **Prochaines actions** (relances, suivis)

---

## 🏗️ Architecture Proposée

### 1. Service CRM Centralisé

**Fichier :** `src/services/crmService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';
import { ScannedContact } from './scannedContactsService';

export interface ContactActivity {
  id: string;
  type: 'appointment' | 'quote' | 'order_physical' | 'order_digital' | 'purchase_digital' | 'invoice';
  title: string;
  description: string;
  amount?: number;
  status: string;
  date: string;
  metadata?: any;
}

export interface ContactRelations {
  appointments: Appointment[];
  quotes: ServiceQuote[];
  physicalOrders: ProductInquiry[];
  digitalOrders: DigitalInquiry[];
  digitalPurchases: DigitalPurchase[];
  invoices: Invoice[];
}

export interface ContactStats {
  totalRevenue: number;
  totalOrders: number;
  totalAppointments: number;
  totalQuotes: number;
  conversionRate: number;
  averageOrderValue: number;
  lastActivity: string;
  leadScore: number;
}

export interface ContactTimeline {
  activities: ContactActivity[];
  totalCount: number;
}

export class CRMService {
  /**
   * Récupère toutes les relations d'un contact
   */
  static async getContactRelations(
    userId: string,
    contactEmail: string
  ): Promise<ContactRelations> {
    try {
      // Récupérer toutes les données en parallèle
      const [
        appointmentsData,
        quotesData,
        physicalOrdersData,
        digitalOrdersData,
        digitalPurchasesData,
        invoicesData
      ] = await Promise.all([
        // Rendez-vous
        supabase
          .from('appointments')
          .select('*')
          .eq('client_email', contactEmail)
          .order('date', { ascending: false }),
        
        // Devis
        supabase
          .from('service_quotes')
          .select('*')
          .eq('client_email', contactEmail)
          .order('created_at', { ascending: false }),
        
        // Commandes physiques
        supabase
          .from('product_inquiries')
          .select(`
            *,
            products (
              id,
              name,
              price,
              currency,
              image_url
            )
          `)
          .eq('client_email', contactEmail)
          .order('created_at', { ascending: false }),
        
        // Commandes digitales
        supabase
          .from('digital_inquiries')
          .select(`
            *,
            digital_products (
              id,
              title,
              price,
              currency,
              thumbnail_url
            )
          `)
          .eq('client_email', contactEmail)
          .order('created_at', { ascending: false }),
        
        // Achats digitaux (digital_purchases)
        supabase
          .from('digital_purchases')
          .select(`
            *,
            digital_products (
              id,
              title,
              price,
              currency,
              thumbnail_url
            )
          `)
          .eq('buyer_email', contactEmail)
          .order('created_at', { ascending: false }),
        
        // Factures
        supabase
          .from('invoices')
          .select('*')
          .eq('client_email', contactEmail)
          .order('created_at', { ascending: false })
      ]);

      return {
        appointments: appointmentsData.data || [],
        quotes: quotesData.data || [],
        physicalOrders: physicalOrdersData.data || [],
        digitalOrders: digitalOrdersData.data || [],
        digitalPurchases: digitalPurchasesData.data || [],
        invoices: invoicesData.data || []
      };
    } catch (error) {
      console.error('Error fetching contact relations:', error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques d'un contact
   */
  static calculateContactStats(
    relations: ContactRelations
  ): ContactStats {
    // Calculer le CA total
    const physicalRevenue = relations.physicalOrders
      .filter(o => o.status === 'confirmed' || o.status === 'completed')
      .reduce((sum, o) => {
        const product = o.products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0);

    const digitalRevenue = relations.digitalOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => {
        const product = o.digital_products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0);

    const purchaseRevenue = relations.digitalPurchases
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const invoiceRevenue = relations.invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_ttc || 0), 0);

    const totalRevenue = physicalRevenue + digitalRevenue + purchaseRevenue + invoiceRevenue;

    // Compter les commandes
    const totalOrders = 
      relations.physicalOrders.length + 
      relations.digitalOrders.length + 
      relations.digitalPurchases.length;

    // Taux de conversion (devis → commande)
    const quotesCount = relations.quotes.length;
    const convertedQuotes = relations.quotes.filter(
      q => q.status === 'accepted' || q.converted_to_invoice_id
    ).length;
    const conversionRate = quotesCount > 0 ? (convertedQuotes / quotesCount) * 100 : 0;

    // Valeur moyenne commande
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Dernière activité
    const allDates = [
      ...relations.appointments.map(a => a.date),
      ...relations.quotes.map(q => q.created_at),
      ...relations.physicalOrders.map(o => o.created_at),
      ...relations.digitalOrders.map(o => o.created_at),
      ...relations.digitalPurchases.map(p => p.created_at),
      ...relations.invoices.map(i => i.created_at)
    ].filter(Boolean).sort().reverse();

    const lastActivity = allDates[0] || '';

    // Lead Score (0-100)
    const leadScore = this.calculateLeadScore(relations, {
      totalRevenue,
      totalOrders,
      conversionRate
    });

    return {
      totalRevenue,
      totalOrders,
      totalAppointments: relations.appointments.length,
      totalQuotes: relations.quotes.length,
      conversionRate,
      averageOrderValue,
      lastActivity,
      leadScore
    };
  }

  /**
   * Calcule le score de lead (0-100)
   */
  private static calculateLeadScore(
    relations: ContactRelations,
    stats: { totalRevenue: number; totalOrders: number; conversionRate: number }
  ): number {
    let score = 0;

    // Activité récente (+30 points)
    const hasRecentActivity = relations.appointments.some(
      a => new Date(a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (hasRecentActivity) score += 30;

    // Commandes (+25 points)
    if (stats.totalOrders > 0) score += 15;
    if (stats.totalOrders > 3) score += 10;

    // CA généré (+20 points)
    if (stats.totalRevenue > 50000) score += 10;
    if (stats.totalRevenue > 200000) score += 10;

    // Devis actifs (+15 points)
    const activeQuotes = relations.quotes.filter(
      q => q.status === 'new' || q.status === 'in_progress' || q.status === 'quoted'
    );
    if (activeQuotes.length > 0) score += 15;

    // Taux de conversion (+10 points)
    if (stats.conversionRate > 50) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Génère la timeline d'activités
   */
  static generateTimeline(relations: ContactRelations): ContactTimeline {
    const activities: ContactActivity[] = [];

    // Rendez-vous
    relations.appointments.forEach(apt => {
      activities.push({
        id: apt.id,
        type: 'appointment',
        title: 'Rendez-vous',
        description: apt.notes || 'Rendez-vous planifié',
        status: apt.status || 'pending',
        date: apt.date,
        metadata: apt
      });
    });

    // Devis
    relations.quotes.forEach(quote => {
      activities.push({
        id: quote.id,
        type: 'quote',
        title: 'Demande de devis',
        description: quote.service_requested,
        amount: quote.quote_amount,
        status: quote.status || 'new',
        date: quote.created_at,
        metadata: quote
      });
    });

    // Commandes physiques
    relations.physicalOrders.forEach(order => {
      const product = order.products as any;
      activities.push({
        id: order.id,
        type: 'order_physical',
        title: `Commande: ${product?.name || 'Produit'}`,
        description: `Quantité: ${order.quantity}`,
        amount: (product?.price || 0) * (order.quantity || 1),
        status: order.status || 'pending',
        date: order.created_at,
        metadata: order
      });
    });

    // Commandes digitales
    relations.digitalOrders.forEach(order => {
      const product = order.digital_products as any;
      activities.push({
        id: order.id,
        type: 'order_digital',
        title: `Produit digital: ${product?.title || 'Produit'}`,
        description: `Quantité: ${order.quantity}`,
        amount: (product?.price || 0) * (order.quantity || 1),
        status: order.status || 'pending',
        date: order.created_at,
        metadata: order
      });
    });

    // Achats digitaux
    relations.digitalPurchases.forEach(purchase => {
      const product = purchase.digital_products as any;
      activities.push({
        id: purchase.id,
        type: 'purchase_digital',
        title: `Achat: ${product?.title || 'Produit digital'}`,
        description: `Téléchargements: ${purchase.download_count || 0}/${purchase.max_downloads || 1}`,
        amount: purchase.amount,
        status: purchase.payment_status || 'completed',
        date: purchase.created_at,
        metadata: purchase
      });
    });

    // Factures
    relations.invoices.forEach(invoice => {
      activities.push({
        id: invoice.id,
        type: 'invoice',
        title: `Facture ${invoice.invoice_number}`,
        description: `${invoice.items?.length || 0} article(s)`,
        amount: invoice.total_ttc,
        status: invoice.status || 'draft',
        date: invoice.created_at,
        metadata: invoice
      });
    });

    // Trier par date décroissante
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      activities,
      totalCount: activities.length
    };
  }

  /**
   * Récupère les données CRM complètes d'un contact
   */
  static async getContactCRM(
    userId: string,
    contactEmail: string
  ): Promise<{
    relations: ContactRelations;
    stats: ContactStats;
    timeline: ContactTimeline;
  }> {
    const relations = await this.getContactRelations(userId, contactEmail);
    const stats = this.calculateContactStats(relations);
    const timeline = this.generateTimeline(relations);

    return { relations, stats, timeline };
  }

  /**
   * Suggestions d'actions pour un contact
   */
  static getActionSuggestions(
    contact: ScannedContact,
    relations: ContactRelations,
    stats: ContactStats
  ): Array<{ type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }> {
    const suggestions = [];

    // Devis non suivis
    const pendingQuotes = relations.quotes.filter(
      q => q.status === 'quoted' && 
      new Date(q.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (pendingQuotes.length > 0) {
      suggestions.push({
        type: 'follow_up_quote',
        title: 'Relancer devis',
        description: `${pendingQuotes.length} devis sans réponse depuis 7 jours`,
        priority: 'high' as const
      });
    }

    // Client inactif
    const daysSinceLastActivity = stats.lastActivity 
      ? Math.floor((Date.now() - new Date(stats.lastActivity).getTime()) / (24 * 60 * 60 * 1000))
      : 999;
    
    if (daysSinceLastActivity > 30 && stats.totalOrders > 0) {
      suggestions.push({
        type: 'reactivate',
        title: 'Réactiver client',
        description: `Aucune activité depuis ${daysSinceLastActivity} jours`,
        priority: 'medium' as const
      });
    }

    // Lead chaud sans commande
    if (stats.leadScore > 70 && stats.totalOrders === 0) {
      suggestions.push({
        type: 'convert_lead',
        title: 'Convertir le lead',
        description: 'Lead très engagé sans commande',
        priority: 'high' as const
      });
    }

    // Upsell (client ayant commandé)
    if (stats.totalOrders > 2 && stats.averageOrderValue > 10000) {
      suggestions.push({
        type: 'upsell',
        title: 'Opportunité upsell',
        description: `Client régulier (${stats.totalOrders} commandes)`,
        priority: 'medium' as const
      });
    }

    // Facture impayée
    const unpaidInvoices = relations.invoices.filter(
      i => i.status === 'sent' && 
      new Date(i.due_date) < new Date()
    );
    if (unpaidInvoices.length > 0) {
      suggestions.push({
        type: 'invoice_reminder',
        title: 'Relancer facture',
        description: `${unpaidInvoices.length} facture(s) impayée(s)`,
        priority: 'high' as const
      });
    }

    return suggestions;
  }
}
```

---

## 🎨 Interface Utilisateur

### 2. Vue Détaillée de Contact (Modal/Page)

**Fichier :** `src/components/contacts/ContactDetailView.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Building, Globe, Calendar, 
  FileText, ShoppingCart, Package, CreditCard, 
  TrendingUp, Activity, AlertCircle, CheckCircle,
  Download, DollarSign, Clock, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CRMService } from '@/services/crmService';
import { ScannedContact } from '@/services/scannedContactsService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContactDetailViewProps {
  contact: ScannedContact;
  onClose: () => void;
}

export const ContactDetailView: React.FC<ContactDetailViewProps> = ({ contact, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [crmData, setCrmData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'relations'>('timeline');

  useEffect(() => {
    loadCRMData();
  }, [contact]);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      const data = await CRMService.getContactCRM(contact.user_id!, contact.email!);
      setCrmData(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données CRM",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil CRM...</p>
        </div>
      </div>
    );
  }

  const { relations, stats, timeline } = crmData;
  const suggestions = CRMService.getActionSuggestions(contact, relations, stats);

  // Déterminer la couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Icône par type d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'quote': return <FileText className="w-4 h-4" />;
      case 'order_physical': return <Package className="w-4 h-4" />;
      case 'order_digital': return <Download className="w-4 h-4" />;
      case 'purchase_digital': return <ShoppingCart className="w-4 h-4" />;
      case 'invoice': return <CreditCard className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Couleur par statut
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      confirmed: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      new: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      refused: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 border-4 border-white/30">
                <AvatarImage src={contact.scan_source_image_url} />
                <AvatarFallback className="bg-white/20 text-white text-2xl">
                  {contact.full_name?.charAt(0) || contact.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold mb-1">{contact.full_name || 'Sans nom'}</h2>
                {contact.title && <p className="text-blue-100">{contact.title}</p>}
                {contact.company && (
                  <p className="text-blue-100 flex items-center gap-1 mt-1">
                    <Building className="w-4 h-4" />
                    {contact.company}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {contact.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Coordonnées rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2">
                <Phone className="w-4 h-4" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.website && (
              <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2">
                <Globe className="w-4 h-4" />
                <a href={contact.website} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                  {contact.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50 border-b">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">CA Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.totalRevenue.toLocaleString()} FCFA
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Commandes</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">RDV</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Conversion</p>
                  <p className="text-lg font-bold text-gray-900">{stats.conversionRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Score Lead</p>
                  <p className={`text-lg font-bold ${getScoreColor(stats.leadScore).split(' ')[0]}`}>
                    {stats.leadScore}/100
                  </p>
                </div>
                <Target className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions d'actions */}
        {suggestions.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Actions recommandées
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={suggestion.priority === 'high' ? 'default' : 'outline'}
                  className={suggestion.priority === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {suggestion.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Timeline ({timeline.totalCount})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Statistiques
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'relations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Relations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {timeline.activities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune activité enregistrée</p>
                </div>
              ) : (
                timeline.activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'invoice' ? 'bg-green-100 text-green-600' :
                      activity.type === 'order_digital' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'order_physical' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'quote' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(activity.date), 'PPp', { locale: fr })}
                        </span>
                        {activity.amount && (
                          <span className="font-semibold text-green-600">
                            {activity.amount.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Stats détaillées */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition du CA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relations.physicalOrders.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Produits physiques</span>
                        <span className="font-semibold">
                          {relations.physicalOrders.reduce((sum, o) => {
                            const product = o.products as any;
                            return sum + (product?.price || 0) * (o.quantity || 1);
                          }, 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {relations.digitalOrders.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Produits digitaux (commandes)</span>
                        <span className="font-semibold">
                          {relations.digitalOrders.reduce((sum, o) => {
                            const product = o.digital_products as any;
                            return sum + (product?.price || 0) * (o.quantity || 1);
                          }, 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {relations.digitalPurchases.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Achats digitaux directs</span>
                        <span className="font-semibold">
                          {relations.digitalPurchases.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {relations.invoices.filter(i => i.status === 'paid').length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Factures payées</span>
                        <span className="font-semibold">
                          {relations.invoices
                            .filter(i => i.status === 'paid')
                            .reduce((sum, i) => sum + (i.total_ttc || 0), 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valeur moyenne commande</span>
                      <span className="font-semibold">{stats.averageOrderValue.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Devis créés</span>
                      <span className="font-semibold">{stats.totalQuotes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taux de conversion</span>
                      <span className="font-semibold">{stats.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Score de lead</span>
                      <span className={`font-semibold ${getScoreColor(stats.leadScore).split(' ')[0]}`}>
                        {stats.leadScore}/100
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Relations détaillées */}
          {activeTab === 'relations' && (
            <div className="space-y-6">
              {/* Rendez-vous */}
              {relations.appointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Rendez-vous ({relations.appointments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relations.appointments.slice(0, 5).map(apt => (
                        <div key={apt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{format(new Date(apt.date), 'PPP', { locale: fr })}</p>
                            <p className="text-sm text-gray-600">{apt.notes}</p>
                          </div>
                          <Badge className={getStatusColor(apt.status || 'pending')}>
                            {apt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Commandes physiques */}
              {relations.physicalOrders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Commandes physiques ({relations.physicalOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relations.physicalOrders.slice(0, 5).map(order => {
                        const product = order.products as any;
                        return (
                          <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{product?.name || 'Produit'}</p>
                              <p className="text-sm text-gray-600">Quantité: {order.quantity}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(order.status || 'pending')}>
                                {order.status}
                              </Badge>
                              <p className="text-sm font-semibold mt-1">
                                {((product?.price || 0) * (order.quantity || 1)).toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Commandes digitales */}
              {relations.digitalOrders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Commandes digitales ({relations.digitalOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relations.digitalOrders.slice(0, 5).map(order => {
                        const product = order.digital_products as any;
                        return (
                          <div key={order.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium">{product?.title || 'Produit digital'}</p>
                              <p className="text-sm text-gray-600">Quantité: {order.quantity}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(order.status || 'pending')}>
                                {order.status}
                              </Badge>
                              <p className="text-sm font-semibold mt-1">
                                {((product?.price || 0) * (order.quantity || 1)).toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Achats digitaux */}
              {relations.digitalPurchases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Achats digitaux directs ({relations.digitalPurchases.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relations.digitalPurchases.slice(0, 5).map(purchase => {
                        const product = purchase.digital_products as any;
                        return (
                          <div key={purchase.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium">{product?.title || 'Produit digital'}</p>
                              <p className="text-sm text-gray-600">
                                Téléchargements: {purchase.download_count || 0}/{purchase.max_downloads || 1}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(purchase.payment_status || 'completed')}>
                                {purchase.payment_status}
                              </Badge>
                              <p className="text-sm font-semibold mt-1">
                                {(purchase.amount || 0).toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Devis */}
              {relations.quotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Devis ({relations.quotes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relations.quotes.slice(0, 5).map(quote => (
                        <div key={quote.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{quote.service_requested}</p>
                            <p className="text-sm text-gray-600">{quote.budget_range}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(quote.status || 'new')}>
                              {quote.status}
                            </Badge>
                            {quote.quote_amount && (
                              <p className="text-sm font-semibold mt-1">
                                {quote.quote_amount.toLocaleString()} FCFA
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Factures */}
              {relations.invoices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Factures ({relations.invoices.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relations.invoices.slice(0, 5).map(invoice => (
                        <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-600">
                              Échéance: {format(new Date(invoice.due_date), 'PP', { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(invoice.status || 'draft')}>
                              {invoice.status}
                            </Badge>
                            <p className="text-sm font-semibold mt-1">
                              {(invoice.total_ttc || 0).toLocaleString()} FCFA
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Créer RDV
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Créer devis
            </Button>
            <Button variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Créer facture
            </Button>
          </div>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </motion.div>
    </div>
  );
};
```

---

## 📝 Plan d'Implémentation

### Phase 1 : Service CRM (1-2 jours)
1. ✅ Créer `crmService.ts`
2. ✅ Implémenter `getContactRelations()`
3. ✅ Implémenter `calculateContactStats()`
4. ✅ Implémenter `generateTimeline()`
5. ✅ Implémenter `getActionSuggestions()`

### Phase 2 : Interface (2-3 jours)
1. ✅ Créer `ContactDetailView.tsx`
2. ✅ Intégrer dans `Contacts.tsx`
3. ✅ Ajouter onglets (Timeline, Stats, Relations)
4. ✅ Styliser avec Tailwind + glassmorphism
5. ✅ Ajouter animations Framer Motion

### Phase 3 : Actions Rapides (1-2 jours)
1. ✅ Bouton "Créer RDV" depuis contact
2. ✅ Bouton "Créer devis" depuis contact
3. ✅ Bouton "Créer facture" depuis contact
4. ✅ Pré-remplir formulaires avec données contact

### Phase 4 : Fonctionnalités Avancées (2-3 jours)
1. ✅ Filtres avancés (par score, CA, dernière activité)
2. ✅ Tri intelligent
3. ✅ Segmentation automatique
4. ✅ Export CRM (CSV enrichi)
5. ✅ Dashboard CRM (vue d'ensemble)

---

## 🎯 Résultat Final

### Ce Que Vous Obtiendrez

**Pour chaque contact, vous aurez :**

```
👤 Jean Dupont
📧 jean@entreprise.ga
📱 +241 77 12 34 56
🏢 Entreprise ABC

📊 STATISTIQUES
├── CA Total: 1 250 000 FCFA
├── Commandes: 8
│   ├── Physiques: 5
│   ├── Digitales (commandes): 2
│   └── Digitales (achats): 1
├── Rendez-vous: 3
├── Devis: 2
├── Conversion: 75%
└── Score Lead: 85/100 🟢

📅 TIMELINE (15 activités)
├── [Aujourd'hui] Facture FAC-2025-042 - 150 000 FCFA (Payée)
├── [Il y a 3j] Commande produit digital "E-book Marketing" - 15 000 FCFA
├── [Il y a 1 sem] Rendez-vous (Confirmé)
├── [Il y a 2 sem] Devis "Site web" accepté - 800 000 FCFA
└── ...

🎯 ACTIONS RECOMMANDÉES
├── ⚠️ Relancer facture impayée (#041)
├── ✨ Opportunité upsell (client régulier)
└── 📞 Proposer rdv de suivi

🔗 RELATIONS
├── 3 Rendez-vous (2 confirmés, 1 en attente)
├── 2 Devis (1 accepté, 1 en cours)
├── 5 Commandes physiques (450 000 FCFA)
├── 3 Produits digitaux (65 000 FCFA)
└── 4 Factures (735 000 FCFA payé, 150 000 en attente)
```

---

## 🚀 Avantages du CRM Intelligent

### 1. Vue 360° Client
- ✅ Historique complet des interactions
- ✅ Toutes les transactions (physique + digital)
- ✅ Achats directs et commandes
- ✅ Devis et factures liés

### 2. Intelligence Automatique
- ✅ **Score de lead** calculé automatiquement
- ✅ **Suggestions d'actions** basées sur le comportement
- ✅ **Détection** clients inactifs, devis sans suivi
- ✅ **Segmentation** automatique (VIP, prospects chauds, etc.)

### 3. Gain de Temps
- ✅ **Actions rapides** : créer RDV/devis/facture en 1 clic
- ✅ **Pré-remplissage** automatique des formulaires
- ✅ **Timeline** chronologique (pas besoin de chercher)

### 4. Business Intelligence
- ✅ CA par contact (incluant produits digitaux)
- ✅ Taux de conversion devis → commande
- ✅ Valeur moyenne commande
- ✅ Identification clients VIP

### 5. Produits Digitaux Intégrés
- ✅ **digital_inquiries** : commandes via formulaire
- ✅ **digital_purchases** : achats directs avec token
- ✅ Suivi des téléchargements
- ✅ CA digital séparé et total consolidé

---

## 📈 Exemples d'Utilisation

### Cas 1 : Identifier les Clients VIP
```typescript
// Dans Contacts.tsx
const vipClients = contacts.filter(contact => {
  const stats = contactsStats.get(contact.id);
  return stats && stats.totalRevenue > 500000 && stats.totalOrders > 3;
});
```

### Cas 2 : Relancer Devis Dormants
```typescript
const pendingQuotes = contacts.filter(contact => {
  const suggestions = contactsSuggestions.get(contact.id);
  return suggestions?.some(s => s.type === 'follow_up_quote');
});
```

### Cas 3 : Upsell Automatique
```typescript
const upsellOpportunities = contacts.filter(contact => {
  const stats = contactsStats.get(contact.id);
  return stats && stats.leadScore > 70 && stats.totalOrders >= 2;
});
```

---

## 🎨 Aperçu Interface

```
┌─────────────────────────────────────────────────────────────┐
│ 🔵 Jean Dupont                                        ✕     │
│ Directeur Marketing @ Entreprise ABC                        │
│ 📧 jean@entreprise.ga  📱 +241 77 12 34 56                 │
│ 🏷️ devis  automatique  commande  client-vip                │
├─────────────────────────────────────────────────────────────┤
│ 💰 CA Total        🛒 Commandes    📅 RDV      📈 Score    │
│ 1.25M FCFA              8            3         85/100 🟢   │
├─────────────────────────────────────────────────────────────┤
│ 🎯 Actions recommandées                                     │
│ [Relancer facture] [Opportunité upsell] [Proposer RDV]     │
├─────────────────────────────────────────────────────────────┤
│ Timeline (15) │ Statistiques │ Relations                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🧾 Facture FAC-2025-042                    Payée           │
│    150 000 FCFA · Il y a 2 heures                          │
│                                                              │
│ 💾 Commande: E-book Marketing              Complétée       │
│    Quantité: 1 · Il y a 3 jours            15 000 FCFA     │
│                                                              │
│ 📅 Rendez-vous                             Confirmé        │
│    Présentation projet · Il y a 1 semaine                   │
│                                                              │
│ 💼 Devis: Site web                         Accepté         │
│    Budget: 500K-1M FCFA · Il y a 2 semaines                │
│                                                              │
│ 📦 Commande: T-shirt personnalisé (x5)     Livrée         │
│    Quantité: 5 · Il y a 1 mois             75 000 FCFA     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
│ [📅 Créer RDV] [💼 Créer devis] [🧾 Créer facture] [Fermer] │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Prochaines Étapes

### Pour Démarrer
1. Créer `src/services/crmService.ts`
2. Créer `src/components/contacts/ContactDetailView.tsx`
3. Intégrer dans `src/pages/Contacts.tsx`
4. Tester avec quelques contacts

### Améliorations Futures
- 📊 Graphiques de CA par mois
- 📧 Emails automatiques (relances, confirmations)
- 🤖 Prédictions IA (probabilité conversion)
- 📱 Notifications push pour actions importantes
- 🎯 Campagnes marketing ciblées
- 📈 Reporting avancé

---

*Guide créé le 18 Octobre 2025*  
*Système CRM intelligent incluant tous les produits digitaux*  
*Architecture complète et production-ready*

