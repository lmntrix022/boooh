#!/bin/bash

# Script pour configurer le domaine Resend et permettre l'envoi à tous les emails
# Usage: ./setup-resend-domain.sh

echo "🔧 Configuration du domaine Resend pour l'envoi à tous les emails"

# Récupérer la clé API Resend
RESEND_API_KEY=$(supabase secrets list | grep RESEND_API_KEY | awk '{print $2}')

if [ -z "$RESEND_API_KEY" ]; then
    echo "❌ RESEND_API_KEY non trouvé dans les secrets Supabase"
    exit 1
fi

echo "✅ Clé API Resend trouvée"

# 1. Vérifier les domaines existants
echo "📋 Vérification des domaines existants..."
curl -X GET "https://api.resend.com/domains" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.'

echo ""
echo "🌐 Configuration du domaine pour l'envoi à tous les emails:"
echo ""
echo "OPTION 1: Utiliser un sous-domaine de booh.ga"
echo "  - Ajoutez un enregistrement DNS:"
echo "    Type: CNAME"
echo "    Nom: mail.booh.ga"
echo "    Valeur: resend.dev"
echo ""
echo "OPTION 2: Utiliser un domaine personnalisé"
echo "  - Achetez un domaine (ex: boohmail.com)"
echo "  - Configurez les DNS selon les instructions Resend"
echo ""
echo "OPTION 3: Utiliser un service alternatif (SendGrid, Mailgun)"
echo "  - Plus coûteux mais plus flexible"
echo ""
echo "🚀 Une fois le domaine configuré:"
echo "1. Modifiez la fonction pour utiliser le nouveau domaine"
echo "2. Redéployez: supabase functions deploy send-invoice-email"
echo "3. Testez l'envoi à tous les emails"
echo ""
echo "💡 Solution temporaire:"
echo "Pour l'instant, les emails sont envoyés à ekq022@gmail.com"
echo "avec une notification que c'est pour le client réel."
