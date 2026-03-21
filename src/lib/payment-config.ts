/**
 * Configuration centralisée pour BoohPay
 */

export const BoohPayConfig = {
  // URL de l'API
  API_URL: import.meta.env.VITE_BOOHPAY_API_URL || 'http://localhost:3000',
  
  // URL du Dashboard BoohPay (pour les emails d'onboarding)
  DASHBOARD_URL: import.meta.env.VITE_BOOHPAY_DASHBOARD_URL || 'http://localhost:3001',
  
  // Timeout pour les requêtes API (en ms)
  API_TIMEOUT: 30000,
  
  // Nombre de tentatives de retry
  MAX_RETRIES: 3,
  
  // Délai entre les retries (en ms)
  RETRY_DELAY: 1000,
};

export default BoohPayConfig;

