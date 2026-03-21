import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  X, 
  ImagePlus, 
  Upload,
  AlertCircle,
  CheckCircle,
  Briefcase,
  MessageSquare,
  Award,
  Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalReviewFormProps, ProfessionalReviewFormData } from '@/types/reviews';

const ProfessionalReviewForm: React.FC<ProfessionalReviewFormProps> = ({
  professionalId,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ProfessionalReviewFormData>({
    rating: 0,
    title: '',
    comment: '',
    images: [],
    reviewer_name: user?.user_metadata?.full_name || '',
    reviewer_email: user?.email || '',
    review_type: 'general',
    service_category: '',
    is_verified_contact: false
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

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return <Briefcase className="w-4 h-4" />;
      case 'communication': return <MessageSquare className="w-4 h-4" />;
      case 'professionalism': return <Award className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getReviewTypeDescription = (type: string) => {
    switch (type) {
      case 'service': return 'Qualité du service rendu';
      case 'communication': return 'Facilité de communication';
      case 'professionalism': return 'Professionnalisme général';
      default: return 'Avis général sur l\'expérience';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header avec design épuré */}
      <div className="text-center mb-4 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
          <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Donnez votre avis</h2>
        <p className="text-sm sm:text-base text-gray-600">Partagez votre expérience avec ce professionnel</p>
      </div>

      {/* Formulaire avec design moderne */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Note avec design amélioré */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-base sm:text-lg font-semibold text-gray-900">Votre note globale *</Label>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <div className="flex gap-1 sm:gap-2">
                {renderStars()}
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {hoveredRating || formData.rating || 0}
                </div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {getRatingText(hoveredRating || formData.rating)}
                </span>
              </div>
            </div>
            {errors.rating && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.rating}
              </div>
            )}
          </div>

          {/* Type d'avis avec design amélioré */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-base sm:text-lg font-semibold text-gray-900">Type d'avis</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {[
                { value: 'general', label: 'Général', icon: Star },
                { value: 'service', label: 'Service', icon: Briefcase },
                { value: 'communication', label: 'Communication', icon: MessageSquare },
                { value: 'professionalism', label: 'Professionnel', icon: Award }
              ].map(({ value, label, icon: Icon }) => (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, review_type: value as any }))}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    formData.review_type === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      formData.review_type === value ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <span className="text-sm font-medium block">{label}</span>
                      <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-1">
                        {getReviewTypeDescription(value)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Catégorie de service */}
          <div className="space-y-3">
            <Label htmlFor="service_category" className="text-base font-medium text-gray-900">Catégorie de service (optionnel)</Label>
            <Input
              id="service_category"
              value={formData.service_category}
              onChange={(e) => setFormData(prev => ({ ...prev, service_category: e.target.value }))}
              placeholder="Ex: Développement web, Design, Conseil..."
              className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Contact vérifié */}
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
            <Switch
              id="verified_contact"
              checked={formData.is_verified_contact}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified_contact: checked }))}
              className="mt-0.5 sm:mt-0"
            />
            <Label htmlFor="verified_contact" className="flex items-center gap-2 text-green-700 text-sm sm:text-base cursor-pointer">
              <Handshake className="w-4 h-4 flex-shrink-0" />
              <span>J'ai eu un contact direct avec ce professionnel</span>
            </Label>
          </div>

          {/* Titre */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-medium text-gray-900">Titre de votre avis</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Résumez votre expérience en quelques mots..."
              maxLength={100}
              className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              {formData.title.length}/100 caractères
            </p>
          </div>

          {/* Commentaire */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-base font-medium text-gray-900">Votre commentaire *</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Partagez votre expérience détaillée avec ce professionnel..."
              rows={4}
              maxLength={1000}
              className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {formData.comment.length}/1000 caractères
              </p>
              {errors.comment && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors.comment}
                </div>
              )}
            </div>
          </div>

          {/* Images avec design amélioré */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-base font-medium text-gray-900">Photos (optionnel)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {formData.images.length < 5 && (
                <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <Label htmlFor="reviewer_name" className="text-base font-medium text-gray-900">Votre nom *</Label>
              <Input
                id="reviewer_name"
                value={formData.reviewer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewer_name: e.target.value }))}
                placeholder="Votre nom"
                className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.reviewer_name && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reviewer_name}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="reviewer_email" className="text-base font-medium text-gray-900">Votre email *</Label>
              <Input
                id="reviewer_email"
                type="email"
                value={formData.reviewer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewer_email: e.target.value }))}
                placeholder="votre@email.com"
                className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.reviewer_email && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reviewer_email}
                </div>
              )}
            </div>
          </div>

          {/* Actions avec design amélioré */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Upload className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Publier l'avis
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalReviewForm; 