import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatAmount } from '@/utils/format';
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Eye,
  Download,
  Trash2,
  Banknote,
  MoreVertical,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/services/invoiceService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
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

interface InvoiceKanbanViewProps {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onGeneratePdf: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
  onStatusChange?: (invoiceId: string, newStatus: InvoiceStatus) => void;
  onPreview?: (invoice: Invoice) => void;
}

interface KanbanColumn {
  id: InvoiceStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const getColumns = (t: any): KanbanColumn[] => [
  {
    id: 'draft',
    label: t('invoice.status.draft'),
    color: 'text-gray-700',
    bgColor: 'gray-600',
    icon: FileText,
  },
  {
    id: 'sent',
    label: t('invoice.status.sent'),
    color: 'text-gray-600',
    bgColor: 'gray-600',
    icon: Send,
  },
  {
    id: 'paid',
    label: t('invoice.status.paid'),
    color: 'text-gray-600',
    bgColor: 'gray-600',
    icon: CheckCircle,
  },
  {
    id: 'overdue',
    label: t('invoice.status.overdue'),
    color: 'text-gray-600',
    bgColor: 'gray-600',
    icon: AlertCircle,
  },
  {
    id: 'cancelled',
    label: t('invoice.status.cancelled'),
    color: 'text-red-700',
    bgColor: 'gray-600',
    icon: XCircle,
  },
];

// Composant pour une facture draggable
interface DraggableInvoiceCardProps {
  invoice: Invoice;
  onSelect: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onGeneratePdf: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
  onPreview?: (invoice: Invoice) => void;
  index: number;
}

const DraggableInvoiceCard: React.FC<DraggableInvoiceCardProps> = ({
  invoice,
  onSelect,
  onDelete,
  onGeneratePdf,
  onSend,
  onMarkAsPaid,
  onPreview,
  index,
}) => {
  const { t, currentLanguage } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: invoice.id,
    data: {
      invoice,
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
        className="bg-white border border-gray-200 hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing group"
        onClick={() => onSelect(invoice)}
      >
        <CardContent className="p-4">
          {/* Header avec numéro et menu */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-light text-gray-900 text-sm truncate">
                {invoice.invoice_number}
              </p>
              <p className="text-xs text-gray-700 mt-1 truncate">
                {invoice.client_name}
              </p>
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
                {onPreview && (
                  <DropdownMenuItem onClick={() => onPreview(invoice)} className="cursor-pointer text-gray-900 hover:bg-indigo-50 text-xs">
                    <Eye className="w-3 h-3 mr-2" />
                    {t('invoice.list.actions.preview')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onSelect(invoice)} className="cursor-pointer text-xs">
                  <Eye className="w-3 h-3 mr-2" />
                  {t('invoice.list.actions.viewEdit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGeneratePdf(invoice)} className="cursor-pointer text-xs">
                  <Download className="w-3 h-3 mr-2" />
                  {t('invoice.list.actions.generatePDF')}
                </DropdownMenuItem>
                {invoice.status !== 'paid' && (
                  <>
                    <DropdownMenuItem onClick={() => onSend(invoice)} className="cursor-pointer text-xs">
                      <Send className="w-3 h-3 mr-2" />
                      {t('invoice.list.actions.send')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onMarkAsPaid(invoice)}
                      className="text-gray-900 hover:bg-green-50 cursor-pointer text-xs"
                    >
                      <Banknote className="w-3 h-3 mr-2" />
                      {t('invoice.kanban.markAsPaid')}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(invoice.id)}
                  className="text-gray-900 hover:bg-red-50 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  {t('invoice.list.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Dates */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1 text-xs text-gray-900">
              <Calendar className="w-3 h-3" />
              <span>{t('invoice.kanban.issued')}: {format(new Date(invoice.issue_date), 'dd/MM/yy', { locale: currentLanguage === 'fr' ? fr : enUS })}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-900">
              <Calendar className="w-3 h-3" />
              <span>{t('invoice.kanban.dueDate')}: {format(new Date(invoice.due_date), 'dd/MM/yy', { locale: currentLanguage === 'fr' ? fr : enUS })}</span>
            </div>
          </div>

          {/* Montant */}
          <div className="bg-white border border-gray-200 p-2 rounded-lg">
            <p className="text-xs text-gray-600">{t('invoice.kanban.amountTTC')}</p>
            <p className="font-light text-gray-900 text-lg">
              {formatAmount(invoice.total_ttc)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant pour une colonne droppable
interface DroppableColumnProps {
  column: KanbanColumn;
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onGeneratePdf: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
  onPreview?: (invoice: Invoice) => void;
  columnIndex: number;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  invoices,
  onSelect,
  onDelete,
  onGeneratePdf,
  onSend,
  onMarkAsPaid,
  onPreview,
  columnIndex,
}) => {
  const { t } = useLanguage();
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
      <div className="bg-white p-4 rounded-t-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${column.color}`} />
            <h3 className={`font-light text-sm ${column.color}`}>{column.label}</h3>
          </div>
          <Badge variant="secondary" className="text-xs font-light">
            {invoices.length}
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {invoices.reduce((sum, inv) => sum + inv.total_ttc, 0).toLocaleString('fr-FR')} FCFA
        </p>
      </div>

      {/* Column Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 bg-white p-3 rounded-b-lg border border-gray-200 shadow-sm space-y-3 min-h-[300px] max-h-[600px] overflow-y-auto transition-colors ${
          isOver ? 'bg-gray-50 border-gray-300' : ''
        }`}
      >
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-xs">{t('invoice.kanban.empty')}</p>
          </div>
        ) : (
          invoices.map((invoice, index) => (
            <DraggableInvoiceCard
              key={invoice.id}
              invoice={invoice}
              index={index}
              onSelect={onSelect}
              onDelete={onDelete}
              onGeneratePdf={onGeneratePdf}
              onSend={onSend}
              onMarkAsPaid={onMarkAsPaid}
              onPreview={onPreview}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

export const InvoiceKanbanView: React.FC<InvoiceKanbanViewProps> = ({
  invoices,
  onSelect,
  onDelete,
  onGeneratePdf,
  onSend,
  onMarkAsPaid,
  onStatusChange,
  onPreview,
}) => {
  const { t } = useLanguage();
  const columns = getColumns(t);
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);

  // Configuration des sensors pour le drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Nécessite un mouvement de 8px avant de commencer le drag
      },
    })
  );

  // Grouper les factures par statut
  const invoicesByStatus = useMemo(() => {
    const grouped: Record<InvoiceStatus, Invoice[]> = {
      draft: [],
      sent: [],
      paid: [],
      overdue: [],
      cancelled: [],
    };

    invoices.forEach((invoice) => {
      grouped[invoice.status].push(invoice);
    });

    return grouped;
  }, [invoices]);

  // Trouver la facture en cours de drag
  const activeInvoice = useMemo(() => {
    if (!activeId) return null;
    return invoices.find((inv) => inv.id === activeId);
  }, [activeId, invoices]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const invoiceId = active.id as string;
    const newStatus = over.id as InvoiceStatus;

    // Trouver la facture
    const invoice = invoices.find((inv) => inv.id === invoiceId);

    if (invoice && invoice.status !== newStatus && onStatusChange) {
      onStatusChange(invoiceId, newStatus);
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
              invoices={invoicesByStatus[column.id]}
              onSelect={onSelect}
              onDelete={onDelete}
              onGeneratePdf={onGeneratePdf}
              onSend={onSend}
              onMarkAsPaid={onMarkAsPaid}
              onPreview={onPreview}
              columnIndex={columnIndex}
            />
          ))}
        </div>
      </div>

      {/* DragOverlay pour afficher l'élément en cours de drag */}
      <DragOverlay>
        {activeInvoice ? (
          <Card className="bg-white border border-blue-400 shadow-sm opacity-90 rotate-3">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-light text-gray-900 text-sm truncate">
                    {activeInvoice.invoice_number}
                  </p>
                  <p className="text-xs text-gray-700 mt-1 truncate">
                    {activeInvoice.client_name}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                <p className="text-xs text-gray-900">{t('invoice.kanban.amountTTC')}</p>
                <p className="font-light text-gray-900 text-lg">
                  {activeInvoice.total_ttc.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
