import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
 Edit, 
 User, 
 Mail, 
 Phone, 
 Building, 
 MapPin, 
 Globe, 
 Upload,
 Camera,
 Calendar,
 Shield,
 Settings,
 Eye,
 EyeOff,
 Lock,
 Key,
 Bell,
 Moon,
 Sun,
 Trash2,
 AlertTriangle,
 CheckCircle,
 Loader2,
 Save,
 X,
 Sparkles,
 Zap,
 Target,
 Activity
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Tables } from "@/integrations/supabase/types";
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Profile = Tables<"profiles">;

type SocialLinks = {
 facebook?: string;
 twitter?: string;
 linkedin?: string;
 instagram?: string;
 github?: string;
};

type ProfileWithCustomFields = Profile & {
 title?: string | null;
 location?: string | null;
 social_links?: SocialLinks | null;
};

const Profile = () => {
 const { user, updatePassword } = useAuth();
 const { toast } = useToast();
 const { t, currentLanguage } = useLanguage();
 const [isEditing, setIsEditing] = useState(false);
 const [loading, setLoading] = useState(false);
 const [profile, setProfile] = useState<ProfileWithCustomFields | null>(null);
 const [previewImage, setPreviewImage] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState("profile");
 const [profileCompletion, setProfileCompletion] = useState(0);
 
 // États pour la sécurité et les paramètres
 const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 const [showNewPassword, setShowNewPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [passwordForm, setPasswordForm] = useState({
 currentPassword: '',
 newPassword: '',
 confirmPassword: ''
 });
 const [isChangingPassword, setIsChangingPassword] = useState(false);
 
 // États pour les paramètres
 const [settings, setSettings] = useState({
 emailNotifications: true,
 pushNotifications: false,
 darkMode: false,
 twoFactorAuth: false,
 autoBackup: true
 });

 useEffect(() => {
 if (user) {
 fetchProfile();
 }
 }, [user]);

 useEffect(() => {
 if (profile) {
 calculateProfileCompletion();
 }
 }, [profile]);

 const calculateProfileCompletion = () => {
 if (!profile) return;
 
 const fields = [
 profile.full_name,
 profile.avatar_url,
 profile.phone,
 profile.location,
 profile.company,
 profile.title,
 profile.website,
 profile.bio
 ];

 const socialFields = profile.social_links ? Object.values(profile.social_links).filter(Boolean) : [];
 const totalFields = fields.length + 5; // 5 possible social links
 const completedFields = fields.filter(Boolean).length + socialFields.length;
 
 setProfileCompletion(Math.round((completedFields / totalFields) * 100));
 };

 const fetchProfile = async () => {
 try {
 const { data, error } = await supabase
 .from('profiles')
 .select('*')
 .eq('id', user?.id ?? '') // Ensure user?.id is a string
 .single();

 if (error) throw error;
 // Ensure required fields are present with safe defaults
 if (data) {
   const safeData = data as ProfileWithCustomFields;
   const normalized: ProfileWithCustomFields = {
     ...safeData,
     title: safeData.title ?? '',
     phone: safeData.phone ?? null,
     location: safeData.location ?? null,
     social_links: safeData.social_links ?? null,
   };
   setProfile(normalized);
 } else {
   setProfile(null);
 }
 } catch (error) {
 // Error log removed
 toast({
 title: t('profile.toasts.errorLoading.title'),
 description: t('profile.toasts.errorLoading.description'),
 variant: "destructive",
 });
 }
 };
 
 const getInitials = (name: string) => {
 return name
 .split(" ")
 .map((n) => n[0])
 .join("")
 .toUpperCase();
 };

 const userName = profile?.full_name || user?.email?.split('@')[0] || "";
 const userInitials = userName ? getInitials(userName) : "U";
 const joinDate = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy', { locale: currentLanguage === 'fr' ? fr : enUS }) : '';

 const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 try {
 setLoading(true);
 const file = e.target.files?.[0];
 if (!file) return;

 // Prévisualisation de l'image
 const reader = new FileReader();
 reader.onloadend = () => {
 setPreviewImage(reader.result as string);
 };
 reader.readAsDataURL(file);

 const fileExt = file.name.split('.').pop();
 const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
 const filePath = `avatars/${fileName}`;

 const { error: uploadError } = await supabase.storage
 .from('avatars')
 .upload(filePath, file);

 if (uploadError) throw uploadError;

 const { data: { publicUrl } } = supabase.storage
 .from('avatars')
 .getPublicUrl(filePath);

 const { error: updateError } = await supabase
 .from('profiles')
 .update({ avatar_url: publicUrl })
.eq('id', user?.id ?? '');

 if (updateError) throw updateError;

 await fetchProfile();
 toast({
 title: t('profile.toasts.avatarUpdated.title'),
 description: t('profile.toasts.avatarUpdated.description'),
 });
 } catch (error) {
 toast({
 title: t('profile.toasts.avatarError.title'),
 description: t('profile.toasts.avatarError.description'),
 variant: "destructive",
 });
 } finally {
 setLoading(false);
 setPreviewImage(null);
 }
 };

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 const form = e.currentTarget;
 const formData = new FormData(form);
 
 const updates = {
 full_name: formData.get('full_name') as string,
 company: formData.get('company') as string,
 title: formData.get('title') as string,
 bio: formData.get('bio') as string,
 website: formData.get('website') as string,
 phone: formData.get('phone') as string,
 location: formData.get('location') as string,
 social_links: {
 facebook: formData.get('facebook') as string,
 twitter: formData.get('twitter') as string,
 linkedin: formData.get('linkedin') as string,
 instagram: formData.get('instagram') as string,
 github: formData.get('github') as string,
 },
 updated_at: new Date().toISOString(),
 };

 try {
 setLoading(true);
 const { error } = await supabase
 .from('profiles')
 .update(updates)
.eq('id', user?.id ?? '');

 if (error) throw error;

 await fetchProfile();
 setIsEditing(false);
 toast({
 title: t('profile.toasts.profileUpdated.title'),
 description: t('profile.toasts.profileUpdated.description'),
 });
 } catch (error) {
 toast({
 title: t('profile.toasts.profileError.title'),
 description: t('profile.toasts.profileError.description'),
 variant: "destructive",
 });
 } finally {
 setLoading(false);
 }
 };

 const handlePasswordChange = async (e: React.FormEvent) => {
 e.preventDefault();
 
 if (passwordForm.newPassword !== passwordForm.confirmPassword) {
 toast({
 title: t('profile.toasts.passwordMismatch.title'),
 description: t('profile.toasts.passwordMismatch.description'),
 variant: "destructive",
 });
 return;
 }

 if (passwordForm.newPassword.length < 6) {
 toast({
 title: t('profile.toasts.passwordTooShort.title'),
 description: t('profile.toasts.passwordTooShort.description'),
 variant: "destructive",
 });
 return;
 }

 try {
 setIsChangingPassword(true);
 await updatePassword(passwordForm.newPassword);
 
 // Réinitialiser le formulaire
 setPasswordForm({
 currentPassword: '',
 newPassword: '',
 confirmPassword: ''
 });
 
 toast({
 title: t('profile.toasts.passwordChanged.title'),
 description: t('profile.toasts.passwordChanged.description'),
 });
 } catch (error) {
 // L'erreur est déjà gérée dans le contexte d'authentification
 } finally {
 setIsChangingPassword(false);
 }
 };

 const handleSettingChange = (setting: keyof typeof settings) => {
 setSettings(prev => ({
 ...prev,
 [setting]: !prev[setting]
 }));
 
 const settingLabels: Record<keyof typeof settings, string> = {
   emailNotifications: t('profile.settings.emailNotifications.label'),
   pushNotifications: t('profile.settings.pushNotifications.label'),
   darkMode: t('profile.settings.darkMode.label'),
   twoFactorAuth: t('profile.settings.twoFactorAuth.label'),
   autoBackup: t('profile.settings.autoBackup.label'),
 };
 
 toast({
 title: t('profile.toasts.settingUpdated.title'),
 description: t('profile.toasts.settingUpdated.description', { setting: settingLabels[setting] }),
 });
 };

 const handleDeleteAccount = async () => {
 if (window.confirm(t('profile.deleteAccount.confirm'))) {
 try {
 setLoading(true);
 // Ici vous pouvez ajouter la logique pour supprimer le compte
 toast({
 title: t('profile.toasts.accountDeleted.title'),
 description: t('profile.toasts.accountDeleted.description'),
 });
 } catch (error) {
 toast({
 title: t('profile.toasts.accountDeleteError.title'),
 description: t('profile.toasts.accountDeleteError.description'),
 variant: "destructive",
 });
 } finally {
 setLoading(false);
 }
 }
 };

 return (
 <DashboardLayout>
 <div className="relative min-h-screen bg-gray-50 overflow-x-hidden">
 
 <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">

 {/* Header Apple Minimal */}
 <motion.div
   className="mb-6 md:mb-8"
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ duration: 0.5 }}
 >
   <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8">
     <div className="flex items-center gap-4 md:gap-6">
       {/* Icon Container */}
       <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
         <User className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-600" />
       </div>
       
       <div className="min-w-0 flex-1">
         <h1
           className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
           style={{
             fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
             fontWeight: 300,
             letterSpacing: '-0.02em',
           }}
         >
           {t('profile.title')}
         </h1>
         <p
           className="text-sm md:text-base text-gray-500 font-light"
           style={{
             fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
             fontWeight: 300,
           }}
         >
           {t('profile.description')}
         </p>
       </div>
     </div>
   </div>
 </motion.div>

 {/* Header Section Apple Minimal */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.1 }}
 className="relative mb-8"
 >
 <motion.div
 className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
 >
 
 <div className="p-6 md:p-8">
 <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
 
 {/* Avatar Section Apple Minimal */}
 <div className="relative group">
 <Avatar className="w-24 h-24 md:w-28 md:h-28 ring-2 ring-gray-200 shadow-sm bg-gray-100 rounded-lg">
 {profile?.avatar_url ? (
 <AvatarImage src={profile.avatar_url} alt={userName} className="rounded-lg" />
 ) : (
 <AvatarFallback className="text-2xl font-light text-gray-700 bg-gray-100 rounded-lg"
   style={{
     fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
     fontWeight: 300,
   }}
 >
 {userInitials}
 </AvatarFallback>
 )}
 </Avatar>
 <motion.label 
   htmlFor="avatar-upload" 
   className="absolute -bottom-1 -right-1 bg-gray-900 hover:bg-gray-800 text-white rounded-md p-1.5 shadow-sm cursor-pointer transition-all duration-200"
   whileHover={{ scale: 1.05 }}
   whileTap={{ scale: 0.95 }}
 >
 <Camera className="w-3 h-3" />
 <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={loading} />
 </motion.label>
 <div 
   className="absolute -top-1 -left-1 bg-gray-900 text-white text-xs font-light px-2 py-1 rounded-md shadow-sm"
   style={{
     fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
     fontWeight: 300,
   }}
 >
 {t('profile.pro')}
 </div>
 </div>

 {/* User Info */}
 <div className="flex-1 text-center md:text-left">
 <h1 
 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 mb-2"
 style={{
   fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
   fontWeight: 300,
   letterSpacing: '-0.02em',
 }}
 >
 {userName}
 </h1>
 <p 
 className="text-gray-500 mb-4 flex items-center justify-center md:justify-start gap-2 font-light"
 style={{
   fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
   fontWeight: 300,
 }}
 >
 <Calendar className="w-4 h-4" />
 {t('profile.memberSince')} {joinDate}
 </p>
 
 {/* Progress Bar */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-sm font-light text-gray-500"
   style={{
     fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
     fontWeight: 300,
   }}
 >{t('profile.completion')}</span>
 <span className="text-sm font-light text-gray-900"
   style={{
     fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
     fontWeight: 300,
   }}
 >{profileCompletion}%</span>
 </div>
 <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
 <motion.div
   className="absolute inset-y-0 left-0 bg-gray-900 rounded-full"
   initial={{ width: 0 }}
   animate={{ width: `${profileCompletion}%` }}
   transition={{ duration: 1, delay: 0.5 }}
 />
 </div>
 {profileCompletion === 100 && (
 <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
 <CheckCircle className="w-4 h-4 text-gray-600" />
 <span className="text-sm font-light text-gray-900"
   style={{
     fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
     fontWeight: 300,
   }}
 >{t('profile.complete')}</span>
 </div>
 )}
 </div>
 </div>

 {/* Action Button */}
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.4 }}
 >
 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
