import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MapFilters {
  search: string;
  business_sector?: string;
  tags?: string[];
  sortBy?: string;
  maxDistance?: number;
}

const BUSINESS_SECTORS = [
  'Services',
  'Commerce',
  'Artisanat',
  'Santé',
  'Education',
  'Art et Culture',
  'Technologies',
  'Finance',
  'Immobilier',
  'Restauration',
  'Tourisme',
  'Transport'
];

const BUSINESS_TAGS = [
  'Startup',
  'PME',
  'Grande Entreprise',
  'Freelance',
  'International',
  'Local',
  'B2B',
  'B2C',
  'Innovation',
  'Eco-responsable'
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance' },
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'recent', label: 'Plus récent' }
];

export const MapFiltersTest: React.FC = () => {
  const [filters, setFilters] = useState<MapFilters>({
    search: '',
    business_sector: undefined,
    tags: [],
    sortBy: 'distance',
    maxDistance: undefined
  });

  const [testResults, setTestResults] = useState<{
    sectorFilter: boolean;
    tagsFilter: boolean;
    distanceFilter: boolean;
    sortFilter: boolean;
  }>({
    sectorFilter: false,
    tagsFilter: false,
    distanceFilter: false,
    sortFilter: false
  });

  const testFilters = () => {
    const results = {
      sectorFilter: !!filters.business_sector,
      tagsFilter: !!(filters.tags && filters.tags.length > 0),
      distanceFilter: !!filters.maxDistance,
      sortFilter: !!filters.sortBy
    };
    setTestResults(results);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      business_sector: undefined,
      tags: [],
      sortBy: 'distance',
      maxDistance: undefined
    });
    setTestResults({
      sectorFilter: false,
      tagsFilter: false,
      distanceFilter: false,
      sortFilter: false
    });
  };

  const getStatusIcon = (status: boolean) => {
    if (status) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧪 Test des Filtres Avancés de la Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Filtre par secteur d'activité */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Secteur d'activité</label>
            <Select 
              value={filters.business_sector || 'all'} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, business_sector: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les secteurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les secteurs</SelectItem>
                {BUSINESS_SECTORS.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TAGS.map(tag => {
                const isSelected = filters.tags?.includes(tag);
                return (
                  <Button 
                    key={tag} 
                    size="sm" 
                    variant={isSelected ? "default" : "outline"}
                    className={`rounded-xl text-xs font-semibold shadow-sm transition-all ${
                      isSelected 
                        ? 'bg-purple-500 text-white hover:bg-purple-600' 
                        : 'border-purple-200 bg-white/70 hover:bg-purple-100 text-purple-700'
                    }`}
                    onClick={() => {
                      const currentTags = filters.tags || [];
                      const newTags = isSelected 
                        ? currentTags.filter(t => t !== tag)
                        : [...currentTags, tag];
                      setFilters(prev => ({ ...prev, tags: newTags }));
                    }}
                  >
                    {tag}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Filtre par distance */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distance maximale</label>
            <Select 
              value={filters.maxDistance?.toString() || 'all'} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, maxDistance: value === 'all' ? undefined : parseInt(value) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes distances" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes distances</SelectItem>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tri des résultats */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Trier par</label>
            <Select 
              value={filters.sortBy || 'distance'} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtres actifs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filtres actifs :</label>
            <div className="flex flex-wrap gap-2">
              {filters.business_sector && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Secteur: {filters.business_sector}
                </Badge>
              )}
              {filters.tags && filters.tags.length > 0 && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Tags: {filters.tags.length}
                </Badge>
              )}
              {filters.maxDistance && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Distance: {filters.maxDistance}km
                </Badge>
              )}
              {!filters.business_sector && (!filters.tags || filters.tags.length === 0) && !filters.maxDistance && (
                <Badge variant="outline">Aucun filtre actif</Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={testFilters} className="flex-1">
              Tester les filtres
            </Button>
            <Button variant="outline" onClick={resetFilters} className="flex-1">
              Réinitialiser
            </Button>
          </div>

          {/* Résultats des tests */}
          {Object.values(testResults).some(result => result) && (
            <div className="space-y-2">
              <h3 className="font-semibold">Résultats des tests :</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  {getStatusIcon(testResults.sectorFilter)}
                  <span className="text-sm">Filtre secteur</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  {getStatusIcon(testResults.tagsFilter)}
                  <span className="text-sm">Filtre tags</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  {getStatusIcon(testResults.distanceFilter)}
                  <span className="text-sm">Filtre distance</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  {getStatusIcon(testResults.sortFilter)}
                  <span className="text-sm">Filtre tri</span>
                </div>
              </div>
            </div>
          )}

          {/* État des filtres (JSON) */}
          <div className="space-y-2">
            <h3 className="font-semibold">État des filtres :</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapFiltersTest;
