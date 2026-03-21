import { Invoice, InvoiceSettings } from './invoiceService';
import { ModernPdfTemplate } from './pdfTemplates/modernPdfTemplate';
import { PremiumPdfTemplate } from './pdfTemplates/premiumPdfTemplate';
import { ElegantPdfTemplate } from './pdfTemplates/elegantPdfTemplate';
import { CorporatePdfTemplate } from './pdfTemplates/corporatePdfTemplate';
import { LightPdfTemplate } from './pdfTemplates/lightPdfTemplate';
import { MinimalPdfTemplate } from './pdfTemplates/minimalPdfTemplate';
import { ClassicPdfTemplate } from './pdfTemplates/classicPdfTemplate';

/**
 * Service de génération de PDF pour les factures
 * Utilise jsPDF pour créer des PDF côté client avec templates modulaires
 */

export class PDFGenerationService {
  /**
   * Génère un PDF pour une facture
   * @param invoice - La facture à convertir en PDF
   * @param settings - Les paramètres de facturation
   * @returns URL du blob PDF
   */
  static async generateInvoicePDF(
    invoice: Invoice,
    settings: InvoiceSettings | null
  ): Promise<{ blobUrl: string; blob: Blob }> {
    // Import dynamique de jsPDF pour réduire la taille du bundle initial
    const { jsPDF } = await import('jspdf');

    // Créer un nouveau document PDF (A4)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const template = settings?.pdf_template || 'modern';

    // Obtenir l'instance du template appropriée
    const templateInstance = this.getTemplate(template);

    // Générer le PDF avec le template
    await templateInstance.generate(doc, invoice, settings);

    // Générer le PDF
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    return { blobUrl, blob: pdfBlob };
  }

  /**
   * Retourne l'instance du template appropriée
   */
  private static getTemplate(templateName: string) {
    switch (templateName) {
      case 'minimal':
        return new MinimalPdfTemplate();
      case 'classic':
        return new ClassicPdfTemplate();
      case 'premium':
        return new PremiumPdfTemplate();
      case 'elegant':
        return new ElegantPdfTemplate();
      case 'corporate':
        return new CorporatePdfTemplate();
      case 'light':
        return new LightPdfTemplate();
      case 'modern':
      default:
        return new ModernPdfTemplate();
    }
  }

  /**
   * Ajoute un logo en filigrane au centre de la page
   */
  private static async addWatermarkLogo(
    doc: any,
    logoUrl: string | null | undefined,
    pageWidth: number,
    pageHeight: number
  ) {
    if (!logoUrl) return;

    try {
      // Charger l'image en tant que base64
      const img = await this.loadImageAsBase64(logoUrl);

      // Calculer la position et la taille pour le filigrane
      const watermarkSize = 80; // Taille du filigrane
      const x = (pageWidth - watermarkSize) / 2;
      const y = (pageHeight - watermarkSize) / 2;

      // Sauvegarder l'état graphique actuel
      doc.saveGraphicsState();

      // Définir l'opacité (15% pour un filigrane subtil)
      doc.setGState(new doc.GState({ opacity: 0.15 }));

      // Ajouter l'image en filigrane
      doc.addImage(img, 'PNG', x, y, watermarkSize, watermarkSize);

      // Restaurer l'état graphique
      doc.restoreGraphicsState();
    } catch (error) {
      // Warning log removed
      // Ne pas bloquer la génération du PDF si le logo échoue
    }
  }

