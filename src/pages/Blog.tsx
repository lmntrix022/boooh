import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, BookOpen, TrendingUp, Sparkles, Clock, Calendar, User, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PublicNavbar from '@/components/layout/PublicNavbar';
import FooterDark from "@/components/FooterDark";
import { useSEO } from "@/hooks/useSEO";
import { SchemaBreadcrumb } from "@/components/SEO/SchemaBreadcrumb";

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: string;
  tags: string[];
  date: string;
  author: string;
  readTime: string;
  featured: boolean;
}

export default function Blog() {
  const [selectedTag, setSelectedTag] = React.useState("Tous");
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();

  // Charger les articles depuis la base de données
  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ['blog-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('id, slug, title, content, metadata, status, created_at')
        .eq('type', 'article')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        return [];
      }

      return (data || []).map((item: any) => {
        // Générer un slug à partir du titre si pas de slug
        const generateSlug = (title: string): string => {
          return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };
        
        return {
          id: item.id,
          slug: item.slug || generateSlug(item.title) || item.id, // Fallback : slug généré ou ID
          title: item.title,
          summary: item.metadata?.summary || '',
          image: item.metadata?.image || '/blog/default.webp',
          tags: item.metadata?.tags || [],
          date: item.metadata?.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          author: item.metadata?.author || 'Équipe Bööh',
          readTime: item.metadata?.readTime || '5 min',
          featured: item.metadata?.featured || false,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Générer la liste des tags uniques
  const tags = useMemo(() => {
    const allTags = articles.flatMap(a => a.tags);
    return ["Tous", ...Array.from(new Set(allTags))];
  }, [articles]);

  // SEO Meta Tags - Amélioré
  useSEO({
    title: 'Blog Bööh – Conseils business, tech et IA',
    description: 'Apprenez à mieux gérer votre business numérique avec les astuces CRM, IA, et sécurité de Bööh. Conseils pratiques pour indépendants, PME et créateurs.',
    image: 'https://booh.ga/og-image-blog.png',
    url: 'https://booh.ga/blog',
    type: 'website',
    keywords: 'CRM IA, gestion contact, vente contenu digital, business automation, conseils business, transformation digitale, carte digitale'
  });

  const breadcrumbs = [
    { name: 'Accueil', url: 'https://booh.ga' },
    { name: 'Blog', url: 'https://booh.ga/blog' }
  ];

  const filtered = useMemo(() => {
    return articles.filter(a => {
      const matchesTag = selectedTag === "Tous" || a.tags.includes(selectedTag);
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.summary.toLowerCase().includes(search.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [articles, selectedTag, search]);

  const featured = useMemo(() => {
    return articles.find(a => a.featured);
  }, [articles]);

  return (
    <>
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      
      {/* Navigation */}
      <PublicNavbar />

      <main className="min-h-screen bg-white text-gray-900 apple-minimal-font">
        {/* Background minimal - Supprimé pour style Apple */}

        {/* Hero Section - Amélioré */}
        <section className="relative py-24 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto px-4"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Sparkles className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-light text-gray-500 uppercase tracking-wider">Ressources & Inspirations</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              <span className="text-gray-900">Ressources & inspirations</span>
              <br />
              <span className="text-gray-500">pour faire croître votre business</span>
            </h1>

            <motion.p
              className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              Conseils pratiques, guides et success stories pour transformer votre activité avec les outils Bööh
            </motion.p>

            {/* Search Bar Premium */}
            <motion.div
              className="relative w-full max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un article..."
                  className="w-full py-4 pl-14 pr-4 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all text-lg font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section className="relative z-10 py-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <p className="text-gray-400">Chargement des articles...</p>
            </div>
          </section>
        )}

        {/* Filtres Tags - Design Premium */}
        <section className="relative z-10 pb-8">
          <div className="flex flex-wrap justify-center gap-3 px-4 max-w-6xl mx-auto">
            {tags.map((tag, index) => (
              <motion.button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-5 py-2.5 rounded-lg border transition-all font-light text-sm ${
                  selectedTag === tag
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.05, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Section Featured Article */}
        {featured && (
          <section className="relative z-10 mb-20 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div
                className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 backdrop-blur-lg shadow-2xl"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Image */}
                  <motion.div
                    className="relative h-64 md:h-full min-h-[400px] overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                  >
                    <img 
                      src={featured.image} 
                      alt={featured.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex flex-col justify-center p-8 md:p-12 gap-4">
                    <motion.span
                      className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-light uppercase tracking-wider"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Article à la une
                    </motion.span>

                    <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      <Link to={`/article/${featured?.slug || featured?.id}`} className="hover:text-gray-600 transition-colors">
                        {featured.title}
                      </Link>
                    </h2>

                    <p className="text-lg text-gray-500 leading-relaxed font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{featured.summary}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {featured.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-light border border-gray-200"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {featured.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(featured.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {featured.readTime}
                      </div>
                    </div>

                    <motion.button
                      onClick={() => navigate(`/article/${featured?.slug || featured?.id}`)}
                      className="group inline-flex items-center gap-2 w-fit px-8 py-4 rounded-lg bg-gray-900 text-white font-light hover:bg-gray-800 transition-all"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Lire l'article
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Grille d'articles */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 mb-20">
          <motion.h2
            className="text-3xl md:text-4xl font-light text-gray-900 mb-12 text-center tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.03em',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Tous les articles
          </motion.h2>

          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 font-light">Aucun article trouvé</p>
                <p className="text-gray-500 mt-2 font-light">Essayez une autre recherche ou un autre filtre</p>
              </motion.div>
            ) : (
              <motion.div
                key="articles"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filtered.filter(a => !a.featured).map((article, index) => (
                  <motion.article
                    key={article.id}
                    className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200 hover:border-gray-300 transition-all flex flex-col h-full"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-4 p-6">
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-light border border-gray-200"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Link to={`/article/${article?.slug || article?.id}`}>
                        <h3 className="text-xl font-light text-gray-900 group-hover:text-gray-600 transition-colors leading-tight tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {article.title}
                        </h3>
                      </Link>

                      <p className="text-gray-500 text-sm leading-relaxed flex-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{article.summary}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <span>{article.author}</span>
                          <span>•</span>
                          <span>{article.readTime}</span>
                        </div>
                        <span>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>

                      <motion.button
                        onClick={() => navigate(`/article/${article?.slug || article?.id}`)}
                        className="inline-flex items-center gap-2 text-gray-600 font-light group/btn hover:text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        whileHover={{ x: 5 }}
                      >
                        Lire la suite
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* CTA Section Premium */}
        <section className="relative z-10 py-20 px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center rounded-2xl bg-white border border-gray-200 p-12 md:p-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.03em',
              }}
            >
              Prêt à transformer votre business ?
            </h2>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              Essayez Bööh gratuitement et découvrez comment une seule URL peut centraliser tout votre business.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <motion.button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 rounded-lg bg-gray-900 text-white font-light hover:bg-gray-800 transition-all"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Créer mon compte gratuit
              </motion.button>
              <motion.button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 rounded-lg bg-white text-gray-900 font-light border border-gray-300 hover:bg-gray-50 transition-all"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Demander une démo
              </motion.button>
            </div>
          </motion.div>
        </section>
      </main>
      
      <FooterDark />
    </>
  );
}
