/**
 * Utilitaires pour générer et gérer les URLs des cartes de visite
 * Supporte les slugs (ex: /card/john-doe) avec fallback sur UUID
 */

/**
 * Génère un slug à partir d'un nom
 * @param name - Le nom à convertir en slug
 * @returns Le slug généré
 */
export function generateSlugFromName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    // Remplacer les caractères accentués
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remplacer les espaces et caractères spéciaux par des tirets
    .replace(/[^a-z0-9]+/g, '-')
    // Supprimer les tirets en début et fin
    .replace(/^-+|-+$/g, '')
    // Limiter à 100 caractères
    .slice(0, 100);
}

/**
 * Génère l'URL publique d'une carte de visite
 * Utilise le slug si disponible, sinon l'UUID
 * @param cardId - L'UUID de la carte
 * @param slug - Le slug de la carte (optionnel)
 * @param baseUrl - L'URL de base (par défaut: window.location.origin)
 * @returns L'URL complète de la carte
 */
export function generateCardUrl(
  cardId: string, 
  slug?: string | null,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  if (slug) {
    return `${baseUrl}/card/${slug}`;
  }
  return `${baseUrl}/card/${cardId}`;
}

/**
 * Obtient l'identifiant à utiliser dans l'URL
 * Préfère le slug s'il existe, sinon l'UUID
 * @param cardId - L'UUID de la carte
 * @param slug - Le slug de la carte (optionnel)
 * @returns L'identifiant à utiliser dans l'URL
 */
export function getCardUrlIdentifier(
  cardId: string,
  slug?: string | null
): string {
  return slug || cardId;
}



