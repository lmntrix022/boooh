#!/bin/bash

# 🚀 Script de vérification pré-déploiement
# Vérifie que toutes les conditions sont remplies avant de déployer en production

set -e

echo "🔍 Vérification pré-déploiement - Booh"
echo "======================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Fonction de check
check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2"
    ERRORS=$((ERRORS + 1))
  fi
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

echo "1️⃣  Vérification des fichiers critiques"
echo "----------------------------------------"

# .env ne doit PAS être dans Git
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo -e "${RED}✗${NC} .env est encore dans Git (DANGER!)"
  ERRORS=$((ERRORS + 1))
else
  check 0 ".env n'est pas dans Git"
fi

# .env.example doit exister
[ -f ".env.example" ]; check $? ".env.example existe"

# .gitignore doit contenir .env
grep -q "^\.env$" .gitignore; check $? ".gitignore contient .env"

# index.html doit contenir le script
grep -q '<script type="module" src="/src/main.tsx"></script>' index.html
check $? "index.html contient le script d'entrée"

echo ""
echo "2️⃣  Vérification de la configuration"
echo "--------------------------------------"

# vite.config.ts doit utiliser manualChunks en fonction
grep -q "manualChunks(id)" vite.config.ts
check $? "vite.config.ts utilise manualChunks dynamique"

# vercel.json doit contenir CSP
grep -q "Content-Security-Policy" vercel.json
check $? "vercel.json contient les headers CSP"

# tsconfig doit inclure vite-plugin-csp
grep -q "vite-plugin-csp" tsconfig.node.json
check $? "tsconfig.node.json inclut vite-plugin-csp"

echo ""
echo "3️⃣  Vérification des dépendances"
echo "----------------------------------"

# node_modules doit exister
[ -d "node_modules" ]; check $? "node_modules existe"

# Vérifier packages critiques
npm list @sentry/react >/dev/null 2>&1; check $? "@sentry/react installé"
npm list vite >/dev/null 2>&1; check $? "vite installé"
npm list react >/dev/null 2>&1; check $? "react installé"

echo ""
echo "4️⃣  Vérification du build"
echo "--------------------------"

# Tester si le build fonctionne
echo "   Building..."
if npm run build >/dev/null 2>&1; then
  check 0 "Build réussit"

  # Vérifier que dist existe
  [ -d "dist" ]; check $? "Dossier dist créé"

  # Vérifier fichiers critiques
  [ -f "dist/index.html" ]; check $? "dist/index.html existe"
  [ -d "dist/js" ]; check $? "dist/js/ existe"
  [ -d "dist/css" ]; check $? "dist/css/ existe"

  # Compter les fichiers JS
  JS_COUNT=$(find dist/js -name "*.js" | wc -l)
  if [ "$JS_COUNT" -gt 100 ]; then
    check 0 "Chunks JS générés ($JS_COUNT fichiers)"
  else
    echo -e "${RED}✗${NC} Pas assez de chunks JS ($JS_COUNT < 100)"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${RED}✗${NC} Build échoue"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "5️⃣  Vérification des tests"
echo "---------------------------"

# Vérifier que les tests existent
TEST_COUNT=$(find src/tests -name "*.test.ts*" -o -name "*.spec.ts*" 2>/dev/null | wc -l)
if [ "$TEST_COUNT" -gt 5 ]; then
  check 0 "Tests unitaires présents ($TEST_COUNT fichiers)"
else
  warn "Peu de tests trouvés ($TEST_COUNT)"
fi

# Vérifier CI/CD
[ -f ".github/workflows/ci.yml" ]; check $? "Pipeline CI/CD configuré"

echo ""
echo "6️⃣  Vérification des variables d'environnement"
echo "------------------------------------------------"

# Liste des variables critiques (depuis .env.example)
REQUIRED_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "VITE_STRIPE_PUBLISHABLE_KEY"
  "VITE_MAPBOX_TOKEN"
)

if [ -f ".env" ]; then
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
      check 0 "$var présent dans .env"
    else
      warn "$var manquant dans .env"
    fi
  done
else
  warn ".env n'existe pas (normal si pas encore configuré)"
fi

# Vérifier Sentry
if [ -f ".env" ] && grep -q "^VITE_SENTRY_DSN=" .env; then
  check 0 "VITE_SENTRY_DSN configuré"
else
  warn "VITE_SENTRY_DSN non configuré (monitoring désactivé)"
fi

echo ""
echo "7️⃣  Vérification de la sécurité"
echo "--------------------------------"

# Vérifier que les fichiers de sécurité existent
[ -f "SECURITY_ROTATION_GUIDE.md" ]; check $? "Guide de rotation des clés existe"
[ -f "SECURITY_IMPROVEMENTS_SUMMARY.md" ]; check $? "Résumé sécurité existe"
[ -f "src/lib/validation-schemas.ts" ]; check $? "Schémas de validation existent"
[ -f "src/lib/sentry.ts" ]; check $? "Configuration Sentry existe"
[ -f "vite-plugin-csp.ts" ]; check $? "Plugin CSP existe"

echo ""
echo "8️⃣  Vérification Git"
echo "---------------------"

# Vérifier qu'on est sur une branche
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -n "$BRANCH" ]; then
  check 0 "Git repository initialisé (branch: $BRANCH)"
else
  warn "Pas de repository Git"
fi

# Vérifier si des fichiers sont non commités
if git diff-index --quiet HEAD -- 2>/dev/null; then
  check 0 "Pas de modifications non commitées"
else
  warn "Des fichiers ne sont pas commités"
fi

echo ""
echo "======================================"
echo "📊 RÉSUMÉ"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les checks passent !${NC}"
  echo ""
  echo "Prochaines étapes :"
  echo "1. Rotation des clés API (voir SECURITY_ROTATION_GUIDE.md)"
  echo "2. Configuration Sentry (voir GUIDE_DEPLOIEMENT_PRODUCTION.md)"
  echo "3. Déploiement sur Vercel"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) trouvé(s)${NC}"
  echo ""
  echo "Le déploiement est possible mais il y a des avertissements."
  echo "Vérifier les points ci-dessus avant de déployer."
  exit 0
else
  echo -e "${RED}❌ $ERRORS erreur(s) trouvée(s)${NC}"
  echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
  echo ""
  echo "CORRIGER LES ERREURS avant de déployer !"
  echo ""
  echo "Aide :"
  echo "- Build error : voir URGENT_FIX_BUILD_ERROR.md"
  echo "- .env in Git : git rm --cached .env && git commit -m 'remove .env'"
  echo "- Missing files : Vérifier que tous les fichiers sont présents"
  exit 1
fi
