import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface PublicNavbarProps {
  className?: string;
}

/**
 * Navbar ultra-légère pour le scrollytelling
 * Transparente et discrète pour ne pas distraire de l'expérience
 */
const PublicNavbarLightweight: React.FC<PublicNavbarProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className={`fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b border-white/5 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/50 flex items-center justify-center relative">
            <span className="text-xl">ö</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center text-white">
          <Link to="/pricing" className="hover:text-gray-300 transition text-sm font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('navbar.pricing')}
          </Link>
          <Link to="/blog" className="hover:text-gray-300 transition text-sm font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('navbar.blog')}
          </Link>
          <Link to="/contact" className="hover:text-gray-300 transition text-sm font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('navbar.contact')}
          </Link>
          
          <button
            onClick={() => navigate('/auth')}
            className="bg-white text-gray-900 px-6 py-2 rounded-lg font-light hover:bg-gray-50 transition"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('navbar.getStarted')}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/5">
          <div className="px-6 py-4 flex flex-col gap-4">
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition py-2 font-light text-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('navbar.pricing')}
            </Link>
            <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition py-2 font-light text-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('navbar.blog')}
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition py-2 font-light text-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('navbar.contact')}
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/auth');
              }}
              className="bg-white text-gray-900 px-6 py-2 rounded-lg font-light hover:bg-gray-50 transition w-full mt-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('navbar.getStarted')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicNavbarLightweight;

