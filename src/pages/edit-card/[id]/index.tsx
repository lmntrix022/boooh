"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CoverImageUploader } from "@/components/CoverImageUploader";
import { usePremiumToast } from "@/hooks/usePremiumToast";
import { Loader2, MapPin, Save, X, Palette, MapPin as LocationIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyMap, LazyMarker } from '@/components/LazyMap';
import { PremiumInput, EmailInput, PhoneInput, UrlInput } from "@/components/ui/PremiumInput";
import { PremiumButton, SubmitButton, CancelButton } from "@/components/ui/PremiumButton";
import { GOOGLE_MAPS_API_KEY } from '@/lib/constants';

export default function EditCardPage() {
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();
  const toast = usePremiumToast();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [center, setCenter] = useState({
    lat: 48.8566,
    lng: 2.3522
  });
  const [zoom, setZoom] = useState(11);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // useJsApiLoader removed as LazyMap handles it

  // Form state
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadCard() {
      if (!id) return;
      const { data, error } = await supabase
        .from("business_cards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        // Error log removed
        toast.error("Erreur", "Impossible de charger la carte");
        return;
      }

      setCard(data);

      // Pré-remplir les champs du formulaire
      setName(data.name || "");
      setTitle(data.title || "");
      setCompany(data.company || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setWebsite(data.website || "");
      setDescription(data.description || "");
      setAddress(data.address || "");

      if (data.latitude && data.longitude) {
        setSelectedLocation({ latitude: data.latitude, longitude: data.longitude });
        setCenter({
          lat: data.latitude,
          lng: data.longitude
        });
      }
      setLoading(false);
    }

    loadCard();
  }, [id, toast]);

  const handleImageUploaded = (imageUrl: string) => {
    setCard((prevCard: any) => ({
      ...prevCard,
      cover_image_url: imageUrl
    }));

    toast.imageUploaded();
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setSelectedLocation({
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng()
      });
      setCenter({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setSelectedLocation(newLocation);
          setCenter({ lat: newLocation.latitude, lng: newLocation.longitude });
          setZoom(13);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  };

  const handleMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setSelectedLocation({
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng()
      });
    }
  };

  const handleSave = async () => {
    if (!card || !id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("business_cards")
        .update({
          name,
          title,
          company,
          email,
          phone,
          website,
          description,
          address,
          cover_image_url: card.cover_image_url,
          latitude: selectedLocation?.latitude || null,
          longitude: selectedLocation?.longitude || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.cardUpdated();
    } catch (error) {
      // Error log removed
      toast.error("Erreur", "Impossible d'enregistrer les modifications");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-indigo-100/60 backdrop-blur-2xl py-12 px-2 animate-fade-in-up">
        <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-blue-100/40 p-8 flex flex-col items-center relative overflow-hidden animate-fade-in-up">
          <h1 className="text-2xl font-bold mb-6 text-blue-900">Carte non trouvée</h1>
          <p>Cette carte n'existe pas ou vous n'avez pas les droits pour l'éditer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-indigo-100/60 backdrop-blur-2xl py-12 px-2 animate-fade-in-up">
      <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-blue-100/40 p-8 flex flex-col relative overflow-hidden animate-fade-in-up">
        {/* Halo décoratif */}
        <span className="absolute -inset-4 -z-10 pointer-events-none blur-2xl opacity-40 animate-pulse"
          style={{ background: 'radial-gradient(circle at 60% 30%,rgba(99,179,237,0.18) 0,transparent 70%)' }} />

        {/* Header premium */}
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 tracking-tight animate-fade-in-up bg-gradient-to-r from-black via-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Modifier votre carte
        </h1>

        <Tabs defaultValue="info" className="space-y-6 w-full animate-fade-in-up">
          <TabsList className="flex w-full justify-center gap-2 bg-blue-50/60 backdrop-blur rounded-xl p-1 shadow-inner mb-6">
            <TabsTrigger value="info" className="rounded-lg px-4 py-2 font-semibold text-blue-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:shadow-lg transition-all">
              Informations
            </TabsTrigger>
            <TabsTrigger value="design" className="rounded-lg px-4 py-2 font-semibold text-blue-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:shadow-lg transition-all">
              Design
            </TabsTrigger>
            <TabsTrigger value="location" className="rounded-lg px-4 py-2 font-semibold text-blue-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:shadow-lg transition-all">
              Localisation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="space-y-6 p-6 bg-white/80 rounded-2xl shadow-inner border border-blue-100/40">
              <h2 className="text-lg font-medium text-blue-900">Informations de base</h2>
              <p className="text-sm text-black">Modifiez vos informations personnelles et professionnelles</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PremiumInput
                  id="name"
                  label="Nom complet"
                  placeholder="Votre nom et prénom"
                  value={name}
                  onChange={setName}
                  validation={{ required: true, minLength: 2 }}
                  helperText="Votre nom tel qu'il apparaîtra sur votre carte"
                  disabled={saving}
                />

                <PremiumInput
                  id="title"
                  label="Titre professionnel"
                  placeholder="Développeur, Designer, Manager..."
                  value={title}
                  onChange={setTitle}
                  helperText="Votre poste ou spécialité"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PremiumInput
                  id="company"
                  label="Entreprise"
                  placeholder="Nom de votre entreprise"
                  value={company}
                  onChange={setCompany}
                  helperText="L'entreprise pour laquelle vous travaillez"
                  disabled={saving}
                />

                <EmailInput
                  id="email"
                  label="Email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={setEmail}
                  required={true}
                  helperText="Votre adresse email professionnelle"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PhoneInput
                  id="phone"
                  label="Téléphone"
                  placeholder="+33 1 23 45 67 89"
                  value={phone}
                  onChange={setPhone}
                  helperText="Votre numéro de téléphone"
                  disabled={saving}
                />

                <UrlInput
                  id="website"
                  label="Site web"
                  placeholder="https://votresite.com"
                  value={website}
                  onChange={setWebsite}
                  helperText="L'URL de votre site web personnel ou professionnel"
                  disabled={saving}
                />
              </div>

              <PremiumInput
                id="address"
                label="Adresse"
                placeholder="123 Rue de la Paix, 75001 Paris"
                value={address}
                onChange={setAddress}
                helperText="Votre adresse complète (optionnel)"
                icon={<LocationIcon className="w-4 h-4" />}
                disabled={saving}
              />

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Une brève description de votre profil professionnel..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                  className="w-full min-h-[100px] px-3 py-2 border-2 border-gray-300 rounded-md bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400 transition-all duration-300 resize-none"
                />
                <p className="text-xs text-gray-500">Décrivez votre expertise et vos compétences</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-8">
            <div className="space-y-4 p-6 bg-white/80 rounded-2xl shadow-inner border border-blue-100/40">
              <h2 className="text-lg font-medium text-blue-900">Image de couverture</h2>
              <p className="text-sm text-black">Cette image sera utilisée comme arrière-plan de votre carte</p>
              <CoverImageUploader
                cardId={id as string}
                existingImage={card.cover_image_url}
                onImageUploaded={handleImageUploaded}
              />
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="space-y-4 p-6 bg-white/80 rounded-2xl shadow-inner border border-blue-100/40">
              <h2 className="text-lg font-medium text-blue-900">Localisation</h2>
              <p className="text-sm text-black">Cliquez sur la carte pour définir votre localisation ou utilisez le bouton de géolocalisation</p>
              <div className="h-[400px] w-full rounded-lg overflow-hidden border border-blue-200 shadow-lg relative">
                <LazyMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={center}
                  zoom={zoom}
                  onClick={handleMapClick}
                  googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                  onBoundsChanged={() => {
                    // Update center and zoom when map moves
                  }}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: true,
                    fullscreenControl: true,
                    zoomControl: true
                  }}
                >
                  {selectedLocation && (
                    <LazyMarker
                      position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
                      draggable={true}
                      onDragEnd={handleMarkerDragEnd}
                      icon={{
                        url: 'data:image/svg+xml;base64,' + btoa(`
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#000000" stroke="#ffffff" stroke-width="2"/>
                            <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                          </svg>
                        `),
                        scaledSize: typeof google !== 'undefined' && google.maps ? new google.maps.Size(24, 24) : undefined,
                        anchor: typeof google !== 'undefined' && google.maps ? new google.maps.Point(12, 12) : undefined
                      }}
                    />
                  )}
                </LazyMap>
                <button
                  onClick={handleGeolocate}
                  className="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg shadow-md flex items-center space-x-2 transition-colors z-10"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Ma position</span>
                </button>
              </div>
              {selectedLocation && (
                <p className="text-sm text-blue-600">
                  Localisation sélectionnée : {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-4 mt-8 justify-end">
          <CancelButton
            onClick={handleCancel}
            className="px-6"
          >
            Annuler
          </CancelButton>
          <SubmitButton
            onClick={handleSave}
            loading={saving}
            className="px-6"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
} 