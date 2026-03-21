import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  GripVertical,
  Search,
  Filter,
  BarChart2,
  Settings,
  FileText,
  FolderKanban,
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PortfolioService, PortfolioProject } from '@/services/portfolioService';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export const ProjectsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Récupération des projets
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['user-portfolio-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return await PortfolioService.getUserProjects(user.id, { publishedOnly: false });
    },
    enabled: !!user?.id
  });

  // Extraction des projets du résultat paginé
  const projects = projectsData?.projects || [];

  // Récupération des stats
  const { data: stats } = useQuery({
    queryKey: ['portfolio-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return await PortfolioService.getStats(user.id);
    },
    enabled: !!user?.id
  });

  // Mutation pour supprimer un projet
  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => PortfolioService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-portfolio-projects'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      toast({
        title: t('portfolio.projectsList.toasts.deleted.title'),
        description: t('portfolio.projectsList.toasts.deleted.description'),
      });
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast({
        title: t('portfolio.projectsList.toasts.deleteError.title'),
        description: t('portfolio.projectsList.toasts.deleteError.description'),
        variant: 'destructive',
      });
      // Error log removed
    }
  });

  // Mutation pour publier/dépublier
  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      PortfolioService.updateProject(id, { is_published: !isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-portfolio-projects'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      toast({
        title: t('portfolio.projectsList.toasts.statusUpdated.title'),
        description: t('portfolio.projectsList.toasts.statusUpdated.description'),
      });
    },
    onError: (error) => {
      toast({
        title: t('portfolio.projectsList.toasts.statusError.title'),
        description: t('portfolio.projectsList.toasts.statusError.description'),
        variant: 'destructive',
      });
      // Error log removed
    }
  });

  // Mutation pour dupliquer
  const duplicateMutation = useMutation({
    mutationFn: async (project: PortfolioProject) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { id, slug, created_at, updated_at, view_count, ...projectData } = project;

      return await PortfolioService.createProject(user.id, {
        ...projectData,
        title: `${project.title} (Copie)`,
        is_published: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-portfolio-projects'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      toast({
        title: t('portfolio.projectsList.toasts.duplicated.title'),
        description: t('portfolio.projectsList.toasts.duplicated.description'),
      });
    },
    onError: (error) => {
      toast({
        title: t('portfolio.projectsList.toasts.duplicateError.title'),
        description: t('portfolio.projectsList.toasts.duplicateError.description'),
        variant: 'destructive',
      });
      // Error log removed
    }
  });

  // Extraction des catégories uniques
  const categories = Array.from(
    new Set(projects.map(p => p.category).filter(Boolean))
  ) as string[];

  // Filtrage des projets
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || project.category === filterCategory;
    const matchesPublished = filterPublished === 'all' ||
                            (filterPublished === 'published' && project.is_published) ||
                            (filterPublished === 'draft' && !project.is_published);

    return matchesSearch && matchesCategory && matchesPublished;
  });

  const handleDelete = (projectId: string) => {
    setProjectToDelete(projectId);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8 flex justify-center items-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 text-gray-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-x-hidden bg-white">
        {/* Header */}
        <motion.div
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                {/* Icon Container */}
                <motion.div
                  className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                >
                  <FolderKanban className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:w-8 text-gray-600 relative z-10" />
                </motion.div>
                
                <div className="min-w-0 flex-1">
                  <motion.h1
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
            {t('portfolio.projectsList.title')}
                  </motion.h1>
                  <motion.p
                    className="text-sm md:text-base text-gray-500 font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
          >
              {t('portfolio.projectsList.subtitle')}
                  </motion.p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                onClick={() => navigate('/portfolio/quotes')}
              >
                <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('portfolio.projectsList.quotes')}</span>
              </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                    className="rounded-lg px-4 py-2 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-300 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                onClick={() => navigate('/portfolio/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('portfolio.projectsList.settings')}</span>
              </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
            {/* Total Projects */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <FolderKanban className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                  </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.projectsList.stats.totalProjects')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.total_projects}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Published */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <Eye className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                  </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.projectsList.stats.published')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.published_projects}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Total Views */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <BarChart2 className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                  </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.projectsList.stats.totalViews')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.total_views}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Quotes Received */}
            <motion.div
              className="relative h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <FileText className="w-6 h-6 md:w-7 md:h-7 text-gray-600 relative z-10" />
                  </motion.div>
                  </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('portfolio.projectsList.stats.quotesReceived')}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 leading-none tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stats.total_quotes}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Toolbar */}
        <motion.div
          className="relative bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 md:mb-8 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="relative z-10 p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <motion.div
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="h-5 w-5 text-gray-600" />
                  </motion.div>
                  <Input
                    placeholder={t('portfolio.projectsList.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 h-12 bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:border-gray-300 transition-all duration-200 rounded-lg text-sm shadow-sm font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-row gap-2 md:gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="rounded-lg px-4 h-12 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm whitespace-nowrap font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                    <Filter className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">{t('portfolio.projectsList.filterCategory')}</span>
                    {filterCategory !== 'all' && (
                          <Badge variant="secondary" className="ml-2 bg-gray-900 text-white border-0 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                        {filterCategory}
                      </Badge>
                    )}
                  </Button>
                    </motion.div>
                </DropdownMenuTrigger>
                  <DropdownMenuContent className="portfolio-actions-fix bg-white border border-gray-200 rounded-lg shadow-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                  <DropdownMenuItem onClick={() => setFilterCategory('all')}>
                    {t('portfolio.projectsList.allCategories')}
                  </DropdownMenuItem>
                  {categories.map(cat => (
                    <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)}>
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="rounded-lg px-4 h-12 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm whitespace-nowrap font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                    <Filter className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">{t('portfolio.projectsList.filterStatus')}</span>
                    {filterPublished !== 'all' && (
                          <Badge variant="secondary" className="ml-2 bg-gray-900 text-white border-0 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                        {filterPublished === 'published' ? t('portfolio.projectsList.table.published') : t('portfolio.projectsList.table.draft')}
                      </Badge>
                    )}
                  </Button>
                    </motion.div>
                </DropdownMenuTrigger>
                  <DropdownMenuContent className="portfolio-actions-fix bg-white border border-gray-200 rounded-lg shadow-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                  <DropdownMenuItem onClick={() => setFilterPublished('all')}>
                    {t('portfolio.projectsList.allStatuses')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPublished('published')}>
                    {t('portfolio.projectsList.published')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPublished('draft')}>
                    {t('portfolio.projectsList.draft')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* New Project Button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate('/portfolio/projects/new')}
                    className="rounded-lg px-6 h-12 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-300 whitespace-nowrap font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
              >
                <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('portfolio.projectsList.newProject')}</span>
                    <span className="sm:hidden">+</span>
              </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Table */}
        <motion.div
          className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="relative z-10 p-6 md:p-8">
            {filteredProjects.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center py-16 md:py-24 relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-100 border border-gray-200 mb-6"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.25, type: "tween" }}
                >
                  <FolderKanban className="h-8 w-8 md:h-10 md:w-10 text-gray-600" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-light text-gray-900 mb-2 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {projects.length === 0 ? t('portfolio.projectsList.emptyState.noProjects') : t('portfolio.projectsList.emptyState.noResults')}
                </h3>
                <p className="text-gray-500 mb-6 text-center max-w-md text-sm md:text-base font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {projects.length === 0
                    ? t('portfolio.projectsList.emptyState.createFirst')
                    : t('portfolio.projectsList.emptyState.modifyFilters')}
                </p>
                {projects.length === 0 && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => navigate('/portfolio/projects/new')}
                      className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-300 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('portfolio.projectsList.emptyState.createProject')}
                  </Button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow className="border-b border-gray-200 hover:bg-transparent">
                      <TableHead className="w-12 text-gray-500 font-light uppercase text-xs tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      ></TableHead>
                      <TableHead className="text-gray-500 font-light uppercase text-xs tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('portfolio.projectsList.table.title')}</TableHead>
                      <TableHead className="text-gray-500 font-light uppercase text-xs tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('portfolio.projectsList.table.category')}</TableHead>
                      <TableHead className="text-center text-gray-500 font-light uppercase text-xs tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('portfolio.projectsList.table.views')}</TableHead>
                      <TableHead className="text-center text-gray-500 font-light uppercase text-xs tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('portfolio.projectsList.table.status')}</TableHead>
                      <TableHead className="text-right text-gray-500 font-light uppercase text-xs tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('portfolio.projectsList.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredProjects.map((project, index) => (
                      <motion.tr
                        key={project.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                      <TableCell>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                          </motion.div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {project.featured_image && (
                              <motion.img
                              src={project.featured_image}
                              alt={project.title}
                                className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            />
                          )}
                          <div>
                              <div className="font-light text-gray-900 tracking-tight"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                  fontWeight: 300,
                                  letterSpacing: '-0.01em',
                                }}
                              >{project.title}</div>
                            {project.short_description && (
                              <div className="text-sm text-gray-500 truncate max-w-md font-light"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {project.short_description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.category && (
                            <Badge variant="outline" className="border border-gray-200 text-gray-700 bg-white rounded-lg px-3 py-1 font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {project.category}
                            </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <Eye className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-sm font-light text-gray-900"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                              }}
                            >{project.view_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={project.is_published ? 'default' : 'secondary'}
                            className={`rounded-lg px-3 py-1 font-light ${
                              project.is_published 
                                ? 'bg-gray-900 text-white shadow-sm' 
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                        >
                          {project.is_published ? t('portfolio.projectsList.table.published') : t('portfolio.projectsList.table.draft')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="sm" className="portfolio-button-fix rounded-lg w-10 h-10">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                              </motion.div>
                          </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="portfolio-actions-fix bg-white border border-gray-200 rounded-lg shadow-lg font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                            <DropdownMenuItem
                              onClick={() => navigate(`/portfolio/projects/${project.id}/edit`)}
                                className="rounded-lg"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t('portfolio.projectsList.table.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                togglePublishMutation.mutate({
                                  id: project.id,
                                  isPublished: project.is_published
                                })
                              }
                                className="rounded-lg"
                            >
                              {project.is_published ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  {t('portfolio.projectsList.table.unpublish')}
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('portfolio.projectsList.table.publish')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => duplicateMutation.mutate(project)}
                                className="rounded-lg"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {t('portfolio.projectsList.table.duplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(project.id)}
                                className="text-gray-600 rounded-lg"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('portfolio.projectsList.table.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      </motion.tr>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('portfolio.projectsList.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('portfolio.projectsList.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('portfolio.projectsList.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('portfolio.projectsList.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ProjectsList;
