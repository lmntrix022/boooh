import React, { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Calendar, Clock, Trash2, CheckCircle, XCircle, Loader2, User, Mail, Phone, CalendarPlus, CalendarClock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, startOfWeek, addWeeks, addMinutes, parse, isValid } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ActionButtons, ActionButton } from "@/components/ui/ActionButtons";
import AppointmentNav from "@/components/appointments/AppointmentNav";
import { useLanguage } from "@/hooks/useLanguage";

type BusinessCardType = Tables<"business_cards">;
type AppointmentType = Tables<"appointments">;

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled"
};

const Appointments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [card, setCard] = useState<BusinessCardType | null>(null);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [activeTab, setActiveTab] = useState("calendar");
  
  // Calendar and booking states
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Form states
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  useEffect(() => {
 if (!id || !user) return;

 const fetchData = async () => {
 try {
 setLoading(true);
 
 // Fetch card data
 const { data: cardData, error: cardError } = await supabase
 .from("business_cards")
 .select("*")
 .eq("id", id)
 .eq("user_id", user.id)
 .single();

 if (cardError) throw cardError;
 
        if (!cardData) {
          toast({
            title: t('appointments.errors.cardNotFound'),
            description: t('appointments.errors.cardNotFoundDescription'),
            variant: "destructive",
          });
          return;
        }
 
 setCard(cardData);
 
 // Fetch appointments
 const { data: appointmentsData, error: appointmentsError } = await supabase
 .from("appointments")
 .select("*")
 .eq("card_id", id)
 .order("date", { ascending: true });
 
 if (appointmentsError) throw appointmentsError;
 
 setAppointments(appointmentsData || []);
 } catch (error: any) {
 // Error log removed
        toast({
          title: t('appointments.errors.error'),
          description: t('appointments.errors.loadError'),
          variant: "destructive",
        });
 } finally {
 setLoading(false);
 }
 };

 fetchData();
  }, [id, user, toast]);

  const handleDateSelect = (date: Date) => {
 setSelectedDate(date);
 setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
 setSelectedTime(time);
  };

  const isTimeSlotAvailable = (date: Date, timeString: string) => {
 if (!appointments.length) return true;
 
 const timeFormat = 'HH:mm';
 const timeDate = parse(timeString, timeFormat, new Date());
 
 if (!isValid(timeDate)) return false;
 
 const targetDate = new Date(date);
 targetDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
 
 return !appointments.some(appointment => {
 const appointmentDate = new Date(appointment.date);
 const appointmentEndDate = addMinutes(appointmentDate, appointment.duration || 60);
 
 return (
 appointment.status !== APPOINTMENT_STATUS.CANCELLED &&
 targetDate >= appointmentDate && 
 targetDate < appointmentEndDate
 );
 });
  };

  const nextWeek = () => {
 setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const prevWeek = () => {
 setCurrentWeek(addWeeks(currentWeek, -1));
  };

  const getWeekDays = () => {
 const days = [];
 for (let i = 0; i < 7; i++) {
 days.push(addDays(currentWeek, i));
 }
 return days;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !clientName || !clientEmail) {
      toast({
        title: t('appointments.errors.missingInfo'),
        description: t('appointments.errors.missingInfoDescription'),
        variant: "destructive",
      });
      return;
    }
 
 try {
 setSubmitLoading(true);
 
 const timeFormat = 'HH:mm';
 const timeDate = parse(selectedTime, timeFormat, new Date());
 
      if (!isValid(timeDate)) throw new Error(t('appointments.errors.invalidTimeFormat'));
 
 const appointmentDate = new Date(selectedDate);
 appointmentDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
 
 const appointmentData = {
 card_id: id,
 user_id: user?.id,
 client_name: clientName,
 client_email: clientEmail,
 client_phone: clientPhone || null,
 date: appointmentDate.toISOString(),
 duration: 60, // Default 60 minutes
 notes: notes || null,
 status: APPOINTMENT_STATUS.PENDING
 };
 
 const { data, error } = await supabase
 .from("appointments")
 .insert(appointmentData)
 .select()
 .single();
 
 if (error) throw error;
 
 // Add the new appointment to the state
 setAppointments([...appointments, data]);
 
 // Reset form
 setSelectedDate(null);
 setSelectedTime(null);
 setClientName("");
 setClientEmail("");
 setClientPhone("");
 setNotes("");
 
      toast({
        title: t('appointments.toasts.created'),
        description: t('appointments.toasts.createdDescription'),
      });
 
 // Switch to appointments tab
 setActiveTab("appointments");
 } catch (error: any) {
 // Error log removed
      toast({
        title: t('appointments.errors.error'),
        description: t('appointments.errors.createError'),
        variant: "destructive",
      });
 } finally {
 setSubmitLoading(false);
 }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
 try {
 const { error } = await supabase
 .from("appointments")
 .update({ status })
 .eq("id", appointmentId);
 
 if (error) throw error;
 
 // Update local state
 setAppointments(
 appointments.map(appointment => 
 appointment.id === appointmentId 
 ? { ...appointment, status } 
 : appointment
 )
 );
 
      toast({
        title: t('appointments.toasts.statusUpdated'),
        description: status === APPOINTMENT_STATUS.CONFIRMED 
          ? t('appointments.toasts.confirmed') 
          : t('appointments.toasts.cancelled'),
      });
 } catch (error: any) {
 // Error log removed
      toast({
        title: t('appointments.errors.error'),
        description: t('appointments.errors.updateStatusError'),
        variant: "destructive",
      });
 }
  };

  const deleteAppointment = async (appointmentId: string) => {
 try {
 const { error } = await supabase
 .from("appointments")
 .delete()
 .eq("id", appointmentId);
 
 if (error) throw error;
 
 // Update local state
 setAppointments(
 appointments.filter(appointment => appointment.id !== appointmentId)
 );
 
      toast({
        title: t('appointments.toasts.deleted'),
        description: t('appointments.toasts.deletedDescription'),
      });
 } catch (error: any) {
 // Error log removed
      toast({
        title: t('appointments.errors.error'),
        description: t('appointments.errors.deleteError'),
        variant: "destructive",
      });
 } finally {
 setAppointmentToDelete(null);
 }
  };

  const confirmDelete = (appointmentId: string) => {
 setAppointmentToDelete(appointmentId);
  };

  // If user is not logged in, redirect to login page
  if (!user && !authLoading) {
 return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          
          {/* Header Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Icon Container Minimal */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Calendar className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('appointments.title') || 'Rendez-vous'}
                  </h1>
            <p
                  className="text-sm md:text-base text-gray-600 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
            >
                  {t('appointments.description', { cardName: card?.name ? `"${card.name}"` : '' }) || 'Gérez vos rendez-vous et votre calendrier'}
            </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 md:mt-8">
            <AppointmentNav />
          </div>
 
 {loading ? (
<div className="flex justify-center items-center h-64">
  <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
</div>
 ) : (
<div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
  <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
    <div className="p-2 border-b border-gray-200">
      <TabsList className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 flex justify-center items-center gap-2 w-full sm:w-auto mx-auto">
 <TabsTrigger 
value="calendar"
          className="rounded-lg px-4 sm:px-6 py-2.5 text-gray-700 font-light flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base hover:bg-gray-50 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
>
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <span className="hidden sm:inline">{t('appointments.tabs.calendar') || 'Calendrier'}</span>
          <span className="sm:hidden">Cal.</span>
            </TabsTrigger>
            <TabsTrigger 
            value="new"
          className="rounded-lg px-4 sm:px-6 py-2.5 text-gray-700 font-light flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base hover:bg-gray-50 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
            >
          <CalendarPlus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <span className="hidden sm:inline">{t('appointments.tabs.new') || 'Nouveau'}</span>
          <span className="sm:hidden">+</span>
            </TabsTrigger>
            <TabsTrigger 
            value="appointments"
          className="rounded-lg px-4 sm:px-6 py-2.5 text-gray-700 font-light flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base hover:bg-gray-50 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
            >
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          <span className="hidden sm:inline">{t('appointments.tabs.list') || 'Liste'}</span>
          <span className="sm:hidden">Liste</span>
            </TabsTrigger>
 </TabsList>
    </div>
 
 <TabsContent value="calendar" className="p-6 md:p-8">
 <div className="space-y-6 sm:space-y-8">
<div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Button
 onClick={prevWeek}
 variant="outline"
              className="h-10 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
 >
            <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('appointments.calendar.previousWeek') || 'Semaine précédente'}</span>
              <span className="sm:hidden">Préc.</span>
            </Button>
          <h2 className="text-gray-900 text-xl sm:text-2xl md:text-3xl font-light tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            {format(currentWeek, "MMMM yyyy", { locale: currentLanguage === 'fr' ? fr : enUS })}
            </h2>
            <Button
            onClick={nextWeek}
            variant="outline"
              className="h-10 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <span className="hidden sm:inline">{t('appointments.calendar.nextWeek') || 'Semaine suivante'}</span>
              <span className="sm:hidden">Suiv.</span>
            <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
 </div>
 <div className="overflow-x-auto min-w-0">
<div className="grid grid-cols-7 min-w-[560px] gap-2 sm:gap-3 md:gap-4">
 {getWeekDays().map((day, index) => (
 <div
 key={index}
              className={`relative bg-white border rounded-lg p-3 sm:p-4 flex flex-col items-center transition-all duration-200 cursor-pointer min-w-[70px] sm:min-w-0 shadow-sm ${
                selectedDate && day.toDateString() === selectedDate.toDateString() 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
 tabIndex={0}
              aria-label={t('appointments.calendar.selectDate', { date: format(day, 'EEEE d MMMM', { locale: currentLanguage === 'fr' ? fr : enUS }) }) || `Sélectionner ${format(day, 'EEEE d MMMM', { locale: currentLanguage === 'fr' ? fr : enUS })}`}
            onClick={() => handleDateSelect(day)}
            >
              <div className={`text-xs sm:text-sm font-light mb-1 whitespace-nowrap ${
                selectedDate && day.toDateString() === selectedDate.toDateString() ? 'text-white' : 'text-gray-600'
              }`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
              >
            {format(day, "EEEE", { locale: currentLanguage === 'fr' ? fr : enUS })}
            </div>
              <div className={`text-xl sm:text-2xl font-light ${
                selectedDate && day.toDateString() === selectedDate.toDateString() ? 'text-white' : 'text-gray-900'
              }`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
              >
 {format(day, "d")}
 </div>
 </div>
 ))}
 </div>
 </div>
 {selectedDate && (
 <motion.div className="mt-6 sm:mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">{t('appointments.calendar.chooseTime', { date: format(selectedDate, "EEEE d MMMM", { locale: currentLanguage === 'fr' ? fr : enUS }) })}</h3>
 <div className="overflow-x-auto min-w-0">
 <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 min-w-[240px] sm:min-w-0">
 {TIME_SLOTS.map((time) => {
 const isAvailable = isTimeSlotAvailable(selectedDate, time);
 return (
                <motion.button
 key={time}
 disabled={!isAvailable}
                  className={`bg-white/90 backdrop-blur-xl border-2 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/20 text-sm sm:text-base min-w-[80px] sm:min-w-0 shadow-lg ${
                    selectedTime === time 
                      ? 'border-gray-900 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white scale-105 shadow-2xl' 
                      : isAvailable 
                        ? 'border-gray-200/60 hover:border-gray-300 hover:scale-105 hover:shadow-xl text-gray-900' 
                        : 'border-gray-200/40 bg-gray-100/50 text-gray-400 cursor-not-allowed'
                  }`}
                  whileHover={isAvailable ? { scale: 1.05, y: -2 } : {}}
                  whileTap={isAvailable ? { scale: 0.98 } : {}}
            onClick={() => isAvailable && handleTimeSelect(time)}
                  aria-label={t('appointments.calendar.chooseTimeSlot', { time }) || `Choisir ${time}`}
            >
 {time}
                </motion.button>
 );
 })}
 </div>
 </div>
 {selectedTime && (
            <motion.div 
              className="mt-6 sm:mt-8 flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
            onClick={() => setActiveTab("new")}
                  className="h-12 md:h-14 px-8 md:px-10 rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white font-black text-base md:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
                  aria-label={t('appointments.actions.continue') || 'Continuer'}
            >
                  {t('appointments.actions.continue') || 'Continuer'}
                </Button>
              </motion.div>
            </motion.div>
 )}
 </motion.div>
 )}
 </div>
 </TabsContent>
 
 <TabsContent value="new" className="p-6 md:p-8">
<div className="max-w-2xl mx-auto">
 <h2
            className="text-gray-900 text-2xl sm:text-3xl md:text-4xl font-light mb-6 sm:mb-8"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
            >
            {t('appointments.newAppointment.title') || 'Nouveau rendez-vous'}
            </h2>
            {selectedDate && selectedTime ? (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 flex items-center gap-3 border border-gray-200">
            <Calendar className="h-6 w-6 text-gray-600" />
            <div>
            <p className="font-light text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: currentLanguage === 'fr' ? fr : enUS })}
            </p>
            <p className="text-sm text-gray-700 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >{t('appointments.newAppointment.at')} {selectedTime}</p>
            </div>
            </div>
            ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 p-6 rounded-lg mb-6 flex flex-col items-center text-center">
            <Calendar className="h-8 w-8 text-gray-600 mb-2" />
            <p className="text-gray-900 text-base font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >{t('appointments.newAppointment.selectDateMessage')}</p>
            </div>
            )}
<div className="space-y-6">
 <div className="space-y-2">
            <Label htmlFor="client-name" className="text-sm font-light text-gray-700 mb-2 block"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('appointments.form.clientName') || 'Nom du client'} <span className="text-red-500">*</span>
            </Label>
            <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
              placeholder={t('appointments.form.clientNamePlaceholder') || 'Nom complet'}
            required
              className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="client-email" className="text-sm font-light text-gray-700 mb-2 block"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('appointments.form.clientEmail') || 'Email du client'} <span className="text-red-500">*</span>
            </Label>
            <Input
            id="client-email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
              placeholder={t('appointments.form.clientEmailPlaceholder') || 'email@exemple.com'}
            required
              className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="client-phone" className="text-sm font-light text-gray-700 mb-2 block"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('appointments.form.clientPhone') || 'Téléphone du client'}
            </Label>
            <Input
            id="client-phone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
              placeholder={t('appointments.form.clientPhonePlaceholder') || '+33 6 12 34 56 78'}
              className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-light text-gray-700 mb-2 block"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('appointments.form.notes') || 'Notes'}
            </Label>
            <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
              placeholder={t('appointments.form.notesPlaceholder') || 'Notes supplémentaires...'}
              rows={4}
              className="bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm resize-none"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
 </div>
<div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
              <Button
 variant="outline"
                className="h-12 px-6 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
            onClick={() => setActiveTab("calendar")}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            >
                {t('appointments.actions.back') || 'Retour'}
              </Button>
              <Button
                className="h-12 px-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm transition-all duration-200"
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || !clientName || !clientEmail || submitLoading}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('appointments.actions.creating') || 'Création...'}
                  </>
                ) : (
                  t('appointments.actions.create') || 'Créer'
                )}
              </Button>
 </div>
 </div>
 </div>
 </TabsContent>
 
<TabsContent value="appointments" className="p-6 md:p-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-6 sm:mb-8"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('appointments.list.title') || 'Liste des rendez-vous'}
            </h2>
            
            {appointments.length === 0 ? (
            <div className="relative bg-white border border-gray-200 rounded-lg p-8 sm:p-12 md:p-16 text-center shadow-sm">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mx-auto mb-6">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-light text-gray-900 mb-3"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('appointments.list.noAppointments') || 'Aucun rendez-vous'}
            </h3>
              <p className="text-gray-600 font-light mb-6 sm:mb-8"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {t('appointments.list.noAppointmentsDescription') || 'Commencez par planifier votre premier rendez-vous'}
            </p>
            <Button
            onClick={() => setActiveTab("calendar")}
                  className="h-12 px-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm transition-all duration-200"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            >
                  {t('appointments.list.scheduleAppointment') || 'Planifier un rendez-vous'}
            </Button>
            </div>
 ) : (
<div className="space-y-4 sm:space-y-6">
 {appointments
 .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
.map((appointment, index) => (
<div
key={appointment.id}
className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
>
<div className={`px-4 sm:px-6 py-3 border-b border-gray-200 ${
appointment.status === APPOINTMENT_STATUS.CONFIRMED
? "bg-gray-50"
: appointment.status === APPOINTMENT_STATUS.CANCELLED
? "bg-gray-50"
: "bg-gray-50"
}`}>
<div className="flex items-center gap-2">
{appointment.status === APPOINTMENT_STATUS.CONFIRMED ? (
<CheckCircle className="h-5 w-5 text-gray-600" />
) : appointment.status === APPOINTMENT_STATUS.CANCELLED ? (
<XCircle className="h-5 w-5 text-gray-600" />
) : (
<Clock className="h-5 w-5 text-gray-600" />
)}
<span className="text-sm font-light text-gray-700"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>
            {appointment.status === APPOINTMENT_STATUS.CONFIRMED
? t('appointments.status.confirmed') || 'Confirmé'
            : appointment.status === APPOINTMENT_STATUS.CANCELLED
? t('appointments.status.cancelled') || 'Annulé'
: t('appointments.status.pending') || 'En attente'}
</span>
</div>
 </div>
<div className="p-4 sm:p-6">
<div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 sm:gap-6">
<div className="flex-1 min-w-0">
<div className="flex items-center gap-2 mb-3">
<div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
<Calendar className="h-5 w-5 text-gray-600" />
</div>
<div>
<div className="text-lg sm:text-xl font-light text-gray-900"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    fontWeight: 300,
  }}
>
            {format(new Date(appointment.date), "EEEE d MMMM yyyy", { locale: currentLanguage === 'fr' ? fr : enUS })}
            </div>
<div className="flex items-center text-gray-600 font-light text-sm sm:text-base mt-1"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>
 <Clock className="h-4 w-4 mr-2" />
 {format(new Date(appointment.date), "HH:mm")}
</div>
</div>
 </div>
 
<div className="space-y-2 mt-4 sm:mt-6">
<div className="flex items-center gap-2 text-sm sm:text-base">
<div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
<User className="h-4 w-4 text-gray-600" />
</div>
<span className="font-light text-gray-900"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{appointment.client_name}</span>
 </div>
<div className="flex items-center gap-2 text-sm sm:text-base">
<div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
<Mail className="h-4 w-4 text-gray-600" />
</div>
<span className="font-light text-gray-700"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{appointment.client_email}</span>
 </div>
 {appointment.client_phone && (
<div className="flex items-center gap-2 text-sm sm:text-base">
<div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
<Phone className="h-4 w-4 text-gray-600" />
</div>
<span className="font-light text-gray-700"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{appointment.client_phone}</span>
 </div>
 )}
 </div>
 
 {appointment.notes && (
<div className="mt-4 sm:mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
<p className="text-sm text-gray-700 font-light"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{appointment.notes}</p>
 </div>
 )}
 </div>
 
<div className="flex flex-col gap-2 sm:gap-3 lg:min-w-[200px]">
 {appointment.status === APPOINTMENT_STATUS.PENDING && (
 <>
            <Button
            size="sm"
className="h-10 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
            onClick={() => updateAppointmentStatus(appointment.id, APPOINTMENT_STATUS.CONFIRMED)}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            >
            <CheckCircle className="h-4 w-4 mr-2" />
{t('appointments.actions.confirm') || 'Confirmer'}
            </Button>
            <Button
            size="sm"
            variant="outline"
className="h-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-light shadow-sm"
            onClick={() => updateAppointmentStatus(appointment.id, APPOINTMENT_STATUS.CANCELLED)}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            >
            <XCircle className="h-4 w-4 mr-2" />
{t('appointments.actions.cancel') || 'Annuler'}
            </Button>
            </>
            )}
            <Button
            size="sm"
            variant="ghost"
className="h-10 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 font-light"
            onClick={() => confirmDelete(appointment.id)}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
            >
            <Trash2 className="h-4 w-4 mr-2" />
{t('appointments.actions.delete') || 'Supprimer'}
            </Button>
</div>
 </div>
 </div>
</div>
))}
 </div>
 )}
 </div>
 </TabsContent>
 </Tabs>
</div>
 )}
        </div>
      </div>
      </div>

      {/* Dialogue de confirmation de suppression */}
      <ConfirmDialog
        open={!!appointmentToDelete}
        onOpenChange={(open) => !open && setAppointmentToDelete(null)}
        title={t('appointments.deleteDialog.title')}
        description={t('appointments.deleteDialog.description')}
        confirmText={t('appointments.deleteDialog.confirm')}
        cancelText={t('appointments.deleteDialog.cancel')}
        onConfirm={() => appointmentToDelete && deleteAppointment(appointmentToDelete)}
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default Appointments;