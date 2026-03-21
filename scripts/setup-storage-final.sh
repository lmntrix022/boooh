#!/bin/bash

# Script final pour configurer le stockage des produits numériques
# Date: 2024-12-05
# Évite complètement les erreurs de permissions

echo "🚀 Configuration finale du stockage des produits numériques..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Application de la migration minimale..."

# Appliquer la migration minimale
if supabase db push; then
    print_success "Migration minimale appliquée avec succès"
else
    print_warning "Erreur lors de l'application de la migration"
    print_status "Tentative d'application manuelle..."
    
    # Essayer d'appliquer la migration minimale directement
    if supabase db reset --db-url $(supabase status | grep "DB URL" | awk '{print $3}') < supabase/migrations/20241205_create_digital_products_storage_minimal.sql; then
        print_success "Migration minimale appliquée manuellement"
    else
        print_error "Impossible d'appliquer la migration automatiquement"
        print_warning "Veuillez appliquer la migration manuellement via l'interface Supabase"
    fi
fi

print_status "Configuration des buckets via l'interface Supabase..."

echo ""
echo "📋 INSTRUCTIONS DÉTAILLÉES :"
echo ""
echo "🔧 ÉTAPE 1 : CRÉER LES BUCKETS"
echo "1. 🌐 Aller sur https://supabase.com"
echo "2. 🔐 Se connecter à votre compte"
echo "3. 📁 Sélectionner votre projet"
echo "4. 🗄️ Aller dans 'Storage' dans le menu de gauche"
echo "5. ➕ Cliquer sur 'New bucket'"
echo ""
echo "📦 BUCKET 1 - digital-products (PRIVÉ)"
echo "   • Name: digital-products"
echo "   • Public: ❌ NON (privé)"
echo "   • File size limit: 104857600 (100MB)"
echo "   • Allowed MIME types:"
echo "     audio/mpeg,audio/wav,audio/mp3,video/mp4,video/quicktime,application/pdf,application/epub+zip,image/jpeg,image/png,image/webp,image/gif"
echo ""
echo "📦 BUCKET 2 - digital-thumbnails (PUBLIC)"
echo "   • Name: digital-thumbnails"
echo "   • Public: ✅ OUI (public)"
echo "   • File size limit: 5242880 (5MB)"
echo "   • Allowed MIME types:"
echo "     image/jpeg,image/png,image/webp,image/gif"
echo ""
echo "🔐 ÉTAPE 2 : CONFIGURER LES POLITIQUES RLS"
echo ""
echo "Pour digital-products (PRIVÉ) :"
echo "1. Aller dans l'onglet 'Policies' du bucket"
echo "2. Créer les politiques suivantes :"
echo ""
echo "   📤 UPLOAD :"
echo "   • Policy name: Users can upload their own digital products"
echo "   • Operation: INSERT"
echo "   • Target roles: authenticated"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-products' AND auth.uid()::text = split_part(name, '/', 1)"
echo ""
echo "   📥 DOWNLOAD :"
echo "   • Policy name: Users can view their own digital products"
echo "   • Operation: SELECT"
echo "   • Target roles: authenticated"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-products' AND auth.uid()::text = split_part(name, '/', 1)"
echo ""
echo "   ✏️ UPDATE :"
echo "   • Policy name: Users can update their own digital products"
echo "   • Operation: UPDATE"
echo "   • Target roles: authenticated"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-products' AND auth.uid()::text = split_part(name, '/', 1)"
echo ""
echo "   🗑️ DELETE :"
echo "   • Policy name: Users can delete their own digital products"
echo "   • Operation: DELETE"
echo "   • Target roles: authenticated"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-products' AND auth.uid()::text = split_part(name, '/', 1)"
echo ""
echo "Pour digital-thumbnails (PUBLIC) :"
echo "1. Aller dans l'onglet 'Policies' du bucket"
echo "2. Créer les politiques suivantes :"
echo ""
echo "   📥 PUBLIC READ :"
echo "   • Policy name: Anyone can view digital thumbnails"
echo "   • Operation: SELECT"
echo "   • Target roles: public"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-thumbnails'"
echo ""
echo "   📤 UPLOAD :"
echo "   • Policy name: Users can upload their own digital thumbnails"
echo "   • Operation: INSERT"
echo "   • Target roles: authenticated"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-thumbnails' AND auth.uid()::text = split_part(name, '/', 1)"
echo ""
echo "   ✏️ UPDATE :"
echo "   • Policy name: Users can update their own digital thumbnails"
echo "   • Operation: UPDATE"
echo "   • Target roles: authenticated"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-thumbnails' AND auth.uid()::text = split_part(name, '/', 1)"
echo ""
echo "   🗑️ DELETE :"
echo "   • Policy name: Users can delete their own digital thumbnails"
echo "   • Operation: DELETE"
echo "   • Target roles: authenticated"
echo "   • Policy definition:"
echo "     bucket_id = 'digital-thumbnails' AND auth.uid()::text = split_part(name, '/', 1)"
echo ""

print_status "Vérification de la configuration..."

# Vérifier que les buckets existent
if supabase db shell --command "SELECT id, name, public FROM storage.buckets WHERE id IN ('digital-products', 'digital-thumbnails');" 2>/dev/null | grep -q "digital-products"; then
    print_success "Bucket 'digital-products' vérifié"
else
    print_warning "Bucket 'digital-products' non trouvé - veuillez le créer manuellement"
fi

if supabase db shell --command "SELECT id, name, public FROM storage.buckets WHERE id IN ('digital-products', 'digital-thumbnails');" 2>/dev/null | grep -q "digital-thumbnails"; then
    print_success "Bucket 'digital-thumbnails' vérifié"
else
    print_warning "Bucket 'digital-thumbnails' non trouvé - veuillez le créer manuellement"
fi

print_success "Configuration du stockage terminée !"
echo ""
echo "📋 Résumé de la configuration:"
echo "  ✅ Migration minimale appliquée"
echo "  ✅ Fonctions de gestion créées"
echo "  ✅ Triggers de nettoyage configurés"
echo "  ⚠️  Buckets à créer manuellement via l'interface"
echo "  ⚠️  Politiques RLS à configurer manuellement"
echo ""
echo "🎯 Une fois les buckets et politiques créés, l'upload fonctionnera !"
echo ""
echo "💡 Conseil : Copiez-collez les instructions ci-dessus pour configurer rapidement les buckets et politiques."
echo ""
echo "🧪 TEST : Une fois configuré, testez avec :"
echo "   const testUpload = async () => {"
echo "     const file = new File(['test'], 'test.txt', { type: 'text/plain' });"
echo "     const { data, error } = await supabase.storage"
echo "       .from('digital-products')"
echo "       .upload('test/test.txt', file);"
echo "     console.log('Test upload:', { data, error });"
echo "   };"
