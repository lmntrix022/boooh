import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { motion } from 'framer-motion';
import { RatingDisplayProps } from '@/types/reviews';

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  totalReviews,
  size = 'md',
  showCount = true,
  interactive = false,
  onRatingChange
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const containerClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Étoiles pleines
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <motion.div
          key={`full-${i}`}
          whileHover={interactive ? { scale: 1.1 } : {}}
          whileTap={interactive ? { scale: 0.95 } : {}}
        >
          <Star
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400 ${
              interactive ? 'cursor-pointer hover:fill-yellow-500' : ''
            }`}
            onClick={() => interactive && onRatingChange?.(i + 1)}
          />
        </motion.div>
      );
    }

    // Demi-étoile
    if (hasHalfStar) {
      stars.push(
        <motion.div
          key="half"
          whileHover={interactive ? { scale: 1.1 } : {}}
          whileTap={interactive ? { scale: 0.95 } : {}}
        >
          <StarHalf
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400 ${
              interactive ? 'cursor-pointer hover:fill-yellow-500' : ''
            }`}
            onClick={() => interactive && onRatingChange?.(fullStars + 0.5)}
          />
        </motion.div>
      );
    }

    // Étoiles vides
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <motion.div
          key={`empty-${i}`}
          whileHover={interactive ? { scale: 1.1 } : {}}
          whileTap={interactive ? { scale: 0.95 } : {}}
        >
          <Star
            className={`${sizeClasses[size]} text-gray-300 ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={() => interactive && onRatingChange?.(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
          />
        </motion.div>
      );
    }

    return stars;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center ${containerClasses[size]}`}>
        {renderStars()}
      </div>
      
      {showCount && (
        <div className="flex items-center gap-1">
          <span className={`font-medium text-gray-700 ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}>
            {rating.toFixed(1)}
          </span>
          {totalReviews !== undefined && (
            <span className={`text-gray-500 ${
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
            }`}>
              ({totalReviews} {totalReviews === 1 ? 'avis' : 'avis'})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay; 