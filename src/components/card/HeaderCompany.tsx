import React from 'react';
import { motion } from 'framer-motion';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';

interface HeaderCompanyProps {
  company?: string;
  companyLogo?: string;
  getPublicUrl: (path: string, bucket?: string) => string;
}

const HeaderCompany: React.FC<HeaderCompanyProps> = ({
  company,
  companyLogo,
  getPublicUrl
}) => {
  if (!companyLogo) return null;

  return (
    <div className="flex justify-center items-center gap-3 mb-6">
      <motion.div 
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        <div className="relative w-8 h-8 -mt-4 rounded-full overflow-hidden border-2 border-white/30 shadow-lg bg-white/10 backdrop-blur-sm">
          <CardImageOptimizer
            src={getPublicUrl(companyLogo)}
            alt={company || "Logo entreprise"}
            className="w-full h-full object-cover"
            type="logo"
            priority={true}
            onError={() => {}}
            onLoad={() => {}}
          />
        </div>
      </motion.div>
      
      {/* Nom de l'entreprise */}
      {company && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="text-center -mt-4"
        >
          <h2 className="text-sm font-semibold text-white drop-shadow-lg">{company}</h2>
        </motion.div>
      )}
    </div>
  );
};

export default HeaderCompany;
