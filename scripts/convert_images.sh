#!/bin/bash
# Script de conversion optimisé pour Booh - Basé sur l'analyse des formats

echo "🚀 Début de la conversion optimisée des images en WebP..."
echo "📊 Formats détectés: PNG, JPEG, SVG"
echo ""

# Vérifier si cwebp est installé
if ! command -v cwebp &> /dev/null; then
    echo "❌ Erreur: cwebp n'est pas installé."
    echo "📦 Installation sur macOS: brew install webp"
    echo "📦 Installation sur Ubuntu: sudo apt-get install webp"
    exit 1
fi

# Compteurs
total_files=0
converted_files=0
total_saved=0
png_count=0
jpeg_count=0
svg_count=0

# Fonction pour convertir une image avec qualité optimisée
convert_to_webp() {
    local file="$1"
    local dir=$(dirname "$file")
    local filename=$(basename "$file")
    local name="${filename%.*}"
    local ext="${filename##*.}"
    local quality=80
    
    # Déterminer la qualité selon le type d'image
    if [[ "$file" == *"screenshot"* ]] || [[ "$file" == *"app-screen"* ]]; then
        quality=85  # Haute qualité pour les screenshots
    elif [[ "$file" == *"icon"* ]]; then
        quality=75  # Qualité moyenne pour les icônes
    elif [[ "$file" == *"testimonial"* ]]; then
        quality=80  # Qualité standard pour les photos
    else
        quality=80  # Qualité par défaut
    fi
    
    # Vérifier si c'est une image convertible
    if [[ "$ext" =~ ^(jpg|jpeg|png)$ ]]; then
        local webp_file="$dir/$name.webp"
        total_files=$((total_files + 1))
        
        # Compter par type
        if [[ "$ext" =~ ^(png)$ ]]; then
            png_count=$((png_count + 1))
        elif [[ "$ext" =~ ^(jpg|jpeg)$ ]]; then
            jpeg_count=$((jpeg_count + 1))
        fi
        
        # Convertir seulement si le WebP n'existe pas ou est plus ancien
        if [[ ! -f "$webp_file" ]] || [[ "$file" -nt "$webp_file" ]]; then
            local original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            
            echo "📸 Conversion: $file (qualité: ${quality}%)"
            cwebp -q "$quality" "$file" -o "$webp_file"
            
            if [[ -f "$webp_file" ]]; then
                local webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
                local saved=$((original_size - webp_size))
                local saved_percent=$((saved * 100 / original_size))
                
                echo "   💾 Économie: ${saved} bytes (${saved_percent}%)"
                total_saved=$((total_saved + saved))
                converted_files=$((converted_files + 1))
            fi
        else
            echo "✅ Déjà optimisé: $file"
        fi
    elif [[ "$ext" =~ ^(svg)$ ]]; then
        svg_count=$((svg_count + 1))
        echo "ℹ️  SVG ignoré (déjà optimisé): $file"
    fi
}

echo "🔍 Recherche et conversion des images..."

# Parcourir récursivement tous les fichiers
find public -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.svg" \) | while read file; do
    convert_to_webp "$file"
done

echo ""
echo "📊 Statistiques finales:"
echo "   📁 Fichiers traités: $total_files"
echo "   🔄 Fichiers convertis: $converted_files"
echo "   🖼️  PNG trouvés: $png_count"
echo "   📷 JPEG trouvés: $jpeg_count"
echo "   🎨 SVG trouvés: $svg_count"
echo "   💾 Espace économisé: $((total_saved / 1024)) KB"
echo ""
echo "🎯 Optimisations appliquées:"
echo "   • Screenshots: Qualité 85% (haute qualité)"
echo "   • Icônes: Qualité 75% (optimisé)"
echo "   • Photos: Qualité 80% (standard)"
echo "   • SVG: Conservés (déjà optimisés)"
echo ""
echo "✅ Conversion terminée !"
echo "🚀 Vos images WebP sont maintenant prêtes pour des performances optimales !"
echo ""
echo "📋 Prochaines étapes recommandées:"
echo "   1. Tester le nouveau système de conversion côté client"
echo "   2. Vérifier les performances sur différents appareils"
echo "   3. Monitorer les statistiques de compression"
echo ""
echo "🔧 Fonctionnalités ajoutées:"
echo "   • Conversion automatique lors de l'upload"
echo "   • Support AVIF (format le plus moderne)"
echo "   • Compression adaptative par type d'image"
echo "   • Statistiques de compression en temps réel"
echo "   • Fallback intelligent en cas d'erreur" 