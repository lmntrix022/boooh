import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  CheckCircle, 
  Image as ImageIcon,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RatingDisplay from './RatingDisplay';
import { ReviewCardProps } from '@/types/reviews';
import { formatReviewDate } from '@/utils/dateUtils';

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onVote,
  onReport,
  canVote,
  userVote
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (isHelpful: boolean) => {
    if (!canVote) {
      toast({
        title: "Action non autorisée",
        description: "Vous devez être connecté pour voter.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Utiliser une IP par défaut au lieu de faire un appel externe
      const voterIp = '127.0.0.1'; // IP par défaut

      const { error } = await supabase
        .from('review_votes')
        .upsert({
          review_id: review.id,
          user_id: user?.id || null,
          voter_ip: voterIp,
          is_helpful: isHelpful
        }, {
          onConflict: 'review_id,user_id,voter_ip'
        });

      if (error) throw error;

      onVote(review.id, isHelpful);
      
      toast({
        title: "Vote enregistré",
        description: `Merci pour votre ${isHelpful ? 'vote positif' : 'vote négatif'} !`,
      });
    } catch (error) {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre vote.",
        variant: "destructive",
      });
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "Raison requise",
        description: "Veuillez indiquer la raison du signalement.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_flagged: true,
          flag_reason: reportReason
        })
        .eq('id', review.id);

      if (error) throw error;

      onReport(review.id, reportReason);
      setShowReportDialog(false);
      setReportReason('');
      
      toast({
        title: "Signalement envoyé",
        description: "Merci de nous avoir signalé ce problème. Nous l'examinerons rapidement.",
      });
    } catch (error) {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le signalement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-white/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800">
                      {review.reviewer_name}
                    </h4>
                    {review.is_verified_purchase && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Achat vérifié
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <RatingDisplay 
                      rating={review.rating} 
                      size="sm" 
                      showCount={false}
                    />
                    <span>•</span>
                    <span>{formatReviewDate(review.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <Badge className={getRatingColor(review.rating)}>
                {review.rating}/5
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {review.title && (
              <h5 className="font-medium text-gray-800 mb-2">
                {review.title}
              </h5>
            )}
            
            {review.comment && (
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                {review.comment}
              </p>
            )}

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {review.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(true)}
                  className={`flex items-center gap-1 text-xs ${
                    userVote === true ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600'
                  }`}
                  disabled={!canVote}
                >
                  <ThumbsUp className="w-3 h-3" />
                  Utile ({review.helpful_votes})
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(false)}
                  className={`flex items-center gap-1 text-xs ${
                    userVote === false ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-red-600'
                  }`}
                  disabled={!canVote}
                >
                  <ThumbsDown className="w-3 h-3" />
                  Pas utile
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportDialog(true)}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                <Flag className="w-3 h-3 mr-1" />
                Signaler
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Signaler cet avis</DialogTitle>
            <DialogDescription>
              Aidez-nous à maintenir la qualité de nos avis en signalant tout contenu inapproprié.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Raison du signalement *
              </label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Décrivez la raison du signalement..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleReport}
                disabled={isSubmitting || !reportReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? 'Envoi...' : 'Signaler'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewCard; 