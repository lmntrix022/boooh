import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Loader2, Upload, X, Palette, Image, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";

interface ThemeOption {
  id: string;
  name: string;
  color: string;
  previewClass: string;
}

const presetThemes: ThemeOption[] = [
  { id: "purple", name: "Purple", color: "#E5DEFF", previewClass: "bg-[#E5DEFF]" },
  { id: "blue", name: "Blue", color: "#D3E4FD", previewClass: "bg-[#D3E4FD]" },
  { id: "black", name: "Black", color: "#1a1a1a", previewClass: "bg-[#1a1a1a]" },
  { id: "green", name: "Green", color: "#F2FCE2", previewClass: "bg-[#F2FCE2]" },
  { id: "yellow", name: "Yellow", color: "#FEF7CD", previewClass: "bg-[#FEF7CD]" },
  { id: "orange", name: "Orange", color: "#FDE1D3", previewClass: "bg-[#FDE1D3]" },
];

const Themes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState("#E5DEFF");
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("preset");
  const [initialLoading, setInitialLoading] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("business_cards")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        setCardData(data);
        if (data.theme && data.theme !== "default") {
          // Check if it's a preset theme
          const isPreset = presetThemes.some(theme => theme.id === data.theme);
          
          if (isPreset) {
            setSelectedTheme(data.theme);
            setActiveTab("preset");
          } else {
            setCustomColor(data.theme);
            setActiveTab("custom");
          }
        } else {
          setSelectedTheme("purple"); // Default theme
        }
      } catch (error) {
        // Error log removed
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de la carte",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCard();
  }, [id, toast]);

  // Preview de l'image sélectionnée
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(coverFile);
  }, [coverFile]);

  // Drag & drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCoverFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };
  
  const removeCover = () => setCoverFile(null);

  // Upload sur Supabase Storage
  const uploadCoverImage = async () => {
    if (!coverFile || !id) return null;
    setUploading(true);
    const fileExt = coverFile.name.split('.').pop();
    const fileName = `cover_${id}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('card-covers').upload(fileName, coverFile, { upsert: true });
    setUploading(false);
    if (error) {
      toast({ title: "Erreur upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from('card-covers').getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
  };

  const saveTheme = async () => {
    if (!id) return;
    setLoading(true);
    try {
      let coverUrl = cardData?.cover_image_url;
      if (coverFile) {
        const uploaded = await uploadCoverImage();
        if (uploaded) coverUrl = uploaded;
      }
      const themeValue = activeTab === "preset" && selectedTheme 
        ? selectedTheme 
        : customColor;
      const { error } = await supabase
        .from("business_cards")
        .update({ theme: themeValue, cover_image_url: coverUrl })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Succès", description: "Thème mis à jour avec succès !" });
      navigate(`/cards/${id}/view`);
    } catch (error) {
      // Error log removed
      toast({ title: "Erreur", description: "Impossible de mettre à jour le thème", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-0 px-0 relative overflow-x-hidden">
      {/* Orbes animés en arrière-plan */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              width: 80 + Math.random() * 120,
              height: 80 + Math.random() * 120,
              background: `rgba(139,92,246,${0.07 + Math.random() * 0.08})`,
              filter: 'blur(24px)'
            }}
            animate={{ y: [0, 30, 0], opacity: [0.7, 0.4, 0.7] }}
            transition={{ duration: 12 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 6, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="container max-w-4xl py-6 px-4 md:px-6">
        {/* Bouton retour sticky */}
        

        {/* Header premium */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <h1 className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg mb-2">
            <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
              <Palette className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
            </span>
            Personnaliser le thème
          </h1>
          <motion.p
            className="text-lg text-gray-700/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Choisissez un style unique et ajoutez une image de couverture pour une carte vraiment premium
          </motion.p>
        </motion.div>

        {/* Carte principale premium */}
        <Card className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative bg-white/80 backdrop-blur-xl">
          {/* Orbe décoratif animé */}
          <motion.div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[40vw] h-[20vw] max-w-lg rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-40 animate-pulse-slow z-0"
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Shimmer effet brillance */}
          <div className="absolute inset-0 shimmer rounded-3xl pointer-events-none z-0" />
          
          <CardContent className="p-6 md:p-8 relative z-10">
            {/* Preview premium */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold mb-4 gradient-text-3d">Aperçu de la carte</h2>
              <div className="w-full max-w-md mx-auto">
                <Card className="rounded-3xl shadow-2xl bg-white/90 border-2 border-gradient-to-r from-blue-400 to-purple-400 overflow-hidden hover:shadow-3xl transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="relative h-56 md:h-72 w-full flex items-center justify-center bg-gray-100">
                      {/* Orbe animé derrière l'image */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-xl opacity-60"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* Preview image de couverture */}
                      {(coverPreview || cardData?.cover_image_url) ? (
                        <img
                          src={coverPreview || cardData?.cover_image_url}
                          alt="Aperçu de la couverture"
                          className="absolute inset-0 w-full h-full object-cover rounded-3xl z-10"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 z-10">
                          <Image className="h-12 w-12 mb-2" />
                          <p className="text-sm">Aucune image de couverture</p>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-6 py-2 shadow-lg text-blue-700 font-bold text-lg z-20">
                        Aperçu de la carte
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Zone d'upload premium */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <h2 className="text-xl font-semibold mb-4 gradient-text-3d">Image de couverture</h2>
              <div
                className="w-full max-w-md mx-auto p-6 rounded-2xl border-2 border-dashed border-gradient-to-r from-blue-400 to-purple-400 bg-white/80 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-blue-50 transition-all relative group"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                {/* Orbe animé en fond */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                
                <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-blue-700 font-semibold text-center">
                  Glissez-déposez une image ou <span className="underline">cliquez pour choisir</span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  tabIndex={0}
                  aria-label="Choisir une image de couverture"
                />
                
                {coverPreview && (
                  <motion.div 
                    className="relative w-full flex flex-col items-center mt-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img src={coverPreview} alt="Aperçu" className="w-full h-40 object-cover rounded-xl shadow-lg" />
                    <button 
                      onClick={removeCover} 
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-red-100 hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
                      aria-label="Supprimer l'image"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </motion.div>
                )}
                
                {uploading && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-sm text-blue-600">Upload en cours...</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tabs premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <h2 className="text-xl font-semibold mb-4 gradient-text-3d">Couleur du thème</h2>
              <Tabs 
                value={activeTab} 
                className="w-full"
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6 glass-card border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg">
                  <TabsTrigger 
                    value="preset" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300"
                  >
                    Thèmes prédéfinis
                  </TabsTrigger>
                  <TabsTrigger 
                    value="custom" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300"
                  >
                    Couleur personnalisée
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="preset" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {presetThemes.map((theme) => (
                      <motion.div
                        key={theme.id}
                        className={`relative rounded-xl p-4 cursor-pointer transition-all duration-300 glass-card border-2 ${
                          selectedTheme === theme.id
                            ? "border-gradient-to-r from-blue-400 to-purple-400 shadow-xl scale-105"
                            : "border-gray-200 hover:border-purple-300 hover:shadow-lg hover:scale-105"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleThemeSelect(theme.id)}
                        tabIndex={0}
                        aria-label={`Sélectionner le thème ${theme.name}`}
                      >
                        <div
                          className={`w-full h-24 rounded-lg mb-2 ${theme.previewClass} shadow-inner`}
                        ></div>
                        <p className="text-center font-medium gradient-text-3d">{theme.name}</p>
                        {selectedTheme === theme.id && (
                          <motion.div 
                            className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full p-1 shadow-lg"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="h-4 w-4" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="colorPicker" className="font-semibold gradient-text-3d">Choisir une couleur personnalisée</Label>
                    <div className="relative">
                      <input
                        id="colorPicker"
                        type="color"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        className="w-full h-12 cursor-pointer rounded-xl border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300"
                      />
                    </div>
                    <div
                      className="w-full h-32 rounded-xl mt-4 border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg"
                      style={{ backgroundColor: customColor }}
                    ></div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Bouton d'action premium */}
            <motion.div
              className="mt-8 pt-6 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              <PremiumButton
                onClick={saveTheme}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:ring-4 hover:text-white focus:ring-blue-400/30 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Enregistrer le thème
                  </>
                )}
              </PremiumButton>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Themes;
