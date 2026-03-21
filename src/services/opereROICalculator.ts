/**
 * Service de calcul du ROI pour les packages Opéré
 */

import { OpereSetupPackage, OPERE_SETUP_PACKAGES } from '@/types/subscription';

export interface ROICalculation {
  // Investissement
  setupFee: number; // en FCFA
  monthlyCommission: number; // en FCFA
  yearlyCommissions: number; // en FCFA
  yearlyTotal: number; // en FCFA
  
  // Revenus et profits
  expectedMonthlyRevenue: number; // CA mensuel projeté en FCFA
  yearlyRevenue: number; // CA annuel en FCFA
  estimatedProfit: number; // Profit estimé (marge × CA) en FCFA
  
  // ROI
  netROI: number; // ROI net (profit - coût) en FCFA
  roiPercent: number; // ROI en %
  breakEvenMonths: number; // Nombre de mois pour amortir le setup
  
  // Projections
  projectedROI: {
    month1: number;
    month3: number;
    month6: number;
    year1: number;
  };
}

/**
 * Calculer le ROI complet pour un package Opéré
 */
export function calculateOpereROI(
  setupPackage: OpereSetupPackage,
  expectedMonthlyRevenue: number, // en FCFA
  profitMargin: number = 0.30 // Marge bénéficiaire (30% par défaut)
): ROICalculation {
  // Commissions (10% du CA)
  const monthlyCommission = Math.floor(expectedMonthlyRevenue * 0.10);
  const yearlyCommissions = monthlyCommission * 12;
  
  // Investissement total première année
  const yearlyTotal = setupPackage.price + yearlyCommissions;
  
  // Revenus et profits
  const yearlyRevenue = expectedMonthlyRevenue * 12;
  const estimatedProfit = Math.floor(yearlyRevenue * profitMargin);
  
  // ROI net = Profit - Coût
  const netROI = estimatedProfit - yearlyTotal;
  const roiPercent = yearlyTotal > 0 
    ? ((netROI / yearlyTotal) * 100)
    : 0;
  
  // Break-even (mois pour amortir le setup fee)
  const monthlyProfit = Math.floor((expectedMonthlyRevenue * profitMargin) - monthlyCommission);
  const breakEvenMonths = monthlyProfit > 0
    ? Math.ceil(setupPackage.price / monthlyProfit)
    : Infinity;
  
  // Projections mois par mois
  const calculatePeriodROI = (months: number) => {
    const periodRevenue = expectedMonthlyRevenue * months;
    const periodProfit = periodRevenue * profitMargin;
    const periodCommissions = monthlyCommission * months;
    const periodCost = setupPackage.price + periodCommissions;
    return Math.floor(periodProfit - periodCost);
  };
  
  return {
    setupFee: setupPackage.price,
    monthlyCommission,
    yearlyCommissions,
    yearlyTotal,
    
    expectedMonthlyRevenue,
    yearlyRevenue,
    estimatedProfit,
    
    netROI,
    roiPercent: parseFloat(roiPercent.toFixed(2)),
    breakEvenMonths: isFinite(breakEvenMonths) ? breakEvenMonths : 999,
    
    projectedROI: {
      month1: calculatePeriodROI(1),
      month3: calculatePeriodROI(3),
      month6: calculatePeriodROI(6),
      year1: calculatePeriodROI(12),
    },
  };
}

/**
 * Recommander le meilleur package selon le CA projeté et les besoins
 */
export function recommendOperePackage(requirements: {
  expectedMonthlyRevenue: number; // CA mensuel projeté en FCFA
  needsMarketing?: boolean;
  needsContentCreation?: boolean;
  needsCustomIntegration?: boolean;
  teamSize?: number;
  productCount?: number;
}): {
  recommendedPackage: OpereSetupPackage;
  alternativePackages: OpereSetupPackage[];
  roi: ROICalculation;
  reason: string;
} {
  const { expectedMonthlyRevenue } = requirements;
  
  // Trouver le package recommandé selon le CA
  let recommendedPackage = OPERE_SETUP_PACKAGES[0]; // Standard par défaut
  
  for (const pkg of OPERE_SETUP_PACKAGES) {
    if (pkg.targetRevenue) {
      const { min, max } = pkg.targetRevenue;
      if (expectedMonthlyRevenue >= min && expectedMonthlyRevenue <= max) {
        recommendedPackage = pkg;
        break;
      }
    }
  }
  
  // Ajustements selon les besoins spécifiques
  if (requirements.needsContentCreation && requirements.needsCustomIntegration) {
    // Besoins complexes → Premium ou Enterprise
    if (expectedMonthlyRevenue >= 10000000) {
      recommendedPackage = OPERE_SETUP_PACKAGES[3]; // Enterprise
    } else if (expectedMonthlyRevenue >= 5000000) {
      recommendedPackage = OPERE_SETUP_PACKAGES[2]; // Premium
    }
  } else if (requirements.needsMarketing) {
    // Marketing nécessaire → Au moins Business
    if (recommendedPackage.id === 'standard') {
      recommendedPackage = OPERE_SETUP_PACKAGES[1]; // Business
    }
  }
  
  // Alternatives (packages adjacents)
  const currentIndex = OPERE_SETUP_PACKAGES.findIndex(p => p.id === recommendedPackage.id);
  const alternativePackages = OPERE_SETUP_PACKAGES.filter((_, index) => 
    index !== currentIndex && Math.abs(index - currentIndex) <= 1
  );
  
  // Calculer le ROI
  const roi = calculateOpereROI(recommendedPackage, expectedMonthlyRevenue);
  
  // Raison de la recommandation
  let reason = recommendedPackage.recommended || 'Package adapté à votre CA';
  if (roi.breakEvenMonths <= 2) {
    reason += ` - ROI en ${roi.breakEvenMonths} mois`;
  }
  
  return {
    recommendedPackage,
    alternativePackages,
    roi,
    reason,
  };
}

