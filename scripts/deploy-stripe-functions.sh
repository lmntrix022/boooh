#!/bin/bash

# Script de déploiement des Edge Functions Stripe
# Usage: ./scripts/deploy-stripe-functions.sh

set -e

echo "🚀 Déploiement des Edge Functions Stripe..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé.${NC}"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Déployer stripe-create-checkout
echo -e "${YELLOW}📦 Déploiement de stripe-create-checkout...${NC}"
supabase functions deploy stripe-create-checkout

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ stripe-create-checkout déployée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement de stripe-create-checkout${NC}"
    exit 1
fi

# Déployer stripe-check-status
echo -e "${YELLOW}📦 Déploiement de stripe-check-status...${NC}"
supabase functions deploy stripe-check-status

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ stripe-check-status déployée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement de stripe-check-status${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Toutes les Edge Functions Stripe ont été déployées avec succès !${NC}"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de configurer STRIPE_SECRET_KEY dans les secrets Supabase:${NC}"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_test_..."
echo ""
echo "   Pour la production:"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_live_..."



