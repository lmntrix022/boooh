import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  X, 
  ImagePlus, 
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewFormProps, ReviewFormData } from '@/types/reviews';

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onSubmit,
  onCancel,
  isSubmitting,
  disabled = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: '',
    comment: '',
    images: [],
    reviewer_name: user?.user_metadata?.full_name || '',
    reviewer_email: user?.email || ''
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Veuillez donner une note';
    }

    if (!formData.reviewer_name.trim()) {
      newErrors.reviewer_name = 'Le nom est requis';
    }

    if (!formData.reviewer_email.trim()) {
      newErrors.reviewer_email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.reviewer_email)) {
      newErrors.reviewer_email = 'Email invalide';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Le commentaire est requis';
    } else if (formData.comment.length < 10) {
      newErrors.comment = 'Le commentaire doit contenir au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) {
      toast({
        title: "Reviews temporairement indisponibles",
        description: "Les avis pour les produits digitaux seront bientôt disponibles.",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateForm()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez corriger les erreurs avant de soumettre.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error log removed
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + formData.images.length > 5) {
      toast({
        title: "Trop d'images",
        description: "Vous ne pouvez pas ajouter plus de 5 images.",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Fichier trop volumineux",
          description: "Chaque image doit faire moins de 5MB.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));

    // Créer les prévisualisations
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoveredRating || formData.rating);
      const isHalf = !isFilled && i === Math.ceil(formData.rating) && formData.rating % 1 !== 0;
      
      stars.push(
        <motion.button
          key={i}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setFormData(prev => ({ ...prev, rating: i }))}
          className="focus:outline-none"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              isFilled 
                ? 'fill-yellow-400 text-yellow-400' 
                : isHalf
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          />
        </motion.button>
      );
    }
    return stars;
  };

  const getRatingText = (rating: number) => {
    const texts = {
      1: 'Très décevant',
      2: 'Décevant',
      3: 'Moyen',
      4: 'Bien',
      5: 'Excellent'
    };
    return texts[rating as keyof typeof texts] || 'Sélectionnez une note';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Donnez votre avis
        </CardTitle>
      </CardHeader>

      <CardContent>
        {disabled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Star className="w-5 h-5" />
              <span className="font-medium">Reviews temporairement indisponibles</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Les avis pour les produits digitaux seront bientôt disponibles. Merci de votre compréhension.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Note */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Votre note *</Label>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {renderStars()}
              </div>
              <span className="text-sm text-gray-600">
                {getRatingText(hoveredRating || formData.rating)}
              </span>
            </div>
            {errors.rating && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{errors.rating}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de votre avis</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Résumez votre expérience en quelques mots..."
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              {formData.title.length}/100 caractères
            </p>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="comment">Votre commentaire *</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Partagez votre expérience détaillée avec ce produit..."
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {formData.comment.length}/1000 caractères
              </p>
              {errors.comment && (
                <Alert variant="destructive" className="py-1 px-2 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <AlertDescription>{errors.comment}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <Label>Photos (optionnel)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {formData.images.length < 5 && (
                <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Ajouter</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Maximum 5 images, 5MB chacune
            </p>
          </div>

          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reviewer_name">Votre nom *</Label>
              <Input
                id="reviewer_name"
                value={formData.reviewer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewer_name: e.target.value }))}
                placeholder="Votre nom"
              />
              {errors.reviewer_name && (
                <Alert variant="destructive" className="py-1 px-2 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <AlertDescription>{errors.reviewer_name}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer_email">Votre email *</Label>
              <Input
                id="reviewer_email"
                type="email"
                value={formData.reviewer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewer_email: e.target.value }))}
                placeholder="votre@email.com"
              />
              {errors.reviewer_email && (
                <Alert variant="destructive" className="py-1 px-2 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <AlertDescription>{errors.reviewer_email}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publier l'avis
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm; 