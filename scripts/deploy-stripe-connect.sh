#!/bin/bash

# Script pour déployer toutes les Edge Functions Stripe Connect
# Usage: ./scripts/deploy-stripe-connect.sh

set -e

echo "🚀 Déploiement des Edge Functions Stripe Connect..."

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Déployer les 3 Edge Functions
echo ""
echo "📦 Déploiement de stripe-connect-create-account..."
supabase functions deploy stripe-connect-create-account

echo ""
echo "📦 Déploiement de stripe-connect-create-payment..."
supabase functions deploy stripe-connect-create-payment

echo ""
echo "📦 Déploiement de stripe-connect-webhook..."
supabase functions deploy stripe-connect-webhook

echo ""
echo "✅ Toutes les Edge Functions Stripe Connect ont été déployées !"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurez les variables d'environnement dans Supabase Dashboard"
echo "2. Configurez le webhook dans Stripe Dashboard"
echo "3. Appliquez la migration SQL"
echo "4. Testez l'onboarding dans Settings → Entreprise"



