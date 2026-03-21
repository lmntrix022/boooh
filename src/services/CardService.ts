/**
 * CardService - Single source for card fetch (CardController / Flyover UI).
 * Accepts slug or UUID; uses optimized query with cache.
 */

import { optimizedQueries } from '@/lib/optimizedQueries';

export const CardService = {
  /**
   * Get card by slug or UUID (public view).
   * Used by CardController so the same fetch drives both the view and isOwner.
   */
  async getCardBySlug(identifier: string) {
    return optimizedQueries.getCardWithRelations(identifier, true);
  },
};
