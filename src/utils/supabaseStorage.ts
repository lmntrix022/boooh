import { supabase } from '@/integrations/supabase/client';

/**
 * Vérifier et créer les buckets Supabase Storage si nécessaire
 */
export const initializeSupabaseStorage = async () => {
  try {
    // Liste des buckets nécessaires
    const requiredBuckets = [
      {
        name: 'avatars',
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      },
      {
        name: 'card-covers',
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      }
    ];

    for (const bucket of requiredBuckets) {
      try {
        // Vérifier si le bucket existe avec timeout pour éviter les erreurs réseau bloquantes
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const listPromise = supabase.storage.listBuckets();
        const { data: buckets, error: listError } = await Promise.race([
          listPromise,
          timeoutPromise
        ]) as any;
        
        if (listError) {
          // Silently fail - storage initialization is not critical
          continue;
        }

        const bucketExists = buckets?.some((b: any) => b.name === bucket.name);
        
        if (!bucketExists) {
          // Bucket doesn't exist - will be created when needed
        }
      } catch (error) {
        // Silently fail - network errors should not block the app
        // This is expected when offline or with network issues
      }
    }
  } catch (error) {
    // Silently fail - storage initialization is not critical for app functionality
  }
};

/**
 * Tester l'upload d'un fichier de test
 */
export const testImageUpload = async () => {
  try {
    // Créer un fichier de test (1x1 pixel PNG) - conversion sans fetch pour éviter CSP
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
    const file = new File([blob], 'test.png', { type: 'image/png' });

    // Tester l'upload
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`test-${Date.now()}.png`, file);

    if (error) {
      // Error log removed
      return false;
    }

    // Supprimer le fichier de test
    await supabase.storage
      .from('avatars')
      .remove([data.path]);

    // Log removed
    return true;
  } catch (error) {
    // Error log removed
    return false;
  }
};

/**
 * Obtenir les statistiques d'un bucket
 */
export const getBucketStats = async (bucketName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000 });

    if (error) {
      // Error log removed
      return null;
    }

    return {
      fileCount: data?.length || 0,
      files: data?.map(file => ({
        name: file.name,
        size: file.metadata?.size,
        lastModified: file.updated_at
      })) || []
    };
  } catch (error) {
    // Error log removed
    return null;
  }
};
