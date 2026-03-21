import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SecureDownloadButton from '@/components/digital/SecureDownloadButton';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';

interface Purchase {
  id: string;
  type: 'physical' | 'digital';
  product_name: string;
  product_image?: string;
  quantity: number;
  status: string;
  payment_status?: string;
  download_token?: string;
  expires_at?: string;
  created_at: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  notes?: string;
}

const MyPurchases: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'digital' | 'physical'>('all');

  useEffect(() => {
    if (user) {
      loadPurchases();
    }
  }, [user]);

  const loadPurchases = async () => {
    if (!user?.email) return;

    setLoading(true);

    try {
      // Charger les achats digitaux
      const { data: digitalData, error: digitalError } = await supabase
        .from('digital_inquiries')
        .select(`
          id,
          client_name,
          client_email,
          client_phone,
          quantity,
          status,
          payment_status,
          download_token,
          expires_at,
          created_at,
          notes,
          digital_products (
            title,
            thumbnail_url,
            type,
            price
          )
        `)
        .eq('client_email', user.email)
        .order('created_at', { ascending: false });

      if (digitalError) throw digitalError;

      // Charger les achats physiques
      const { data: physicalData, error: physicalError } = await supabase
        .from('product_inquiries')
        .select(`
          id,
          client_name,
          client_email,
          client_phone,
          quantity,
          status,
          payment_status,
          created_at,
          notes,
          products (
            name,
            image_url,
            price
          )
        `)
        .eq('client_email', user.email)
        .order('created_at', { ascending: false });

      if (physicalError) throw physicalError;

      // Formatter les données
      const digitalPurchases: Purchase[] = (digitalData || []).map(item => ({
        id: item.id,
        type: 'digital' as const,
        product_name: (item.digital_products as any)?.title || 'Produit digital',
        product_image: (item.digital_products as any)?.thumbnail_url,
        quantity: item.quantity,
        status: item.status,
        payment_status: item.payment_status,
        download_token: item.download_token,
        expires_at: item.expires_at,
        created_at: item.created_at,
        client_name: item.client_name,
        client_email: item.client_email,
        client_phone: item.client_phone || undefined,
        notes: item.notes || undefined,
      }));

      const physicalPurchases: Purchase[] = (physicalData || []).map(item => ({
        id: item.id,
        type: 'physical' as const,
        product_name: (item.products as any)?.name || 'Produit physique',
        product_image: (item.products as any)?.image_url,
        quantity: item.quantity,
        status: item.status,
        payment_status: item.payment_status,
        created_at: item.created_at,
        client_name: item.client_name,
        client_email: item.client_email,
        client_phone: item.client_phone || undefined,
        notes: item.notes || undefined,
      }));

      // Combiner et trier par date
      const allPurchases = [...digitalPurchases, ...physicalPurchases].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPurchases(allPurchases);

    } catch (error: any) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos achats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (paymentStatus === 'paid') {
      return <Badge className="bg-green-600 text-white">Payé</Badge>;
    }

    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 text-white">Complété</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-600 text-white">Confirmé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">En attente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-600 text-white">Annulé</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredPurchases = purchases.filter(purchase => {
    if (activeTab === 'all') return true;
    if (activeTab === 'digital') return purchase.type === 'digital';
    if (activeTab === 'physical') return purchase.type === 'physical';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-8 text-gray-900 hover:text-black hover:bg-gray-50 rounded-full px-6 py-3 h-auto font-semibold text-sm backdrop-blur-md border border-gray-200 transition-all duration-500 hover:border-gray-300 hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2.5} />
            Retour
          </Button>
          
          <div className="text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Mes Achats
              </h1>
              <p className="text-gray-900 text-lg font-light">
                Retrouvez tous vos produits et téléchargements
              </p>
            </motion.div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-8">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 h-14 bg-gray-100 rounded-2xl p-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-500 font-semibold text-sm">
              Tous ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="digital" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-500 font-semibold text-sm">
              Digital ({purchases.filter(p => p.type === 'digital').length})
            </TabsTrigger>
            <TabsTrigger value="physical" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-500 font-semibold text-sm">
              Physique ({purchases.filter(p => p.type === 'physical').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste des achats */}
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun achat</h3>
            <p className="text-gray-900">Vous n'avez pas encore effectué d'achat</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((purchase) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-br from-gray-600 to-white border-gray-100/50 hover:shadow-xl transition-all duration-500">
                  <CardHeader className="pb-4">
                    {/* Image du produit */}
                    <div className="w-full h-48 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl overflow-hidden mb-4">
                      {purchase.product_image ? (
                        <CardImageOptimizer
                          src={purchase.product_image}
                          alt={purchase.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {purchase.type === 'digital' ? (
                            <Download className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                          ) : (
                            <Package className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Type et statut */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {purchase.type === 'digital' ? (
                          <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center gap-1">
                            <Download className="w-3 h-3" strokeWidth={2.5} />
                            Digital
                          </div>
                        ) : (
                          <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1">
                            <Truck className="w-3 h-3" strokeWidth={2.5} />
                            Physique
                          </div>
                        )}
                      </div>
                      {getStatusBadge(purchase.status, purchase.payment_status)}
                    </div>

                    <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                      {purchase.product_name}
                    </CardTitle>

                    <div className="space-y-1 text-xs text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(purchase.created_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-3 h-3" />
                        Quantité: {purchase.quantity}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Bouton de téléchargement pour produits digitaux */}
                    {purchase.type === 'digital' && purchase.download_token && (
                      <div className="space-y-3">
                        {isExpired(purchase.expires_at) ? (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Lien de téléchargement expiré
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <>
                            <SecureDownloadButton
                              downloadToken={purchase.download_token}
                              productTitle={purchase.product_name}
                              productType="pdf"
                              applyWatermark={true}
                              validateDevice={true}
                              className="w-full"
                            />
                            
                            {purchase.expires_at && (
                              <p className="text-xs text-gray-700 text-center">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Expire le {formatDate(purchase.expires_at)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Information pour produits physiques */}
                    {purchase.type === 'physical' && (
                      <div className="space-y-3">
                        {purchase.payment_status === 'paid' ? (
                          <Alert className="bg-blue-50 border-blue-200">
                            <CheckCircle className="h-4 w-4 text-blue-700" />
                            <AlertDescription className="text-blue-800 text-sm">
                              Le vendeur vous contactera pour la livraison
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert>
                            <Clock className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              En attente de confirmation
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {purchase.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-700">
                          <FileText className="w-3 h-3 inline mr-1" />
                          {purchase.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Message si pas d'achats */}
        {purchases.length === 0 && (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mb-6 border border-gray-200/50">
              <Package className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun achat pour le moment</h3>
            <p className="text-gray-900 mb-8">Découvrez nos produits sur la marketplace</p>
            <Button
              onClick={() => navigate('/marketplace')}
              className="h-14 px-8 bg-black hover:bg-gray-800 text-white rounded-full font-semibold text-base transition-all duration-500 hover:shadow-sm hover:scale-105"
            >
              Découvrir la marketplace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;





















