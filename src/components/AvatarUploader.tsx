import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Camera } from "lucide-react";

interface AvatarUploaderProps {
  cardId?: string;
  existingAvatar?: string | null;
  onAvatarUploaded: (avatarUrl: string) => void;
  className?: string;
}

export function AvatarUploader({ cardId, existingAvatar, onAvatarUploaded, className }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingAvatar 
      ? supabase.storage.from("avatars").getPublicUrl(existingAvatar).data.publicUrl 
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
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${cardId || 'temp'}-${Date.now()}.${fileExt}`;

      // Uploader sur Supabase
      const { data, error } = await supabase
        .storage
        .from("avatars")
        .upload(fileName, file);

      if (error) throw error;

      // Get the complete public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Si on a un cardId, mettre à jour la carte
      if (cardId) {
        const { error: updateError } = await supabase
          .from("business_cards")
          .update({ 
            avatar_url: publicUrl 
          } as any)
          .eq("id", cardId);

        if (updateError) throw updateError;
      }

      // Notifier le composant parent avec l'URL complète
      onAvatarUploaded(publicUrl);
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
        {/* Aperçu de l'avatar */}
        <div className="relative">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Avatar" 
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 border-2 border-blue-200 shadow-lg flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          )}
          
          {/* Bouton de suppression */}
          {previewUrl && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={() => {
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
            onClick={() => document.getElementById(`avatar-input-${cardId || 'temp'}`).click()}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {previewUrl ? "Changer" : "Ajouter une photo"}
          </Button>

          {file && (
            <Button 
              onClick={handleUpload}
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
        id={`avatar-input-${cardId || 'temp'}`}
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