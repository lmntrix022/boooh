import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import FooterDark from '@/components/FooterDark';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { Shield, ShoppingCart, Package, Users, Eye } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const Features = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // SEO Meta Tags
  useSEO({
    title: 'Fonctionnalités Bööh – tout pour gérer votre business',
    description: 'Découvrez toutes les fonctionnalités Bööh : CRM IA, carte de visite digitale, gestion des commandes, facturation, stock, DRM, OCR intelligent et plus.',
    image: 'https://booh.ga/og-image-features.png',
    url: 'https://booh.ga/features',
    type: 'website',
    keywords: 'CRM IA, OCR carte de visite, protection DRM, gestion de stock, plateforme business tout-en-un'
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.features'), url: 'https://booh.ga/features' }
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: t('features.crm.title'),
      description: t('features.crm.description'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: t('features.ecommerce.title'),
      description: t('features.ecommerce.description'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: t('features.inventory.title'),
      description: t('features.inventory.description'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('features.drm.title'),
      description: t('features.drm.description'),
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: t('features.ocr.title'),
      description: t('features.ocr.description'),
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('features.collaboration.title'),
      description: t('features.collaboration.description'),
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 apple-minimal-font">
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      
      {/* H1 pour SEO */}
      <h1 className="sr-only">Découvrez tout ce que Bööh fait pour votre business.</h1>

      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            {t('features.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-12"
          >
            {t('features.description')}
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mb-6 text-gray-600">
                  {feature.icon}
                </div>
                <h2 className="text-2xl font-light mb-4 text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >{feature.title}</h2>
                <p className="text-gray-500 font-light leading-relaxed"
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

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6 text-gray-900 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >
            {t('features.cta.title')}
          </h2>
          <p className="text-xl text-gray-500 mb-8 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('features.cta.description')}
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-gray-900 text-white px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-800 transition"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('features.cta.button')}
          </button>
        </div>
      </section>

      <FooterDark />
    </div>
  );
};

export default Features;

