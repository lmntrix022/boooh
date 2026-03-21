import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, MessageCircle, Clock, ArrowRight } from 'lucide-react';
import FooterDark from '@/components/FooterDark';
import { useSEO } from '@/hooks/useSEO';
import { SchemaBreadcrumb } from '@/components/SEO/SchemaBreadcrumb';
import { SchemaLocalBusiness } from '@/components/SEO/SchemaLocalBusiness';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { trackConversion } from '@/utils/analytics';
import { useLanguage } from '@/hooks/useLanguage';

const Contact = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // SEO Meta Tags
  useSEO({
    title: t('contact.seoTitle'),
    description: t('contact.seoDescription'),
    image: 'https://booh.ga/og-image-contact.png',
    url: 'https://booh.ga/contact',
    type: 'website',
    keywords: t('contact.seoKeywords')
  });

  const breadcrumbs = [
    { name: t('common.all'), url: 'https://booh.ga' },
    { name: t('contact.title'), url: 'https://booh.ga/contact' }
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Préparer le message formaté
      const emailMessage = t('contact.emailMessage', {
        name: form.name,
        email: form.email,
        message: form.message
      }).trim();

      // Envoyer l'email via la fonction Supabase Edge Function
      // Utilisation directe de fetch avec la clé API anonyme pour garantir l'authentification
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(t('contact.errorConfiguration'));
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          to: 'contact@booh.ga',
          subject: t('contact.emailSubject', { name: form.name }),
          message: emailMessage,
          type: 'crm',
          contact_name: form.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('contact.errorUnknown') }));
        console.error('Erreur lors de l\'envoi de l\'email:', errorData);
        throw new Error(errorData.error || t('contact.errorUnknown'));
      }

      const data = await response.json();

      if (!data?.success) {
        throw new Error(data?.error || t('contact.error'));
      }

      // Succès
      setSent(true);
      trackConversion.contactForm();
      
      // Réinitialiser le formulaire après 2 secondes
      setTimeout(() => {
        setForm({ name: '', email: '', message: '' });
        setSent(false);
      }, 5000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : t('contact.errorUnknown'));
      setSent(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 overflow-x-hidden apple-minimal-font">
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      <SchemaLocalBusiness 
        type="Organization"
        phone="+241 077 000 000"
        email="support@booh.ga"
        url="https://booh.ga"
      />
      
      {/* H1 structuré pour SEO - Visible */}
      <h1 className="sr-only">{t('contact.seoH1')}</h1>
      
      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background minimal - Supprimé pour style Apple */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 border border-gray-200 mb-6"
            >
              <Mail className="w-8 h-8 text-gray-600" />
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-light mb-4 text-gray-900 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              {t('contact.title')}
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contact.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 px-6 pb-24">
        <div className="relative z-40 w-full max-w-6xl mx-auto">

          {/* Content Container */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* Contact Info - Left Side */}
            <motion.div
              className="md:col-span-1 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {/* Contact Card */}
              <motion.div 
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:border-gray-300 transition-all relative overflow-hidden group"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                {/* Email */}
                <motion.a
                  href="mailto:contact@booh.ga"
                  className="flex gap-4 mb-6 pb-6 border-b border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group/item relative"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 transition-all"
                  >
                    <Mail className="h-5 w-5 text-gray-600" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-light mb-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('contact.email')}</p>
                    <p className="text-gray-900 font-light group-hover/item:text-gray-600 transition-colors"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >contact@booh.ga</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover/item:text-gray-600 transition-colors opacity-0 group-hover/item:opacity-100" />
                </motion.a>

                {/* Phone */}
                <motion.a
                  href="tel:+24174398524"
                  className="flex gap-4 mb-6 pb-6 border-b border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group/item relative"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 transition-all"
                  >
                    <Phone className="h-5 w-5 text-gray-600" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-light mb-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('contact.phone')}</p>
                    <p className="text-gray-900 font-light group-hover/item:text-gray-600 transition-colors"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >+241 74 39 85 24</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover/item:text-gray-600 transition-colors opacity-0 group-hover/item:opacity-100" />
                </motion.a>

                {/* WhatsApp */}
                <motion.a
                  href="https://wa.me/24174398524"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 mb-6 pb-6 border-b border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group/item relative"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 transition-all"
                  >
                    <MessageCircle className="h-5 w-5 text-gray-600" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-light mb-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('contact.whatsapp')}</p>
                    <p className="text-gray-900 font-light group-hover/item:text-gray-600 transition-colors"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >+241 74 39 85 24</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover/item:text-gray-600 transition-colors opacity-0 group-hover/item:opacity-100" />
                </motion.a>

                {/* Location */}
                <motion.div 
                  className="flex gap-4 mb-6 pb-6 border-b border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group/item"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 transition-all"
                  >
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-light mb-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('contact.location')}</p>
                    <p className="text-gray-900 font-light group-hover/item:text-gray-600 transition-colors"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Libreville, Gabon</p>
                  </div>
                </motion.div>

                {/* Hours */}
                <motion.div 
                  className="flex gap-4 group/item"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 transition-all"
                  >
                    <Clock className="h-5 w-5 text-gray-600" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-light mb-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('contact.hours')}</p>
                    <p className="text-gray-900 font-light group-hover/item:text-gray-600 transition-colors"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('contact.workingHours')}</p>
                  </div>
                </motion.div>

                {/* Social Links */}
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('contact.followUs')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.a 
                      href="https://facebook.com/boohapp" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label="Facebook"
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-center group/icon"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Facebook className="h-6 w-6 text-gray-600 mx-auto mb-1 group-hover/icon:text-gray-900 transition-colors" />
                      <span className="text-xs text-gray-500 group-hover/icon:text-gray-900 transition-colors font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Facebook</span>
                    </motion.a>
                    <motion.a 
                      href="https://twitter.com/boohapp" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label="Twitter"
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-center group/icon"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Twitter className="h-6 w-6 text-gray-600 mx-auto mb-1 group-hover/icon:text-gray-900 transition-colors" />
                      <span className="text-xs text-gray-500 group-hover/icon:text-gray-900 transition-colors font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Twitter</span>
                    </motion.a>
                    <motion.a 
                      href="https://instagram.com/boohapp" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label="Instagram"
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-center group/icon"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Instagram className="h-6 w-6 text-gray-600 mx-auto mb-1 group-hover/icon:text-gray-900 transition-colors" />
                      <span className="text-xs text-gray-500 group-hover/icon:text-gray-900 transition-colors font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Instagram</span>
                    </motion.a>
                    <motion.a 
                      href="https://linkedin.com/company/boohapp" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label="LinkedIn"
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-center group/icon"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Linkedin className="h-6 w-6 text-gray-600 mx-auto mb-1 group-hover/icon:text-gray-900 transition-colors" />
                      <span className="text-xs text-gray-500 group-hover/icon:text-gray-900 transition-colors font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >LinkedIn</span>
                    </motion.a>
                  </div>
                </div>
              </motion.div>

            </motion.div>

            {/* Formulaire - Right Side */}
            <motion.form
              onSubmit={handleSubmit}
              className="md:col-span-1 lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10 flex flex-col gap-6 hover:border-gray-300 transition-all relative overflow-hidden group/form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="relative z-10">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-light text-gray-900 mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('contact.yourName')}
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    name="name"
                    id="contact-name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none bg-white text-gray-900 placeholder-gray-400 text-base font-light transition"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                    placeholder={t('contact.namePlaceholder')}
                  />
              </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-light text-gray-900 mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('contact.yourEmail')}
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    name="email"
                    id="contact-email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none bg-white text-gray-900 placeholder-gray-400 text-base font-light transition"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                    placeholder={t('contact.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-light text-gray-900 mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('contact.yourMessage')}
                  </label>
                  <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    name="message"
                    id="contact-message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none bg-white text-gray-900 placeholder-gray-400 text-base font-light transition resize-none"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-lg font-light text-base bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 shadow-sm focus:ring-2 focus:ring-gray-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {isSubmitting ? t('contact.sending') : t('contact.send')}
                </motion.button>

                {sent && (
                  <motion.div
                    className="p-4 rounded-lg bg-gray-100 border border-gray-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-gray-700 font-light text-center"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      ✓ {t('contact.success', { email: form.email })}
                    </p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    className="p-4 rounded-lg bg-gray-100 border border-gray-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-gray-700 font-light text-center"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      ✗ {error}
                    </p>
                  </motion.div>
                )}

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500 text-center font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('contact.privacy')}
                </p>
              </div>
            </motion.form>
          </div>

          {/* Additional Info Section */}
          <motion.div
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <Clock className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-light mb-2 text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contact.quickResponse')}</h3>
              <p className="text-gray-500 text-sm font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contact.quickResponseDesc')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <MessageCircle className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-light mb-2 text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contact.multilingual')}</h3>
              <p className="text-gray-500 text-sm font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contact.multilingualDesc')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <Mail className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-light mb-2 text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contact.priorityEmail')}</h3>
              <p className="text-gray-500 text-sm font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contact.priorityEmailDesc')}</p>
            </div>
          </motion.div>

          {/* FAQ Quick Link */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 mb-4">{t('contact.quickQuestion')}</p>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition font-semibold"
            >
              {t('contact.seeFAQ')} <ArrowRight className="w-4 h-4" />
            </Link>
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
            <h2 className="text-3xl md:text-4xl font-light mb-6 text-gray-900 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              {t('contact.cta.title')}
            </h2>
            <p className="text-xl text-gray-500 mb-8 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contact.cta.description')}
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
                {t('contact.cta.startFree')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/pricing')}
                className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-light text-lg hover:bg-gray-50 transition"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('contact.cta.viewPricing')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterDark />
    </div>
  );
};

export default Contact; 