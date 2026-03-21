import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  List,
  LayoutDashboard,
  CalendarDays,
  Download,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ViewMode, AppointmentFilters } from "./AppointmentDashboard";
import { ViewToggle, ViewToggleOption } from "@/components/ui/ViewToggle";
import { useLanguage } from "@/hooks/useLanguage";

interface AppointmentToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: AppointmentFilters;
  setFilters: (filters: AppointmentFilters) => void;
  totalAppointments: number;
  filteredCount: number;
  cardName: string;
}

const AppointmentToolbar: React.FC<AppointmentToolbarProps> = ({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  totalAppointments,
  filteredCount,
  cardName,
}) => {
  const { t, currentLanguage } = useLanguage();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const statusOptions = [
    { value: "pending", label: t('appointments.status.pending') },
    { value: "confirmed", label: t('appointments.status.confirmed') },
    { value: "cancelled", label: t('appointments.status.cancelled') },
  ];

  const toggleStatusFilter = (status: string) => {
    setFilters({
      ...filters,
      status: filters.status.includes(status)
        ? filters.status.filter((s) => s !== status)
        : [...filters.status, status],
    });
  };

  const clearAllFilters = () => {
    setFilters({
      status: [],
      dateRange: { start: null, end: null },
      duration: { min: null, max: null },
    });
    setSearchTerm("");
  };

  const hasActiveFilters = searchTerm || filters.status.length > 0 || filters.dateRange.start || filters.dateRange.end || filters.duration.min || filters.duration.max;

  const exportToCSV = () => {
    // TODO: Implement CSV export
  };

  const activeFilterCount = (filters.status.length || 0) + (filters.dateRange.start ? 1 : 0) + (filters.dateRange.end ? 1 : 0) + (filters.duration.min ? 1 : 0) + (filters.duration.max ? 1 : 0);

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
          >
            {t('appointments.toolbar.title') || 'Gestion des rendez-vous'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {filteredCount} sur {totalAppointments} rendez-vous
            {hasActiveFilters && ` ${t('appointments.toolbar.filtered') || '(filtrés)'}`}
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex-shrink-0">
          <ViewToggle
            options={[
              { id: 'list', icon: List },
              { id: 'kanban', icon: LayoutDashboard },
              { id: 'calendar', icon: CalendarDays }
            ]}
            activeView={viewMode}
            onViewChange={(view) => setViewMode(view as ViewMode)}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('appointments.toolbar.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border border-gray-200 bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900 font-light"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Advanced Filters Button */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 border border-gray-200 text-gray-900 hover:bg-gray-50 font-light">
              <Filter className="h-4 w-4" />
              {t('appointments.toolbar.advancedFilters')}
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                  {(filters.status.length || 0) + (filters.dateRange.start ? 1 : 0) + (filters.duration.min ? 1 : 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto border border-gray-200 bg-white">
            <SheetHeader>
              <SheetTitle className="text-xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('appointments.toolbar.advancedFilters') || 'Filtres avancés'}
              </SheetTitle>
              <SheetDescription className="text-sm text-gray-600 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('appointments.toolbar.filtersDescription') || 'Filtrez vos rendez-vous selon vos critères'}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-light text-gray-700 mb-2 block"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('appointments.toolbar.filters.status') || 'Statut'}
                </Label>
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status.includes(option.value)}
                      onCheckedChange={() => toggleStatusFilter(option.value)}
                    />
                    <label
                      htmlFor={`status-${option.value}`}
                      className="text-sm font-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label className="text-base font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('appointments.toolbar.filters.dateRange')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-light border border-gray-200 text-gray-900 hover:bg-gray-50">
                        {filters.dateRange.start ? format(filters.dateRange.start, "PP", { locale: currentLanguage === 'fr' ? fr : enUS }) : t('appointments.toolbar.filters.startDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.start || undefined}
                        onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: date || null } })}
                        locale={currentLanguage === 'fr' ? fr : enUS}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-light border border-gray-200 text-gray-900 hover:bg-gray-50">
                        {filters.dateRange.end ? format(filters.dateRange.end, "PP", { locale: currentLanguage === 'fr' ? fr : enUS }) : t('appointments.toolbar.filters.endDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.end || undefined}
                        onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: date || null } })}
                        locale={currentLanguage === 'fr' ? fr : enUS}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Duration Filter */}
              <div className="space-y-3">
                <Label className="text-base font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('appointments.toolbar.filters.duration')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="duration-min" className="text-xs font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('appointments.toolbar.filters.minimum')}
                    </Label>
                    <Input
                      id="duration-min"
                      type="number"
                      placeholder={t('appointments.toolbar.filters.min')}
                      value={filters.duration.min || ""}
                      onChange={(e) => setFilters({ ...filters, duration: { ...filters.duration, min: e.target.value ? parseInt(e.target.value) : null } })}
                      className="border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 font-light"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration-max" className="text-xs font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('appointments.toolbar.filters.maximum')}
                    </Label>
                    <Input
                      id="duration-max"
                      type="number"
                      placeholder={t('appointments.toolbar.filters.max')}
                      value={filters.duration.max || ""}
                      onChange={(e) => setFilters({ ...filters, duration: { ...filters.duration, max: e.target.value ? parseInt(e.target.value) : null } })}
                      className="border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 font-light"
                    />
                  </div>
                </div>
              </div>

              {/* Clear All Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="w-full border border-gray-200 text-gray-900 hover:bg-gray-50 font-light"
                  onClick={clearAllFilters}
                >
                  {t('appointments.toolbar.resetFilters')}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Export Button */}
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900 font-light shadow-sm"
            onClick={exportToCSV}
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          {filters.status.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-light shadow-sm"
            >
              {statusOptions.find((s) => s.value === status)?.label}
              <button onClick={() => toggleStatusFilter(status)} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.dateRange.start && (
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-light shadow-sm"
            >
              {t('appointments.toolbar.filterLabels.from') || 'Du'} {format(filters.dateRange.start, "PP", { locale: currentLanguage === 'fr' ? fr : enUS })}
              <button onClick={() => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: null } })} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.dateRange.end && (
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-light shadow-sm"
            >
              {t('appointments.toolbar.filterLabels.until') || 'Au'} {format(filters.dateRange.end, "PP", { locale: currentLanguage === 'fr' ? fr : enUS })}
              <button onClick={() => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: null } })} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentToolbar;
