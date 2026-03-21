import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PortfolioService, Urgency } from '@/services/portfolioService';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { ContactAutoCreation } from '@/services/contactAutoCreation';
import { sendNewQuoteEmails } from '@/services/quoteEmailService';

const quoteRequestSchema = z.object({
  client_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  client_email: z.string().email('Email invalide'),
  client_phone: z.string().optional(),
  client_company: z.string().optional(),
  service_requested: z.string().min(10, 'Veuillez décrire le service demandé (min 10 caractères)'),
  project_description: z.string().optional(),
  budget_range: z.string().optional(),
  urgency: z.enum(['urgent', 'normal', 'flexible']).optional(),
  preferred_start_date: z.string().optional(),
});

type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>;

interface QuoteRequestDialogProps {
  projectId?: string;
  cardId?: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  brandColor?: string;
  defaultServiceName?: string;
}

export const QuoteRequestDialog: React.FC<QuoteRequestDialogProps> = ({
  projectId,
  cardId,
  userId,
  isOpen,
  onClose,
  brandColor = '#8B5CF6',
  defaultServiceName = ''
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<QuoteRequestFormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      urgency: 'normal'
    }
  });

  const selectedUrgency = watch('urgency');

  // Pré-remplir le champ service_requested avec le nom du service sélectionné
  useEffect(() => {
    if (defaultServiceName && isOpen) {
      setValue('service_requested', defaultServiceName);
    }
  }, [defaultServiceName, isOpen, setValue]);

  const onSubmit = async (data: QuoteRequestFormData) => {
    setIsSubmitting(true);

    try {
      const createdQuote = await PortfolioService.createPublicQuote(userId, {
        ...data,
        card_id: cardId,
        project_id: projectId,
        urgency: data.urgency as Urgency,
        client_name: data.client_name ?? '',
        client_email: data.client_email ?? '',
        client_phone: data.client_phone ?? '',
        client_company: data.client_company ?? '',
        service_requested: data.service_requested ?? '',
        project_description: data.project_description ?? '',
        budget_range: data.budget_range ?? '',
        preferred_start_date: data.preferred_start_date ?? '',
      });

      // ✅ NOUVEAU: Envoyer les notifications email
      if (createdQuote?.id) {
        sendNewQuoteEmails(createdQuote.id).catch((emailError) => {
          console.error("Quote email notification failed:", emailError);
          // Don't fail the quote if email fails
        });
      }

      // Track l'événement
      await PortfolioService.trackEvent(userId, 'quote_request', {
        projectId,
        cardId
      });

      // Créer automatiquement le contact
      try {
        if (cardId) {
          await ContactAutoCreation.createContactFromQuoteRequest(cardId, {
            client_name: data.client_name,
            client_email: data.client_email,
            client_phone: data.client_phone,
            client_company: data.client_company,
            service_requested: data.service_requested,
            budget_range: data.budget_range,
            notes: data.project_description
          });
        }
      } catch (contactError) {
        // Warning log removed
        // Ne pas faire échouer la demande de devis si la création du contact échoue
      }

      setIsSuccess(true);

      toast({
        title: 'Demande envoyée !',
        description: 'Votre demande de devis a été envoyée avec succès. Vous recevrez une réponse rapidement.',
      });

      // Réinitialiser après 2 secondes
      setTimeout(() => {
        reset();
        setIsSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la demande. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[92vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-lg portfolio-modal-fix p-4 sm:p-6 mx-0 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-light flex items-center gap-2 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {isSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                Demande envoyée !
              </>
            ) : (
              <>
                <Send className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: brandColor }} />
                Demander un devis
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isSuccess
              ? 'Votre demande a été envoyée avec succès. Vous recevrez une réponse rapidement.'
              : 'Remplissez ce formulaire pour recevoir un devis personnalisé.'}
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
            {/* Informations personnelles */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-light text-gray-900 text-sm sm:text-base tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.01em',
                }}
              >Vos informations</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="client_name" className="text-sm">
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="client_name"
                    {...register('client_name')}
                    placeholder="Jean Dupont"
                    className={`portfolio-input-fix text-base ${errors.client_name ? 'border-red-500' : ''}`}
                  />
                  {errors.client_name && (
                    <p className="text-xs sm:text-sm text-red-500">{errors.client_name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="client_email" className="text-sm">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="client_email"
                    type="email"
                    {...register('client_email')}
                    placeholder="jean@example.com"
                    className={`portfolio-input-fix text-base ${errors.client_email ? 'border-red-500' : ''}`}
                  />
                  {errors.client_email && (
                    <p className="text-xs sm:text-sm text-red-500">{errors.client_email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="client_phone" className="text-sm">Téléphone</Label>
                  <Input
                    id="client_phone"
                    type="tel"
                    {...register('client_phone')}
                    placeholder="+241 06 12 34 56 78"
                    className="portfolio-input-fix text-base"
                  />
                </div>

                {/* Entreprise */}
                <div className="space-y-2">
                  <Label htmlFor="client_company" className="text-sm">Entreprise</Label>
                  <Input
                    id="client_company"
                    {...register('client_company')}
                    placeholder="Mon Entreprise SARL"
                    className="portfolio-input-fix text-base"
                  />
                </div>
              </div>
            </div>

            {/* Détails du projet */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-light text-gray-900 text-sm sm:text-base tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.01em',
                }}
              >Votre projet</h3>

              {/* Service demandé */}
              <div className="space-y-2">
                <Label htmlFor="service_requested" className="text-sm">
                  Service demandé <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="service_requested"
                  {...register('service_requested')}
                  placeholder="Ex: Création d'identité visuelle complète"
                  className={`portfolio-input-fix text-base ${errors.service_requested ? 'border-red-500' : ''}`}
                />
                {errors.service_requested && (
                  <p className="text-xs sm:text-sm text-red-500">{errors.service_requested.message}</p>
                )}
              </div>

              {/* Description du projet */}
              <div className="space-y-2">
                <Label htmlFor="project_description" className="text-sm">
                  Description détaillée de votre projet
                </Label>
                <Textarea
                  id="project_description"
                  {...register('project_description')}
                  placeholder="Décrivez votre projet, vos besoins, vos objectifs..."
                  rows={4}
                  className="resize-none portfolio-input-fix text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Budget */}
                <div className="space-y-2">
                  <Label htmlFor="budget_range" className="text-sm">Budget indicatif</Label>
                  <Select
                    onValueChange={(value) => setValue('budget_range', value)}
                  >
                    <SelectTrigger className="portfolio-select-fix text-base">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="portfolio-select-options">
                      <SelectItem value="<20000">Moins de 20 000 FCFA</SelectItem>
                      <SelectItem value="20000-50000">20 000 - 50 000 FCFA</SelectItem>
                      <SelectItem value="50000-100000">50 000 - 100 000 FCFA</SelectItem>
                      <SelectItem value="100000-500000">100 000 - 500 000 FCFA</SelectItem>
                      <SelectItem value=">500000">Plus de 500 000 FCFA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Urgence */}
                <div className="space-y-2">
                  <Label htmlFor="urgency" className="text-sm">Urgence</Label>
                  <Select
                    value={selectedUrgency}
                    onValueChange={(value) => setValue('urgency', value as Urgency)}
                  >
                    <SelectTrigger className="portfolio-select-fix text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="portfolio-select-options">
                      <SelectItem value="flexible">Flexible</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date de début */}
                <div className="space-y-2">
                  <Label htmlFor="preferred_start_date" className="text-sm">Date de début souhaitée</Label>
                  <Input
                    id="preferred_start_date"
                    type="date"
                    {...register('preferred_start_date')}
                    min={new Date().toISOString().split('T')[0]}
                    className="portfolio-input-fix text-base"
                  />
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                style={{
                  background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-gray-600">
              Fermeture automatique...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
