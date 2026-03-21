import React from 'react'
import { Card } from '@/components/ui/card'
import { BarChart, LineChart, PieChart } from 'lucide-react'

const stats = [
  {
    title: "Vues totales",
    value: "12,456",
    change: "+14%",
    icon: LineChart,
    trend: "up"
  },
  {
    title: "Rendez-vous",
    value: "284",
    change: "+23%",
    icon: BarChart,
    trend: "up"
  },
  {
    title: "Commandes",
    value: "156",
    change: "+18%",
    icon: PieChart,
    trend: "up"
  }
]

const Analytics = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytiques</h2>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 border rounded-lg bg-white">
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
            <option>Cette année</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg ${
                stat.trend === 'up' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1">
                <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600">vs mois dernier</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Vues par jour</h3>
          <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
            {/* Placeholder pour le graphique - à implémenter avec une librairie comme recharts */}
            <p className="text-gray-500">Graphique des vues quotidiennes</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Sources de trafic</h3>
          <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
            {/* Placeholder pour le graphique - à implémenter avec une librairie comme recharts */}
            <p className="text-gray-500">Graphique des sources de trafic</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Activité récente</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-2 h-2 rounded-full bg-black"></div>
              <div className="flex-1">
                <p className="text-sm">Nouvelle visite de carte</p>
                <p className="text-xs text-gray-500">il y a {index + 1} heure{index > 0 ? 's' : ''}</p>
              </div>
              <button className="text-sm text-black hover:underline">
                Voir les détails
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default Analytics 