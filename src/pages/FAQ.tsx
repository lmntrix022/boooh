/**
 * FAQ Page
 * Frequently Asked Questions with Rich Snippets
 * 
 * Updated for Bööh - AI Business Platform
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import { SchemaFAQ, FAQItem } from '@/components/SEO/SchemaFAQ';
import PublicNavbar from '@/components/layout/PublicNavbar';
import FooterDark from '@/components/FooterDark';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const FAQ = () => {
  const { t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useSEO({
    title: 'FAQ - Questions Fréquemment Posées | Bööh',
    description: 'Trouvez les réponses aux questions fréquemment posées sur Bööh - plateforme business IA tout-en-un avec CRM, e-commerce, DRM, facturation et gestion de stock.',
    image: 'https://booh.ga/og-image-faq.png',
    url: 'https://booh.ga/faq',
    type: 'website',
    keywords: 'FAQ, questions, réponses, aide, support, CRM IA, e-commerce, DRM, plateforme business'
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('navbar.faq'), url: 'https://booh.ga/faq' }
  ];

  const faqs: FAQItem[] = [
    {
      question: t('faq.whatIsBooh.question'),
      answer: t('faq.whatIsBooh.answer')
    },
    {
      question: t('faq.features.question'),
      answer: t('faq.features.answer')
    },
    {
      question: t('faq.crm.question'),
      answer: t('faq.crm.answer')
    },
    {
      question: t('faq.drm.question'),
      answer: t('faq.drm.answer')
    },
    {
      question: t('faq.ecommerce.question'),
      answer: t('faq.ecommerce.answer')
    },
    {
      question: t('faq.stock.question'),
      answer: t('faq.stock.answer')
    },
    {
      question: t('faq.pricing.question'),
      answer: t('faq.pricing.answer')
    },
    {
      question: t('faq.teams.question'),
      answer: t('faq.teams.answer')
    },
    {
      question: t('faq.security.question'),
      answer: t('faq.security.answer')
    },
    {
      question: t('faq.mobile.question'),
      answer: t('faq.mobile.answer')
    },
    {
      question: t('faq.migration.question'),
      answer: t('faq.migration.answer')
    },
    {
      question: t('faq.contact.question'),
      answer: t('faq.contact.answer')
    },
    {
      question: t('faq.limits.question'),
      answer: t('faq.limits.answer')
    },
    {
      question: t('faq.trial.question'),
      answer: t('faq.trial.answer')
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden apple-minimal-font">
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      <SchemaFAQ faqs={faqs} />

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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 border border-gray-200 mb-6">
              <HelpCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              {t('faq.title')}
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('faq.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-12 px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-2xl bg-white overflow-hidden hover:border-gray-300 transition-all"
              >
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left group"
                >
                  <span className="text-lg font-light pr-4 text-gray-900 group-hover:text-gray-600 transition-colors tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      expandedIndex === index ? 'rotate-180 text-gray-600' : ''
                    }`}
                  />
                </button>

                {expandedIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-5 border-t border-gray-200"
                  >
                    <p className="text-gray-500 leading-relaxed pt-4 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 pt-12 border-t border-gray-200 text-center"
          >
            <h3 className="text-2xl font-light mb-4 text-gray-900 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >{t('faq.noAnswer.title')}</h3>
            <p className="text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >{t('faq.noAnswer.description')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-block px-8 py-3 rounded-lg bg-gray-900 text-white font-light hover:bg-gray-800 transition shadow-sm"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('faq.noAnswer.contact')}
              </Link>
              <Link
                to="/help"
                className="inline-block px-8 py-3 rounded-lg border-2 border-gray-300 text-gray-900 font-light hover:bg-gray-50 transition"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('faq.noAnswer.helpCenter')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <FooterDark />
    </div>
  );
};

export default FAQ;