<Button
onClick={() => setIsEditing(!isEditing)}
className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
>
 {isEditing ? (
 <>
 <X className="w-4 h-4 mr-2" />
 {t('profile.cancel')}
 </>
 ) : (
 <>
 <Edit className="w-4 h-4 mr-2" />
 {t('profile.edit')}
 </>
 )}
 </Button>
 </motion.div>
 </motion.div>
 </div>
 </div>
 </motion.div>
 </motion.div>

 {/* Main Content Ultra-Moderne */}
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.2 }}
 >
 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
{/* Tabs Ultra-Modernes avec Glassmorphism */}
<motion.div
  className="mb-6 md:mb-8"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.3 }}
>
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-1">
    {/* Orbe décoratif */}
    <motion.div
      className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-3xl opacity-10"
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.15, 0.1]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    
    <TabsList className="bg-transparent border-0 p-0 gap-1 flex justify-center items-center w-full">
      <TabsTrigger 
        value="profile" 
        className="rounded-md px-6 py-3 text-sm font-light text-gray-600 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 transition-all duration-200 flex-1"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        <User className="w-4 h-4 mr-2" />
        {t('profile.tabs.profile')}
      </TabsTrigger>
      <TabsTrigger 
        value="settings"
        className="rounded-md px-6 py-3 text-sm font-light text-gray-600 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-900 transition-all duration-200 flex-1"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        <Settings className="w-4 h-4 mr-2" />
        {t('profile.tabs.settings')}
      </TabsTrigger>
    </TabsList>
  </div>
