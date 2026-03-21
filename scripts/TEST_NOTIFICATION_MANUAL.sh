#!/bin/bash
# Script pour tester manuellement le système de notifications

echo "🔍 Test du système de notifications"
echo ""

# 1. Vérifier que l'Edge Function existe
echo "1. Vérification de l'Edge Function..."
supabase functions list | grep process-notification-queue

echo ""
echo "2. Appel de l'Edge Function pour traiter la queue..."
supabase functions invoke process-notification-queue

echo ""
echo "✅ Test terminé. Vérifiez les logs dans Supabase Dashboard."




