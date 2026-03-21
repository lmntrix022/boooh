/**
 * Performance Dashboard Component
 * Real-time monitoring of Core Web Vitals and performance metrics
 * 
 * Features:
 * - Live Web Vitals tracking (LCP, FID, CLS)
 * - Threshold status indicators
 * - Performance badges
 * - Resource timing analysis
 * - Export metrics for analysis
 */

import React, { useState, useEffect } from 'react';
import { PerformanceMonitoringService } from '@/services/performanceMonitoring';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MetricStatus {
  name: string;
  value: number | string;
  target: string;
  passing: boolean;
  unit: string;
  icon: React.ReactNode;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({});
  const [thresholds, setThresholds] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Refresh metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      const currentMetrics = PerformanceMonitoringService.getMetrics();
      const currentThresholds = PerformanceMonitoringService.checkThresholds();
      
      setMetrics(currentMetrics);
      setThresholds(currentThresholds);
      setIsUpdating(false);
    }, 5000);

    // Initial fetch
    const currentMetrics = PerformanceMonitoringService.getMetrics();
    const currentThresholds = PerformanceMonitoringService.checkThresholds();
    setMetrics(currentMetrics);
    setThresholds(currentThresholds);

    return () => clearInterval(interval);
  }, []);

  // Prepare metric statuses
  const metricStatuses: MetricStatus[] = [
    {
      name: 'LCP',
      value: metrics.lcp?.value?.toFixed(2) || 'N/A',
      target: '< 2500ms',
      passing: thresholds.lcp,
      unit: 'ms',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      name: 'FID',
      value: metrics.fid?.value?.toFixed(2) || 'N/A',
      target: '< 100ms',
      passing: thresholds.fid,
      unit: 'ms',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      name: 'CLS',
      value: metrics.cls?.value?.toFixed(3) || 'N/A',
      target: '< 0.1',
      passing: thresholds.cls,
      unit: '',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  ];

  // Export metrics as JSON
  const handleExportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      thresholds,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
  };

  // Calculate overall score
  const passingCount = metricStatuses.filter(m => m.passing).length;
  const overallScore = (passingCount / metricStatuses.length) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-sm text-gray-600">Real-time Core Web Vitals tracking</p>
        </div>
        <Button
          onClick={handleExportMetrics}
          className="bg-gray-900 hover:bg-gray-800 text-white"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-white border border-gray-200/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Score</p>
              <p className="text-4xl font-bold text-gray-900">{overallScore.toFixed(0)}%</p>
            </div>
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  fill="none"
                  stroke={overallScore === 100 ? '#22c55e' : overallScore >= 50 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${(overallScore / 100) * 276} 276`}
                  strokeLinecap="round"
                />
              </svg>
              {thresholds.passing ? (
                <CheckCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricStatuses.map((metric) => (
          <Card
            key={metric.name}
            className={`bg-white border ${
              metric.passing ? 'border-green-200/50' : 'border-red-200/50'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.name}
                </CardTitle>
                {metric.passing ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {metric.value}
                </span>
                <span className="text-sm text-gray-600">{metric.unit}</span>
              </div>
              <p className="text-xs text-gray-500">Target: {metric.target}</p>
              <div className="pt-2 border-t border-gray-200">
                <p className={`text-xs font-medium ${
                  metric.passing ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.passing ? '✅ Excellent' : '❌ Needs Improvement'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips Card */}
      <Card className="bg-blue-50 border border-blue-200/50">
        <CardHeader>
          <CardTitle className="text-sm text-blue-900">💡 Performance Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          {!thresholds.lcp && (
            <p>• <strong>LCP Issue:</strong> Optimize hero image size and preload critical resources</p>
          )}
          {!thresholds.fid && (
            <p>• <strong>FID Issue:</strong> Break long tasks and defer non-critical JavaScript</p>
          )}
          {!thresholds.cls && (
            <p>• <strong>CLS Issue:</strong> Add dimensions to images and reserve space for dynamic content</p>
          )}
          {thresholds.passing && (
            <p>✅ <strong>Great!</strong> All Core Web Vitals are within acceptable ranges. Keep monitoring!</p>
          )}
        </CardContent>
      </Card>

      {/* Status Indicator */}
      {isUpdating && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Updating metrics...
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
