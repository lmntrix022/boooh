import { Tables } from '@/integrations/supabase/types';

// Types de base pour les médias
export type MediaType = 'youtube' | 'tiktok' | 'vimeo' | 'soundcloud' | 'spotify' | 'audio_file' | 'video_file';

// Type principal pour le contenu média
export type MediaContent = Tables<'media_content'>;

// Types pour les métadonnées spécifiques par plateforme
export interface YouTubeMetadata {
  video_id: string;
  channel_id?: string;
  channel_name?: string;
  published_at?: string;
  view_count?: number;
  like_count?: number;
}

export interface TikTokMetadata {
  video_id: string;
  username?: string;
  user_id?: string;
  created_at?: string;
  view_count?: number;
  like_count?: number;
}

export interface VimeoMetadata {
  video_id: string;
  user_id?: string;
  user_name?: string;
  duration?: number;
  view_count?: number;
  like_count?: number;
}

export interface SoundCloudMetadata {
  track_id: string;
  user_id?: string;
  username?: string;
  duration?: number;
  play_count?: number;
  like_count?: number;
}

export interface SpotifyMetadata {
  track_id: string;
  artist_id?: string;
  artist_name?: string;
  album_id?: string;
  album_name?: string;
  duration?: number;
  popularity?: number;
}

export interface AudioFileMetadata {
  file_size?: number;
  file_type?: string;
  bitrate?: number;
  sample_rate?: number;
  channels?: number;
}

export interface VideoFileMetadata {
  file_size?: number;
  file_type?: string;
  resolution?: string;
  bitrate?: number;
  fps?: number;
  codec?: string;
}

// Union type pour toutes les métadonnées
export type MediaMetadata = 
  | YouTubeMetadata 
  | TikTokMetadata 
  | VimeoMetadata 
  | SoundCloudMetadata 
  | SpotifyMetadata 
  | AudioFileMetadata 
  | VideoFileMetadata;

// Interface étendue pour MediaContent avec métadonnées typées
export interface TypedMediaContent extends Omit<MediaContent, 'metadata'> {
  metadata: MediaMetadata;
}

// Types pour les formulaires
export interface MediaFormData {
  id?: string;
  card_id?: string;
  type: MediaType;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  duration?: number;
  order_index?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

// Types pour la validation
export interface MediaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  extractedData?: {
    video_id?: string;
    thumbnail_url?: string;
    duration?: number;
    title?: string;
    description?: string;
  };
}

// Types pour les composants
export interface MediaPlayerProps {
  media: MediaContent;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export interface MediaSectionProps {
  cardId: string;
  mediaItems: MediaContent[];
  isEditable?: boolean;
  onMediaUpdate?: (media: MediaContent) => void;
  onMediaDelete?: (mediaId: string) => void;
  onMediaReorder?: (mediaIds: string[]) => void;
}

// Types pour les services
export interface MediaService {
  getMediaByCardId: (cardId: string) => Promise<MediaContent[]>;
  createMedia: (media: MediaFormData, cardId: string) => Promise<MediaContent>;
  updateMedia: (id: string, media: Partial<MediaFormData>) => Promise<MediaContent>;
  deleteMedia: (id: string) => Promise<void>;
  reorderMedia: (cardId: string, mediaIds: string[]) => Promise<void>;
  validateMediaUrl: (url: string, type: MediaType) => Promise<MediaValidationResult>;
}

// Types pour les hooks
export interface UseMediaOptions {
  cardId: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseMediaResult {
  media: MediaContent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createMedia: (media: MediaFormData) => Promise<MediaContent>;
  updateMedia: (id: string, media: Partial<MediaFormData>) => Promise<MediaContent>;
  deleteMedia: (id: string) => Promise<void>;
  reorderMedia: (mediaIds: string[]) => Promise<void>;
}

// Types pour les utilitaires
export interface MediaUrlInfo {
  type: MediaType;
  id: string;
  isValid: boolean;
  thumbnail_url?: string;
  title?: string;
  duration?: number;
}

// Types pour les constantes
export const MEDIA_TYPES: Record<MediaType, { label: string; icon: string; color: string }> = {
  youtube: { label: 'YouTube', icon: '🎥', color: '#FF0000' },
  tiktok: { label: 'TikTok', icon: '🎵', color: '#000000' },
  vimeo: { label: 'Vimeo', icon: '🎬', color: '#1AB7EA' },
  soundcloud: { label: 'SoundCloud', icon: '🎧', color: '#FF5500' },
  spotify: { label: 'Spotify', icon: '🎵', color: '#1DB954' },
  audio_file: { label: 'Fichier Audio', icon: '🎵', color: '#8B5CF6' },
  video_file: { label: 'Fichier Vidéo', icon: '🎥', color: '#3B82F6' }
};

// Types pour les regex de validation
export const MEDIA_URL_PATTERNS: Record<MediaType, RegExp> = {
  youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
  tiktok: /(?:tiktok\.com\/@[\w.-]+\/video\/|vm\.tiktok\.com\/)(\d+)/,
  vimeo: /(?:vimeo\.com\/)(\d+)/,
  soundcloud: /(?:soundcloud\.com\/[\w.-]+\/[\w.-]+)/,
  spotify: /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:track|album|playlist)\/)([a-zA-Z0-9]+)/,
  audio_file: /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i,
  video_file: /\.(mp4|avi|mov|wmv|flv|webm|mkv)(\?.*)?$/i
};
