import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Building, Globe, Calendar, 
  FileText, ShoppingCart, Package, CreditCard, 
  TrendingUp, Activity, AlertCircle, CheckCircle,
  Download, DollarSign, Clock, Target, ArrowLeft, Zap,
  Award, Edit, Trash2, X, Eye, ExternalLink
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CRMService } from '@/services/crmService';
import { AIPredictionService } from '@/services/aiPredictionService';
import { RFMSegmentationService } from '@/services/rfmSegmentationService';
import { ScannedContactsService, ScannedContact } from '@/services/scannedContactsService';
import { CommunicationCenter } from '@/components/crm/CommunicationCenter';
import { ContactNotes } from '@/components/crm/ContactNotes';
import { ContactHeader } from '@/components/crm/ContactHeader';
import { ContactStats } from '@/components/crm/ContactStats';
import { ContactActions } from '@/components/crm/ContactActions';
import { ContactTimeline } from '@/components/crm/ContactTimeline';
import { ContactRelations } from '@/components/crm/ContactRelations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

const ContactCRMDetail: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<ScannedContact | null>(null);
  const [crmData, setCrmData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'relations' | 'predictions' | 'communication' | 'notes'>('timeline');
  const [rfmScores, setRfmScores] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [cardId, setCardId] = useState<string | null>(null);

  // États pour les modals de prévisualisation
  const [previewModal, setPreviewModal] = useState<{
    type: 'order' | 'purchase' | 'appointment' | 'quote' | 'invoice' | null;
    data: any;
  }>({ type: null, data: null });

  useEffect(() => {
    if (contactId && user) {
      loadContactData();
    }
  }, [contactId, user]);

  // Fonction pour récupérer l'ID de la carte depuis les relations
  const getCardIdFromRelations = (relations: any): string | null => {
    // Chercher dans les commandes physiques
    if (relations.physicalOrders && relations.physicalOrders.length > 0) {
      return relations.physicalOrders[0].card_id;
    }
    
    // Chercher dans les commandes digitales
    if (relations.digitalOrders && relations.digitalOrders.length > 0) {
      return relations.digitalOrders[0].card_id;
    }
    
    // Chercher dans les achats digitaux
    if (relations.digitalPurchases && relations.digitalPurchases.length > 0) {
      return relations.digitalPurchases[0].digital_products?.card_id;
    }
    
    // Chercher dans les rendez-vous
    if (relations.appointments && relations.appointments.length > 0) {
      return relations.appointments[0].card_id;
    }
    
    // Chercher dans les devis
    if (relations.quotes && relations.quotes.length > 0) {
      return relations.quotes[0].card_id;
    }
    
    return null;
  };

  const loadContactData = async () => {
    try {
      setLoading(true);
      
      // Charger le contact
      const contacts = await ScannedContactsService.getUserContacts(user!.id);
      const foundContact = contacts.find(c => c.id === contactId);
      
      if (!foundContact) {
        toast({
          title: t('crmDetail.toasts.contactNotFound.title'),
          description: t('crmDetail.toasts.contactNotFound.description'),
          variant: "destructive"
        });
        navigate('/contacts');
        return;
      }
      
      setContact(foundContact);
      
      // Charger données CRM
      const data = await CRMService.getContactCRM(user!.id, foundContact.email!);
      setCrmData(data);
      
      // Récupérer l'ID de la carte depuis les relations
      const extractedCardId = getCardIdFromRelations(data.relations);
      setCardId(extractedCardId);
      
      // Calculer scores RFM
      const rfm = RFMSegmentationService.calculateRFM(foundContact, data.relations);
      setRfmScores(rfm);
      
      // Prédictions IA
      const nextOrderPred = AIPredictionService.predictNextOrderProbability(foundContact, data.relations);
      const clvPred = AIPredictionService.predictCLV(foundContact, data.relations);
      const churnRisk = AIPredictionService.detectChurnRisk(foundContact, data.relations);
      const productRecs = AIPredictionService.getProductRecommendations(foundContact, data.relations);
      
      setPredictions({
        nextOrder: nextOrderPred,
        clv: clvPred,
        churn: churnRisk,
        products: productRecs
      });
    } catch (error) {
      console.error('Error loading contact:', error);
      toast({
        title: t('crmDetail.toasts.errorLoading.title'),
        description: t('crmDetail.toasts.errorLoading.description'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/contacts?edit=${contactId}`);
  };

  const handleDelete = async () => {
    if (!contact) return;
    
    if (confirm(t('crmDetail.deleteConfirm', { name: contact.full_name }))) {
      try {
        await ScannedContactsService.deleteContact(contact.id!);
        toast({
          title: t('crmDetail.toasts.contactDeleted.title'),
          description: t('crmDetail.toasts.contactDeleted.description')
        });
        navigate('/contacts');
      } catch (error) {
        toast({
          title: t('crmDetail.toasts.deleteError.title'),
          description: t('crmDetail.toasts.deleteError.description'),
          variant: "destructive"
        });
      }
    }
  };

  // Fonctions pour les modals de prévisualisation
  const openPreviewModal = (type: 'order' | 'purchase' | 'appointment' | 'quote' | 'invoice', data: any) => {
    setPreviewModal({ type, data });
  };

  const closePreviewModal = () => {
    setPreviewModal({ type: null, data: null });
  };

  // Handler pour les actions rapides
  const handleQuickAction = (actionType: 'appointment' | 'quote' | 'invoice' | 'email') => {
    if (!contact || !cardId) {
      toast({
        title: t('crmDetail.toasts.actionImpossible.title'),
        description: t('crmDetail.toasts.actionImpossible.description'),
        variant: "destructive"
      });
      return;
    }

    switch (actionType) {
      case 'appointment':
        // Rediriger vers la page de création de rendez-vous
        navigate(`/cards/${cardId}/appointments`);
        break;
      
      case 'quote':
        // Rediriger vers la page de portfolio pour créer un devis
        navigate('/portfolio/projects');
        break;
      
      case 'invoice':
        // Rediriger vers la page de facturation
        navigate('/facture');
        break;
      
      case 'email':
        // Basculer vers l'onglet Communication pour envoyer un email
        setActiveTab('communication');
        toast({
          title: t('crmDetail.toasts.communication.title'),
          description: t('crmDetail.toasts.communication.description'),
        });
        break;
      
      default:
        toast({
          title: t('crmDetail.toasts.actionNotSupported.title'),
          description: t('crmDetail.toasts.actionNotSupported.description'),
          variant: "destructive"
        });
    }
  };

  // Handler pour les actions recommandées
  const handleRecommendedAction = (suggestion: { type: string; title: string; description: string; priority: string }) => {
    if (!contact || !cardId) {
      toast({
        title: t('crmDetail.toasts.actionImpossible.title'),
        description: t('crmDetail.toasts.actionImpossible.description'),
        variant: "destructive"
      });
      return;
    }

    switch (suggestion.type) {
      case 'follow_up_quote':
        // Basculer vers l'onglet Communication pour relancer le devis
        setActiveTab('communication');
        toast({
          title: t('crmDetail.toasts.followUpQuote.title'),
          description: t('crmDetail.toasts.followUpQuote.description'),
        });
        break;
      
      case 'reactivate':
        // Basculer vers l'onglet Communication pour réactiver le client
        setActiveTab('communication');
        toast({
          title: t('crmDetail.toasts.reactivate.title'),
          description: t('crmDetail.toasts.reactivate.description'),
        });
        break;
      
      case 'convert_lead':
        // Rediriger vers la page de portfolio pour créer un devis
        navigate('/portfolio/projects');
        break;
      
      case 'upsell':
        // Rediriger vers la page de produits pour voir les offres
        navigate(`/cards/${cardId}/products`);
        break;
      
      case 'invoice_reminder':
        // Basculer vers l'onglet Communication pour relancer la facture
        setActiveTab('communication');
        toast({
          title: t('crmDetail.toasts.invoiceReminder.title'),
          description: t('crmDetail.toasts.invoiceReminder.description'),
        });
        break;
      
      default:
        toast({
          title: t('crmDetail.stats.actions'),
          description: suggestion.description,
        });
    }
  };

  // Helper function pour formater les dates de manière sécurisée
  const formatDate = (dateString: string | null | undefined, formatString: string = 'PPP à HH:mm') => {
    if (!dateString) return t('crmDetail.formatDate.unavailable');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('crmDetail.formatDate.invalid');
      const locale = currentLanguage === 'fr' ? fr : enUS;
      return format(date, formatString, { locale });
    } catch (error) {
      return t('crmDetail.formatDate.invalid');
    }
  };

  // Couleurs selon score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-gray-900 bg-green-50';
    if (score >= 60) return 'text-gray-900 bg-gray-100';
    if (score >= 40) return 'text-gray-900 bg-yellow-50';
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{t('crmDetail.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contact || !crmData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">{t('crmDetail.contactNotFound')}</p>
        </div>
      </DashboardLayout>
    );
  }

  const { relations, stats, timeline } = crmData;
  const suggestions = CRMService.getActionSuggestions(contact, relations, stats);
  const rfmReco = rfmScores ? RFMSegmentationService.getSegmentRecommendations(rfmScores.segment) : null;

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-4 sm:py-6 px-3 sm:px-4 md:px-6 bg-white">
        {/* En-tête Premium */}
        <ContactHeader 
          contact={contact}
          rfmScores={rfmScores}
          rfmReco={rfmReco}
          onBack={() => navigate('/contacts')}
        />

        {/* Stats Cards Premium */}
        <ContactStats 
          stats={crmData.stats}
          getScoreColor={getScoreColor}
        />

        {/* Actions Rapides et Recommandées Premium */}
        <ContactActions
          suggestions={suggestions}
          handleQuickAction={handleQuickAction}
          handleRecommendedAction={handleRecommendedAction}
        />

          {/* Tabs Navigation Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-3 sm:px-6 py-3 sm:py-4 font-light border-b transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'timeline'
                        ? 'border-gray-900 text-gray-900 bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{t('crmDetail.tabs.timeline')}</span>
                    <span className="sm:hidden">{t('crmDetail.tabs.timeline')}</span>
                    <span className="ml-1">({timeline.totalCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-3 sm:px-6 py-3 sm:py-4 font-light border-b transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'stats'
                        ? 'border-gray-900 text-gray-900 bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{t('crmDetail.tabs.stats')}</span>
                    <span className="sm:hidden">{t('crmDetail.tabs.statsShort')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('relations')}
                    className={`px-3 sm:px-6 py-3 sm:py-4 font-light border-b transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'relations'
                        ? 'border-gray-900 text-gray-900 bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                    {t('crmDetail.tabs.relations')}
                  </button>
                  <button
                    onClick={() => setActiveTab('predictions')}
                    className={`px-3 sm:px-6 py-3 sm:py-4 font-light border-b transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'predictions'
                        ? 'border-gray-900 text-gray-900 bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{t('crmDetail.tabs.predictions')}</span>
                    <span className="sm:hidden">{t('crmDetail.tabs.predictionsShort')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('communication')}
                    className={`px-3 sm:px-6 py-3 sm:py-4 font-light border-b transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'communication'
                        ? 'border-gray-900 text-gray-900 bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{t('crmDetail.tabs.communication')}</span>
                    <span className="sm:hidden">{t('crmDetail.tabs.communicationShort')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-3 sm:px-6 py-3 sm:py-4 font-light border-b transition-all duration-200 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === 'notes'
                        ? 'border-gray-900 text-gray-900 bg-gray-50'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
                    {t('crmDetail.tabs.notes')}
                  </button>
              </div>
            </div>

            <div className="p-0 bg-white rounded-b-lg border border-t-0 border-gray-200">
              {/* Timeline Premium - Composant modulaire */}
              {activeTab === 'timeline' && (
                <div className="p-4 sm:p-6">
                  <ContactTimeline
                    activities={timeline.activities}
                    onActivityClick={(activity) => {
                          let modalType: 'order' | 'purchase' | 'appointment' | 'quote' | 'invoice' = 'order';
                          switch (activity.type) {
                            case 'order_physical':
                            case 'order_digital':
                              modalType = 'order';
                              break;
                            case 'purchase_digital':
                              modalType = 'purchase';
                              break;
                            case 'appointment':
                              modalType = 'appointment';
                              break;
                            case 'quote':
                              modalType = 'quote';
                              break;
                            case 'invoice':
                              modalType = 'invoice';
                              break;
                          }
                          openPreviewModal(modalType, activity);
                    }}
                    getActivityIcon={getActivityIcon}
                    getStatusColor={getStatusColor}
                    cardId={cardId}
                  />
                </div>
              )}

              {/* Stats détaillées */}
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-light tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >{t('crmDetail.stats.revenueSplit')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {relations.physicalOrders.length > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-500 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >{t('crmDetail.stats.physicalProducts')}</span>
                              <span className="font-light text-lg tracking-tight"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                  fontWeight: 300,
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                {relations.physicalOrders.reduce((sum: number, o: any) => {
                                  const product = o.products as any;
                                  return sum + (product?.price || 0) * (o.quantity || 1);
                                }, 0).toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gray-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(relations.physicalOrders.length / stats.totalOrders) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {relations.digitalOrders.length > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-500 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >{t('crmDetail.stats.digitalProductsOrders')}</span>
                              <span className="font-light text-lg tracking-tight"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                  fontWeight: 300,
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                {relations.digitalOrders.reduce((sum: number, o: any) => {
                                  const product = o.digital_products as any;
                                  return sum + (product?.price || 0) * (o.quantity || 1);
                                }, 0).toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gray-700 h-2 rounded-full" 
                                style={{ 
                                  width: `${(relations.digitalOrders.length / stats.totalOrders) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {relations.digitalPurchases.length > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-500 font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >{t('crmDetail.stats.digitalPurchases')}</span>
                              <span className="font-light text-lg tracking-tight"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                  fontWeight: 300,
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                {relations.digitalPurchases.reduce((sum: number, p: any) => 
                                  sum + (p.amount || 0), 0).toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gray-800 h-2 rounded-full" 
                                style={{ 
                                  width: `${(relations.digitalPurchases.length / stats.totalOrders) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-light tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >{t('crmDetail.stats.customerEngagement')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-gray-500 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('crmDetail.stats.averageBasket')}</span>
                          <span className="font-light text-lg tracking-tight"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.02em',
                            }}
                          >{stats.averageOrderValue.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-gray-500 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('crmDetail.stats.quotesCreated')}</span>
                          <span className="font-light text-lg tracking-tight"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.02em',
                            }}
                          >{stats.totalQuotes}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-gray-500 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('crmDetail.stats.conversionRate')}</span>
                          <span className="font-light text-lg tracking-tight"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.02em',
                            }}
                          >{stats.conversionRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-gray-500 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{t('crmDetail.stats.leadScore')}</span>
                          <span className="font-light text-lg tracking-tight text-gray-900"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {stats.leadScore}/100
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {rfmScores && rfmReco && (
                    <Card className="border border-gray-200 bg-white shadow-sm rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 font-light tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          <Award className="w-5 h-5 text-gray-600" />
                          {t('crmDetail.stats.rfmSegmentation')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('crmDetail.stats.recency')}</span>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(i => (
                                <div 
                                  key={i} 
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-light ${
                                    i <= rfmScores.recency 
                                      ? 'bg-gray-700 text-white' 
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {i}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('crmDetail.stats.frequency')}</span>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(i => (
                                <div 
                                  key={i} 
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-light ${
                                    i <= rfmScores.frequency 
                                      ? 'bg-gray-700 text-white' 
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {i}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t('crmDetail.stats.monetary')}</span>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(i => (
                                <div 
                                  key={i} 
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-light ${
                                    i <= rfmScores.monetary 
                                      ? 'bg-gray-700 text-white' 
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {i}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-light text-gray-900 mb-2 tracking-tight"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {rfmReco.icon} {t('crmDetail.stats.segment')} : {rfmScores.segment.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-500 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{t(`rfmSegmentation.${rfmScores.segment}.messaging`)}</p>
                            <div className="mt-3 space-y-1">
                              {(() => {
                                const actions = t(`rfmSegmentation.${rfmScores.segment}.actions`, { returnObjects: true });
                                const actionsArray = Array.isArray(actions) ? actions : [];
                                return actionsArray.slice(0, 3).map((action: string, i: number) => (
                                  <p key={i} className="text-xs text-gray-500 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >• {action}</p>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Relations détaillées - Composant modulaire */}
              {activeTab === 'relations' && (
                <div className="p-4 sm:p-6">
                  <ContactRelations
                    relations={relations}
                    onItemClick={(type, item) => {
                      const modalType = type === 'order' ? 'order' : 
                                       type === 'purchase' ? 'purchase' :
                                       type === 'appointment' ? 'appointment' :
                                       type === 'quote' ? 'quote' :
                                       type === 'invoice' ? 'invoice' : 'order';
                      openPreviewModal(modalType, item);
                    }}
                    getStatusColor={getStatusColor}
                    cardId={cardId}
                  />
                </div>
              )}

              {/* Prédictions IA */}
              {activeTab === 'predictions' && predictions && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 border-blue-300 bg-white/60 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Zap className="w-6 h-6 text-gray-900" />
                        {t('crmDetail.predictions.nextOrder.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-3">
                            <span className="font-medium text-gray-700">{t('crmDetail.predictions.nextOrder.probability')}</span>
                            <span className="text-4xl font-bold text-gray-900">
                              {predictions.nextOrder.probability}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all" 
                              style={{ width: `${predictions.nextOrder.probability}%` }}
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-md">
                          <p className="text-sm text-gray-600 mb-2 font-medium">{t('crmDetail.predictions.nextOrder.suggestedAction')}</p>
                          <p className="font-semibold text-gray-900">{predictions.nextOrder.suggestedAction}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-300 bg-white/60 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-gray-900" />
                        {t('crmDetail.predictions.clv.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">{t('crmDetail.predictions.clv.currentCLV')}</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {(predictions.clv.currentCLV / 1000).toFixed(0)}K FCFA
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                          <p className="text-sm text-gray-600 mb-1">{t('crmDetail.predictions.clv.predictedCLV')}</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {(predictions.clv.predictedCLV / 1000).toFixed(0)}K FCFA
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                          <p className="text-sm text-gray-700 mb-1">{t('crmDetail.predictions.clv.growthPotential')}</p>
                          <p className="text-3xl font-bold text-green-700">
                            +{predictions.clv.growthPotential.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200/50 bg-white/60 backdrop-blur-md rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        {t('crmDetail.predictions.churn.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">{t('crmDetail.predictions.churn.riskLevel')}</span>
                          <Badge className={`text-base px-4 py-1 ${
                            predictions.churn.riskLevel === 'critical' ? 'bg-red-500' :
                            predictions.churn.riskLevel === 'high' ? 'bg-orange-500' :
                            predictions.churn.riskLevel === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          } text-white`}>
                            {predictions.churn.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {predictions.churn.reasons.length > 0 && (
                          <div className="p-4 bg-white rounded-lg">
                            <p className="font-semibold text-gray-900 mb-2">{t('crmDetail.predictions.churn.reasons')}</p>
                            <ul className="space-y-1">
                              {predictions.churn.reasons.map((reason: string, i: number) => (
                                <li key={i} className="text-sm text-gray-700">• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {predictions.churn.recommendations.length > 0 && (
                          <div className="p-4 bg-white rounded-lg border-2 border-orange-300">
                            <p className="font-semibold text-gray-900 mb-2">{t('crmDetail.predictions.churn.recommendations')}</p>
                            <ul className="space-y-1">
                              {predictions.churn.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="text-sm text-gray-700 font-medium">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {predictions.products.length > 0 && (
                    <Card className="border-2 border-purple-300 bg-white/60 backdrop-blur-md">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <ShoppingCart className="w-6 h-6 text-gray-900" />
                          {t('crmDetail.predictions.products.title')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {predictions.products.map((product: any, i: number) => (
                            <div key={i} className="p-4 bg-white rounded-lg border border-gray-200/50 bg-white/60 backdrop-blur-md">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-bold text-gray-900 capitalize">{product.category}</p>
                                  <p className="text-sm text-gray-600">{product.productType}</p>
                                </div>
                                <Badge variant="secondary" className="text-base px-3 py-1">
                                  {product.confidence}%
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mt-2">{product.reason}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Communication */}
              {activeTab === 'communication' && (
                <div className="max-w-2xl mx-auto">
                  <CommunicationCenter 
                    contact={contact}
                    onSent={() => {
                      toast({
                        title: t('crmDetail.toasts.messageSent.title'),
                        description: t('crmDetail.toasts.messageSent.description')
                      });
                    }}
                  />
                </div>
              )}

              {/* Notes */}
              {activeTab === 'notes' && (
                <div className="max-w-2xl mx-auto">
                  <ContactNotes 
                    contactId={contact.id!}
                    contactEmail={contact.email!}
                  />
                </div>
              )}
            </div>
            </div>
          </motion.div>
        </div>

      {/* Modal de prévisualisation */}
      <Dialog open={previewModal.type !== null} onOpenChange={closePreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewModal.type === 'order' && <Package className="w-5 h-5 text-gray-900" />}
              {previewModal.type === 'purchase' && <ShoppingCart className="w-5 h-5 text-gray-900" />}
              {previewModal.type === 'appointment' && <Calendar className="w-5 h-5 text-gray-900" />}
              {previewModal.type === 'quote' && <FileText className="w-5 h-5 text-gray-900" />}
              {previewModal.type === 'invoice' && <CreditCard className="w-5 h-5 text-gray-900" />}
              {t('crmDetail.previewModal.title', { 
                type: previewModal.type ? t(`crmDetail.previewModal.types.${previewModal.type}`) : t('crmDetail.previewModal.types.element')
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {previewModal.type === 'order' && previewModal.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.order.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.order.orderId')}</span>
                        <span className="font-mono text-sm">{previewModal.data.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.order.status')}</span>
                        <Badge className={getStatusColor(previewModal.data.status || 'pending')}>
                          {t(`crmDetail.status.${previewModal.data.status || 'pending'}`) || previewModal.data.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.order.quantity')}</span>
                        <span>{previewModal.data.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.order.date')}</span>
                        <span>{formatDate(previewModal.data.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.order.productTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.order.name')}</span>
                        <span className="font-semibold">{previewModal.data.products?.name || previewModal.data.digital_products?.title || t('crmDetail.relations.product')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.order.unitPrice')}</span>
                        <span>{(previewModal.data.products?.price || previewModal.data.digital_products?.price || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.order.total')}</span>
                        <span className="font-bold text-lg">
                          {((previewModal.data.products?.price || previewModal.data.digital_products?.price || 0) * (previewModal.data.quantity || 1)).toLocaleString()} FCFA
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {previewModal.data.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.order.notes')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{previewModal.data.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {previewModal.type === 'purchase' && previewModal.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.purchase.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.purchase.purchaseId')}</span>
                        <span className="font-mono text-sm">{previewModal.data.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.purchase.status')}</span>
                        <Badge className={getStatusColor(previewModal.data.payment_status || 'completed')}>
                          {t(`crmDetail.status.${previewModal.data.payment_status || 'completed'}`) || previewModal.data.payment_status || 'completed'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.purchase.amount')}</span>
                        <span className="font-bold text-lg">{(previewModal.data.amount || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.purchase.date')}</span>
                        <span>{formatDate(previewModal.data.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.purchase.digitalProductTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.purchase.title')}</span>
                        <span className="font-semibold">{previewModal.data.digital_products?.title || t('crmDetail.relations.digitalProduct')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.purchase.downloads')}</span>
                        <span>{previewModal.data.download_count || 0}/{previewModal.data.max_downloads || 1}</span>
                      </div>
                      {previewModal.data.digital_products?.description && (
                        <div className="mt-2">
                          <span className="text-gray-600 block mb-1">{t('crmDetail.previewModal.purchase.description')}</span>
                          <p className="text-sm text-gray-700">{previewModal.data.digital_products.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {previewModal.type === 'appointment' && previewModal.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.appointment.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.appointment.appointmentId')}</span>
                        <span className="font-mono text-sm">{previewModal.data.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.appointment.date')}</span>
                        <span className="font-semibold">{formatDate(previewModal.data.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.appointment.duration')}</span>
                        <span>{t('crmDetail.relations.duration', { duration: previewModal.data.duration || 60 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.appointment.status')}</span>
                        <Badge className={getStatusColor(previewModal.data.status || 'pending')}>
                          {t(`crmDetail.status.${previewModal.data.status || 'pending'}`) || previewModal.data.status || 'pending'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.appointment.detailsTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600 block mb-1">{t('crmDetail.previewModal.appointment.notes')}</span>
                          <p className="text-gray-700">{previewModal.data.notes || t('crmDetail.previewModal.appointment.noNotes')}</p>
                        </div>
                        {previewModal.data.location && (
                          <div>
                            <span className="text-gray-600 block mb-1">{t('crmDetail.previewModal.appointment.location')}</span>
                            <p className="text-gray-700">{previewModal.data.location}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {previewModal.type === 'quote' && previewModal.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.quote.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.quote.quoteId')}</span>
                        <span className="font-mono text-sm">{previewModal.data.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.quote.service')}</span>
                        <span className="font-semibold">{previewModal.data.service_requested}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.quote.budget')}</span>
                        <span>{previewModal.data.budget_range || t('crmDetail.relations.budgetNotSpecified')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.quote.status')}</span>
                        <Badge className={getStatusColor(previewModal.data.status || 'new')}>
                          {t(`crmDetail.status.${previewModal.data.status || 'new'}`) || previewModal.data.status || 'new'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.quote.date')}</span>
                        <span>{formatDate(previewModal.data.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.quote.amountTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {previewModal.data.quote_amount ? (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('crmDetail.previewModal.quote.quoteAmount')}</span>
                          <span className="font-bold text-2xl text-gray-900">
                            {previewModal.data.quote_amount.toLocaleString()} FCFA
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">{t('crmDetail.previewModal.quote.noAmount')}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {previewModal.data.project_description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.quote.projectDescription')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{previewModal.data.project_description}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {previewModal.type === 'invoice' && previewModal.data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.invoice.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.invoice.number')}</span>
                        <span className="font-semibold">{previewModal.data.invoice_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.invoice.status')}</span>
                        <Badge className={getStatusColor(previewModal.data.status || 'draft')}>
                          {t(`crmDetail.status.${previewModal.data.status || 'draft'}`) || previewModal.data.status || 'draft'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.invoice.issueDate')}</span>
                        <span>{formatDate(previewModal.data.issue_date || previewModal.data.created_at, 'PP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.invoice.dueDate')}</span>
                        <span>{previewModal.data.due_date ? formatDate(previewModal.data.due_date, 'PP') : t('crmDetail.relations.dueDateN/A')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.invoice.amountsTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.invoice.totalHT')}</span>
                        <span>{(previewModal.data.total_ht || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('crmDetail.previewModal.invoice.tax')}</span>
                        <span>{(previewModal.data.tax_amount || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600 font-semibold">{t('crmDetail.previewModal.invoice.totalTTC')}</span>
                        <span className="font-bold text-2xl text-gray-900">
                          {(previewModal.data.total_ttc || 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {previewModal.data.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('crmDetail.previewModal.invoice.description')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{previewModal.data.description}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-3">
                {/* Bouton de prévisualisation PDF pour les devis */}
                {previewModal.type === 'quote' && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: t('crmDetail.toasts.pdfPreview.title'),
                        description: t('crmDetail.toasts.pdfPreview.quoteDescription'),
                      });
                    }}
                    className="border-yellow-200 text-gray-900 hover:bg-yellow-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('crmDetail.previewModal.actions.previewPDF')}
                  </Button>
                )}
                
                {/* Bouton de prévisualisation PDF pour les factures */}
                {previewModal.type === 'invoice' && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: t('crmDetail.toasts.pdfPreview.title'),
                        description: t('crmDetail.toasts.pdfPreview.invoiceDescription'),
                      });
                    }}
                    className="border-emerald-200 text-gray-900 hover:bg-emerald-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('crmDetail.previewModal.actions.previewPDF')}
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={closePreviewModal}>
                  <X className="w-4 h-4 mr-2" />
                  {t('crmDetail.previewModal.actions.close')}
                </Button>
                <Button 
                  onClick={() => {
                    closePreviewModal();
                    
                    // Navigation selon le type d'élément avec l'ID de la carte
                    if (previewModal.type === 'order') {
                      navigate(cardId ? `/cards/${cardId}/orders` : '/orders');
                    } else if (previewModal.type === 'appointment') {
                      navigate(cardId ? `/cards/${cardId}/appointments` : '/appointments');
                    } else if (previewModal.type === 'purchase') {
                      navigate('/my-purchases');
                    } else if (previewModal.type === 'quote') {
                      navigate('/portfolio/projects');
                    } else if (previewModal.type === 'invoice') {
                      navigate('/facture');
                    }
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('crmDetail.previewModal.actions.viewInApp')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ContactCRMDetail;

