import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  Briefcase,
  Target,
  TrendingUp,
  Award,
  X,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { PortfolioProject } from '@/services/portfolioService';

interface ProjectDetailViewProps {
  project: PortfolioProject;
  onClose: () => void;
  brandColor?: string;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onClose,
  brandColor = '#8B5CF6'
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = [
    project.featured_image,
    ...(project.gallery_images || [])
  ].filter(Boolean) as string[];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleCTA = () => {
    if (project.cta_type === 'custom' && project.cta_url) {
      window.open(project.cta_url, '_blank');
    } else {
      // Pour les autres types, déclencher un événement ou rediriger vers le formulaire de contact
      window.dispatchEvent(new CustomEvent('portfolio:quote', { detail: { project } }));
    }
  };

  const getCTALabel = () => {
    switch (project.cta_type) {
      case 'quote':
        return project.cta_label || 'Demander un devis similaire';
      case 'booking':
        return project.cta_label || 'Réserver un RDV';
      case 'contact':
        return project.cta_label || 'Me contacter';
      case 'custom':
        return project.cta_label || 'En savoir plus';
      default:
        return 'Me contacter';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-white">
        {/* Header - Hero */}
        <div className="relative">
          {/* Image Hero */}
          {project.featured_image && (
            <div className="relative h-96 overflow-hidden">
              <img
                src={project.featured_image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Bouton fermer */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full h-10 w-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Titre sur l'image */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.category && (
                    <Badge className="text-white" style={{ backgroundColor: brandColor }}>
                      {project.category}
                    </Badge>
                  )}
                  {project.created_at && (
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(project.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {project.title}
                </h1>
                {project.short_description && (
                  <p className="text-lg text-white/90 max-w-3xl">
                    {project.short_description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="px-8 py-10 space-y-12">
          {/* Section 1: Présentation */}
          {project.short_description && !project.featured_image && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {project.short_description}
              </p>
            </div>
          )}

          {/* Section 2: Le Défi (Challenge) */}
          {project.challenge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
                  }}
                >
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Le Défi</h2>
                  <p className="text-sm text-gray-600">Contexte et problématique</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border-2 border-orange-100">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line text-lg">
                  {project.challenge}
                </p>
              </div>
            </motion.div>
          )}

          {/* Section 3: La Solution */}
          {project.solution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)`
                  }}
                >
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">La Solution</h2>
                  <p className="text-sm text-gray-600">Approche et méthodologie</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-100">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line text-lg">
                  {project.solution}
                </p>
              </div>
            </motion.div>
          )}

          {/* Section 4: Galerie d'images */}
          {allImages.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Aperçus visuels</h2>

              <div className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative h-96"
                >
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${project.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </motion.div>

                {/* Navigation galerie */}
                {allImages.length > 1 && (
                  <>
                    <Button
                      onClick={prevImage}
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full h-12 w-12 p-0 shadow-lg"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                      onClick={nextImage}
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full h-12 w-12 p-0 shadow-lg"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>

                    {/* Indicateurs */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'w-8 bg-white'
                              : 'w-2 bg-white/50'
                          }`}
                          aria-label={`Image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Miniatures */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-blue-500 scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Section 5: Vidéo */}
          {project.video_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Démonstration vidéo</h2>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <div className="relative pb-[56.25%] h-0">
                  <iframe
                    src={project.video_url}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${project.title} - Vidéo`}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Section 6: Le Résultat */}
          {project.result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`
                  }}
                >
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Le Résultat</h2>
                  <p className="text-sm text-gray-600">Impact et bénéfices mesurables</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line text-lg">
                  {project.result}
                </p>
              </div>
            </motion.div>
          )}

          {/* Section 7: Technologies / Outils */}
          {project.tags && project.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Technologies utilisées</h2>
              <div className="flex flex-wrap gap-3">
                {project.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: `${brandColor}20`,
                      color: brandColor,
                      border: `2px solid ${brandColor}40`
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Section 8: Témoignage */}
          {project.testimonial_content && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-100"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Témoignage Client</h2>
                  <p className="text-sm text-gray-600">Retour d'expérience</p>
                </div>
              </div>

              <blockquote className="text-gray-800 text-xl italic leading-relaxed mb-6">
                "{project.testimonial_content}"
              </blockquote>

              <div className="flex items-center justify-between">
                <div>
                  {project.testimonial_author && (
                    <p className="font-bold text-gray-900 text-lg">
                      {project.testimonial_author}
                    </p>
                  )}
                </div>

                {project.testimonial_rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${
                          i < project.testimonial_rating!
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Section 9: PDF */}
          {project.pdf_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Button
                onClick={() => window.open(project.pdf_url, '_blank')}
                variant="outline"
                className="w-full py-6 text-lg border-2"
              >
                <FileDown className="mr-2 h-5 w-5" />
                Télécharger la plaquette (PDF)
              </Button>
            </motion.div>
          )}

          {/* Section 10: CTA Final */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 text-center border-2 border-blue-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Envie de créer un projet similaire ?
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Contactez-moi pour discuter de votre projet et voir comment nous pouvons travailler ensemble.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleCTA}
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-bold shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
                }}
              >
                {getCTALabel()}
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg"
              >
                Découvrir mes autres projets
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
