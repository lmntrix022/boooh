import { ServiceQuote } from './portfolioService';

export interface QuoteLineItem {
  title: string;
  quantity: number;
  unit_price: number;
}

interface QuoteGenerationData {
  quote: ServiceQuote;
  items?: QuoteLineItem[];
  cardOwnerName: string;
  cardOwnerEmail?: string;
  cardOwnerPhone?: string;
  cardOwnerAddress?: string;
  companyName?: string;
  companyLogo?: string;
  companySiret?: string;
  companyNif?: string;
  companyVatNumber?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  brandColor?: string;
  payment_terms?: string;
  proposal_notes?: string;
  execution_delay?: string;
}

export class QuotePdfService {
  private static formatAmount(amount: number): string {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  private static hexToRGB(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [99, 102, 241];
  }

  private static async addWatermark(doc: any, logoUrl: string | undefined, pageWidth: number, pageHeight: number) {
    if (!logoUrl) return;
    try {
      const img = await new Promise<string>((resolve, reject) => {
        const imgEl = new Image();
        imgEl.crossOrigin = 'Anonymous';
        imgEl.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = imgEl.width;
          canvas.height = imgEl.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(imgEl, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        imgEl.onerror = () => reject(new Error('Failed to load image'));
        imgEl.src = logoUrl;
      });
      const sz = 48;
      const x = (pageWidth - sz) / 2;
      const y = (pageHeight - sz) / 2;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.06 }));
      doc.addImage(img, 'PNG', x, y, sz, sz);
      doc.restoreGraphicsState();
    } catch {
      /* ignore */
    }
  }

  static async generateQuotePDF(data: QuoteGenerationData): Promise<Blob> {
    const {
      quote,
      items: lineItems = [],
      payment_terms: dataPaymentTerms,
      proposal_notes: dataProposalNotes,
      execution_delay: dataExecutionDelay,
      cardOwnerName,
      cardOwnerEmail,
      cardOwnerPhone,
      cardOwnerAddress,
      companyName,
      companySiret,
      companyNif,
      companyVatNumber,
      companyAddress,
      companyPhone,
      companyEmail,
      companyWebsite,
      companyLogo,
      brandColor = '#6366F1'
    } = data;

    const hasLineItems = lineItems.length > 0 && lineItems.some((i) => i.title.trim() && i.unit_price >= 0);
    const qExt = quote as ServiceQuote & { payment_terms?: string; proposal_notes?: string; execution_delay?: string };
    const paymentTerms = dataPaymentTerms ?? qExt.payment_terms;
    const proposalNotes = dataProposalNotes ?? qExt.proposal_notes;
    const executionDelay = dataExecutionDelay ?? qExt.execution_delay;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;

    const accent = this.hexToRGB(brandColor);
    const charcoal = [26, 26, 26];
    const slateGray = [100, 116, 139];
    const cream = [252, 251, 248];
    const border = [226, 232, 240];

    await this.addWatermark(doc, companyLogo, pageWidth, pageHeight);

    doc.setDrawColor(...accent);
    doc.setLineWidth(0.5);
    doc.line(margin, margin, pageWidth - margin, margin);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...charcoal);
    doc.text('Devis', margin, margin + 10);

    const quoteNum = quote.quote_number || `#${quote.id.substring(0, 8).toUpperCase()}`;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateGray);
    doc.text(quoteNum, pageWidth - margin, margin + 10, { align: 'right' });

    let yPos = margin + 20;

    doc.setDrawColor(...border);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 14;

    const col1X = margin;
    const col2X = pageWidth / 2 + 16;
    const clientW = pageWidth - col2X - margin;
    const clientH = 44;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('ÉMETTEUR', col1X, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...charcoal);
    yPos += 6;
    doc.text(companyName || cardOwnerName || 'Votre Entreprise', col1X, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    if (companySiret) {
      doc.text(`RCCM: ${companySiret}`, col1X, yPos);
      yPos += 3.8;
    }
    if (companyNif) {
      doc.text(`NIF: ${companyNif}`, col1X, yPos);
      yPos += 3.8;
    }
    if (companyVatNumber) {
      doc.text(`N° TVA: ${companyVatNumber}`, col1X, yPos);
      yPos += 3.8;
    }
    const addr = companyAddress || cardOwnerAddress;
    if (addr) {
      const lines = doc.splitTextToSize(addr, 88);
      doc.text(lines, col1X, yPos);
      yPos += lines.length * 3.8;
    }
    const phone = companyPhone || cardOwnerPhone;
    if (phone) {
      doc.text(`Tél: ${phone}`, col1X, yPos);
      yPos += 3.8;
    }
    const email = companyEmail || cardOwnerEmail;
    if (email) doc.text(`Email: ${email}`, col1X, yPos);
    yPos += 3.8;
    if (companyWebsite) doc.text(`Web: ${companyWebsite}`, col1X, yPos);

    const clientY = margin + 46;
    doc.setFillColor(...cream);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 2, 2, 'F');
    doc.roundedRect(col2X - 8, clientY, clientW + 8, clientH, 2, 2, 'S');

    let cy = clientY + 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('FACTURÉ À', col2X, cy);

    doc.setFontSize(11);
    doc.setTextColor(...charcoal);
    cy += 6;
    if (quote.client_company) {
      doc.setFont('helvetica', 'bold');
      doc.text(quote.client_company, col2X, cy);
      cy += 5;
      doc.setFont('helvetica', 'normal');
    }
    doc.text(quote.client_name, col2X, cy);

    doc.setFontSize(9);
    doc.setTextColor(...slateGray);
    cy += 4;
    doc.text(quote.client_email, col2X, cy);
    cy += 3.5;
    if (quote.client_phone) doc.text(quote.client_phone, col2X, cy);

    yPos = Math.max(yPos, clientY + clientH) + 14;

    doc.setFillColor(...cream);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, 'F');
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    yPos += 6;
    doc.text('N° Devis', margin + 6, yPos);
    doc.text('Date', margin + 70, yPos);
    doc.text('Validité', pageWidth - margin - 50, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...charcoal);
    yPos += 6;
    doc.text(quoteNum, margin + 6, yPos);
    doc.text(new Date(quote.created_at).toLocaleDateString('fr-FR'), margin + 70, yPos);
    doc.text('30 jours', pageWidth - margin - 50, yPos);

    yPos += 14;

    doc.setDrawColor(...accent);
    doc.setLineWidth(0.4);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.1);
    doc.line(margin, yPos + 1.5, pageWidth - margin, yPos + 1.5);
    yPos += 10;

    if (hasLineItems) {
      const tableWidth = pageWidth - margin * 2;
      const colDesc = Math.floor(tableWidth * 0.55);
      const colQty = Math.floor(tableWidth * 0.08);
      const colPu = Math.floor(tableWidth * 0.18);
      const colTotal = Math.floor(tableWidth * 0.19);

      doc.setFillColor(...accent);
      doc.rect(margin, yPos - 1, tableWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Description', margin + 3, yPos + 5);
      doc.text('Qté', margin + colDesc + colQty - 2, yPos + 5, { align: 'right' });
      doc.text('P.U.', margin + colDesc + colQty + colPu - 2, yPos + 5, { align: 'right' });
      doc.text('Total', margin + colDesc + colQty + colPu + colTotal - 2, yPos + 5, { align: 'right' });
      yPos += 8;

      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 2;

      const validItems = lineItems.filter((i) => i.title.trim() && i.unit_price >= 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...charcoal);

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const qty = item.quantity || 1;
        const pu = item.unit_price || 0;
        const total = qty * pu;
        const descLines = doc.splitTextToSize(item.title, colDesc - 6);
        const rowH = Math.max(descLines.length * 4.5, 7);

        if (i % 2 === 0) {
          doc.setFillColor(...cream);
          doc.rect(margin, yPos, tableWidth, rowH, 'F');
        }

        doc.text(descLines, margin + 3, yPos + 4);
        doc.text(String(qty), margin + colDesc + colQty - 2, yPos + 4, { align: 'right' });
        doc.text(`${this.formatAmount(pu)} FCFA`, margin + colDesc + colQty + colPu - 2, yPos + 4, { align: 'right' });
        doc.text(`${this.formatAmount(total)} FCFA`, margin + colDesc + colQty + colPu + colTotal - 2, yPos + 4, { align: 'right' });
        yPos += rowH;
      }

      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...accent);
      doc.text('Service demandé', margin, yPos);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...charcoal);
      yPos += 6;
      const serviceLines = doc.splitTextToSize(quote.service_requested, pageWidth - margin * 2);
      doc.text(serviceLines, margin, yPos);
      yPos += serviceLines.length * 4.5 + 10;
    }

    if (quote.project_description) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accent);
      doc.text('Description du projet', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...charcoal);
      yPos += 6;
      const descLines = doc.splitTextToSize(quote.project_description, pageWidth - margin * 2);
      doc.text(descLines, margin, yPos);
      yPos += descLines.length * 4 + 10;
    }

    if (quote.budget_range || quote.urgency || quote.preferred_start_date) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accent);
      doc.text('Détails de la demande', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...charcoal);
      yPos += 6;
      if (quote.budget_range) {
        doc.text(`Budget indicatif: ${quote.budget_range}`, margin + 4, yPos);
        yPos += 4;
      }
      if (quote.urgency) {
        const labels: Record<string, string> = { urgent: 'Urgent', normal: 'Normal', flexible: 'Flexible' };
        doc.text(`Urgence: ${labels[quote.urgency] || quote.urgency}`, margin + 4, yPos);
        yPos += 4;
      }
      if (quote.preferred_start_date) {
        doc.text(`Début souhaité: ${new Date(quote.preferred_start_date).toLocaleDateString('fr-FR')}`, margin + 4, yPos);
        yPos += 4;
      }
      yPos += 6;
    }

    if (quote.quote_amount && quote.quote_amount > 0) {
      if (yPos > pageHeight - 55) {
        doc.addPage();
        yPos = margin;
      }
      yPos += 6;

      const totalBoxRight = pageWidth - margin;
      const totalBlockLeft = totalBoxRight - 85;

      doc.setFillColor(...accent);
      doc.roundedRect(totalBlockLeft - 3, yPos - 5, totalBoxRight - totalBlockLeft + 3, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Montant du devis', totalBlockLeft, yPos + 2);
      doc.text(`${this.formatAmount(quote.quote_amount)} FCFA`, totalBoxRight - 5, yPos + 2, { align: 'right' });
      yPos += 16;
    }

    if (paymentTerms) {
      if (yPos > pageHeight - 45) {
        doc.addPage();
        yPos = margin;
      }
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accent);
      doc.text('Conditions de règlement', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...charcoal);
      yPos += 5;
      const ptLines = doc.splitTextToSize(paymentTerms, pageWidth - margin * 2);
      doc.text(ptLines, margin + 4, yPos);
      yPos += ptLines.length * 4 + 6;
    }

    if (executionDelay) {
      if (yPos > pageHeight - 35) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...accent);
      doc.text('Délai d\'exécution: ', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...charcoal);
      doc.text(executionDelay, margin + 45, yPos);
      yPos += 8;
    }

    if (proposalNotes) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }
      yPos += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accent);
      doc.text('Détails de la proposition', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...charcoal);
      yPos += 5;
      const pnLines = doc.splitTextToSize(proposalNotes, pageWidth - margin * 2);
      doc.text(pnLines, margin + 4, yPos);
      yPos += pnLines.length * 4 + 8;
    }

    const qWithSig = quote as ServiceQuote & { client_signature?: string; client_signed_at?: string };
    if (qWithSig.client_signature && qWithSig.client_signature.startsWith('data:image')) {
      if (yPos > pageHeight - 70) {
        doc.addPage();
        yPos = margin;
      }
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...accent);
      doc.text('Signature du client', margin, yPos);
      yPos += 10;

      const sigBoxY = yPos;
      const sigBoxH = 40;
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, sigBoxY, 90, sigBoxH, 2, 2, 'S');

      try {
        const base64 = qWithSig.client_signature.includes(',') ? qWithSig.client_signature.split(',')[1] : qWithSig.client_signature;
        if (base64) doc.addImage(base64, 'PNG', margin + 4, sigBoxY + 4, 82, sigBoxH - 8);
      } catch {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...slateGray);
        doc.text('Signature électronique', margin + 20, sigBoxY + sigBoxH / 2 - 2);
      }

      yPos += sigBoxH + 4;
      if (qWithSig.client_signed_at) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...slateGray);
        doc.text(`Signé le ${new Date(qWithSig.client_signed_at).toLocaleDateString('fr-FR')}`, margin, yPos);
        yPos += 6;
      }
      yPos += 6;
    }

    if (quote.internal_notes) {
      if (yPos > pageHeight - 45) {
        doc.addPage();
        yPos = margin;
      }
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...charcoal);
      doc.text('Notes:', margin, yPos);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...slateGray);
      yPos += 5;
      const notesLines = doc.splitTextToSize(quote.internal_notes, pageWidth - margin * 2);
      doc.text(notesLines, margin + 4, yPos);
      yPos += notesLines.length * 3.5 + 8;
    }

    const footerY = pageHeight - 28;
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...slateGray);
    doc.text('Ce devis est valable 30 jours à compter de la date d\'émission.', pageWidth / 2, footerY + 6, { align: 'center' });
    doc.text(`Généré via Bööh — ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, footerY + 11, { align: 'center' });

    return doc.output('blob');
  }

  static async downloadQuotePDF(data: QuoteGenerationData) {
    const pdfBlob = await this.generateQuotePDF(data);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Devis_${data.quote.client_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
