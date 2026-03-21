import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatAmount } from '@/utils/format';
import {
  Eye,
  Download,
  Send,
  Trash2,
  Search,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Banknote,
  Filter,
  X,
  SortAsc,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Invoice, InvoiceStatus } from '@/services/invoiceService';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onGeneratePdf: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
  onPreview?: (invoice: Invoice) => void;
}

const getStatusConfig = (t: any): Record<InvoiceStatus, { label: string; color: string; icon: React.ElementType }> => ({
  draft: { label: t('invoice.status.draft'), color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: FileText },
  sent: { label: t('invoice.status.sent'), color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: Send },
  paid: { label: t('invoice.status.paid'), color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: CheckCircle },
  cancelled: { label: t('invoice.status.cancelled'), color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: XCircle },
  overdue: { label: t('invoice.status.overdue'), color: 'bg-gray-100 text-gray-700 border border-gray-200', icon: AlertCircle },
});

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onSelect,
  onDelete,
  onGeneratePdf,
  onSend,
  onMarkAsPaid,
  onPreview,
}) => {
  const { t, currentLanguage } = useLanguage();
  const statusConfig = getStatusConfig(t);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'issue_date', direction: 'desc' });
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Filtres avancés
  const [advancedFilters, setAdvancedFilters] = useState({
    statuses: [] as InvoiceStatus[],
    dateRange: { start: null as Date | null, end: null as Date | null },
    amountRange: { min: null as number | null, max: null as number | null },
  });

  // Filtrage et tri des factures
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      // Filtre de recherche
      const matchesSearch =
        !searchQuery ||
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtre de statut (basique)
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      // Filtre de date (basique)
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        const invoiceDate = new Date(invoice.issue_date);
        const diffDays = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case '7days':
            matchesDate = diffDays <= 7;
            break;
          case '30days':
            matchesDate = diffDays <= 30;
            break;
          case '90days':
            matchesDate = diffDays <= 90;
            break;
        }
      }

      // Filtres avancés - statuts
      const matchesAdvancedStatus = advancedFilters.statuses.length === 0 ||
        advancedFilters.statuses.includes(invoice.status);

      // Filtres avancés - date range
      let matchesDateRange = true;
      if (advancedFilters.dateRange.start || advancedFilters.dateRange.end) {
        const invoiceDate = new Date(invoice.issue_date);
        if (advancedFilters.dateRange.start) {
          matchesDateRange = matchesDateRange && invoiceDate >= advancedFilters.dateRange.start;
        }
        if (advancedFilters.dateRange.end) {
          matchesDateRange = matchesDateRange && invoiceDate <= advancedFilters.dateRange.end;
        }
      }

      // Filtres avancés - montant
      let matchesAmount = true;
      if (advancedFilters.amountRange.min !== null || advancedFilters.amountRange.max !== null) {
        if (advancedFilters.amountRange.min !== null) {
          matchesAmount = matchesAmount && invoice.total_ttc >= advancedFilters.amountRange.min;
        }
        if (advancedFilters.amountRange.max !== null) {
          matchesAmount = matchesAmount && invoice.total_ttc <= advancedFilters.amountRange.max;
        }
      }

      return matchesSearch && matchesStatus && matchesDate && matchesAdvancedStatus && matchesDateRange && matchesAmount;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Invoice];
      let bValue: any = b[sortConfig.key as keyof Invoice];

      if (sortConfig.key === 'issue_date' || sortConfig.key === 'due_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, searchQuery, statusFilter, dateFilter, advancedFilters, sortConfig]);

  const getStatusBadge = (status: InvoiceStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} hover:${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setAdvancedFilters({
      statuses: [],
      dateRange: { start: null, end: null },
      amountRange: { min: null, max: null },
    });
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ||
    advancedFilters.statuses.length > 0 || advancedFilters.dateRange.start ||
    advancedFilters.dateRange.end || advancedFilters.amountRange.min !== null ||
    advancedFilters.amountRange.max !== null;

  const activeFilterCount =
    advancedFilters.statuses.length +
    (advancedFilters.dateRange.start ? 1 : 0) +
    (advancedFilters.dateRange.end ? 1 : 0) +
    (advancedFilters.amountRange.min !== null ? 1 : 0) +
    (advancedFilters.amountRange.max !== null ? 1 : 0);

  const removeStatusFilter = (status: InvoiceStatus) => {
    setAdvancedFilters({
      ...advancedFilters,
      statuses: advancedFilters.statuses.filter(s => s !== status)
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(current =>
      current.includes(invoiceId)
        ? current.filter(id => id !== invoiceId)
        : [...current, invoiceId]
    );
  };

  const exportToCSV = () => {
    // Exporter soit les factures sélectionnées, soit toutes les factures filtrées
    const invoicesToExport = selectedInvoices.length > 0
      ? filteredInvoices.filter(inv => selectedInvoices.includes(inv.id))
      : filteredInvoices;

    if (!invoicesToExport.length) return;

    const headers = [t('invoice.list.csv.invoiceNumber'), t('invoice.list.csv.client'), t('invoice.list.csv.email'), t('invoice.list.csv.date'), t('invoice.list.csv.dueDate'), t('invoice.list.csv.amountHT'), t('invoice.list.csv.vat'), t('invoice.list.csv.amountTTC'), t('invoice.list.csv.status')];
    const csvContent = [
      headers.join(','),
      ...invoicesToExport.map(invoice => [
        invoice.invoice_number,
        `"${invoice.client_name}"`,
        invoice.client_email || '',
        format(new Date(invoice.issue_date), 'dd/MM/yyyy'),
        format(new Date(invoice.due_date), 'dd/MM/yyyy'),
        invoice.total_ht,
        invoice.total_vat,
        invoice.total_ttc,
        statusConfig[invoice.status].label
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `factures_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtres et recherche Ultra-Modernes */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-3 md:p-6 lg:p-8 overflow-hidden">
          <div>
            <div className="flex flex-row items-center gap-2">
              {/* Barre de recherche Ultra-Moderne */}
              <div className="flex-1 min-w-0">
                <motion.div
                  className="relative group"
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                      placeholder={t('invoice.list.search.placeholder') || 'Rechercher...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 py-2 md:py-2.5 rounded-lg bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-gray-900 text-sm font-light transition-all duration-200"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-md hover:bg-gray-100"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                  </div>
                </motion.div>
              </div>

              {/* Filtres avancés - Icone uniquement sur mobile */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0"
                  >
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="w-10 h-10 md:w-auto md:min-w-[140px] bg-white/90 backdrop-blur-xl border border-gray-200/60 text-gray-900 hover:bg-gray-50/90 shadow-lg hover:shadow-sm transition-all duration-300 rounded-lg px-2 md:px-3"
                    >
                      <Filter className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">{t('invoice.list.filters.advanced')}</span>
                    {activeFilterCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-xs rounded-full font-light">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                  </motion.div>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>{t('invoice.list.filters.title')}</SheetTitle>
                    <SheetDescription>
                      {t('invoice.list.filters.description')}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* Filtre par statut */}
                    <div className="space-y-3">
                      <Label className="text-sm font-light flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-900" />
                        {t('invoice.list.filters.status')}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(statusConfig) as InvoiceStatus[]).map((status) => (
                          <label
                            key={status}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              advancedFilters.statuses.includes(status)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={advancedFilters.statuses.includes(status)}
                              onChange={(e) => {
                                const newStatuses = e.target.checked
                                  ? [...advancedFilters.statuses, status]
                                  : advancedFilters.statuses.filter((s) => s !== status);
                                setAdvancedFilters({ ...advancedFilters, statuses: newStatuses });
                              }}
                              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                            <span className="text-sm">{statusConfig[status].label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Plage de dates */}
                    <div className="space-y-3">
                      <Label className="text-sm font-light flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-900" />
                        {t('invoice.list.filters.dateRange')}
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-900 mb-1">{t('invoice.list.filters.startDate')}</Label>
                          <Input
                            type="date"
                            value={advancedFilters.dateRange.start ? format(advancedFilters.dateRange.start, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const newDate = e.target.value ? new Date(e.target.value) : null;
                              setAdvancedFilters({
                                ...advancedFilters,
                                dateRange: { ...advancedFilters.dateRange, start: newDate }
                              });
                            }}
                            className="rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-900 mb-1">{t('invoice.list.filters.endDate')}</Label>
                          <Input
                            type="date"
                            value={advancedFilters.dateRange.end ? format(advancedFilters.dateRange.end, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const newDate = e.target.value ? new Date(e.target.value) : null;
                              setAdvancedFilters({
                                ...advancedFilters,
                                dateRange: { ...advancedFilters.dateRange, end: newDate }
                              });
                            }}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Montant */}
                    <div className="space-y-3">
                      <Label className="text-sm font-light flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-900" />
                        {t('invoice.list.filters.amountTTC')}
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-900 mb-1">{t('invoice.list.filters.minimum')}</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={advancedFilters.amountRange.min ?? ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null;
                              setAdvancedFilters({
                                ...advancedFilters,
                                amountRange: { ...advancedFilters.amountRange, min: value }
                              });
                            }}
                            className="rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-900 mb-1">{t('invoice.list.filters.maximum')}</Label>
                          <Input
                            type="number"
                            placeholder="∞"
                            value={advancedFilters.amountRange.max ?? ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null;
                              setAdvancedFilters({
                                ...advancedFilters,
                                amountRange: { ...advancedFilters.amountRange, max: value }
                              });
                            }}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bouton de réinitialisation */}
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={resetFilters}
                      >
                        {t('invoice.list.filters.reset')}
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Export - Icone uniquement sur mobile */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0"
              >
              <Button
                variant="outline"
                  size="icon"
                  className="w-10 h-10 md:w-auto md:min-w-[120px] bg-white/90 backdrop-blur-xl border border-gray-200/60 text-gray-900 hover:bg-gray-50/90 shadow-lg hover:shadow-sm transition-all duration-300 rounded-lg px-2 md:px-3"
                onClick={exportToCSV}
                disabled={filteredInvoices.length === 0}
              >
                  <Download className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">
                  {t('invoice.list.export')} {selectedInvoices.length > 0 && `(${selectedInvoices.length})`}
                </span>
              </Button>
              </motion.div>
            </div>

            {/* Filtres actifs */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2"
                >
                  {advancedFilters.statuses.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('invoice.list.filters.status')}: {statusConfig[status].label}
                      <button onClick={() => removeStatusFilter(status)} className="hover:bg-blue-200 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {advancedFilters.dateRange.start && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
                      {t('invoice.list.filters.from')} {format(advancedFilters.dateRange.start, 'PP', { locale: currentLanguage === 'fr' ? fr : enUS })}
                      <button
                        onClick={() => setAdvancedFilters({ ...advancedFilters, dateRange: { ...advancedFilters.dateRange, start: null } })}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {advancedFilters.dateRange.end && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
                      {t('invoice.list.filters.until')} {format(advancedFilters.dateRange.end, 'PP', { locale: currentLanguage === 'fr' ? fr : enUS })}
                      <button
                        onClick={() => setAdvancedFilters({ ...advancedFilters, dateRange: { ...advancedFilters.dateRange, end: null } })}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {advancedFilters.amountRange.min !== null && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {t('invoice.list.filters.min')}: {advancedFilters.amountRange.min ? formatAmount(advancedFilters.amountRange.min) : ''}
                      <button
                        onClick={() => setAdvancedFilters({ ...advancedFilters, amountRange: { ...advancedFilters.amountRange, min: null } })}
                        className="hover:bg-purple-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {advancedFilters.amountRange.max !== null && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {t('invoice.list.filters.max')}: {advancedFilters.amountRange.max ? formatAmount(advancedFilters.amountRange.max) : ''}
                      <button
                        onClick={() => setAdvancedFilters({ ...advancedFilters, amountRange: { ...advancedFilters.amountRange, max: null } })}
                        className="hover:bg-purple-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Liste des factures Ultra-Moderne */}
      {filteredInvoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-lg bg-gray-900 flex items-center justify-center shadow-lg border border-gray-800/50 mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-light text-gray-900 mb-3">
              {t('invoice.list.empty.title')}
            </h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? t('invoice.list.empty.noResults')
                : t('invoice.list.empty.noInvoices')}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-b border-gray-200/50">
                  <TableHead className="w-[30px]">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border border-gray-300 focus:ring-4 focus:ring-gray-900/30 transition-all duration-300"
                    />
                  </TableHead>
                  <TableHead className="font-light text-gray-900">{t('invoice.list.table.invoiceNumber')}</TableHead>
                  <TableHead
                    className="font-light cursor-pointer text-gray-900 hover:text-gray-900 transition-colors"
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center gap-2">
                      {t('invoice.list.table.client')}
                      <SortAsc className={`h-4 w-4 transition-transform ${
                        sortConfig.key === 'client_name'
                          ? sortConfig.direction === 'desc'
                            ? 'rotate-180'
                            : ''
                          : 'opacity-0'
                      }`} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-light cursor-pointer text-gray-900 hover:text-gray-900 transition-colors"
                    onClick={() => handleSort('issue_date')}
                  >
                    <div className="flex items-center gap-2">
                      {t('invoice.list.table.date')}
                      <SortAsc className={`h-4 w-4 transition-transform ${
                        sortConfig.key === 'issue_date'
                          ? sortConfig.direction === 'desc'
                            ? 'rotate-180'
                            : ''
                          : 'opacity-0'
                      }`} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-light cursor-pointer text-gray-900 hover:text-gray-900 transition-colors"
                    onClick={() => handleSort('due_date')}
                  >
                    <div className="flex items-center gap-2">
                      {t('invoice.list.table.dueDate')}
                      <SortAsc className={`h-4 w-4 transition-transform ${
                        sortConfig.key === 'due_date'
                          ? sortConfig.direction === 'desc'
                            ? 'rotate-180'
                            : ''
                          : 'opacity-0'
                      }`} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-light text-right cursor-pointer text-gray-900 hover:text-gray-900 transition-colors"
                    onClick={() => handleSort('total_ttc')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {t('invoice.list.table.amountTTC')}
                      <SortAsc className={`h-4 w-4 transition-transform ${
                        sortConfig.key === 'total_ttc'
                          ? sortConfig.direction === 'desc'
                            ? 'rotate-180'
                            : ''
                          : 'opacity-0'
                      }`} />
                    </div>
                  </TableHead>
                  <TableHead className="font-light text-gray-900">{t('invoice.list.table.status')}</TableHead>
                  <TableHead className="font-light text-right text-gray-900">{t('invoice.list.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`transition-colors cursor-pointer ${
                        selectedInvoices.includes(invoice.id)
                          ? 'bg-gray-50 hover:bg-gray-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => onSelect(invoice)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => handleSelectInvoice(invoice.id)}
                          className="rounded border border-gray-300 focus:ring-4 focus:ring-gray-900/30 transition-all duration-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.client_name}</div>
                          {invoice.client_email && (
                            <div className="text-sm text-gray-700">{invoice.client_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: currentLanguage === 'fr' ? fr : enUS })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: currentLanguage === 'fr' ? fr : enUS })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-light">
                        {formatAmount(invoice.total_ttc)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-md">
                            {onPreview && (
                              <DropdownMenuItem onClick={() => onPreview(invoice)} className="cursor-pointer text-gray-900 hover:bg-indigo-50">
                                <Eye className="w-4 h-4 mr-2" />
                                {t('invoice.list.actions.preview')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onSelect(invoice)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />
                              {t('invoice.list.actions.viewEdit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onGeneratePdf(invoice)} className="cursor-pointer">
                              <Download className="w-4 h-4 mr-2" />
                              {t('invoice.list.actions.generatePDF')}
                            </DropdownMenuItem>
                            {invoice.status !== 'paid' && (
                              <>
                                <DropdownMenuItem onClick={() => onSend(invoice)} className="cursor-pointer">
                                  <Send className="w-4 h-4 mr-2" />
                                  {t('invoice.list.actions.send')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onMarkAsPaid(invoice)}
                                  className="text-gray-900 hover:bg-green-50 cursor-pointer"
                                >
                                  <Banknote className="w-4 h-4 mr-2" />
                                  {t('invoice.list.actions.markAsPaid')}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => onDelete(invoice.id)}
                              className="text-gray-900 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('invoice.list.actions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}

      {/* Info nombre de résultats */}
      {filteredInvoices.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-900">
          <div>
            {filteredInvoices.length} {filteredInvoices.length === 1 ? t('invoice.list.results.invoiceSingular') : t('invoice.list.results.invoicePlural')} {filteredInvoices.length === 1 ? t('invoice.list.results.found') : t('invoice.list.results.foundPlural')}
            {invoices.length !== filteredInvoices.length && ` ${t('invoice.list.results.of')} ${invoices.length} ${t('invoice.list.results.total')}`}
          </div>
          {selectedInvoices.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-200 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {selectedInvoices.length} {selectedInvoices.length === 1 ? t('invoice.list.results.selectedSingular') : t('invoice.list.results.selectedPlural')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInvoices([])}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {t('invoice.list.results.deselect')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
