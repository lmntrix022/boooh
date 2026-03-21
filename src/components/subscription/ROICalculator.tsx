/**
 * Calculateur ROI interactif pour les packages Opéré
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { OpereSetupPackage, OPERE_SETUP_PACKAGES } from '@/types/subscription';
import { calculateOpereROI, formatROIForDisplay, calculateMultiYearCost } from '@/services/opereROICalculator';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ROICalculatorProps {
  selectedPackageId?: string;
  onPackageChange?: (packageId: string) => void;
}

export function ROICalculator({ selectedPackageId, onPackageChange }: ROICalculatorProps) {
  const [expectedRevenue, setExpectedRevenue] = useState(3000000); // 3M FCFA par défaut
  const [profitMargin, setProfitMargin] = useState(30); // 30% par défaut
  const [timeframe, setTimeframe] = useState<1 | 3 | 5>(1); // 1, 3 ou 5 ans
  
  const selectedPackage = useMemo(() => {
    if (selectedPackageId) {
      return OPERE_SETUP_PACKAGES.find(p => p.id === selectedPackageId) || OPERE_SETUP_PACKAGES[1];
    }
    return OPERE_SETUP_PACKAGES[1]; // Business par défaut
  }, [selectedPackageId]);
  
  // Calculer le ROI
  const roi = useMemo(() => {
    return calculateOpereROI(selectedPackage, expectedRevenue, profitMargin / 100);
  }, [selectedPackage, expectedRevenue, profitMargin]);
  
  const formattedROI = useMemo(() => {
    return formatROIForDisplay(roi);
  }, [roi]);
  
  // Calcul multi-années
  const multiYearCost = useMemo(() => {
    return calculateMultiYearCost(selectedPackage, expectedRevenue, timeframe);
  }, [selectedPackage, expectedRevenue, timeframe]);
  
  // Données pour le graphique
  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const cumulativeRevenue = months.map(m => expectedRevenue * m);
    const cumulativeProfit = cumulativeRevenue.map(r => r * (profitMargin / 100));
    const cumulativeCost = months.map(m => {
      const setupCost = selectedPackage.price;
      const commissions = (expectedRevenue * 0.10) * m;
      return setupCost + commissions;
    });
    const cumulativeROI = cumulativeProfit.map((profit, i) => profit - cumulativeCost[i]);
    
    return {
      labels: months.map(m => `Mois ${m}`),
      datasets: [
        {
          label: 'Profit brut',
          data: cumulativeProfit,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
        },
        {
          label: 'Coût cumulé',
          data: cumulativeCost,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
        },
        {
          label: 'ROI net',
          data: cumulativeROI,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
      ],
    };
  }, [selectedPackage, expectedRevenue, profitMargin]);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XAF',
                minimumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('fr-FR', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value) + ' FCFA';
          }
        }
      }
    }
  };
  
  const profitabilityColor = {
    excellent: 'text-green-600 bg-green-50 border-green-200',
    good: 'text-blue-600 bg-blue-50 border-blue-200',
    fair: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200',
  };
  
  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Calculateur de ROI</h2>
        <p className="text-gray-600">
          Projetez votre retour sur investissement selon vos objectifs de chiffre d'affaires
        </p>
      </div>
      
      {/* Sélection du package */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Package sélectionné
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {OPERE_SETUP_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onPackageChange?.(pkg.id)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${selectedPackage.id === pkg.id
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="text-sm font-semibold text-gray-900">{pkg.name}</div>
              <div className="text-xs text-gray-500 mt-1">{pkg.price.toLocaleString()} FCFA</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Paramètres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CA mensuel */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Chiffre d'affaires mensuel
          </label>
          <input
            type="range"
            min="500000"
            max="20000000"
            step="100000"
            value={expectedRevenue}
            onChange={(e) => setExpectedRevenue(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="mt-3 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {(expectedRevenue / 1000).toLocaleString()} K
            </div>
            <div className="text-sm text-gray-500">FCFA / mois</div>
          </div>
        </div>
        
        {/* Marge bénéficiaire */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Target className="w-4 h-4 inline mr-2" />
            Marge bénéficiaire
          </label>
          <input
            type="range"
            min="10"
            max="70"
            step="5"
            value={profitMargin}
            onChange={(e) => setProfitMargin(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="mt-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{profitMargin}%</div>
            <div className="text-sm text-gray-500">de marge</div>
          </div>
        </div>
        
        {/* Période */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Calendar className="w-4 h-4 inline mr-2" />
            Période d'analyse
          </label>
          <div className="space-y-2">
            {[1, 3, 5].map((year) => (
              <button
                key={year}
                onClick={() => setTimeframe(year as 1 | 3 | 5)}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium transition-colors
                  ${timeframe === year
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {year} {year === 1 ? 'an' : 'ans'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Résultats ROI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200"
        >
          <div className="text-sm font-semibold text-blue-700 mb-2">ROI Net (1 an)</div>
          <div className="text-3xl font-bold text-blue-900">{formattedROI.netROI}</div>
          <div className="text-sm text-blue-600 mt-2">{formattedROI.roiPercent}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200"
        >
          <div className="text-sm font-semibold text-green-700 mb-2">Point mort</div>
          <div className="text-3xl font-bold text-green-900">{formattedROI.breakEven}</div>
          <div className="text-sm text-green-600 mt-2">
            {roi.breakEvenMonths < 3 ? 'Excellent ✨' : roi.breakEvenMonths < 6 ? 'Très bon 👍' : 'Bon'}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200"
        >
          <div className="text-sm font-semibold text-purple-700 mb-2">Setup Fee</div>
          <div className="text-3xl font-bold text-purple-900">{formattedROI.setupFee}</div>
          <div className="text-sm text-purple-600 mt-2">One-time</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200"
        >
          <div className="text-sm font-semibold text-orange-700 mb-2">Commission/mois</div>
          <div className="text-3xl font-bold text-orange-900">{formattedROI.monthlyCommission}</div>
          <div className="text-sm text-orange-600 mt-2">10% du CA</div>
        </motion.div>
      </div>
      
      {/* Rentabilité */}
      <div className={`rounded-xl p-6 border-2 ${profitabilityColor[formattedROI.profitability]}`}>
        <div className="flex items-center gap-3 mb-3">
          {formattedROI.profitability === 'excellent' || formattedROI.profitability === 'good' ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <TrendingUp className="w-6 h-6" />
          )}
          <span className="text-lg font-bold">
            Rentabilité: {
              formattedROI.profitability === 'excellent' ? 'Excellente 🎉' :
              formattedROI.profitability === 'good' ? 'Bonne ✅' :
              formattedROI.profitability === 'fair' ? 'Correcte ⚠️' :
              'Faible ❌'
            }
          </span>
        </div>
        <p className="text-sm opacity-90">
          {formattedROI.profitability === 'excellent' && (
            'Investissement hautement rentable. Le ROI est supérieur à 200% sur un an.'
          )}
          {formattedROI.profitability === 'good' && (
            'Bon investissement. Le ROI est positif et supérieur à 100% sur un an.'
          )}
          {formattedROI.profitability === 'fair' && (
            'Investissement correct mais peut être optimisé. Envisagez d\'augmenter votre CA ou votre marge.'
          )}
          {formattedROI.profitability === 'poor' && (
            'Le retour sur investissement est faible. Augmentez votre CA pour améliorer la rentabilité.'
          )}
        </p>
      </div>
      
      {/* Graphique */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution sur 12 mois</h3>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
      
      {/* Projection multi-années */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Projection sur {timeframe} {timeframe === 1 ? 'an' : 'ans'}
        </h3>
        <div className="space-y-3">
          {multiYearCost.yearlyBreakdown.map((year) => (
            <div key={year.year} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900">Année {year.year}</div>
                <div className="text-sm text-gray-600">
                  Commission: {year.commissions.toLocaleString()} FCFA
                  {year.year === 1 && ` + Setup: ${selectedPackage.price.toLocaleString()} FCFA`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{year.total.toLocaleString()} FCFA</div>
                <div className="text-xs text-gray-500">Cumulé: {year.cumulativeCost.toLocaleString()} FCFA</div>
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div>
              <div className="font-bold text-blue-900">Coût mensuel moyen</div>
              <div className="text-sm text-blue-600">Sur {timeframe} {timeframe === 1 ? 'an' : 'ans'}</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {multiYearCost.averageMonthly.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="text-center">
        <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
          Démarrer avec {selectedPackage.name}
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-sm text-gray-600 mt-3">
          Sans engagement • Paiement sécurisé • Support dédié
        </p>
      </div>
    </div>
  );
}
