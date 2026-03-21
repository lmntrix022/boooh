#!/bin/bash

# Script pour redéployer l'Edge Function send-order-email
# Date: 2025-01-26

echo "🚀 Redéploiement de l'Edge Function send-order-email..."

# Vérifier que supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "   Installer avec: npm install -g supabase"
    exit 1
fi

# Redéployer uniquement cette fonction
supabase functions deploy send-order-email

echo "✅ Edge Function redéployée avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Tester l'envoi d'email de commande"
echo "   2. Vérifier les logs dans Supabase Dashboard > Logs > Edge Functions"
echo ""




