import { Invoice, InvoiceSettings } from '../invoiceService';
import { BasePdfTemplate } from './basePdfTemplate';

/**
 * Template Classique — Luxe bleu marine
 * En-tête raffiné, carte client crème, double ligne, espace généreux
 */
export class ClassicPdfTemplate extends BasePdfTemplate {
  async generate(doc: any, invoice: Invoice, settings: InvoiceSettings | null): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    let yPosition = margin;

    const navy = [25, 57, 108];
    const charcoal = [51, 65, 85];
    const warmGray = [100, 116, 139];
    const cream = [252, 251, 248];
    const border = [203, 213, 225];

    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('FACTURE', margin, 18);

    doc.setFontSize(11);
    doc.setTextColor(226, 232, 240);
    doc.text(invoice.invoice_number, pageWidth - margin, 18, { align: 'right' });

    yPosition = 38;
    const col1X = margin;
    const col2X = pageWidth / 2 + 16;
    const clientW = pageWidth - col2X - margin;
    const clientH = 42;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('DE', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...charcoal);
    yPosition += 6;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    doc.setTextColor(...warmGray);
    if (settings?.company_siret) {
      doc.text(`RCCM: ${settings.company_siret}`, col1X, yPosition);
      yPosition += 3.8;
    }
    if (settings?.company_nif) {
      doc.text(`NIF: ${settings.company_nif}`, col1X, yPosition);
      yPosition += 3.8;
    }
    if (settings?.company_vat_number) {
      doc.text(`N° TVA: ${settings.company_vat_number}`, col1X, yPosition);
      yPosition += 3.8;
    }
    if (settings?.company_address) {
      const lines = doc.splitTextToSize(settings.company_address, 88);
      doc.text(lines, col1X, yPosition);
      yPosition += lines.length * 3.8;
    }
    if (settings?.company_phone) {
      doc.text(`Tél: ${settings.company_phone}`, col1X, yPosition);
      yPosition += 3.8;
    }
    if (settings?.company_email) doc.text(`Email: ${settings.company_email}`, col1X, yPosition);

    const clientY = 38;
    doc.setFillColor(...cream);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 2, 2, 'F');
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 2, 2, 'S');

    let cy = clientY + 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('À', col2X, cy);

    doc.setFontSize(11);
    doc.setTextColor(...charcoal);
    cy += 6;
    doc.text(invoice.client_name, col2X, cy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...warmGray);
    cy += 4;
    if (invoice.client_address) {
      const al = doc.splitTextToSize(invoice.client_address, clientW - 4);
      doc.text(al, col2X, cy);
      cy += al.length * 3.5;
    }
    if (invoice.client_email) doc.text(invoice.client_email, col2X, cy);
    cy += 3.5;
    if (invoice.client_phone) doc.text(invoice.client_phone, col2X, cy);

    yPosition = Math.max(yPosition, clientY + clientH) + 14;

    doc.setFontSize(9);
    doc.setTextColor(...warmGray);
    doc.text(`Émise le ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, col1X, yPosition);
    doc.text(`Échéance ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    yPosition += 6;

    const statusText = this.getStatusLabel(invoice.status);
    const statusColor = this.getStatusColor(invoice.status);
    doc.setFillColor(...statusColor);
    doc.roundedRect(col1X, yPosition - 2.5, 30, 5, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, col1X + 4, yPosition + 0.5);

    yPosition += 12;

    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);
    yPosition += 10;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, cream, charcoal, navy);
    await this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, charcoal, navy);
  }
}
