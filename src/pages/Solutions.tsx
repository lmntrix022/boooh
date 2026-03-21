import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import FooterDark from '@/components/FooterDark';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { User, Building, Palette, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const Solutions = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // SEO Meta Tags
  useSEO({
    title: 'Solutions Bööh – pour indépendants, PME et créateurs',
    description: 'Bööh s\'adapte à votre activité. Explorez nos solutions pour indépendants, entreprises, créateurs, et équipes.',
    image: 'https://booh.ga/og-image-solutions.png',
    url: 'https://booh.ga/solutions',
    type: 'website',
    keywords: 'solutions business IA, freelance CRM, PME gestion, créateurs numériques, protection fichiers'
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.solutions'), url: 'https://booh.ga/solutions' }
  ];

  const solutions = [
    {
      icon: <User className="w-8 h-8" />,
      title: t('solutions.freelance.title'),
      subtitle: t('solutions.freelance.subtitle'),
      description: t('solutions.freelance.description'),
      features: [
        t('solutions.freelance.features.0'),
        t('solutions.freelance.features.1'),
        t('solutions.freelance.features.2'),
        t('solutions.freelance.features.3')
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: t('solutions.sme.title'),
      subtitle: t('solutions.sme.subtitle'),
      description: t('solutions.sme.description'),
      features: [
        t('solutions.sme.features.0'),
        t('solutions.sme.features.1'),
        t('solutions.sme.features.2'),
        t('solutions.sme.features.3')
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: t('solutions.creators.title'),
      subtitle: t('solutions.creators.subtitle'),
      description: t('solutions.creators.description'),
      features: [
        t('solutions.creators.features.0'),
        t('solutions.creators.features.1'),
        t('solutions.creators.features.2'),
        t('solutions.creators.features.3')
      ],
      color: 'from-pink-500 to-red-500'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('solutions.teams.title'),
      subtitle: t('solutions.teams.subtitle'),
      description: t('solutions.teams.description'),
      features: [
        t('solutions.teams.features.0'),
        t('solutions.teams.features.1'),
        t('solutions.teams.features.2'),
        t('solutions.teams.features.3')
      ],
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 apple-minimal-font">
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      
      {/* H1 pour SEO */}
      <h1 className="sr-only">Des solutions pour chaque type de professionnel.</h1>

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
            {t('solutions.title')}
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
            {t('solutions.description')}
          </motion.p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mb-6 text-gray-600">
                  {solution.icon}
                </div>
                <h2 className="text-2xl font-light mb-2 text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >{solution.title}</h2>
                <p className="text-lg text-gray-500 mb-4 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{solution.subtitle}</p>
                <p className="text-gray-500 mb-6 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{solution.description}</p>
                <ul className="space-y-3">
                  {solution.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <span className="text-gray-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
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
              {t('solutions.cta.title')}
            </h2>
            <p className="text-xl text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('solutions.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/pricing')}
                className="bg-gray-900 text-white px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-800 transition shadow-sm"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('solutions.cta.viewPricing')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-50 transition"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('solutions.cta.tryFree')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterDark />
    </div>
  );
};

export default Solutions;

