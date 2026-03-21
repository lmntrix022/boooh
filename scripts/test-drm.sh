#!/bin/bash

# 🔐 Script de Test DRM - Vérification Automatique
# Usage: ./test-drm.sh

set -e

echo "🔐 =========================================="
echo "   TEST DRM - Vérification Automatique"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test
test_check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ $2${NC}"
    ((TESTS_FAILED++))
  fi
}

echo "📋 Phase 1 : Vérification des fichiers"
echo "----------------------------------------"

# Test 1 : Service SecureDownloadServiceV2
if [ -f "src/services/secureDownloadServiceV2.ts" ]; then
  test_check 0 "Service SecureDownloadServiceV2 existe"
else
  test_check 1 "Service SecureDownloadServiceV2 manquant"
fi

# Test 2 : Edge function generate-secure-token
if [ -f "supabase/functions/generate-secure-token/index.ts" ]; then
  test_check 0 "Edge function generate-secure-token existe"
else
  test_check 1 "Edge function generate-secure-token manquante"
fi

# Test 3 : Migration SQL Phase 1
if [ -f "supabase/migrations/20250124_security_drm_phase1_critical.sql" ]; then
  test_check 0 "Migration SQL Phase 1 existe"
else
  test_check 1 "Migration SQL Phase 1 manquante"
fi

# Test 4 : Checkout.tsx modifié
if grep -q "TESTER DRM SÉCURISÉ" "src/pages/Checkout.tsx"; then
  test_check 0 "Bouton DRM présent dans Checkout.tsx"
else
  test_check 1 "Bouton DRM absent de Checkout.tsx"
fi

# Test 5 : Utilise digital_product_id (pas product_id)
if grep -q "digital_product_id: item.productId" "src/pages/Checkout.tsx"; then
  test_check 0 "Utilise digital_product_id (correct)"
else
  if grep -q "product_id: item.productId" "src/pages/Checkout.tsx"; then
    test_check 1 "Utilise product_id (INCORRECT - colonne inexistante)"
  else
    test_check 1 "Ni product_id ni digital_product_id trouvé"
  fi
fi

# Test 6 : N'utilise pas external_reference
if grep -q "external_reference:" "src/pages/Checkout.tsx"; then
  test_check 1 "Utilise external_reference (INCORRECT - colonne inexistante)"
else
  test_check 0 "N'utilise pas external_reference (correct)"
fi

echo ""
echo "📋 Phase 2 : Vérification du code"
echo "----------------------------------------"

# Test 7 : Import SecureDownloadServiceV2
if grep -q "import.*SecureDownloadServiceV2" "src/pages/Checkout.tsx"; then
  test_check 0 "Import SecureDownloadServiceV2 présent"
else
  test_check 1 "Import SecureDownloadServiceV2 manquant"
fi

# Test 8 : Fonction handleDRMTestPayment
if grep -q "handleDRMTestPayment" "src/pages/Checkout.tsx"; then
  test_check 0 "Fonction handleDRMTestPayment existe"
else
  test_check 1 "Fonction handleDRMTestPayment manquante"
fi

# Test 9 : Fonction createInquiriesWithDRM
if grep -q "createInquiriesWithDRM" "src/pages/Checkout.tsx"; then
  test_check 0 "Fonction createInquiriesWithDRM existe"
else
  test_check 1 "Fonction createInquiriesWithDRM manquante"
fi

# Test 10 : Appel à generateSecureToken
if grep -q "SecureDownloadServiceV2.generateSecureToken" "src/pages/Checkout.tsx"; then
  test_check 0 "Appel à generateSecureToken présent"
else
  test_check 1 "Appel à generateSecureToken manquant"
fi

echo ""
echo "📋 Phase 3 : Vérification Edge Functions"
echo "----------------------------------------"

# Test 11 : Edge function rate-limiter
if [ -f "supabase/functions/rate-limiter/index.ts" ]; then
  test_check 0 "Edge function rate-limiter existe"
else
  test_check 1 "Edge function rate-limiter manquante"
fi

# Test 12 : Edge function encrypt-file-secure
if [ -f "supabase/functions/encrypt-file-secure/index.ts" ]; then
  test_check 0 "Edge function encrypt-file-secure existe"
else
  test_check 1 "Edge function encrypt-file-secure manquante"
fi

# Test 13 : Edge function forensic-watermark
if [ -f "supabase/functions/forensic-watermark/index.ts" ]; then
  test_check 0 "Edge function forensic-watermark existe"
else
  test_check 1 "Edge function forensic-watermark manquante"
fi

# Test 14 : Edge function antivirus-scan
if [ -f "supabase/functions/antivirus-scan/index.ts" ]; then
  test_check 0 "Edge function antivirus-scan existe"
else
  test_check 1 "Edge function antivirus-scan manquante"
fi

echo ""
echo "📋 Phase 4 : Vérification Documentation"
echo "----------------------------------------"

# Test 15 : Guide de test
if [ -f "COMMENT_TESTER_DRM.md" ]; then
  test_check 0 "Guide de test DRM existe"
else
  test_check 1 "Guide de test DRM manquant"
fi

# Test 16 : Guide d'implémentation
if [ -f "DRM_SECURITY_IMPLEMENTATION_GUIDE.md" ]; then
  test_check 0 "Guide d'implémentation existe"
else
  test_check 1 "Guide d'implémentation manquant"
fi

# Test 17 : Exemples d'usage
if [ -f "EXAMPLE_USAGE.md" ]; then
  test_check 0 "Exemples d'usage existent"
else
  test_check 1 "Exemples d'usage manquants"
fi

echo ""
echo "=========================================="
echo "📊 RÉSULTATS"
echo "=========================================="
echo -e "${GREEN}Tests réussis : $TESTS_PASSED${NC}"
echo -e "${RED}Tests échoués  : $TESTS_FAILED${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ TOUS LES TESTS PASSENT ! (100%)${NC}"
  echo ""
  echo "🎉 Système DRM prêt à être testé !"
  echo ""
  echo "Prochaines étapes :"
  echo "1. Déployer l'edge function : supabase functions deploy generate-secure-token"
  echo "2. Appliquer les migrations  : supabase db push"
  echo "3. Démarrer l'app           : npm run dev"
  echo "4. Tester le bouton vert    : Voir COMMENT_TESTER_DRM.md"
  exit 0
else
  echo -e "${RED}❌ CERTAINS TESTS ONT ÉCHOUÉ ($PERCENTAGE%)${NC}"
  echo ""
  echo "⚠️  Corrigez les erreurs avant de continuer."
  echo ""
  echo "Aide :"
  echo "- Fichiers manquants : Vérifiez que tous les fichiers DRM ont été créés"
  echo "- Code incorrect     : Vérifiez FIX_DRM_TEST_ERRORS.md"
  echo "- Documentation      : Relancez la création des guides"
  exit 1
fi
