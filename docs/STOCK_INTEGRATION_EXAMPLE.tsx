/**
 * Exemple d'intégration du système de traçabilité des stocks
 * dans UnifiedProductManager ou tout autre composant de gestion de produits
 *
 * Ce fichier montre comment intégrer StockMovementHistory et StockAdjustmentDialog
 * dans votre interface de gestion de produits existante.
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Package, Edit, Plus, Minus, RefreshCw } from 'lucide-react';

// Import des composants de traçabilité
import StockMovementHistory from '@/components/stock/StockMovementHistory';
import StockAdjustmentDialog from '@/components/stock/StockAdjustmentDialog';

interface ProductWithStock {
  id: string;
  name: string;
  description: string;
  price: number;
  current_stock: number;
  card_id: string;
  track_inventory: boolean;
}

interface ProductStockManagerProps {
  product: ProductWithStock;
  cardId: string;
  onStockUpdate?: () => void;
}

/**
 * Composant exemple : Gestion du stock d'un produit spécifique
 *
 * Ce composant peut être utilisé comme :
 * 1. Un onglet dans la page de détail d'un produit
 * 2. Un dialogue modal
 * 3. Une section dans la page de gestion des produits
 */
const ProductStockManager: React.FC<ProductStockManagerProps> = ({
  product,
  cardId,
  onStockUpdate
}) => {
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0); // Pour forcer le rafraîchissement

  // Fonction appelée après un ajustement réussi
  const handleAdjustmentSuccess = () => {
    // Rafraîchir l'historique
    setHistoryKey(prev => prev + 1);

    // Notifier le parent
    onStockUpdate?.();
  };

  // Déterminer le statut du stock
  const getStockStatus = () => {
    if (product.current_stock <= 0) {
      return { label: 'Rupture', color: 'bg-red-100 text-red-800' };
    } else if (product.current_stock <= 5) {
      return { label: 'Stock faible', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'En stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const stockStatus = getStockStatus();

  // Si le produit ne suit pas l'inventaire, afficher un message
  if (!product.track_inventory) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Gestion de stock désactivée</p>
            <p className="text-sm mt-2">
              Activez la gestion de stock pour utiliser la traçabilité
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec informations de stock */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestion du Stock
              </CardTitle>
              <CardDescription>{product.name}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={stockStatus.color}>
                {stockStatus.label}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-600">Stock actuel</p>
                <p className="text-2xl font-bold">{product.current_stock}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => setAdjustmentDialogOpen(true)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Ajuster le Stock
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique des mouvements */}
      <StockMovementHistory
        key={historyKey}
        productId={product.id}
        cardId={cardId}
        productName={product.name}
      />

      {/* Dialogue d'ajustement */}
      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        productId={product.id}
        cardId={cardId}
        productName={product.name}
        currentStock={product.current_stock}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
};

/**
 * Exemple d'intégration dans UnifiedProductManager avec des onglets
 */
const ProductDetailWithStockTracking: React.FC<{ product: ProductWithStock; cardId: string }> = ({
  product,
  cardId
}) => {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="stock">
          <History className="h-4 w-4 mr-2" />
          Stock & Historique
        </TabsTrigger>
        <TabsTrigger value="sales">Ventes</TabsTrigger>
        <TabsTrigger value="analytics">Statistiques</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        {/* Formulaire de détails du produit */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du produit</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vos champs de formulaire existants */}
            <p>Nom: {product.name}</p>
            <p>Prix: {product.price} €</p>
            <p>Description: {product.description}</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stock">
        {/* Composant de gestion du stock avec traçabilité */}
        <ProductStockManager
          product={product}
          cardId={cardId}
          onStockUpdate={() => {
            console.log('Stock mis à jour !');
            // Rafraîchir les données du produit
          }}
        />
      </TabsContent>

      <TabsContent value="sales">
        {/* Vos composants de ventes existants */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des ventes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Liste des ventes */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics">
        {/* Vos composants d'analytics existants */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Graphiques et stats */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

/**
 * Exemple d'intégration dans une liste de produits
 * Affiche un bouton "Voir l'historique" pour chaque produit
 */
const ProductListItemWithStockButton: React.FC<{
  product: ProductWithStock;
  cardId: string;
}> = ({ product, cardId }) => {
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">Stock: {product.current_stock}</Badge>
                <span className="text-sm text-gray-500">{product.price} €</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryDialogOpen(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Historique
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdjustmentDialogOpen(true)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Ajuster
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogue d'historique (dans un dialog modal) */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique - {product.name}</DialogTitle>
          </DialogHeader>
          <StockMovementHistory
            productId={product.id}
            cardId={cardId}
            productName={product.name}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue d'ajustement */}
      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        productId={product.id}
        cardId={cardId}
        productName={product.name}
        currentStock={product.current_stock}
        onSuccess={() => {
          console.log('Stock ajusté !');
          // Rafraîchir la liste
        }}
      />
    </>
  );
};

/**
 * Exemple d'utilisation dans UnifiedProductManager
 *
 * Dans votre fichier UnifiedProductManager.tsx, ajoutez simplement :
 */

// 1. Importez les composants
import StockMovementHistory from '@/components/stock/StockMovementHistory';
import StockAdjustmentDialog from '@/components/stock/StockAdjustmentDialog';

// 2. Ajoutez des états pour le dialogue
const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<PhysicalProduct | null>(null);

// 3. Dans le rendu de chaque produit, ajoutez un bouton "Historique"
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSelectedProduct(product);
    setStockAdjustmentOpen(true);
  }}
>
  <History className="h-4 w-4 mr-2" />
  Voir l'historique
</Button>

// 4. Ajoutez le composant de dialogue quelque part dans le JSX
{selectedProduct && (
  <>
    <Dialog open={stockHistoryOpen} onOpenChange={setStockHistoryOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique du Stock - {selectedProduct.name}</DialogTitle>
        </DialogHeader>
        <StockMovementHistory
          productId={selectedProduct.id}
          cardId={id!}
          productName={selectedProduct.name}
        />
      </DialogContent>
    </Dialog>

    <StockAdjustmentDialog
      open={stockAdjustmentOpen}
      onOpenChange={setStockAdjustmentOpen}
      productId={selectedProduct.id}
      cardId={id!}
      productName={selectedProduct.name}
      currentStock={selectedProduct.current_stock || 0}
      onSuccess={() => {
        loadPhysicalProducts(); // Rafraîchir la liste
      }}
    />
  </>
)}

export default ProductStockManager;
export { ProductDetailWithStockTracking, ProductListItemWithStockButton };
