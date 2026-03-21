import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Loader2, Trash2, Edit, FileImage, FileText, FileArchive, Copy, Eye, Plus, Upload, X, Calendar, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';

// Types
interface ContentItem {
  id: string;
  title: string;
  type: 'image' | 'article' | 'product' | 'other';
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name?: string;
}

const ContentManagement: React.FC = () => {
  console.log('ContentManagement component rendered');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  console.log('User:', user);
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  
  // Formulaire de création d'article
  const [articleForm, setArticleForm] = React.useState({
    title: '',
    summary: '',
    content: '',
    tags: '',
    status: 'draft' as 'published' | 'draft' | 'archived',
    images: [] as string[],
    readTime: '5 min',
    author: 'Équipe Bööh',
    publishDate: new Date().toISOString().split('T')[0],
    featured: false,
  });
  
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<ContentItem | null>(null);

  // Fonction pour éditer un article
  const handleEditArticle = async (article: ContentItem) => {
    try {
      // Charger les détails complets de l'article depuis Supabase
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', article.id)
        .single();

      if (error) throw error;

      // Parser les métadonnées
      let metadata = {};
      try {
        metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata || {};
      } catch (e) {
        console.warn('Failed to parse metadata for editing:', e);
      }

      // Pré-remplir le formulaire avec les données
      const articleImages = Array.isArray(metadata.images) ? metadata.images : (metadata.image ? [metadata.image] : []);

      setArticleForm({
        title: data.title || '',
        summary: metadata.summary || '',
        content: data.content || '',
        tags: Array.isArray(metadata.tags) ? metadata.tags.join(', ') : '',
        status: data.status || 'draft',
        images: articleImages,
        readTime: metadata.readTime || '5 min',
        author: metadata.author || 'Équipe Bööh',
        publishDate: metadata.date || data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        featured: metadata.featured || false,
      });

      setImagePreviews(articleImages);
      setEditingArticle({ ...article, ...data });
      setIsCreateDialogOpen(true);

    } catch (error: any) {
      console.error('Error loading article for editing:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'article pour modification.",
        variant: "destructive",
      });
    }
  };

  console.log('Creating content query...');
  // Charger les vrais contenus depuis la base de données
  const { data: contents, isLoading, error } = useQuery({
    queryKey: ['admin-contents'],
    queryFn: async () => {
      console.log('Fetching content items...');
      try {
        console.log('Supabase client available:', !!supabase);
        console.log('About to execute Supabase query...');

        // First try a simple query to check if table exists
        console.log('Testing simple query first...');
        const { data: testData, error: testError } = await supabase
          .from('content_items')
          .select('id, title')
          .limit(1);

        if (testError) {
          console.error('Simple query failed:', testError);
          throw new Error(`Table 'content_items' not found or inaccessible: ${testError.message}`);
        }

        console.log('Simple query succeeded, now trying full query...');

        const { data, error } = await supabase
        .from('content_items')
        .select(`
          id,
          title,
          type,
          status,
          created_at,
          updated_at,
          author_id
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content items:', error);
        return [];
      }

      console.log('Content items fetched:', data);

      // Transform Supabase data to match our interface
      const transformedData = (data || []).map((item: any) => {
        let metadata = {};
        try {
          metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata || {};
        } catch (e) {
          console.warn('Failed to parse metadata for item:', item.id);
        }

        return {
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          author_id: item.author_id,
          author_name: item.profiles?.full_name || metadata.author || 'Utilisateur inconnu'
        };
      });

      console.log('Transformed data:', transformedData);
      return transformedData;
    } catch (err) {
      console.error('Error in queryFn:', err);
      throw err;
    }
  },
  enabled: true,
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: true
  });

  // Mise à jour d'un article existant
  const updateArticle = useMutation({
    mutationFn: async (formData: typeof articleForm & { id: string }) => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté');
      }

      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const { data, error } = await supabase
        .from('content_items')
        .update({
          title: formData.title,
          content: formData.content,
          metadata: {
            summary: formData.summary,
            tags: tagsArray,
            images: formData.images,
            image: formData.images[0] || '', // Pour compatibilité
            readTime: formData.readTime,
            author: formData.author,
            date: formData.publishDate,
            featured: formData.featured,
          },
        })
        .eq('id', formData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
      toast({
        title: "Article mis à jour",
        description: "L'article a été modifié avec succès.",
      });
      setIsCreateDialogOpen(false);
      setEditingArticle(null);
      // Réinitialiser le formulaire
      if (imagePreview && !imagePreview.includes('supabase')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview('');
      setArticleForm({
        title: '',
        summary: '',
        content: '',
        tags: '',
        status: 'draft',
        images: [],
        readTime: '5 min',
        author: 'Équipe Bööh',
        publishDate: new Date().toISOString().split('T')[0],
        featured: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification de l'article.",
        variant: "destructive",
      });
    }
  });

  // Création d'un article de blog
  const createArticle = useMutation({
    mutationFn: async (formData: typeof articleForm) => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté');
      }

      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const { data, error } = await supabase
        .from('content_items')
        .insert({
          title: formData.title,
          type: 'article',
          status: formData.status,
          content: formData.content,
          metadata: {
            summary: formData.summary,
            tags: tagsArray,
            images: formData.images,
            image: formData.images[0] || '', // Pour compatibilité
            readTime: formData.readTime,
            author: formData.author,
            date: formData.publishDate,
            featured: formData.featured,
          },
          author_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
      toast({
        title: "Article créé",
        description: "L'article de blog a été créé avec succès.",
      });
      setIsCreateDialogOpen(false);
      // Réinitialiser le formulaire
      if (imagePreview && !imagePreview.includes('supabase')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview('');
      setArticleForm({
        title: '',
        summary: '',
        content: '',
        tags: '',
        status: 'draft',
        images: [],
        readTime: '5 min',
        author: 'Équipe Bööh',
        publishDate: new Date().toISOString().split('T')[0],
        featured: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'article.",
        variant: "destructive",
      });
    }
  });

  const deleteContent = useMutation({
    mutationFn: async (_id: string) => {
      const { error } = await supabase.from('content_items').delete().eq('id', _id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contents'] });
      toast({
        title: "Contenu supprimé",
        description: "Le contenu a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du contenu.",
        variant: "destructive",
      });
    }
  });

  // Upload d'image vers Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Le fichier doit être une image',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: 'Erreur',
        description: 'L\'image doit faire moins de 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Créer une prévisualisation
      const previewUrl = URL.createObjectURL(file);
      // Ajouter à la liste des previews temporairement
      setImagePreviews(prev => [...prev, previewUrl]);

      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `blog/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      let finalUrl: string;

      if (uploadError) {
        // Essayer avec le bucket 'card-covers' ou créer un nouveau bucket
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('card-covers')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (fallbackError) throw fallbackError;

        const { data: { publicUrl } } = supabase.storage
          .from('card-covers')
          .getPublicUrl(fallbackData.path);

        finalUrl = publicUrl;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(uploadData.path);

        finalUrl = publicUrl;
      }

      // Remplacer la prévisualisation temporaire par l'URL finale
      const lastIndex = imagePreviews.length - 1;
      const newPreviews = [...imagePreviews];
      newPreviews[lastIndex] = finalUrl;
      setImagePreviews(newPreviews);

      // Ajouter l'URL finale au formulaire
      setArticleForm(prev => ({ ...prev, images: [...prev.images.slice(0, -1), finalUrl] }));

      toast({
        title: 'Image uploadée',
        description: 'L\'image a été uploadée avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'upload',
        description: error.message || 'Impossible d\'uploader l\'image',
        variant: 'destructive',
      });
      // Nettoyer la prévisualisation temporaire en cas d'erreur
      const lastIndex = imagePreviews.length - 1;
      const imageToRemove = imagePreviews[lastIndex];
      if (imageToRemove && !imageToRemove.includes('supabase')) {
        URL.revokeObjectURL(imageToRemove);
      }
      setImagePreviews(prev => prev.slice(0, -1));
    } finally {
      setUploadingImage(false);
    }
  };

  const addImage = (imageUrl: string) => {
    setImagePreviews(prev => [...prev, imageUrl]);
    setArticleForm(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
  };

  const removeImage = (index: number) => {
    const imageToRemove = imagePreviews[index];
    if (imageToRemove && !imageToRemove.includes('supabase')) {
      URL.revokeObjectURL(imageToRemove);
    }
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = articleForm.images.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
    setArticleForm(prev => ({ ...prev, images: newImages }));
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingArticle) {
      // Mode édition
      updateArticle.mutate({ ...articleForm, id: editingArticle.id });
    } else {
      // Mode création
      createArticle.mutate(articleForm);
    }
  };

  // TODO: Implement status change UI - mutation removed as unused
  // If needed, recreate with: useMutation({ mutationFn: async ({ id, status }) => ... })

  // Filtrage des contenus
  const filteredContents = React.useMemo(() => {
    if (!contents) return [];

    return contents.filter(content => {
      const matchesType = selectedType === "all" || content.type === selectedType;
      const matchesStatus = selectedStatus === "all" || content.status === selectedStatus;
      const matchesSearch = searchQuery === "" ||
        content.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [contents, selectedType, selectedStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredContents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContents = filteredContents.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedStatus, searchQuery]);

  // Helper pour afficher l'icône selon le type de contenu
  const getContentIcon = (type: string) => {
    switch(type) {
      case 'image': return <FileImage className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      case 'product': return <Copy className="h-4 w-4" />;
      default: return <FileArchive className="h-4 w-4" />;
    }
  };

  // Helper pour afficher le badge de statut
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'published': 
        return <Badge variant="default" className="bg-gray-100">Publié</Badge>;
      case 'draft': 
        return <Badge variant="outline">Brouillon</Badge>;
      case 'archived': 
        return <Badge variant="secondary" className="bg-gray-900 text-white">Archivé</Badge>;
      default: 
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des contenus...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Erreur lors du chargement des contenus</p>
        <p className="text-sm text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          Nombre d'éléments trouvés: {contents?.length || 0}
        </p>
        {contents && contents.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer">Voir les données brutes</summary>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(contents.slice(0, 3), null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Filtres et Recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un contenu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de contenu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="product">Produits</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setSelectedType("all");
            setSelectedStatus("all");
          }}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            {filteredContents.length} contenu{filteredContents.length !== 1 ? 's' : ''} trouvé{filteredContents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-2 !bg-gray-900 !hover:bg-gray-800 !text-white !border-0"
              style={{ backgroundColor: '#111827', color: '#ffffff' }}
            >
              <Plus className="h-4 w-4" /> Nouvel article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] bg-white flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-gray-900 text-xl font-bold">
                {editingArticle ? 'Modifier l\'article' : 'Créer un nouvel article de blog'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Remplissez les informations pour créer un nouvel article de blog.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateArticle} className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-900">Titre *</Label>
                  <Input
                    id="title"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    placeholder="Titre de l'article"
                    required
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author" className="text-gray-900">Auteur</Label>
                  <Input
                    id="author"
                    value={articleForm.author}
                    onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                    placeholder="Équipe Bööh"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary" className="text-gray-900">Résumé *</Label>
                <Textarea
                  id="summary"
                  value={articleForm.summary}
                  onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                  placeholder="Court résumé de l'article qui apparaîtra dans la liste"
                  rows={3}
                  required
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-gray-900">Contenu *</Label>
                <div className="border border-gray-300 rounded-lg bg-white">
                  <RichTextEditor
                    id="content"
                    value={articleForm.content}
                    onChange={(value) => setArticleForm({ ...articleForm, content: value })}
                    placeholder="Contenu complet de l'article. Utilisez la barre d'outils pour formater le texte (gras, italique, listes, etc.)"
                    rows={15}
                    className="min-h-[400px]"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Le contenu est sauvegardé en HTML. Utilisez la barre d'outils pour formater votre texte. Raccourcis : Ctrl+B (gras), Ctrl+I (italique), Ctrl+U (souligné), Ctrl+Z (annuler)
                </p>
              </div>

              {/* Upload d'images multiples avec prévisualisation */}
              <div className="space-y-2">
                <Label className="text-gray-900">Images de l'article</Label>
                <div className="space-y-3">
                  {/* Grille des images existantes */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                              disabled={uploadingImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {index === 0 && (
                            <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              Image principale
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Zone d'upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <FileImage className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? 'Upload en cours...' : 'Ajouter une image'}
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG, WEBP jusqu'à 5MB</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {imagePreviews.length}/10 images • La première sera l'image principale
                    </p>
                  </div>

                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upload en cours...
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-gray-900">Tags</Label>
                  <Input
                    id="tags"
                    value={articleForm.tags}
                    onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                    placeholder="CRM, IA, Business"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="readTime" className="text-gray-900">Temps de lecture</Label>
                  <Input
                    id="readTime"
                    value={articleForm.readTime}
                    onChange={(e) => setArticleForm({ ...articleForm, readTime: e.target.value })}
                    placeholder="5 min"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishDate" className="text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de publication
                  </Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={articleForm.publishDate}
                    onChange={(e) => setArticleForm({ ...articleForm, publishDate: e.target.value })}
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-900">Statut</Label>
                  <Select
                    value={articleForm.status}
                    onValueChange={(value) => setArticleForm({ ...articleForm, status: value as any })}
                  >
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Featured checkbox */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Checkbox
                  id="featured"
                  checked={articleForm.featured}
                  onCheckedChange={(checked) => setArticleForm({ ...articleForm, featured: !!checked })}
                />
                <Label
                  htmlFor="featured"
                  className="text-gray-900 font-medium cursor-pointer flex items-center gap-2"
                >
                  <Star className="h-4 w-4 text-yellow-500" />
                  Article mis en avant (featured)
                </Label>
              </div>
              </div>
            </form>
            
            {/* Actions en bas - Sorties du formulaire pour rester visibles */}
            <div className="flex justify-end gap-2 pt-4 pb-2 border-t border-gray-200 flex-shrink-0 bg-white px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingArticle(null);
                  // Réinitialiser le formulaire si on annule l'édition
                  if (editingArticle) {
                    setArticleForm({
                      title: '',
                      summary: '',
                      content: '',
                      tags: '',
                      status: 'draft',
                      image: '',
                      readTime: '5 min',
                      author: 'Équipe Bööh',
                      publishDate: new Date().toISOString().split('T')[0],
                      featured: false,
                    });
                    setImagePreview('');
                  }
                }}
                disabled={createArticle.isPending || updateArticle.isPending}
              >
                Annuler
              </Button>
              <Button 
                type="button"
                onClick={handleCreateArticle}
                disabled={(createArticle.isPending || updateArticle.isPending) || !articleForm.title || !articleForm.summary || !articleForm.content}
                className="!bg-gray-900 !hover:bg-gray-800 !text-white !border-0 disabled:!opacity-50 disabled:!cursor-not-allowed"
                style={{ backgroundColor: '#111827', color: '#ffffff' }}
              >
                {(createArticle.isPending || updateArticle.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingArticle ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  editingArticle ? 'Modifier l\'article' : 'Créer l\'article'
                )}
        </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des contenus */}
      {filteredContents.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-md">
          <p>Aucun contenu ne correspond à vos critères.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Type</TableHead>
              <TableHead className="min-w-[200px]">Titre</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[180px]">Dernière modification</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentContents.map((content) => (
              <TableRow key={content.id}>
                <TableCell className="p-2">{getContentIcon(content.type)}</TableCell>
                <TableCell className="font-medium">{content.title}</TableCell>
                <TableCell>{content.author_name || 'Inconnu'}</TableCell>
                <TableCell>{getStatusBadge(content.status)}</TableCell>
                <TableCell>{new Date(content.updated_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Voir l'article"
                      onClick={() => {
                        // Générer un slug à partir du titre pour l'URL
                        const slug = content.title
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '') || content.id;
                        window.open(`/article/${slug}`, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Modifier l'article"
                      onClick={() => handleEditArticle(content)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Supprimer l'article"
                      onClick={() => deleteContent.mutate(content.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {filteredContents.length > itemsPerPage && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/60 shadow-xl p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredContents.length)} sur {filteredContents.length} contenus
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>

              {/* Numéros de page */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else {
                    if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement; 