</motion.div>

<TabsContent value="profile" className="space-y-6">
<motion.div
className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.2 }}
>
<div className="p-6 md:p-8">
<div className="flex items-center gap-3 mb-6">
  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
    <User className="h-6 w-6 text-gray-600" />
  </div>
  <div>
    <h3 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontWeight: 300,
        letterSpacing: '-0.02em',
      }}
    >
      {t('profile.personalInfo.title')}
    </h3>
  </div>
</div>
<div>
<form onSubmit={handleSubmit} className="space-y-6">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2">
<Label htmlFor="full_name" className="text-sm font-light text-gray-700 mb-2 block"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.personalInfo.fullName')}</Label>
<Input 
id="full_name" 
name="full_name" 
defaultValue={profile?.full_name || ''} 
className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light" 
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
disabled={!isEditing} 
/>
</div>
<div className="space-y-2">
<Label htmlFor="company" className="text-sm font-light text-gray-700 mb-2 block"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.personalInfo.company')}</Label>
<Input 
id="company" 
name="company" 
defaultValue={profile?.company || ''} 
className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}} 
disabled={!isEditing} 
/>
</div>
<div className="space-y-2">
<Label htmlFor="title" className="text-sm font-light text-gray-700 mb-2 block"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.personalInfo.title')}</Label>
<Input 
id="title" 
name="title" 
defaultValue={profile?.title || ''} 
className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}} 
disabled={!isEditing} 
/>
</div>
<div className="space-y-2">
<Label htmlFor="phone" className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.personalInfo.phone')}</Label>
<Input 
id="phone" 
name="phone" 
defaultValue={profile?.phone || ''} 
className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}} 
disabled={!isEditing} 
/>
</div>
<div className="md:col-span-2 space-y-2">
<Label htmlFor="bio" className="text-sm font-light text-gray-700 mb-2 block"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.personalInfo.bio')}</Label>
<Textarea 
id="bio" 
name="bio" 
defaultValue={profile?.bio || ''} 
className="bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm min-h-[100px] disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}} 
disabled={!isEditing} 
placeholder={t('profile.personalInfo.bioPlaceholder')}
/>
</div>
<div className="space-y-2">
<Label htmlFor="website" className="text-sm font-light text-gray-700 mb-2 block"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.personalInfo.website')}</Label>
<Input 
id="website" 
name="website" 
defaultValue={profile?.website || ''} 
className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}} 
disabled={!isEditing} 
/>
</div>
<div className="space-y-2">
<Label htmlFor="location" className="text-sm font-light text-gray-700 mb-2 block"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.personalInfo.location')}</Label>
<Input 
id="location" 
name="location" 
defaultValue={profile?.location || ''} 
className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}} 
disabled={!isEditing} 
/>
</div>
</div>

