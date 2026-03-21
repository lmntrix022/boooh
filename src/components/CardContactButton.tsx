import React from 'react';
import { Button } from "@/components/ui/button";
import { downloadVCard } from '@/utils/vCardUtils';

interface CardContactButtonProps {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  address?: string;
  description?: string;
  cardUrl?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    portfolio?: string;
    facebook?: string;
    youtube?: string;
    whatsapp?: string;
  };
}

const CardContactButton: React.FC<CardContactButtonProps> = ({
  name,
  title,
  company,
  email,
  phone,
  website,
  avatar,
  address,
  description,
  cardUrl,
  socials,
}) => {
  const handleDownload = async () => {
    try {
      await downloadVCard({
      name,
      title,
      company,
      email,
      phone,
      website,
      avatar,
        address,
        description,
        cardUrl,
        socials,
    });
    } catch (error) {
      // Error log removed
    }
  };
  
  return (
    <Button 
      className="w-full mt-6 py-6 text-lg rounded-full bg-blue-950 text-white shadow-[4px_4px_8px_#d9d9d9,_-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d9d9d9,_-2px_-2px_4px_#ffffff] transition-all duration-300 active:shadow-[inset_4px_4px_8px_#d9d9d9,_inset_-4px_-4px_8px_#ffffff]"
      onClick={handleDownload}
    >
      Sauvegarder contact
    </Button>
  );
};

export default CardContactButton;
