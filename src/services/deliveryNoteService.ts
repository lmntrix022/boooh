import { OrderWithProduct } from './ordersService';
import { InvoiceSettings } from './invoiceService';

/**
 * Service de génération de bons de livraison
 * Utilise les mêmes templates que les factures
 */
export class DeliveryNoteService {
  /**
   * Génère un bon de livraison PDF avec le design professionnel
   */
  static async generateDeliveryNotePDF(
    order: OrderWithProduct,
    cardInfo: any,
    settings: InvoiceSettings | null
  ): Promise<{ blobUrl: string; blob: Blob }> {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Couleurs cohérentes (vert pour livraison)
    const darkGray: [number, number, number] = [45, 48, 71];
    const mediumGray: [number, number, number] = [107, 114, 128];
    const lightGray: [number, number, number] = [243, 244, 246];
    const primaryColor: [number, number, number] = [34, 197, 94]; // Vert pour livraison
    const accentColor: [number, number, number] = [22, 163, 74]; // Vert foncé

    // En-tête professionnel
    this.drawHeader(doc, pageWidth, primaryColor, 'BON DE LIVRAISON', `BL-${order.id?.substring(0, 8).toUpperCase()}`);

    yPosition = 35;

    // Section émetteur et client
    const col1X = margin;
    const col2X = pageWidth / 2 + 5;

    // Récupérer les infos d'entreprise depuis les settings
    const companyName = settings?.company_name || cardInfo?.business_name || 'Votre Entreprise';
    const companyAddress = settings?.company_address || cardInfo?.address || '';
    const companyPhone = settings?.company_phone || cardInfo?.phone || '';
    const companyEmail = settings?.company_email || cardInfo?.email || '';

    // ÉMETTEUR (vendeur)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('DE (VENDEUR)', col1X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mediumGray);
    yPosition += 4;
    doc.text(companyName, col1X, yPosition);
    yPosition += 3;

    if (companyAddress) {
      const addrLines = doc.splitTextToSize(companyAddress, 70);
      doc.text(addrLines, col1X, yPosition);
      yPosition += addrLines.length * 2.5;
    }
    if (companyPhone) {
      doc.text(`Tél: ${companyPhone}`, col1X, yPosition);
      yPosition += 2.5;
    }
    if (companyEmail) {
      doc.text(`Email: ${companyEmail}`, col1X, yPosition);
    }

    // CLIENT (destinataire)
    let clientY = 35;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('LIVRÉ À', col2X, clientY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mediumGray);
    clientY += 4;
    doc.text(order.client_name, col2X, clientY);
    clientY += 3;

    // Note: client_address may come from order metadata if available
    const clientAddress = (order as any).client_address;
    if (clientAddress) {
      const addressLines = doc.splitTextToSize(clientAddress, 70);
      doc.text(addressLines, col2X, clientY);
      clientY += addressLines.length * 2.5;
    }
    if (order.client_phone) {
      doc.text(`Tél: ${order.client_phone}`, col2X, clientY);
      clientY += 2.5;
    }
    if (order.client_email) {
      doc.text(`Email: ${order.client_email}`, col2X, clientY);
    }

    yPosition = Math.max(yPosition, clientY) + 10;

    // Informations du bon
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPosition, pageWidth - margin * 2, 12, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    yPosition += 3;
    doc.text('Date de livraison', margin + 5, yPosition);
    doc.text('Transporteur', col2X, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mediumGray);
    yPosition += 4;
    doc.text(new Date().toLocaleDateString('fr-FR'), margin + 5, yPosition);
    doc.text('À renseigner', col2X, yPosition);

    yPosition += 12;

    // Ligne séparatrice
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    yPosition += 8;

    // Tableau des articles
    yPosition = this.drawDeliveryTable(doc, order, yPosition, margin, pageWidth, lightGray, darkGray, primaryColor, col2X, settings);

    // Footer avec mentions légales
    this.drawFooter(doc, order, settings, pageWidth, pageHeight, margin, mediumGray, primaryColor);

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    return { blobUrl, blob: pdfBlob };
  }

