#!/bin/bash

# Script pour déployer le système de notifications
# Date: 2025-01-26

set -e

echo "🚀 Déploiement du système de notifications automatiques..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "   Installer avec: npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}📦 Étape 1: Déploiement des Edge Functions...${NC}"

# Déployer send-notification-email
echo "  → Déploiement de send-notification-email..."
supabase functions deploy send-notification-email

# Déployer process-notification-queue
echo "  → Déploiement de process-notification-queue..."
supabase functions deploy process-notification-queue

echo ""
echo -e "${GREEN}✅ Edge Functions déployées!${NC}"
echo ""

# Vérifier les secrets
echo -e "${BLUE}🔐 Étape 2: Vérification des secrets...${NC}"
RESEND_KEY=$(supabase secrets list | grep RESEND_API_KEY || echo "")

if [ -z "$RESEND_KEY" ]; then
    echo -e "${YELLOW}⚠️  RESEND_API_KEY non configurée${NC}"
    echo "   Configurer avec: supabase secrets set RESEND_API_KEY=your_key"
else
    echo -e "${GREEN}✅ RESEND_API_KEY configurée${NC}"
fi

echo ""
echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo "  1. Appliquer les migrations SQL:"
echo "     - 20250126_create_notification_queue.sql"
echo "     - 20250126_create_notification_triggers.sql"
echo ""
echo "  2. Tester le système:"
echo "     - Créer un rendez-vous/commande/devis"
echo "     - Vérifier la table notification_queue"
echo "     - Appeler process-notification-queue"
echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"