<div className="my-6 h-px bg-gray-200" />

{/* Social Links */}
<div className="space-y-4">
<h3 className="text-lg font-light tracking-tight text-gray-900 flex items-center gap-2 mb-4"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    fontWeight: 300,
    letterSpacing: '-0.02em',
  }}
>
<div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
  <Globe className="w-5 h-5 text-gray-600" />
</div>
{t('profile.socialLinks.title')}
</h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{[
{ key: 'facebook', label: t('profile.socialLinks.facebook'), icon: '📘' },
{ key: 'twitter', label: t('profile.socialLinks.twitter'), icon: '🐦' },
{ key: 'linkedin', label: t('profile.socialLinks.linkedin'), icon: '💼' },
{ key: 'instagram', label: t('profile.socialLinks.instagram'), icon: '📷' },
{ key: 'github', label: t('profile.socialLinks.github'), icon: '💻' }
].map((social) => (
<div key={social.key} className="space-y-2">
<Label htmlFor={social.key} className="text-sm font-light text-gray-700 mb-2 block flex items-center gap-2"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>
<span>{social.icon}</span>
{social.label}
</Label>
<Input 
name={social.key} 
defaultValue={profile?.social_links?.[social.key as keyof SocialLinks] || ''} 
placeholder={t('profile.socialLinks.placeholder', { network: social.label })}
className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}} 
disabled={!isEditing} 
/>
</div>
))}
</div>
</div>

