import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import FooterDark from '@/components/FooterDark';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { Book, Video, MessageCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const Help = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // SEO Meta Tags
  useSEO({
    title: 'Support Bööh – Assistance et documentation',
    description: 'Besoin d\'aide ? Accédez à notre base de connaissances, tutoriels vidéo et support client.',
    image: 'https://booh.ga/og-image-help.png',
    url: 'https://booh.ga/help',
    type: 'website',
    keywords: 'support booh, aide booh, documentation booh, tutoriels booh, assistance'
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.support'), url: 'https://booh.ga/help' }
  ];

  const helpSections = [
    {
      icon: <Book className="w-6 h-6" />,
      title: t('help.documentation.title'),
      description: t('help.documentation.description'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: t('help.videos.title'),
      description: t('help.videos.description'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: t('help.support.title'),
      description: t('help.support.description'),
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const quickLinks = [
    { title: t('help.gettingStarted'), link: '/getting-started' },
    { title: t('help.manageCard'), link: '/docs/cards' },
    { title: t('help.configureCRM'), link: '/docs/crm' },
    { title: t('help.manageStock'), link: '/docs/stock' },
    { title: t('help.protectFiles'), link: '/docs/drm' },
    { title: t('help.createShop'), link: '/docs/marketplace' },
    { title: t('help.billing'), link: '/docs/billing' },
    { title: t('help.teamManagement'), link: '/docs/team' }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 apple-minimal-font">
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      
      {/* H1 pour SEO */}
      <h1 className="sr-only">Aide & support Bööh</h1>

      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-light mb-6 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >
            {t('help.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 mb-8 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('help.description')}
          </motion.p>
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <input
              type="text"
              placeholder={t('help.searchPlaceholder')}
              className="w-full bg-white border border-gray-200 rounded-lg px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Help Sections */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {helpSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 text-gray-600">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-light mb-3 text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >{section.title}</h2>
                <p className="text-gray-500 mb-4 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{section.description}</p>
                <Link to="#" className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('help.learnMore')} <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-3xl font-bold mb-8">{t('help.quickLinks')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.link}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <span className="text-gray-300">{link.title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </Link>
              ))}
            </div>
          </div>
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
              {t('help.cta.title')}
            </h2>
            <p className="text-xl text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('help.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/contact')}
                className="bg-gray-900 text-white px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-800 transition shadow-sm"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('help.cta.contact')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/faq')}
                className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-50 transition"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('help.cta.seeFAQ')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterDark />
    </div>
  );
};

export default Help;

