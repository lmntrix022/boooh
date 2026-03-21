import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Edit, Eye, FileCode, Code2, Copy } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

// Types pour les données Supabase
interface DbTemplate {
  id: string;
  name: string;
  description: string | null;
  content: any; // JSON contenant html_content, css_content, js_content
  created_at: string | null;
  updated_at: string | null;
  thumbnail_url: string | null;
}

// Types pour l'interface utilisateur
interface Template {
  id: string;
  name: string;
  description?: string;
  html_content: string;
  css_content?: string;
  js_content?: string;
  created_at?: string;
  updated_at?: string;
  thumbnail_url?: string;
}

// Fonction pour transformer un template de la base de données en template pour l'UI
const dbTemplateToTemplate = (dbTemplate: DbTemplate): Template => {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description || undefined,
    html_content: dbTemplate.content?.html || "",
    css_content: dbTemplate.content?.css || undefined,
    js_content: dbTemplate.content?.js || undefined,
    created_at: dbTemplate.created_at || undefined,
    updated_at: dbTemplate.updated_at || undefined,
    thumbnail_url: dbTemplate.thumbnail_url || undefined
  };
};

// Fonction pour transformer un template de l'UI en template pour la base de données
const templateToDbTemplate = (template: Partial<Template>): Partial<DbTemplate> => {
  return {
    name: template.name!,
    description: template.description || null,
    content: {
      html: template.html_content,
      css: template.css_content || '',
      js: template.js_content || ''
    }
  };
};

const TemplateManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch templates
  const { data: dbTemplates, isLoading, error } = useQuery<DbTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, description, content, created_at, updated_at, thumbnail_url')
        .order('created_at', { ascending: false });
      
      if (error) {
        // Error log removed
        throw error;
      }
      
      return data || [];
    }
  });

  // Convertir les templates pour l'UI
  const templates: Template[] = React.useMemo(() => {
    if (!dbTemplates) return [];
    return dbTemplates.map(dbTemplateToTemplate);
  }, [dbTemplates]);

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (newTemplate: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
      const dbTemplate = templateToDbTemplate(newTemplate) as DbTemplate;
      // Type assertion: templates table not in generated types
      const { data, error } = await (supabase
        .from('templates')
        .insert as any)([{ ...dbTemplate }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsCreateDialogOpen(false);
      toast({
        title: t('admin.templateManagement.toasts.created'),
        description: t('admin.templateManagement.toasts.createdDescription'),
      });
    },
    onError: (_error) => {
      // Error log removed
      toast({
        title: t('admin.templateManagement.toasts.error'),
        description: t('admin.templateManagement.toasts.createError'),
        variant: "destructive",
      });
    }
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async (template: Template) => {
      const dbTemplate = templateToDbTemplate(template);
      // Type assertion: templates table not in generated types
      const { data, error } = await (supabase
        .from('templates')
        .update as any)(dbTemplate)
        .eq('id', template.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsEditDialogOpen(false);
      toast({
        title: t('admin.templateManagement.toasts.updated'),
        description: t('admin.templateManagement.toasts.updatedDescription'),
      });
    },
    onError: (_error) => {
      // Error log removed
      toast({
        title: t('admin.templateManagement.toasts.error'),
        description: t('admin.templateManagement.toasts.updateError'),
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: t('admin.templateManagement.toasts.deleted'),
        description: t('admin.templateManagement.toasts.deletedDescription'),
      });
    },
    onError: (_error) => {
      // Error log removed
      toast({
        title: t('admin.templateManagement.toasts.error'),
        description: t('admin.templateManagement.toasts.deleteError'),
        variant: "destructive",
      });
    }
  });

  // Handle create form submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newTemplate = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      html_content: formData.get('html_content') as string,
      css_content: formData.get('css_content') as string,
      js_content: formData.get('js_content') as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    createTemplate.mutate(newTemplate);
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const updatedTemplate = {
      ...selectedTemplate,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      html_content: formData.get('html_content') as string,
      css_content: formData.get('css_content') as string,
      js_content: formData.get('js_content') as string,
      updated_at: new Date().toISOString()
    };

    updateTemplate.mutate(updatedTemplate);
  };

  // Filter templates
  // TODO: Currently unused - will be needed when implementing advanced filtering
  // const filteredTemplates = React.useMemo(() => {
  //   if (!templates) return [];
  //
  //   return templates.filter(template => {
  //     const matchesSearch = searchQuery === "" ||
  //       template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
  //
  //     return matchesSearch;
  //   });
  // }, [templates, searchQuery]);

  // Extract unique categories (désactivé car plus de catégorie)
  // const categories: string[] = [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('admin.templateManagement.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-gray-700 border border-red-200 rounded-md">
        {t('admin.templateManagement.errorLoadingDescription')}
      </div>
    );
  }

  // Preview Template
  // TODO: Currently unused - will be needed when preview feature is implemented
  // const handlePreview = (template: Template) => {
  //   setSelectedTemplate(template);
  //   setIsPreviewDialogOpen(true);
  // };

  return (
    <div className="space-y-6">
      {/* Filtres et Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-2 flex-1">
          <Input
            placeholder={t('admin.templateManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-auto md:flex-1"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> {t('admin.templateManagement.create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('admin.templateManagement.createNew')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('admin.templateManagement.form.name')}</Label>
                  <Input id="name" name="name" placeholder={t('admin.templateManagement.form.namePlaceholder')} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('admin.templateManagement.form.description')}</Label>
                <Textarea id="description" name="description" placeholder={t('admin.templateManagement.form.descriptionPlaceholder')} rows={2} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_premium">Premium</Label>
                  <Select name="is_premium" defaultValue="false">
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Premium?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Non</SelectItem>
                      <SelectItem value="true">Oui</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Tabs defaultValue="html" className="w-full">
                <TabsList>
                  <TabsTrigger value="html" className="flex items-center">
                    <FileCode className="h-4 w-4 mr-2" /> HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" className="flex items-center">
                    <Code2 className="h-4 w-4 mr-2" /> CSS
                  </TabsTrigger>
                  <TabsTrigger value="js" className="flex items-center">
                    <Code2 className="h-4 w-4 mr-2" /> JavaScript
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="space-y-2">
                  <Label htmlFor="html_content">{t('admin.templateManagement.form.htmlContent')}</Label>
                  <Textarea id="html_content" name="html_content" rows={10} className="font-mono text-sm" required />
                </TabsContent>
                <TabsContent value="css" className="space-y-2">
                  <Label htmlFor="css_content">{t('admin.templateManagement.form.cssContent')}</Label>
                  <Textarea id="css_content" name="css_content" rows={10} className="font-mono text-sm" />
                </TabsContent>
                <TabsContent value="js" className="space-y-2">
                  <Label htmlFor="js_content">{t('admin.templateManagement.form.jsContent')}</Label>
                  <Textarea id="js_content" name="js_content" rows={10} className="font-mono text-sm" />
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('common.loading')}</>
                  ) : (
                    t('admin.templateManagement.createNew')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tableau premium */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-2xl shadow-sm border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20 p-4 overflow-x-auto animate-fade-in-up">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
            <span className="ml-2 text-gray-900">{t('admin.templateManagement.loading')}</span>
          </div>
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl">
              <TableRow>
                <TableHead className="text-gray-900 font-bold text-sm">{t('admin.templateManagement.tableHeaders.template')}</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm">{t('admin.templateManagement.tableHeaders.description')}</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm">{t('admin.templateManagement.tableHeaders.date')}</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm">{t('admin.templateManagement.tableHeaders.status')}</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm text-center">{t('admin.templateManagement.tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(template => (
                <TableRow key={template.id} className="transition-all duration-200 group hover:scale-[1.015] hover:shadow-[0_0_0_6px_#a5b4fc55,0_8px_32px_rgba(80,200,180,0.10)] hover:bg-gray-900 hover:from-blue-50/60 hover:to-purple-50/40 cursor-pointer">
                  {/* Miniature/preview + nom */}
                  <TableCell className="flex items-center gap-3 font-semibold text-gray-900">
                    {template.thumbnail_url ? (
                      <img src={template.thumbnail_url} alt={template.name} className="w-12 h-12 rounded-lg object-cover shadow-md border-2 border-blue-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100r from-blue-200 via-purple-200 to-emerald-100 flex items-center justify-center text-lg font-bold text-white shadow-md">
                        <FileCode className="w-6 h-6 text-gray-900" />
                      </div>
                    )}
                    <span className="truncate max-w-[140px]">{template.name}</span>
                  </TableCell>
                  <TableCell className="text-gray-700 max-w-[220px] truncate">{template.description || '-'}</TableCell>
                  <TableCell>{template.created_at ? new Date(template.created_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow transition-all duration-200 animate-pulse bg-gray-900 from-gray-900 to-gray-800 text-white`}>
                      {t('admin.templateManagement.status.active')}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2 justify-center items-center">
                    {/* Voir */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-blue-200/60 transition-all duration-200 flex items-center justify-center" title={t('admin.templateManagement.actions.view')} onClick={() => { setSelectedTemplate(template); setIsPreviewDialogOpen(true); }}>
                      <Eye className="h-4 w-4 text-gray-900" />
                    </Button>
                    {/* Éditer */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-purple-200/60 transition-all duration-200 flex items-center justify-center" title={t('admin.templateManagement.actions.edit')} onClick={() => { setSelectedTemplate(template); setIsEditDialogOpen(true); }}>
                      <Edit className="h-4 w-4 text-gray-900" />
                    </Button>
                    {/* Dupliquer */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-emerald-200/60 transition-all duration-200 flex items-center justify-center" title={t('admin.templateManagement.actions.duplicate')} onClick={() => alert('Fonction à implémenter') /* TODO: implémenter */}>
                      <Copy className="h-4 w-4 text-emerald-500" />
                    </Button>
                    {/* Activer/désactiver */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-yellow-200/60 transition-all duration-200 flex items-center justify-center" title={t('admin.templateManagement.actions.activate')} onClick={() => alert('Fonction à implémenter') /* TODO: implémenter */}>
                      <Code2 className="h-4 w-4 text-gray-700" />
                    </Button>
                    {/* Supprimer */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-red-200/60 transition-all duration-200 flex items-center justify-center" title={t('admin.templateManagement.deleteTooltip')} onClick={() => deleteTemplate.mutate(template.id)} disabled={deleteTemplate.isPending}>
                      {deleteTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin text-gray-700" /> : <Trash2 className="h-4 w-4 text-gray-700" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogue d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.templateManagement.editTemplate')}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('admin.templateManagement.form.name')}</Label>
                  <Input id="edit-name" name="name" placeholder={t('admin.templateManagement.form.namePlaceholder')} defaultValue={selectedTemplate.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">{t('admin.templateManagement.form.description')}</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description" 
                    placeholder={t('admin.templateManagement.form.descriptionPlaceholder')}
                    rows={2} 
                    defaultValue={selectedTemplate.description || ''}
                  />
                </div>
              </div>
              
              <Tabs defaultValue="html" className="w-full">
                <TabsList>
                  <TabsTrigger value="html" className="flex items-center">
                    <FileCode className="h-4 w-4 mr-2" /> HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" className="flex items-center">
                    <Code2 className="h-4 w-4 mr-2" /> CSS
                  </TabsTrigger>
                  <TabsTrigger value="js" className="flex items-center">
                    <Code2 className="h-4 w-4 mr-2" /> JavaScript
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="space-y-2">
                  <Label htmlFor="edit-html_content">{t('admin.templateManagement.form.htmlContent')}</Label>
                  <Textarea 
                    id="edit-html_content" 
                    name="html_content" 
                    rows={10} 
                    className="font-mono text-sm"
                    defaultValue={selectedTemplate.html_content}
                    required 
                  />
                </TabsContent>
                <TabsContent value="css" className="space-y-2">
                  <Label htmlFor="edit-css_content">{t('admin.templateManagement.form.cssContent')}</Label>
                  <Textarea 
                    id="edit-css_content" 
                    name="css_content" 
                    rows={10} 
                    className="font-mono text-sm"
                    defaultValue={selectedTemplate.css_content || ''}
                  />
                </TabsContent>
                <TabsContent value="js" className="space-y-2">
                  <Label htmlFor="edit-js_content">{t('admin.templateManagement.form.jsContent')}</Label>
                  <Textarea 
                    id="edit-js_content" 
                    name="js_content" 
                    rows={10} 
                    className="font-mono text-sm"
                    defaultValue={selectedTemplate.js_content || ''}
                  />
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateTemplate.isPending}>
                  {updateTemplate.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('common.loading')}</>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de prévisualisation */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('admin.templateManagement.view')}: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-2 bg-gray-100 rounded text-sm">
                {selectedTemplate.description && (
                  <p><strong>{t('admin.templateManagement.form.description')}:</strong> {selectedTemplate.description}</p>
                )}
              </div>
              <div className="border rounded-md overflow-hidden">
                <iframe
                  srcDoc={`
                    <html>
                      <head>
                        <style>${selectedTemplate.css_content || ''}</style>
                      </head>
                      <body>
                        ${selectedTemplate.html_content}
                        <script>${selectedTemplate.js_content || ''}</script>
                      </body>
                    </html>
                  `}
                  className="w-full h-[50vh] border-none"
                  title={`Preview ${selectedTemplate.name}`}
                />
              </div>
              <Tabs defaultValue="html" className="w-full">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="html">
                  <Card>
                    <CardContent className="pt-6">
                      <pre className="p-4 bg-gray-100 overflow-auto rounded text-sm font-mono">
                        {selectedTemplate.html_content}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="css">
                  <Card>
                    <CardContent className="pt-6">
                      <pre className="p-4 bg-gray-100 overflow-auto rounded text-sm font-mono">
                        {selectedTemplate.css_content || '/* Pas de CSS */'}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="js">
                  <Card>
                    <CardContent className="pt-6">
                      <pre className="p-4 bg-gray-100 overflow-auto rounded text-sm font-mono">
                        {selectedTemplate.js_content || '// Pas de JavaScript'}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManagement;