<AnimatePresence>
{isEditing && (
<motion.div
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
className="flex gap-4 justify-end pt-6"
>
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
<Button
type="submit"
className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
disabled={loading}
>
{loading ? (
<>
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
{t('profile.saving')}
</>
) : (
<>
<Save className="w-4 h-4 mr-2" />
{t('profile.save')}
</>
)}
</Button>
</motion.div>
</motion.div>
)}
</AnimatePresence>
</form>
</div>
</div>
</motion.div>
</TabsContent>

<TabsContent value="settings" className="space-y-6">
{/* Security Section Apple Minimal */}
<motion.div
className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.2 }}
>
<div className="p-6 md:p-8">
<div className="flex items-center gap-3 mb-6">
  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
    <Shield className="h-6 w-6 text-gray-600" />
  </div>
  <div>
    <h3 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontWeight: 300,
        letterSpacing: '-0.02em',
      }}
    >
      {t('profile.security.title')}
    </h3>
  </div>
</div>
<div>
<form onSubmit={handlePasswordChange} className="space-y-6">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2">
<Label htmlFor="currentPassword" className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.security.currentPassword')}</Label>
<div className="relative">
<div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
  <Lock className="w-3 h-3 text-gray-600" />
</div>
<Input
id="currentPassword"
type={showCurrentPassword ? "text" : "password"}
value={passwordForm.currentPassword}
onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
placeholder="••••••••"
className="pl-12 h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
disabled={isChangingPassword}
/>
<motion.button
type="button"
onClick={() => setShowCurrentPassword(!showCurrentPassword)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.9 }}
>
{showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
</motion.button>
</div>
</div>
 
<div className="space-y-2">
<Label htmlFor="newPassword" className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.security.newPassword')}</Label>
<div className="relative">
<div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
  <Lock className="w-3 h-3 text-gray-600" />
</div>
<Input
id="newPassword"
type={showNewPassword ? "text" : "password"}
value={passwordForm.newPassword}
onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
placeholder="••••••••"
className="pl-12 h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
disabled={isChangingPassword}
/>
<motion.button
type="button"
onClick={() => setShowNewPassword(!showNewPassword)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.9 }}
>
{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
</motion.button>
</div>
</div>
</div>
 
<div className="space-y-2">
<Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.security.confirmPassword')}</Label>
<div className="relative">
<div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
  <Lock className="w-3 h-3 text-gray-600" />
</div>
<Input
id="confirmPassword"
type={showConfirmPassword ? "text" : "password"}
value={passwordForm.confirmPassword}
onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
placeholder="••••••••"
className="pl-12 h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm disabled:opacity-50 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
disabled={isChangingPassword}
/>
<motion.button
type="button"
onClick={() => setShowConfirmPassword(!showConfirmPassword)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.9 }}
>
{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
</motion.button>
</div>
</div>
 
<Button
type="submit"
className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
disabled={isChangingPassword}
>
{isChangingPassword ? (
<>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />
{t('profile.security.changing')}
</>
) : (
<>
<Key className="mr-2 h-4 w-4" />
{t('profile.security.changePassword')}
</>
)}
</Button>
</form>
</div>
</div>
</motion.div>

{/* Settings Section Apple Minimal */}
<motion.div
className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.3 }}
>
<div className="p-6 md:p-8">
<div className="flex items-center gap-3 mb-6">
  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
    <Settings className="h-6 w-6 text-gray-600" />
  </div>
  <div>
    <h3 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontWeight: 300,
        letterSpacing: '-0.02em',
      }}
    >
      {t('profile.settings.title')}
    </h3>
  </div>
