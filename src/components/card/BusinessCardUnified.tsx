/**
 * Composant BusinessCard unifié - Version canonique
 *
 * Ce composant remplace:
 * - /components/BusinessCard.tsx (version basique)
 * - /components/BusinessCardModern.tsx (version complète)
 * - /components/cards/BusinessCard.tsx (version avec plan guards)
 *
 * Pour le moment, il réexporte BusinessCardModern qui est la version la plus complète.
 * TODO: Refactoriser BusinessCardModern pour le simplifier et le rendre plus modulaire.
 */

export { default as BusinessCardUnified } from '../BusinessCardModern';
export { default } from '../BusinessCardModern';
