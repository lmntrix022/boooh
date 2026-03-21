import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, Send, Phone, Loader2, Paperclip, Gift, FileText, Sparkles } from 'lucide-react';
import { ScannedContact } from '@/services/scannedContactsService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

interface CommunicationCenterProps {
  contact: ScannedContact;
  onSent?: () => void;
}

export const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ 
  contact, 
  onSent 
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [sending, setSending] = useState(false);

  const sendEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast({
        title: t('communication.toasts.fieldsRequired.title'),
        description: t('communication.toasts.fieldsRequired.description'),
        variant: "destructive"
      });
      return;
    }

    if (!contact.email) {
      toast({
        title: t('communication.toasts.emailMissing.title'),
        description: t('communication.toasts.emailMissing.description'),
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      console.log('📧 Sending CRM email:', {
        to: contact.email,
        subject: emailSubject,
        message: emailBody,
        type: 'crm',
        contact_name: contact.full_name
      });

      // Utiliser la fonction send-invoice-email qui fonctionne déjà
      const { EmailService } = await import('@/services/emailService');

      // Adapter les données pour le format de la fonction send-invoice-email
      const invoiceData = {
        invoice_number: `CRM-${Date.now()}`, // Numéro temporaire pour le CRM
        client_name: contact.full_name || 'Contact',
        client_email: contact.email,
        total_ttc: 0, // Pas de montant pour les emails CRM
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        user_name: 'CRM Bööh',
        // Nouveaux champs pour les emails personnalisés
        custom_message: emailBody,
        custom_subject: emailSubject,
        email_type: 'crm' as const
      };

      const result = await EmailService.sendInvoiceEmail(invoiceData);
      
      toast({ 
        title: t('communication.toasts.emailSent.title'),
        description: t('communication.toasts.emailSent.description', { name: contact.full_name })
      });
      
      setEmailSubject('');
      setEmailBody('');
      onSent?.();
    } catch (error) {
      toast({ 
        title: t('communication.toasts.emailError.title'), 
        description: t('communication.toasts.emailError.description'),
        variant: 'destructive' 
      });
    } finally {
      setSending(false);
    }
  };

  const openWhatsApp = () => {
    if (!smsBody) {
      toast({
        title: t('communication.toasts.messageRequired.title'),
        description: t('communication.toasts.messageRequired.description'),
        variant: "destructive"
      });
      return;
    }

    const message = encodeURIComponent(smsBody);
    const phone = contact.phone?.replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    toast({
      title: t('communication.toasts.whatsappOpened.title'),
      description: t('communication.toasts.whatsappOpened.description')
    });
    
    setSmsBody('');
    onSent?.();
  };

  const applyTemplate = (type: 'relance' | 'offre' | 'facture') => {
    switch (type) {
      case 'relance':
        setEmailSubject(t('communication.emailTemplates.relance.subject'));
        setEmailBody(t('communication.emailTemplates.relance.body', { name: contact.full_name }));
        break;
      case 'offre':
        setEmailSubject(t('communication.emailTemplates.offre.subject'));
        setEmailBody(t('communication.emailTemplates.offre.body', { name: contact.full_name }));
        break;
      case 'facture':
        setEmailSubject(t('communication.emailTemplates.facture.subject'));
        setEmailBody(t('communication.emailTemplates.facture.body', { name: contact.full_name }));
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <CardHeader className="bg-white p-6 border-b border-gray-200">
          <CardTitle className="flex items-center gap-3 text-xl font-light tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-gray-900">
              {t('communication.title', { name: contact.full_name })}
            </span>
          </CardTitle>
          <p className="text-gray-500 mt-2 font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('communication.description')}
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1 mb-6">
              <TabsTrigger 
                value="email" 
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                {t('communication.email')}
              </TabsTrigger>
              <TabsTrigger 
                value="whatsapp"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                {t('communication.whatsapp')}
              </TabsTrigger>
            </TabsList>

          <TabsContent value="email" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-light text-gray-500 mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('communication.emailSubject')}
                </label>
                <Input
                  placeholder={t('communication.emailSubjectPlaceholder')}
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all bg-white font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-light text-gray-500 mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('communication.message')}
                </label>
                <Textarea
                  placeholder={t('communication.messagePlaceholder')}
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all resize-none bg-white font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>
            </motion.div>
            
            {/* Templates rapides avec design amélioré */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('communication.templates')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => applyTemplate('relance')}
                  type="button"
                  className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Paperclip className="w-4 h-4 mr-2 text-gray-600" />
                  <div className="text-left">
                    <div className="font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.01em',
                      }}
                    >{t('communication.templatesRelance.title')}</div>
                    <div className="text-xs text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('communication.templatesRelance.subtitle')}</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => applyTemplate('offre')}
                  type="button"
                  className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Gift className="w-4 h-4 mr-2 text-gray-600" />
                  <div className="text-left">
                    <div className="font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.01em',
                      }}
                    >{t('communication.templatesOffre.title')}</div>
                    <div className="text-xs text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('communication.templatesOffre.subtitle')}</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => applyTemplate('facture')}
                  type="button"
                  className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <FileText className="w-4 h-4 mr-2 text-gray-600" />
                  <div className="text-left">
                    <div className="font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.01em',
                      }}
                    >{t('communication.templatesFacture.title')}</div>
                    <div className="text-xs text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('communication.templatesFacture.subtitle')}</div>
                  </div>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                onClick={sendEmail} 
                disabled={sending || !contact.email} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-3 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('communication.sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {t('communication.sendEmail')}
                  </>
                )}
              </Button>

              {!contact.email && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    {t('communication.noEmail')}
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-light text-gray-500 mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('communication.whatsappMessage')}
                </label>
                <Textarea
                  placeholder={t('communication.whatsappPlaceholder')}
                  rows={8}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-200 transition-all resize-none bg-white font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('communication.characters', { count: smsBody.length })}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('communication.whatsappRecommended')}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                onClick={openWhatsApp} 
                disabled={!contact.phone}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-3 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <Phone className="w-5 h-5 mr-2" />
                {t('communication.openWhatsApp')}
              </Button>

              {!contact.phone && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    {t('communication.noPhone')}
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </motion.div>
  );
};

