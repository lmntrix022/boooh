import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();

  return (
    <div className="flex items-center space-x-4">
      <Globe className="h-5 w-5 text-gray-500" />
      <Select value={currentLanguage} onValueChange={changeLanguage}>
        <SelectTrigger className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm transition-all hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
          <SelectValue placeholder={t('settings.languageDescription')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr">{t('languages.fr')}</SelectItem>
          <SelectItem value="en">{t('languages.en')}</SelectItem>
          <SelectItem value="es">{t('languages.es')}</SelectItem>
          <SelectItem value="de">{t('languages.de')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};



