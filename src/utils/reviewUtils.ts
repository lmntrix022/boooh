import { supabase } from '@/integrations/supabase/client';

/**
 * Force la mise à jour des statistiques d'avis pour une carte
 */
export const forceUpdateReviewStats = async (cardId: string) => {
  try {
    // Force updating review stats
    
    // Récupérer les statistiques actuelles
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_professional_average_rating', { professional_uuid: cardId });
    
    if (statsError) {
      // Error log removed
      return null;
    }
    
    // Current stats retrieved
    
    // Mettre à jour manuellement les statistiques
    const { data: updateData, error: updateError } = await supabase
      .from('business_cards')
      .update({
        average_rating: statsData[0]?.average_rating || 0,
        total_reviews: statsData[0]?.total_reviews || 0,
        last_review_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select();
    
    if (updateError) {
      // Error log removed
      return null;
    }
    
    // Card stats updated
    return updateData[0];
  } catch (error) {
    // Error log removed
    return null;
  }
};

/**
 * Vérifier les avis existants pour une carte
 */
export const checkExistingReviews = async (cardId: string) => {
  try {
    // Checking existing reviews
    
    // Vérifier les avis de produits
    const { data: productReviews, error: productError } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', cardId);
    
    if (productError) {
      // Error log removed
    } else {
      // Product reviews found
    }
    
    // Vérifier les avis de professionnels
    const { data: professionalReviews, error: professionalError } = await supabase
      .from('professional_reviews')
      .select('*')
      .eq('professional_id', cardId);
    
    if (professionalError) {
      // Error log removed
    } else {
      // Professional reviews found
    }
    
    return {
      productReviews: productReviews || [],
      professionalReviews: professionalReviews || []
    };
  } catch (error) {
    // Error log removed
    return { productReviews: [], professionalReviews: [] };
  }
};

/**
 * Diagnostiquer les problèmes d'avis pour une carte
 */
export const diagnoseReviewIssues = async (cardId: string) => {
  // Diagnosing review issues
  
  // Vérifier les avis existants
  const reviews = await checkExistingReviews(cardId);
  
  // Vérifier les statistiques actuelles
  const { data: cardData, error: cardError } = await supabase
    .from('business_cards')
    .select('average_rating, total_reviews, last_review_at')
    .eq('id', cardId)
    .single();
  
  if (cardError) {
    // Error log removed
  } else {
    // Current card stats retrieved
  }
  
  // Forcer la mise à jour des statistiques
  const updatedStats = await forceUpdateReviewStats(cardId);
  
  // Diagnosis complete
  
  return {
    reviews,
    currentStats: cardData,
    updatedStats
  };
}; 