  /**
   * Charge une image depuis une URL et la convertit en base64
   */
  private static async loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Template moderne avec gradients et couleurs
   */
  private static async generateModernTemplate(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Couleurs modernes (alignées avec InvoicePreviewDialog)
    const primaryColor = [59, 130, 246]; // Bleu #3b82f6 (from-blue-500)
    const secondaryColor = [99, 102, 241]; // Indigo #6366f1 (to-indigo-500)
    const textColor = [31, 41, 55]; // Gris foncé #1f2937 (gray-800)
    const lightGray = [249, 250, 251]; // #f9fafb (gray-50)

    // Ajouter le logo en filigrane d'abord (en arrière-plan)
    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    // Bandeau de couleur en haut avec gradient simulé (bleu vers indigo)
    // Simuler un gradient avec plusieurs rectangles superposés
    for (let i = 0; i < 15; i++) {
      const ratio = i / 15;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(0, i, pageWidth, 1, 'F');
    }

    // Box avec FACTURE et numéro (style du preview)
    yPosition = 10;
    const boxWidth = 50;
    const boxHeight = 18;
    const boxX = pageWidth - margin - boxWidth;

    // Box avec gradient pour le numéro de facture
    for (let i = 0; i < boxHeight; i++) {
      const ratio = i / boxHeight;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.roundedRect(boxX, yPosition + i * boxHeight / boxHeight, boxWidth, 1, 2, 2, 'F');
    }

    // Texte FACTURE dans le box
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', boxX + boxWidth / 2, yPosition + 7, { align: 'center' });

    // Numéro de facture dans le box
    doc.setFontSize(14);
    doc.text(invoice.invoice_number, boxX + boxWidth / 2, yPosition + 15, { align: 'center' });

    yPosition = 30;

    // Section : Informations émetteur et client (2 colonnes)
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    // Émetteur (à gauche)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ÉMETTEUR', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 4;
    if (settings?.company_address) {
      const addrLines = doc.splitTextToSize(settings.company_address, 80);
      doc.text(addrLines, col1X, yPosition);
      yPosition += addrLines.length * 4;
    }
    if (settings?.company_phone) {
      doc.text(settings.company_phone, col1X, yPosition);
      yPosition += 4;
    }
    if (settings?.company_email) {
      doc.text(settings.company_email, col1X, yPosition);
    }

    // Client (à droite) avec fond gris comme dans le preview
    const clientBoxY = 60;
    const clientBoxHeight = 30;
    const clientBoxWidth = pageWidth - col2X - margin + 5;

    // Fond gris pour la section client (comme bg-gray-50)
    doc.setFillColor(...lightGray);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'F');

