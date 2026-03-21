import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/utils/format';
import { useLanguage } from '@/hooks/useLanguage';

interface DashboardChartsProps {
  revenueData: {
    date: string;
    revenue: number;
  }[];
  activityData: {
    date: string;
    views: number;
    orders: number;
    appointments: number;
  }[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  revenueData,
  activityData,
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
      {/* Graphique du chiffre d'affaires */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-0 flex flex-row items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-light text-gray-900 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {t('dashboard.charts.revenueEvolution')}
          </CardTitle>
          {/* Sélecteur de période premium (non fonctionnel) */}
          <div className="hidden md:block">
            <select className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-light focus:outline-none"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <option>{t('dashboard.charts.7days')}</option>
              <option>{t('dashboard.charts.30days')}</option>
              <option>{t('dashboard.charts.90days')}</option>
              <option>{t('dashboard.charts.180days')}</option>
              <option>{t('dashboard.charts.365days')}</option>
              <option>{t('dashboard.charts.all')}</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis
                  dataKey="date"
                  className="text-xs font-light"
                  tickLine={false}
                  stroke="#9ca3af"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
                <YAxis
                  className="text-xs font-light"
                  tickLine={false}
                  stroke="#9ca3af"
                  tickFormatter={(value) => `${value} FCFA`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                  formatter={(value: number) => [`${value} FCFA`, t('dashboard.charts.revenue')]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6b7280"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Graphique de l'activité */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-0 flex flex-row items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-light text-gray-900 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {t('dashboard.charts.activity')}
          </CardTitle>
          <div className="hidden md:block">
            <select className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-light focus:outline-none"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <option>{t('dashboard.charts.7days')}</option>
              <option>{t('dashboard.charts.30days')}</option>
              <option>{t('dashboard.charts.90days')}</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis
                  dataKey="date"
                  className="text-xs font-light"
                  tickLine={false}
                  stroke="#9ca3af"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
                <YAxis
                  className="text-xs font-light"
                  tickLine={false}
                  stroke="#9ca3af"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
                <Bar
                  dataKey="views"
                  name={t('dashboard.charts.views')}
                  fill="#6b7280"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="orders"
                  name={t('dashboard.charts.orders')}
                  fill="#9ca3af"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="appointments"
                  name={t('dashboard.charts.appointments')}
                  fill="#d1d5db"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts; 