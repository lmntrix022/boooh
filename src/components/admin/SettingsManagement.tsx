import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brush, Mail, Shield, Globe, Bell, DollarSign, Settings, BookOpen, RefreshCw } from 'lucide-react';
import { FormField, Form, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

interface SettingsFormValues {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportEmail: string;
  allowSignups: boolean;
  enableMaintenance: boolean;
  maintenanceMessage: string;
  defaultCurrency: string;
  defaultLanguage: string;
  termsUrl: string;
  privacyUrl: string;
  analyticsId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

const defaultSettings: SettingsFormValues = {
  siteName: 'Booh',
  siteDescription: 'Plateforme de cartes de visite digitales personnalisables',
  contactEmail: 'contact@boohcards.com',
  supportEmail: 'support@boohcards.com',
  allowSignups: true,
  enableMaintenance: false,
  maintenanceMessage: 'Notre site est actuellement en maintenance. Nous serons de retour très bientôt !',
  defaultCurrency: 'EUR',
  defaultLanguage: 'fr',
  termsUrl: '/terms',
  privacyUrl: '/privacy',
  analyticsId: 'UA-12345678-1',
  emailNotifications: true,
  pushNotifications: false
};

const SettingsManagement: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState('general');
  
  // Formulaire avec react-hook-form
  const form = useForm<SettingsFormValues>({
    defaultValues: defaultSettings
  });

  // Charger les vrais paramètres depuis la base de données
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value, description');

      if (error) {
        // Error log removed
        return defaultSettings;
      }

      // Type assertion: Supabase types may not include this table
      type SettingRow = {
        key: string;
        value: string | boolean;
        description?: string;
      };

      const rawData = (data || []) as unknown as SettingRow[];

      // Transformer les données de la base en format attendu
      const settingsMap = rawData.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);
      
      return {
        siteName: settingsMap.site_name || defaultSettings.siteName,
        siteDescription: settingsMap.site_description || defaultSettings.siteDescription,
        contactEmail: settingsMap.contact_email || defaultSettings.contactEmail,
        supportEmail: settingsMap.support_email || defaultSettings.supportEmail,
        allowSignups: settingsMap.allow_signups || defaultSettings.allowSignups,
        enableMaintenance: settingsMap.enable_maintenance || defaultSettings.enableMaintenance,
        maintenanceMessage: settingsMap.maintenance_message || defaultSettings.maintenanceMessage,
        defaultCurrency: settingsMap.default_currency || defaultSettings.defaultCurrency,
        defaultLanguage: settingsMap.default_language || defaultSettings.defaultLanguage,
        termsUrl: settingsMap.terms_url || defaultSettings.termsUrl,
        privacyUrl: settingsMap.privacy_url || defaultSettings.privacyUrl,
        analyticsId: settingsMap.analytics_id || defaultSettings.analyticsId,
        emailNotifications: settingsMap.email_notifications || defaultSettings.emailNotifications,
        pushNotifications: settingsMap.push_notifications || defaultSettings.pushNotifications
      };
    }
  });

  // Effet pour mettre à jour le formulaire quand les données sont chargées
  React.useEffect(() => {
    if (settings) {
      Object.entries(settings).forEach(([key, value]) => {
        form.setValue(key as keyof SettingsFormValues, value);
      });
    }
  }, [settings, form]);

  // Mutation pour sauvegarder les paramètres
  const saveSettings = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      // Préparer les données pour la base
      const settingsToUpdate = [
        { key: 'site_name', value: data.siteName },
        { key: 'site_description', value: data.siteDescription },
        { key: 'contact_email', value: data.contactEmail },
        { key: 'support_email', value: data.supportEmail },
        { key: 'allow_signups', value: data.allowSignups },
        { key: 'enable_maintenance', value: data.enableMaintenance },
        { key: 'maintenance_message', value: data.maintenanceMessage },
        { key: 'default_currency', value: data.defaultCurrency },
        { key: 'default_language', value: data.defaultLanguage },
        { key: 'terms_url', value: data.termsUrl },
        { key: 'privacy_url', value: data.privacyUrl },
        { key: 'analytics_id', value: data.analyticsId },
        { key: 'email_notifications', value: data.emailNotifications },
        { key: 'push_notifications', value: data.pushNotifications }
      ];

      // Mettre à jour chaque paramètre
      // Type assertion for upsert payload
      type SettingUpsert = {
        key: string;
        value: string | boolean;
        updated_at: string;
      };

      for (const setting of settingsToUpdate) {
        const payload: SettingUpsert = {
          key: setting.key,
          value: setting.value,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('settings')
          .upsert(payload as any); // Type assertion: settings table may not be in generated types

        if (error) throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: t('admin.settingsManagement.toasts.settingsSaved'),
        description: t('admin.settingsManagement.toasts.settingsSavedDescription'),
      });
    },
    onError: (_error) => {
      // Error could be logged here for debugging
      toast({
        title: t('admin.settingsManagement.toasts.error'),
        description: t('admin.settingsManagement.toasts.errorDescription'),
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: SettingsFormValues) => {
    saveSettings.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center p-6">{t('admin.settingsManagement.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <Brush className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.appearance')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.security')}
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center">
            <Mail className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.emails')}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.integrations')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.billing')}
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.legal')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" /> {t('admin.settingsManagement.tabs.notifications')}
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settingsManagement.general.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.settingsManagement.general.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.settingsManagement.general.siteName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('admin.settingsManagement.general.siteNameDescription')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.settingsManagement.general.siteDescription')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('admin.settingsManagement.general.siteDescriptionDescription')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="defaultLanguage"
                      render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.settingsManagement.general.defaultLanguage')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin.settingsManagement.general.selectLanguage')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.settingsManagement.general.defaultCurrency')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin.settingsManagement.general.selectCurrency')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                            <SelectItem value="USD">Dollar US ($)</SelectItem>
                            <SelectItem value="GBP">Livre Sterling (£)</SelectItem>
                            <SelectItem value="CHF">Franc Suisse (CHF)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="allowSignups"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t('admin.settingsManagement.general.allowSignups')}</FormLabel>
                          <FormDescription>
                            {t('admin.settingsManagement.general.allowSignupsDescription')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableMaintenance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t('admin.settingsManagement.general.maintenanceMode')}</FormLabel>
                          <FormDescription>
                            {t('admin.settingsManagement.general.maintenanceModeDescription')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('enableMaintenance') && (
                    <FormField
                      control={form.control}
                      name="maintenanceMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('admin.settingsManagement.general.maintenanceMessage')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => form.reset(defaultSettings)}
                  >
                    {t('admin.settingsManagement.general.reset')}
                  </Button>
                  <Button type="submit" disabled={saveSettings.isPending}>
                    {saveSettings.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {t('admin.settingsManagement.general.saving')}
                      </>
                    ) : (
                      t('admin.settingsManagement.general.saveChanges')
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="emails">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settingsManagement.emails.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.settingsManagement.emails.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.settingsManagement.emails.contactEmail')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormDescription>
                          {t('admin.settingsManagement.emails.contactEmailDescription')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.settingsManagement.emails.supportEmail')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormDescription>
                          {t('admin.settingsManagement.emails.supportEmailDescription')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={saveSettings.isPending}>
                    {saveSettings.isPending ? t('admin.settingsManagement.general.saving') : t('admin.settingsManagement.emails.save')}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Autres onglets (contenu simplifié pour brièveté) */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settingsManagement.security.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.settingsManagement.security.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {t('admin.settingsManagement.security.descriptionText')}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit">{t('admin.settingsManagement.security.save')}</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settingsManagement.appearance.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {t('admin.settingsManagement.appearance.descriptionText')}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit">{t('admin.settingsManagement.appearance.save')}</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.settingsManagement.notifications.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t('admin.settingsManagement.notifications.emailNotifications')}</FormLabel>
                          <FormDescription>
                            {t('admin.settingsManagement.notifications.emailNotificationsDescription')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>{t('admin.settingsManagement.notifications.pushNotifications')}</FormLabel>
                          <FormDescription>
                            {t('admin.settingsManagement.notifications.pushNotificationsDescription')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit">{t('admin.settingsManagement.notifications.save')}</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default SettingsManagement; 