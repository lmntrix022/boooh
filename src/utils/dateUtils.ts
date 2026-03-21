import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date en français sans le mot "environ"
 * @param date - La date à formater
 * @returns La date formatée (ex: "il y a 5 heures" au lieu de "il y a environ 5 heures")
 */
export const formatDateWithoutApproximate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatted = formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: fr,
    includeSeconds: false
  });
  
  // Supprimer le mot "environ" du texte français
  return formatted.replace('environ ', '');
};

/**
 * Formate une date pour les reviews avec un format personnalisé
 * @param date - La date à formater
 * @returns La date formatée pour les reviews
 */
export const formatReviewDate = (date: Date | string): string => {
  return formatDateWithoutApproximate(date);
}; 