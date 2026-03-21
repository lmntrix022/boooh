import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, CheckCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { InvoiceService } from '@/services/invoiceService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportFormat = 'csv' | 'fec';

export const ExportDialog: React.FC<ExportDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!user) {
      toast.error(t('invoice.export.errors.notConnected'));
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'csv') {
        await InvoiceService.exportAndDownloadCSV(user.id);
        toast.success(t('invoice.export.success.csv'));
      } else {
        await InvoiceService.exportAndDownloadFEC(user.id);
        toast.success(t('invoice.export.success.fec'));
      }
      onOpenChange(false);
    } catch (error) {
      // Error log removed
      toast.error(t('invoice.export.errors.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border border-gray-200 shadow-sm rounded-lg max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 gray-600 flex items-center justify-center">
              <FileDown className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-blue-900">
              {t('invoice.export.title')}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="text-gray-700 space-y-4">
              <p>
                {t('invoice.export.description')}
              </p>

              <div className="space-y-4">
                <Label className="text-sm font-light text-gray-900">{t('invoice.export.formatLabel')}</Label>
                <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
                  {/* CSV Export */}
                  <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all cursor-pointer">
                    <RadioGroupItem value="csv" id="csv" className="mt-1" />
                    <label htmlFor="csv" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <FileSpreadsheet className="w-5 h-5 text-gray-900" />
                        <span className="font-semibold text-gray-900">{t('invoice.export.csv.title')}</span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {t('invoice.export.csv.description')}
                      </p>
                    </label>
                  </div>

                  {/* FEC Export */}
                  <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all cursor-pointer">
                    <RadioGroupItem value="fec" id="fec" className="mt-1" />
                    <label htmlFor="fec" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-gray-900" />
                        <span className="font-semibold text-gray-900">{t('invoice.export.fec.title')}</span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {t('invoice.export.fec.description')}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-blue-700 bg-blue-100 rounded-md px-2 py-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        {t('invoice.export.fec.compliant')}
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>{t('invoice.export.note.label')}</strong> {t('invoice.export.note.text')}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isExporting}
            className="glass border border-gray-200/50 text-gray-900 hover:bg-white/80 shadow hover:shadow-md transition-all duration-300 rounded-lg"
          >
            {t('invoice.export.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gray-900 gray-600 hover:gray-600 hover:to-purple-600 text-white shadow-md hover:shadow-md transition-all duration-300 rounded-lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('invoice.export.exporting')}
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                {t('invoice.export.export')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
