#!/bin/bash

# ============================================================================
# Script de Déploiement - Système d'Équipe
# Ce script applique toutes les migrations et déploie l'Edge Function
# ============================================================================

echo "🚀 Déploiement du Système d'Équipe"
echo "=================================="
echo ""

# Couleurs pour affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que Supabase CLI est installé
echo "📦 Vérification Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé${NC}"
    echo "   Installez avec: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI installé${NC}"
echo ""

# 2. Vérifier qu'on est connecté
echo "🔐 Vérification authentification..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Non connecté à Supabase${NC}"
    echo "   Connexion..."
    supabase login
fi
echo -e "${GREEN}✅ Authentifié${NC}"
echo ""

# 3. Lister les projets et demander quel projet utiliser
echo "📋 Projets Supabase disponibles:"
supabase projects list
echo ""
read -p "🌐 Entrez l'ID du projet (tgqrnrqpeaijtrlnbgfj): " PROJECT_REF
PROJECT_REF=${PROJECT_REF:-tgqrnrqpeaijtrlnbgfj}

# 4. Lier le projet
echo ""
echo "🔗 Liaison du projet..."
supabase link --project-ref "$PROJECT_REF" || echo "   Projet déjà lié"
echo -e "${GREEN}✅ Projet lié${NC}"
echo ""

# 5. Déployer l'Edge Function
echo "📤 Déploiement de l'Edge Function..."
echo "   Nom: invite-team-member"
supabase functions deploy invite-team-member
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Edge Function déployée${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement${NC}"
    exit 1
fi
echo ""

# 6. Afficher les instructions pour les migrations SQL
echo "📝 MIGRATIONS SQL À APPLIQUER MANUELLEMENT:"
echo "==========================================="
echo ""
echo -e "${YELLOW}1. Ouvrez: https://supabase.com/dashboard/project/$PROJECT_REF/sql${NC}"
echo ""
echo "2. Exécutez ces migrations DANS L'ORDRE:"
echo ""
echo "   a) 20250126_create_team_system.sql"
echo "   b) 20250126_update_team_permissions.sql"
echo "   c) 20250126_fix_team_rls.sql"
echo "   d) 20250126_insert_default_team_roles.sql"
echo ""
echo "3. Vérifiez que les tables existent:"
echo ""
echo "   SELECT table_name FROM information_schema.tables WHERE table_name IN ('team_members', 'team_permissions');"
echo "   → Doit retourner 2 lignes"
echo ""
echo -e "${YELLOW}4. CONFIGUREZ LES SECRETS:${NC}"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
echo ""
echo "   Ajoutez ces secrets:"
echo "   - SUPABASE_URL = https://$PROJECT_REF.supabase.co"
echo "   - SUPABASE_SERVICE_ROLE_KEY = (trouver dans API keys)"
echo "   - RESEND_API_KEY = re_xxx (optionnel)"
echo "   - FRONTEND_URL = https://booh.ga"
echo ""
echo "5. Redéployez l'Edge Function (pour prendre en compte les secrets):"
echo "   supabase functions deploy invite-team-member"
echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo "🧪 Testez en allant sur /profile puis onglet 'Équipe'"
echo ""