/**
 * Comparer plusieurs packages pour un même CA
 */
export function compareOperePackages(
  expectedMonthlyRevenue: number,
  profitMargin: number = 0.30
): Array<{
  package: OpereSetupPackage;
  roi: ROICalculation;
  score: number; // Score de 0 à 100
}> {
  const comparisons = OPERE_SETUP_PACKAGES.map(pkg => {
    const roi = calculateOpereROI(pkg, expectedMonthlyRevenue, profitMargin);
    
    // Calculer un score (meilleur ROI % + break-even rapide)
    let score = 50; // Score de base
    
    // Bonus pour ROI positif
    if (roi.netROI > 0) {
      score += Math.min(25, roi.roiPercent / 10); // Max +25 points
    }
    
    // Bonus pour break-even rapide
    if (roi.breakEvenMonths <= 3) {
      score += 25;
    } else if (roi.breakEvenMonths <= 6) {
      score += 15;
    } else if (roi.breakEvenMonths <= 12) {
      score += 5;
    }
    
    // Malus si package trop cher pour le CA
    if (pkg.targetRevenue) {
      const { min, max } = pkg.targetRevenue;
      if (expectedMonthlyRevenue < min || expectedMonthlyRevenue > max) {
        score -= 20;
      }
    }
    
    return {
      package: pkg,
      roi,
      score: Math.max(0, Math.min(100, score)),
    };
  });
  
  // Trier par score décroissant
  return comparisons.sort((a, b) => b.score - a.score);
}

/**
 * Calculer le coût total sur N années
 */
export function calculateMultiYearCost(
  setupPackage: OpereSetupPackage,
  expectedMonthlyRevenue: number,
  years: number = 3
): {
  setupFee: number;
  yearlyBreakdown: Array<{
    year: number;
    commissions: number;
    total: number;
    cumulativeCost: number;
  }>;
  totalCost: number;
  averageMonthly: number;
} {
  const monthlyCommission = Math.floor(expectedMonthlyRevenue * 0.10);
  const yearlyCommissions = monthlyCommission * 12;
  
  const yearlyBreakdown = [];
  let cumulativeCost = setupPackage.price;
  
  for (let year = 1; year <= years; year++) {
    const yearCommissions = yearlyCommissions;
    cumulativeCost += yearCommissions;
    
    yearlyBreakdown.push({
      year,
      commissions: yearCommissions,
      total: year === 1 ? setupPackage.price + yearCommissions : yearCommissions,
      cumulativeCost,
    });
  }
  
  const totalCost = cumulativeCost;
  const totalMonths = years * 12;
  const averageMonthly = Math.floor(totalCost / totalMonths);
  
  return {
    setupFee: setupPackage.price,
    yearlyBreakdown,
    totalCost,
    averageMonthly,
  };
}

/**
 * Formatter les résultats pour affichage UI
 */
export function formatROIForDisplay(roi: ROICalculation): {
  setupFee: string;
  monthlyCommission: string;
  yearlyTotal: string;
  netROI: string;
  roiPercent: string;
  breakEven: string;
  profitability: 'excellent' | 'good' | 'fair' | 'poor';
} {
  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Déterminer la rentabilité
  let profitability: 'excellent' | 'good' | 'fair' | 'poor';
  if (roi.roiPercent >= 200) {
    profitability = 'excellent';
  } else if (roi.roiPercent >= 100) {
    profitability = 'good';
  } else if (roi.roiPercent >= 0) {
    profitability = 'fair';
  } else {
    profitability = 'poor';
  }
  
  return {
    setupFee: formatFCFA(roi.setupFee),
    monthlyCommission: formatFCFA(roi.monthlyCommission),
    yearlyTotal: formatFCFA(roi.yearlyTotal),
    netROI: formatFCFA(roi.netROI),
    roiPercent: `${roi.roiPercent > 0 ? '+' : ''}${roi.roiPercent.toFixed(1)}%`,
    breakEven: roi.breakEvenMonths < 999 
      ? `${roi.breakEvenMonths} mois` 
      : 'Non rentable',
    profitability,
  };
}
