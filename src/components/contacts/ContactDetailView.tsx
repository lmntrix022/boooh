import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Building, Globe, Calendar, 
  FileText, ShoppingCart, Package, CreditCard, 
  TrendingUp, Activity, AlertCircle, CheckCircle,
  Download, DollarSign, Clock, Target, X, Zap,
  Award, Edit, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CRMService } from '@/services/crmService';
import { AIPredictionService } from '@/services/aiPredictionService';
import { RFMSegmentationService } from '@/services/rfmSegmentationService';
import { ScannedContact } from '@/services/scannedContactsService';
import { CommunicationCenter } from '@/components/crm/CommunicationCenter';
import { ContactNotes } from '@/components/crm/ContactNotes';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContactDetailViewProps {
  contact: ScannedContact;
  onClose: () => void;
  onEdit?: (contact: ScannedContact) => void;
  onDelete?: (contact: ScannedContact) => void;
}

export const ContactDetailView: React.FC<ContactDetailViewProps> = ({ 
  contact, 
  onClose,
  onEdit,
  onDelete 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [crmData, setCrmData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'relations' | 'predictions' | 'communication' | 'notes'>('timeline');
  const [rfmScores, setRfmScores] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);

  useEffect(() => {
    loadCRMData();
  }, [contact]);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      
      // Charger données CRM
      const data = await CRMService.getContactCRM(contact.user_id!, contact.email!);
      setCrmData(data);
      
      // Calculer scores RFM
      const rfm = RFMSegmentationService.calculateRFM(contact, data.relations);
      setRfmScores(rfm);
      
      // Prédictions IA
      const nextOrderPred = AIPredictionService.predictNextOrderProbability(contact, data.relations);
      const clvPred = AIPredictionService.predictCLV(contact, data.relations);
      const churnRisk = AIPredictionService.detectChurnRisk(contact, data.relations);
      const productRecs = AIPredictionService.getProductRecommendations(contact, data.relations);
      
      setPredictions({
        nextOrder: nextOrderPred,
        clv: clvPred,
        churn: churnRisk,
        products: productRecs
      });
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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >Chargement du profil CRM...</p>
        </div>
      </div>
    );
  }

  if (!crmData) return null;

  const { relations, stats, timeline } = crmData;
  const suggestions = CRMService.getActionSuggestions(contact, relations, stats);
  const rfmReco = rfmScores ? RFMSegmentationService.getSegmentRecommendations(rfmScores.segment) : null;

  // Couleurs selon score
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg border border-gray-200 shadow-lg max-w-6xl w-full my-8 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                <AvatarImage src={contact.scan_source_image_url} />
                <AvatarFallback className="bg-gray-800 text-white text-2xl font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {contact.full_name?.charAt(0) || contact.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-light tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >{contact.full_name || 'Sans nom'}</h2>
                  {rfmScores && (
                    <Badge className={cn(rfmReco?.color || '', "font-light")}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {rfmReco?.icon} {rfmScores.segment.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                {contact.title && <p className="text-gray-300 font-light mt-1"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{contact.title}</p>}
                {contact.company && (
                  <p className="text-gray-300 flex items-center gap-1 mt-1 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Building className="w-4 h-4" />
                    {contact.company}
                  </p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {contact.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(contact)}
                  className="text-white hover:bg-white/10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(contact)}
                  className="text-white hover:bg-white/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Contact rapide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {contact.email && (
              <a 
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 text-sm bg-white/10 rounded-lg border border-white/20 px-3 py-2 hover:bg-white/20 transition-colors font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Mail className="w-4 h-4" />
                <span className="truncate">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a 
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 text-sm bg-white/10 rounded-lg border border-white/20 px-3 py-2 hover:bg-white/20 transition-colors font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Phone className="w-4 h-4" />
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.website && (
              <a 
                href={contact.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-sm bg-white/10 rounded-lg border border-white/20 px-3 py-2 hover:bg-white/20 transition-colors font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Globe className="w-4 h-4" />
                <span className="truncate">{contact.website}</span>
              </a>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >CA Total</p>
                  <p className="text-lg font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {(stats.totalRevenue / 1000).toFixed(0)}K
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >Commandes</p>
                  <p className="text-lg font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >RDV</p>
                  <p className="text-lg font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >{stats.totalAppointments}</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >Conversion</p>
                  <p className="text-lg font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >{stats.conversionRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >Score</p>
                  <p className={`text-lg font-light tracking-tight ${getScoreColor(stats.leadScore).split(' ')[0]}`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.leadScore}/100
                  </p>
                </div>
                <Target className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions d'actions */}
        {suggestions.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <h3 className="text-sm font-light text-blue-900 mb-2 flex items-center gap-2 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <AlertCircle className="w-4 h-4" />
              Actions recommandées
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={suggestion.priority === 'high' ? 'default' : 'outline'}
                  className={cn(
                    suggestion.priority === 'high' ? 'bg-red-600 hover:bg-red-700' : '',
                    "font-light"
                  )}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {suggestion.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 font-light border-b transition-colors whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            Timeline ({timeline.totalCount})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 font-light border-b transition-colors whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Statistiques
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={`px-4 py-3 font-light border-b transition-colors whitespace-nowrap ${
              activeTab === 'relations'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            Relations
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`px-4 py-3 font-light border-b transition-colors whitespace-nowrap ${
              activeTab === 'predictions'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Prédictions IA
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`px-4 py-3 font-light border-b transition-colors whitespace-nowrap ${
              activeTab === 'communication'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <Mail className="w-4 h-4 inline mr-1" />
            Communication
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3 font-light border-b transition-colors whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Notes
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
                timeline.activities.map((activity: any, index: number) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'invoice' ? 'bg-green-100 text-green-600' :
                      activity.type === 'order_digital' || activity.type === 'purchase_digital' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'order_physical' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'quote' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-light text-gray-900 tracking-tight"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.01em',
                            }}
                          >{activity.title}</h4>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(activity.date), 'PPp', { locale: fr })}
                        </span>
                        {activity.amount && (
                          <span className="font-light text-green-600"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
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
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-light tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >Répartition du CA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relations.physicalOrders.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >Produits physiques</span>
                        <span className="font-light tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {relations.physicalOrders.reduce((sum: number, o: any) => {
                            const product = o.products as any;
                            return sum + (product?.price || 0) * (o.quantity || 1);
                          }, 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {relations.digitalOrders.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >Produits digitaux (commandes)</span>
                        <span className="font-light tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {relations.digitalOrders.reduce((sum: number, o: any) => {
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
                          {relations.digitalPurchases.reduce((sum: number, p: any) => 
                            sum + (p.amount || 0), 0).toLocaleString()} FCFA
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
                      <span className="text-sm text-gray-600">Panier moyen</span>
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

              {rfmScores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Segmentation RFM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Récence (R)</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-6 h-6 rounded ${i <= rfmScores.recency ? 'bg-blue-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Fréquence (F)</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-6 h-6 rounded ${i <= rfmScores.frequency ? 'bg-green-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monétaire (M)</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-6 h-6 rounded ${i <= rfmScores.monetary ? 'bg-purple-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900">{rfmReco?.messaging}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Relations */}
          {activeTab === 'relations' && (
            <div className="space-y-6">
              {/* Afficher toutes les relations */}
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
                      {relations.appointments.slice(0, 5).map((apt: any) => (
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
              
              {/* Autres relations... */}
            </div>
          )}

          {/* Prédictions IA */}
          {activeTab === 'predictions' && predictions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Prochaine Commande
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Probabilité</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {predictions.nextOrder.probability}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${predictions.nextOrder.probability}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Action suggérée</p>
                      <p className="font-medium">{predictions.nextOrder.suggestedAction}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Valeur Vie Client (CLV)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">CLV Actuelle</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(predictions.clv.currentCLV / 1000).toFixed(0)}K FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CLV Prédite (24 mois)</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(predictions.clv.predictedCLV / 1000).toFixed(0)}K FCFA
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600">Potentiel de croissance</p>
                      <p className="text-xl font-bold text-green-600">
                        +{predictions.clv.growthPotential.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${
                predictions.churn.riskLevel === 'critical' ? 'border-red-500 bg-red-50/30' :
                predictions.churn.riskLevel === 'high' ? 'border-orange-500 bg-orange-50/30' :
                predictions.churn.riskLevel === 'medium' ? 'border-yellow-500 bg-yellow-50/30' :
                'border-green-500 bg-green-50/30'
              }`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Risque de Churn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Niveau de risque</span>
                      <Badge className={`${
                        predictions.churn.riskLevel === 'critical' ? 'bg-red-500' :
                        predictions.churn.riskLevel === 'high' ? 'bg-orange-500' :
                        predictions.churn.riskLevel === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      } text-white`}>
                        {predictions.churn.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Raisons:</p>
                      <ul className="space-y-1">
                        {predictions.churn.reasons.map((reason: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600">• {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Recommandations:</p>
                      <ul className="space-y-1">
                        {predictions.churn.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {predictions.products.length > 0 && (
                <Card className="border-2 border-purple-200 bg-purple-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                      Recommandations Produits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {predictions.products.map((product: any, i: number) => (
                        <div key={i} className="p-3 bg-white rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium capitalize">{product.category}</p>
                              <p className="text-xs text-gray-600">{product.productType}</p>
                            </div>
                            <Badge variant="secondary">{product.confidence}%</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{product.reason}</p>
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
            <div>
              <CommunicationCenter 
                contact={contact}
                onSent={() => {
                  toast({
                    title: "Message envoyé",
                    description: "Le message a été envoyé avec succès"
                  });
                }}
              />
            </div>
          )}

          {/* Notes */}
          {activeTab === 'notes' && (
            <div>
              <ContactNotes 
                contactId={contact.id!}
                contactEmail={contact.email!}
              />
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

