import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Grid3x3, Grid2x2, Loader2, Eye, Calendar, ExternalLink, Sparkles, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioService } from '@/services/portfolioService';
import { optimizedQueries } from '@/lib/optimizedQueries';
import PortfolioHeader from '@/components/portfolio/PortfolioHeader';
import PortfolioAbout from '@/components/portfolio/PortfolioAbout';
import PortfolioServices from '@/components/portfolio/PortfolioServices';
import PortfolioTestimonials from '@/components/portfolio/PortfolioTestimonials';
import PortfolioContact from '@/components/portfolio/PortfolioContact';
import { QuoteRequestDialog } from '@/components/portfolio/QuoteRequestDialog';
import { useLanguage } from '@/hooks/useLanguage';

const PortfolioView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [gridColumns, setGridColumns] = useState<2 | 3>(3);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<string>('');

  // Charger les données de la carte avec optimizedQueries (meilleure performance)
  const { data: card, isLoading: loadingCard } = useQuery({
    queryKey: ['portfolio-card', id],
    queryFn: async () => {
      if (!id) throw new Error('ID manquant');
      // Utiliser optimizedQueries qui a le cache et les requêtes parallèles
      return await optimizedQueries.getCardWithRelations(id, false);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Charger les paramètres du portfolio
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['portfolio-settings', id],
    queryFn: async () => {
      if (!id) return null;
      return await PortfolioService.getCardSettings(id);
    },
    enabled: !!id
  });

  // Charger les projets
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['portfolio-projects', id],
    queryFn: async () => {
      if (!id) return [];
      return await PortfolioService.getCardProjects(id);
    },
    enabled: !!id
  });

  // Mapping des polices (même que Marketplace)
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

  // Récupérer la police exactement comme dans Marketplace
  const dbFontFamily = (card as any)?.font_family || (card?.custom_fields as any)?.font_family;
  const fontFamily = dbFontFamily && FONT_GOOGLE_MAP[dbFontFamily]
    ? FONT_GOOGLE_MAP[dbFontFamily]
    : 'Poppins';

  const accentColor = settings?.brand_color || '#8B5CF6';

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

  // Filtrer les projets
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.short_description?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  }, [projects, searchQuery, selectedCategory]);

  // Catégories disponibles
  const categories = useMemo(() => {
    const cats = Array.from(new Set(projects.map(p => p.category).filter(Boolean))) as string[];
    return [
      { id: 'all', label: t('portfolio.categories.all'), count: projects.length },
      ...cats.map(cat => ({
        id: cat,
        label: cat,
        count: projects.filter(p => p.category === cat).length
      }))
    ];
  }, [projects]);

  if (loadingCard || settingsLoading || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t('portfolio.loading')}</p>
        </div>
      </div>
    );
  }

  if (!card || !settings?.is_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('portfolio.notAvailable.title')}</h1>
          <Button onClick={() => navigate(`/card/${id}`)} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 px-6">
            {t('portfolio.notAvailable.backToCard')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily }}>
      <div>
        {/* Header avec branding */}
        <PortfolioHeader
          card={card}
          accentColor={accentColor}
          onBack={() => navigate(`/card/${id}`)}
          totalProjects={projects.length}
          fontFamily={fontFamily}
        />

        {/* Section À propos */}
        <PortfolioAbout
          card={card}
          accentColor={accentColor}
          fontFamily={fontFamily}
        />

        {/* Section Mes Services */}
        <PortfolioServices
          accentColor={accentColor}
          fontFamily={fontFamily}
          cardId={id!}
          onRequestQuote={(serviceName) => {
            setSelectedServiceForQuote(serviceName);
            setIsQuoteDialogOpen(true);
          }}
        />

        {/* Titre de section Projets */}
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              {t('portfolio.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('portfolio.subtitle')}
            </p>
          </div>
        </div>

        {/* Barre de recherche et filtres - Apple Design */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-500">
            {/* Barre de recherche Apple-style */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors duration-300" strokeWidth={2} />
                <Input
                  type="text"
                  placeholder={t('portfolio.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-gray-200/50 bg-gray-50/50 focus:bg-white text-base font-medium placeholder:text-gray-400 focus:border-black transition-all duration-300"
                />
              </div>

              {/* Boutons de vue Apple-style */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                    gridColumns === 2
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setGridColumns(2)}
                >
                  <Grid2x2 className="w-5 h-5" strokeWidth={2} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                    gridColumns === 3
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setGridColumns(3)}
                >
                  <Grid3x3 className="w-5 h-5" strokeWidth={2} />
                </Button>
              </div>
            </div>

            {/* Filtres Apple-style */}
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant="ghost"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-6 py-3 h-auto text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" strokeWidth={2} />
                  {cat.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory === cat.id ? 'bg-white/20' : 'bg-white/50'
                  }`}>
                    {cat.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Résultats */}
          <div className="mt-6">
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center hover:shadow-md transition-shadow duration-300">
                <p className="text-gray-600 text-base font-medium mb-2 tracking-wide">{t('portfolio.noProjects')}</p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 px-8 font-medium tracking-wide transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg"
                  >
                    {t('portfolio.resetSearch')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm font-medium mb-5 tracking-wide">
                  {filteredProjects.length === 1 
                    ? t('portfolio.projectsFound', { count: filteredProjects.length })
                    : t('portfolio.projectsFoundPlural', { count: filteredProjects.length })}
                </p>

                {/* Grille de projets Apple-style */}
                <div className={`grid ${gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                  {filteredProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.5,
                      }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/card/${id}/portfolio/project/${project.id}`)}
                    >
                      {/* Apple-style card */}
                      <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl border border-gray-100/50 overflow-hidden transition-all duration-500 hover:border-gray-200 h-full">
                        {/* Image du projet - Apple style */}
                        <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
                          {/* Badge catégorie - Apple minimalist */}
                          {project.category && (
                            <div className="absolute top-4 left-4 z-10">
                              <div className="px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl text-gray-900 text-xs font-semibold shadow-lg border border-gray-100/50 flex items-center gap-2 hover:bg-white transition-all duration-500">
                                <Package className="w-3.5 h-3.5" strokeWidth={2.5} />
                                {project.category}
                              </div>
                            </div>
                          )}

                          {/* Views indicator - Apple style */}
                          <div className="absolute top-4 right-4 z-10">
                            <div className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl">
                              <Eye className="w-3 h-3" strokeWidth={2.5} />
                              {project.view_count || 0}
                            </div>
                          </div>

                          {/* Image */}
                          {project.featured_image ? (
                            <img
                              src={project.featured_image}
                              alt={project.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                              <Sparkles className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                            </div>
                          )}

                          {/* Overlay gradient - Apple style */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Informations du projet - Apple typography */}
                        <CardContent className="p-6 bg-white">
                          {/* Titre du projet - Apple bold */}
                          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 tracking-tight leading-tight">
                            {project.title}
                          </h3>

                          {/* Description - Apple light */}
                          {project.short_description && (
                            <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed font-light">
                              {project.short_description}
                            </p>
                          )}

                          {/* Tags */}
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                              {project.tags.slice(0, 3).map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${accentColor}15`,
                                    color: accentColor
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                              {project.tags.length > 3 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  +{project.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Date et action */}
                          <div className="flex items-center justify-between">
                            {project.created_at && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                {new Date(project.created_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long'
                                })}
                              </div>
                            )}

                            {/* Bouton Voir - Apple minimal */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/card/${id}/portfolio/project/${project.id}`);
                              }}
                              variant="ghost"
                              size="sm"
                              className="rounded-full px-4 py-2 h-auto font-semibold text-xs bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />
                              {t('portfolio.view')}
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section Témoignages */}
        <PortfolioTestimonials
          cardId={id!}
          accentColor={accentColor}
          fontFamily={fontFamily}
        />

        {/* Section Contact */}
        <PortfolioContact
          card={card}
          accentColor={accentColor}
          fontFamily={fontFamily}
        />

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-gray-200 bg-white/50 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-600 mb-2">
              {t('portfolio.footer.copyright', { year: new Date().getFullYear(), name: card.name })}
            </p>
            <p className="text-sm text-gray-500">
              {t('portfolio.footer.poweredBy')}{' '}
              <a
                href="/"
                className="font-semibold hover:underline transition-colors"
                style={{ color: accentColor }}
              >
                Bööh
              </a>
            </p>
          </div>
        </footer>
      </div>

      {/* Dialog de demande de devis */}
      <QuoteRequestDialog
        isOpen={isQuoteDialogOpen}
        onClose={() => {
          setIsQuoteDialogOpen(false);
          setSelectedServiceForQuote('');
        }}
        cardId={id}
        userId={card?.user_id || ''}
        brandColor={accentColor}
        defaultServiceName={selectedServiceForQuote}
      />
    </div>
  );
};

export default PortfolioView;
