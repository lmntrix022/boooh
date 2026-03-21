import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

interface PublicNavbarProps {
  className?: string;
  variant?: 'default' | 'transparent';
}

// Composant MagneticButton local
const MagneticButton = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };
  
  const reset = () => setPosition({ x: 0, y: 0 });
  const { x, y } = position;
  
  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

const PublicNavbar: React.FC<PublicNavbarProps> = ({ 
  className = '',
  variant = 'transparent'
}) => {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Détection du scroll pour variant transparent
  useEffect(() => {
    if (variant === 'transparent') {
      const handleScroll = () => setIsScrolled(window.scrollY > 50);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [variant]);

  // Fermer les menus déroulants quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    };

    if (moreMenuOpen || languageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreMenuOpen, languageMenuOpen]);

  const handleScrollToSection = (sectionId: string) => {
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'fr' ? 'en' : 'fr');
  };

  // Styles dynamiques selon le variant et le scroll
  const getNavStyles = () => {
    if (variant === 'transparent') {
      return {
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
        paddingTop: isScrolled ? '1rem' : '2rem',
        paddingBottom: isScrolled ? '1rem' : '2rem',
        borderBottomWidth: isScrolled ? '1px' : '0px',
        borderBottomColor: isScrolled ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
      };
    }
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingTop: '1rem',
      paddingBottom: '1rem',
      borderBottomWidth: '1px',
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    };
  };

  const textColor = variant === 'transparent' && !isScrolled 
    ? 'text-white' 
    : variant === 'transparent' && isScrolled
    ? 'text-gray-900'
    : 'text-white';

  return (
    <motion.nav
      initial={false}
      animate={getNavStyles()}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 w-full z-50 ${
        variant === 'transparent' && isScrolled ? 'backdrop-blur-xl' : variant === 'transparent' ? '' : 'backdrop-blur-md'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo avec cercle noir et rotation au hover */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            className="w-8 h-8 rounded-full bg-black flex items-center justify-center overflow-hidden"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <img 
              src="/favicon.png" 
              alt="Booh" 
              className="w-5 h-5 object-contain"
            />
          </motion.div>
          <span className={`text-xl font-light tracking-tight ${textColor}`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            Booh.
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className={`hidden md:flex gap-8 items-center ${textColor}`}>
          {/* Fonctionnalités - scroll sur homepage, lien ailleurs */}
          {location.pathname === '/' ? (
            <motion.button
              onClick={() => handleScrollToSection('drm-showcase')}
              className={`relative text-sm font-light cursor-pointer group ${textColor}`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {t('navbar.features')}
              <motion.div
                className="absolute bottom-0 left-0 h-px bg-black"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
              />
            </motion.button>
          ) : (
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
            >
              <Link
                to="/features"
                className={`relative text-sm font-light group block ${textColor}`}
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('navbar.features')}
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-black"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
                />
              </Link>
            </motion.div>
          )}

          {/* Découvrir - scroll sur homepage, lien vers map ailleurs */}
          {location.pathname === '/' ? (
            <motion.button
              onClick={() => handleScrollToSection('portfolio-showcase')}
              className={`relative text-sm font-light cursor-pointer group ${textColor}`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {t('navbar.discover')}
              <motion.div
                className="absolute bottom-0 left-0 h-px bg-black"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
              />
            </motion.button>
          ) : (
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
            >
              <Link
                to="/map"
                className={`relative text-sm font-light group block ${textColor} ${
                  isActive('/map') ? 'font-light' : ''
                }`}
              >
                {t('navbar.map')}
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-black"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
                />
              </Link>
            </motion.div>
          )}

          {/* Tarifs */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <Link
              to="/pricing"
              className={`relative text-sm font-light group block ${textColor} ${
                isActive('/pricing') ? 'font-light' : ''
              }`}
            >
              {t('navbar.pricing')}
              <motion.div
                className="absolute bottom-0 left-0 h-px bg-black"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
              />
            </Link>
          </motion.div>

          {/* Carte - visible uniquement sur homepage */}
          {location.pathname === '/' && (
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
            >
              <Link
                to="/map"
                className={`relative text-sm font-light group block ${textColor}`}
              >
                {t('navbar.map')}
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-black"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
                />
              </Link>
            </motion.div>
          )}

          {/* Blog */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <Link
              to="/blog"
              className={`relative text-sm font-light group block ${textColor} ${
                isActive('/blog') ? 'font-light' : ''
              }`}
            >
              {t('navbar.blog')}
              <motion.div
                className="absolute bottom-0 left-0 h-px bg-black"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
              />
            </Link>
          </motion.div>

          {/* Contact */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <Link
              to="/contact"
              className={`relative text-sm font-light group block ${textColor} ${
                isActive('/contact') ? 'font-light' : ''
              }`}
            >
              {t('navbar.contact')}
              <motion.div
                className="absolute bottom-0 left-0 h-px bg-black"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: variant === 'transparent' && !isScrolled ? 'white' : 'black' }}
              />
            </Link>
          </motion.div>

          {/* Menu déroulant "Plus" */}
          <div className="relative" ref={moreMenuRef}>
            <motion.button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`text-sm font-light flex items-center gap-1 group ${textColor}`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {t('navbar.more')}
              <ChevronDown 
                size={16} 
                className={`transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`}
              />
            </motion.button>

            <AnimatePresence>
              {moreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white backdrop-blur-xl border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <Link
                    to="/solutions"
                    onClick={() => setMoreMenuOpen(false)}
                    className={`block px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-900 font-light`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('navbar.solutions')}
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setMoreMenuOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-900 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('navbar.about')}
                  </Link>
                  <Link
                    to="/help"
                    onClick={() => setMoreMenuOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-900 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('navbar.support')}
                  </Link>
                  <Link
                    to="/faq"
                    onClick={() => setMoreMenuOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-900 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('navbar.faq')}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sélecteur de langue - discret */}
          <motion.button
            onClick={toggleLanguage}
            className={`text-sm font-light transition-opacity duration-300 ${
              variant === 'transparent' && !isScrolled ? 'text-white/70' : 'text-gray-500'
            }`}
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.95 }}
          >
            {currentLanguage === 'fr' ? 'EN' : 'FR'}
          </motion.button>
          
          {/* Bouton Commencer - Magnétique */}
          <MagneticButton>
            <motion.button
              onClick={() => navigate('/auth')}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-light tracking-normal relative overflow-hidden"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('navbar.getStarted')}
            </motion.button>
          </MagneticButton>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg hover:bg-black/10 transition ${textColor}`}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`md:hidden ${
              variant === 'transparent' && isScrolled 
                ? 'bg-white/95 backdrop-blur-xl border-t border-black/5' 
                : 'bg-black/95 border-t border-white/5'
            }`}
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
              {location.pathname === '/' ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleScrollToSection('drm-showcase');
                    }}
                    className={`hover:opacity-70 transition text-sm font-light py-2 text-left cursor-pointer ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {t('navbar.features')}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleScrollToSection('portfolio-showcase');
                    }}
                    className={`hover:opacity-70 transition text-sm font-light py-2 text-left cursor-pointer ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {t('navbar.discover')}
                  </button>
                  <Link
                    to="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {t('navbar.pricing')}
                  </Link>
                  <Link
                    to="/map"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {t('navbar.map')}
                  </Link>
                  <Link
                    to="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {t('navbar.blog')}
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {t('navbar.contact')}
                  </Link>
                  
                  <div className={`border-t ${
                    variant === 'transparent' && isScrolled ? 'border-black/10' : 'border-white/10'
                  } pt-2 mt-2`}>
                    <div className="flex items-center gap-2 py-2">
                      <Globe size={18} className={variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'} />
                      <span className={`text-sm font-light ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      >{t('navbar.language')}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          changeLanguage('fr');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-light transition ${
                          currentLanguage === 'fr'
                            ? 'bg-black text-white'
                            : variant === 'transparent' && isScrolled
                            ? 'bg-black/5 text-gray-900 hover:bg-black/10'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {t('languages.fr')}
                      </button>
                      <button
                        onClick={() => {
                          changeLanguage('en');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-light transition ${
                          currentLanguage === 'en'
                            ? 'bg-black text-white'
                            : variant === 'transparent' && isScrolled
                            ? 'bg-black/5 text-gray-900 hover:bg-black/10'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {t('languages.en')}
                      </button>
                    </div>
                  </div>
                  
                  <div className={`border-t ${
                    variant === 'transparent' && isScrolled ? 'border-black/10' : 'border-white/10'
                  } pt-2 mt-2`}>
                    <Link
                      to="/solutions"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:opacity-70 transition text-sm font-light py-2 block ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      {t('navbar.solutions')}
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:opacity-70 transition text-sm font-light py-2 block ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      {t('navbar.about')}
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:opacity-70 transition text-sm font-light py-2 block ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      {t('navbar.support')}
                    </Link>
                    <Link
                      to="/faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:opacity-70 transition text-sm font-light py-2 block ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      {t('navbar.faq')}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/features"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('navbar.features')}
                  </Link>
                  <Link
                    to="/map"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    } ${isActive('/map') ? 'font-light' : ''}`}
                  >
                    {t('navbar.map')}
                  </Link>
                  <Link
                    to="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    } ${isActive('/pricing') ? 'font-light' : ''}`}
                  >
                    {t('navbar.pricing')}
                  </Link>
                  <Link
                    to="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    } ${isActive('/blog') ? 'font-light' : ''}`}
                  >
                    {t('navbar.blog')}
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`hover:opacity-70 transition text-sm font-light py-2 ${
                      variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                    } ${isActive('/contact') ? 'font-light' : ''}`}
                  >
                    {t('navbar.contact')}
                  </Link>
                  
                  <div className={`border-t ${
                    variant === 'transparent' && isScrolled ? 'border-black/10' : 'border-white/10'
                  } pt-2 mt-2`}>
                    <div className="flex items-center gap-2 py-2">
                      <Globe size={18} className={variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'} />
                      <span className={`text-sm font-light ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      >{t('navbar.language')}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          changeLanguage('fr');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-light transition ${
                          currentLanguage === 'fr'
                            ? 'bg-black text-white'
                            : variant === 'transparent' && isScrolled
                            ? 'bg-black/5 text-gray-900 hover:bg-black/10'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {t('languages.fr')}
                      </button>
                      <button
                        onClick={() => {
                          changeLanguage('en');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-light transition ${
                          currentLanguage === 'en'
                            ? 'bg-black text-white'
                            : variant === 'transparent' && isScrolled
                            ? 'bg-black/5 text-gray-900 hover:bg-black/10'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {t('languages.en')}
                      </button>
                    </div>
                  </div>
                  
                  <div className={`border-t ${
                    variant === 'transparent' && isScrolled ? 'border-black/10' : 'border-white/10'
                  } pt-2 mt-2`}>
                    <Link
                      to="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:opacity-70 transition text-sm font-light py-2 block ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      } ${isActive('/about') ? 'font-light' : ''}`}
                    >
                      {t('navbar.about')}
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:opacity-70 transition text-sm font-light py-2 block ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      } ${isActive('/help') ? 'font-light' : ''}`}
                    >
                      {t('navbar.support')}
                    </Link>
                    <Link
                      to="/faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`hover:opacity-70 transition text-sm font-light py-2 block ${
                        variant === 'transparent' && isScrolled ? 'text-gray-900' : 'text-white'
                      } ${isActive('/faq') ? 'font-light' : ''}`}
                    >
                      {t('navbar.faq')}
                    </Link>
                  </div>
                </>
              )}
              <motion.button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg font-light hover:bg-gray-800 transition w-full mt-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {t('navbar.getStarted')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default PublicNavbar;
