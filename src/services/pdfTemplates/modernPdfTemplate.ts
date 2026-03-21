import { Invoice, InvoiceSettings } from '../invoiceService';
import { BasePdfTemplate } from './basePdfTemplate';

/**
 * Template Moderne — Design premium indigo
 * Gradient, carte client raffinée, double ligne, espace généreux
 */
export class ModernPdfTemplate extends BasePdfTemplate {
  async generate(doc: any, invoice: Invoice, settings: InvoiceSettings | null): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    let yPosition = margin;

    const indigo = [67, 56, 202];
    const indigoLight = [99, 102, 241];
    const charcoal = [30, 41, 59];
    const slateGray = [100, 116, 139];
    const cream = [248, 250, 252];
    const border = [226, 232, 240];

    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const r = Math.round(indigo[0] + (indigoLight[0] - indigo[0]) * t);
      const g = Math.round(indigo[1] + (indigoLight[1] - indigo[1]) * t);
      const b = Math.round(indigo[2] + (indigoLight[2] - indigo[2]) * t);
      doc.setFillColor(r, g, b);
      doc.rect(0, i, pageWidth, 1, 'F');
    }

    yPosition = 12;
    const badgeW = 58;
    const badgeH = 22;
    const badgeX = pageWidth - margin - badgeW;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(badgeX, yPosition, badgeW, badgeH, 3, 3, 'F');
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(badgeX, yPosition, badgeW, badgeH, 3, 3, 'S');

    doc.setFontSize(7);
    doc.setTextColor(...slateGray);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', badgeX + badgeW / 2, yPosition + 7, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(...indigo);
    doc.text(invoice.invoice_number, badgeX + badgeW / 2, yPosition + 17, { align: 'center' });

    yPosition = 42;
    const col1X = margin;
    const col2X = pageWidth / 2 + 16;
    const clientW = pageWidth - col2X - margin;
    const clientH = 44;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...indigo);
    doc.text('ÉMETTEUR', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...charcoal);
    yPosition += 6;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
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

    const clientY = 42;
    doc.setFillColor(...cream);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 4, 4, 'F');
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 4, 4, 'S');

    let cy = clientY + 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...indigo);
    doc.text('FACTURÉ À', col2X, cy);

    doc.setFontSize(11);
    doc.setTextColor(...charcoal);
    cy += 6;
    doc.text(invoice.client_name, col2X, cy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    cy += 4;
    if (invoice.client_address) {
      const al = doc.splitTextToSize(invoice.client_address, clientW - 4);
      doc.text(al, col2X, cy);
      cy += al.length * 3.5;
    }
    if (invoice.client_email) doc.text(invoice.client_email, col2X, cy);
    cy += 3.5;
    if (invoice.client_phone) doc.text(invoice.client_phone, col2X, cy);

    yPosition = clientY + clientH + 14;

    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    doc.text(`Émise le ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, col1X, yPosition);
    doc.text(`Échéance ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    yPosition += 6;

    const statusText = this.getStatusLabel(invoice.status);
    const statusColor = this.getStatusColor(invoice.status);
    doc.setFillColor(...statusColor);
    doc.roundedRect(col1X, yPosition - 2.5, 32, 5, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, col1X + 4, yPosition + 0.5);

    yPosition += 12;

    doc.setDrawColor(...indigo);
    doc.setLineWidth(0.4);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);
    yPosition += 10;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, cream, charcoal, indigo, indigoLight);
    await this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, charcoal, indigo);
  }
}
