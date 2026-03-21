import { Invoice, InvoiceSettings } from './invoiceService';
import QRCode from 'qrcode';

/**
 * Service de génération du QR Code de facturation conforme DGI
 * Format JSON lisible : données exploitables immédiatement au scan
 * Hash SHA256 pour garantir l'intégrité
 */

function toNum(n: number | undefined | null): number {
  return Math.round((n ?? 0) * 100) / 100;
}

/** Chaîne pour le hash (format pipe, stable) */
function buildHashPayload(invoice: Invoice, settings: InvoiceSettings | null): string {
  const parts = [
    settings?.company_nif ?? '',
    invoice.client_nif ?? '',
    invoice.invoice_number ?? '',
    invoice.issue_date ?? '',
    toNum(invoice.total_ht),
    toNum(invoice.total_css),
    toNum(invoice.total_vat),
    toNum(invoice.total_ttc),
  ];
  return parts.join('|');
}

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Normalise le texte pour le QR (ASCII, pas d'accents) — meilleure compatibilité scan */
function qrSafe(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}

/**
 * Format texte court et lisible — affiché correctement par les apps de scan
 */
export async function buildInvoiceQrPayload(
  invoice: Invoice,
  settings: InvoiceSettings | null
): Promise<string> {
  const hashPayload = buildHashPayload(invoice, settings);
  const hash = await sha256Hex(hashPayload);

  const lines = [
    'FACTURE DGI',
    `N: ${qrSafe(invoice.invoice_number ?? '')}`,
    `Date: ${invoice.issue_date ?? ''}`,
    `Vendeur: ${qrSafe(settings?.company_name ?? '')} | NIF: ${qrSafe(settings?.company_nif ?? '')}`,
    `Client: ${qrSafe(invoice.client_name ?? '')}${invoice.client_nif ? ` | NIF: ${qrSafe(invoice.client_nif)}` : ''}`,
    `HT: ${toNum(invoice.total_ht)} | TTC: ${toNum(invoice.total_ttc)} FCFA`,
    `Hash: ${hash}`,
  ];

  return lines.join('\n');
}

/**
 * Génère le QR Code en data URL (PNG base64) pour affichage/PDF
 */
export async function generateInvoiceQrDataUrl(
  invoice: Invoice,
  settings: InvoiceSettings | null,
  options?: { size?: number; margin?: number }
): Promise<string> {
  const payload = await buildInvoiceQrPayload(invoice, settings);
  const size = options?.size ?? 256;
  const margin = options?.margin ?? 2;

  return QRCode.toDataURL(payload, {
    type: 'image/png',
    width: size,
    margin,
    errorCorrectionLevel: 'L', // Plus lisible, moins dense
  });
}

/**
 * Exporte le contenu brut (pour vérification manuelle ou API paiement)
 */
export function getInvoiceQrRawContent(
  invoice: Invoice,
  settings: InvoiceSettings | null
): { payload: string; buildHash: () => Promise<string> } {
  const payload = buildHashPayload(invoice, settings);
  return {
    payload,
    async buildHash() {
      return sha256Hex(payload);
    },
  };
}
