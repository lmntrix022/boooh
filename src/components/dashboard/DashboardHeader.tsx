import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionMessagesService from '@/services/subscriptionMessages';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { features, planType, isLoading: subscriptionLoading } = useSubscription();
  const [cardsCount, setCardsCount] = useState<number | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const { t } = useLanguage();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('dashboard.header.user');
  const avatarUrl = user?.user_metadata?.avatar_url;
  const isAdmin = user?.role === 'admin';

  // Charger le nombre de cartes de l'utilisateur
  useEffect(() => {
    if (!user?.id) {
      setLoadingCards(false);
      return;
    }

    const fetchCardsCount = async () => {
      try {
        setLoadingCards(true);
        const { count, error } = await supabase
          .from('business_cards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) throw error;
        const finalCount = count || 0;
        setCardsCount(finalCount);
      } catch (error) {
        setCardsCount(0);
      } finally {
        setLoadingCards(false);
      }
    };

    if (!subscriptionLoading) {
      fetchCardsCount();
    }
  }, [user?.id, subscriptionLoading]);

  // Vérifier si l'utilisateur peut créer une nouvelle carte
  const maxCards = features?.maxCards;
  const isUnlimited = maxCards === -1;
  const canCreateCard = isUnlimited || (cardsCount !== null && cardsCount < (maxCards || 1));

  const upgradeSuggestion = !canCreateCard && cardsCount !== null
    ? SubscriptionMessagesService.getQuotaExceededMessage(
        'card',
        cardsCount,
        maxCards || 1,
        planType
      )
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="mb-10 relative"
    >
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
          <div className="relative group">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                      className="group"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Avatar className="h-14 w-14 md:h-16 md:w-16 border border-gray-200 transition-all duration-200 group-hover:shadow-sm rounded-lg">
                      <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-gray-900 text-white font-light text-lg"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >{userName[0]}</AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                        <motion.span
                          className="absolute -bottom-1 -right-1"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <Badge className="rounded-lg px-2 py-0.5 text-xs font-light bg-gray-900 text-white border-0 shadow-sm"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >{isAdmin ? 'Pro' : 'User'}</Badge>
                        </motion.span>
                    )}
                    </motion.div>
                </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                    {t('dashboard.header.myProfile')}
                  </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
              <motion.h1
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-gray-900 leading-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                }}
              >
              {t('dashboard.header.greeting', { name: userName })}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-2 md:mt-3 text-gray-500 text-xs md:text-sm font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
              {t('dashboard.header.tagline')}
              </motion.p>
          </div>
        </div>

        {/* Bouton Créer ou Upgrade - Affichage conditionnel */}
        {!subscriptionLoading && !loadingCards && cardsCount !== null && (
          <>
            {canCreateCard ? (
                // Bouton Créer une carte - Ultra-Moderne
              <motion.div
                key="create-button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                <Button
                  asChild
                    className="relative bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-300 px-6 py-2.5 md:px-8 md:py-3 rounded-lg font-light overflow-hidden border border-gray-800"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Link to="/create-card" className="flex items-center gap-2 relative z-10">
                      <Plus className="h-5 w-5 relative z-10 transition-transform group-hover:rotate-90 duration-300" />
                      <span className="relative z-10">{t('dashboard.header.createCard')}</span>
                  </Link>
                </Button>
              </motion.div>
            ) : (
              // Bouton Upgrade - Apple Premium Design
              <motion.div
                key="upgrade-button"
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        {/* Main button */}
                        <Button
                          onClick={() => navigate('/pricing')}
                          className="relative px-7 py-3 rounded-lg font-light text-white shadow-sm hover:shadow-sm transition-all duration-300 overflow-hidden group bg-gray-900 hover:bg-gray-800"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {/* Content */}
                          <span className="relative flex items-center gap-2 z-10">
                            <motion.div
                              animate={{ rotate: isHovering ? 360 : 0 }}
                              transition={{ duration: 0.6 }}
                            >
                              <Sparkles className="h-5 w-5" />
                            </motion.div>
                            <span className="text-base md:text-lg">{t('dashboard.header.upgradeNow')}</span>
                            <motion.div
                              animate={{ x: isHovering ? 4 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ArrowRight className="h-5 w-5" />
                            </motion.div>
                          </span>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-white border border-gray-200 shadow-lg rounded-lg"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <div className="space-y-3 py-2">
                        <p className="font-light text-gray-900 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >{upgradeSuggestion?.title}</p>
                        <p className="text-sm text-gray-600 font-light">{upgradeSuggestion?.description}</p>
                        {upgradeSuggestion?.helpText && (
                          <p className="text-xs text-gray-500 font-light border-t border-gray-200 pt-2 mt-2">
                            {upgradeSuggestion.helpText}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}
          </>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
