# Guide : Amélioration de la Page QuotesList

## Objectif
Reproduire la structure et les fonctionnalités de la page `/facture` dans `/portfolio/quotes`

## Fonctionnalités à Ajouter

### 1. Mode d'Affichage Multiple
- ✅ **Liste** (existant)
- 🆕 **Kanban** (tableau par statut)
- 🆕 **Graphiques/Stats** (visualisation)

### 2. Sélecteur de Vue
```tsx
<div className="flex gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-xl">
  <Button onClick={() => setDisplayMode('list')} variant={displayMode === 'list' ? 'default' : 'ghost'}>
    <LayoutList className="w-4 h-4" />
  </Button>
  <Button onClick={() => setDisplayMode('kanban')}>
    <LayoutGrid className="w-4 h-4" />
  </Button>
  <Button onClick={() => setDisplayMode('chart')}>
    <BarChart3 className="w-4 h-4" />
  </Button>
</div>
```

### 3. Bouton d'Export
```tsx
<Button onClick={() => setExportDialogOpen(true)} variant="outline">
  <FileDown className="w-4 h-4" />
  Exporter
</Button>
```

## Implémentation

### Étape 1 : Ajouter les États

```typescript
// Dans QuotesList.tsx
const [displayMode, setDisplayMode] = useState<'list' | 'kanban' | 'chart'>('list');
const [exportDialogOpen, setExportDialogOpen] = useState(false);
```

### Étape 2 : Créer le Composant Kanban

Créer `/src/components/quotes/QuotesKanbanView.tsx` :

```typescript
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ServiceQuote, QuoteStatus } from '@/services/portfolioService';

interface QuotesKanbanViewProps {
  quotes: ServiceQuote[];
  onStatusChange: (quoteId: string, newStatus: QuoteStatus) => void;
  onQuoteClick: (quote: ServiceQuote) => void;
}

export const QuotesKanbanView: React.FC<QuotesKanbanViewProps> = ({
  quotes,
  onStatusChange,
  onQuoteClick
}) => {
  const columns: { status: QuoteStatus; label: string; color: string }[] = [
    { status: 'new', label: 'Nouveaux', color: 'blue' },
    { status: 'contacted', label: 'Contactés', color: 'yellow' },
    { status: 'quoted', label: 'Devis Envoyés', color: 'purple' },
    { status: 'accepted', label: 'Acceptés', color: 'green' },
    { status: 'rejected', label: 'Refusés', color: 'red' },
  ];

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const quoteId = result.draggableId;
    const newStatus = result.destination.droppableId as QuoteStatus;

    onStatusChange(quoteId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((column) => (
          <div key={column.status} className="bg-gray-50 rounded-lg p-4">
            <h3 className={`font-bold text-${column.color}-600 mb-4`}>
              {column.label}
              <span className="ml-2 text-sm">
                ({quotes.filter(q => q.status === column.status).length})
              </span>
            </h3>

            <Droppable droppableId={column.status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 min-h-[200px]"
                >
                  {quotes
                    .filter(q => q.status === column.status)
                    .map((quote, index) => (
                      <Draggable
                        key={quote.id}
                        draggableId={quote.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onQuoteClick(quote)}
                            className="bg-white p-3 rounded-lg shadow cursor-pointer hover:shadow-md"
                          >
                            <p className="font-semibold text-sm">{quote.client_name}</p>
                            <p className="text-xs text-gray-500 truncate">{quote.service_requested}</p>
                            {quote.quote_amount && (
                              <p className="text-sm font-bold text-green-600 mt-2">
                                {quote.quote_amount.toLocaleString('fr-FR')} FCFA
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
```

### Étape 3 : Créer le Composant Chart/Stats

Créer `/src/components/quotes/QuotesChartView.tsx` :

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ServiceQuote } from '@/services/portfolioService';

interface QuotesChartViewProps {
  quotes: ServiceQuote[];
  stats: {
    total_quotes: number;
    pending_quotes: number;
    converted_quotes: number;
    quote_conversion_rate: number;
  };
}

