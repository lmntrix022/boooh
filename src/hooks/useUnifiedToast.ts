/**
 * Hook unifié pour les notifications toast
 * Utilise shadcn/ui toast en interne avec des helpers pour les cas d'usage courants
 */
import { useToast as useBaseToast } from "./use-toast";

export const useUnifiedToast = () => {
  const { toast: baseToast, ...rest } = useBaseToast();

  // Wrapper pour standardiser l'interface
  const toast = {
    // Méthodes de base avec styles prédéfinis
    success: (title: string, description?: string) => {
      baseToast({
        title,
        description,
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },

    error: (title: string, description?: string) => {
      baseToast({
        title,
        description,
        variant: "destructive",
      });
    },

    warning: (title: string, description?: string) => {
      baseToast({
        title,
        description,
        className: "bg-yellow-50 border-yellow-200 text-yellow-900",
      });
    },

    info: (title: string, description?: string) => {
      baseToast({
        title,
        description,
        variant: "default",
      });
    },

    // Messages prédéfinis pour les actions courantes
    cardCreated: () => {
      toast.success(
        "Carte créée avec succès",
        "Votre carte de visite a été créée et est maintenant disponible"
      );
    },

    cardUpdated: () => {
      toast.success(
        "Carte mise à jour",
        "Vos modifications ont été enregistrées avec succès"
      );
    },

    cardDeleted: () => {
      toast.success(
        "Carte supprimée",
        "La carte a été supprimée définitivement"
      );
    },

    imageUploaded: () => {
      toast.success(
        "Image téléchargée",
        "L'image a été mise à jour avec succès"
      );
    },

    settingsSaved: () => {
      toast.success(
        "Paramètres sauvegardés",
        "Vos préférences ont été enregistrées"
      );
    },

    profileUpdated: () => {
      toast.success(
        "Profil mis à jour",
        "Vos informations personnelles ont été modifiées"
      );
    },

    networkError: () => {
      toast.error(
        "Erreur de connexion",
        "Vérifiez votre connexion internet et réessayez"
      );
    },

    validationError: (field?: string) => {
      toast.error(
        "Erreur de validation",
        field ? `Veuillez vérifier le champ "${field}"` : "Veuillez vérifier les informations saisies"
      );
    },

    permissionError: () => {
      toast.error(
        "Accès refusé",
        "Vous n'avez pas les permissions nécessaires pour cette action"
      );
    },

    loading: (action: string) => {
      toast.info(
        "Chargement en cours",
        `${action} en cours, veuillez patienter...`
      );
    },

    copied: (item: string = "Texte") => {
      toast.success(
        "Copié !",
        `${item} a été copié dans le presse-papiers`
      );
    },

    unsavedChanges: () => {
      toast.warning(
        "Modifications non sauvegardées",
        "Vous avez des modifications non sauvegardées"
      );
    },

    lowStorage: () => {
      toast.warning(
        "Espace de stockage faible",
        "Votre espace de stockage est presque plein"
      );
    },

    // Accès direct au toast de base pour les cas personnalisés
    custom: baseToast,
  };

  return {
    ...toast,
    ...rest,
  };
};

// Alias pour rétrocompatibilité
export const useToast = useUnifiedToast;
export const usePremiumToast = useUnifiedToast;
