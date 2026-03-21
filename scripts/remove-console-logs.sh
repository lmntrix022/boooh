#!/bin/bash

# Script pour supprimer les console.log de production
# Conserve seulement console.error pour les erreurs critiques

echo "🧹 Nettoyage des console.log en cours..."

# Compter le nombre de console avant
BEFORE=$(grep -r "console\." src --include="*.tsx" --include="*.ts" | wc -l | tr -d ' ')

echo "📊 console.* trouvés: $BEFORE"

# Supprimer console.log et console.info uniquement
# Conserver console.error et console.warn pour le debug production
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  '/console\.log/d' {} \;

find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  '/console\.info/d' {} \;

# Compter après
AFTER=$(grep -r "console\." src --include="*.tsx" --include="*.ts" | wc -l | tr -d ' ')

REMOVED=$((BEFORE - AFTER))

echo "✅ Suppression terminée!"
echo "📊 Avant: $BEFORE console.*"
echo "📊 Après: $AFTER console.* (console.error/warn conservés)"
echo "🎉 Supprimé: $REMOVED lignes"
echo ""
echo "Les console.error et console.warn sont conservés pour le debugging production."