export const QuotesChartView: React.FC<QuotesChartViewProps> = ({ quotes, stats }) => {
  // Données pour le graphique par statut
  const statusData = [
    { name: 'Nouveaux', value: quotes.filter(q => q.status === 'new').length, color: '#3b82f6' },
    { name: 'Contactés', value: quotes.filter(q => q.status === 'contacted').length, color: '#eab308' },
    { name: 'Devisés', value: quotes.filter(q => q.status === 'quoted').length, color: '#a855f7' },
    { name: 'Acceptés', value: quotes.filter(q => q.status === 'accepted').length, color: '#22c55e' },
    { name: 'Refusés', value: quotes.filter(q => q.status === 'rejected').length, color: '#ef4444' },
  ];

  // Données pour le graphique de montants
  const monthlyData = getMonthlyQuoteData(quotes);

  return (
    <div className="space-y-6">
      {/* Statistiques Clés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Devis" value={stats.total_quotes} />
        <StatCard label="En Attente" value={stats.pending_quotes} />
        <StatCard label="Convertis" value={stats.converted_quotes} />
        <StatCard label="Taux Conversion" value={`${stats.quote_conversion_rate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique par Statut */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Répartition par Statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique Mensuel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Évolution Mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Nombre de devis" />
              <Bar dataKey="amount" fill="#22c55e" name="Montant (K FCFA)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

function getMonthlyQuoteData(quotes: ServiceQuote[]) {
  // Grouper par mois
  const monthlyMap = new Map();
  quotes.forEach(quote => {
    const month = new Date(quote.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { month, count: 0, amount: 0 });
    }
    const data = monthlyMap.get(month);
    data.count++;
    data.amount += (quote.quote_amount || 0) / 1000; // En milliers
  });
  return Array.from(monthlyMap.values()).slice(-6); // 6 derniers mois
}
```

### Étape 4 : Créer le Dialog d'Export

Créer `/src/components/quotes/ExportQuotesDialog.tsx` :

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ServiceQuote } from '@/services/portfolioService';

interface ExportQuotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: ServiceQuote[];
}

export const ExportQuotesDialog: React.FC<ExportQuotesDialogProps> = ({
  isOpen,
  onClose,
  quotes
}) => {
  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Email', 'Service', 'Montant', 'Statut'];
    const rows = quotes.map(q => [
      new Date(q.created_at).toLocaleDateString('fr-FR'),
      q.client_name,
      q.client_email,
      q.service_requested,
      q.quote_amount || '',
      q.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(quotes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter les Devis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button onClick={exportToCSV} className="w-full">
            Exporter en CSV
          </Button>
          <Button onClick={exportToJSON} variant="outline" className="w-full">
            Exporter en JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### Étape 5 : Modifier QuotesList.tsx

Ajouter dans le fichier :

```typescript
// Imports
import { LayoutList, LayoutGrid, BarChart3, FileDown } from 'lucide-react';
import { QuotesKanbanView } from '@/components/quotes/QuotesKanbanView';
import { QuotesChartView } from '@/components/quotes/QuotesChartView';
import { ExportQuotesDialog } from '@/components/quotes/ExportQuotesDialog';
import { AnimatePresence } from 'framer-motion';

// Dans le composant
const [displayMode, setDisplayMode] = useState<'list' | 'kanban' | 'chart'>('list');
const [exportDialogOpen, setExportDialogOpen] = useState(false);

// Handler pour le changement de statut (Kanban)
const handleQuoteStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
  try {
    await PortfolioService.updateQuote(quoteId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['user-service-quotes'] });
    toast({ title: 'Statut mis à jour' });
  } catch (error) {
    toast({ title: 'Erreur', variant: 'destructive' });
  }
};

// Dans le JSX, remplacer la section toolbar/liste par :
<>
  {/* Sélecteur de vue et actions */}
  <div className="flex justify-between items-center mb-6">
    {/* Sélecteur de vue */}
    <div className="flex gap-2 bg-white/80 p-1 rounded-xl">
      <Button onClick={() => setDisplayMode('list')} variant={displayMode === 'list' ? 'default' : 'ghost'}>
        <LayoutList className="w-4 h-4" />
      </Button>
      <Button onClick={() => setDisplayMode('kanban')} variant={displayMode === 'kanban' ? 'default' : 'ghost'}>
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button onClick={() => setDisplayMode('chart')} variant={displayMode === 'chart' ? 'default' : 'ghost'}>
        <BarChart3 className="w-4 h-4" />
      </Button>
    </div>

    {/* Bouton Export */}
    <Button onClick={() => setExportDialogOpen(true)} variant="outline">
      <FileDown className="w-4 h-4 mr-2" />
      Exporter
    </Button>
  </div>

  {/* Affichage conditionnel selon le mode */}
  <AnimatePresence mode="wait">
    {displayMode === 'list' && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {/* Votre liste actuelle */}
      </motion.div>
    )}

    {displayMode === 'kanban' && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <QuotesKanbanView
          quotes={filteredQuotes}
          onStatusChange={handleQuoteStatusChange}
          onQuoteClick={handleRespond}
        />
      </motion.div>
    )}

    {displayMode === 'chart' && stats && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <QuotesChartView quotes={filteredQuotes} stats={stats} />
      </motion.div>
    )}
  </AnimatePresence>

  {/* Dialog d'export */}
  <ExportQuotesDialog
    isOpen={exportDialogOpen}
    onClose={() => setExportDialogOpen(false)}
    quotes={filteredQuotes}
  />
</>
```

## Packages Nécessaires

```bash
npm install @hello-pangea/dnd recharts
```

## Checklist d'Implémentation

- [ ] Ajouter les états `displayMode` et `exportDialogOpen`
- [ ] Créer `QuotesKanbanView.tsx`
- [ ] Créer `QuotesChartView.tsx`
- [ ] Créer `ExportQuotesDialog.tsx`
- [ ] Installer les dépendances
- [ ] Intégrer le sélecteur de vue
- [ ] Ajouter le bouton d'export
- [ ] Tester les 3 modes d'affichage
- [ ] Tester l'export CSV/JSON

---

Cette structure reproduit exactement la page `/facture` avec toutes ses fonctionnalités ! 🎉
