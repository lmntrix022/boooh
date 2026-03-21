import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, Star,
  Palette, Calendar,
  X, Camera, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ThemesPartyService, Party, ThemeParty, CreatePartyData, CreateThemePartyData } from '@/services/themesPartyService';

interface ThemesManagementProps {
  onClose?: () => void;
}

const ThemesManagement: React.FC<ThemesManagementProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'parties' | 'themes'>('parties');

  // États pour la pagination
  const [currentPageParties, setCurrentPageParties] = useState(1);
  const [currentPageThemes, setCurrentPageThemes] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // États pour les fêtes
  const [parties, setParties] = useState<Party[]>([]);
  // TODO: selectedParty will be used for party details view
  // const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showPartyDialog, setShowPartyDialog] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [partyForm, setPartyForm] = useState<CreatePartyData>({
    name: '',
    description: '',
    duration_days: 1,
    start_date: null,
    end_date: null,
    is_active: true
  });

  // États pour les thèmes
  const [themes, setThemes] = useState<ThemeParty[]>([]);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeParty | null>(null);
  const [themeForm, setThemeForm] = useState<CreateThemePartyData>({
    party_id: '',
    name: '',
    description: '',
    image_url: null,
    preview_image_url: null,
    background_color: '#ffffff',
    text_color: '#000000',
    accent_color: '#3b82f6',
    is_premium: false,
    is_active: true,
    sort_order: 0
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  // Réinitialiser la pagination quand les données changent
  useEffect(() => {
    setCurrentPageParties(1);
  }, [parties.length]);

  useEffect(() => {
    setCurrentPageThemes(1);
  }, [themes.length]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partiesData, themesData] = await Promise.all([
        ThemesPartyService.getAllParties(),
        ThemesPartyService.getAllThemesWithParty()
      ]);
      setParties(partiesData);
      setThemes(themesData);
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestion des fêtes
  const handleCreateParty = async () => {
    try {
      setLoading(true);
      const newParty = await ThemesPartyService.createParty(partyForm);
      setParties(prev => [...prev, newParty]);
      setShowPartyDialog(false);
      resetPartyForm();
      toast({
        title: 'Succès',
        description: 'Fête créée avec succès'
      });
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la fête',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParty = async () => {
    if (!editingParty) return;
    
    try {
      setLoading(true);
      const updatedParty = await ThemesPartyService.updateParty(editingParty.id, partyForm);
      setParties(prev => prev.map(p => p.id === editingParty.id ? updatedParty : p));
      setShowPartyDialog(false);
      setEditingParty(null);
      resetPartyForm();
      toast({
        title: 'Succès',
        description: 'Fête mise à jour avec succès',
      });
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la fête',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParty = async (party: Party) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la fête "${party.name}" ?`)) return;
    
    try {
      setLoading(true);
      await ThemesPartyService.deleteParty(party.id);
      setParties(prev => prev.filter(p => p.id !== party.id));
      toast({
        title: 'Succès',
        description: 'Fête supprimée avec succès',
      });
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la fête',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestion des thèmes
  const handleCreateTheme = async () => {
    try {
      setLoading(true);
      const newTheme = await ThemesPartyService.createTheme(themeForm);
      setThemes(prev => [...prev, newTheme]);
      setShowThemeDialog(false);
      resetThemeForm();
      toast({
        title: 'Succès',
        description: 'Thème créé avec succès',
      });
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le thème',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTheme = async () => {
    if (!editingTheme) return;
    
    try {
      setLoading(true);
      const updatedTheme = await ThemesPartyService.updateTheme(editingTheme.id, themeForm);
      setThemes(prev => prev.map(t => t.id === editingTheme.id ? updatedTheme : t));
      setShowThemeDialog(false);
      setEditingTheme(null);
      resetThemeForm();
      toast({
        title: 'Succès',
        description: 'Thème mis à jour avec succès',
      });
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le thème',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheme = async (theme: ThemeParty) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le thème "${theme.name}" ?`)) return;
    
    try {
      setLoading(true);
      await ThemesPartyService.deleteTheme(theme.id);
      setThemes(prev => prev.filter(t => t.id !== theme.id));
      toast({
        title: 'Succès',
        description: 'Thème supprimé avec succès',
      });
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le thème',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPartyForm = () => {
    setPartyForm({
      name: '',
      description: '',
      duration_days: 1,
      start_date: null,
      end_date: null,
      is_active: true
    });
  };

  const resetThemeForm = () => {
    setThemeForm({
      party_id: '',
      name: '',
      description: '',
      image_url: null,
      preview_image_url: null,
      background_color: '#ffffff',
      text_color: '#000000',
      accent_color: '#3b82f6',
      is_premium: false,
      is_active: true,
      sort_order: 0
    });
    setImagePreview(null);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const imageUrl = await ThemesPartyService.uploadThemeImage(file, 'temp');
      setThemeForm(prev => ({ ...prev, image_url: imageUrl }));
      setImagePreview(URL.createObjectURL(file));
      toast({
        title: 'Succès',
        description: 'Image uploadée avec succès',
      });
    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const openPartyDialog = (party?: Party) => {
    if (party) {
      setEditingParty(party);
      setPartyForm({
        name: party.name,
        description: party.description || '',
        duration_days: party.duration_days,
        start_date: party.start_date,
        end_date: party.end_date,
        is_active: party.is_active
      });
    } else {
      setEditingParty(null);
      resetPartyForm();
    }
    setShowPartyDialog(true);
  };

  const openThemeDialog = (theme?: ThemeParty) => {
    if (theme) {
      setEditingTheme(theme);
      setThemeForm({
        party_id: theme.party_id,
        name: theme.name,
        description: theme.description || '',
        image_url: theme.image_url,
        preview_image_url: theme.preview_image_url,
        background_color: theme.background_color,
        text_color: theme.text_color,
        accent_color: theme.accent_color,
        is_premium: theme.is_premium,
        is_active: theme.is_active,
        sort_order: theme.sort_order
      });
      setImagePreview(theme.image_url);
    } else {
      setEditingTheme(null);
      resetThemeForm();
    }
    setShowThemeDialog(true);
  };

  const getThemesByParty = (partyId: string) => {
    return themes.filter(theme => theme.party_id === partyId);
  };

  return (
    <div className="min-h-screen bg-gray-100r from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Thèmes de Fêtes</h1>
              <p className="text-gray-600">Créez et gérez des thèmes personnalisés pour différentes occasions</p>
            </div>
            {onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Fermer
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'parties' | 'themes')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="parties" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fêtes ({parties.length})
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Thèmes ({themes.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Fêtes */}
          <TabsContent value="parties" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Gestion des Fêtes</h2>
              <Button
                onClick={() => openPartyDialog()}
                className="flex items-center gap-2 bg-gray-900 from-gray-900 to-gray-800 hover:bg-gray-800 text-white shadow-md"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Fête
              </Button>
            </div>

            {/* Pagination et grille pour les fêtes */}
            {(() => {
              const totalPagesParties = Math.ceil(parties.length / itemsPerPage);
              const startIndexParties = (currentPageParties - 1) * itemsPerPage;
              const endIndexParties = startIndexParties + itemsPerPage;
              const currentParties = parties.slice(startIndexParties, endIndexParties);

              return (
                <>
                  {parties.length > itemsPerPage && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/60 shadow-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Affichage de {startIndexParties + 1} à {Math.min(endIndexParties, parties.length)} sur {parties.length} fêtes
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageParties(prev => Math.max(prev - 1, 1))}
                            disabled={currentPageParties === 1}
                            className="flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Précédent
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPagesParties, 5) }, (_, i) => {
                              let pageNumber;
                              if (totalPagesParties <= 5) {
                                pageNumber = i + 1;
                              } else {
                                if (currentPageParties <= 3) {
                                  pageNumber = i + 1;
                                } else if (currentPageParties >= totalPagesParties - 2) {
                                  pageNumber = totalPagesParties - 4 + i;
                                } else {
                                  pageNumber = currentPageParties - 2 + i;
                                }
                              }
                              return (
                                <Button
                                  key={pageNumber}
                                  variant={currentPageParties === pageNumber ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPageParties(pageNumber)}
                                >
                                  {pageNumber}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageParties(prev => Math.min(prev + 1, totalPagesParties))}
                            disabled={currentPageParties === totalPagesParties}
                            className="flex items-center gap-1"
                          >
                            Suivant
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentParties.map((party) => (
                <motion.div
                  key={party.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="h-full hover:shadow-md transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {party.name}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge variant={party.is_active ? "default" : "secondary"}>
                            {party.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {party.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {party.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {party.duration_days ?? 1} jour{(party.duration_days ?? 1) > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          {getThemesByParty(party.id).length} thème{getThemesByParty(party.id).length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPartyDialog(party)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteParty(party)}
                          className="text-gray-700 hover:text-gray-900 hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Tab Thèmes */}
          <TabsContent value="themes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Gestion des Thèmes</h2>
              <Button
                onClick={() => openThemeDialog()}
                className="flex items-center gap-2 bg-gray-900 from-gray-900 to-gray-800 hover:bg-gray-800 text-white shadow-md"
              >
                <Plus className="w-4 h-4" />
                Nouveau Thème
              </Button>
            </div>

            {/* Pagination pour les thèmes */}
            {(() => {
              const totalPagesThemes = Math.ceil(themes.length / itemsPerPage);
              const startIndexThemes = (currentPageThemes - 1) * itemsPerPage;
              const endIndexThemes = startIndexThemes + itemsPerPage;
              const currentThemes = themes.slice(startIndexThemes, endIndexThemes);

              return (
                <>
                  {themes.length > itemsPerPage && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/60 shadow-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Affichage de {startIndexThemes + 1} à {Math.min(endIndexThemes, themes.length)} sur {themes.length} thèmes
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageThemes(prev => Math.max(prev - 1, 1))}
                            disabled={currentPageThemes === 1}
                            className="flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Précédent
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPagesThemes, 5) }, (_, i) => {
                              let pageNumber;
                              if (totalPagesThemes <= 5) {
                                pageNumber = i + 1;
                              } else {
                                if (currentPageThemes <= 3) {
                                  pageNumber = i + 1;
                                } else if (currentPageThemes >= totalPagesThemes - 2) {
                                  pageNumber = totalPagesThemes - 4 + i;
                                } else {
                                  pageNumber = currentPageThemes - 2 + i;
                                }
                              }
                              return (
                                <Button
                                  key={pageNumber}
                                  variant={currentPageThemes === pageNumber ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPageThemes(pageNumber)}
                                >
                                  {pageNumber}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageThemes(prev => Math.min(prev + 1, totalPagesThemes))}
                            disabled={currentPageThemes === totalPagesThemes}
                            className="flex items-center gap-1"
                          >
                            Suivant
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentThemes.map((theme) => (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card className="h-full hover:shadow-md transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {theme.name}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {theme.is_premium && (
                            <Badge variant="default" className="bg-gray-100">
                              <Star className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          <Badge variant={theme.is_active ? "default" : "secondary"}>
                            {theme.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Image du thème */}
                      {theme.image_url && (
                        <div className="w-full h-24 rounded-lg overflow-hidden">
                          <img
                            src={theme.image_url}
                            alt={theme.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {parties.find(p => p.id === theme.party_id)?.name || 'Fête inconnue'}
                      </div>

                      {theme.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {theme.description}
                        </p>
                      )}

                      {/* Aperçu des couleurs */}
                      <div className="flex gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: theme.background_color ?? '#ffffff' }}
                          title={`Fond: ${theme.background_color}`}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: theme.text_color ?? '#000000' }}
                          title={`Texte: ${theme.text_color}`}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: theme.accent_color ?? '#3b82f6' }}
                          title={`Accent: ${theme.accent_color}`}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openThemeDialog(theme)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTheme(theme)}
                          className="text-gray-700 hover:text-gray-900 hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Dialog Fête */}
        <Dialog open={showPartyDialog} onOpenChange={setShowPartyDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingParty ? 'Modifier la Fête' : 'Nouvelle Fête'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="party-name">Nom *</Label>
                <Input
                  id="party-name"
                  value={partyForm.name}
                  onChange={(e) => setPartyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Noël, Halloween, Anniversaire..."
                />
              </div>
              
              <div>
                <Label htmlFor="party-description">Description</Label>
                <Textarea
                  id="party-description"
                  value={partyForm.description || ''}
                  onChange={(e) => setPartyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la fête..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="party-duration">Durée (jours)</Label>
                  <Input
                    id="party-duration"
                    type="number"
                    min="1"
                    value={partyForm.duration_days ?? 1}
                    onChange={(e) => setPartyForm(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="party-active"
                    checked={partyForm.is_active ?? true}
                    onChange={(e) => setPartyForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="party-active">Actif</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPartyDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={editingParty ? handleUpdateParty : handleCreateParty}
                  disabled={loading || !partyForm.name.trim()}
                  className="bg-gray-900 from-gray-900 to-gray-800 hover:bg-gray-800 text-white shadow-md"
                >
                  {loading ? 'Enregistrement...' : (editingParty ? 'Mettre à jour' : 'Créer')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Thème */}
        <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTheme ? 'Modifier le Thème' : 'Nouveau Thème'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme-party">Fête *</Label>
                <select
                  id="theme-party"
                  value={themeForm.party_id ?? ''}
                  onChange={(e) => setThemeForm(prev => ({ ...prev, party_id: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner une fête</option>
                  {parties.map(party => (
                    <option key={party.id} value={party.id}>
                      {party.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="theme-name">Nom *</Label>
                <Input
                  id="theme-name"
                  value={themeForm.name}
                  onChange={(e) => setThemeForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Noël Classique, Halloween Sombre..."
                />
              </div>
              
              <div>
                <Label htmlFor="theme-description">Description</Label>
                <Textarea
                  id="theme-description"
                  value={themeForm.description || ''}
                  onChange={(e) => setThemeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du thème..."
                  rows={3}
                />
              </div>

              {/* Upload d'image */}
              <div>
                <Label htmlFor="theme-image">Image du thème</Label>
                <div className="space-y-3">
                  {/* Aperçu de l'image */}
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Aperçu du thème"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setThemeForm(prev => ({ ...prev, image_url: null }));
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Zone d'upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="theme-image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="theme-image" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        {uploadingImage ? (
                          <>
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600">Upload en cours...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {imagePreview ? 'Changer l\'image' : 'Cliquez pour ajouter une image'}
                            </span>
                            <span className="text-xs text-gray-500">PNG, JPG, WEBP (max 5MB)</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="theme-bg">Couleur de fond</Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme-bg"
                      type="color"
                      value={themeForm.background_color ?? '#ffffff'}
                      onChange={(e) => setThemeForm(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={themeForm.background_color ?? '#ffffff'}
                      onChange={(e) => setThemeForm(prev => ({ ...prev, background_color: e.target.value }))}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="theme-text">Couleur de texte</Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme-text"
                      type="color"
                      value={themeForm.text_color ?? '#000000'}
                      onChange={(e) => setThemeForm(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={themeForm.text_color ?? '#000000'}
                      onChange={(e) => setThemeForm(prev => ({ ...prev, text_color: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="theme-accent">Couleur d'accent</Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme-accent"
                      type="color"
                      value={themeForm.accent_color ?? '#3b82f6'}
                      onChange={(e) => setThemeForm(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={themeForm.accent_color ?? '#3b82f6'}
                      onChange={(e) => setThemeForm(prev => ({ ...prev, accent_color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="theme-premium"
                    checked={themeForm.is_premium ?? false}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, is_premium: e.target.checked }))}
                  />
                  <Label htmlFor="theme-premium">Thème Premium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="theme-active"
                    checked={themeForm.is_active ?? true}
                    onChange={(e) => setThemeForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="theme-active">Actif</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowThemeDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={editingTheme ? handleUpdateTheme : handleCreateTheme}
                  disabled={loading || !themeForm.name.trim() || !themeForm.party_id}
                  className="bg-gray-900 from-gray-900 to-gray-800 hover:bg-gray-800 text-white shadow-md"
                >
                  {loading ? 'Enregistrement...' : (editingTheme ? 'Mettre à jour' : 'Créer')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ThemesManagement;
