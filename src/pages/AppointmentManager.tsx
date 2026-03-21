import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarClock, Loader2 } from "lucide-react";
import AppointmentDashboard from "@/components/appointments/AppointmentDashboard";
import AppointmentNav from "@/components/appointments/AppointmentNav";
import { useLanguage } from "@/hooks/useLanguage";

const AppointmentManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [cardName, setCardName] = useState<string>("");

  useEffect(() => {
 if (!id || !user) return;

 const fetchData = async () => {
 try {
 // Check if the user owns this card
 const { data: cardData, error: cardError } = await supabase
 .from("business_cards")
 .select("user_id, name")
 .eq("id", id)
 .single();

 if (cardError) throw cardError;
 // Type guard to ensure cardData has the proper shape
 if (!cardData || typeof cardData !== "object" || cardData === null) {
   throw new Error("Invalid card data");
 }
 setCardName((cardData as { name?: string }).name || "");

 // If the user doesn't own this card, redirect to dashboard
 if ((cardData as { user_id?: string }).user_id !== user.id) {
      toast({
        title: t('appointmentManager.errors.accessDenied'),
        description: t('appointmentManager.errors.accessDeniedDescription'),
        variant: "destructive",
      });
 navigate("/dashboard");
 return;
 }
 } catch (error: any) {
 // Error log removed
        toast({
          title: t('appointmentManager.errors.error'),
          description: t('appointmentManager.errors.loadError'),
          variant: "destructive",
        });
 navigate("/dashboard");
 } finally {
 setLoading(false);
 }
 };

 fetchData();
  }, [id, user, navigate, toast]);

  if (loading) {
 return (
 <DashboardLayout>
        <div className="relative min-h-screen bg-white overflow-x-hidden">
          <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex justify-center items-center min-h-[70vh]">
              <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
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
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Icon Container Minimal */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <CalendarClock className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('appointmentManager.title') || 'Gestion des rendez-vous'}
                  </h1>
            <p className="text-sm md:text-base text-gray-600 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
            >
                  {t('appointmentManager.description') || 'Gérez les rendez-vous de'} <span className="font-light text-gray-900">{cardName}</span>.
            </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 md:mt-8">
            <AppointmentNav />
          </div>

 {/* Dashboard */}
 {id && <AppointmentDashboard cardId={id} cardName={cardName} />}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentManager;
