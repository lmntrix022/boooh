import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Shield, UserX, AlertTriangle, Send } from 'lucide-react';

interface UserActionsProps {
  userId: string;
  userEmail?: string;
  userName?: string;
  isAdmin: boolean;
}

const UserActions: React.FC<UserActionsProps> = ({ userId, userEmail, userName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Mutation pour réinitialiser le mot de passe
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      // Utiliser l'API Supabase Auth pour réinitialiser le mot de passe
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail || '', {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "Un email de réinitialisation a été envoyé à l'utilisateur.",
      });
      setIsResetPasswordOpen(false);
    },
    onError: (_error) => {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email de réinitialisation.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour suspendre/réactiver l'utilisateur
  const suspendUserMutation = useMutation({
    mutationFn: async (suspended: boolean) => {
      // Mettre à jour le statut de l'utilisateur dans la table profiles
      // Type assertion: profiles table update type not in generated types
      const { error } = await (supabase
        .from('profiles')
        .update as any)({
          is_suspended: suspended,
          suspended_at: suspended ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, suspended) => {
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
      toast({
        title: "Statut mis à jour",
        description: `L'utilisateur a été ${suspended ? 'suspendu' : 'réactivé'} avec succès.`,
        variant: suspended ? "destructive" : "default",
      });
      setIsSuspendOpen(false);
    },
    onError: (_error) => {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification du statut.",
        variant: "destructive",
      });
    }
  });

  // Mutation pour envoyer un email
  const sendEmailMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      // Enregistrer l'email dans les logs admin
      // Type assertion: admin_logs table not in generated types
      const { error } = await (supabase
        .from('admin_logs')
        .insert as any)({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'send_email',
          resource_type: 'user',
          resource_id: userId,
          details: { subject, message, recipient: userEmail }
        });

      if (error) throw error;

      // TODO: Intégrer avec un service d'email (SendGrid, Mailgun, etc.)
      // Log removed
    },
    onSuccess: () => {
      toast({
        title: "Email enregistré",
        description: "L'email a été enregistré et sera envoyé prochainement.",
      });
      setIsSendEmailOpen(false);
      setEmailSubject('');
      setEmailMessage('');
    },
    onError: (_error) => {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de l'email.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-4">
      {/* Actions rapides */}
      <Card className="bg-white/70 backdrop-blur-xl border-2 border-gradient-to-r from-blue-200/30 via-purple-200/20 to-emerald-100/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Actions utilisateur</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Réinitialiser mot de passe */}
          <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Réinitialiser le mot de passe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                <DialogDescription>
                  Un email de réinitialisation sera envoyé à {userEmail}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsResetPasswordOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => resetPasswordMutation.mutate()}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Envoyer l'email
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Suspendre/Réactiver */}
          <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <UserX className="h-4 w-4 mr-2" />
                Suspendre/Réactiver le compte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gérer le statut du compte</DialogTitle>
                <DialogDescription>
                  Suspendre ou réactiver le compte de {userName || userEmail}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  La suspension empêchera l'utilisateur de se connecter à son compte.
                </span>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsSuspendOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => suspendUserMutation.mutate(true)}
                  disabled={suspendUserMutation.isPending}
                >
                  {suspendUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  Suspendre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Envoyer un email */}
          <Dialog open={isSendEmailOpen} onOpenChange={setIsSendEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Envoyer un email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Envoyer un email</DialogTitle>
                <DialogDescription>
                  Envoyer un email personnalisé à {userEmail}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Sujet</Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Sujet de l'email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-message">Message</Label>
                  <Textarea
                    id="email-message"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Votre message..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSendEmailOpen(false);
                    setEmailSubject('');
                    setEmailMessage('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => sendEmailMutation.mutate({ subject: emailSubject, message: emailMessage })}
                  disabled={sendEmailMutation.isPending || !emailSubject || !emailMessage}
                >
                  {sendEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActions;
