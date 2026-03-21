/**
 * EventAttendees Page
 * Manage event attendees with ultra-modern design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Search,
  Download,
  Mail,
  Check,
  X,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { StatCard } from '@/components/ui/StatCard';
import { BulkEmailDialog } from '@/components/events/BulkEmailDialog';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  getEventById,
  getEventAttendees,
  exportAttendeesToCSV,
  sendBulkEmailToAttendees,
  updateAttendeeCheckIn,
} from '@/services/eventService';
import type { Event, EventAttendee } from '@/types/events';
import { useLanguage } from '@/hooks/useLanguage';

export default function EventAttendees() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const loadEvent = useCallback(async (eventId: string) => {
    try {
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    }
  }, []);

  const loadAttendees = useCallback(async (eventId: string) => {
    setIsLoading(true);
    try {
      const data = await getEventAttendees(eventId);
      setAttendees(data);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadEvent(id);
      loadAttendees(id);
    }
  }, [id, loadEvent, loadAttendees]);

  const handleExport = () => {
    if (!event) return;
    try {
      const attendeesToExport =
        selectedAttendees.size > 0
          ? attendees.filter((a) => selectedAttendees.has(a.id))
          : filteredAttendees;

      exportAttendeesToCSV(attendeesToExport, event.title);
      alert(
        `Successfully exported ${attendeesToExport.length} attendee${
          attendeesToExport.length !== 1 ? 's' : ''
        }`
      );
    } catch (error) {
      alert('Failed to export attendees. Please try again.');
    }
  };

  const handleSendEmail = async (subject: string, message: string) => {
    if (!id) return;

    const attendeeIds =
      selectedAttendees.size > 0
        ? Array.from(selectedAttendees)
        : filteredAttendees.map((a) => a.id);

    const result = await sendBulkEmailToAttendees(id, attendeeIds, subject, message);

    if (result.failed > 0) {
      alert(
        `Emails sent: ${result.success} successful, ${result.failed} failed`
      );
    }
  };

  const handleToggleCheckIn = async (attendeeId: string, currentStatus: boolean) => {
    try {
      await updateAttendeeCheckIn(attendeeId, !currentStatus);
      // Refresh attendees list
      if (id) {
        await loadAttendees(id);
      }
    } catch (error) {
      alert('Failed to update check-in status');
    }
  };

  const handleSelectAttendee = (attendeeId: string) => {
    const newSelected = new Set(selectedAttendees);
    if (newSelected.has(attendeeId)) {
      newSelected.delete(attendeeId);
    } else {
      newSelected.add(attendeeId);
    }
    setSelectedAttendees(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAttendees.size === filteredAttendees.length) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(new Set(filteredAttendees.map((a) => a.id)));
    }
  };

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'checked-in' && attendee.checked_in) ||
      (filterStatus === 'not-checked-in' && !attendee.checked_in);

    return matchesSearch && matchesFilter;
  });

  const totalAttendees = attendees.length;
  const checkedIn = attendees.filter((a) => a.checked_in).length;
  const notCheckedIn = totalAttendees - checkedIn;
  const checkInRate = totalAttendees > 0 ? Math.round((checkedIn / totalAttendees) * 100) : 0;

  if (!event) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen flex items-center justify-center bg-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="relative z-10"
          >
            <Loader2 className="h-12 w-12 text-gray-600" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

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

              {/* Back button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="rounded-lg hover:bg-gray-100 text-gray-600 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('events.form.back')}
                </Button>
              </motion.div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Icon container - Apple Minimal */}
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <Users className="w-6 h-6 text-gray-600" />
                  </motion.div>

                  <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 mb-1 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {t('events.attendees.title')}
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {event.title}
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailDialog(true)}
                    disabled={filteredAttendees.length === 0}
                    className="rounded-lg border border-gray-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {selectedAttendees.size > 0 
                      ? t('events.attendees.emailSelected', { count: selectedAttendees.size })
                      : t('events.attendees.emailAll')}
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={filteredAttendees.length === 0}
                    className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('events.attendees.export')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              icon={Users}
              label={t('events.stats.totalAttendees')}
              value={totalAttendees.toString()}
              delay={0.1}
            />
            <StatCard
              icon={UserCheck}
              label={t('events.stats.checkedIn')}
              value={checkedIn.toString()}
              delay={0.2}
            />
            <StatCard
              icon={UserX}
              label={t('events.stats.notCheckedIn')}
              value={notCheckedIn.toString()}
              delay={0.3}
            />
            <StatCard
              icon={Check}
              label={t('events.stats.checkInRate')}
              value={`${checkInRate}%`}
              delay={0.4}
            />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('events.attendees.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value: any) => setFilterStatus(value)}
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
                  <SelectItem value="all">{t('events.attendees.allAttendees')}</SelectItem>
                  <SelectItem value="checked-in">{t('events.attendees.checkedIn')}</SelectItem>
                  <SelectItem value="not-checked-in">{t('events.attendees.notCheckedIn')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Mobile Actions */}
          <div className="md:hidden flex gap-2 mb-6">
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(true)}
              disabled={filteredAttendees.length === 0}
              className="flex-1 rounded-lg border border-gray-200 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              {selectedAttendees.size > 0 
                ? t('events.attendees.emailSelected', { count: selectedAttendees.size })
                : t('events.attendees.emailAll')}
            </Button>
            <Button
              onClick={handleExport}
              disabled={filteredAttendees.length === 0}
              className="flex-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('events.attendees.export')}
            </Button>
          </div>

          {/* Attendees List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-light tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >{t('events.attendees.attendeesCount', { count: filteredAttendees.length })}</CardTitle>
                    <CardDescription className="font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('events.attendees.viewAndManage')}
                    </CardDescription>
                  </div>
                  {filteredAttendees.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="rounded-lg border border-gray-200 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {selectedAttendees.size === filteredAttendees.length
                        ? t('events.attendees.deselectAll')
                        : t('events.attendees.selectAll')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.attendees.loading')}</p>
                  </div>
                ) : filteredAttendees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-light mb-2 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >{t('events.attendees.noAttendeesFound')}</p>
                    <p className="text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {searchQuery || filterStatus !== 'all'
                        ? t('events.attendees.tryAdjustingFilters')
                        : t('events.attendees.willAppearHere')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAttendees.map((attendee, index) => (
                      <motion.div
                        key={attendee.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={selectedAttendees.has(attendee.id)}
                                onCheckedChange={() => handleSelectAttendee(attendee.id)}
                              />

                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gray-900 text-white">
                                  {attendee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-light text-gray-900 tracking-tight"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                      fontWeight: 300,
                                      letterSpacing: '-0.01em',
                                    }}
                                  >
                                    {attendee.name}
                                  </p>
                                  <Badge
                                    variant={attendee.checked_in ? 'default' : 'secondary'}
                                    className="rounded-lg border border-gray-200 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {attendee.checked_in ? (
                                      <><Check className="h-3 w-3 mr-1" /> {t('events.attendees.checkedIn')}</>
                                    ) : (
                                      <><X className="h-3 w-3 mr-1" /> {t('events.attendees.notCheckedIn')}</>
                                    )}
                                  </Badge>
                                  <Badge variant="outline" className="rounded-lg border border-gray-200 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {t(`events.attendees.${attendee.attendance_status}`, attendee.attendance_status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{attendee.email}</p>
                                {attendee.phone && (
                                  <p className="text-sm text-gray-500 font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{attendee.phone}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1 font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {t('events.attendees.registeredOn')} {new Date(attendee.created_at).toLocaleDateString()}
                                  {attendee.checked_in_at && (
                                    <span className="ml-2">
                                      • {t('events.attendees.checkedInAt')} {new Date(attendee.checked_in_at).toLocaleString()}
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant={attendee.checked_in ? 'outline' : 'default'}
                                  size="sm"
                                  className="rounded-lg font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                  onClick={() => handleToggleCheckIn(attendee.id, attendee.checked_in)}
                                >
                                  {attendee.checked_in ? (
                                    <><X className="h-4 w-4 mr-1" /> {t('events.attendees.undo')}</>
                                  ) : (
                                    <><Check className="h-4 w-4 mr-1" /> {t('events.attendees.checkIn')}</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        attendeeCount={
          selectedAttendees.size > 0 ? selectedAttendees.size : filteredAttendees.length
        }
        onSend={handleSendEmail}
      />
    </DashboardLayout>
  );
}
