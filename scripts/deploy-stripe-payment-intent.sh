#!/bin/bash

# Script de déploiement de l'Edge Function stripe-create-payment-intent
# Usage: ./scripts/deploy-stripe-payment-intent.sh

set -e

echo "🚀 Déploiement de l'Edge Function stripe-create-payment-intent..."

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

# Déployer stripe-create-payment-intent
echo -e "${YELLOW}📦 Déploiement de stripe-create-payment-intent...${NC}"
supabase functions deploy stripe-create-payment-intent

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ stripe-create-payment-intent déployée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 L'Edge Function a été déployée avec succès !${NC}"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de configurer les variables d'environnement:${NC}"
echo ""
echo "   Frontend (.env.local):"
echo "   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..."
echo ""
echo "   Backend (Supabase Secrets - déjà fait si stripe-create-checkout fonctionne):"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_test_..."



