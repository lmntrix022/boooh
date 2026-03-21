import { CalendarClock } from "lucide-react";
import { motion } from "framer-motion";

export default function AppointmentManagerPage() {
  return (
    <div className="container max-w-3xl mx-auto py-16 px-4 md:px-8">
      <motion.h1
        className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
          <CalendarClock className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
        </span>
        Gestion avancée des rendez-vous
      </motion.h1>
      <motion.div
        className="glass-card border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative p-10 flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        {/* Orbe décoratif animé */}
        <motion.div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[40vw] h-[20vw] max-w-lg rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-40 animate-pulse-slow z-0"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <p className="gradient-text-3d text-xl font-semibold mb-2">Gestion avancée des rendez-vous à venir...</p>
        <p className="text-gray-700/80 max-w-md mx-auto">Cette page sera bientôt enrichie de fonctionnalités premium pour la gestion, l'export, les stats et plus encore.</p>
      </motion.div>
    </div>
  );
} 