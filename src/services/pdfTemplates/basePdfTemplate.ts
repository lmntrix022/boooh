import { Invoice, InvoiceSettings } from '../invoiceService';
import { generateInvoiceQrDataUrl } from '../invoiceQrCodeService';

/**
 * Classe de base pour tous les templates PDF
 * Contient les méthodes utilitaires partagées
 */
export abstract class BasePdfTemplate {
  /**
   * Méthode abstraite que chaque template doit implémenter
   */
  abstract generate(doc: any, invoice: Invoice, settings: InvoiceSettings | null): Promise<void>;

  /**
   * Ajoute un logo en filigrane au centre de la page
   */
  protected async addWatermarkLogo(
    doc: any,
    logoUrl: string | null | undefined,
    pageWidth: number,
    pageHeight: number
  ) {
    if (!logoUrl) return;

    try {
      const img = await this.loadImageAsBase64(logoUrl);
      const watermarkSize = 48;
      const x = (pageWidth - watermarkSize) / 2;
      const y = (pageHeight - watermarkSize) / 2;

      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.06 }));
      doc.addImage(img, 'PNG', x, y, watermarkSize, watermarkSize);
      doc.restoreGraphicsState();
    } catch (error) {
      // Logo loading failed, continue without it
    }
  }

  /**
   * Charge une image depuis une URL et la convertit en base64
   */
  protected async loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Retourne le label du statut
   */
  protected getStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'sent':
        return 'Envoyée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Brouillon';
    }
  }

  /**
   * Formate un montant pour les factures PDF (point comme séparateur de milliers)
   * Ex: 50000 → "50.000" (au lieu de "50 000" ou "50/000")
   */
  protected formatAmountForPdf(amount: number): string {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /**
   * Retourne la couleur du badge de statut
   */
  protected getStatusColor(status: string): [number, number, number] {
    switch (status) {
      case 'paid':
        return [34, 197, 94]; // green-600
      case 'sent':
        return [59, 130, 246]; // blue-500
      case 'overdue':
        return [239, 68, 68]; // red-500
      case 'cancelled':
        return [107, 114, 128]; // gray-500
      default:
        return [156, 163, 175]; // gray-400
    }
  }

  /**
   * Dessine le tableau des articles (design premium, colonnes proportionnées)
   * Description: 55% | Qté: 8% | P.U.: 18% | Total: 19% — évite le chevauchement texte/montants
   */
  protected drawInvoiceTable(
    doc: any,
    invoice: Invoice,
    startY: number,
    margin: number,
    pageWidth: number,
    pageHeight: number,
    backgroundColor: [number, number, number],
    textColor: [number, number, number],
    primaryColor: [number, number, number],
    secondaryColor?: [number, number, number]
  ) {
    const items = invoice.items || [];
    const tableWidth = pageWidth - margin * 2;
    const colDesc = Math.floor(tableWidth * 0.55);
    const colQty = Math.floor(tableWidth * 0.08);
    const colPu = Math.floor(tableWidth * 0.18);
    const colTotal = Math.floor(tableWidth * 0.19);
    let yPosition = startY;

    // En-têtes du tableau (bande colorée)
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition - 1, tableWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.text('Description', margin + 3, yPosition + 5);
    doc.text('Qté', margin + colDesc + colQty - 2, yPosition + 5, { align: 'right' });
    doc.text('Prix unit.', margin + colDesc + colQty + colPu - 2, yPosition + 5, { align: 'right' });
    doc.text('Total HT', margin + colDesc + colQty + colPu + colTotal - 2, yPosition + 5, { align: 'right' });

    yPosition += 8;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    // Lignes du tableau
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    items.forEach((item, index) => {
      const descLines = doc.splitTextToSize(item.description || '', colDesc - 6);
      const rowHeight = Math.max(descLines.length * 4.5, 7);

      if (index % 2 === 0) {
        doc.setFillColor(...backgroundColor);
        doc.rect(margin, yPosition, tableWidth, rowHeight, 'F');
      }

      doc.text(descLines, margin + 3, yPosition + 4);
      doc.text(String(item.quantity || 1), margin + colDesc + colQty - 2, yPosition + 4, { align: 'right' });
      doc.text(`${this.formatAmountForPdf(item.unit_price_ht || 0)} FCFA`, margin + colDesc + colQty + colPu - 2, yPosition + 4, { align: 'right' });
      doc.text(`${this.formatAmountForPdf(item.total_ht || 0)} FCFA`, margin + colDesc + colQty + colPu + colTotal - 2, yPosition + 4, { align: 'right' });

      yPosition += rowHeight;
    });

    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    // Section totaux (bloc élargi pour montants en millions)
    yPosition += 5;
    const totalBoxRight = pageWidth - margin;
    const totalBlockLeft = totalBoxRight - 85; // 85 mm : labels + marge + montants longs (ex. 15.000.000 FCFA)

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Structure DGI : HT, CSS, TVA, TPS (précompte), TTC
    const totals = [
      ['Total HT:', this.formatAmountForPdf(invoice.total_ht) + ' FCFA'],
      ...(invoice.total_css && invoice.total_css !== 0 ? [['CSS (1%):', this.formatAmountForPdf(invoice.total_css) + ' FCFA']] : []),
      ...(invoice.total_vat > 0 ? [[`TVA (${invoice.vat_rate}%):`, this.formatAmountForPdf(invoice.total_vat) + ' FCFA']] : []),
      ...(invoice.total_tps && invoice.total_tps !== 0 ? [['TPS (-9,5%):', this.formatAmountForPdf(invoice.total_tps) + ' FCFA']] : []),
    ];

    totals.forEach(([label, value]) => {
      doc.text(label, totalBlockLeft, yPosition);
      doc.text(value, totalBoxRight - 3, yPosition, { align: 'right' });
      yPosition += 5;
    });

    // Total TTC — label et montant bien séparés (zone ~55 mm pour les millions)
    yPosition += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setFillColor(...primaryColor);
    doc.roundedRect(totalBlockLeft - 3, yPosition - 5, totalBoxRight - totalBlockLeft + 3, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Total TTC', totalBlockLeft, yPosition + 1);
    doc.text(this.formatAmountForPdf(invoice.total_ttc) + ' FCFA', totalBoxRight - 5, yPosition + 1, { align: 'right' });
  }

  /**
   * Dessine le footer du PDF (design premium) — layout à 2 colonnes : infos bancaires à gauche, QR DGI à droite
   */
  protected async drawFooter(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    textColor: [number, number, number],
    accentColor?: [number, number, number]
  ) {
    const accent = accentColor || [226, 232, 240];
    const grayMuted = [107, 114, 128];
    const footerTopY = pageHeight - 50;
    const colRightX = pageWidth - margin - 30; // Colonne droite pour le QR (26mm + marge)

    // Ligne de séparation fine
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.3);
    doc.line(margin, footerTopY, pageWidth - margin, footerTopY);

    let leftY = footerTopY + 6;
    const leftColWidth = colRightX - margin - 8;

    // Colonne gauche : coordonnées bancaires et conditions
    if (settings?.bank_details) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text('Coordonnées bancaires', margin, leftY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...grayMuted);
      const bankLines = doc.splitTextToSize(settings.bank_details, leftColWidth);
      doc.text(bankLines, margin, leftY + 4);
      leftY += bankLines.length * 3.5 + 6;
    }

    const paymentTerms = (settings as { default_payment_terms?: string })?.default_payment_terms;
    if (paymentTerms) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text('Conditions de règlement', margin, leftY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...grayMuted);
      const termsLines = doc.splitTextToSize(paymentTerms, leftColWidth);
      doc.text(termsLines, margin, leftY + 4);
      leftY += termsLines.length * 3.5 + 4;
    }

    // Colonne droite : QR Code DGI (26mm pour un scan fiable)
    const qrSize = 26;
    const qrX = colRightX;
    const qrY = footerTopY + 4;
    await this.addInvoiceQrCode(doc, invoice, settings, qrX, qrY, qrSize);

    // Mentions légales (pleine largeur, en bas)
    if (settings?.legal_mentions) {
      doc.setFontSize(6);
      doc.setTextColor(...grayMuted);
      const legalLines = doc.splitTextToSize(settings.legal_mentions, pageWidth - margin * 2);
      doc.text(legalLines, margin, pageHeight - 5);
    }
  }

  /**
   * Dessine le QR Code DGI intégré au footer (à droite des infos bancaires)
   */
  protected async addInvoiceQrCode(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null,
    x: number,
    y: number,
    sizeMm: number = 26
  ): Promise<void> {
    try {
      const qrDataUrl = await generateInvoiceQrDataUrl(invoice, settings, {
        size: 220, // Résolution suffisante pour un scan fiable
        margin: 2,
      });
      doc.addImage(qrDataUrl, 'PNG', x, y, sizeMm, sizeMm);
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Empreinte unique', x + sizeMm / 2, y + sizeMm + 4, { align: 'center' });
    } catch {
      // Si la génération échoue, continuer sans QR
    }
  }
}
