import React from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { Scale, Building, Mail, Globe, Phone } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useLanguage } from '@/hooks/useLanguage';

const Legal: React.FC = () => {
  const { t } = useLanguage();

  useSEO({
    title: `${t('legal.legalNotice.title')} - Bööh`,
    description: 'Informations légales et coordonnées de la plateforme Bööh.',
    url: 'https://booh.ga/legal',
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
                    <Scale className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600 relative z-10" />
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
                      {t('legal.legalNotice.title')}
                    </h1>
                    <p
                      className="text-sm md:text-base font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.legalNotice.description')}
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
            {/* Section 1 - Éditeur */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-50 border border-green-200">
                    <Building className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.legalNotice.publisher.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.editor.companyName')} :</p>
                          <p className="text-gray-600">SASU MiscochIT</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.editor.legalForm')} :</p>
                          <p className="text-gray-600">SASU</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.editor.headquarters')} :</p>
                          <p className="text-gray-600">Libreville, Gabon</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.editor.rccmNumber')} :</p>
                          <p className="text-gray-600">GA-LBV-01-2024-B17-00004</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.editor.publicationDirector')} :</p>
                          <p className="text-gray-600">Quantin EKOUAGHE</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 - Hébergement */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50 border border-purple-200">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.legalNotice.hosting.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.hosting.host')} :</p>
                        <p className="text-gray-600">Vercel Inc.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.hosting.address')} :</p>
                        <p className="text-gray-600">440 N Barranca Ave #4133<br />Covina, CA 91723, USA</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">{t('legal.legalNotice.hosting.website')} :</p>
                        <p className="text-gray-600"><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">vercel.com</a></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 - Contact */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-50 border border-green-200">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-light text-gray-900 mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('legal.legalNotice.contact.title')}
                    </h2>
                    <div className="text-gray-600 space-y-3" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900">{t('legal.legalNotice.contact.generalEmail')} :</p>
                          <a href="mailto:contact@booh.ga" className="text-blue-600 hover:text-blue-800 underline">contact@booh.ga</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900">{t('legal.legalNotice.contact.technicalSupport')} :</p>
                          <a href="mailto:support@booh.ga" className="text-blue-600 hover:text-blue-800 underline">support@booh.ga</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900">{t('legal.legalNotice.contact.legalQuestions')} :</p>
                          <a href="mailto:legal@booh.ga" className="text-blue-600 hover:text-blue-800 underline">legal@booh.ga</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900">{t('legal.legalNotice.contact.phone')} :</p>
                          <a href="tel:+24174398524" className="text-blue-600 hover:text-blue-800 underline">+241 74 39 85 24</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 - Propriété Intellectuelle */}
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
                    {t('legal.legalNotice.intellectualProperty.title')}
                  </h2>
                  <p>{t('legal.legalNotice.intellectualProperty.text1')}</p>
                  <p>{t('legal.legalNotice.intellectualProperty.text2')}</p>
                  <p>{t('legal.legalNotice.intellectualProperty.text3')}</p>
                </div>
              </div>
            </div>

            {/* Section 5 - Données Personnelles */}
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
                    {t('legal.legalNotice.personalData.title')}
                  </h2>
                  <p>{t('legal.legalNotice.personalData.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t('legal.legalNotice.personalData.purpose1')}</li>
                    <li>{t('legal.legalNotice.personalData.purpose2')}</li>
                    <li>{t('legal.legalNotice.personalData.purpose3')}</li>
                    <li>{t('legal.legalNotice.personalData.purpose4')}</li>
                  </ul>
                  <p className="mt-4">{t('legal.legalNotice.personalData.gdprText')}</p>
                  <p>
                    {t('legal.legalNotice.personalData.moreInfo')} <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Politique de Confidentialité</a>.
                  </p>
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
                    {t('legal.legalNotice.cookies.title')}
                  </h2>
                  <p>{t('legal.legalNotice.cookies.text1')}</p>
                  <p>{t('legal.legalNotice.cookies.text2')}</p>
                </div>
              </div>
            </div>

            {/* Section 7 - Responsabilité */}
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
                    {t('legal.legalNotice.liability.title')}
                  </h2>
                  <p>{t('legal.legalNotice.liability.text1')}</p>
                  <p>{t('legal.legalNotice.liability.text2')}</p>
                </div>
              </div>
            </div>

            {/* Section 8 - Liens Hypertextes */}
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
                    {t('legal.legalNotice.hyperlinks.title')}
                  </h2>
                  <p>{t('legal.legalNotice.hyperlinks.text1')}</p>
                  <p>{t('legal.legalNotice.hyperlinks.text2')}</p>
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
                    {t('legal.legalNotice.applicableLaw.title')}
                  </h2>
                  <p>{t('legal.legalNotice.applicableLaw.text1')}</p>
                  <p>{t('legal.legalNotice.applicableLaw.text2')}</p>
                </div>
              </div>
            </div>

            {/* Section 10 - Crédits */}
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
                    {t('legal.legalNotice.credits.title')}
                  </h2>
                  <p>
                    <strong>{t('legal.legalNotice.credits.editor')} :</strong> <a href="https://miscoch-it.ga" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">SASU MiscochIT</a>
                  </p>
                  <p>
                    <strong>{t('legal.legalNotice.credits.product')} :</strong> Bööh - Plateforme de cartes de visite digitales
                  </p>
                  <p>
                    <strong>{t('legal.legalNotice.credits.design')} :</strong> <a href="https://miscoch-it.ga" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Miscoch IT</a>
                  </p>
                  <p>
                    <strong>{t('legal.legalNotice.credits.illustrations')} :</strong> Lucide Icons, Custom illustrations
                  </p>
                  <p>
                    <strong>{t('legal.legalNotice.credits.technologies')} :</strong> React, TypeScript, Tailwind CSS, Supabase, Vercel
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="relative bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">{t('legal.legalNotice.contactSection.title')}</h2>
              <p className="text-gray-300 mb-6">
                {t('legal.legalNotice.contactSection.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:legal@booh.ga"
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-semibold transition"
                >
                  legal@booh.ga
                </a>
                <a
                  href="/contact"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition"
                >
                  Formulaire de contact
                </a>
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

export default Legal;