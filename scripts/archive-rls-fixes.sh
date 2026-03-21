#!/bin/bash

# Script pour archiver les anciens fichiers de fix RLS
# Date: 2025-01-26

set -e

ARCHIVE_DIR="archive/rls-fixes-$(date +%Y%m%d)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🗂️  Création du dossier d'archive: $ARCHIVE_DIR"
mkdir -p "$ROOT_DIR/$ARCHIVE_DIR"

# Liste des fichiers à archiver (scripts temporaires de fix RLS)
FILES_TO_ARCHIVE=(
    "fix-rls-definitive.sql"
    "fix-rls-without-permissions.sql"
    "fix-rls-policies-corrected.sql"
    "DISABLE_RLS_TEMP.sql"
    "FIX_BUSINESS_CARDS_RLS.sql"
    "FIX_BUSINESS_CARDS_RLS_COMPLETE.sql"
    "FIX_BUSINESS_CARDS_RLS_SECURITY.sql"
    "FIX_RLS_NOW.sql"
    "force-fix-portfolio-settings-rls.sql"
    "fix-portfolio-settings-rls.sql"
    "fix-storage-rls-recursion.sql"
    "apply-rls-policies-directly.sql"
    "VERIFY_RLS.sql"
    "VERIFY_RLS_STATUS.sql"
    "APPLY_TEAM_RLS_NOW.sql"
)

ARCHIVED_COUNT=0
NOT_FOUND_COUNT=0

echo ""
echo "📦 Archivage des fichiers de fix RLS temporaires..."
echo ""

for file in "${FILES_TO_ARCHIVE[@]}"; do
    if [ -f "$ROOT_DIR/$file" ]; then
        echo "  ✅ Archiving: $file"
        mv "$ROOT_DIR/$file" "$ROOT_DIR/$ARCHIVE_DIR/"
        ARCHIVED_COUNT=$((ARCHIVED_COUNT + 1))
    else
        echo "  ⚠️  Not found: $file"
        NOT_FOUND_COUNT=$((NOT_FOUND_COUNT + 1))
    fi
done

# Créer un fichier README dans l'archive
cat > "$ROOT_DIR/$ARCHIVE_DIR/README.md" << EOF
# Archive des Fix RLS Temporaires

**Date d'archive:** $(date +"%Y-%m-%d %H:%M:%S")

## Contexte

Ces fichiers contenaient des scripts SQL temporaires pour corriger des problèmes RLS.
Ils ont été remplacés par des migrations propres et stables dans \`supabase/migrations/20250126_*\`.

## Fichiers Archivés

$(for file in "${FILES_TO_ARCHIVE[@]}"; do echo "- \`$file\`"; done)

## Nouveaux Fichiers de Stabilisation

Les politiques RLS ont été stabilisées dans les migrations suivantes:
- \`20250126_verify_and_stabilize_rls.sql\` - Fonction de vérification
- \`20250126_stabilize_business_cards_rls.sql\` - Stabilisation business_cards
- \`20250126_stabilize_appointments_rls.sql\` - Stabilisation appointments
- \`20250126_stabilize_profiles_rls.sql\` - Stabilisation profiles
- \`20250126_stabilize_subscriptions_rls.sql\` - Stabilisation subscriptions

## Notes

⚠️ **Ne pas utiliser ces fichiers en production**
Ces scripts étaient temporaires et créaient des problèmes de sécurité.
Utiliser les nouvelles migrations à la place.
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Archivage terminé!"
echo ""
echo "   📦 Fichiers archivés: $ARCHIVED_COUNT"
echo "   ⚠️  Fichiers non trouvés: $NOT_FOUND_COUNT"
echo "   📁 Dossier: $ARCHIVE_DIR"
echo ""
echo "   📝 Voir le README.md dans le dossier d'archive pour plus d'infos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""