  /**
   * Dessine l'en-tête du document
   */
  private static drawHeader(doc: any, pageWidth: number, color: [number, number, number], title: string, number: string) {
    doc.setFillColor(...color);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 20, 15);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(number, pageWidth - 20, 15, { align: 'right' });
  }

  /**
   * Dessine le tableau des articles avec tracking de livraison
   */
  private static drawDeliveryTable(
    doc: any,
    order: OrderWithProduct,
    startY: number,
    margin: number,
    pageWidth: number,
    backgroundColor: [number, number, number],
    textColor: [number, number, number],
    primaryColor: [number, number, number],
    col2X: number,
    settings: InvoiceSettings | null
  ): number {
    const columnWidths = [55, 25, 25, 20, 35]; // Description, Qty Cde, Qty Liv, Éta, Notes
    const col1X = margin;
    let yPosition = startY;

    // En-têtes du tableau
    doc.setFillColor(...primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    const headers = ['Description', 'Qty Cde', 'Qty Liv', 'État', 'Notes'];
    let xPosition = col1X;

    headers.forEach((header, i) => {
      doc.text(header, xPosition + 2, yPosition + 4);
      xPosition += columnWidths[i];
    });

    yPosition += 7;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    // Ligne produit
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    xPosition = col1X;
    const productName = order.products?.name || 'Produit';
    const nameLines = doc.splitTextToSize(productName, columnWidths[0] - 4);
    doc.text(nameLines, xPosition + 2, yPosition + 3);

    // Quantité commandée
    xPosition += columnWidths[0];
    doc.text((order.quantity ?? 1).toString(), xPosition + 2, yPosition + 3, { align: 'center' });

    // Quantité livrée (à remplir)
    xPosition += columnWidths[1];
    doc.text('___', xPosition + 2, yPosition + 3, { align: 'center' });

    // État
    xPosition += columnWidths[2];
    doc.text('OK', xPosition + 2, yPosition + 3, { align: 'center' });

    // Notes
    xPosition += columnWidths[3];
    doc.text('____', xPosition + 2, yPosition + 3, { align: 'center' });

    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    // Prix de référence (informatif)
    yPosition += 8;
    const unitPrice = typeof order.products?.price === 'string' 
      ? parseFloat(order.products.price) 
      : (order.products?.price || 0);
    const total = (order.quantity || 1) * unitPrice;
    const tva = total * 0.18;
    const totalTTC = total + tva;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textColor);
    doc.text('Montant HT:', margin, yPosition);
    doc.text(`${total.toLocaleString('fr-FR')} F`, pageWidth - margin - 3, yPosition, { align: 'right' });
    yPosition += 4;
    
    doc.text('TVA (18%):', margin, yPosition);
    doc.text(`${tva.toLocaleString('fr-FR')} F`, pageWidth - margin - 3, yPosition, { align: 'right' });
    yPosition += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL TTC:', margin, yPosition);
    doc.text(`${totalTTC.toLocaleString('fr-FR')} F`, pageWidth - margin - 3, yPosition, { align: 'right' });

    // Section de signature
    yPosition += 12;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('SIGNATURE & OBSERVATIONS', margin, yPosition);

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.rect(margin, yPosition, pageWidth - margin * 2, 20, 'S');

    yPosition += 25;

    // Section confirmations
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textColor);

    const confirmations = [
      '☐ Marchandise conforme',
      '☐ Emballage correct',
      '☐ Quantités conformes',
      '☐ Délai de livraison respecté'
    ];

    confirmations.forEach((confirmation, index) => {
      if (index % 2 === 0) {
        doc.text(confirmation, margin, yPosition);
      } else {
        doc.text(confirmation, col2X, yPosition);
        yPosition += 3;
      }
    });

    yPosition += 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text(`Signature du destinataire: ____________________  Date: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);

    return yPosition;
  }

  /**
   * Dessine le footer avec les mentions légales
   */
  private static drawFooter(
    doc: any,
    order: OrderWithProduct,
    settings: InvoiceSettings | null,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    mediumGray: [number, number, number],
    primaryColor: [number, number, number]
  ) {
    const footerY = pageHeight - 30;

    // Ligne de séparation
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    // Coordonnées bancaires
    if (settings?.bank_details) {
      doc.setFontSize(8);
      doc.setTextColor(...mediumGray);
      const bankLines = doc.splitTextToSize(settings.bank_details, pageWidth - margin * 2);
      doc.text('Coordonnées bancaires:', margin, footerY + 5);
      doc.text(bankLines, margin, footerY + 8);
    }

    // Mentions légales
    if (settings?.legal_mentions) {
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128); // gray-500
      const legalLines = doc.splitTextToSize(settings.legal_mentions, pageWidth - margin * 2);
      doc.text(legalLines, margin, pageHeight - 5);
    }
  }
}
