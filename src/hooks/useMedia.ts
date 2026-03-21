import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/services/mediaService';
import { MediaContent, MediaFormData, UseMediaOptions, UseMediaResult } from '@/types/media';
import { useToast } from '@/hooks/use-toast';

export const useMedia = ({ cardId, enabled = true, refetchInterval }: UseMediaOptions): UseMediaResult => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query pour récupérer les médias
  const {
    data: media = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['media', cardId],
    queryFn: () => mediaService.getMediaByCardId(cardId),
    enabled: enabled && !!cardId,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour créer un média
  const createMediaMutation = useMutation({
    mutationFn: (mediaData: MediaFormData) => mediaService.createMedia(mediaData, cardId),
    onSuccess: (newMedia) => {
      queryClient.setQueryData(['media', cardId], (old: MediaContent[] = []) => [...old, newMedia]);
      toast({
        title: "Média ajouté",
        description: "Votre média a été ajouté avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout du média",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour un média
  const updateMediaMutation = useMutation({
    mutationFn: ({ id, mediaData }: { id: string; mediaData: Partial<MediaFormData> }) =>
      mediaService.updateMedia(id, mediaData),
    onSuccess: (updatedMedia) => {
      queryClient.setQueryData(['media', cardId], (old: MediaContent[] = []) =>
        old.map(media => media.id === updatedMedia.id ? updatedMedia : media)
      );
      toast({
        title: "Média mis à jour",
        description: "Votre média a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du média",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer un média
  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => mediaService.deleteMedia(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['media', cardId], (old: MediaContent[] = []) =>
        old.filter(media => media.id !== deletedId)
      );
      toast({
        title: "Média supprimé",
        description: "Votre média a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression du média",
        variant: "destructive",
      });
    },
  });

  // Mutation pour réorganiser les médias
  const reorderMediaMutation = useMutation({
    mutationFn: (mediaIds: string[]) => mediaService.reorderMedia(cardId, mediaIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', cardId] });
      toast({
        title: "Ordre mis à jour",
        description: "L'ordre de vos médias a été mis à jour.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la réorganisation des médias",
        variant: "destructive",
      });
    },
  });

  // Fonctions exposées
  const createMedia = async (mediaData: MediaFormData): Promise<MediaContent> => {
    return createMediaMutation.mutateAsync(mediaData);
  };

  const updateMedia = async (id: string, mediaData: Partial<MediaFormData>): Promise<MediaContent> => {
    return updateMediaMutation.mutateAsync({ id, mediaData });
  };

  const deleteMedia = async (id: string): Promise<void> => {
    return deleteMediaMutation.mutateAsync(id);
  };

  const reorderMedia = async (mediaIds: string[]): Promise<void> => {
    return reorderMediaMutation.mutateAsync(mediaIds);
  };

  return {
    media,
    isLoading: isLoading || createMediaMutation.isPending || updateMediaMutation.isPending || deleteMediaMutation.isPending,
    error: error as Error | null,
    refetch,
    createMedia,
    updateMedia,
    deleteMedia,
    reorderMedia,
  };
};

// Hook pour valider une URL de média
export const useMediaValidation = () => {
  const validateUrl = async (url: string, type: string) => {
    try {
      return await mediaService.validateMediaUrl(url, type as any);
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erreur lors de la validation'],
        warnings: []
      };
    }
  };

  const detectType = (url: string) => {
    return mediaService.detectMediaType(url);
  };

  const getUrlInfo = async (url: string) => {
    try {
      return await mediaService.getMediaUrlInfo(url);
    } catch (error) {
      return null;
    }
  };

  return {
    validateUrl,
    detectType,
    getUrlInfo,
  };
};

// Hook pour les statistiques des médias
export const useMediaStats = (cardId: string) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['media-stats', cardId],
    queryFn: () => mediaService.getMediaStats(cardId),
    enabled: !!cardId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    stats,
    isLoading,
    error: error as Error | null,
  };
};
