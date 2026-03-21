import React from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { FileText, AlertCircle, Ban, DollarSign, Shield, CheckCircle } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useLanguage } from '@/hooks/useLanguage';

const Terms: React.FC = () => {
  const { t } = useLanguage();

  useSEO({
    title: `${t('legal.terms.title')} - Bööh`,
    description: 'Consultez les conditions générales d\'utilisation de la plateforme Bööh.',
    url: 'https://booh.ga/terms',
  });

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <div className="relative min-h-screen overflow-x-hidden">
        <div className="relative z-10 container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Header Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
              <div className="relative z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Icon Container Apple Minimal */}
                  <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    <FileText className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600 relative z-10" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {t('legal.terms.title')}
                    </h1>
                    <p
                      className="text-sm md:text-base font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.terms.lastUpdate')} : {new Date().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <motion.div
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Section 1 - Acceptation */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.terms.acceptance.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.terms.acceptance.text1')}</p>
                      <p>{t('legal.terms.acceptance.text2')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 - Service */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50 border border-purple-200">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.terms.service.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.terms.service.intro')}</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>{t('legal.terms.service.feature1')}</li>
                        <li>{t('legal.terms.service.feature2')}</li>
                        <li>{t('legal.terms.service.feature3')}</li>
                        <li>{t('legal.terms.service.feature4')}</li>
                        <li>{t('legal.terms.service.feature5')}</li>
                        <li>{t('legal.terms.service.feature6')}</li>
                      </ul>
                      <p className="mt-4">{t('legal.terms.service.modificationText')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 - Compte */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-50 border border-yellow-200">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.terms.account.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.terms.account.creation')}</p>
                      <p>{t('legal.terms.account.age')}</p>
                      <p>{t('legal.terms.account.oneAccount')}</p>
                      <p>{t('legal.terms.account.suspension')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 - Utilisation Interdite */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 border border-red-200">
                    <Ban className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.terms.prohibited.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.terms.prohibited.intro')}</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>{t('legal.terms.prohibited.item1')}</li>
                        <li>{t('legal.terms.prohibited.item2')}</li>
                        <li>{t('legal.terms.prohibited.item3')}</li>
                        <li>{t('legal.terms.prohibited.item4')}</li>
                        <li>{t('legal.terms.prohibited.item5')}</li>
                        <li>{t('legal.terms.prohibited.item6')}</li>
                        <li>{t('legal.terms.prohibited.item7')}</li>
                        <li>{t('legal.terms.prohibited.item8')}</li>
                        <li>{t('legal.terms.prohibited.item9')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 - Tarification et Abonnements Bööh */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 border border-blue-200">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      Abonnements et Commissions Bööh
                    </h2>
                    <div className="text-gray-600 space-y-4" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Plans d'abonnement :</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>Essentiel</strong> : Plan gratuit avec fonctionnalités basiques</li>
                          <li><strong>Connexions</strong> : 15 000 FCFA/mois - RDV et CRM avancés</li>
                          <li><strong>Commerce</strong> : 5% commission sur les transactions (pas de frais fixes)</li>
                          <li><strong>Opéré</strong> : 10% commission + accompagnement personnalisé</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Modèle de commission :</h3>
                        <p className="mb-2">Pour les plans Commerce et Opéré, vous ne payez que lorsque vous générez des revenus :</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Commission de 5% sur chaque transaction pour le plan Commerce</li>
                          <li>Commission de 10% sur chaque transaction pour le plan Opéré</li>
                          <li>Paiement automatique via Mobile Money lors des ventes</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Résiliation :</h3>
                        <p>Vous pouvez résilier votre abonnement à tout moment depuis votre tableau de bord. Pour les plans commission, les commissions courent jusqu'à la fin du mois en cours.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 - Données et Confidentialité */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50 border border-purple-200">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      Données et Confidentialité
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>Chez Bööh, la protection de vos données est notre priorité. Nous collectons uniquement les informations nécessaires au fonctionnement du service :</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Informations de compte (nom, email, téléphone)</li>
                        <li>Données de vos cartes de visite et profils</li>
                        <li>Informations de paiement pour les transactions</li>
                        <li>Données d'utilisation anonymisées pour améliorer le service</li>
                      </ul>
                      <p className="mt-3">Toutes les données sont chiffrées et stockées sur des serveurs sécurisés. Nous ne partageons jamais vos données avec des tiers sans votre consentement explicite.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7 - Propriété Intellectuelle */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="text-gray-600 space-y-3" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  <h2
                    className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('legal.terms.intellectualProperty.title')}
                  </h2>
                  <p>{t('legal.terms.intellectualProperty.yourContent')}</p>
                  <p>{t('legal.terms.intellectualProperty.ourContent')}</p>
                </div>
              </div>
            </div>

            {/* Section 8 - Limitation de Responsabilité */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="text-gray-600 space-y-3" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  <h2
                    className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('legal.terms.liability.title')}
                  </h2>
                  <p>{t('legal.terms.liability.text1')}</p>
                  <p>{t('legal.terms.liability.text2')}</p>
                </div>
              </div>
            </div>

            {/* Section 9 - Loi Applicable */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="text-gray-600 space-y-3" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  <h2
                    className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('legal.terms.law.title')}
                  </h2>
                  <p>{t('legal.terms.law.text1')}</p>
                  <p>{t('legal.terms.law.text2')}</p>
                </div>
              </div>
            </div>

            {/* Section 10 - Modifications */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="text-gray-600 space-y-3" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  <h2
                    className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('legal.terms.modifications.title')}
                  </h2>
                  <p>{t('legal.terms.modifications.text')}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 text-center">
                <h2
                  className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('legal.terms.contact.title')}
                </h2>
                <p className="text-gray-600 mb-6" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  {t('legal.terms.contact.description')}
                </p>
                <div className="text-gray-600 mb-6 space-y-2" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  <p><strong>{t('legal.terms.contact.company')}</strong></p>
                  <p>{t('legal.terms.contact.location')}</p>
                  <p>RCCM : GA-LBV-01-2024-B17-00004</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:legal@booh.ga"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 400,
                    }}
                  >
                    legal@booh.ga
                  </a>
                  <a
                    href="tel:+24174398524"
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 400,
                    }}
                  >
                    +241 74 39 85 24
                  </a>
                  <a
                    href="/contact"
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 400,
                    }}
                  >
                    Formulaire de contact
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer moderne */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}>
              © {new Date().getFullYear()} Bööh. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;