    // Bordure grise
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.5);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'S');

    yPosition = clientBoxY + 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('FACTURÉ À', col2X, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(invoice.client_name, col2X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPosition += 4;
    if (invoice.client_address) {
      const addressLines = doc.splitTextToSize(invoice.client_address, clientBoxWidth - 10);
      doc.text(addressLines, col2X, yPosition);
      yPosition += addressLines.length * 3.5;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, col2X, yPosition);
      yPosition += 3.5;
    }
    if (invoice.client_phone) {
      doc.text(invoice.client_phone, col2X, yPosition);
    }

    yPosition = clientBoxY + clientBoxHeight + 10;

    // Dates et statut
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(`Date d'émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    doc.text(`Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    yPosition += 5;

    // Statut avec badge coloré
    const statusText = this.getStatusLabel(invoice.status);
    const statusColor = this.getStatusColor(invoice.status);

    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, yPosition - 3, 30, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, margin + 2, yPosition + 1);
    yPosition += 15;

    // Tableau des articles
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DÉTAIL', margin, yPosition);
    yPosition += 8;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, lightGray, textColor, primaryColor, secondaryColor);

    // Footer
    this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, textColor, secondaryColor);
  }

  /**
   * Template minimal épuré noir & blanc
   */
  private static async generateMinimalTemplate(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const textColor = [0, 0, 0]; // Noir
    const grayColor = [100, 100, 100];
    const lightGray = [240, 240, 240];

    // Ajouter le logo en filigrane d'abord (en arrière-plan)
    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    // Titre simple
    doc.setFontSize(20);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', margin, yPosition);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° ${invoice.invoice_number}`, pageWidth - margin, yPosition, { align: 'right' });

    // Ligne de séparation simple
    yPosition += 5;
    doc.setDrawColor(...textColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Section émetteur et client
    const col1X = margin;
    const col2X = pageWidth / 2 + 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DE:', col1X, yPosition);
    doc.text('POUR:', col2X, yPosition);

    doc.setFont('helvetica', 'normal');
    yPosition += 5;

    // Émetteur
    let emitterY = yPosition;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, emitterY);
    emitterY += 4;
    if (settings?.company_address) {
      const lines = doc.splitTextToSize(settings.company_address, 75);
      doc.text(lines, col1X, emitterY);
      emitterY += lines.length * 4;
    }
    if (settings?.company_email) {
      doc.text(settings.company_email, col1X, emitterY);
    }

    // Client
    let clientY = yPosition;
    doc.text(invoice.client_name, col2X, clientY);
    clientY += 4;
    if (invoice.client_address) {
      const lines = doc.splitTextToSize(invoice.client_address, 75);
      doc.text(lines, col2X, clientY);
      clientY += lines.length * 4;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, col2X, clientY);
    }

    yPosition = Math.max(emitterY, clientY) + 10;

    // Dates
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`Émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    doc.text(`Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    doc.text(`Statut: ${this.getStatusLabel(invoice.status)}`, pageWidth - margin - 40, yPosition);
    yPosition += 10;

    // Ligne de séparation
    doc.setDrawColor(...grayColor);
    doc.setLineWidth(0.2);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Tableau
    doc.setTextColor(...textColor);
    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, lightGray, textColor, textColor, grayColor);

    // Footer minimal
    this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, textColor, grayColor);
  }

  /**
   * Template classique traditionnel
   */
  private static async generateClassicTemplate(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    let yPosition = margin;

    const textColor = [0, 0, 0];
    const darkGray = [60, 60, 60];
    const lightGray = [245, 245, 245];

    // Ajouter le logo en filigrane d'abord (en arrière-plan)
    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    // Bordure de page
    doc.setDrawColor(...textColor);
    doc.setLineWidth(1);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Titre centré et encadré
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    const titleText = 'FACTURE';
    const titleWidth = doc.getTextWidth(titleText);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(titleText, titleX, yPosition);

    yPosition += 3;
    doc.setLineWidth(2);
    doc.line(titleX - 5, yPosition, titleX + titleWidth + 5, yPosition);
    yPosition += 8;

    // Numéro centré
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const numText = `N° ${invoice.invoice_number}`;
    doc.text(numText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Cadre émetteur
    const boxHeight = 35;
    doc.setDrawColor(...darkGray);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, (pageWidth - 2 * margin - 5) / 2, boxHeight);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ÉMETTEUR', margin + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let textY = yPosition + 10;
    doc.text(settings?.company_name || 'Votre Entreprise', margin + 2, textY);
    textY += 4;
    if (settings?.company_siret) {
      doc.text(`RCCM: ${settings.company_siret}`, margin + 2, textY);
      textY += 4;
    }
    if (settings?.company_address) {
      const lines = doc.splitTextToSize(settings.company_address, 75);
      doc.text(lines, margin + 2, textY);
      textY += lines.length * 3.5;
    }

    // Cadre client
    const col2X = margin + (pageWidth - 2 * margin) / 2 + 2.5;
    doc.rect(col2X, yPosition, (pageWidth - 2 * margin - 5) / 2, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CLIENT', col2X + 2, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    textY = yPosition + 10;
    doc.text(invoice.client_name, col2X + 2, textY);
    textY += 4;
    if (invoice.client_address) {
      const lines = doc.splitTextToSize(invoice.client_address, 75);
      doc.text(lines, col2X + 2, textY);
      textY += lines.length * 3.5;
    }
    if (invoice.client_phone) {
      doc.text(invoice.client_phone, col2X + 2, textY);
      textY += 4;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, col2X + 2, textY);
    }

    yPosition += boxHeight + 10;

    // Informations de dates
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    doc.text(`Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, pageWidth / 2, yPosition);
    doc.text(`Statut: ${this.getStatusLabel(invoice.status)}`, pageWidth - margin - 35, yPosition);
    yPosition += 12;

    // Séparateur
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Tableau
    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, lightGray, textColor, textColor, darkGray);

    // Footer
    this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, textColor, darkGray);
  }

  /**
   * Template moderne avec gradients et couleurs
   */
  private static async generatePremiumTemplate(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Couleurs modernes (alignées avec InvoicePreviewDialog)
    const primaryColor = [59, 130, 246]; // Bleu #3b82f6 (from-blue-500)
    const secondaryColor = [99, 102, 241]; // Indigo #6366f1 (to-indigo-500)
    const textColor = [31, 41, 55]; // Gris foncé #1f2937 (gray-800)
    const lightGray = [249, 250, 251]; // #f9fafb (gray-50)

    // Ajouter le logo en filigrane d'abord (en arrière-plan)
    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    // Bandeau de couleur en haut avec gradient simulé (bleu vers indigo)
    // Simuler un gradient avec plusieurs rectangles superposés
    for (let i = 0; i < 15; i++) {
      const ratio = i / 15;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(0, i, pageWidth, 1, 'F');
    }

    // Box avec FACTURE et numéro (style du preview)
    yPosition = 10;
    const boxWidth = 50;
    const boxHeight = 18;
    const boxX = pageWidth - margin - boxWidth;

    // Box avec gradient pour le numéro de facture
    for (let i = 0; i < boxHeight; i++) {
      const ratio = i / boxHeight;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.roundedRect(boxX, yPosition + i * boxHeight / boxHeight, boxWidth, 1, 2, 2, 'F');
    }

    // Texte FACTURE dans le box
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', boxX + boxWidth / 2, yPosition + 7, { align: 'center' });

    // Numéro de facture dans le box
    doc.setFontSize(14);
    doc.text(invoice.invoice_number, boxX + boxWidth / 2, yPosition + 15, { align: 'center' });

    yPosition = 30;

    // Section : Informations émetteur et client (2 colonnes)
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    // Émetteur (à gauche)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ÉMETTEUR', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 4;
    if (settings?.company_address) {
      const addrLines = doc.splitTextToSize(settings.company_address, 80);
      doc.text(addrLines, col1X, yPosition);
      yPosition += addrLines.length * 4;
    }
    if (settings?.company_phone) {
      doc.text(settings.company_phone, col1X, yPosition);
      yPosition += 4;
    }
    if (settings?.company_email) {
      doc.text(settings.company_email, col1X, yPosition);
    }

    // Client (à droite) avec fond gris comme dans le preview
    const clientBoxY = 60;
    const clientBoxHeight = 30;
    const clientBoxWidth = pageWidth - col2X - margin + 5;

    // Fond gris pour la section client (comme bg-gray-50)
    doc.setFillColor(...lightGray);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'F');

    // Bordure grise
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.5);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'S');

    yPosition = clientBoxY + 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('FACTURÉ À', col2X, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(invoice.client_name, col2X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPosition += 4;
    if (invoice.client_address) {
      const addressLines = doc.splitTextToSize(invoice.client_address, clientBoxWidth - 10);
      doc.text(addressLines, col2X, yPosition);
      yPosition += addressLines.length * 3.5;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, col2X, yPosition);
      yPosition += 3.5;
    }
    if (invoice.client_phone) {
      doc.text(invoice.client_phone, col2X, yPosition);
    }

    yPosition = clientBoxY + clientBoxHeight + 10;

    // Dates et statut
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(`Date d'émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    doc.text(`Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    yPosition += 5;

    // Statut avec badge coloré
    const statusText = this.getStatusLabel(invoice.status);
    const statusColor = this.getStatusColor(invoice.status);

    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, yPosition - 3, 30, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, margin + 2, yPosition + 1);
    yPosition += 15;

    // Tableau des articles
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DÉTAIL', margin, yPosition);
    yPosition += 8;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, lightGray, textColor, primaryColor, secondaryColor);

    // Footer
    this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, textColor, secondaryColor);
  }

  /**
   * Template moderne avec gradients et couleurs
   */
  private static async generateElegantTemplate(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Couleurs modernes (alignées avec InvoicePreviewDialog)
    const primaryColor = [59, 130, 246]; // Bleu #3b82f6 (from-blue-500)
    const secondaryColor = [99, 102, 241]; // Indigo #6366f1 (to-indigo-500)
    const textColor = [31, 41, 55]; // Gris foncé #1f2937 (gray-800)
    const lightGray = [249, 250, 251]; // #f9fafb (gray-50)

    // Ajouter le logo en filigrane d'abord (en arrière-plan)
    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    // Bandeau de couleur en haut avec gradient simulé (bleu vers indigo)
    // Simuler un gradient avec plusieurs rectangles superposés
    for (let i = 0; i < 15; i++) {
      const ratio = i / 15;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(0, i, pageWidth, 1, 'F');
    }

    // Box avec FACTURE et numéro (style du preview)
    yPosition = 10;
    const boxWidth = 50;
    const boxHeight = 18;
    const boxX = pageWidth - margin - boxWidth;

    // Box avec gradient pour le numéro de facture
    for (let i = 0; i < boxHeight; i++) {
      const ratio = i / boxHeight;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.roundedRect(boxX, yPosition + i * boxHeight / boxHeight, boxWidth, 1, 2, 2, 'F');
    }

    // Texte FACTURE dans le box
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', boxX + boxWidth / 2, yPosition + 7, { align: 'center' });

    // Numéro de facture dans le box
    doc.setFontSize(14);
    doc.text(invoice.invoice_number, boxX + boxWidth / 2, yPosition + 15, { align: 'center' });

    yPosition = 30;

    // Section : Informations émetteur et client (2 colonnes)
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    // Émetteur (à gauche)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ÉMETTEUR', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 4;
    if (settings?.company_address) {
      const addrLines = doc.splitTextToSize(settings.company_address, 80);
      doc.text(addrLines, col1X, yPosition);
      yPosition += addrLines.length * 4;
    }
    if (settings?.company_phone) {
      doc.text(settings.company_phone, col1X, yPosition);
      yPosition += 4;
    }
    if (settings?.company_email) {
      doc.text(settings.company_email, col1X, yPosition);
    }

    // Client (à droite) avec fond gris comme dans le preview
    const clientBoxY = 60;
    const clientBoxHeight = 30;
    const clientBoxWidth = pageWidth - col2X - margin + 5;

    // Fond gris pour la section client (comme bg-gray-50)
    doc.setFillColor(...lightGray);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'F');

    // Bordure grise
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.5);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'S');

    yPosition = clientBoxY + 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('FACTURÉ À', col2X, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(invoice.client_name, col2X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPosition += 4;
    if (invoice.client_address) {
      const addressLines = doc.splitTextToSize(invoice.client_address, clientBoxWidth - 10);
      doc.text(addressLines, col2X, yPosition);
      yPosition += addressLines.length * 3.5;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, col2X, yPosition);
      yPosition += 3.5;
    }
    if (invoice.client_phone) {
      doc.text(invoice.client_phone, col2X, yPosition);
    }

    yPosition = clientBoxY + clientBoxHeight + 10;

    // Dates et statut
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(`Date d'émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    doc.text(`Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    yPosition += 5;

    // Statut avec badge coloré
    const statusText = this.getStatusLabel(invoice.status);
    const statusColor = this.getStatusColor(invoice.status);

    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, yPosition - 3, 30, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, margin + 2, yPosition + 1);
    yPosition += 15;

    // Tableau des articles
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DÉTAIL', margin, yPosition);
    yPosition += 8;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, lightGray, textColor, primaryColor, secondaryColor);

    // Footer
    this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, textColor, secondaryColor);
  }

  /**
   * Template moderne avec gradients et couleurs
   */
  private static async generateCorporateTemplate(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Couleurs modernes (alignées avec InvoicePreviewDialog)
    const primaryColor = [59, 130, 246]; // Bleu #3b82f6 (from-blue-500)
    const secondaryColor = [99, 102, 241]; // Indigo #6366f1 (to-indigo-500)
    const textColor = [31, 41, 55]; // Gris foncé #1f2937 (gray-800)
    const lightGray = [249, 250, 251]; // #f9fafb (gray-50)

    // Ajouter le logo en filigrane d'abord (en arrière-plan)
    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    // Bandeau de couleur en haut avec gradient simulé (bleu vers indigo)
    // Simuler un gradient avec plusieurs rectangles superposés
    for (let i = 0; i < 15; i++) {
      const ratio = i / 15;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(0, i, pageWidth, 1, 'F');
    }

    // Box avec FACTURE et numéro (style du preview)
    yPosition = 10;
    const boxWidth = 50;
    const boxHeight = 18;
    const boxX = pageWidth - margin - boxWidth;

    // Box avec gradient pour le numéro de facture
    for (let i = 0; i < boxHeight; i++) {
      const ratio = i / boxHeight;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.roundedRect(boxX, yPosition + i * boxHeight / boxHeight, boxWidth, 1, 2, 2, 'F');
    }

    // Texte FACTURE dans le box
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', boxX + boxWidth / 2, yPosition + 7, { align: 'center' });

    // Numéro de facture dans le box
    doc.setFontSize(14);
    doc.text(invoice.invoice_number, boxX + boxWidth / 2, yPosition + 15, { align: 'center' });

    yPosition = 30;

    // Section : Informations émetteur et client (2 colonnes)
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    // Émetteur (à gauche)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ÉMETTEUR', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 4;
    if (settings?.company_address) {
      const addrLines = doc.splitTextToSize(settings.company_address, 80);
      doc.text(addrLines, col1X, yPosition);
      yPosition += addrLines.length * 4;
    }
    if (settings?.company_phone) {
      doc.text(settings.company_phone, col1X, yPosition);
      yPosition += 4;
    }
    if (settings?.company_email) {
      doc.text(settings.company_email, col1X, yPosition);
    }

    // Client (à droite) avec fond gris comme dans le preview
    const clientBoxY = 60;
    const clientBoxHeight = 30;
    const clientBoxWidth = pageWidth - col2X - margin + 5;

    // Fond gris pour la section client (comme bg-gray-50)
    doc.setFillColor(...lightGray);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'F');

    // Bordure grise
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.5);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'S');

    yPosition = clientBoxY + 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('FACTURÉ À', col2X, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(invoice.client_name, col2X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPosition += 4;
    if (invoice.client_address) {
      const addressLines = doc.splitTextToSize(invoice.client_address, clientBoxWidth - 10);
      doc.text(addressLines, col2X, yPosition);
      yPosition += addressLines.length * 3.5;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, col2X, yPosition);
      yPosition += 3.5;
    }
    if (invoice.client_phone) {
      doc.text(invoice.client_phone, col2X, yPosition);
    }

    yPosition = clientBoxY + clientBoxHeight + 10;

    // Dates et statut
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(`Date d'émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    doc.text(`Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    yPosition += 5;

    // Statut avec badge coloré
    const statusText = this.getStatusLabel(invoice.status);
    const statusColor = this.getStatusColor(invoice.status);

    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, yPosition - 3, 30, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, margin + 2, yPosition + 1);
    yPosition += 15;

    // Tableau des articles
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DÉTAIL', margin, yPosition);
    yPosition += 8;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, lightGray, textColor, primaryColor, secondaryColor);

    // Footer
    this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, textColor, secondaryColor);
  }

  /**
   * Template moderne avec gradients et couleurs
   */
  private static async generateLightTemplate(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Couleurs modernes (alignées avec InvoicePreviewDialog)
    const primaryColor = [59, 130, 246]; // Bleu #3b82f6 (from-blue-500)
    const secondaryColor = [99, 102, 241]; // Indigo #6366f1 (to-indigo-500)
    const textColor = [31, 41, 55]; // Gris foncé #1f2937 (gray-800)
    const lightGray = [249, 250, 251]; // #f9fafb (gray-50)

    // Ajouter le logo en filigrane d'abord (en arrière-plan)
    await this.addWatermarkLogo(doc, settings?.logo_url, pageWidth, pageHeight);

    // Bandeau de couleur en haut avec gradient simulé (bleu vers indigo)
    // Simuler un gradient avec plusieurs rectangles superposés
    for (let i = 0; i < 15; i++) {
      const ratio = i / 15;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(0, i, pageWidth, 1, 'F');
    }

    // Box avec FACTURE et numéro (style du preview)
    yPosition = 10;
    const boxWidth = 50;
    const boxHeight = 18;
    const boxX = pageWidth - margin - boxWidth;

    // Box avec gradient pour le numéro de facture
    for (let i = 0; i < boxHeight; i++) {
      const ratio = i / boxHeight;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.roundedRect(boxX, yPosition + i * boxHeight / boxHeight, boxWidth, 1, 2, 2, 'F');
    }

    // Texte FACTURE dans le box
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', boxX + boxWidth / 2, yPosition + 7, { align: 'center' });

    // Numéro de facture dans le box
    doc.setFontSize(14);
    doc.text(invoice.invoice_number, boxX + boxWidth / 2, yPosition + 15, { align: 'center' });

    yPosition = 30;

    // Section : Informations émetteur et client (2 colonnes)
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    // Émetteur (à gauche)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ÉMETTEUR', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(settings?.company_name || 'Votre Entreprise', col1X, yPosition);
    yPosition += 4;
    if (settings?.company_address) {
      const addrLines = doc.splitTextToSize(settings.company_address, 80);
      doc.text(addrLines, col1X, yPosition);
      yPosition += addrLines.length * 4;
    }
    if (settings?.company_phone) {
      doc.text(settings.company_phone, col1X, yPosition);
      yPosition += 4;
    }
    if (settings?.company_email) {
      doc.text(settings.company_email, col1X, yPosition);
    }

    // Client (à droite) avec fond gris comme dans le preview
    const clientBoxY = 60;
    const clientBoxHeight = 30;
    const clientBoxWidth = pageWidth - col2X - margin + 5;

    // Fond gris pour la section client (comme bg-gray-50)
    doc.setFillColor(...lightGray);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'F');

    // Bordure grise
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(0.5);
    doc.roundedRect(col2X - 5, clientBoxY, clientBoxWidth, clientBoxHeight, 3, 3, 'S');

    yPosition = clientBoxY + 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('FACTURÉ À', col2X, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    yPosition += 5;
    doc.text(invoice.client_name, col2X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPosition += 4;
    if (invoice.client_address) {
      const addressLines = doc.splitTextToSize(invoice.client_address, clientBoxWidth - 10);
      doc.text(addressLines, col2X, yPosition);
      yPosition += addressLines.length * 3.5;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, col2X, yPosition);
      yPosition += 3.5;
    }
    if (invoice.client_phone) {
      doc.text(invoice.client_phone, col2X, yPosition);
    }

    yPosition = clientBoxY + clientBoxHeight + 10;

    // Dates et statut
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(`Date d'émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, margin, yPosition);
    doc.text(`Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, col2X, yPosition);
    yPosition += 5;

    // Statut avec badge coloré
    const statusText = this.getStatusLabel(invoice.status);
    const statusColor = this.getStatusColor(invoice.status);

    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, yPosition - 3, 30, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, margin + 2, yPosition + 1);
    yPosition += 15;

    // Tableau des articles
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DÉTAIL', margin, yPosition);
    yPosition += 8;

    this.drawInvoiceTable(doc, invoice, yPosition, margin, pageWidth, pageHeight, lightGray, textColor, primaryColor, secondaryColor);

    // Footer
    this.drawFooter(doc, invoice, settings, pageWidth, pageHeight, margin, textColor, secondaryColor);
  }

  /**
   * Dessine le tableau des articles (commun à tous les templates)
   */
  private static drawInvoiceTable(
    doc: any,
    invoice: Invoice,
    startY: number,
    margin: number,
    pageWidth: number,
    pageHeight: number,
    lightGray: number[],
    textColor: number[],
    primaryColor: number[],
    secondaryColor: number[]
  ) {
    let yPosition = startY;

    // En-tête du tableau avec gradient (comme dans le preview)
    const tableHeaderHeight = 8;
    // Créer un gradient bleu-indigo pour l'en-tête du tableau
    for (let i = 0; i < tableHeaderHeight; i++) {
      const ratio = i / tableHeaderHeight;
      const r = Math.round(primaryColor[0] + (secondaryColor[0] - primaryColor[0]) * ratio);
      const g = Math.round(primaryColor[1] + (secondaryColor[1] - primaryColor[1]) * ratio);
      const b = Math.round(primaryColor[2] + (secondaryColor[2] - primaryColor[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(margin, yPosition + i, pageWidth - 2 * margin, 1, 'F');
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // Blanc pour le texte de l'en-tête

    const colWidths = {
      description: 80,
      quantity: 20,
      unitPrice: 25,
      vat: 15,
      total: 30,
    };

    let xPos = margin + 2;
    doc.text('Description', xPos, yPosition + 5);
    xPos += colWidths.description;
    doc.text('Qte', xPos, yPosition + 5);
    xPos += colWidths.quantity;
    doc.text('Prix HT', xPos, yPosition + 5);
    xPos += colWidths.unitPrice;
    doc.text('Taxe', xPos, yPosition + 5);
    xPos += colWidths.vat;
    doc.text('Total TTC', xPos, yPosition + 5);

    yPosition += 8;

    // Lignes du tableau
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item) => {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        // Ligne séparatrice
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 2;

        xPos = margin + 2;

        // Description (peut être multiligne)
        const descLines = doc.splitTextToSize(item.description, colWidths.description - 4);
        doc.text(descLines, xPos, yPosition + 4);

        xPos += colWidths.description;
        doc.text(item.quantity.toString(), xPos, yPosition + 4);

        xPos += colWidths.quantity;
        doc.text(`${item.unit_price_ht.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`, xPos, yPosition + 4);

        xPos += colWidths.unitPrice;
        // Afficher TPS ou TVA selon le type d'item
        if (item.is_service) {
          doc.setTextColor(34, 197, 94); // Vert pour TPS
          doc.text(' -9,5%', xPos, yPosition + 4);
          doc.setTextColor(...textColor); // Reset couleur
        } else {
          doc.setTextColor(41, 98, 255); // Bleu pour TVQ
          doc.text(`TVA ${item.vat_rate}%`, xPos, yPosition + 4);
          doc.setTextColor(...textColor); // Reset couleur
        }

        xPos += colWidths.vat;
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.total_ttc.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`, xPos, yPosition + 4);
        doc.setFont('helvetica', 'normal');

        yPosition += Math.max(descLines.length * 5, 8) + 2;
      });
    }

    // Ligne finale du tableau
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Totaux
    const totalsX = pageWidth - margin - 70;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('Total HT:', totalsX, yPosition);
    doc.text(`${invoice.total_ht.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`, totalsX + 40, yPosition, { align: 'right' });
    yPosition += 6;

    // TVA sur les produits
    if (invoice.total_vat > 0) {
      doc.setTextColor(41, 98, 255); // Bleu pour la TVQ
      doc.text(`TVA (${invoice.vat_rate}%)`, totalsX, yPosition);
      doc.text(`${invoice.total_vat.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`, totalsX + 40, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // TPS si présente (déduction négative)
    if (invoice.total_tps && invoice.total_tps !== 0) {
      doc.setTextColor(34, 197, 94); // Vert pour la TPS (déduction)
      doc.text('TPS (-9,5%):', totalsX, yPosition);
      doc.text(`${invoice.total_tps.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`, totalsX + 40, yPosition, { align: 'right' });
      yPosition += 8;
    } else {
      yPosition += 2;
    }

    // Total TTC (mis en évidence)
    doc.setFillColor(...lightGray);
    doc.roundedRect(totalsX - 5, yPosition - 5, 75, 10, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('Total TTC:', totalsX, yPosition);
    doc.text(`${invoice.total_ttc.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`, totalsX + 50, yPosition, { align: 'right' });

    // Notes explicatives si applicable
    if (invoice.total_tps && invoice.total_tps !== 0) {
      yPosition += 8;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...textColor);
      doc.text('* TPS (-9,5%) : Deduction applicable uniquement sur les services', totalsX, yPosition);
    }
    if (invoice.total_vat > 0) {
      yPosition += 3;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...textColor);
      doc.text('* TVA : Taxe applicable uniquement sur les produits', totalsX, yPosition);
    }

  }

  /**
   * Dessine le footer (notes, mentions légales, etc.)
   */
  private static drawFooter(
    doc: any,
    invoice: Invoice,
    settings: InvoiceSettings | null,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    textColor: number[],
    secondaryColor: number[]
  ) {
    let yPosition = pageHeight - 50;

    // Notes avec fond jaune (comme dans le preview)
    if (invoice.notes) {
      const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin - 8);
      const notesBoxHeight = 15 + notesLines.length * 4; // Augmenté pour éviter le chevauchement

      // Fond jaune (yellow-50)
      doc.setFillColor(254, 252, 232); // #fefce8
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, notesBoxHeight, 3, 3, 'F');

      // Bordure jaune (yellow-200)
      doc.setDrawColor(254, 240, 138); // #fef08a
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, notesBoxHeight, 3, 3, 'S');

      // Titre NOTES
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7); // yellow-700
      doc.text('NOTES', margin + 4, yPosition + 5);

      // Contenu des notes (avec plus d'espace après le titre)
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.text(notesLines, margin + 4, yPosition + 12); // Changé de 10 à 12 pour plus d'espace
      yPosition += notesBoxHeight + 4;
    }

    // Mentions légales
    if (settings?.legal_mentions) {
      yPosition = pageHeight - 30;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const legalLines = doc.splitTextToSize(settings.legal_mentions, pageWidth - 2 * margin);
      doc.text(legalLines, margin +4, yPosition + 10);
    }

    // Date de génération
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  /**
   * Télécharge le PDF généré
   */
  static downloadPDF(blobUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Nettoie l'URL du blob après utilisation
   */
  static revokeBlobUrl(blobUrl: string) {
    URL.revokeObjectURL(blobUrl);
  }

  /**
   * Obtient le label d'un statut
   */
  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'BROUILLON',
      sent: 'ENVOYÉE',
      paid: 'PAYÉE',
      overdue: 'EN RETARD',
      cancelled: 'ANNULÉE',
    };
    return labels[status] || status.toUpperCase();
  }

  /**
   * Obtient la couleur d'un statut
   */
  private static getStatusColor(status: string): [number, number, number] {
    const colors: Record<string, [number, number, number]> = {
      draft: [156, 163, 175], // Gris
      sent: [59, 130, 246], // Bleu
      paid: [34, 197, 94], // Vert
      overdue: [249, 115, 22], // Orange
      cancelled: [239, 68, 68], // Rouge
    };
    return colors[status] || [156, 163, 175];
  }
}
