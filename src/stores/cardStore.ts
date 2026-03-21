import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CardStore {
  selectedCardId: string | null;
  setSelectedCardId: (cardId: string | null) => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set) => ({
      selectedCardId: null,
      setSelectedCardId: (cardId) => set({ selectedCardId: cardId }),
    }),
    {
      name: 'booh-selected-card',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
