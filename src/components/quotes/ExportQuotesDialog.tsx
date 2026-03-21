import React, { useState } from 'react';
import { ServiceQuote } from '@/services/portfolioService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { FileDown, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';

interface ExportQuotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: ServiceQuote[];
}

type ExportFormat = 'csv' | 'json';

export const ExportQuotesDialog: React.FC<ExportQuotesDialogProps> = ({
  isOpen,
  onClose,
  quotes
}) => {
  const { toast } = useToast();
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    const headers = [
      'Date de création',
      'Client',
      'Entreprise',
      'Email',
      'Téléphone',
      'Service demandé',
      'Description',
      'Budget indicatif',
      'Urgence',
      'Date de début souhaitée',
      'Statut',
      'Montant du devis',
      'Notes internes'
    ];

    const rows = quotes.map(q => [
      new Date(q.created_at).toLocaleDateString('fr-FR'),
      q.client_name,
      q.client_company || '',
      q.client_email,
      q.client_phone || '',
      q.service_requested,
      q.project_description || '',
      q.budget_range || '',
      q.urgency || '',
      q.preferred_start_date ? new Date(q.preferred_start_date).toLocaleDateString('fr-FR') : '',
      q.status,
      q.quote_amount?.toString() || '',
      q.internal_notes || ''
    ]);

    // Créer le CSV avec UTF-8 BOM pour Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const exportData = quotes.map(q => ({
      id: q.id,
      date_creation: q.created_at,
      client: {
        nom: q.client_name,
        entreprise: q.client_company,
        email: q.client_email,
        telephone: q.client_phone,
      },
      demande: {
        service: q.service_requested,
        description: q.project_description,
        budget_indicatif: q.budget_range,
        urgence: q.urgency,
        date_debut_souhaitee: q.preferred_start_date,
      },
      devis: {
        statut: q.status,
        montant: q.quote_amount,
        devise: q.quote_currency,
        date_envoi: q.quote_sent_at,
        date_expiration: (q as any).valid_until || q.quote_expires_at,
      },
      suivi: {
        notes_internes: q.internal_notes,
        converti_en_facture: q.converted_to_invoice_id,
        date_conversion: q.conversion_date,
        derniere_interaction: q.last_contact_at,
      }
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (format === 'csv') {
        exportToCSV();
        toast({
          title: 'Export réussi',
          description: `${quotes.length} devis exportés en CSV.`,
        });
      } else {
        exportToJSON();
        toast({
          title: 'Export réussi',
          description: `${quotes.length} devis exportés en JSON.`,
        });
      }

      // Petit délai pour l'UX
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);

    } catch (error) {
      // Error log removed
      toast({
        title: 'Erreur d\'export',
        description: 'Une erreur est survenue lors de l\'export.',
        variant: 'destructive',
      });
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-card border-2 border-white/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileDown className="h-5 w-5 text-purple-600" />
            Exporter les Devis
          </DialogTitle>
          <DialogDescription>
            Exportez vos {quotes.length} devis dans le format de votre choix.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection du format */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Format d'export</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">CSV (Excel)</p>
                    <p className="text-sm text-gray-500">Compatible avec Excel, Google Sheets</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileJson className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">JSON</p>
                    <p className="text-sm text-gray-500">Format structuré pour développeurs</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 Astuce :</strong> Le fichier CSV s'ouvrira directement dans Excel avec tous vos devis organisés en colonnes.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
