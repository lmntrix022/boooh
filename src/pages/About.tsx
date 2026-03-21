import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import { SchemaOrganization } from '@/components/SEO/SchemaOrganization';
import FooterDark from '@/components/FooterDark';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { Target, Heart, Eye, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const About = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // SEO Meta Tags
  useSEO({
    title: 'Bööh – Notre mission : simplifier le business numérique',
    description: 'Nous aidons les professionnels à gérer, vendre et protéger leurs activités à l\'ère numérique.',
    image: 'https://booh.ga/og-image-about.png',
    url: 'https://booh.ga/about',
    type: 'website',
    keywords: 'à propos booh, mission booh, équipe booh, business numérique'
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.about'), url: 'https://booh.ga/about' }
  ];

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: t('about.values.simplicity.title'),
      description: t('about.values.simplicity.description'),
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: t('about.values.security.title'),
      description: t('about.values.security.description'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: t('about.values.performance.title'),
      description: t('about.values.performance.description'),
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('about.values.innovation.title'),
      description: t('about.values.innovation.description'),
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 apple-minimal-font">
      {/* SEO Components */}
      <SchemaOrganization />
      <SchemaBreadcrumb items={breadcrumbs} />
      
      {/* H1 pour SEO */}
      <h1 className="sr-only">Nous simplifions le business numérique.</h1>

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
            {t('about.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('about.description')}
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light mb-8 text-center tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >{t('about.mission.title')}</h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-lg text-gray-500 leading-relaxed text-center whitespace-pre-line font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('about.mission.content')}
          </motion.p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light mb-12 text-center tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >
            {t('about.values.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-600">
                  {value.icon}
                </div>
                <h3 className="text-xl font-light mb-3 text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >{value.title}</h3>
                <p className="text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light mb-8 text-center tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
          >{t('about.vision.title')}</h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-lg text-gray-500 leading-relaxed text-center whitespace-pre-line font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('about.vision.content')}
          </motion.p>
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
              {t('about.cta.title')}
            </h2>
            <p className="text-xl text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('about.cta.description')}
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
                {t('about.cta.startNow')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/contact')}
                className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-50 transition"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('about.cta.contact')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterDark />
    </div>
  );
};

export default About;

