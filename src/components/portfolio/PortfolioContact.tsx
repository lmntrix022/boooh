import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Globe, Linkedin, Twitter, Instagram, Facebook, Github, Sparkles, QrCode, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tables } from '@/integrations/supabase/types';
import AppointmentForm from '@/components/AppointmentForm';
import { generateCardUrl } from '@/utils/cardUrlUtils';

type BusinessCardType = Tables<'business_cards'>;

interface SocialLink {
  platform: string;
  url: string;
}

interface PortfolioContactProps {
  card: BusinessCardType;
  accentColor: string;
  fontFamily?: string;
  onContactClick?: () => void;
}

const PortfolioContact: React.FC<PortfolioContactProps> = ({
  card,
  accentColor,
  fontFamily = 'Poppins',
  onContactClick,
}) => {
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Générer l'URL de la carte
  const cardUrl = generateCardUrl(card.id, (card as any).slug);

  // Mapping des icônes de réseaux sociaux
  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('linkedin')) return Linkedin;
    if (platformLower.includes('twitter') || platformLower.includes('x.com')) return Twitter;
    if (platformLower.includes('instagram')) return Instagram;
    if (platformLower.includes('facebook')) return Facebook;
    if (platformLower.includes('github')) return Github;
    return Globe;
  };

  const socialLinks = ((card as any).social_links || []) as SocialLink[];

  return (
    <section className="py-32 px-4 relative" style={{ fontFamily }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] p-12 md:p-16 text-center overflow-hidden bg-white border border-gray-200 shadow-2xl"
        >
          {/* Background decoration */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: accentColor }}
          />

          <div className="relative z-10">
            {/* Icône principale */}
            <Sparkles
              className="h-20 w-20 mx-auto mb-8"
              style={{ color: accentColor }}
            />

            {/* Titre */}
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">
              Travaillons Ensemble !
            </h2>

            {/* Description */}
            <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              Vous avez un projet en tête ? Discutons de comment nous pouvons collaborer pour le concrétiser.
            </p>

            {/* CTA principal */}
            <div className="mb-12">
              <Button
                onClick={() => {
                  if (onContactClick) {
                    onContactClick();
                  } else {
                    setAppointmentDialogOpen(true);
                  }
                }}
                size="lg"
                className="rounded-full px-10 py-7 text-xl font-bold shadow-2xl hover:scale-110 transition-all duration-300"
                style={{ backgroundColor: accentColor }}
              >
                <Calendar className="mr-3 h-6 w-6" />
                Me Contacter
              </Button>
            </div>

            {/* Informations de contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-3xl mx-auto">
              {card.email && (
                <motion.a
                  href={`mailto:${card.email}`}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-300 border border-gray-200"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <Mail className="w-5 h-5" style={{ color: accentColor }} strokeWidth={2} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{card.email}</p>
                  </div>
                </motion.a>
              )}

              {card.phone && (
                <motion.a
                  href={`tel:${card.phone}`}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-300 border border-gray-200"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <Phone className="w-5 h-5" style={{ color: accentColor }} strokeWidth={2} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Téléphone</p>
                    <p className="text-sm font-semibold text-gray-900">{card.phone}</p>
                  </div>
                </motion.a>
              )}

              {card.address && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: accentColor }} strokeWidth={2} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Localisation</p>
                    <p className="text-sm font-semibold text-gray-900">{card.address}</p>
                  </div>
                </motion.div>
              )}

              {card.website && (
                <motion.a
                  href={card.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-300 border border-gray-200"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <Globe className="w-5 h-5" style={{ color: accentColor }} strokeWidth={2} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Website</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{card.website}</p>
                  </div>
                </motion.a>
              )}
            </div>

            {/* Réseaux sociaux */}
            {socialLinks.length > 0 && (
              <div className="mb-8">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-6">
                  Suivez-moi
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  {socialLinks.map((link, index) => {
                    const Icon = getSocialIcon(link.platform);
                    return (
                      <motion.a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200"
                      >
                        <Icon className="h-6 w-6" style={{ color: accentColor }} strokeWidth={2} />
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QR Code option */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="pt-8 border-t border-gray-200"
              
            >
              <Button
                onClick={() => setQrDialogOpen(true)}
                variant="ghost"
                style={{ backgroundColor: `${accentColor}15` }}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mx-auto"
              >
                <QrCode className="w-5 h-5" strokeWidth={2} />
                <p className="text-sm font-medium">
                  Scanner le QR Code
                </p>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Dialog de prise de rendez-vous */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="w-[92vw] sm:w-full sm:max-w-[500px] glass-card border-2 border-white/30 shadow-2xl rounded-2xl p-4 sm:p-6 mx-0">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Prendre un rendez-vous
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            cardId={card.id}
            onSuccess={() => setAppointmentDialogOpen(false)}
            onCancel={() => setAppointmentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog QR Code */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="w-2/3 sm:max-w-[400px] glass-card border-2 border-white/30 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Scanner le QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center p-4">
            <div className="w-64 h-64 mb-4 flex items-center justify-center rounded-xl shadow-lg bg-white p-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cardUrl)}`}
                alt="QR Code"
                className="w-full h-full"
              />
            </div>
            <p className="text-center text-sm text-gray-600 font-medium mb-2">
              Scannez ce code pour accéder à ma carte
            </p>
            <p className="text-center text-xs text-gray-400">
              Utilisez l'appareil photo de votre téléphone
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PortfolioContact;
