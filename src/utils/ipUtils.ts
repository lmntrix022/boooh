/**
 * Utilitaires pour la gestion des adresses IP
 */

/**
 * Obtient l'adresse IP de l'utilisateur
 * En développement local, retourne 127.0.0.1
 * En production, essaie d'obtenir l'IP réelle via un service externe
 */
export const getUserIP = async (): Promise<string> => {
  // En développement local, retourner l'IP locale
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '127.0.0.1';
  }

  try {
    // Essayer d'obtenir l'IP via un service externe
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '127.0.0.1';
  } catch (error) {
    // Warning log removed
    return '127.0.0.1';
  }
};

/**
 * Valide qu'une chaîne est une adresse IP valide
 */
export const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

/**
 * Obtient une adresse IP valide pour l'enregistrement des vues
 * Retourne toujours une IP valide, même si l'IP réelle n'est pas disponible
 */
export const getValidIPForRecording = async (): Promise<string> => {
  try {
    const ip = await getUserIP();
    return isValidIP(ip) ? ip : '127.0.0.1';
  } catch (error) {
    // Warning log removed
    return '127.0.0.1';
  }
};
