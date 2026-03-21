import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductImage {
  url: string;
  alt: string;
  order: number;
  file?: File;
}

interface PhysicalProductFormProps {
  cardId: string;
  onSuccess: () => void;
  onCancel: () => void;
  productToEdit?: {
    id: string;
    name: string;
    description?: string | null;
    price: number | null;
    is_available: boolean;
    images?: Array<{ url: string; alt: string; order: number }>;
    image_url?: string | null;
  };
}

const PhysicalProductForm: React.FC<PhysicalProductFormProps> = ({
  cardId,
  onSuccess,
  onCancel,
  productToEdit
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
  const [isAvailable, setIsAvailable] = useState(productToEdit?.is_available ?? true);
  const [images, setImages] = useState<ProductImage[]>(
    productToEdit?.images?.map(img => ({ ...img, file: undefined })) || []
  );
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    productToEdit?.images?.map(img => img.url) || (productToEdit?.image_url ? [productToEdit.image_url] : [])
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Vérifier qu'on ne dépasse pas 4 images
    const totalImages = images.length + files.length;
    if (totalImages > 4) {
      toast({
        title: 'Limite dépassée',
        description: 'Vous ne pouvez ajouter que 4 images maximum par produit.',
        variant: 'destructive',
      });
      return;
    }

    // Valider chaque fichier
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Format invalide',
          description: `${file.name} n'est pas une image valide.`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse 5 MB.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    // Créer des aperçus et ajouter aux images
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setImagePreviews(prev => [...prev, preview]);
        setImages(prev => [
          ...prev,
          {
            url: '', // Sera rempli après l'upload
            alt: name || 'Image produit',
            order: prev.length,
            file: file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Réinitialiser l'input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Réordonner
      return newImages.map((img, i) => ({ ...img, order: i }));
    });
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${cardId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      // Error log removed
      toast({
        title: 'Erreur d\'upload',
        description: `Impossible d'uploader l'image: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Champ requis',
        description: 'Le nom du produit est requis.',
        variant: 'destructive',
      });
      return;
    }

    if (images.length === 0 && imagePreviews.length === 0) {
      toast({
        title: 'Image requise',
        description: 'Ajoutez au moins une image pour votre produit.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Upload les nouvelles images
      const uploadedImages: Array<{ url: string; alt: string; order: number }> = [];

      for (const img of images) {
        if (img.file) {
          const url = await uploadImage(img.file);
          if (url) {
            uploadedImages.push({
              url,
              alt: img.alt,
              order: img.order,
            });
          }
        } else if (img.url) {
          // Image existante (en mode édition)
          uploadedImages.push({
            url: img.url,
            alt: img.alt,
            order: img.order,
          });
        }
      }

      if (uploadedImages.length === 0) {
        throw new Error('Aucune image n\'a pu être uploadée');
      }

      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        is_available: isAvailable,
        images: uploadedImages,
        image_url: uploadedImages[0].url,
      };

      if (productToEdit) {
        // Mode édition
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productToEdit.id);

        if (error) throw error;

        toast({
          title: 'Produit modifié',
          description: 'Le produit a été mis à jour avec succès.',
        });
      } else {
        // Mode création
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            card_id: cardId,
          });

        if (error) throw error;

        toast({
          title: 'Produit créé',
          description: 'Le produit a été ajouté avec succès.',
        });
      }

      onSuccess();
    } catch (error: any) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: `Impossible de ${productToEdit ? 'modifier' : 'créer'} le produit: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nom du produit */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Nom du produit <span className="text-gray-700">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: T-shirt premium"
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
          placeholder="Décrivez votre produit..."
          rows={3}
          className="rounded-lg border-gray-200"
        />
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
          placeholder="Ex: 15000"
          className="h-11 rounded-lg border-gray-200"
        />
        <p className="text-xs text-gray-500">
          Laissez vide pour afficher "Prix sur demande"
        </p>
      </div>

      {/* Images (1-4) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Images du produit <span className="text-gray-700">*</span>
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Ajoutez entre 1 et 4 images (max 5 MB chacune)
        </p>

        {/* Aperçus des images */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200/50"
              >
                <img
                  src={preview}
                  alt={`Aperçu ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                  Image {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton d'ajout d'images */}
        {images.length < 4 && (
          <label
            htmlFor="images-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Ajouter {images.length === 0 ? 'des images' : 'une autre image'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              {images.length} / 4 images
            </span>
            <Input
              id="images-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Disponibilité */}
      <div className="flex items-center space-x-3 pt-2">
        <Switch
          id="is-available"
          checked={isAvailable}
          onCheckedChange={setIsAvailable}
        />
        <Label htmlFor="is-available" className="text-sm font-medium text-gray-700 cursor-pointer">
          Produit disponible
        </Label>
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
              {productToEdit ? 'Modification...' : 'Création...'}
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              {productToEdit ? 'Modifier le produit' : 'Créer le produit'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default PhysicalProductForm;
