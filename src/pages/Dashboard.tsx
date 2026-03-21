import React from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, TrendingUp, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BusinessCardGrid from "@/components/dashboard/BusinessCardGrid";
import DashboardStatsComponent from "@/components/dashboard/DashboardStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { DashboardService, type DashboardData } from "@/services/dashboardService";

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deletingCardId, setDeletingCardId] = React.useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = React.useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [cardToDelete, setCardToDelete] = React.useState<string | null>(null);

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData, Error>({
    queryKey: ["dashboard-data", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await DashboardService.getDashboardData({
        userId: user.id,
        activityLimit: 5
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const deleteCard = async (id: string) => {
    if (!user) return;
    
    try {
      setDeletingCardId(id);
      const { error } = await supabase
        .from("business_cards")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["dashboard-data", user.id] });
      
      toast({
        title: t('dashboard.cardDeleted'),
        description: t('dashboard.cardDeletedDescription'),
      });
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('dashboard.deleteError'),
        description: t('dashboard.deleteErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setDeletingCardId(null);
      setCardToDelete(null);
    }
  };

  const handleDeleteCard = (id: string) => {
    setCardToDelete(id);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["dashboard-data", user?.id] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Stabilize dashboardData cards to prevent infinite re-renders
  const cardsLength = React.useMemo(() => dashboardData?.cards?.length || 0, [dashboardData?.cards?.length]);
  const firstCardId = React.useMemo(() => dashboardData?.cards?.[0]?.id, [dashboardData?.cards?.[0]?.id]);
  
  // Auto-select first card if none selected (only once)
  const hasAutoSelectedRef = React.useRef(false);
  React.useEffect(() => {
    if (cardsLength > 0 && firstCardId && !selectedCardId && !hasAutoSelectedRef.current) {
      setSelectedCardId(firstCardId);
      hasAutoSelectedRef.current = true;
    }
    // Reset flag if cards are cleared
    if (cardsLength === 0) {
      hasAutoSelectedRef.current = false;
    }
  }, [cardsLength, firstCardId, selectedCardId]);

  if (!user && !authLoading) {
    return <Navigate to="/auth" />;
  }

  if (isLoading || authLoading) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen bg-white overflow-x-hidden apple-minimal-font">
          <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-16">
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 mx-auto mb-4"
                >
                  <Loader2 className="w-12 h-12 text-gray-600" />
                </motion.div>
                <p className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('common.loading')}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-2 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >{t('dashboard.loadingError')}</h3>
            <p className="text-gray-500 mb-6 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >{t('dashboard.loadingErrorDesc')}</p>
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-sm transition-all duration-300 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-600" />
                  {t('dashboard.refreshing')}
                </>
              ) : (
                t('common.retry')
              )}
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden apple-minimal-font">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-16">
          {/* Header Section */}
            <DashboardHeader />

          {/* Main Content Grid - Layout optimisé */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Stats & Quick Actions */}
            
            <div className="lg:col-span-2 space-y-6 md:space-y-8 min-h-0">
              {/* Stats Section */}
              <AnimatePresence>
                {dashboardData?.stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                  >
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8">
                        <DashboardStatsComponent
                          totalViews={dashboardData.stats.totalViews}
                          totalAppointments={dashboardData.stats.totalAppointments}
                          totalOrders={dashboardData.stats.totalOrders}
                          totalRevenue={dashboardData.stats.totalRevenue}
                          totalShares={dashboardData.stats.totalShares}
                          activeCards={dashboardData.stats.activeCards}
                        />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cards Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.25, type: "tween" }}
                        >
                          <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
                        </motion.div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                        {t('dashboard.myCards')}
                      </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-base font-light text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {dashboardData?.cards?.length || 0}
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {dashboardData?.cards && dashboardData.cards.length > 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <BusinessCardGrid
                            cards={dashboardData.cards}
                            onCardSelect={setSelectedCardId}
                            selectedCardId={selectedCardId}
                            onDeleteCard={handleDeleteCard}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.5 }}
                          className="text-center py-12"
                        >
                          <motion.div
                            className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-6"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.25, type: "tween" }}
                          >
                            <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-gray-600" />
                          </motion.div>
                          <h3 className="text-xl md:text-2xl font-light text-gray-900 mb-3 tracking-tight"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {t('dashboard.createFirstCard')}
                          </h3>
                          <p className="text-gray-500 text-sm md:text-base mb-8 max-w-sm mx-auto font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('dashboard.createFirstCardDesc')}
                          </p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                          <Button
                            asChild
                              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-sm transition-all duration-300 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                              }}
                          >
                              <Link to="/create-card" className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                              {t('dashboard.createCard')}
                            </Link>
                          </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Activity */}
            <div className="space-y-6 md:space-y-8 min-h-0">
              {/* Recent Activity Section */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full"
                >
                  <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="relative z-10 p-6 md:p-8 flex-1 flex flex-col min-h-0 overflow-visible">
                      <RecentActivity
                        activities={(() => {
                          if (!dashboardData?.activities) return [];
                          const filtered = dashboardData.activities.filter(a =>
                            selectedCardId ? a.cardId === selectedCardId : true
                          );
                          return filtered;
                        })()}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        open={!!cardToDelete}
        onOpenChange={(open) => !open && setCardToDelete(null)}
        title={t('dashboard.deleteCardTitle')}
        description={t('dashboard.deleteCardDesc')}
        confirmText={t('common.deletedPermanently')}
        cancelText={t('common.cancel')}
        onConfirm={() => cardToDelete && deleteCard(cardToDelete)}
        isLoading={!!deletingCardId}
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default Dashboard;

