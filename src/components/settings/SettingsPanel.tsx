import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CurrencySelector } from './CurrencySelector';
import { LanguageSelector } from './LanguageSelector';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings,
  Bell,
  Globe,
  Palette,
  Shield,
  Mail,
  CreditCard,
  Store,
  Building2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  ShoppingCart,
  Sparkles
} from "lucide-react";
import { PaymentProviderSettings } from './PaymentProviderSettings';
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NOTIFICATION_SETTINGS_KEY = 'app_notification_settings';
const APPEARANCE_SETTINGS_KEY = 'app_appearance_settings';

interface NotificationSettings {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  orderNotifications: boolean;
  marketingEmails: boolean;
}

interface AppearanceSettings {
  darkMode: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
}

interface BusinessInfo {
  company_name: string;
  siret: string;
  address: string;
  business_email: string;
  business_phone: string;
}

export const SettingsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // État pour les notifications
  const [notificationSettings, setNotificationSettings] = React.useState<NotificationSettings>(() => {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      emailNotifications: true,
      appointmentReminders: true,
      orderNotifications: true,
      marketingEmails: false
    };
  });

  // État pour l'apparence
  const [appearanceSettings, setAppearanceSettings] = React.useState<AppearanceSettings>(() => {
    const stored = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      darkMode: false,
      compactMode: false,
      animationsEnabled: true
    };
  });

  // État pour les informations d'entreprise
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    company_name: '',
    siret: '',
    address: '',
    business_email: '',
    business_phone: ''
  });

  // Charger les informations d'entreprise depuis le profil
  useEffect(() => {
    const loadBusinessInfo = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data && 'metadata' in data && data.metadata) {
          const metadata = typeof data.metadata === 'string'
            ? JSON.parse(data.metadata)
            : data.metadata;

          if (metadata && typeof metadata === 'object' && metadata.business_info) {
            setBusinessInfo(prev => ({
              ...prev,
              ...metadata.business_info
            }));
          }
        }
      } catch (error) {
        // Silently fail - la colonne metadata pourrait ne pas exister encore
        console.debug('Could not load business info:', error);
      }
    };

    loadBusinessInfo();
  }, [user?.id]);

  // Gestionnaire de changement pour les notifications
  const handleNotificationChange = (key: keyof NotificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    setNotificationSettings(newSettings);
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));

    toast({
      title: t('settings.settingsUpdated'),
      description: t('settings.notificationSettingsUpdated'),
    });
  };

  // Gestionnaire de changement pour l'apparence
  const handleAppearanceChange = (key: keyof AppearanceSettings) => {
    const newSettings = {
      ...appearanceSettings,
      [key]: !appearanceSettings[key]
    };
    setAppearanceSettings(newSettings);
    localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(newSettings));

    toast({
      title: t('settings.settingsUpdated'),
      description: t('settings.appearanceSettingsUpdated'),
    });
  };

  // Sauvegarder les informations d'entreprise
  const handleSaveBusinessInfo = async () => {
    if (!user?.id) return;

    setIsSavingBusiness(true);
    try {
      // Récupérer le profil actuel
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Récupérer les métadonnées existantes (ou initialiser à {})
      let currentMetadata: any = {};
      if (currentProfile && 'metadata' in currentProfile && currentProfile.metadata) {
        currentMetadata = typeof currentProfile.metadata === 'string'
          ? JSON.parse(currentProfile.metadata)
          : currentProfile.metadata;
      }

      // Mettre à jour avec les nouvelles informations d'entreprise
      const updatedMetadata = {
        ...currentMetadata,
        business_info: businessInfo
      };

      const { error } = await supabase
        .from('profiles')
        .update({ metadata: updatedMetadata } as any)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t('settings.businessInfoSaved'),
        description: t('settings.businessInfoSavedDescription'),
      });
    } catch (error: any) {
      toast({
        title: t('settings.businessInfoError'),
        description: error.message || t('settings.businessInfoErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsSavingBusiness(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Tabs Apple Minimal */}
      <div className="mb-6 md:mb-8">
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-2 overflow-x-auto">
          <TabsList className="bg-transparent border-0 p-0 gap-2 flex md:grid md:grid-cols-5 w-full min-w-max md:min-w-0">
            <TabsTrigger
              value="general"
              className="rounded-lg px-4 py-3 text-xs sm:text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.general')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-lg px-4 py-3 text-xs sm:text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-lg px-4 py-3 text-xs sm:text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="business"
              className="rounded-lg px-4 py-3 text-xs sm:text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.business')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="rounded-lg px-4 py-3 text-xs sm:text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.integrations')}</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="general">
        <div className="grid gap-6">
          <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3
                    className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('settings.generalSettings')}
                  </h3>
                  <p
                    className="text-sm text-gray-500 font-light mt-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('settings.generalSettingsDescription')}
                  </p>
                </div>
              </div>
              <div className="h-px bg-gray-200 mb-6" />
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                    </div>
                    <Label
                      className="text-base font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.currency')}
                    </Label>
                  </div>
                  <p
                    className="text-sm text-gray-500 font-light mb-4 ml-[52px]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('settings.currencyDescription')}
                  </p>
                  <div className="ml-[52px]">
                    <CurrencySelector />
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-6" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-gray-600" />
                    </div>
                    <Label
                      className="text-base font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.language')}
                    </Label>
                  </div>
                  <p
                    className="text-sm text-gray-500 font-light mb-4 ml-[52px]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('settings.languageDescription')}
                  </p>
                  <div className="ml-[52px]">
                    <LanguageSelector />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notifications">
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Bell className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3
                  className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('settings.notificationPreferences')}
                </h3>
                <p
                  className="text-sm text-gray-500 font-light mt-1"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('settings.notificationPreferencesDescription')}
                </p>
              </div>
            </div>
            <div className="h-px bg-gray-200 mb-6" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <Label
                      className="text-base font-light text-gray-900 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.emailNotifications')}
                    </Label>
                    <p
                      className="text-sm text-gray-500 font-light mt-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.emailNotificationsDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationChange('emailNotifications')}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <Label
                      className="text-base font-light text-gray-900 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.appointmentReminders')}
                    </Label>
                    <p
                      className="text-sm text-gray-500 font-light mt-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.appointmentRemindersDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.appointmentReminders}
                  onCheckedChange={() => handleNotificationChange('appointmentReminders')}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <Label
                      className="text-base font-light text-gray-900 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.orderNotifications')}
                    </Label>
                    <p
                      className="text-sm text-gray-500 font-light mt-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.orderNotificationsDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.orderNotifications}
                  onCheckedChange={() => handleNotificationChange('orderNotifications')}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <Label
                      className="text-base font-light text-gray-900 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.marketingEmails')}
                    </Label>
                    <p
                      className="text-sm text-gray-500 font-light mt-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.marketingEmailsDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={() => handleNotificationChange('marketingEmails')}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="appearance">
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Palette className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3
                  className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('settings.appearance')}
                </h3>
                <p
                  className="text-sm text-gray-500 font-light mt-1"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('settings.appearanceDescription')}
                </p>
              </div>
            </div>
            <div className="h-px bg-gray-200 mb-6" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Palette className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <Label
                      className="text-base font-light text-gray-900 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.darkMode')}
                    </Label>
                    <p
                      className="text-sm text-gray-500 font-light mt-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.darkModeDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={appearanceSettings.darkMode}
                  onCheckedChange={() => handleAppearanceChange('darkMode')}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <Label
                      className="text-base font-light text-gray-900 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.compactMode')}
                    </Label>
                    <p
                      className="text-sm text-gray-500 font-light mt-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.compactModeDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={appearanceSettings.compactMode}
                  onCheckedChange={() => handleAppearanceChange('compactMode')}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <Label
                      className="text-base font-light text-gray-900 cursor-pointer"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.animations')}
                    </Label>
                    <p
                      className="text-sm text-gray-500 font-light mt-1"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.animationsDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={appearanceSettings.animationsEnabled}
                  onCheckedChange={() => handleAppearanceChange('animationsEnabled')}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="business">
        <div className="grid gap-6">
          <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3
                    className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('settings.businessInfo')}
                  </h3>
                  <p
                    className="text-sm text-gray-500 font-light mt-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('settings.businessInfoDescription')}
                  </p>
                </div>
              </div>
              <div className="h-px bg-gray-200 mb-6" />
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.companyName')}
                    </Label>
                    <Input
                      placeholder={t('settings.companyName')}
                      value={businessInfo.company_name}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, company_name: e.target.value }))}
                      className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.siret')}
                    </Label>
                    <Input
                      placeholder="12345678900000"
                      value={businessInfo.siret}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, siret: e.target.value }))}
                      className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.address')}
                    </Label>
                    <Input
                      placeholder={t('settings.address')}
                      value={businessInfo.address}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.businessEmail')}
                    </Label>
                    <Input
                      type="email"
                      placeholder="contact@entreprise.com"
                      value={businessInfo.business_email}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_email: e.target.value }))}
                      className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      className="text-sm font-light text-gray-700 mb-2 block"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('settings.businessPhone')}
                    </Label>
                    <Input
                      type="tel"
                      placeholder="+241 62 42 34 58"
                      value={businessInfo.business_phone}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, business_phone: e.target.value }))}
                      className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveBusinessInfo}
                    disabled={isSavingBusiness}
                    className="h-12 px-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {isSavingBusiness ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t('settings.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        {t('settings.saveBusinessInfo')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="integrations">
        <PaymentProviderSettings />
      </TabsContent>
    </Tabs>
  );
};
