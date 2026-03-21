import React from 'react';
import { motion } from 'framer-motion';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';

interface HeaderAvatarProps {
  name: string;
  avatar?: string;
  avatarUrl: string;
  initials: string;
}

const HeaderAvatar: React.FC<HeaderAvatarProps> = ({
  name,
  avatar,
  avatarUrl,
  initials
}) => {
  return (
    <div className="flex justify-center mb-6">
      <motion.div 
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {avatar ? (
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg">
            <CardImageOptimizer
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
              type="avatar"
              priority={true}
              onError={() => {}}
              onLoad={() => {}}
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full border-2 border-white shadow-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HeaderAvatar;
