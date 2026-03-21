import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, Building, Globe, ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScannedContact } from '@/services/scannedContactsService';
import { useLanguage } from '@/hooks/useLanguage';

interface ContactHeaderProps {
  contact: ScannedContact;
  rfmScores: any;
  rfmReco: any;
  onBack: () => void;
}

export const ContactHeader: React.FC<ContactHeaderProps> = ({
  contact,
  rfmScores,
  rfmReco,
  onBack
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('crmDetail.contactHeader.backToContacts')}
        </Button>
      </div>
      
      {/* Header Contact Premium */}
      <motion.div 
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-gray-200">
              <AvatarImage src={contact.scan_source_image_url} />
              <AvatarFallback className="bg-gray-100 text-gray-900 text-2xl sm:text-3xl font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {contact.full_name?.charAt(0) || contact.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >{contact.full_name || t('crmDetail.contactHeader.noName')}</h1>
              {rfmScores && rfmReco && (
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-sm sm:text-base px-2 sm:px-3 py-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {rfmReco.icon} {rfmScores.segment.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              )}
            </div>
            {contact.title && <p className="text-gray-500 text-base sm:text-lg mb-1 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >{contact.title}</p>}
            {contact.company && (
              <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 text-base sm:text-lg font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                {contact.company}
              </p>
            )}
            
            {/* Tags */}
            <div className="flex gap-2 mt-3 flex-wrap justify-center sm:justify-start">
              {contact.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-200 text-xs sm:text-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Contact rapide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {contact.email && (
                <a 
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="truncate text-gray-600">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a 
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">{contact.phone}</span>
                </a>
              )}
              {contact.website && (
                <a 
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Globe className="w-4 h-4 text-gray-600" />
                  <span className="truncate text-gray-600">{t('crmDetail.contactHeader.website')}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
