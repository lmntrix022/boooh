import { useEffect, useRef, useCallback, useMemo } from 'react';

interface AutoSaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelay?: number;
  onConflict?: (localData: any, serverData: any) => any;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export const useAutoSave = (
  data: any,
  saveFunction: (data: any) => Promise<any>,
  options: AutoSaveOptions = {}
) => {
  // Log removed
  const {
    debounceMs = 2000,
    maxRetries = 3,
    retryDelay = 1000,
    onConflict,
    onError,
    onSuccess
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const isSavingRef = useRef(false);

  // Fonction de sauvegarde avec retry et gestion de conflits
  const saveWithRetry = useCallback(async (dataToSave: any) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    retryCountRef.current = 0;

    const attemptSave = async (): Promise<any> => {
      try {
        const result = await saveFunction(dataToSave);
        lastSavedDataRef.current = JSON.parse(JSON.stringify(dataToSave));
        retryCountRef.current = 0;
        onSuccess?.(result);
        return result;
      } catch (error: any) {
        retryCountRef.current++;

        // Gestion des conflits de version
        if (error.code === 'CONFLICT' && onConflict) {
          const resolvedData = onConflict(dataToSave, error.serverData);
          if (resolvedData) {
            return await saveFunction(resolvedData);
          }
        }

        // Retry automatique pour les erreurs réseau
        if (retryCountRef.current < maxRetries && 
            (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT')) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
          return await attemptSave();
        }

        // Échec définitif
        onError?.(error);
        throw error;
      } finally {
        isSavingRef.current = false;
      }
    };

    return await attemptSave();
  }, [saveFunction, maxRetries, retryDelay, onConflict, onError, onSuccess]);

  // Stabilize data to prevent infinite re-renders
  const dataString = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return null;
    return JSON.stringify(data);
  }, [data ? JSON.stringify(data) : null]);

  // Auto-sauvegarde avec debounce
  useEffect(() => {
    if (!dataString) return;

    // Vérifier si les données ont réellement changé
    const hasChanged = dataString !== JSON.stringify(lastSavedDataRef.current);
    if (!hasChanged) return;

    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer la nouvelle sauvegarde
    timeoutRef.current = setTimeout(() => {
      const dataToSave = JSON.parse(dataString);
      saveWithRetry(dataToSave);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dataString, debounceMs, saveWithRetry]);

  // Fonction pour forcer la sauvegarde immédiate
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return await saveWithRetry(data);
  }, [data, saveWithRetry]);

  // Fonction pour récupérer les données non sauvegardées
  const getUnsavedChanges = useCallback(() => {
    if (!lastSavedDataRef.current) return data;
    
    const unsavedChanges: any = {};
    let hasChanges = false;

    Object.keys(data).forEach(key => {
      if (JSON.stringify(data[key]) !== JSON.stringify(lastSavedDataRef.current[key])) {
        unsavedChanges[key] = data[key];
        hasChanges = true;
      }
    });

    return hasChanges ? unsavedChanges : null;
  }, [data]);

  return {
    forceSave,
    getUnsavedChanges,
    isSaving: isSavingRef.current,
    lastSavedData: lastSavedDataRef.current
  };
};
