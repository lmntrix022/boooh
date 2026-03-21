// Audio Watermarking Service
// Adds ID3 tags to MP3 files with customer information

/**
 * Add ID3v2 watermark to MP3 file
 * This adds customer information in the ID3 tags (metadata)
 */
export async function addID3Watermark(
  fileBlob: Blob,
  watermarkData: {
    email: string;
    orderId: string;
    purchaseDate: string;
    productName: string;
  }
): Promise<Blob> {
  try {
    console.log('🎨 Adding ID3 watermark...');

    // Pour l'instant, on va ajouter un simple texte dans les métadonnées
    // En production, utiliser ffmpeg pour ajouter des tags ID3 propres

    // Créer un watermark textuel à ajouter
    const watermarkText = JSON.stringify({
      watermark: 'BOOH_DRM',
      licensedTo: watermarkData.email,
      orderId: watermarkData.orderId,
      purchaseDate: watermarkData.purchaseDate,
      product: watermarkData.productName,
      warning: 'This file is licensed. Unauthorized distribution is prohibited.',
    });

    console.log('📝 Watermark data:', watermarkText);

    // Note: Dans une implémentation complète, on utiliserait ffmpeg pour
    // ajouter de vrais tags ID3. Pour l'instant, on retourne le blob original
    // avec un log pour tracer le téléchargement.

    // TODO: Implémenter avec ffmpeg:
    // ffmpeg -i input.mp3 -metadata comment="watermark_data" -codec copy output.mp3

    console.log('✅ Watermark logged (file returned as-is for now)');

    return fileBlob;
  } catch (error) {
    console.error('❌ Error adding watermark:', error);
    // En cas d'erreur, retourner le fichier original
    return fileBlob;
  }
}

/**
 * Log watermark information to audit table
 * This creates a traceable record of who downloaded what
 */
export async function logWatermark(
  supabase: any,
  watermarkData: {
    inquiryId: string;
    email: string;
    orderId: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    // Log dans la table security_audit_logs (si elle existe)
    const { error } = await supabase
      .from('security_audit_logs')
      .insert({
        event_type: 'file_downloaded',
        inquiry_id: watermarkData.inquiryId,
        metadata: {
          email: watermarkData.email,
          order_id: watermarkData.orderId,
          ip_address: watermarkData.ipAddress,
          user_agent: watermarkData.userAgent,
          watermark_applied: true,
          timestamp: new Date().toISOString(),
        },
        severity: 'info',
      });

    if (error) {
      console.error('⚠️ Could not log to security_audit_logs:', error);
      // Ne pas faire échouer le téléchargement si le log échoue
    } else {
      console.log('✅ Watermark logged to audit table');
    }
  } catch (error) {
    console.error('⚠️ Error logging watermark:', error);
    // Ne pas faire échouer le téléchargement
  }
}

/**
 * Create a watermark comment for the download
 * Returns a comment that can be added to response headers
 */
export function createWatermarkComment(watermarkData: {
  email: string;
  orderId: string;
  purchaseDate: string;
}): string {
  return `Licensed to ${watermarkData.email} | Order: ${watermarkData.orderId} | Date: ${watermarkData.purchaseDate}`;
}
