import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Target,
  Briefcase,
  TrendingUp,
  Award,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  FileDown,
  Globe,
  Sparkles,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PortfolioService } from '@/services/portfolioService';
import { supabase } from '@/integrations/supabase/client';
import { QuoteRequestDialog } from '@/components/portfolio/QuoteRequestDialog';
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer';

const ProjectDetail: React.FC = () => {
  const { id: cardId, projectId } = useParams<{ id: string; projectId: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);

  // Fetch card data
  const { data: card } = useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('Card ID required');
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!cardId
  });

  // Fetch portfolio settings
  const { data: settings } = useQuery({
    queryKey: ['portfolio-settings', cardId],
    queryFn: async () => {
      if (!cardId) return null;
      return await PortfolioService.getCardSettings(cardId);
    },
    enabled: !!cardId
  });

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ['portfolio-project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID required');
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;

      // Increment view count
      await PortfolioService.incrementProjectViews(projectId);

      return data;
    },
    enabled: !!projectId
  });

  // Mapping des polices (même que Marketplace/Portfolio)
  const FONT_GOOGLE_MAP: Record<string, string> = {
    'font-inter': 'Inter',
    'font-poppins': 'Poppins',
    'font-manrope': 'Manrope',
    'font-montserrat': 'Montserrat',
    'font-dm-sans': 'DM Sans',
    'font-nunito': 'Nunito',
    'font-nunito-sans': 'Nunito Sans',
    'font-outfit': 'Outfit',
    'font-plus-jakarta': 'Plus Jakarta Sans',
    'font-rubik': 'Rubik',
    'font-urbanist': 'Urbanist',
    'font-raleway': 'Raleway',
    'font-lato': 'Lato',
    'font-open-sans': 'Open Sans',
    'font-roboto': 'Roboto',
    'font-roboto-condensed': 'Roboto Condensed',
    'font-worksans': 'Work Sans',
    'font-quicksand': 'Quicksand',
    'font-josefin': 'Josefin Sans',
    'font-lexend': 'Lexend',
    'font-mulish': 'Mulish',
  };

  const dbFontFamily = (card as any)?.font_family || (card?.custom_fields as any)?.font_family;
  const fontFamily = dbFontFamily && FONT_GOOGLE_MAP[dbFontFamily]
    ? FONT_GOOGLE_MAP[dbFontFamily]
    : 'Poppins';

  const brandColor = settings?.brand_color || '#8B5CF6';

  // Charger la police Google Fonts dynamiquement
  useEffect(() => {
    if (fontFamily) {
      const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/ /g, '+')}"]`);
      if (existingLink) return;

      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [fontFamily]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Projet non trouvé</h1>
          <Button
            onClick={() => navigate(`/card/${cardId}/portfolio`)}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 px-6"
          >
            Retour au portfolio
          </Button>
        </div>
      </div>
    );
  }

  const allImages = [project.featured_image, ...(project.gallery_images || [])].filter(Boolean) as string[];

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
      // Ouvrir le modal de demande de devis
      setIsQuoteDialogOpen(true);
    }
  };

  const getCTALabel = () => {
    switch (project.cta_type) {
      case 'quote': return project.cta_label || 'Demander un devis similaire';
      case 'booking': return project.cta_label || 'Réserver un RDV';
      case 'contact': return project.cta_label || 'Me contacter';
      case 'custom': return project.cta_label || 'En savoir plus';
      default: return 'Me contacter';
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily }}>
      {/* Header Apple-style avec cover image noire */}
      <div className="relative overflow-hidden bg-black border-b border-white/10">
        {/* Cover image avec effet */}
        {project.featured_image && (
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 bg-cover bg-center transform scale-110 transition-transform duration-[10s] hover:scale-100"
              style={{
                backgroundImage: `url(${project.featured_image})`,
                filter: 'brightness(0.3) saturate(0.8)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          </div>
        )}

        {/* Fallback si pas d'image */}
        {!project.featured_image && (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        )}

        {/* Contenu du header */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div>
            {/* Bouton retour Apple-style */}
            <Button
              onClick={() => navigate(`/card/${cardId}/portfolio`)}
              variant="ghost"
              className="mb-8 text-white/90 hover:text-white hover:bg-white/5 rounded-full px-5 py-2.5 h-auto font-medium text-sm backdrop-blur-xl border border-white/10 transition-all duration-500 hover:border-white/20 hover:-translate-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" strokeWidth={2.5} />
              Retour au portfolio
            </Button>

            {/* Badges Apple-style */}
            <div className="flex flex-wrap gap-3 mb-6">
              {project.category && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                  <Package className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                  <span className="text-white/90 text-xs font-semibold tracking-wider uppercase">{project.category}</span>
                </div>
              )}
              {project.created_at && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                  <span className="text-white/90 text-xs font-semibold tracking-wider">
                    {new Date(project.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Titre Apple-style */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-none">
              {project.title}
            </h1>

            {/* Description courte */}
            {project.short_description && (
              <p className="text-white/70 text-base md:text-lg mb-6 max-w-3xl leading-relaxed font-light">
                {project.short_description}
              </p>
            )}

            {/* CTA dans le header */}
            {card?.email && (
              <Button
                onClick={handleCTA}
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-bold shadow-2xl hover:scale-105 transition-all duration-300 mt-4"
                style={{ backgroundColor: brandColor }}
              >
                <Mail className="mr-2 h-5 w-5" />
                {getCTALabel()}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal Apple-style */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">
        {/* Section Challenge */}
        {project.challenge && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 p-8 md:p-12 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-start gap-6 mb-8">
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: `${brandColor}` }}
                >
                  <Target className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Le Défi</h2>
                  <p className="text-sm text-gray-600 font-medium">Contexte et problématique du projet</p>
                </div>
              </div>
              <SafeHtmlRenderer
                content={project.challenge}
                className="text-lg text-gray-700 leading-relaxed font-light prose prose-lg max-w-none"
                as="div"
              />
            </div>
          </motion.section>
        )}

        {/* Section Solution */}
        {project.solution && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 p-8 md:p-12 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-start gap-6 mb-8">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                  <Briefcase className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">La Solution</h2>
                  <p className="text-sm text-gray-600 font-medium">Approche et méthodologie mise en œuvre</p>
                </div>
              </div>
              <SafeHtmlRenderer
                content={project.solution}
                className="text-lg text-gray-700 leading-relaxed font-light prose prose-lg max-w-none"
                as="div"
              />
            </div>
          </motion.section>
        )}

        {/* Galerie d'images Apple-style */}
        {allImages.length > 1 && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: brandColor }} />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Aperçus Visuels</h2>
              <p className="text-lg text-gray-600 font-light">Galerie des visuels du projet</p>
            </div>

            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-50">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-video"
              >
                <img
                  src={allImages[currentImageIndex]}
                  alt={`${project.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </motion.div>

              {/* Navigation Apple-style */}
              {allImages.length > 1 && (
                <>
                  <Button
                    onClick={prevImage}
                    size="icon"
                    className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full w-12 h-12 bg-white/95 hover:bg-white shadow-2xl border border-gray-200"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2.5} />
                  </Button>

                  <Button
                    onClick={nextImage}
                    size="icon"
                    className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full w-12 h-12 bg-white/95 hover:bg-white shadow-2xl border border-gray-200"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-900" strokeWidth={2.5} />
                  </Button>

                  {/* Indicateurs */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {allImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Miniatures Apple-style */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mt-6">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-video rounded-xl overflow-hidden border-3 transition-all hover:scale-105 ${
                      index === currentImageIndex
                        ? 'scale-105 shadow-xl'
                        : 'shadow-md'
                    }`}
                    style={{
                      borderWidth: '3px',
                      borderColor: index === currentImageIndex ? brandColor : 'transparent'
                    }}
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
          </motion.section>
        )}

        {/* Vidéo */}
        {project.video_url && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Démonstration Vidéo</h2>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
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
          </motion.section>
        )}

        {/* Section Résultat */}
        {project.result && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 p-8 md:p-12 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-start gap-6 mb-8">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Le Résultat</h2>
                  <p className="text-sm text-gray-600 font-medium">Impact et bénéfices mesurables</p>
                </div>
              </div>
              <SafeHtmlRenderer
                content={project.result}
                className="text-lg text-gray-700 leading-relaxed font-light prose prose-lg max-w-none"
                as="div"
              />
            </div>
          </motion.section>
        )}

        {/* Technologies Apple-style */}
        {project.tags && project.tags.length > 0 && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">Technologies Utilisées</h2>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {project.tags.map((tag, index) => (
                <Badge
                  key={index}
                  className="px-5 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: `${brandColor}15`,
                    color: brandColor,
                    border: `2px solid ${brandColor}30`
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.section>
        )}

        {/* Témoignage Apple-style */}
        {project.testimonial_content && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 p-8 md:p-12 hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: brandColor }}
                >
                  <Award className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Témoignage Client</h2>
                  <p className="text-sm text-gray-600 font-medium">Retour d'expérience</p>
                </div>
              </div>

              <blockquote className="text-xl text-gray-700 italic leading-relaxed mb-8 font-light">
                "{project.testimonial_content}"
              </blockquote>

              <div className="flex items-center justify-between">
                <div>
                  {project.testimonial_author && (
                    <p className="font-bold text-lg text-gray-900">{project.testimonial_author}</p>
                  )}
                  {project.testimonial_role && (
                    <p className="text-gray-600 text-sm">{project.testimonial_role}</p>
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
                        strokeWidth={2}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* PDF Download Apple-style */}
        {project.pdf_url && (
          <motion.section
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Button
              onClick={() => window.open(project.pdf_url, '_blank')}
              size="lg"
              variant="outline"
              className="w-full py-8 text-lg font-semibold rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-[1.02]"
            >
              <FileDown className="mr-3 h-6 w-6" strokeWidth={2} />
              Télécharger la Plaquette (PDF)
            </Button>
          </motion.section>
        )}

        {/* CTA Final Apple-style */}
        <motion.section
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] p-12 md:p-16 text-center overflow-hidden bg-white border border-gray-200 shadow-2xl"
        >
          {/* Decorations */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: brandColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: brandColor }}
          />

          <div className="relative z-10">
            <Sparkles className="h-16 w-16 mx-auto mb-6" style={{ color: brandColor }} />

            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Un Projet Similaire en Tête ?
            </h2>
            <p className="text-lg text-gray-700 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Discutons de comment nous pouvons travailler ensemble pour concrétiser votre vision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleCTA}
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-bold shadow-2xl hover:scale-110 transition-all duration-300"
                style={{ backgroundColor: brandColor }}
              >
                <Mail className="mr-3 h-6 w-6" />
                {getCTALabel()}
              </Button>

              <Button
                onClick={() => navigate(`/card/${cardId}/portfolio`)}
                variant="outline"
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-bold border-2 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
              >
                <Globe className="mr-3 h-6 w-6" />
                Autres Projets
              </Button>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 bg-white/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 mb-2">
            © {new Date().getFullYear()} {card?.name}. Tous droits réservés.
          </p>
          <p className="text-sm text-gray-500">
            Portfolio propulsé par{' '}
            <a
              href="/"
              className="font-semibold hover:underline transition-colors"
              style={{ color: brandColor }}
            >
              Bööh
            </a>
          </p>
        </div>
      </footer>

      {/* Dialog de demande de devis */}
      <QuoteRequestDialog
        isOpen={isQuoteDialogOpen}
        onClose={() => setIsQuoteDialogOpen(false)}
        cardId={cardId}
        userId={card?.user_id || ''}
        brandColor={brandColor}
        defaultServiceName={`Projet similaire à: ${project?.title}`}
      />
    </div>
  );
};

export default ProjectDetail;
