// Cache pour les modules
let html2canvasModule: any = null;
let rechartsModule: any = null;
let isLoadingHtml2Canvas = false;
let isLoadingRecharts = false;
let html2canvasPromise: Promise<any> | null = null;
let rechartsPromise: Promise<any> | null = null;

/**
 * Lazy loading optimisé pour html2canvas avec:
 * - Cache du module
 * - Éviter les chargements multiples
 * - Détection de connexion lente
 */
export const loadHtml2Canvas = async () => {
  // Retourner le cache si disponible
  if (html2canvasModule) return html2canvasModule;

  // Éviter les chargements multiples simultanés
  if (isLoadingHtml2Canvas && html2canvasPromise) return html2canvasPromise;

  isLoadingHtml2Canvas = true;

  html2canvasPromise = (async () => {
    try {
      // Détecter les connexions lentes
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
          // Log removed
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const module = await import('html2canvas');
      html2canvasModule = module.default;
      return html2canvasModule;
    } catch (error) {
      // Error log removed
      throw error;
    } finally {
      isLoadingHtml2Canvas = false;
    }
  })();

  return html2canvasPromise;
};

/**
 * Lazy loading optimisé pour recharts avec:
 * - Cache du module complet
 * - Chargement unique
 * - Détection de connexion lente
 */
export const loadRecharts = async () => {
  // Retourner le cache si disponible
  if (rechartsModule) return rechartsModule;

  // Éviter les chargements multiples simultanés
  if (isLoadingRecharts && rechartsPromise) return rechartsPromise;

  isLoadingRecharts = true;

  rechartsPromise = (async () => {
    try {
      // Détecter les connexions lentes
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
          // Log removed
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const module = await import('recharts');
      rechartsModule = module;
      return rechartsModule;
    } catch (error) {
      // Error log removed
      throw error;
    } finally {
      isLoadingRecharts = false;
    }
  })();

  return rechartsPromise;
};

// Lazy loading composants recharts individuels (réutilise le cache principal)
export const loadLineChart = async () => {
  const recharts = await loadRecharts();
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = recharts;
  return { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer };
};

export const loadBarChart = async () => {
  const recharts = await loadRecharts();
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = recharts;
  return { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer };
};

export const loadPieChart = async () => {
  const recharts = await loadRecharts();
  const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = recharts;
  return { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer };
};

export const loadAreaChart = async () => {
  const recharts = await loadRecharts();
  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = recharts;
  return { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer };
};

/**
 * Précharger html2canvas (optionnel)
 */
export const preloadHtml2Canvas = () => {
  if (html2canvasModule || isLoadingHtml2Canvas) return;

  // Ne précharger que sur connexion rapide
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
      return;
    }
  }

  loadHtml2Canvas().catch(err => {
    // Warning log removed
  });
};

/**
 * Précharger recharts (optionnel)
 */
export const preloadRecharts = () => {
  if (rechartsModule || isLoadingRecharts) return;

  // Ne précharger que sur connexion rapide
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
      return;
    }
  }

  loadRecharts().catch(err => {
    // Warning log removed
  });
};
