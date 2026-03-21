import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const FooterSection: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({ title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.1 + delay * 0.1, duration: 0.5 }}
  >
    <motion.h3
      className="text-base md:text-lg font-light text-gray-500 mb-4 tracking-tight uppercase text-xs"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontWeight: 300,
        letterSpacing: '0.1em',
      }}
      whileInView={{ opacity: [0, 1], y: [10, 0] }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 + delay * 0.1, duration: 0.4 }}
    >
      {title}
    </motion.h3>
    {children}
  </motion.div>
);

const linkVariants = {
  initial: { opacity: 0, y: 10 },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 * custom,
      duration: 0.4
    }
  }),
  hover: {
    x: 5,
    transition: { duration: 0.2 }
  }
};

const FooterDark: React.FC = () => {
  const { t } = useLanguage();

  const productLinks = [
    { label: t('footer.product.features'), link: "/features" },
    { label: t('footer.product.solutions'), link: "/solutions" },
    { label: t('footer.product.pricing'), link: "/pricing" },
    { label: t('footer.product.blog'), link: "/blog" },
    { label: t('footer.product.support'), link: "/help" }
  ];

  const companyLinks = [
    { label: t('footer.company.about'), link: "/about" },
    { label: t('footer.company.contact'), link: "/contact" },
    { label: t('footer.company.faq'), link: "/faq" },
    { label: t('footer.company.map'), link: "/map" }
  ];

  const legalLinks = [
    { label: t('footer.legal.privacy'), link: "/privacy" },
    { label: t('footer.legal.terms'), link: "/terms" },
    { label: t('footer.legal.legalNotice'), link: "/legal" }
  ];

  return (
    <motion.footer
      className="relative pt-16 pb-8 overflow-hidden bg-white border-t border-gray-200"
    >
      {/* Background effects - Supprimés pour style minimal */}

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo section */}
          <motion.div
            className="col-span-1 flex flex-col items-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative mb-2">
              <img src="/booh.svg" alt="Booh logo" className="h-8 logo-white" />
            </div>
            <span className="text-lg font-bold text-white/80 tracking-tight">
              {t('footer.tagline')}
            </span>
          </motion.div>

          <FooterSection title={t('footer.product.title')} delay={0.2}>
            <motion.ul
              className="space-y-3"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {productLinks.map((item, index) => (
                <motion.li key={index} variants={linkVariants} custom={index} whileHover="hover">
                  <Link to={item.link} className="text-gray-500 hover:text-gray-900 transition-colors flex items-center font-light text-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <span className="relative">
                      {item.label}
                      <motion.span
                        className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gray-400 rounded-full"
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </FooterSection>

          <FooterSection title={t('footer.company.title')} delay={0.4}>
            <motion.ul
              className="space-y-3"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {companyLinks.map((item, index) => (
                <motion.li key={index} variants={linkVariants} custom={index} whileHover="hover">
                  <Link to={item.link} className="text-gray-500 hover:text-gray-900 transition-colors flex items-center font-light text-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <span className="relative">
                      {item.label}
                      <motion.span
                        className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gray-400 rounded-full"
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </FooterSection>

          <FooterSection title={t('footer.legal.title')} delay={0.6}>
            <motion.ul
              className="space-y-3"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {legalLinks.map((item, index) => (
                <motion.li key={index} variants={linkVariants} custom={index} whileHover="hover">
                  <Link to={item.link} className="text-gray-500 hover:text-gray-900 transition-colors flex items-center font-light text-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <span className="relative">
                      {item.label}
                      <motion.span
                        className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gray-400 rounded-full"
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </FooterSection>
        </div>

        <motion.div
          className="border-t border-gray-200 pt-8 text-center relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.p
            className="text-gray-500 text-sm flex items-center justify-center gap-2 mb-4 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            whileInView={{
              y: [10, 0],
              opacity: [0, 1]
            }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 0.4 }}
          >
            &copy; {new Date().getFullYear()} Booh. {t('footer.copyright')}
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            <span className="text-gray-500 text-xs font-light">{t('footer.designedBy')}</span>
            <a
              href="https://miscoch-it.ga"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 font-light text-xs hover:text-gray-900 transition-colors duration-200"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Miscoch IT
            </a>
          </motion.div>

          {/* Floating badge */}
          <motion.div
            className="absolute bottom-2 right-0 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-light border border-gray-200"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            animate={{
              y: [0, -5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <a
              href="https://miscoch-it.ga"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>{t('footer.designBadge')}</span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default FooterDark;
