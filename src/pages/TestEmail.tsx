import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmailService } from '@/services/emailService';

const TestEmail: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleTestEmail = async () => {
    if (!email) {
      toast({
        title: 'Email requis',
        description: 'Veuillez entrer une adresse email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await EmailService.sendInvoiceEmail({
        invoice_number: 'TEST-001',
        client_name: 'Client Test',
        client_email: email,
        total_ttc: 50000,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_name: 'Test User',
      });

      setTestResult({
        success: true,
        message: 'Email de test envoyé avec succès !',
        details: result,
      });

      toast({
        title: 'Email envoyé !',
        description: `Vérifiez votre boîte mail à ${email}`,
      });
    } catch (error: any) {
      // Error log removed
      setTestResult({
        success: false,
        message: 'Erreur lors de l\'envoi',
        details: error.message || error.toString(),
      });

      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'email de test',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceAvailability = async () => {
    setIsLoading(true);
    try {
      const available = await EmailService.isEmailServiceAvailable();

      if (available) {
        setTestResult({
          success: true,
          message: 'Service d\'email disponible',
          details: 'La fonction Edge Supabase est accessible',
        });
        toast({
          title: 'Service disponible',
          description: 'La fonction d\'envoi d\'email est opérationnelle',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Service d\'email non disponible',
          details: 'La fonction Edge Supabase n\'est pas accessible',
        });
        toast({
          title: 'Service non disponible',
          description: 'Vérifiez que la fonction est déployée',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Erreur lors de la vérification',
        details: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6 px-4 md:px-6">
        <PageHeader
          icon={Mail}
          title="Test d'envoi d'email"
          iconGradient="from-blue-400 via-indigo-400 to-purple-500"
          description="Testez la configuration du service d'envoi d'email"
        />

        <div className="grid gap-6 mt-6">
          {/* Card de test */}
          <Card className="glass-card border-2 border-white/30">
            <CardHeader>
              <CardTitle>Envoyer un email de test</CardTitle>
              <CardDescription>
                Envoyez un email de facture fictif pour vérifier que tout fonctionne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-email">Votre adresse email</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="votre-email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-blue-200"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleTestEmail}
                  disabled={!email || isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer l'email de test
                    </>
                  )}
                </Button>

                <Button
                  onClick={checkServiceAvailability}
                  disabled={isLoading}
                  variant="outline"
                  className="border-blue-200"
                >
                  Vérifier le service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultat du test */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert
                className={
                  testResult.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertTitle
                  className={testResult.success ? 'text-green-900' : 'text-red-900'}
                >
                  {testResult.message}
                </AlertTitle>
                <AlertDescription
                  className={testResult.success ? 'text-green-800' : 'text-red-800'}
                >
                  {testResult.success ? (
                    <>
                      <p className="mb-2">
                        L'email de test a été envoyé avec succès. Vérifiez votre boîte mail
                        (et les spams si nécessaire).
                      </p>
                      {testResult.details && (
                        <div className="mt-2 p-3 bg-white/50 rounded-lg">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(testResult.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="mb-2">Une erreur s'est produite lors de l'envoi.</p>
                      <div className="mt-2 p-3 bg-white/50 rounded-lg">
                        <p className="text-sm font-mono">{testResult.details}</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="font-semibold">Solutions possibles :</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>
                            Vérifiez que la fonction Edge est déployée sur Supabase
                          </li>
                          <li>
                            Vérifiez que la clé RESEND_API_KEY est configurée
                          </li>
                          <li>
                            Consultez les logs dans le dashboard Supabase
                          </li>
                          <li>
                            Exécutez le script de déploiement : <code>./deploy-email-function.sh</code>
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Instructions */}
          <Card className="glass-card border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-blue-900">
                📋 Instructions de configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-blue-900">
              <div>
                <h4 className="font-semibold mb-2">1. Vérifier la configuration</h4>
                <p>Avant d'envoyer l'email, assurez-vous que :</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>La fonction Edge est déployée sur Supabase</li>
                  <li>La clé API Resend est configurée</li>
                  <li>Votre projet Supabase est lié localement</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Déployer la fonction (si nécessaire)</h4>
                <div className="bg-white/70 p-3 rounded-lg font-mono text-xs">
                  <p>cd /Users/valerie/Downloads/boooh-main</p>
                  <p>./deploy-email-function.sh</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Tester l'envoi</h4>
                <p>
                  Entrez votre adresse email ci-dessus et cliquez sur "Envoyer l'email de test".
                  Vous devriez recevoir un email avec une facture fictive.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Vérifier les logs (en cas d'erreur)</h4>
                <p>Consultez les logs Supabase pour plus de détails :</p>
                <div className="bg-white/70 p-3 rounded-lg font-mono text-xs mt-2">
                  <a
                    href="https://supabase.com/dashboard/project/tgqrnrqpeaijtrlnbgfj/functions/send-invoice-email/logs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Voir les logs →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card className="glass-card border-2 border-white/30">
            <CardHeader>
              <CardTitle>📚 Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <a
                  href="/SOLUTION_EMAIL_FACTURE.md"
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  → Solution complète pour l'envoi d'email
                </a>
              </div>
              <div>
                <a
                  href="/GUIDE_DEPLOIEMENT_EMAIL.md"
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  → Guide de déploiement détaillé
                </a>
              </div>
              <div>
                <a
                  href="/supabase/functions/send-invoice-email/README.md"
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  → README de la fonction Edge
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestEmail;
