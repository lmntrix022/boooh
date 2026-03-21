import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Grid3x3, Grid2x2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { optimizedQueries } from '@/lib/optimizedQueries';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import MarketplaceGrid from '@/components/marketplace/MarketplaceGrid';
import CartButton from '@/components/cart/CartButton';
import CartDrawer from '@/components/cart/CartDrawer';
import { useLanguage } from '@/hooks/useLanguage';

const Marketplace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [gridColumns, setGridColumns] = useState<2 | 3>(3);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Charger les données de la carte
  const { data: card, isLoading: loadingCard } = useQuery({
    queryKey: ['marketplace-card', id],
    queryFn: async () => {
      if (!id) throw new Error(t('marketplace.errors.missingId')); // t est stable, pas besoin de dépendance
      return await optimizedQueries.getCardWithRelations(id, true);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Combiner produits physiques et digitaux
  const allProducts = useMemo(() => {
    const physical = (card?.products || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image_url,
      images: (p as any).images as Array<{ url: string; alt: string; order: number }> | undefined,
      description: p.description,
      type: 'physical' as const,
    }));

    const digital = (card?.digital_products || []).map((dp: any) => ({
      id: dp.id,
      name: dp.title,
      price: dp.is_free ? 0 : dp.price,
      image: dp.thumbnail_url,
      description: dp.description,
      type: 'digital' as const,
      fileUrl: dp.file_url,
      previewUrl: dp.preview_url,
    }));

    return [...physical, ...digital];
  }, [card]);

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.type === selectedCategory);
    }

    return filtered;
  }, [allProducts, searchQuery, selectedCategory]);

  // Catégories disponibles
  const categories = useMemo(() => {
    const physicalCount = allProducts.filter(p => p.type === 'physical').length;
    const digitalCount = allProducts.filter(p => p.type === 'digital').length;

    return [
      { id: 'all', label: t('marketplace.categories.all'), count: allProducts.length },
      { id: 'physical', label: t('marketplace.categories.physical'), count: physicalCount },
      { id: 'digital', label: t('marketplace.categories.digital'), count: digitalCount },
    ];
  }, [allProducts, t]);

  // Mapping des polices (même que BusinessCardModern)
  const FONT_GOOGLE_MAP: Record<string, string> = {
    'font-inter': 'Inter',
    'font-poppins': 'Poppins',
    'font-manrope': 'Manrope',
    'font-montserrat': 'Montserrat',
    'font-dm-sans': 'DM Sans',
    'font-nunito': 'Nunito',
    'font-nunito-sans': 'Nunito Sans',
    'font-outfit': 'Outfit',
    'font-plus-jakarta': 'Plus Jakarta Sans',
    'font-rubik': 'Rubik',
    'font-urbanist': 'Urbanist',
    'font-raleway': 'Raleway',
    'font-lato': 'Lato',
    'font-open-sans': 'Open Sans',
    'font-roboto': 'Roboto',
    'font-roboto-condensed': 'Roboto Condensed',
    'font-worksans': 'Work Sans',
    'font-quicksand': 'Quicksand',
    'font-josefin': 'Josefin Sans',
    'font-lexend': 'Lexend',
    'font-mulish': 'Mulish',
  };

  // Récupérer la police exactement comme dans BusinessCardModern (ligne 176)
  const dbFontFamily = (card as any)?.font_family || (card?.custom_fields as any)?.font_family;
  const fontFamily = dbFontFamily && FONT_GOOGLE_MAP[dbFontFamily]
    ? FONT_GOOGLE_MAP[dbFontFamily]
    : 'Poppins';

  const accentColor = (card as any)?.accent_color || '#000000';

  // Charger la police Google Fonts dynamiquement
  useEffect(() => {
    if (fontFamily) {
      // Check if font link already exists
      const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/ /g, '+')}"]`);
      if (existingLink) return;

      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      return () => {
        // Only remove if it still exists
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [fontFamily]);

  if (loadingCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-700 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">{t('marketplace.loading')}</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('marketplace.notFound.title')}</h1>
          <Button onClick={() => navigate(-1)} className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-11 px-6">
            {t('marketplace.notFound.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily }}>
      <div>
        {/* Header avec branding */}
        <MarketplaceHeader
          card={card}
          accentColor={accentColor}
          onBack={() => navigate(`/card/${id}`)}
          totalProducts={allProducts.length}
          fontFamily={fontFamily}
        />

        {/* Barre de recherche et filtres - Apple Design */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-sm transition-all duration-500">
            {/* Barre de recherche Apple-style */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors duration-300" strokeWidth={2} />
                <Input
                  type="text"
                  placeholder={t('marketplace.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-gray-200/50 bg-gray-50/50 focus:bg-white text-base font-medium placeholder:text-gray-400 focus:border-black transition-all duration-300"
                />
              </div>

              {/* Boutons de vue Apple-style */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                    gridColumns === 2
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  onClick={() => setGridColumns(2)}
                >
                  <Grid2x2 className="w-5 h-5" strokeWidth={2} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-300 ${
                    gridColumns === 3
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                  onClick={() => setGridColumns(3)}
                >
                  <Grid3x3 className="w-5 h-5" strokeWidth={2} />
                </Button>
              </div>
            </div>

            {/* Filtres Apple-style */}
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant="ghost"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-6 py-3 h-auto text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" strokeWidth={2} />
                  {cat.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory === cat.id ? 'bg-white/20' : 'bg-white/50'
                  }`}>
                    {cat.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Résultats */}
          <div className="mt-6">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center hover:shadow-md transition-shadow duration-300">
                <p className="text-gray-900 text-base font-medium mb-2 tracking-wide">{t('marketplace.noProducts')}</p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-11 px-8 font-medium tracking-wide transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    {t('marketplace.resetSearch')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <p className="text-gray-900 text-sm font-medium mb-5 tracking-wide">
                  {filteredProducts.length === 1 
                    ? t('marketplace.productsFound', { count: filteredProducts.length })
                    : t('marketplace.productsFoundPlural', { count: filteredProducts.length })}
                </p>
                <MarketplaceGrid
                  products={filteredProducts}
                  columns={gridColumns}
                  accentColor={accentColor}
                  cardId={id!}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bouton flottant du panier */}
      <CartButton onClick={() => setCartDrawerOpen(true)} />

      {/* Drawer du panier */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  );
};

export default Marketplace;
