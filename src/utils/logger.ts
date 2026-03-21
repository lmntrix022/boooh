/**
 * Logger conditionnel - Affiche les logs uniquement en développement
 * Supprime automatiquement les logs en production pour améliorer les performances
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log d'information (développement uniquement)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log d'erreur (toujours affiché)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log d'avertissement (développement uniquement)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log de debug (développement uniquement)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log avec groupe (développement uniquement)
   */
  group: (label: string) => {
    if (isDev) {
      console.group(label);
    }
  },

  /**
   * Fermer le groupe (développement uniquement)
   */
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },

  /**
   * Log de table (développement uniquement)
   */
  table: (data: any) => {
    if (isDev) {
      console.table(data);
    }
  }
};


