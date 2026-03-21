import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import PublicNavbar from '@/components/layout/PublicNavbar';
import FooterDark from '@/components/FooterDark';
import { CreditCard, QrCode, Share2, Settings, Palette, Link2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const DocsCards = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useSEO({
    title: t('docs.cards.seoTitle'),
    description: t('docs.cards.seoDescription'),
    image: 'https://booh.ga/og-image-help.png',
    url: 'https://booh.ga/docs/cards',
    type: 'article',
    keywords: t('docs.cards.seoKeywords')
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.support'), url: 'https://booh.ga/help' },
    { name: t('docs.cards.title'), url: 'https://booh.ga/docs/cards' }
  ];

  const features = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: t('docs.cards.features.create.title'),
      description: t('docs.cards.features.create.description')
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: t('docs.cards.features.customize.title'),
      description: t('docs.cards.features.customize.description')
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: t('docs.cards.features.qrCode.title'),
      description: t('docs.cards.features.qrCode.description')
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: t('docs.cards.features.share.title'),
      description: t('docs.cards.features.share.description')
    },
    {
      icon: <Link2 className="w-6 h-6" />,
      title: t('docs.cards.features.customUrl.title'),
      description: t('docs.cards.features.customUrl.description')
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: t('docs.cards.features.advanced.title'),
      description: t('docs.cards.features.advanced.description')
    }
  ];

  const steps = [
    {
      step: 1,
      title: t('docs.cards.steps.step1.title'),
      content: t('docs.cards.steps.step1.content')
    },
    {
      step: 2,
      title: t('docs.cards.steps.step2.title'),
      content: t('docs.cards.steps.step2.content')
    },
    {
      step: 3,
      title: t('docs.cards.steps.step3.title'),
      content: t('docs.cards.steps.step3.content')
    },
    {
      step: 4,
      title: t('docs.cards.steps.step4.title'),
      content: t('docs.cards.steps.step4.content')
    },
    {
      step: 5,
      title: t('docs.cards.steps.step5.title'),
      content: t('docs.cards.steps.step5.content')
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden apple-minimal-font">
      <SchemaBreadcrumb items={breadcrumbs} />
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >{t('docs.cards.title')}</h1>
            <p className="text-xl text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('docs.cards.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-light mb-2 text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >{feature.title}</h3>
                <p className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light mb-12 text-center tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >{t('docs.cards.stepByStep')}</h2>
          <div className="space-y-8">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-light text-xl flex-shrink-0"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-light mb-3 text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{item.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-light mb-6 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >{t('docs.cards.cta.title')}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-gray-900 text-white px-8 py-4 rounded-lg font-light hover:bg-gray-800 transition shadow-sm"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('docs.cards.cta.contact')}
              </Link>
              <Link
                to="/help"
                className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-light hover:bg-gray-50 transition"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('docs.cards.cta.backToHelp')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterDark />
    </div>
  );
};

export default DocsCards;

