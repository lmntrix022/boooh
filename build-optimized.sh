#!/bin/bash

echo "🚀 Début du build optimisé pour Booh..."

# Vérifier les dépendances
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Nettoyer les builds précédents
echo "🧹 Nettoyage des builds précédents..."
rm -rf dist
rm -rf .vite

# Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances..."
npm ci --silent

# Optimiser les images
echo "🖼️ Optimisation des images..."
if [ -f "convert_images.sh" ]; then
    chmod +x convert_images.sh
    ./convert_images.sh
fi

# Build de production avec optimisations
echo "🔨 Build de production avec optimisations..."
npm run build

# Vérifier la taille du build
echo "📊 Analyse de la taille du build..."
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "Taille du build: $BUILD_SIZE"

# Optimisations supplémentaires
echo "⚡ Optimisations supplémentaires..."

# Compression des assets
if command -v gzip &> /dev/null; then
    echo "🗜️ Compression gzip des assets..."
    find dist -name "*.js" -o -name "*.css" -o -name "*.html" | xargs gzip -9 -k
fi

# Vérification des performances
echo "📈 Vérification des performances..."

# Compter les chunks
JS_CHUNKS=$(find dist -name "*.js" | wc -l)
CSS_CHUNKS=$(find dist -name "*.css" | wc -l)
echo "Nombre de chunks JS: $JS_CHUNKS"
echo "Nombre de chunks CSS: $CSS_CHUNKS"

# Vérifier la taille des chunks
echo "📏 Taille des chunks principaux:"
find dist -name "*.js" -exec ls -lh {} \; | head -5

# Vérifier les images optimisées
echo "🖼️ Images optimisées:"
find dist -name "*.webp" | wc -l | xargs echo "Nombre d'images WebP:"

# Générer un rapport de performance
echo "📋 Génération du rapport de performance..."
cat > dist/performance-report.txt << EOF
Rapport de Performance - Booh
============================

Date: $(date)
Build Size: $BUILD_SIZE
JS Chunks: $JS_CHUNKS
CSS Chunks: $CSS_CHUNKS

Optimisations appliquées:
- Lazy loading des composants React
- Code splitting optimisé
- Compression gzip/brotli
- Images WebP optimisées
- Cache intelligent PWA
- Préchargement des ressources critiques
- Monitoring de performance en temps réel

Métriques recommandées:
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- First Input Delay: < 100ms
- Cumulative Layout Shift: < 0.1

EOF

echo "✅ Build optimisé terminé!"
echo "📁 Build disponible dans: dist/"
echo "📋 Rapport de performance: dist/performance-report.txt"

# Démarrer le serveur de preview si demandé
if [ "$1" = "--preview" ]; then
    echo "🌐 Démarrage du serveur de preview..."
    npm run preview
fi 