import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ServiceQuote, QuoteStatus } from '@/services/portfolioService';
import { formatAmount } from '@/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, Phone, Briefcase, DollarSign, Calendar, Eye, Download, Trash2, MoreVertical, MessageSquare, FileText } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

interface QuotesKanbanViewProps {
  quotes: ServiceQuote[];
  onStatusChange: (quoteId: string, newStatus: QuoteStatus) => void;
  onQuoteClick: (quote: ServiceQuote) => void;
  onRespond?: (quote: ServiceQuote) => void;
  onGeneratePDF?: (quote: ServiceQuote) => void;
  onDelete?: (quoteId: string) => void;
}

interface KanbanColumn {
  id: QuoteStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const columns: KanbanColumn[] = [
  {
    id: 'new',
    label: 'Nouveaux',
    color: 'text-gray-700',
    bgColor: 'from-gray-100 to-gray-200',
    icon: MessageSquare,
  },
  {
    id: 'in_progress',
    label: 'En cours',
    color: 'text-gray-700',
    bgColor: 'from-gray-100 to-gray-200',
    icon: FileText,
  },
  {
    id: 'quoted',
    label: 'Devis Envoyés',
    color: 'text-gray-700',
    bgColor: 'from-gray-100 to-gray-200',
    icon: Mail,
  },
  {
    id: 'accepted',
    label: 'Acceptés',
    color: 'text-gray-700',
    bgColor: 'from-gray-100 to-gray-200',
    icon: DollarSign,
  },
  {
    id: 'refused',
    label: 'Refusés',
    color: 'text-red-700',
    bgColor: 'from-red-100 to-red-200',
    icon: Trash2,
  },
];

// Composant pour une demande de devis draggable
interface DraggableQuoteCardProps {
  quote: ServiceQuote;
  onQuoteClick: (quote: ServiceQuote) => void;
  onRespond?: (quote: ServiceQuote) => void;
  onGeneratePDF?: (quote: ServiceQuote) => void;
  onDelete?: (quoteId: string) => void;
  index: number;
}

const DraggableQuoteCard: React.FC<DraggableQuoteCardProps> = ({
  quote,
  onQuoteClick,
  onRespond,
  onGeneratePDF,
  onDelete,
  index,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: quote.id,
    data: {
      quote,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      {...attributes}
      {...listeners}
    >
      <Card
        className="bg-white/60 backdrop-blur-md border border-gray-200/50 hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing group"
        onClick={() => onQuoteClick(quote)}
      >
        <CardContent className="p-4">
          {/* Header avec client et menu */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm truncate">
                {quote.client_name}
              </p>
              {quote.client_company && (
                <p className="text-xs text-gray-500 mt-1 truncate flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {quote.client_company}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-200 shadow-md">
                <DropdownMenuItem onClick={() => onQuoteClick(quote)} className="cursor-pointer text-xs">
                  <Eye className="w-3 h-3 mr-2" />
                  Voir / Modifier
                </DropdownMenuItem>
                {onRespond && (
                  <DropdownMenuItem onClick={() => onRespond(quote)} className="cursor-pointer text-gray-900 hover:bg-gray-100 text-xs">
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Répondre
                  </DropdownMenuItem>
                )}
                {onGeneratePDF && quote.quote_amount && quote.quote_amount > 0 && (
                  <DropdownMenuItem onClick={() => onGeneratePDF(quote)} className="cursor-pointer text-xs">
                    <Download className="w-3 h-3 mr-2" />
                    Générer PDF
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(quote.id)}
                    className="text-red-600 hover:bg-red-50 cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Service demandé */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 line-clamp-2">
              {quote.service_requested}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Mail className="w-3 h-3" />
              <span className="truncate">{quote.client_email}</span>
            </div>
            {quote.client_phone && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                <span>{quote.client_phone}</span>
              </div>
            )}
          </div>

          {/* Montant */}
          {quote.quote_amount && quote.quote_amount > 0 && (
            <div className="bg-gray-100 p-2 rounded-lg mb-2">
              <p className="text-xs text-gray-600">Montant proposé</p>
              <p className="font-bold text-gray-900 text-lg">
                {formatAmount(quote.quote_amount)}
              </p>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{new Date(quote.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant pour une colonne droppable
interface DroppableColumnProps {
  column: KanbanColumn;
  quotes: ServiceQuote[];
  onQuoteClick: (quote: ServiceQuote) => void;
  onRespond?: (quote: ServiceQuote) => void;
  onGeneratePDF?: (quote: ServiceQuote) => void;
  onDelete?: (quoteId: string) => void;
  columnIndex: number;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  quotes,
  onQuoteClick,
  onRespond,
  onGeneratePDF,
  onDelete,
  columnIndex,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      status: column.id,
    },
  });

  const Icon = column.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: columnIndex * 0.1 }}
      className="flex flex-col h-full"
    >
      {/* Column Header */}
      <div className={`bg-gradient-to-r ${column.bgColor} p-4 rounded-t-2xl border-2 border-white/50 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${column.color}`} />
            <h3 className={`font-bold text-sm ${column.color}`}>{column.label}</h3>
          </div>
          <Badge variant="secondary" className="text-xs font-bold">
            {quotes.length}
          </Badge>
        </div>
        {quotes.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            {quotes.filter(q => q.quote_amount && q.quote_amount > 0).length} avec montant
          </p>
        )}
      </div>

      {/* Column Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 bg-gray-50 p-3 rounded-b-2xl border border-t-0 border-gray-200/50 shadow-sm space-y-3 min-h-[300px] max-h-[600px] overflow-y-auto transition-colors ${
          isOver ? 'bg-gray-100 border-gray-300' : ''
        }`}
      >
        {quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Aucune demande</p>
          </div>
        ) : (
          quotes.map((quote, index) => (
            <DraggableQuoteCard
              key={quote.id}
              quote={quote}
              index={index}
              onQuoteClick={onQuoteClick}
              onRespond={onRespond}
              onGeneratePDF={onGeneratePDF}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

export const QuotesKanbanView: React.FC<QuotesKanbanViewProps> = ({
  quotes,
  onStatusChange,
  onQuoteClick,
  onRespond,
  onGeneratePDF,
  onDelete,
}) => {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);

  // Configuration des sensors pour le drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Nécessite un mouvement de 8px avant de commencer le drag
      },
    })
  );

  // Grouper les demandes par statut
  const quotesByStatus = useMemo(() => {
    const grouped: Record<QuoteStatus, ServiceQuote[]> = {
      new: [],
      in_progress: [],
      quoted: [],
      accepted: [],
      refused: [],
      closed: [],
    };

    quotes.forEach((quote) => {
      grouped[quote.status].push(quote);
    });

    return grouped;
  }, [quotes]);

  // Trouver la demande en cours de drag
  const activeQuote = useMemo(() => {
    if (!activeId) return null;
    return quotes.find((quote) => quote.id === activeId);
  }, [activeId, quotes]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const quoteId = active.id as string;
    const newStatus = over.id as QuoteStatus;

    // Trouver la demande
    const quote = quotes.find((q) => q.id === quoteId);

    if (quote && quote.status !== newStatus) {
      onStatusChange(quoteId, newStatus);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {columns.map((column, columnIndex) => (
            <DroppableColumn
              key={column.id}
              column={column}
              quotes={quotesByStatus[column.id]}
              onQuoteClick={onQuoteClick}
              onRespond={onRespond}
              onGeneratePDF={onGeneratePDF}
              onDelete={onDelete}
              columnIndex={columnIndex}
            />
          ))}
        </div>
      </div>

      {/* DragOverlay pour afficher l'élément en cours de drag */}
      <DragOverlay>
        {activeQuote ? (
          <Card className="bg-white/60 backdrop-blur-md border border-gray-300 shadow-xl opacity-90 rotate-3">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {activeQuote.client_name}
                  </p>
                  {activeQuote.client_company && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {activeQuote.client_company}
                    </p>
                  )}
                </div>
              </div>
              {activeQuote.quote_amount && activeQuote.quote_amount > 0 && (
                <div className="bg-gray-100 p-2 rounded-lg">
                  <p className="text-xs text-gray-600">Montant proposé</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {activeQuote.quote_amount.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
