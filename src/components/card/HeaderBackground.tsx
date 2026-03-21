import React from 'react';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';

interface HeaderBackgroundProps {
  coverImageUrl: string;
}

const HeaderBackground: React.FC<HeaderBackgroundProps> = ({ coverImageUrl }) => {
  return (
    <>
      {/* Photo de couverture avec chargement optimisé */}
      {coverImageUrl ? (
        <CardImageOptimizer
          src={coverImageUrl}
          alt="Photo de couverture"
          className="absolute inset-0 w-full h-full object-cover"
          type="cover"
          priority={true}
          onError={() => {}}
          onLoad={() => {}}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"></div>
      )}
      
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/20"></div>
    </>
  );
};

export default HeaderBackground;
