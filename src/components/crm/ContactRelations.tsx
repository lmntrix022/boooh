/**
 * ContactRelations Component
 * 
 * Composant modulaire pour afficher les relations d'un contact (commandes, rendez-vous, etc.)
 * Extrait de ContactCRMDetail.tsx pour améliorer la maintenabilité
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Download, ShoppingCart, Calendar, FileText, CreditCard,
  Eye, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface Relations {
  physicalOrders: any[];
  digitalOrders: any[];
  digitalPurchases: any[];
  appointments: any[];
  quotes: any[];
  invoices: any[];
}

interface ContactRelationsProps {
  relations: Relations;
  onItemClick: (type: string, item: any) => void;
  getStatusColor: (status: string) => string;
  cardId?: string | null;
}

export const ContactRelations: React.FC<ContactRelationsProps> = ({
  relations,
  onItemClick,
  getStatusColor,
  cardId
}) => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Commandes physiques */}
      {relations.physicalOrders.length > 0 && (
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <Package className="w-5 h-5 text-gray-600" />
              {t('crmDetail.relations.physicalOrders', { count: relations.physicalOrders.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relations.physicalOrders.map((order: any) => {
                const product = order.products as any;
                return (
                  <div 
                    key={order.id} 
                    className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-md rounded-lg border border-gray-200/50 hover:bg-gray-100 hover:border-gray-300 transition-colors group"
                  >
                    <div 
                      onClick={() => onItemClick('order', order)}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-light text-gray-900 group-hover:text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {product?.name || t('crmDetail.relations.product')}
                      </p>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('crmDetail.relations.quantity', { quantity: order.quantity })}</p>
                      <p className="text-xs text-gray-500 mt-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {order.created_at && !isNaN(new Date(order.created_at).getTime()) 
                          ? format(new Date(order.created_at), 'PPP', { locale: currentLanguage === 'fr' ? fr : enUS })
                          : t('crmDetail.timeline.noDate') || 'Date inconnue'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={cn(getStatusColor(order.status || 'pending'), "font-light")}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t(`crmDetail.status.${order.status || 'pending'}`) || order.status}
                        </Badge>
                        <p className="text-lg font-light text-gray-900 mt-1 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {((product?.price || 0) * (order.quantity || 1)).toLocaleString()} FCFA
                        </p>
                        <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 flex items-center gap-1 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          {t('crmDetail.relations.seeDetails')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(cardId ? `/cards/${cardId}/orders` : '/orders');
                        }}
                        className="border border-gray-200 text-gray-900 hover:bg-gray-50 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {t('crmDetail.relations.view')}
                      </Button>
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
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-gray-900" />
              {t('crmDetail.relations.digitalOrders', { count: relations.digitalOrders.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relations.digitalOrders.map((order: any) => {
                const product = order.digital_products as any;
                return (
                  <div 
                    key={order.id} 
                    className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-md rounded-lg border border-gray-200/50 hover:bg-gray-100 hover:border-gray-300 transition-colors group"
                  >
                    <div 
                      onClick={() => onItemClick('order', order)}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-light text-gray-900 group-hover:text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {product?.title || t('crmDetail.relations.digitalProduct')}
                      </p>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('crmDetail.relations.quantity', { quantity: order.quantity })}</p>
                      <p className="text-xs text-gray-500 mt-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {order.created_at && !isNaN(new Date(order.created_at).getTime()) 
                          ? format(new Date(order.created_at), 'PPP', { locale: currentLanguage === 'fr' ? fr : enUS })
                          : t('crmDetail.timeline.noDate') || 'Date inconnue'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={cn(getStatusColor(order.status || 'pending'), "font-light")}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t(`crmDetail.status.${order.status || 'pending'}`) || order.status}
                        </Badge>
                        <p className="text-lg font-light text-gray-900 mt-1 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {((product?.price || 0) * (order.quantity || 1)).toLocaleString()} FCFA
                        </p>
                        <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 flex items-center gap-1 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          {t('crmDetail.relations.seeDetails')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(cardId ? `/cards/${cardId}/orders` : '/orders');
                        }}
                        className="border border-gray-200 text-gray-900 hover:bg-gray-50 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {t('crmDetail.relations.view')}
                      </Button>
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
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {t('crmDetail.relations.digitalPurchases', { count: relations.digitalPurchases.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relations.digitalPurchases.map((purchase: any) => {
                const product = purchase.digital_products as any;
                return (
                  <div 
                    key={purchase.id} 
                    onClick={() => onItemClick('purchase', purchase)}
                    className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="font-light text-gray-900 group-hover:text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {product?.title || t('crmDetail.relations.digitalProduct')}
                      </p>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('crmDetail.relations.downloads', { current: purchase.download_count || 0, max: purchase.max_downloads || 1 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {purchase.created_at && !isNaN(new Date(purchase.created_at).getTime()) 
                          ? format(new Date(purchase.created_at), 'PPP', { locale: currentLanguage === 'fr' ? fr : enUS })
                          : t('crmDetail.timeline.noDate') || 'Date inconnue'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(getStatusColor(purchase.payment_status || 'completed'), "font-light")}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t(`crmDetail.status.${purchase.payment_status || 'completed'}`) || purchase.payment_status}
                      </Badge>
                      <p className="text-lg font-light text-gray-900 mt-1 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {(purchase.amount || 0).toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 flex items-center gap-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        {t('crmDetail.relations.seeDetails')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rendez-vous */}
      {relations.appointments.length > 0 && (
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-900" />
              {t('crmDetail.relations.appointments', { count: relations.appointments.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relations.appointments.map((apt: any) => (
                <div 
                  key={apt.id} 
                  className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-md rounded-lg border border-gray-200/50 hover:bg-gray-100 hover:border-gray-300 transition-colors group"
                >
                  <div 
                    onClick={() => onItemClick('appointment', apt)}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-light text-gray-900 group-hover:text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {apt.date && !isNaN(new Date(apt.date).getTime()) 
                        ? format(new Date(apt.date), 'PPP', { locale: currentLanguage === 'fr' ? fr : enUS })
                        : t('crmDetail.timeline.noDate') || 'Date inconnue'}
                    </p>
                    <p className="text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('crmDetail.relations.duration', { duration: apt.duration || 60 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {apt.notes || t('crmDetail.relations.noNotes')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(getStatusColor(apt.status || 'pending'), "font-light")}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t(`crmDetail.status.${apt.status || 'pending'}`) || apt.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(cardId ? `/cards/${cardId}/appointments` : '/appointments');
                      }}
                      className="border border-gray-200 text-gray-900 hover:bg-gray-50 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t('crmDetail.relations.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devis */}
      {relations.quotes.length > 0 && (
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <FileText className="w-5 h-5 text-gray-600" />
              {t('crmDetail.relations.quotes', { count: relations.quotes.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relations.quotes.map((quote: any) => (
                <div 
                  key={quote.id} 
                  onClick={() => onItemClick('quote', quote)}
                  className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer group"
                >
                  <div>
                    <p className="font-light text-gray-900 group-hover:text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {quote.service_requested || t('crmDetail.relations.service')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {quote.budget_range || t('crmDetail.relations.budgetNotSpecified')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {quote.created_at && !isNaN(new Date(quote.created_at).getTime()) 
                        ? format(new Date(quote.created_at), 'PPP', { locale: currentLanguage === 'fr' ? fr : enUS })
                        : t('crmDetail.timeline.noDate') || 'Date inconnue'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge className={cn(getStatusColor(quote.status || 'new'), "font-light")}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t(`crmDetail.status.${quote.status || 'new'}`) || quote.status}
                      </Badge>
                      {quote.quote_amount && (
                        <p className="text-lg font-light text-gray-900 mt-1 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {quote.quote_amount.toLocaleString()} FCFA
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/portfolio/projects');
                      }}
                      className="border border-gray-200 text-gray-900 hover:bg-gray-50 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t('crmDetail.relations.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Factures */}
      {relations.invoices.length > 0 && (
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <CreditCard className="w-5 h-5 text-gray-600" />
              {t('crmDetail.relations.invoices', { count: relations.invoices.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relations.invoices.map((invoice: any) => (
                <div 
                  key={invoice.id} 
                  onClick={() => onItemClick('invoice', invoice)}
                  className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer group"
                >
                  <div>
                    <p className="font-light text-gray-900 group-hover:text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {invoice.invoice_number || t('crmDetail.relations.invoice')}
                    </p>
                    <p className="text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {(invoice.issue_date || invoice.created_at) && !isNaN(new Date(invoice.issue_date || invoice.created_at).getTime())
                        ? format(new Date(invoice.issue_date || invoice.created_at), 'PPP', { locale: currentLanguage === 'fr' ? fr : enUS })
                        : t('crmDetail.timeline.noDate') || 'Date inconnue'}
                    </p>
                    {invoice.due_date && !isNaN(new Date(invoice.due_date).getTime()) && (
                      <p className="text-xs text-gray-500 mt-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('crmDetail.relations.dueDate')}: {format(new Date(invoice.due_date), 'PPP', { locale: currentLanguage === 'fr' ? fr : enUS })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge className={cn(getStatusColor(invoice.status || 'draft'), "font-light")}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t(`crmDetail.status.${invoice.status || 'draft'}`) || invoice.status}
                      </Badge>
                      <p className="text-lg font-light text-gray-900 mt-1 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {(invoice.total_ttc || 0).toLocaleString()} FCFA
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/facture');
                      }}
                      className="border-emerald-200 text-gray-900 hover:bg-emerald-50"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t('crmDetail.relations.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucune relation */}
      {relations.physicalOrders.length === 0 &&
       relations.digitalOrders.length === 0 &&
       relations.digitalPurchases.length === 0 &&
       relations.appointments.length === 0 &&
       relations.quotes.length === 0 &&
       relations.invoices.length === 0 && (
        <div className="text-center py-16 text-gray-600 bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200/50">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">{t('crmDetail.relations.empty')}</p>
          <p className="text-sm mt-2">{t('crmDetail.relations.emptyDescription')}</p>
        </div>
      )}
    </div>
  );
};

export default ContactRelations;
