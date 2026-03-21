import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CoverImageUploaderProps {
  cardId: string;
  existingImage?: string | null;
  onImageUploaded: (imageUrl: string) => void;
}

export function CoverImageUploader({ cardId, existingImage, onImageUploaded }: CoverImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingImage 
      ? supabase.storage.from("card-covers").getPublicUrl(existingImage).data.publicUrl 
      : null
  );
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

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
      // Créer un nom de fichier unique avec le préfixe card-covers/
      const fileExt = file.name.split('.').pop();
      const fileName = `card-covers/${cardId}-${Date.now()}.${fileExt}`;

      // Uploader sur Supabase
      const { data, error } = await supabase
        .storage
        .from("card-covers")
        .upload(fileName, file);

      if (error) throw error;

      // Get the complete public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from("card-covers")
        .getPublicUrl(fileName);

      // Mettre à jour la carte avec l'URL complète de l'image
      const { error: updateError } = await supabase
        .from("business_cards")
        .update({ 
          cover_image_url: publicUrl 
        } as any)
        .eq("id", cardId);

      if (updateError) throw updateError;

      // Notifier le composant parent avec l'URL complète
      onImageUploaded(publicUrl);
    } catch (error) {
      // Error log removed
      alert("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl && (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Aperçu" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => {
              if (previewUrl && !previewUrl.includes("supabase")) {
                URL.revokeObjectURL(previewUrl);
              }
              setPreviewUrl(null);
              setFile(null);
            }}
          >
            Supprimer
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => document.getElementById(`image-input-${cardId}`).click()}
        >
          {previewUrl ? "Changer d'image" : "Choisir une image"}
        </Button>

        {file && (
          <Button 
            onClick={handleUpload}
            disabled={uploading}
            className="w-full text-white bg-blue-800 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-opacity duration-300 hover:bg-blue-600 hover:text-black"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Téléchargement...
              </>
            ) : "Enregistrer"}
          </Button>
        )}

        <input
          id={`image-input-${cardId}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
} 