import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import PublicNavbar from '@/components/layout/PublicNavbar';
import FooterDark from '@/components/FooterDark';
import { Users, UserPlus, Shield, Settings, BarChart3, Mail } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const DocsTeam = () => {
  const { t } = useLanguage();
  
  useSEO({
    title: t('docs.team.seoTitle'),
    description: t('docs.team.seoDescription'),
    image: 'https://booh.ga/og-image-help.png',
    url: 'https://booh.ga/docs/team',
    type: 'article',
    keywords: t('docs.team.seoKeywords')
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.support'), url: 'https://booh.ga/help' },
    { name: t('docs.team.title'), url: 'https://booh.ga/docs/team' }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden apple-minimal-font">
      <SchemaBreadcrumb items={breadcrumbs} />
      <PublicNavbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >{t('docs.team.title')}</h1>
            <p className="text-xl text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('docs.team.description')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <UserPlus className="w-6 h-6" />, title: t('docs.team.features.invite.title'), desc: t('docs.team.features.invite.description') },
              { icon: <Shield className="w-6 h-6" />, title: t('docs.team.features.roles.title'), desc: t('docs.team.features.roles.description') },
              { icon: <Users className="w-6 h-6" />, title: t('docs.team.features.members.title'), desc: t('docs.team.features.members.description') },
              { icon: <Settings className="w-6 h-6" />, title: t('docs.team.features.settings.title'), desc: t('docs.team.features.settings.description') },
              { icon: <BarChart3 className="w-6 h-6" />, title: t('docs.team.features.stats.title'), desc: t('docs.team.features.stats.description') },
              { icon: <Mail className="w-6 h-6" />, title: t('docs.team.features.notifications.title'), desc: t('docs.team.features.notifications.description') }
            ].map((feature, i) => (
              <motion.div
                key={i}
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
                >{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-light mb-4 text-gray-900 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >{t('docs.team.rolesTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <div><span className="text-gray-900 font-light">{t('docs.team.roles.admin.name')}</span> : {t('docs.team.roles.admin.description')}</div>
              <div><span className="text-gray-900 font-light">{t('docs.team.roles.seller.name')}</span> : {t('docs.team.roles.seller.description')}</div>
              <div><span className="text-gray-900 font-light">{t('docs.team.roles.support.name')}</span> : {t('docs.team.roles.support.description')}</div>
              <div><span className="text-gray-900 font-light">{t('docs.team.roles.contributor.name')}</span> : {t('docs.team.roles.contributor.description')}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-light mb-4 text-gray-900 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >{t('docs.team.inviteTitle')}</h2>
            <ol className="space-y-3 text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <li className="flex gap-3"><span className="text-gray-600">1.</span> {t('docs.team.inviteSteps.step1')}</li>
              <li className="flex gap-3"><span className="text-gray-600">2.</span> {t('docs.team.inviteSteps.step2')}</li>
              <li className="flex gap-3"><span className="text-gray-600">3.</span> {t('docs.team.inviteSteps.step3')}</li>
              <li className="flex gap-3"><span className="text-gray-600">4.</span> {t('docs.team.inviteSteps.step4')}</li>
              <li className="flex gap-3"><span className="text-gray-600">5.</span> {t('docs.team.inviteSteps.step5')}</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <Link to="/help" className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-light hover:bg-gray-50 transition inline-block"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('docs.team.backToHelp')}
          </Link>
        </div>
      </section>

      <FooterDark />
    </div>
  );
};

export default DocsTeam;

