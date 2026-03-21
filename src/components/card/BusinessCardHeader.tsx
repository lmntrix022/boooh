import React from 'react';
import HeaderBackground from './HeaderBackground';
import HeaderAvatar from './HeaderAvatar';
import HeaderCompany from './HeaderCompany';
import HeaderActions from './HeaderActions';
import BusinessCardToggle from './BusinessCardToggle';

interface BusinessCardHeaderProps {
  name: string;
  company?: string;
  companyLogo?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  address?: string;
  backgroundImage?: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  getPublicUrl: (path: string, bucket?: string) => string;
  coverImageUrl: string;
  avatarUrl: string;
  initials: string;
  shouldShowSlider?: boolean;
  activeSlider?: 'liens' | 'boutique';
  setActiveSlider?: (slider: 'liens' | 'boutique') => void;
}

const BusinessCardHeader: React.FC<BusinessCardHeaderProps> = ({
  name,
  company,
  companyLogo,
  avatar,
  email,
  phone,
  address,
  socials,
  getPublicUrl,
  coverImageUrl,
  avatarUrl,
  initials,
  shouldShowSlider = false,
  activeSlider = 'liens',
  setActiveSlider
}) => {

  return (
    <div className="relative h-48 pt-6 pb-4 overflow-hidden">
      {/* Background optimisé */}
      <HeaderBackground coverImageUrl={coverImageUrl} />
      
      {/* Contenu au-dessus de l'image de couverture */}
      <div className="relative z-20 flex flex-col items-center pt-8 pb-4">
        {/* Avatar optimisé */}
        <HeaderAvatar
          name={name}
          avatar={avatar}
          avatarUrl={avatarUrl}
          initials={initials}
        />

        {/* Nom d'utilisateur */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">{name}</h1>
        </div>

        {/* Logo et nom de l'entreprise */}
        <HeaderCompany
          company={company}
          companyLogo={companyLogo}
          getPublicUrl={getPublicUrl}
        />

        {/* Actions et réseaux sociaux */}
        <HeaderActions
          phone={phone}
          email={email}
          address={address}
          socials={socials}
        />

        {/* Toggle slider intégré dans le header */}
        {shouldShowSlider && setActiveSlider && (
          <BusinessCardToggle
            shouldShowSlider={shouldShowSlider}
            activeSlider={activeSlider}
            setActiveSlider={setActiveSlider}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessCardHeader;
