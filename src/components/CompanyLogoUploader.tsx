import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CompanyLogoUploaderProps {
  cardId?: string;
  existingLogo?: string | null;
  onLogoUploaded: (logoUrl: string) => void;
  className?: string;
}

export function CompanyLogoUploader({ cardId, existingLogo, onLogoUploaded, className }: CompanyLogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingLogo 
      ? existingLogo.startsWith("http") 
        ? existingLogo 
        : supabase.storage.from("avatars").getPublicUrl(existingLogo).data.publicUrl 
      : null
  );
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier la taille du fichier (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. Taille maximum : 5MB");
      return;
    }

    setFile(selectedFile);
    
    // Libérer l'URL précédente si elle existe
    if (previewUrl && !previewUrl.includes("supabase")) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // Log removed
      
      // Créer un nom de fichier unique avec préfixe logo
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/logo-${cardId || 'temp'}-${Date.now()}.${fileExt}`;
      
      // Log removed

      // Uploader sur Supabase
      const { data, error } = await supabase
        .storage
        .from("avatars")
        .upload(fileName, file);

      if (error) {
        // Error log removed
        throw error;
      }

      // Log removed

      // Get the complete public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Log removed

      // Si on a un cardId, mettre à jour la carte
      if (cardId) {
        // Log removed
        const { error: updateError } = await supabase
          .from("business_cards")
          .update({ 
            company_logo_url: publicUrl 
          } as any)
          .eq("id", cardId);

        if (updateError) {
          // Error log removed
          throw updateError;
        }
        
        // Log removed
      }

      // Notifier le composant parent avec l'URL complète
      // Log removed
      onLogoUploaded(publicUrl);
    } catch (error) {
      // Error log removed
      alert("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Aperçu du logo */}
        <div className="relative">
          {previewUrl ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-200 bg-gray-50 flex items-center justify-center shadow-lg">
              <img
                src={previewUrl}
                alt="Logo de l'entreprise"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 border-2 border-blue-200 shadow-lg flex items-center justify-center">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          )}
          
          {/* Bouton de suppression */}
          {previewUrl && (
            <Button
              variant="destructive"
              size="sm"
              type="button"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (previewUrl && !previewUrl.includes("supabase")) {
                  URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);
                setFile(null);
              }}
            >
              ×
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              document.getElementById(`company-logo-input-${cardId || 'temp'}`).click();
            }}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {previewUrl ? "Changer" : "Ajouter un logo"}
          </Button>

          {file && (
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUpload();
              }}
              disabled={uploading}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload...
                </>
              ) : "Enregistrer"}
            </Button>
          )}
        </div>
      </div>

      <input
        id={`company-logo-input-${cardId || 'temp'}`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-xs text-gray-500">
        Format recommandé : JPG, PNG. Taille maximum : 5MB
      </p>
    </div>
  );
} 