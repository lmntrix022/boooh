#!/bin/bash

# Script pour configurer les webhooks BoohPay pour un merchant Bööh
# Usage: ./configure-webhook.sh <merchant-id> <webhook-url>

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration par défaut
BOOHPAY_API_URL="${BOOHPAY_API_URL:-http://localhost:3000}"
ADMIN_TOKEN="${BOOHPAY_ADMIN_TOKEN:-}"
WEBHOOK_SECRET="${BOOHPAY_WEBHOOK_SECRET:-}"

# Vérifier les arguments
if [ $# -lt 2 ]; then
  echo -e "${RED}❌ Usage: $0 <merchant-id> <webhook-url>${NC}"
  echo ""
  echo "Exemples:"
  echo "  $0 merchant-123 https://your-project.supabase.co/functions/v1/boohpay-webhook"
  echo ""
  echo "Variables d'environnement:"
  echo "  BOOHPAY_API_URL - URL de l'API BoohPay (défaut: http://localhost:3000)"
  echo "  BOOHPAY_ADMIN_TOKEN - Token admin BoohPay (requis)"
  echo "  BOOHPAY_WEBHOOK_SECRET - Secret du webhook (optionnel, généré automatiquement si absent)"
  exit 1
fi

MERCHANT_ID="$1"
WEBHOOK_URL="$2"

# Vérifier que le token admin est configuré
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ BOOHPAY_ADMIN_TOKEN n'est pas configuré${NC}"
  echo ""
  echo "Configurez-le avec:"
  echo "  export BOOHPAY_ADMIN_TOKEN=your-admin-token"
  exit 1
fi

# Générer un secret si non fourni
if [ -z "$WEBHOOK_SECRET" ]; then
  echo -e "${YELLOW}⚠️  Génération d'un nouveau secret webhook...${NC}"
  WEBHOOK_SECRET=$(openssl rand -hex 32)
fi

echo -e "${GREEN}🔧 Configuration du webhook pour le merchant ${MERCHANT_ID}${NC}"
echo ""
echo "URL: ${WEBHOOK_URL}"
echo "Secret: ${WEBHOOK_SECRET:0:16}..."
echo ""

# Configurer le webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${BOOHPAY_API_URL}/v1/admin/merchants/${MERCHANT_ID}/webhook-config" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ADMIN_TOKEN}" \
  -d "{
    \"webhookUrl\": \"${WEBHOOK_URL}\",
    \"webhookSecret\": \"${WEBHOOK_SECRET}\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✅ Webhook configuré avec succès${NC}"
  echo ""
  echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
  echo ""
  echo "1. Ajouter le secret dans Supabase Secrets:"
  echo "   ${GREEN}supabase secrets set BOOHPAY_WEBHOOK_SECRET=${WEBHOOK_SECRET}${NC}"
  echo ""
  echo "2. Vérifier que l'Edge Function est déployée:"
  echo "   ${GREEN}supabase functions deploy boohpay-webhook${NC}"
  echo ""
  echo "3. Tester avec un webhook de test depuis le Dashboard BoohPay"
else
  echo -e "${RED}❌ Erreur lors de la configuration du webhook${NC}"
  echo "Code HTTP: $HTTP_CODE"
  echo "Réponse: $BODY"
  exit 1
fi








