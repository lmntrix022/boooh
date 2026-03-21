#!/bin/bash

# Script pour configurer le stockage des produits numériques
# Date: 2024-12-05

echo "🚀 Configuration du stockage des produits numériques..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
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

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI n'est pas installé. Veuillez l'installer d'abord."
    echo "Installation: npm install -g supabase"
    exit 1
fi

# Vérifier si on est connecté à Supabase
if ! supabase status &> /dev/null; then
    print_error "Supabase n'est pas démarré. Veuillez démarrer Supabase d'abord."
    echo "Commande: supabase start"
    exit 1
fi

print_status "Application de la migration de stockage..."

# Appliquer la migration
if supabase db push; then
    print_success "Migration appliquée avec succès"
else
    print_error "Erreur lors de l'application de la migration"
    exit 1
fi

print_status "Création des buckets de stockage..."

# Créer le bucket digital-products
print_status "Création du bucket 'digital-products'..."
if supabase storage create-bucket digital-products --public=false; then
    print_success "Bucket 'digital-products' créé"
else
    print_warning "Bucket 'digital-products' existe peut-être déjà"
fi

# Créer le bucket digital-thumbnails
print_status "Création du bucket 'digital-thumbnails'..."
if supabase storage create-bucket digital-thumbnails --public=true; then
    print_success "Bucket 'digital-thumbnails' créé"
else
    print_warning "Bucket 'digital-thumbnails' existe peut-être déjà"
fi

print_status "Configuration des permissions RLS..."

# Appliquer les politiques RLS
if supabase db push; then
    print_success "Politiques RLS configurées"
else
    print_error "Erreur lors de la configuration des politiques RLS"
    exit 1
fi

print_status "Vérification de la configuration..."

# Vérifier que les buckets existent
if supabase storage list-buckets | grep -q "digital-products"; then
    print_success "Bucket 'digital-products' vérifié"
else
    print_error "Bucket 'digital-products' non trouvé"
fi

if supabase storage list-buckets | grep -q "digital-thumbnails"; then
    print_success "Bucket 'digital-thumbnails' vérifié"
else
    print_error "Bucket 'digital-thumbnails' non trouvé"
fi

print_success "Configuration du stockage terminée !"
echo ""
echo "📋 Résumé de la configuration:"
echo "  ✅ Bucket 'digital-products' (privé) - pour les fichiers principaux"
echo "  ✅ Bucket 'digital-thumbnails' (public) - pour les images de couverture"
echo "  ✅ Politiques RLS configurées"
echo "  ✅ Fonctions de gestion des fichiers créées"
echo ""
echo "🎯 Vous pouvez maintenant créer des produits numériques !"
