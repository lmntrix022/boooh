import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import { motion } from 'framer-motion';

/**
 * Props pour le composant Pagination
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/**
 * Composant de pagination réutilisable avec design Apple
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6"
    >
      {/* Informations de pagination */}
      <div className="text-sm font-medium text-gray-600">
        Affichage{' '}
        <span className="font-bold text-gray-900">{startItem}</span>
        {' '} à{' '}
        <span className="font-bold text-gray-900">{endItem}</span>
        {' '} sur{' '}
        <span className="font-bold text-gray-900">{totalItems}</span>
        {' '} éléments
      </div>

      {/* Sélecteur de taille de page */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Éléments par page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(parseInt(e.target.value));
              onPageChange(1);
            }}
            className="px-3 py-2 text-sm border-2 border-gray-200/60 rounded-xl bg-white/90 backdrop-blur-xl text-gray-900 font-medium hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900/50 transition-all shadow-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      {/* Contrôles de pagination */}
      <div className="flex items-center gap-2">
        {/* Première page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Première page"
        >
          <ChevronsLeft className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Page précédente */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Page précédente"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Numéros de page */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-gray-400 font-medium">…</span>
              ) : (
                <Button
                  variant={page === currentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={`h-9 w-9 p-0 text-sm font-bold rounded-xl transition-all duration-200 ${
                    page === currentPage
                      ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100/80'
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Page suivante */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Page suivante"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Dernière page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Dernière page"
        >
          <ChevronsRight className="h-4 w-4 text-gray-600" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Pagination;
