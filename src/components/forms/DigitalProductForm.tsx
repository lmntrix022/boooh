import React, { useState } from 'react';
import { Upload, FileText, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DigitalProductFormProps {
  cardId: string;
  onSuccess: () => void;
  onCancel: () => void;
  productToEdit?: {
    id: string;
    title?: string;
    description?: string | null;
    price?: number | null;
    is_available?: boolean;
    thumbnail_url?: string | null;
    type?: string;
    is_free?: boolean;
  };
}

const DigitalProductForm: React.FC<DigitalProductFormProps> = ({
  cardId,
  onSuccess,
  onCancel,
  productToEdit
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [title, setTitle] = useState(productToEdit?.title || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
  const [isFree, setIsFree] = useState(productToEdit?.is_free ?? false);
  const [type, setType] = useState<string>(productToEdit?.type || 'ebook_pdf');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(productToEdit?.thumbnail_url || null);
  const [productFile, setProductFile] = useState<File | null>(null);

  const productTypes = [
    { value: 'music_album', label: 'Album Musical' },
    { value: 'music_track', label: 'Morceau Musical' },
    { value: 'ebook_pdf', label: 'E-book (PDF)' },
    { value: 'ebook_epub', label: 'E-book (EPUB)' },
    { value: 'course_video', label: 'Cours Vidéo' },
    { value: 'course_audio', label: 'Cours Audio' },
    { value: 'course_pdf', label: 'Cours (PDF)' },
    { value: 'formation_pack', label: 'Pack Formation' },
  ];

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner une image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La miniature ne doit pas dépasser 2 MB.',
        variant: 'destructive',
      });
      return;
    }

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'Le fichier ne doit pas dépasser 100 MB.',
        variant: 'destructive',
      });
      return;
    }

    setProductFile(file);
    toast({
      title: 'Fichier sélectionné',
      description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    });
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrl;
    } catch (error: any) {
      // Error log removed
      toast({
        title: 'Erreur d\'upload',
        description: `Impossible d'uploader le fichier: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre est requis',
        variant: 'destructive',
      });
      return;
    }

    // En mode édition, le fichier n'est pas requis
    if (!productToEdit && !productFile) {
      toast({
        title: 'Erreur',
        description: 'Le fichier produit est requis',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let thumbnailUrl = null;
      let fileUrl = null;

      // Upload de la miniature si présente
      if (thumbnailFile) {
        setUploadingThumbnail(true);
        const thumbExt = thumbnailFile.name.split('.').pop();
        const thumbPath = `digital-products/${cardId}/thumbnails/${Date.now()}.${thumbExt}`;
        thumbnailUrl = await uploadFile(thumbnailFile, 'digital-products', thumbPath);
        setUploadingThumbnail(false);
      }

      // Upload du fichier produit (seulement si nouveau fichier)
      if (productFile) {
        setUploadingFile(true);
        const fileExt = productFile.name.split('.').pop();
        const filePath = `digital-products/${cardId}/files/${Date.now()}.${fileExt}`;
        fileUrl = await uploadFile(productFile, 'digital-products', filePath);
        setUploadingFile(false);
      }

      if (productToEdit) {
        // Mode édition
        const updateData: any = {
          title: title.trim(),
          description: description.trim() || null,
          type,
          price: isFree ? 0 : (price ? parseFloat(price) : 0),
          is_free: isFree,
        };

        // Ajouter les uploads s'il y en a
        if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;
        if (fileUrl) updateData.file_url = fileUrl;

        const { error } = await supabase
          .from('digital_products')
          .update(updateData)
          .eq('id', productToEdit.id);

        if (error) throw error;

        toast({
          title: 'Produit numérique mis à jour',
          description: 'Le produit a été modifié avec succès.',
        });
      } else {
        // Mode création
        if (!fileUrl) {
          throw new Error('Échec de l\'upload du fichier produit');
        }

        const { error } = await supabase
          .from('digital_products')
          .insert({
            card_id: cardId,
            title: title.trim(),
            description: description.trim() || null,
            type,
            price: isFree ? 0 : (price ? parseFloat(price) : 0),
            is_free: isFree,
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            file_size: productFile.size,
            format: productFile.name.split('.').pop(),
            status: 'published',
          });

        if (error) throw error;

        toast({
          title: 'Produit numérique créé',
          description: 'Le produit a été ajouté avec succès.',
        });
      }

      onSuccess();
    } catch (error: any) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: `Impossible de traiter le produit: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadingThumbnail(false);
      setUploadingFile(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
          Titre <span className="text-gray-700">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Guide complet du marketing digital"
          required
          className="h-11 rounded-lg border-gray-200"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre produit numérique..."
          rows={3}
          className="rounded-lg border-gray-200"
        />
      </div>

      {/* Type de produit */}
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium text-gray-700">
          Type de produit <span className="text-gray-700">*</span>
        </Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11 rounded-lg border-gray-200 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {productTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value} className="bg-white hover:bg-gray-100">
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prix */}
      <div className="space-y-2">
        <Label htmlFor="price" className="text-sm font-medium text-gray-700">
          Prix (FCFA)
        </Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ex: 5000"
          disabled={isFree}
          className="h-11 rounded-lg border-gray-200"
        />
        <div className="flex items-center space-x-3 pt-2">
          <Switch
            id="is-free"
            checked={isFree}
            onCheckedChange={setIsFree}
          />
          <Label htmlFor="is-free" className="text-sm font-medium text-gray-700 cursor-pointer">
            Produit gratuit
          </Label>
        </div>
      </div>

      {/* Miniature */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Image de couverture
        </Label>
        {thumbnailPreview && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 border border-gray-200/50 mb-3">
            <img
              src={thumbnailPreview}
              alt="Aperçu miniature"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <label
          htmlFor="thumbnail-upload"
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-700">
            {thumbnailFile ? thumbnailFile.name : 'Choisir une image'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            PNG, JPG (max 2 MB)
          </span>
          <Input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Fichier produit */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Fichier du produit <span className="text-gray-700">*</span>
        </Label>
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-gray-900/50 transition-colors"
        >
          <FileText className="w-8 h-8 text-gray-900 mb-2" />
          <span className="text-sm font-medium text-gray-700">
            {productFile ? productFile.name : 'Choisir le fichier'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            PDF, MP3, MP4, ZIP, etc. (max 100 MB)
          </span>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-11 rounded-lg"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-11 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadingThumbnail && 'Upload miniature...'}
              {uploadingFile && 'Upload fichier...'}
              {!uploadingThumbnail && !uploadingFile && (productToEdit ? 'Modification...' : 'Création...')}
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              {productToEdit ? 'Modifier le produit' : 'Créer le produit'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default DigitalProductForm;
