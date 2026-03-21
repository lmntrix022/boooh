import React, { useState } from "react";
import { ViewMode, OrderFilters, OrderTypeFilter, PaymentStatus, ShippingStatus } from "./OrderDashboard";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Download,
  List,
  LayoutGrid,
  BarChart3,
  X,
  Calendar,
  DollarSign,
  Package
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ViewToggle, ViewToggleOption } from "@/components/ui/ViewToggle";
import { ActionButtons, ActionButton } from "@/components/ui/ActionButtons";
import { useLanguage } from "@/hooks/useLanguage";

interface OrderToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  totalOrders: number;
  filteredCount: number;
  cardName: string;
  availableProducts: Pick<Tables<"products">, "id" | "name" | "price">[];
  onExport?: () => void;
}

const OrderToolbar: React.FC<OrderToolbarProps> = ({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  totalOrders,
  filteredCount,
  availableProducts,
  onExport
}) => {
  const { t, currentLanguage } = useLanguage();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const resetFilters = () => {
    setFilters({
      paymentStatus: [],
      shippingStatus: [],
      orderType: [],
      dateRange: { start: null, end: null },
      products: [],
      amountRange: { min: null, max: null }
    });
    setSearchTerm("");
  };

  const viewModes = [
    { value: "list" as ViewMode, icon: List, label: t('orders.toolbar.viewModes.list') },
    { value: "kanban" as ViewMode, icon: LayoutGrid, label: t('orders.toolbar.viewModes.kanban') },
    { value: "stats" as ViewMode, icon: BarChart3, label: t('orders.toolbar.viewModes.stats') },
  ];

  const hasActiveFilters = searchTerm || filters.paymentStatus.length > 0 || filters.shippingStatus.length > 0 || (filters.orderType?.length ?? 0) > 0 || filters.dateRange.start || filters.dateRange.end || filters.products.length > 0 || filters.amountRange.min !== null || filters.amountRange.max !== null;

  const activeFilterCount =
    filters.paymentStatus.length +
    filters.shippingStatus.length +
    (filters.orderType?.length ?? 0) +
    filters.products.length +
    (filters.dateRange.start ? 1 : 0) +
    (filters.dateRange.end ? 1 : 0) +
    (filters.amountRange.min !== null ? 1 : 0) +
    (filters.amountRange.max !== null ? 1 : 0);

  const removeFilter = (type: 'paymentStatus' | 'shippingStatus' | 'orderType' | 'products', value: string) => {
    const arr = (filters[type] ?? []) as string[];
    setFilters({
      ...filters,
      [type]: arr.filter((v: string) => v !== value)
    });
  };

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-light text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >{t('orders.toolbar.title') || 'Tableau de bord'}</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {filteredCount} sur {totalOrders} commande{totalOrders > 1 ? 's' : ''}
            {hasActiveFilters && ` ${t('orders.toolbar.filtered') || '(filtrées)'}`}
          </p>
        </div>

        {/* View Mode Selector and Export Button - Same Line on Mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
        <ViewToggle
          options={viewModes.map(({ value, icon }) => ({
            id: value,
            icon,
            
          }))}
          activeView={viewMode}
          onViewChange={(view) => setViewMode(view as ViewMode)}
        />
          {/* Export Button - On same line as view buttons on mobile */}
          {onExport && (
            <div className="flex-shrink-0">
              <Button 
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900 font-light shadow-sm"
                onClick={onExport}
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters - Same Line on Mobile */}
      <div className="flex flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('orders.toolbar.searchPlaceholder') || 'Rechercher par nom, email, numéro de commande...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Advanced Filters Button - Icon only, same line as search on mobile */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <div className="flex-shrink-0">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900 font-light shadow-sm relative">
                <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-gray-900 text-white text-xs rounded-full font-light flex items-center justify-center border border-gray-200">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            </div>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{t('orders.toolbar.advancedFilters')}</SheetTitle>
              <SheetDescription>
                {t('orders.toolbar.filtersDescription')}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Payment Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-light flex items-center gap-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <DollarSign className="h-4 w-4 text-gray-700" />
                  {t('orders.toolbar.filters.paymentStatus')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pending", "paid", "cancelled", "refunded"] as PaymentStatus[]).map((status) => (
                    <label
                      key={status}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        filters.paymentStatus.includes(status)
                          ? "border-gray-900 bg-gray-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.paymentStatus.includes(status)}
                        onChange={(e) => {
                          const newPaymentStatus = e.target.checked
                            ? [...filters.paymentStatus, status]
                            : filters.paymentStatus.filter((s) => s !== status);
                          setFilters({ ...filters, paymentStatus: newPaymentStatus });
                        }}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm capitalize text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t(`orders.stats.paymentStatus.${status}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Shipping Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-light flex items-center gap-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Package className="h-4 w-4 text-gray-700" />
                  {t('orders.toolbar.filters.shippingStatus')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pending", "processing", "shipped", "delivered", "cancelled"] as ShippingStatus[]).map((status) => (
                    <label
                      key={status}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        filters.shippingStatus.includes(status)
                          ? "border-gray-900 bg-gray-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.shippingStatus.includes(status)}
                        onChange={(e) => {
                          const newShippingStatus = e.target.checked
                            ? [...filters.shippingStatus, status]
                            : filters.shippingStatus.filter((s) => s !== status);
                          setFilters({ ...filters, shippingStatus: newShippingStatus });
                        }}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm capitalize text-gray-900">
                        {t(`orders.stats.shippingStatus.${status}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-light flex items-center gap-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Package className="h-4 w-4 text-gray-700" />
                  {t('orders.toolbar.filters.orderType')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['digital', 'physical'] as OrderTypeFilter[]).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        (filters.orderType ?? []).includes(type)
                          ? "border-gray-900 bg-gray-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(filters.orderType ?? []).includes(type)}
                        onChange={(e) => {
                          const current = filters.orderType ?? [];
                          const newOrderType = e.target.checked
                            ? [...current, type]
                            : current.filter((t) => t !== type);
                          setFilters({ ...filters, orderType: newOrderType });
                        }}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-900">
                        {type === 'digital' ? t('orders.toolbar.filters.digital') : t('orders.toolbar.filters.physical')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-light flex items-center gap-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Calendar className="h-4 w-4 text-gray-700" />
                  {t('orders.toolbar.filters.dateRange')}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 mb-1">{t('orders.toolbar.filters.startDate')}</Label>
                    <Input
                      type="date"
                      value={filters.dateRange.start ? format(filters.dateRange.start, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const newDate = e.target.value ? new Date(e.target.value) : null;
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, start: newDate }
                        });
                      }}
                      className="rounded-lg border border-gray-200/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1">{t('orders.toolbar.filters.endDate')}</Label>
                    <Input
                      type="date"
                      value={filters.dateRange.end ? format(filters.dateRange.end, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const newDate = e.target.value ? new Date(e.target.value) : null;
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, end: newDate }
                        });
                      }}
                      className="rounded-lg border border-gray-200/50"
                    />
                  </div>
                </div>
              </div>

              {/* Product Filter - affiché seulement s'il y a des produits */}
              {availableProducts.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('orders.toolbar.filters.products')}</Label>
                  <Select
                    value={filters.products[0] || "all"}
                    onValueChange={(value) => {
                      setFilters({
                        ...filters,
                        products: value === "all" ? [] : [value]
                      });
                    }}
                  >
                    <SelectTrigger className="rounded-lg border border-gray-200/50">
                      <SelectValue placeholder={t('orders.toolbar.filters.allProducts')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('orders.toolbar.filters.allProducts')}</SelectItem>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear All Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="w-full border-gray-200/50 hover:bg-gray-50 text-gray-900"
                  onClick={resetFilters}
                >
                  {t('orders.toolbar.resetFilters')}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filters.paymentStatus.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {t('orders.toolbar.filterLabels.payment')}: {t(`orders.stats.paymentStatus.${status}`)}
                <button onClick={() => removeFilter('paymentStatus', status)} className="hover:bg-gray-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.shippingStatus.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {t('orders.toolbar.filterLabels.shipping')}: {t(`orders.stats.shippingStatus.${status}`)}
                <button onClick={() => removeFilter('shippingStatus', status)} className="hover:bg-gray-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {(filters.orderType ?? []).map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {t('orders.toolbar.filterLabels.type')}: {type === 'digital' ? t('orders.toolbar.filters.digital') : t('orders.toolbar.filters.physical')}
                <button onClick={() => removeFilter('orderType', type)} className="hover:bg-gray-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.dateRange.start && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {t('orders.toolbar.filterLabels.from')} {format(filters.dateRange.start, "PP", { locale: currentLanguage === 'fr' ? fr : enUS })}
                <button onClick={() => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: null } })} className="hover:bg-gray-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.dateRange.end && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {t('orders.toolbar.filterLabels.until')} {format(filters.dateRange.end, "PP", { locale: currentLanguage === 'fr' ? fr : enUS })}
                <button onClick={() => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: null } })} className="hover:bg-gray-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderToolbar;
