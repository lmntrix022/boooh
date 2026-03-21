import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const features = [
  {
    title: "Profils personnalisés",
    description: "Créez votre identité professionnelle unique avec photo, logo, coordonnées et liens sociaux.",
    premium: true,
    icon: Sparkles,
    color: "from-blue-400 to-purple-400"
  },
  {
    title: "Catalogue de produits",
    description: "Présentez vos produits ou services avec images, descriptions et prix pour vendre directement.",
    premium: false,
    icon: Sparkles,
    color: "from-purple-400 to-blue-400"
  },
  {
    title: "Prise de rendez-vous",
    description: "Intégrez un calendrier interactif pour que vos clients réservent des créneaux disponibles.",
    premium: true,
    icon: Sparkles,
    color: "from-blue-400 to-black"
  },
  {
    title: "Éditeur visuel",
    description: "Personnalisez l'apparence de votre carte avec notre éditeur simple et intuitif.",
    premium: false,
    icon: Sparkles,
    color: "from-purple-400 to-black"
  },
  {
    title: "Statistiques détaillées",
    description: "Suivez les visites, les clics et les conversions pour optimiser votre présence.",
    premium: true,
    icon: Sparkles,
    color: "from-blue-400 to-purple-400"
  },
  {
    title: "Gestion des contacts",
    description: "Gardez une trace de tous vos prospects et clients dans un CRM simplifié.",
    premium: false,
    icon: Sparkles,
    color: "from-purple-400 to-blue-400"
  },
  {
    title: "Commandes et demandes",
    description: "Recevez et gérez les commandes ou demandes de devis directement depuis votre carte.",
    premium: false,
    icon: Sparkles,
    color: "from-blue-400 to-black"
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
            transition: { delay: 0.2 + i * 0.12, duration: 0.7 }
  })
};

const FeatureSection: React.FC = () => {
  return (
    <motion.section
      className="relative py-24 w-full overflow-hidden bg-gradient-to-br from-white via-booh-light-purple/20 to-white"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Orbe décoratif */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-[30vw] max-w-2xl rounded-full bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-white/0 blur-3xl opacity-40 animate-pulse-slow pointer-events-none z-0" />
      <h2 className="text-3xl md:text-5xl font-extrabold text-center text-blue-600 mb-12 drop-shadow-lg tracking-tight" style={{letterSpacing: '-0.02em'}}>
        Fonctionnalités premium
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              className="group bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-8 flex flex-col items-center text-center relative overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 outline-none transition-all hover:scale-105 hover:shadow-2xl hover:bg-white/80"
              tabIndex={0}
              aria-label={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
            >
              {/* Reflet animé */}
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(120deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 60%,transparent 100%)',
                  mixBlendMode: 'lighten',
                  zIndex: 10
                }}
                animate={{ x: ['-60%', '120%'] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />
              {/* Badge Premium animé */}
              {feature.premium && (
                <motion.div
                  className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-30 animate-pulse"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                >
                  Premium
                </motion.div>
              )}
              {/* Icône avec effet 3D/parallax au hover */}
              <motion.div
                className={`mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-${feature.color} shadow-lg transition-transform duration-300`}
                whileHover={{ scale: 1.15, rotate: 8 }}
                whileTap={{ scale: 0.95 }}
                tabIndex={-1}
              >
                <Icon className="h-8 w-8 text-blue-600 drop-shadow" />
              </motion.div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900 drop-shadow-sm">
                {feature.title}
              </h3>
              <p className="text-gray-700/80 text-base md:text-lg font-medium">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default FeatureSection;
