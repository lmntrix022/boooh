import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Award
} from 'lucide-react';
import { PortfolioProject } from '@/services/portfolioService';

interface ProjectDetailModalProps {
  project: PortfolioProject | null;
  isOpen: boolean;
  onClose: () => void;
  onCTAClick: () => void;
  brandColor?: string;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onCTAClick,
  brandColor = '#8B5CF6'
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!project) return null;

  const allImages = [
    project.featured_image,
    ...(project.gallery_images || [])
  ].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const getCTALabel = () => {
    switch (project.cta_type) {
      case 'quote':
        return project.cta_label || 'Demander un devis';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-white border border-gray-200 shadow-lg rounded-lg">
        {/* Header sticky */}
        <DialogHeader className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-light mb-2 tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >
                {project.title}
              </DialogTitle>
              <DialogDescription className="text-gray-500 mb-4 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {(project as any).description || 'Détails du projet'}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2">
                {project.category && (
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {project.category}
                  </Badge>
                )}
                {project.tags && project.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-gray-600 font-light border-gray-200"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-8">
          {/* Galerie d'images */}
          {allImages.length > 0 && (
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
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
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Navigation galerie */}
              {allImages.length > 1 && (
                <>
                  <Button
                    onClick={prevImage}
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-10 w-10 p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={nextImage}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-10 w-10 p-0"
                  >
                    <ChevronRight className="h-5 w-5" />
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
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Vidéo */}
          {project.video_url && (
            <div className="rounded-lg overflow-hidden">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  src={project.video_url}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Description courte */}
          {project.short_description && (
            <p className="text-lg text-gray-700 leading-relaxed">
              {project.short_description}
            </p>
          )}

          {/* Le Défi */}
          {project.challenge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >Le Défi</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {project.challenge}
              </p>
            </motion.div>
          )}

          {/* La Solution */}
          {project.solution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >La Solution</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {project.solution}
              </p>
            </motion.div>
          )}

          {/* Le Résultat */}
          {project.result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >Le Résultat</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {project.result}
              </p>
            </motion.div>
          )}

          {/* Témoignage client */}
          {project.testimonial_content && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >Témoignage Client</h3>
              </div>

              <blockquote className="text-gray-700 text-lg italic leading-relaxed mb-4 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                "{project.testimonial_content}"
              </blockquote>

              <div className="flex items-center justify-between">
                <div>
                  {project.testimonial_author && (
                    <p className="font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {project.testimonial_author}
                    </p>
                  )}
                  {project.testimonial_role && (
                    <p className="text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {project.testimonial_role}
                    </p>
                  )}
                </div>

                {project.testimonial_rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < project.testimonial_rating!
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {project.testimonial_date && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                  <Calendar className="h-4 w-4" />
                  {new Date(project.testimonial_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* PDF */}
          {project.pdf_url && (
            <Button
              onClick={() => window.open(project.pdf_url, '_blank')}
              variant="outline"
              className="w-full"
            >
              📄 Télécharger la plaquette (PDF)
            </Button>
          )}

          {/* CTA Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sticky bottom-0 bg-white border-t pt-6 -mx-6 px-6 pb-0"
          >
            <Button
              onClick={onCTAClick}
              className="w-full text-lg py-6 font-bold shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
              }}
            >
              {getCTALabel()}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
