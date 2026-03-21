/**
 * Appointment Settings Page
 * Allows card owners to configure availability, working hours, timezone, and notification preferences
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Bell, Globe, Calendar, Save, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  getAvailabilitySettings,
  saveAvailabilitySettings,
  COMMON_TIMEZONES,
  DEFAULT_WORKING_HOURS,
  type AvailabilitySettings,
  type WorkingHours,
  type TimeSlot,
} from "@/services/availabilityService";
import AppointmentNav from "@/components/appointments/AppointmentNav";
import { useLanguage } from "@/hooks/useLanguage";

// DAYS_OF_WEEK will be defined dynamically with translations

const AppointmentSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Define DAYS_OF_WEEK dynamically with translations
  const DAYS_OF_WEEK = [
    { key: "monday", label: t('appointmentSettings.days.monday') },
    { key: "tuesday", label: t('appointmentSettings.days.tuesday') },
    { key: "wednesday", label: t('appointmentSettings.days.wednesday') },
    { key: "thursday", label: t('appointmentSettings.days.thursday') },
    { key: "friday", label: t('appointmentSettings.days.friday') },
    { key: "saturday", label: t('appointmentSettings.days.saturday') },
    { key: "sunday", label: t('appointmentSettings.days.sunday') },
  ] as const;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<AvailabilitySettings>>({
 working_hours: DEFAULT_WORKING_HOURS,
 timezone: "UTC",
 default_duration: 60,
 buffer_time: 0,
 min_booking_notice: 60,
 max_booking_advance: 30,
 notify_owner_new_appointment: true,
 notify_owner_cancellation: true,
 notify_client_confirmation: true,
 notify_client_reminder: true,
 reminder_times: [1440, 60], // 24h and 1h
  });

  useEffect(() => {
 if (!id || !user) return;

 const loadSettings = async () => {
 try {
 setLoading(true);
 const existingSettings = await getAvailabilitySettings(id);

 if (existingSettings) {
 setSettings(existingSettings);
 } else {
 // Initialize with defaults
 setSettings((prev) => ({ ...prev, card_id: id, user_id: user.id }));
 }
 } catch (error) {
 console.error("Failed to load settings:", error);
        toast({
          title: t('appointmentSettings.errors.error'),
          description: t('appointmentSettings.errors.loadError'),
          variant: "destructive",
        });
 } finally {
 setLoading(false);
 }
 };

 loadSettings();
  }, [id, user, toast]);

  const handleSave = async () => {
 if (!id) return;

 setSaving(true);
 try {
 await saveAvailabilitySettings({
 ...settings,
 card_id: id,
 user_id: user?.id,
 });

      toast({
        title: t('appointmentSettings.toasts.saved'),
        description: t('appointmentSettings.toasts.savedDescription'),
      });
 } catch (error) {
 console.error("Failed to save settings:", error);
        toast({
          title: t('appointmentSettings.errors.error'),
          description: t('appointmentSettings.errors.saveError'),
          variant: "destructive",
        });
 } finally {
 setSaving(false);
 }
  };

  const addTimeSlot = (day: keyof WorkingHours) => {
 setSettings((prev) => ({
 ...prev,
 working_hours: {
 ...prev.working_hours!,
 [day]: [
 ...(prev.working_hours?.[day] || []),
 { start: "09:00", end: "17:00" },
 ],
 },
 }));
  };

  const removeTimeSlot = (day: keyof WorkingHours, index: number) => {
 setSettings((prev) => ({
 ...prev,
 working_hours: {
 ...prev.working_hours!,
 [day]: prev.working_hours![day].filter((_, i) => i !== index),
 },
 }));
  };

  const updateTimeSlot = (
 day: keyof WorkingHours,
 index: number,
 field: "start" | "end",
 value: string
  ) => {
 setSettings((prev) => ({
 ...prev,
 working_hours: {
 ...prev.working_hours!,
 [day]: prev.working_hours![day].map((slot, i) =>
 i === index ? { ...slot, [field]: value } : slot
 ),
 },
 }));
  };

  if (loading) {
 return (
 <DashboardLayout>
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
          <div className="relative z-10 container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex justify-center items-center min-h-[400px]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
 <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
            </motion.div>
          </div>
 </div>
 </DashboardLayout>
 );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          
          {/* Header Apple Minimal */}
 <motion.div
            className="mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                  {/* Icon Container Minimal */}
                  <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Clock className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('appointmentSettings.title') || 'Paramètres des rendez-vous'}
                    </h1>
            <p className="text-sm md:text-base text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
            >
                      {t('appointmentSettings.description') || 'Configurez vos horaires, fuseau horaire et notifications'}
            </p>
                  </div>
                </div>

                <div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-6 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm transition-all duration-200"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {saving ? (
                    <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t('appointmentSettings.actions.saving') || 'Enregistrement...'}
                    </>
                    ) : (
                    <>
                    <Save className="mr-2 h-5 w-5" />
                            {t('appointmentSettings.actions.save') || 'Enregistrer'}
                    </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

 {/* Navigation */}
 <AppointmentNav />

 <div>
 <Tabs defaultValue="hours" className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto bg-transparent">
              <TabsTrigger
              value="hours"
                    className="rounded-lg px-4 py-2.5 text-gray-700 font-light flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base hover:bg-gray-50 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              >
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="hidden sm:inline">{t('appointmentSettings.tabs.hours') || 'Horaires'}</span>
                    <span className="sm:hidden">Hor.</span>
              </TabsTrigger>
              <TabsTrigger
              value="general"
                    className="rounded-lg px-4 py-2.5 text-gray-700 font-light flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base hover:bg-gray-50 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              >
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="hidden sm:inline">{t('appointmentSettings.tabs.general') || 'Général'}</span>
                    <span className="sm:hidden">Gén.</span>
              </TabsTrigger>
              <TabsTrigger
              value="timezone"
                    className="rounded-lg px-4 py-2.5 text-gray-700 font-light flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base hover:bg-gray-50 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              >
                    <Globe className="h-4 w-4 text-gray-600" />
                    <span className="hidden sm:inline">{t('appointmentSettings.tabs.timezone') || 'Fuseau'}</span>
                    <span className="sm:hidden">Fus.</span>
              </TabsTrigger>
              <TabsTrigger
              value="notifications"
                    className="rounded-lg px-4 py-2.5 text-gray-700 font-light flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base hover:bg-gray-50 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              >
                    <Bell className="h-4 w-4 text-gray-600" />
                    <span className="hidden sm:inline">{t('appointmentSettings.tabs.notifications') || 'Notifications'}</span>
                    <span className="sm:hidden">Notif.</span>
              </TabsTrigger>
 </TabsList>
              </div>

 {/* Working Hours Tab */}
              <TabsContent value="hours" className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.workingHours.title') || 'Horaires de travail'}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.workingHours.description') || 'Définissez vos heures de disponibilité pour chaque jour de la semaine'}
                      </p>
                    </div>
                    <div className="space-y-6">
                      {DAYS_OF_WEEK.map(({ key, label }, dayIndex) => (
                        <div
                          key={key}
                          className="space-y-4 p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <Label className="text-base sm:text-lg font-light text-gray-900"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                              }}
                            >{label}</Label>
                            <Button
            type="button"
            size="sm"
            onClick={() => addTimeSlot(key)}
                                className="h-10 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            >
                                <Plus className="h-4 w-4 mr-2" />
                                {t('appointmentSettings.workingHours.addSlot') || 'Ajouter un créneau'}
            </Button>
 </div>

            {settings.working_hours?.[key]?.length === 0 ? (
                            <p className="text-sm text-gray-500 font-light italic text-center py-4"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('appointmentSettings.workingHours.dayOff') || 'Jour de repos'}
                            </p>
            ) : (
                            <div className="space-y-3">
 {settings.working_hours?.[key]?.map((slot: TimeSlot, index: number) => (
                                <div
                                  key={index}
                                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                                >
 <Input
 type="time"
 value={slot.start}
                                    onChange={(e) => updateTimeSlot(key, index, "start", e.target.value)}
                                    className="h-11 sm:w-32 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            />
                                  <span className="text-gray-700 font-light text-sm sm:text-base"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                                  >{t('appointmentSettings.workingHours.to') || 'à'}</span>
            <Input
 type="time"
 value={slot.end}
                                    onChange={(e) => updateTimeSlot(key, index, "end", e.target.value)}
                                    className="h-11 sm:w-32 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                                  />
                                  <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={() => removeTimeSlot(key, index)}
                                      className="h-11 w-11 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700"
 >
                                      <Trash2 className="h-4 w-4" />
 </Button>
                                </div>
 ))}
 </div>
 )}
                        </div>
                      ))}
                    </div>
 </div>
                </div>
 </TabsContent>

 {/* General Settings Tab */}
              <TabsContent value="general" className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.general.title') || 'Paramètres généraux'}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.general.description') || 'Configurez les paramètres par défaut pour vos rendez-vous'}
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
 <div className="space-y-2">
                          <Label htmlFor="duration" className="text-sm font-light text-gray-700 mb-2 block"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('appointmentSettings.general.defaultDuration') || 'Durée par défaut'}
                          </Label>
 <Input
 id="duration"
 type="number"
 min="15"
 step="15"
 value={settings.default_duration}
                            onChange={(e) => setSettings({ ...settings, default_duration: parseInt(e.target.value) })}
                            className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
 />
 </div>

 <div className="space-y-2">
                          <Label htmlFor="buffer" className="text-sm font-light text-gray-700 mb-2 block"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('appointmentSettings.general.bufferTime') || 'Temps de tampon'}
                          </Label>
 <Input
 id="buffer"
 type="number"
 min="0"
 step="5"
 value={settings.buffer_time}
                            onChange={(e) => setSettings({ ...settings, buffer_time: parseInt(e.target.value) })}
                            className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
 />
 </div>
 </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
 <div className="space-y-2">
                          <Label htmlFor="min-notice" className="text-sm font-light text-gray-700 mb-2 block"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('appointmentSettings.general.minNotice') || 'Délai minimum'}
                          </Label>
 <Input
 id="min-notice"
 type="number"
 min="0"
 step="30"
 value={settings.min_booking_notice}
                            onChange={(e) => setSettings({ ...settings, min_booking_notice: parseInt(e.target.value) })}
                            className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
 />
                          <p className="text-xs text-gray-600 font-light mt-1"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                          >
                            {t('appointmentSettings.general.minNoticeDescription') || 'Temps minimum avant qu\'un rendez-vous puisse être réservé'}
            </p>
 </div>

 <div className="space-y-2">
                          <Label htmlFor="max-advance" className="text-sm font-light text-gray-700 mb-2 block"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('appointmentSettings.general.maxAdvance') || 'Délai maximum'}
                          </Label>
 <Input
 id="max-advance"
 type="number"
 min="1"
 max="365"
 value={settings.max_booking_advance}
                            onChange={(e) => setSettings({ ...settings, max_booking_advance: parseInt(e.target.value) })}
                            className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
 />
                          <p className="text-xs text-gray-600 font-light mt-1"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                          >
                            {t('appointmentSettings.general.maxAdvanceDescription') || 'Nombre de jours à l\'avance pour réserver'}
            </p>
 </div>
 </div>
                    </div>
                  </div>
                </div>
 </TabsContent>

 {/* Timezone Tab */}
              <TabsContent value="timezone" className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.timezone.title') || 'Fuseau horaire'}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.timezone.description') || 'Sélectionnez votre fuseau horaire pour afficher les heures correctement'}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="timezone" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.timezone.label') || 'Fuseau horaire'}
                      </Label>
            <Select
            value={settings.timezone}
                        onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
                        <SelectTrigger
                          id="timezone"
                          className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
                        >
                          <SelectValue placeholder={t('appointmentSettings.timezone.placeholder') || 'Sélectionner un fuseau horaire'} />
 </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-sm">
 {COMMON_TIMEZONES.map((tz) => (
 <SelectItem
                key={tz.value}
                value={tz.value}
                              className="hover:bg-gray-50 cursor-pointer transition-all duration-200 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
              >
                {tz.label}
              </SelectItem>
 ))}
 </SelectContent>
 </Select>
                      <p className="text-xs text-gray-600 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                      >
                        {t('appointmentSettings.timezone.help') || 'Le fuseau horaire est utilisé pour afficher et gérer les heures de rendez-vous'}
            </p>
 </div>
                  </div>
                </div>
 </TabsContent>

 {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.notifications.title') || 'Notifications'}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('appointmentSettings.notifications.description') || 'Configurez les notifications pour vous et vos clients'}
            </p>
 </div>
                    
                    <div className="space-y-4">
                      {[
                        {
                          id: "notify-new",
                          label: t('appointmentSettings.notifications.newAppointment') || 'Nouveau rendez-vous',
                          description: t('appointmentSettings.notifications.newAppointmentDescription') || 'Recevoir une notification lorsqu\'un nouveau rendez-vous est réservé',
                          checked: settings.notify_owner_new_appointment,
                          onChange: (checked: boolean) => setSettings({ ...settings, notify_owner_new_appointment: checked }),
                        },
                        {
                          id: "notify-cancel",
                          label: t('appointmentSettings.notifications.cancellation') || 'Annulation',
                          description: t('appointmentSettings.notifications.cancellationDescription') || 'Recevoir une notification lorsqu\'un rendez-vous est annulé',
                          checked: settings.notify_owner_cancellation,
                          onChange: (checked: boolean) => setSettings({ ...settings, notify_owner_cancellation: checked }),
                        },
                        {
                          id: "notify-client-confirm",
                          label: t('appointmentSettings.notifications.clientConfirmation') || 'Confirmation client',
                          description: t('appointmentSettings.notifications.clientConfirmationDescription') || 'Envoyer une confirmation par email au client',
                          checked: settings.notify_client_confirmation,
                          onChange: (checked: boolean) => setSettings({ ...settings, notify_client_confirmation: checked }),
                        },
                        {
                          id: "notify-client-reminder",
                          label: t('appointmentSettings.notifications.clientReminders') || 'Rappels client',
                          description: t('appointmentSettings.notifications.clientRemindersDescription') || 'Envoyer des rappels par email au client avant le rendez-vous',
                          checked: settings.notify_client_reminder,
                          onChange: (checked: boolean) => setSettings({ ...settings, notify_client_reminder: checked }),
                        },
                      ].map((notification, index) => (
                        <div
                          key={notification.id}
                          className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <Label htmlFor={notification.id} className="text-sm sm:text-base font-light text-gray-900 cursor-pointer mb-1 block"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                            >
                              {notification.label}
            </Label>
                            <p className="text-xs sm:text-sm text-gray-600 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                            >
                              {notification.description}
            </p>
 </div>
 <Switch
                            id={notification.id}
                            checked={notification.checked}
                            onCheckedChange={notification.onChange}
                            className="data-[state=checked]:bg-gray-900 flex-shrink-0"
                          />
                        </div>
                      ))}
 </div>
 </div>
                </div>
 </TabsContent>
 </Tabs>

            <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="lg"
                  className="h-12 px-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm transition-all duration-200"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
                >
            {saving ? (
            <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('appointmentSettings.actions.saving') || 'Enregistrement...'}
            </>
            ) : (
            <>
                      <Save className="mr-2 h-5 w-5" />
                      {t('appointmentSettings.actions.saveChanges') || 'Enregistrer les modifications'}
            </>
            )}
 </Button>
            </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentSettings;
