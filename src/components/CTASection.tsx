import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Eye } from "lucide-react";

const CTASection: React.FC = () => {
  return (
    <motion.section
      className="relative py-24 w-full overflow-hidden bg-gradient-to-br from-white via-booh-light-purple/10 to-white"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Orbes décoratifs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-[30vw] max-w-2xl rounded-full bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-white/0 blur-3xl opacity-40 animate-pulse-slow pointer-events-none z-0" />
      {/* Grid 3D décorative */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-white/0 opacity-60" />
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-2 opacity-10">
          {[...Array(72)].map((_, i) => (
            <div key={i} className="bg-blue-400/10 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-blue-600 mb-4 drop-shadow-lg tracking-tight" style={{letterSpacing: '-0.02em'}}>
          Prêt à passer au digital premium ?
        </h2>
        <p className="text-lg md:text-xl text-gray-700/80 mb-10 max-w-xl mx-auto">
          Rejoignez des milliers de professionnels qui ont déjà adopté la carte digitale nouvelle génération.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a
            href="/auth"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-xl hover:bg-blue-700/90 transition-all focus:ring-2 focus:ring-blue-400 outline-none"
            aria-label="Créer ma carte digitale maintenant"
          >
            <Sparkles className="h-6 w-6" />
            Créer ma carte digitale
            <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="/card-view"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-black text-white font-bold text-lg shadow-lg hover:scale-105 hover:shadow-xl hover:bg-gray-900 transition-all focus:ring-2 focus:ring-blue-400 outline-none"
            aria-label="Voir une démo de carte digitale"
          >
            <Eye className="h-6 w-6" />
            Voir une démo
          </a>
        </div>
      </div>
    </motion.section>
  );
};

export default CTASection;
