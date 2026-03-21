import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Edit, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface BusinessCard {
  id: string;
  name: string;
  company?: string;
  user_id: string;
  created_at?: string;
  is_public?: boolean;
}

const BusinessCardManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'public' | 'private'>('all');
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  // Récupérer toutes les cartes de visite
  const { data: cards, isLoading } = useQuery<BusinessCard[]>({
    queryKey: ['admin-business-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_cards')
        .select('id, name, company, user_id, created_at, is_public');
      if (error) throw error;
      return data || [];
    }
  });

  // Filtrage
  const filteredCards = (cards || []).filter(card => {
    const matchesSearch = search === '' || card.name.toLowerCase().includes(search.toLowerCase()) || (card.company?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = status === 'all' || (status === 'public' ? card.is_public : !card.is_public);
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  // Suppression (optionnel)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_cards').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-cards'] });
      setCardToDelete(null);
    }
  });

  const confirmDelete = (id: string) => {
    setCardToDelete(id);
  };

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <Input
          placeholder="Rechercher une carte..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-80 rounded-lg bg-gray-900/60 border-blue-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
        />
        <div className="flex gap-2">
          <Button
            variant={status === 'all' ? 'default' : 'outline'}
            className="rounded-lg"
            onClick={() => setStatus('all')}
          >Toutes</Button>
          <Button
            variant={status === 'public' ? 'default' : 'outline'}
            className="rounded-lg"
            onClick={() => setStatus('public')}
          >Publiques</Button>
          <Button
            variant={status === 'private' ? 'default' : 'outline'}
            className="rounded-lg"
            onClick={() => setStatus('private')}
          >Privées</Button>
        </div>
      </div>
      {/* Tableau premium */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-2xl shadow-sm border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20 p-4 overflow-x-auto animate-fade-in-up">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
            <span className="ml-2 text-gray-900">Chargement des cartes...</span>
          </div>
        ) : (
          <Table className="min-w-[800px]">
            <TableHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl">
              <TableRow>
                <TableHead className="text-gray-900 font-bold text-sm">Carte</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm">Entreprise</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm">Propriétaire (ID)</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm">Date</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm">Statut</TableHead>
                <TableHead className="text-gray-900 font-bold text-sm text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCards.map(card => (
                <TableRow key={card.id} className="transition-all duration-200 group hover:scale-[1.015] hover:shadow-[0_0_0_6px_#a5b4fc55,0_8px_32px_rgba(80,200,180,0.10)] hover:bg-gray-900 hover:from-blue-50/60 hover:to-purple-50/40 cursor-pointer">
                  {/* Avatar/logo + nom */}
                  <TableCell className="flex items-center gap-3 font-semibold text-gray-900">
                    <div className="w-10 h-10 rounded-full bg-gray-100r from-blue-200 via-purple-200 to-emerald-100 flex items-center justify-center text-lg font-bold text-white shadow-md">
                      {card.name ? card.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="truncate max-w-[120px]">{card.name}</span>
                  </TableCell>
                  <TableCell className="text-gray-700">{card.company || '-'}</TableCell>
                  <TableCell><Badge variant="secondary">{card.user_id.slice(0, 8)}...</Badge></TableCell>
                  <TableCell>{card.created_at ? new Date(card.created_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow transition-all duration-200 animate-pulse ${card.is_public ? 'bg-gray-900 from-gray-900 to-gray-800 text-white' : 'bg-gray-900 text-gray-900'}`}>
                      {card.is_public ? 'Publique' : 'Privée'}
                    </span>
                  </TableCell>
                  <TableCell className="flex gap-2 justify-center items-center">
                    {/* Voir */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-blue-200/60 transition-all duration-200 flex items-center justify-center" title="Voir la carte" onClick={() => navigate(`/cards/${card.id}/view`)}>
                      <Eye className="h-4 w-4 text-gray-900" />
                    </Button>
                    {/* Éditer */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-purple-200/60 transition-all duration-200 flex items-center justify-center" title="Éditer" onClick={() => navigate(`/cards/${card.id}/edit`)}>
                      <Edit className="h-4 w-4 text-gray-900" />
                    </Button>
                    {/* Copier l'ID */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-emerald-200/60 transition-all duration-200 flex items-center justify-center" title="Copier l'ID" onClick={() => navigator.clipboard.writeText(card.id)}>
                      <Copy className="h-4 w-4 text-emerald-500" />
                    </Button>
                    {/* Supprimer */}
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-full bg-white/80 shadow-md hover:scale-110 hover:shadow-red-200/60 transition-all duration-200 flex items-center justify-center" title="Supprimer" onClick={() => confirmDelete(card.id)} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-gray-700" /> : <Trash2 className="h-4 w-4 text-gray-700" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {filteredCards.length > itemsPerPage && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/60 shadow-xl p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredCards.length)} sur {filteredCards.length} cartes
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>

              {/* Numéros de page */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else {
                    if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        open={!!cardToDelete}
        onOpenChange={(open) => !open && setCardToDelete(null)}
        title="Supprimer la carte de visite"
        description="Êtes-vous sûr de vouloir supprimer cette carte de visite ? Cette action est irréversible et supprimera également tous les avis, produits et rendez-vous associés."
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        onConfirm={() => cardToDelete && deleteMutation.mutate(cardToDelete)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

export default BusinessCardManagement; 