#!/bin/bash
# Test rapide pour voir les logs de création de facture

source .env 2>/dev/null || source .env.local 2>/dev/null

SUPABASE_URL="${VITE_SUPABASE_URL}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY}"
FUNCTIONS_URL="${SUPABASE_URL}/functions/v1"

echo "Test création facture uniquement..."
echo ""

curl -X POST \
  "${FUNCTIONS_URL}/billing-easy-create-invoice" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "payer_name": "Quantin EKOUAGHE",
    "payer_email": "test@example.com",
    "payer_msisdn": "074398524",
    "short_description": "Test de paiement",
    "external_reference": "TEST-'$(date +%s)'"
  }' | jq '.'

echo ""
echo "Consultez les logs avec:"
echo "supabase functions logs billing-easy-create-invoice | grep -A 20 'Debug'"


