import React from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Settings } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
          
          {/* Header Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
              <div className="relative z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Icon Container Apple Minimal */}
                  <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Settings className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600 relative z-10" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {t('settings.title')}
                    </h1>
                    <p
                      className="text-sm md:text-base font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SettingsPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
