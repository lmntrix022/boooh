import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ExternalLink } from 'lucide-react';

interface TermsConsentProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
  error?: string;
  className?: string;
}

export const TermsConsent: React.FC<TermsConsentProps> = ({
  accepted,
  onAcceptChange,
  error,
  className = ''
}) => {
  const { t } = useLanguage();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header avec icône */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 border border-blue-200">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('terms.title')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('terms.subtitle')}
          </p>
        </div>
      </div>

      {/* Zone de consentement */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-consent"
            checked={accepted}
            onCheckedChange={(checked) => onAcceptChange(checked as boolean)}
            className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <div className="flex-1">
            <Label
              htmlFor="terms-consent"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              {t('terms.consentText')}{' '}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
              >
                {t('terms.conditionsLink')}
                <ExternalLink className="w-3 h-3" />
              </Link>
              {' '}{t('terms.and')}{' '}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
              >
                {t('terms.privacyLink')}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Label>

            {/* Résumé des conditions importantes */}
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
              <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                {t('terms.summaryTitle')}
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {t('terms.summary1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {t('terms.summary2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {t('terms.summary3')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Note légale */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-200">
        <p className="leading-relaxed">
          {t('terms.legalNote')}
        </p>
      </div>
    </div>
  );
};

export default TermsConsent;