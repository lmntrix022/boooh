import React from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useLanguage } from '@/hooks/useLanguage';

const Privacy: React.FC = () => {
  const { t } = useLanguage();

  useSEO({
    title: `${t('legal.privacy.title')} - Bööh`,
    description: 'Découvrez comment Bööh protège vos données personnelles et respecte votre vie privée.',
    url: 'https://booh.ga/privacy',
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
                    <Shield className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600 relative z-10" />
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
                      {t('legal.privacy.title')}
                    </h1>
                    <p
                      className="text-sm md:text-base font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.privacy.lastUpdate')} : {new Date().toLocaleDateString('fr-FR')}
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
            {/* Section 1 - Introduction */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 border border-blue-200">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.privacy.intro.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.privacy.intro.text1')}</p>
                      <p>{t('legal.privacy.intro.text2')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 - Données collectées par Bööh */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-50 border border-green-200">
                    <Database className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      Données collectées par Bööh
                    </h2>
                    <div className="text-gray-600 space-y-4" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Informations de compte :</h3>
                        <p className="ml-4">Nom, prénom, adresse email, numéro de téléphone pour créer et gérer votre compte Bööh.</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Données de vos cartes de visite :</h3>
                        <p className="ml-4">Informations professionnelles, photos, liens sociaux, contenu multimédia, et données de localisation que vous choisissez de partager.</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Données de paiement et transactions :</h3>
                        <p className="ml-4">Informations de paiement Mobile Money pour les plans payants, et données de transaction pour les commissions sur ventes.</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Données d'utilisation :</h3>
                        <p className="ml-4">Statistiques anonymisées sur l'utilisation de l'app, vues de cartes, interactions, pour améliorer nos services.</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Données techniques :</h3>
                        <p className="ml-4">Adresse IP, type d'appareil, navigateur, pour la sécurité et la résolution de problèmes techniques.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 - Utilisation des Données */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50 border border-purple-200">
                    <Lock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.privacy.dataUsage.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.privacy.dataUsage.intro')}</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>{t('legal.privacy.dataUsage.list1')}</li>
                        <li>{t('legal.privacy.dataUsage.list2')}</li>
                        <li>{t('legal.privacy.dataUsage.list3')}</li>
                        <li>{t('legal.privacy.dataUsage.list4')}</li>
                        <li>{t('legal.privacy.dataUsage.list5')}</li>
                        <li>{t('legal.privacy.dataUsage.list6')}</li>
                        <li>{t('legal.privacy.dataUsage.list7')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 - Vos Droits (RGPD) */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-50 border border-yellow-200">
                    <UserCheck className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.privacy.rights.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.privacy.rights.intro')}</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>{t('legal.privacy.rights.access').split(':')[0]}</strong> : {t('legal.privacy.rights.access').split(':')[1]}</li>
                        <li><strong>{t('legal.privacy.rights.rectification').split(':')[0]}</strong> : {t('legal.privacy.rights.rectification').split(':')[1]}</li>
                        <li><strong>{t('legal.privacy.rights.erasure').split(':')[0]}</strong> : {t('legal.privacy.rights.erasure').split(':')[1]}</li>
                        <li><strong>{t('legal.privacy.rights.portability').split(':')[0]}</strong> : {t('legal.privacy.rights.portability').split(':')[1]}</li>
                        <li><strong>{t('legal.privacy.rights.objection').split(':')[0]}</strong> : {t('legal.privacy.rights.objection').split(':')[1]}</li>
                        <li><strong>{t('legal.privacy.rights.limitation').split(':')[0]}</strong> : {t('legal.privacy.rights.limitation').split(':')[1]}</li>
                      </ul>
                      <p className="mt-4">
                        {t('legal.privacy.rights.contact')} <a href="mailto:privacy@booh.ga" className="text-blue-600 hover:text-blue-800 underline">privacy@booh.ga</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 - Sécurité et Conservation */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 border border-red-200">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.privacy.security.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <p>{t('legal.privacy.security.securityText')}</p>
                      <p>{t('legal.privacy.security.conservationText')}</p>
                      <p>{t('legal.privacy.security.sharingText')}</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>{t('legal.privacy.security.providers')}</li>
                        <li>{t('legal.privacy.security.authorities')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 - Cookies */}
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
                    {t('legal.privacy.cookies.title')}
                  </h2>
                  <p>{t('legal.privacy.cookies.text1')}</p>
                  <p>{t('legal.privacy.cookies.text2')}</p>
                </div>
              </div>
            </div>

            {/* Section 7 - Modifications */}
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
                    {t('legal.privacy.modifications.title')}
                  </h2>
                  <p>{t('legal.privacy.modifications.text')}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="relative bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 text-center">
                <h2
                  className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('legal.privacy.contact.title')}
                </h2>
                <p className="text-gray-600 mb-6" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  {t('legal.privacy.contact.description')}
                </p>
                <div className="text-gray-600 mb-6 space-y-2" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  <p><strong>{t('legal.privacy.contact.company')}</strong></p>
                  <p>{t('legal.privacy.contact.location')}</p>
                  <p>RCCM : GA-LBV-01-2024-B17-00004</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:privacy@booh.ga"
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 400,
                    }}
                  >
                    privacy@booh.ga
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

export default Privacy;