/**
 * EventsList Page - Version Premium
 * Browse and filter events with ultra-modern design
 * Features: Infinite scroll, advanced filters, React Query cache
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MapIcon, List, Calendar, Users, Ticket, TrendingUp, Star, Share2,
  ExternalLink, Loader2, Search, Filter, X, ChevronDown, Calendar as CalendarIcon,
  DollarSign, Tag, SlidersHorizontal, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { StatCard } from '@/components/ui/StatCard';
import { EventCard } from '@/components/events/EventCard';
import { EventMap } from '@/components/events/EventMap';
import { getEvents } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import type { Event, EventFilters, EventSortOptions } from '@/types/events';
import { useDebounce } from '@/hooks/useDebounce';
import { useLanguage } from '@/hooks/useLanguage';

// Skeleton loader component
const EventCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-pulse">
    <div className="h-52 bg-gray-200" />
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  </div>
);

export default function EventsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [sortBy, setSortBy] = useState<EventSortOptions>({
    field: 'start_date',
    direction: 'asc',
  });

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Stabilize filters object to prevent infinite re-renders
  const stableFilters = useMemo(() => filters, [
    filters.event_type?.join(','),
    filters.is_free,
    filters.status?.join(','),
    filters.start_date_from,
    filters.start_date_to,
    filters.tags?.join(','),
    filters.search,
  ]);

  // Stabilize sortBy object
  const stableSortBy = useMemo(() => sortBy, [sortBy.field, sortBy.direction]);

  // Update filters when search changes
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearch || undefined,
    }));
  }, [debouncedSearch]);

  // Infinite query for events
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['events', stableFilters, stableSortBy],
    queryFn: ({ pageParam }) => getEvents(stableFilters, stableSortBy, pageParam as number, 12),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false, // Prevent auto-refresh on window focus
    refetchOnMount: false, // Prevent auto-refresh on mount if data exists
  });

  // Calculate stats from events (fallback if no stats service)
  const stats = useMemo(() => {
    const allEvents = data?.pages.flatMap(page => page.events) || [];
    return {
      total_events: allEvents.length,
      upcoming_events: allEvents.filter(e => new Date(e.start_date) > new Date()).length,
      total_attendees: allEvents.reduce((sum, e) => sum + (e.current_attendees || 0), 0),
      active_events: allEvents.filter(e => e.live_stream_status === 'live').length,
    };
  }, [data]);

  // Intersection observer for infinite scroll (using native API)
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const fetchNextPageRef = useRef(fetchNextPage);

  // Keep ref updated
  React.useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  React.useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPageRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage]);

  // Flatten events from all pages
  const events = useMemo(() => {
    return data?.pages.flatMap(page => page.events) || [];
  }, [data]);

  // Calculate statistics
  const totalEvents = stats?.total_events || events.length;
  const upcomingEvents = stats?.upcoming_events || events.filter(e => new Date(e.start_date) > new Date()).length;
  const totalAttendees = stats?.total_attendees || events.reduce((sum, e) => sum + (e.current_attendees || 0), 0);
  const liveEvents = stats?.active_events || events.filter(e => e.live_stream_status === 'live').length;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleEventTypeFilter = (eventType: string) => {
    if (eventType === 'all') {
      const { event_type, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({
        ...filters,
        event_type: [eventType as 'physical' | 'online' | 'hybrid'],
      });
    }
  };

  const handlePriceFilter = (priceFilter: string) => {
    if (priceFilter === 'all') {
      const { is_free, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({
        ...filters,
        is_free: priceFilter === 'free',
      });
    }
  };

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      const { status: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({
        ...filters,
        status: [status as 'draft' | 'published' | 'cancelled'],
      });
    }
  };

  const handleDateRangeFilter = (range: string) => {
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (range) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'next-month':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
        break;
      case 'all':
      default:
        startDate = undefined;
        endDate = undefined;
    }

    setFilters(prev => ({
      ...prev,
      start_date_from: startDate,
      start_date_to: endDate,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortBy({
      field: 'start_date',
      direction: 'asc',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.event_type?.length ||
      filters.is_free !== undefined ||
      filters.status?.length ||
      filters.start_date_from ||
      filters.start_date_to ||
      filters.tags?.length ||
      searchQuery
    );
  }, [filters, searchQuery]);

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white apple-minimal-font">
        <div className="container max-w-7xl py-6 px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Icon container - Apple Minimal */}
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <Calendar className="w-6 h-6 text-gray-700" />
                  </motion.div>

                  <div>
                    <h1
                      className="text-2xl md:text-3xl lg:text-3xl font-light text-gray-900 mb-1 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      Events
                    </h1>
                    <p
                      className="text-xs md:text-sm text-gray-500 mt-1 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      Discover and attend amazing events
                    </p>
                  </div>
                </div>

                {user && (
                  <Button
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/events/create');
                    }}
                    className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light cursor-pointer relative z-50"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('events.createEvent')}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              icon={Calendar}
              label={t('events.stats.totalEvents')}
              value={isLoading ? '...' : totalEvents.toString()}
              delay={0.1}
            />
            <StatCard
              icon={TrendingUp}
              label={t('events.stats.upcoming')}
              value={isLoading ? '...' : upcomingEvents.toString()}
              delay={0.2}
            />
            <StatCard
              icon={Users}
              label={t('events.stats.totalAttendees')}
              value={isLoading ? '...' : totalAttendees.toString()}
              delay={0.3}
            />
            <StatCard
              icon={Ticket}
              label={t('events.stats.liveNow')}
              value={isLoading ? '...' : liveEvents.toString()}
              delay={0.4}
            />
          </motion.div>

          {/* Filters & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6"
          >
            <div className="space-y-4">
              {/* Main filters row */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t('events.filters.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick filters */}
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={filters.event_type?.[0] || 'all'}
                    onValueChange={handleEventTypeFilter}
                  >
                    <SelectTrigger className="w-full md:w-40 rounded-lg bg-white border border-gray-200 py-2.5 px-3 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="all">{t('events.filters.allTypes')}</SelectItem>
                      <SelectItem value="physical">{t('events.filters.physical')}</SelectItem>
                      <SelectItem value="online">{t('events.filters.online')}</SelectItem>
                      <SelectItem value="hybrid">{t('events.filters.hybrid')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.is_free === true ? 'free' : filters.is_free === false ? 'paid' : 'all'}
                    onValueChange={handlePriceFilter}
                  >
                    <SelectTrigger className="w-full md:w-40 rounded-lg bg-white border border-gray-200 py-2.5 px-3 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="all">{t('events.filters.allPrices')}</SelectItem>
                      <SelectItem value="free">{t('events.filters.free')}</SelectItem>
                      <SelectItem value="paid">{t('events.filters.paid')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={`${sortBy.field}-${sortBy.direction}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split('-');
                      setSortBy({
                        field: field as EventSortOptions['field'],
                        direction: direction as 'asc' | 'desc',
                      });
                    }}
                  >
                    <SelectTrigger className="w-full md:w-48 rounded-lg bg-white border border-gray-200 py-2.5 px-3 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="start_date-asc">{t('events.filters.dateEarliest')}</SelectItem>
                      <SelectItem value="start_date-desc">{t('events.filters.dateLatest')}</SelectItem>
                      <SelectItem value="created_at-desc">{t('events.filters.newestFirst')}</SelectItem>
                      <SelectItem value="title-asc">{t('events.filters.aToZ')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="flex gap-2">
                    <Button
                      variant={view === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setView('grid')}
                      className="rounded-lg"
                      title={t('events.views.gridView')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={view === 'map' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setView('map')}
                      className="rounded-lg"
                      title={t('events.views.mapView')}
                    >
                      <MapIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced filters */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-gray-600 hover:text-gray-900 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  {t('events.filters.advancedFilters')}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-gray-900 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('events.filters.clearAll')}
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs md:text-sm font-light text-gray-700 mb-2 block"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.filters.dateRange')}</label>
                        <Select
                          value={
                            filters.start_date_from && filters.start_date_to
                              ? 'custom'
                              : 'all'
                          }
                          onValueChange={handleDateRangeFilter}
                        >
                          <SelectTrigger className="rounded-lg bg-white border border-gray-200 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                            <SelectItem value="all">{t('events.filters.allDates')}</SelectItem>
                            <SelectItem value="today">{t('events.filters.today')}</SelectItem>
                            <SelectItem value="this-week">{t('events.filters.thisWeek')}</SelectItem>
                            <SelectItem value="this-month">{t('events.filters.thisMonth')}</SelectItem>
                            <SelectItem value="next-month">{t('events.filters.nextMonth')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs md:text-sm font-light text-gray-700 mb-2 block"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.filters.status')}</label>
                        <Select
                          value={filters.status?.[0] || 'all'}
                          onValueChange={handleStatusFilter}
                        >
                          <SelectTrigger className="rounded-lg bg-white border border-gray-200 font-light"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                            <SelectItem value="all">{t('events.filters.allStatus')}</SelectItem>
                            <SelectItem value="draft">{t('events.filters.draft')}</SelectItem>
                            <SelectItem value="published">{t('events.filters.published')}</SelectItem>
                            <SelectItem value="cancelled">{t('events.filters.cancelled')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {isError ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-red-500 mb-4">
                  <AlertCircle className="h-16 w-16" />
                </div>
                <h3 className="text-xl md:text-2xl font-light text-gray-900 mb-3 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{t('events.empty.errorLoading')}</h3>
                <p className="text-gray-500 mb-8 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{error instanceof Error ? error.message : t('common.error')}</p>
                <Button onClick={() => window.location.reload()} className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('events.empty.retry')}
                </Button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {view === 'grid' ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="grid-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        {events.length > 0 ? (
                          <>
                            {events.map((event, index) => (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 * (index % 6) }}
                              >
                                <EventCard event={event} index={index} />
                              </motion.div>
                            ))}
                            {/* Infinite scroll trigger */}
                            <div ref={loadMoreRef} className="col-span-full">
                              {isFetchingNextPage && (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="col-span-full">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                              >
                                <Calendar className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                                <h3 className="text-xl md:text-2xl font-light text-gray-900 mb-3 tracking-tight"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                    fontWeight: 300,
                                    letterSpacing: '-0.02em',
                                  }}
                                >{t('events.empty.noEventsFound')}</h3>
                                <p className="text-gray-500 mb-8 max-w-md mx-auto font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {hasActiveFilters
                                    ? t('events.empty.tryAdjustingFilters')
                                    : t('events.empty.beFirstToCreate')}
                                </p>
                                {user && (
                                  <Button size="lg" className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light cursor-pointer relative z-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/events/create');
                                    }}
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    <Plus className="h-5 w-5 mr-2" />
                                    {t('events.empty.createFirstEvent')}
                                  </Button>
                                )}
                                {!user && (
                                  <Button asChild size="lg" variant="outline" className="rounded-lg border border-gray-200 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    <Link to="/auth">
                                      {t('events.empty.signInToCreate')}
                                    </Link>
                                  </Button>
                                )}
                              </motion.div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="map-view"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      {events.length > 0 ? (
                        <EventMap
                          events={events}
                          height="600px"
                          onEventSelect={(event) => {
                            window.location.href = `/events/${event.id}`;
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                          <MapIcon className="h-20 w-20 text-gray-400 mb-4" />
                          <p className="text-gray-600 text-lg">No events with locations to display</p>
                          <Button
                            variant="outline"
                            onClick={() => setView('grid')}
                            className="mt-4 rounded-2xl"
                          >
                            <List className="h-4 w-4 mr-2" />
                            Switch to Grid View
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </>
            )}
          </motion.div>

          {/* Quick Stats Footer */}
          {events.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-500">
                Showing {events.length} {events.length === 1 ? 'event' : 'events'}
                {searchQuery && ` matching "${searchQuery}"`}
                {hasNextPage && ' (scroll for more)'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
