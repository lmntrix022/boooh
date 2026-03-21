import { useState } from 'react';

interface UseConfirmDeleteOptions {
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const useConfirmDelete = (options: UseConfirmDeleteOptions) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    onConfirm,
    title = 'Confirmer la suppression',
    description = 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
    confirmText = 'Supprimer',
    cancelText = 'Annuler',
    variant = 'danger'
  } = options;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      // Error log removed
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirm = () => setIsOpen(true);
  const closeConfirm = () => setIsOpen(false);

  return {
    isOpen,
    isLoading,
    openConfirm,
    closeConfirm,
    handleConfirm,
    title,
    description,
    confirmText,
    cancelText,
    variant
  };
}; 