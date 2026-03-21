import { Invoice, InvoiceSettings } from '../invoiceService';
import { BasePdfTemplate } from './basePdfTemplate';

/**
 * Template Minimal — Luxe noir & blanc
 * Typographie puissante, carte client, double ligne, espace généreux
 */
export class MinimalPdfTemplate extends BasePdfTemplate {
  async generate(doc: any, invoice: Invoice, settings: InvoiceSettings | null): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    let yPosition = margin;

    const black = [15, 23, 42];
    const gray = [71, 85, 105];
    const cream = [250, 250, 249];
    const border = [226, 232, 240];

    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    doc.setDrawColor(...black);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...black);
    doc.text('FACTURE', margin, yPosition + 10);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(invoice.invoice_number, pageWidth - margin, yPosition + 10, { align: 'right' });

    yPosition += 20;

    doc.setDrawColor(...border);
    doc.setLineWidth(0.2);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 14;

    const col1X = margin;
    const col2X = pageWidth / 2 + 16;
    const clientW = pageWidth - col2X - margin;
    const clientH = 42;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text('ÉMETTEUR', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...black);
    yPosition += 6;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    doc.setTextColor(...gray);
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
      doc.text(settings.company_phone, col1X, yPosition);
      yPosition += 3.8;
    }
    if (settings?.company_email) doc.text(settings.company_email, col1X, yPosition);

    const clientY = margin + 46;
    doc.setFillColor(...cream);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 2, 2, 'F');
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 2, 2, 'S');

    let cy = clientY + 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text('CLIENT', col2X, cy);

    doc.setFontSize(11);
    doc.setTextColor(...black);
    cy += 6;
    doc.text(invoice.client_name, col2X, cy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
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
    doc.setTextColor(...gray);
    doc.text(`Émis ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, col1X, yPosition);
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

    doc.setDrawColor(...black);
    doc.setLineWidth(0.4);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);
    yPosition += 10;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, cream, black, black);
    await this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, gray, border);
  }
}