</div>
<div className="space-y-4">
{[
{ key: 'emailNotifications', label: t('profile.settings.emailNotifications.label'), description: t('profile.settings.emailNotifications.description'), icon: Mail },
{ key: 'pushNotifications', label: t('profile.settings.pushNotifications.label'), description: t('profile.settings.pushNotifications.description'), icon: Bell },
{ key: 'darkMode', label: t('profile.settings.darkMode.label'), description: t('profile.settings.darkMode.description'), icon: settings.darkMode ? Moon : Sun },
{ key: 'twoFactorAuth', label: t('profile.settings.twoFactorAuth.label'), description: t('profile.settings.twoFactorAuth.description'), icon: Shield },
{ key: 'autoBackup', label: t('profile.settings.autoBackup.label'), description: t('profile.settings.autoBackup.description'), icon: Activity }
].map((setting) => (
<div 
  key={setting.key} 
  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
  <setting.icon className="w-5 h-5 text-gray-600" />
</div>
<div>
<div className="font-light text-gray-900"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{setting.label}</div>
<div className="text-sm font-light text-gray-500"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{setting.description}</div>
</div>
</div>
<Switch
checked={settings[setting.key as keyof typeof settings]}
onCheckedChange={() => handleSettingChange(setting.key as keyof typeof settings)}
className="data-[state=checked]:bg-gray-900"
/>
</div>
))}
</div>
</div>
</motion.div>

{/* Danger Zone Apple Minimal */}
<motion.div
className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.4 }}
>
<div className="p-6 md:p-8">
<div className="flex items-center gap-3 mb-6">
  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
    <AlertTriangle className="h-6 w-6 text-gray-600" />
  </div>
  <div>
    <h3 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontWeight: 300,
        letterSpacing: '-0.02em',
      }}
    >
      {t('profile.dangerZone.title')}
    </h3>
  </div>
</div>

<Alert className="mb-6 border border-gray-200 bg-gray-50 rounded-lg">
<AlertTriangle className="h-4 w-4 text-gray-600" />
<AlertDescription className="text-gray-700 font-light"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>
{t('profile.dangerZone.warning')}
</AlertDescription>
</Alert>
 
<div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
  <Trash2 className="w-5 h-5 text-gray-600" />
</div>
<div>
<div className="font-light text-gray-900"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.dangerZone.deleteAccount.title')}</div>
<div className="text-sm font-light text-gray-500"
  style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontWeight: 300,
  }}
>{t('profile.dangerZone.deleteAccount.description')}</div>
</div>
</div>
<Button
variant="destructive"
onClick={handleDeleteAccount}
className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light"
style={{
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  fontWeight: 300,
}}
disabled={loading}
>
{loading ? (
<>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />
{t('profile.dangerZone.deleteAccount.deleting')}
</>
) : (
<>
<Trash2 className="mr-2 h-4 w-4" />
{t('profile.dangerZone.deleteAccount.delete')}
</>
)}
</Button>
</div>
</div>
</motion.div>
</TabsContent>

</Tabs>
</motion.div>
</div>
</div>
</DashboardLayout>
);
};

export default Profile;