import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  CheckCircle, 
  Image as ImageIcon,
  Calendar,
  User,
  Star,
  Award,
  MessageSquare,
  Handshake,
  Briefcase
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
import { ProfessionalReviewCardProps } from '@/types/reviews';
import { formatReviewDate } from '@/utils/dateUtils';

const ProfessionalReviewCard: React.FC<ProfessionalReviewCardProps> = ({
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
        .from('professional_review_votes')
        .upsert({
          review_id: review.id,
          voter_id: user?.id || null,
          voter_ip: voterIp,
          is_helpful: isHelpful
        }, {
          onConflict: 'review_id,voter_id,voter_ip'
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
        .from('professional_reviews')
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

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return <Briefcase className="w-3 h-3" />;
      case 'communication': return <MessageSquare className="w-3 h-3" />;
      case 'professionalism': return <Award className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  const getReviewTypeLabel = (type: string) => {
    switch (type) {
      case 'service': return 'Service';
      case 'communication': return 'Communication';
      case 'professionalism': return 'Professionnel';
      default: return 'Général';
    }
  };

  const getReviewTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'communication': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'professionalism': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                      {review.reviewer_name}
                    </h4>
                    {review.is_verified_contact && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 w-fit">
                        <Handshake className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                    <RatingDisplay 
                      rating={review.rating} 
                      size="sm" 
                      showCount={false}
                    />
                    <span className="hidden sm:inline">•</span>
                    <span>{formatReviewDate(review.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                <Badge className={`${getRatingColor(review.rating)} text-xs`}>
                  {review.rating}/5
                </Badge>
                <Badge variant="outline" className={`text-xs ${getReviewTypeColor(review.review_type)} hidden sm:flex`}>
                  {getReviewTypeIcon(review.review_type)}
                  <span className="ml-1">{getReviewTypeLabel(review.review_type)}</span>
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {review.title && (
              <h5 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">
                {review.title}
              </h5>
            )}
            
            {review.comment && (
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3">
                {review.comment}
              </p>
            )}

            {review.service_category && (
              <div className="mb-3">
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                  {review.service_category}
                </Badge>
              </div>
            )}

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {review.images.map((image, index) => (
                  <div key={index} className="relative group flex-shrink-0">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(true)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 ${
                    userVote === true ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600'
                  }`}
                  disabled={!canVote}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Utile</span>
                  <span className="sm:hidden">({review.helpful_votes})</span>
                  <span className="hidden sm:inline">({review.helpful_votes})</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(false)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 ${
                    userVote === false ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-red-600'
                  }`}
                  disabled={!canVote}
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span className="hidden sm:inline">Pas utile</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportDialog(true)}
                className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 self-start sm:self-auto"
              >
                <Flag className="w-3 h-3 mr-1" />
                Signaler
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Signaler cet avis</DialogTitle>
            <DialogDescription className="text-sm">
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
                className="resize-none text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                onClick={handleReport}
                disabled={isSubmitting || !reportReason.trim()}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
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

export default ProfessionalReviewCard; 