import { lazy, useState } from 'react'

// Lazy load html2canvas avec préchargement conditionnel
export const loadHtml2Canvas = () => {
  return import('html2canvas')
}

// Lazy load recharts avec ses sous-modules
export const loadRecharts = async () => {
  const [
    rechartsModule,
    lineChartModule,
    barChartModule,
    pieChartModule,
    areaChartModule
  ] = await Promise.all([
    import('recharts'),
    import('recharts').then(m => ({ LineChart: m.LineChart })),
    import('recharts').then(m => ({ BarChart: m.BarChart })),
    import('recharts').then(m => ({ PieChart: m.PieChart })),
    import('recharts').then(m => ({ AreaChart: m.AreaChart }))
  ])

  return {
    ...rechartsModule,
    ...lineChartModule,
    ...barChartModule,
    ...pieChartModule,
    ...areaChartModule
  }
}

// Lazy load QR Code
export const loadQRCode = () => {
  return import('qrcode.react')
}

// Lazy load framer-motion pour animations complexes
export const loadFramerMotion = () => {
  return import('framer-motion')
}

// Lazy load GSAP pour animations avancées
export const loadGSAP = () => {
  return import('gsap')
}

// Hook pour charger html2canvas à la demande
export const useHtml2Canvas = () => {
  const [html2canvas, setHtml2canvas] = useState<any>(null)

  const loadCanvas = async () => {
    if (!html2canvas) {
      const module = await loadHtml2Canvas()
      setHtml2canvas(() => module.default)
    }
  }

  return { html2canvas, loadCanvas }
}

// Composant wrapper pour charts lazy
export const LazyChart = lazy(async () => {
  const recharts = await loadRecharts()
  return { default: recharts as any }
})
