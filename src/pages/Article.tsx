import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Share2, BookOpen, TrendingUp, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PublicNavbarLightweight from '@/components/layout/PublicNavbarLightweight';
import FooterDark from '@/components/FooterDark';
import { useSEO } from "@/hooks/useSEO";
import { SchemaBreadcrumb } from "@/components/SEO/SchemaBreadcrumb";

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  image: string; // Pour compatibilité
  images: string[]; // Tableau d'images
  tags: string[];
  date: string;
  author: string;
  readTime: string;
  content: string; // HTML content
}

export default function Article() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [readingProgress, setReadingProgress] = useState(0);

  // Charger l'article depuis la base de données
  const { data: article, isLoading, isError } = useQuery<Article | null>({
    queryKey: ['article', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      // Essayer d'abord par slug, puis par ID si c'est un UUID
      let data, error;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      
      if (isUUID) {
        // C'est un UUID, chercher par ID
        const result = await supabase
          .from('content_items')
          .select('id, slug, title, content, metadata, status, created_at')
          .eq('id', slug)
          .eq('type', 'article')
          .eq('status', 'published')
          .single();
        data = result.data;
        error = result.error;
      } else {
        // C'est un slug, chercher par slug
        const result = await supabase
          .from('content_items')
          .select('id, slug, title, content, metadata, status, created_at')
          .eq('slug', slug)
          .eq('type', 'article')
          .eq('status', 'published')
          .single();
        data = result.data;
        error = result.error;
        
        // Si pas trouvé par slug et que ça ressemble à un slug généré, essayer de le matcher avec les titres
        if (error && slug.includes('-')) {
          // Essayer de trouver par titre similaire (fallback)
          const resultByTitle = await supabase
            .from('content_items')
            .select('id, slug, title, content, metadata, status, created_at')
            .eq('type', 'article')
            .eq('status', 'published')
            .ilike('slug', `%${slug}%`)
            .maybeSingle();
          if (resultByTitle.data) {
            data = resultByTitle.data;
            error = null;
          }
        }
      }

      if (error || !data) {
        console.error('Error fetching article:', error);
        return null;
      }

      const item = data as any;

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
        image: item.metadata?.image || '/blog/default.webp', // Pour compatibilité
        images: Array.isArray(item.metadata?.images) ? item.metadata.images : (item.metadata?.image ? [item.metadata.image] : ['/blog/default.webp']),
        tags: item.metadata?.tags || [],
        date: item.metadata?.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        author: item.metadata?.author || 'Équipe Bööh',
        readTime: item.metadata?.readTime || '5 min',
        content: item.content || '',
      };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Charger les articles liés
  const { data: related = [] } = useQuery<Article[]>({
    queryKey: ['blog-articles', article?.id],
    queryFn: async () => {
      if (!article) return [];
      
      const { data, error } = await supabase
        .from('content_items')
        .select('id, slug, title, content, metadata, status, created_at')
        .eq('type', 'article')
        .eq('status', 'published')
        .neq('id', article.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching related articles:', error);
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
          image: item.metadata?.image || '/blog/default.webp', // Pour compatibilité
          images: Array.isArray(item.metadata?.images) ? item.metadata.images : (item.metadata?.image ? [item.metadata.image] : ['/blog/default.webp']),
          tags: item.metadata?.tags || [],
          date: item.metadata?.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          author: item.metadata?.author || 'Équipe Bööh',
          readTime: item.metadata?.readTime || '5 min',
          content: item.content || '',
        };
      });
    },
    enabled: !!slug && !!article,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // SEO Meta Tags dynamiques
  useSEO({
    title: article ? `${article.title} | Blog Bööh` : 'Article | Blog Bööh',
    description: article?.summary || '',
    image: article ? `https://booh.ga${article.image}` : 'https://booh.ga/og-image-blog.png',
    url: `https://booh.ga/article/${slug}`,
    type: 'article',
    keywords: article?.tags.join(', ') || '',
    author: article?.author || '',
    publishedDate: article?.date || ''
  });

  const breadcrumbs = [
    { name: 'Accueil', url: 'https://booh.ga' },
    { name: 'Blog', url: 'https://booh.ga/blog' },
    ...(article ? [{ name: article.title, url: `https://booh.ga/article/${article.slug}` }] : [])
  ];

  // Reading Progress Tracking
  useEffect(() => {
    const updateReadingProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', updateReadingProgress);
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);

  const handleShare = async () => {
    if (!article) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  // Gestion des états de chargement et d'erreur
  if (isLoading) {
    return (
      <>
        <PublicNavbarLightweight />
        <main className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              <div className="absolute inset-2 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
            </motion.div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chargement de l'article</h3>
              <p className="text-gray-600">Nous préparons le contenu pour vous...</p>
            </div>
          </div>
        </main>
        <footer className="bg-gray-50 border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm text-gray-500">© {new Date().getFullYear()} Bööh. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </>
    );
  }

  if (isError || !article) {
    return (
      <>
        <PublicNavbarLightweight />
        <main className="min-h-screen bg-white flex items-center justify-center px-4">
          <motion.div
            className="text-center max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Article introuvable</h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                L'article que vous recherchez n'existe pas ou n'est plus disponible.
              </p>
            </div>
            <motion.button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              Retour au blog
            </motion.button>
          </motion.div>
        </main>
        <footer className="bg-gray-50 border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm text-gray-500">© {new Date().getFullYear()} Bööh. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      {/* SEO Components */}
      <SchemaBreadcrumb items={breadcrumbs} />
      
      {/* Navigation */}
      <PublicNavbarLightweight />

      <main className="min-h-screen bg-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)] pointer-events-none" />

        {/* Hero Section */}
        <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <motion.button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors mb-8 group rounded-lg px-3 py-2 hover:bg-gray-50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: -3 }}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Retour au blog</span>
            </motion.button>

            {/* Article Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              {/* Tags */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {article.tags.slice(0, 3).map((tag, index) => (
                  <motion.span
                    key={tag}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 text-blue-700 text-sm font-medium shadow-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {tag}
                  </motion.span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                {article.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap justify-center items-center gap-6 text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{article.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <time dateTime={article.date} className="text-sm font-medium">
                    {new Date(article.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{article.readTime} de lecture</span>
                </div>
              </div>

              {/* Share Button */}
              <motion.button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">Partager</span>
              </motion.button>
            </motion.div>

            {/* Image Gallery */}
            {article.images && article.images.length > 0 && (
              <motion.div
                className="relative mb-16"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {article.images.length === 1 ? (
                  // Single image
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                    <img
                      src={article.images[0]}
                      alt={article.title}
                      className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  </div>
                ) : (
                  // Multiple images gallery
                  <div className="space-y-4">
                    {/* Main image */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                      <img
                        src={article.images[0]}
                        alt={`${article.title} - Image principale`}
                        className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        1 / {article.images.length}
                      </div>
                    </div>

                    {/* Thumbnail gallery */}
                    {article.images.length > 1 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                        {article.images.slice(1).map((image, index) => (
                          <motion.div
                            key={index + 1}
                            className="relative rounded-lg overflow-hidden shadow-lg bg-gray-100 cursor-pointer hover:scale-105 transition-transform"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={image}
                              alt={`${article.title} - Image ${index + 2}`}
                              className="w-full h-16 sm:h-20 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded backdrop-blur-sm">
                              {index + 2}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Article Content */}
            <motion.article
              className="max-w-none mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {/* Reading Progress Indicator */}
              <div className="sticky top-24 z-40 mb-8 hidden lg:block">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-1 shadow-sm">
                  <div
                    className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>

              {/* Article Content with Custom Styling */}
              <div
                className="article-content prose prose-lg prose-gray max-w-none
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:leading-tight
                  prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                  prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6
                  prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:space-y-2 prose-ol:space-y-2
                  prose-li:text-gray-700 prose-li:leading-relaxed
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                  prose-pre:bg-gray-900 prose-pre:text-white prose-pre:rounded-lg prose-pre:p-4
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-hr:border-gray-200 prose-hr:my-8"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Article Footer */}
              <motion.div
                className="mt-16 pt-8 border-t border-gray-200"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Publié le {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                  <motion.button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Partager</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center">
                  <motion.div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Prêt à transformer votre business ?
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Découvrez comment Bööh peut révolutionner votre gestion client et votre prospection avec des outils modernes et intuitifs.
                  </p>
                  <motion.button
                    onClick={() => navigate('/auth')}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Essayer Bööh gratuitement</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.article>
          </div>
        </section>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Articles recommandés
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Découvrez d'autres articles qui pourraient vous intéresser
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {related.map((relatedArticle, index) => (
                  <motion.article
                    key={relatedArticle.id}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                    onClick={() => navigate(`/article/${relatedArticle?.slug || relatedArticle?.id}`)}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={relatedArticle.image}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {relatedArticle.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-3">
                        {relatedArticle.title}
                      </h3>

                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {relatedArticle.summary}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {relatedArticle.readTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(relatedArticle.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

        {/* Footer */}
        <FooterDark />
    </>
  );
} 
