import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import PublicNavbar from '@/components/layout/PublicNavbar';
import FooterDark from '@/components/FooterDark';
import { CheckCircle, ArrowRight, User, CreditCard, Settings, Rocket } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const GettingStarted = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useSEO({
    title: t('gettingStarted.seoTitle'),
    description: t('gettingStarted.seoDescription'),
    image: 'https://booh.ga/og-image-help.png',
    url: 'https://booh.ga/getting-started',
    type: 'article',
    keywords: t('gettingStarted.seoKeywords')
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.support'), url: 'https://booh.ga/help' },
    { name: t('gettingStarted.title'), url: 'https://booh.ga/getting-started' }
  ];

  const steps = [
    {
      icon: <User className="w-6 h-6" />,
      title: t('gettingStarted.steps.createAccount.title'),
      description: t('gettingStarted.steps.createAccount.description'),
      steps: t('gettingStarted.steps.createAccount.steps', { returnObjects: true }) as string[]
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: t('gettingStarted.steps.configureCard.title'),
      description: t('gettingStarted.steps.configureCard.description'),
      steps: t('gettingStarted.steps.configureCard.steps', { returnObjects: true }) as string[]
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: t('gettingStarted.steps.activateFeatures.title'),
      description: t('gettingStarted.steps.activateFeatures.description'),
      steps: t('gettingStarted.steps.activateFeatures.steps', { returnObjects: true }) as string[]
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: t('gettingStarted.steps.choosePlan.title'),
      description: t('gettingStarted.steps.choosePlan.description'),
      steps: t('gettingStarted.steps.choosePlan.steps', { returnObjects: true }) as string[]
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden apple-minimal-font">
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />

      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              {t('gettingStarted.title')}
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('gettingStarted.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="bg-gray-900 text-white px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-800 transition shadow-sm"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('gettingStarted.createAccount')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/help')}
                className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-50 transition"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('gettingStarted.viewDocs')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10"
              >
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-light text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('gettingStarted.step')} {index + 1}
                      </span>
                    </div>
                    <h2 className="text-3xl font-light mb-2 text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >{step.title}</h2>
                    <p className="text-gray-500 text-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{step.description}</p>
                  </div>
                </div>
                <div className="ml-22 md:ml-24 space-y-3">
                  {step.steps.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light mb-8 text-center tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              {t('gettingStarted.tips.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(t('gettingStarted.tips.tips', { returnObjects: true }) as string[]).map((tip, index) => (
                <div key={index} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4">
                  <span className="text-2xl">✨</span>
                  <p className="text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light mb-6 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              {t('gettingStarted.cta.title')}
            </h2>
            <p className="text-xl text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('gettingStarted.cta.description')}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="bg-gray-900 text-white px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-800 transition shadow-sm inline-flex items-center gap-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('gettingStarted.cta.button')} <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <FooterDark />
    </div>
  );
};

export default GettingStarted;

