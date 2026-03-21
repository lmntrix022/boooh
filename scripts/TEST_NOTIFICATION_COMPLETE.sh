#!/bin/bash
# Script complet pour tester le système de notifications

echo "🔍 Diagnostic du système de notifications"
echo ""

# 1. Vérifier que la fonction est déployée
echo "1. Vérification de l'Edge Function..."
supabase functions list | grep process-notification-queue

echo ""
echo "2. Test de l'Edge Function..."
echo "   Cela va traiter les notifications en attente dans la queue"
echo ""

# Appeler la fonction (sans body car elle lit directement depuis la queue)
supabase functions invoke process-notification-queue

echo ""
echo "✅ Si vous voyez 'processed: 0', il n'y a pas de notifications en attente"
echo "✅ Si vous voyez 'processed: X', les notifications ont été traitées"
echo ""
echo "📧 Vérifiez maintenant votre boîte email et les logs dans Supabase Dashboard"




