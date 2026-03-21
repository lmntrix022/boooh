import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Loader2, Globe, Lock, Link as LinkIcon, Shield, Eye, Save } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { generateCardUrl } from "@/utils/cardUrlUtils";

const CardSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  
  // Settings state
  const [isPublic, setIsPublic] = useState(true);
  const [slug, setSlug] = useState("");
  const [cardUrl, setCardUrl] = useState("");

  useEffect(() => {
    if (!id || !user) return;

    const fetchCard = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("business_cards")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: t('cardSettings.errors.cardNotFound') || 'Carte non trouvée',
            description: t('cardSettings.errors.cardNotFoundDescription') || 'Impossible de trouver cette carte',
            variant: "destructive",
          });
          return;
        }

        setCardData(data);
        setIsPublic(data.is_public ?? true);
        setSlug(data.slug || "");
        
        // Generate card URL
        const url = generateCardUrl(data.id, data.slug);
        setCardUrl(url);
      } catch (error: any) {
        toast({
          title: t('cardSettings.errors.error') || 'Erreur',
          description: t('cardSettings.errors.loadError') || 'Impossible de charger les données de la carte',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id, user, toast, t]);

  const handleSave = async () => {
    if (!id || !cardData) return;

    try {
      setSaving(true);
      
      // Generate slug from name if not provided
      let finalSlug = slug.trim();
      if (!finalSlug && cardData.name) {
        finalSlug = cardData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      // Check if slug is already taken by another card
      if (finalSlug) {
        const { data: existingCard } = await supabase
          .from("business_cards")
          .select("id")
          .eq("slug", finalSlug)
          .neq("id", id)
          .maybeSingle();

        if (existingCard) {
          toast({
            title: t('cardSettings.errors.slugTaken') || 'Slug déjà utilisé',
            description: t('cardSettings.errors.slugTakenDescription') || 'Ce slug est déjà utilisé par une autre carte',
            variant: "destructive",
          });
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("business_cards")
        .update({
          is_public: isPublic,
          slug: finalSlug || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;
      
      // Update card data
      setCardData({ ...cardData, is_public: isPublic, slug: finalSlug || null });
      
      // Update URL
      const url = generateCardUrl(id, finalSlug || undefined);
      setCardUrl(url);

      toast({
        title: t('cardSettings.toasts.saved') || 'Paramètres sauvegardés',
        description: t('cardSettings.toasts.savedDescription') || 'Les paramètres de la carte ont été sauvegardés avec succès',
      });
    } catch (error: any) {
      toast({
        title: t('cardSettings.errors.error') || 'Erreur',
        description: t('cardSettings.errors.saveError') || 'Impossible de sauvegarder les paramètres',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // If user is not logged in, redirect to login page
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="relative min-h-screen bg-white overflow-x-hidden">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
          
          {/* Header Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Icon Container Minimal */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Settings className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
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
                    {t('cardSettings.title') || 'Paramètres de la carte'}
                  </h1>
                  <p
                    className="text-sm md:text-base text-gray-600 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('cardSettings.description') || 'Gérez la visibilité et les paramètres de votre carte de visite'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Visibility Settings */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-gray-600" />
                      </div>
                      <h2
                        className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.visibility.title') || 'Visibilité'}
                      </h2>
                    </div>
                    <p
                      className="text-sm text-gray-600 font-light ml-[52px]"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('cardSettings.visibility.description') || 'Contrôlez qui peut voir votre carte de visite'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {isPublic ? (
                            <Globe className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor="visibility-toggle"
                            className="text-base font-light text-gray-900 cursor-pointer"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('cardSettings.visibility.public') || 'Carte publique'}
                          </Label>
                          <p
                            className="text-sm text-gray-600 font-light mt-1"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {isPublic
                              ? (t('cardSettings.visibility.publicDescription') || 'Votre carte est visible par tous')
                              : (t('cardSettings.visibility.privateDescription') || 'Votre carte n\'est visible que par vous')}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="visibility-toggle"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        className="data-[state=checked]:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Settings */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <h2
                        className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.url.title') || 'URL personnalisée'}
                      </h2>
                    </div>
                    <p
                      className="text-sm text-gray-600 font-light ml-13"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('cardSettings.url.description') || 'Personnalisez l\'URL de votre carte de visite'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="slug-input"
                        className="text-sm font-light text-gray-700"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.url.slug') || 'Slug (identifiant URL)'}
                      </Label>
                      <Input
                        id="slug-input"
                        value={slug}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/-+/g, "-")
                            .replace(/^-|-$/g, "");
                          setSlug(value);
                        }}
                        placeholder={cardData?.name?.toLowerCase().replace(/\s+/g, "-") || "mon-slug"}
                        className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      />
                      <p
                        className="text-xs text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.url.slugHint') || 'Utilisez uniquement des lettres minuscules, des chiffres et des tirets'}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Label
                        className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.url.currentUrl') || 'URL actuelle'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 text-sm font-mono text-gray-900 bg-white px-3 py-2 rounded border border-gray-200 font-light break-all"
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                            fontWeight: 300,
                          }}
                        >
                          {cardUrl}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(cardUrl);
                            toast({
                              title: t('cardSettings.toasts.urlCopied') || 'URL copiée',
                              description: t('cardSettings.toasts.urlCopiedDescription') || 'L\'URL a été copiée dans le presse-papier',
                            });
                          }}
                          className="rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          {t('cardSettings.url.copy') || 'Copier'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-gray-600" />
                      </div>
                      <h2
                        className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.security.title') || 'Sécurité'}
                      </h2>
                    </div>
                    <p
                      className="text-sm text-gray-600 font-light ml-[52px]"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('cardSettings.security.description') || 'Paramètres de sécurité et de confidentialité'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <Label
                            className="text-base font-light text-gray-900"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('cardSettings.security.secureCard') || 'Carte sécurisée'}
                          </Label>
                          <p
                            className="text-sm text-gray-600 font-light mt-1"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {t('cardSettings.security.secureCardDescription') || 'Votre carte est protégée par des mesures de sécurité avancées'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Card Info Card */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3
                    className="text-lg font-light text-gray-900 mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('cardSettings.info.title') || 'Informations'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label
                        className="text-xs font-light text-gray-500 uppercase tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.info.cardName') || 'Nom de la carte'}
                      </Label>
                      <p
                        className="text-sm font-light text-gray-900 mt-1"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {cardData?.name || '-'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <Label
                        className="text-xs font-light text-gray-500 uppercase tracking-wider"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('cardSettings.info.status') || 'Statut'}
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        {isPublic ? (
                          <>
                            <Globe className="w-4 h-4 text-gray-600" />
                            <span
                              className="text-sm font-light text-gray-900"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('cardSettings.info.public') || 'Publique'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-gray-600" />
                            <span
                              className="text-sm font-light text-gray-900"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('cardSettings.info.private') || 'Privée'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-12 px-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('cardSettings.actions.saving') || 'Sauvegarde...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {t('cardSettings.actions.save') || 'Enregistrer les modifications'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CardSettings;



