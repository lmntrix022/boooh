import { Tables } from '@/integrations/supabase/types';

export type Review = Tables<"reviews">;
export type ReviewVote = Tables<"review_votes">;
export type ProfessionalReview = Tables<"professional_reviews">;
export type ProfessionalReviewVote = Tables<"professional_review_votes">;

export interface ReviewWithVotes extends Review {
  review_votes: ReviewVote[];
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface ProfessionalReviewWithVotes extends ProfessionalReview {
  professional_review_votes: ProfessionalReviewVote[];
  user?: {
    full_name: string;
    avatar_url: string;
  };
  professional?: {
    name: string;
    company: string;
    avatar_url: string;
  };
}

export interface ProductRating {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  images: File[];
  reviewer_name: string;
  reviewer_email: string;
}

export interface ProfessionalReviewFormData {
  rating: number;
  title: string;
  comment: string;
  images: File[];
  reviewer_name: string;
  reviewer_email: string;
  review_type: 'general' | 'service' | 'communication' | 'professionalism';
  service_category?: string;
  is_verified_contact: boolean;
}

export interface ReviewFilters {
  rating?: number;
  sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful';
  verifiedOnly?: boolean;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_breakdown: {
    [key: number]: number;
  };
  recent_reviews: number;
  helpful_reviews: number;
}

// Types pour les composants
export interface ReviewCardProps {
  review: ReviewWithVotes;
  onVote: (reviewId: string, isHelpful: boolean) => void;
  onReport: (reviewId: string, reason: string) => void;
  canVote: boolean;
  userVote?: boolean | null;
}

export interface ProfessionalReviewCardProps {
  review: ProfessionalReviewWithVotes;
  onVote: (reviewId: string, isHelpful: boolean) => void;
  onReport: (reviewId: string, reason: string) => void;
  canVote: boolean;
  userVote?: boolean | null;
}

export interface ReviewFormProps {
  productId: string;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export interface ProfessionalReviewFormProps {
  professionalId: string;
  onSubmit: (data: ProfessionalReviewFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface ReviewListProps {
  productId: string;
  reviews: ReviewWithVotes[];
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

// Types pour les hooks
export interface UseReviewsOptions {
  productId: string;
  filters?: ReviewFilters;
  limit?: number;
  enabled?: boolean;
}

export interface UseReviewVoteOptions {
  reviewId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Types pour les utilitaires
export interface ReviewValidation {
  isValid: boolean;
  errors: {
    rating?: string;
    title?: string;
    comment?: string;
    reviewer_name?: string;
    reviewer_email?: string;
  };
}

export interface ReviewAnalytics {
  product_id: string;
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  recent_trend: 'up' | 'down' | 'stable';
  response_rate: number;
  average_response_time: number;
} 