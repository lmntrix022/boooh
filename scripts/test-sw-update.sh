#!/bin/bash

###############################################################################
# 🧪 Script de test des mises à jour du Service Worker
#
# Ce script automatise les tests de la gestion des mises à jour du SW.
# Il simule un déploiement et vérifie que le mécanisme fonctionne.
#
# Usage:
#   ./scripts/test-sw-update.sh
#
# Prérequis:
#   - Node.js installé
#   - npx disponible
#   - Port 3000 libre
###############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions d'affichage
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Vérifier les prérequis
check_prerequisites() {
    step "Vérification des prérequis"
    
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé"
        exit 1
    fi
    success "Node.js installé: $(node --version)"
    
    if ! command -v npx &> /dev/null; then
        error "npx n'est pas disponible"
        exit 1
    fi
    success "npx disponible"
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        warning "Le port 3000 est déjà utilisé"
        info "Voulez-vous tuer le processus ? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            lsof -ti:3000 | xargs kill -9
            success "Processus tué"
        else
            error "Impossible de continuer avec le port 3000 occupé"
            exit 1
        fi
    fi
    success "Port 3000 disponible"
}

# Build initial
build_v1() {
    step "Build de la version 1 (version initiale)"
    
    info "Nettoyage du dossier dist..."
    rm -rf dist
    
    info "Build en cours..."
    npm run build > /dev/null 2>&1
    
    if [ ! -f "dist/sw.js" ]; then
        error "Le Service Worker n'a pas été généré"
        exit 1
    fi
    success "Build terminé"
    
    # Sauvegarder le hash du SW v1
    if command -v md5 &> /dev/null; then
        SW_V1_HASH=$(md5 -q dist/sw.js)
    else
        SW_V1_HASH=$(md5sum dist/sw.js | cut -d' ' -f1)
    fi
    info "Hash SW v1: $SW_V1_HASH"
}

# Démarrer le serveur
start_server() {
    step "Démarrage du serveur local"
    
    info "Lancement de 'serve' sur le port 3000..."
    npx serve dist -p 3000 > /dev/null 2>&1 &
    SERVER_PID=$!
    
    # Attendre que le serveur démarre
    sleep 2
    
    if ! ps -p $SERVER_PID > /dev/null; then
        error "Le serveur n'a pas pu démarrer"
        exit 1
    fi
    
    success "Serveur démarré (PID: $SERVER_PID)"
    info "URL: http://localhost:3000"
}

# Instruction pour l'utilisateur
wait_for_user_v1() {
    step "Test de la version 1"
    
    echo ""
    info "📋 INSTRUCTIONS:"
    echo "  1. Ouvrez http://localhost:3000 dans votre navigateur"
    echo "  2. Ouvrez DevTools (F12)"
    echo "  3. Allez dans l'onglet 'Application' > 'Service Workers'"
    echo "  4. Vérifiez qu'un SW est actif"
    echo "  5. Regardez la console, vous devriez voir:"
    echo "     🚀 Initialisation du Service Worker..."
    echo "     ✅ Service Worker enregistré avec succès"
    echo ""
    warning "Appuyez sur ENTRÉE quand vous êtes prêt à continuer..."
    read -r
    success "Prêt pour la v2"
}

# Modifier le code pour simuler une mise à jour
build_v2() {
    step "Build de la version 2 (mise à jour)"
    
    info "Modification du code pour déclencher une mise à jour..."
    
    # Ajouter un commentaire dans main.tsx pour changer le hash
    TIMESTAMP=$(date +%s)
    echo "// Update test $TIMESTAMP" >> src/main.tsx
    
    info "Rebuild en cours..."
    npm run build > /dev/null 2>&1
    
    # Vérifier que le hash a changé
    if command -v md5 &> /dev/null; then
        SW_V2_HASH=$(md5 -q dist/sw.js)
    else
        SW_V2_HASH=$(md5sum dist/sw.js | cut -d' ' -f1)
    fi
    
    if [ "$SW_V1_HASH" = "$SW_V2_HASH" ]; then
        warning "Le hash du SW n'a pas changé (c'est possible si le cache manifest est identique)"
    else
        success "Nouveau SW généré (hash différent)"
    fi
    
    info "Hash SW v2: $SW_V2_HASH"
    
    success "Build v2 terminé"
}

# Redémarrer le serveur avec la nouvelle version
restart_server() {
    step "Déploiement de la version 2"
    
    info "Arrêt du serveur actuel..."
    kill $SERVER_PID 2>/dev/null || true
    sleep 1
    
    info "Redémarrage avec la nouvelle version..."
    npx serve dist -p 3000 > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 2
    
    success "Serveur redémarré avec la v2"
}

# Instructions pour tester la mise à jour
wait_for_user_v2() {
    step "Test de la mise à jour automatique"
    
    echo ""
    info "📋 INSTRUCTIONS:"
    echo "  1. Retournez sur votre navigateur (sans recharger manuellement!)"
    echo "  2. Observez la console. Dans les 60 secondes maximum, vous devriez voir:"
    echo "     🔍 Vérification des mises à jour du Service Worker..."
    echo "     📦 Installation d'un nouveau Service Worker détectée..."
    echo "     🆕 Nouveau Service Worker détecté !"
    echo ""
    echo "  3. Si SHOW_UPDATE_NOTIFICATION = true:"
    echo "     → Une notification devrait apparaître en bas à droite"
    echo "     → Cliquez sur 'Mettre à jour maintenant'"
    echo "     → La page devrait se recharger automatiquement"
    echo ""
    echo "  4. Si SHOW_UPDATE_NOTIFICATION = false:"
    echo "     → La page devrait se recharger automatiquement sans notification"
    echo ""
    echo "  5. Dans DevTools > Application > Service Workers:"
    echo "     → Le nouveau SW devrait être actif"
    echo "     → L'ancien SW devrait avoir disparu"
    echo ""
    warning "Test réussi ? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        success "🎉 Test validé avec succès !"
        return 0
    else
        error "Le test a échoué. Consultez la documentation pour dépanner."
        return 1
    fi
}

# Nettoyage
cleanup() {
    step "Nettoyage"
    
    info "Arrêt du serveur..."
    kill $SERVER_PID 2>/dev/null || true
    
    info "Restauration du code..."
    git checkout src/main.tsx 2>/dev/null || true
    
    success "Nettoyage terminé"
}

# Piège pour nettoyer en cas d'interruption
trap cleanup EXIT INT TERM

# Menu principal
show_menu() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   🧪 Test de Mise à Jour du Service Worker               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Ce script va:"
    echo "  1. Builder et servir la version initiale (v1)"
    echo "  2. Vous demander d'ouvrir l'app dans le navigateur"
    echo "  3. Builder une nouvelle version (v2)"
    echo "  4. Redéployer automatiquement"
    echo "  5. Vérifier que la mise à jour est détectée et appliquée"
    echo ""
    warning "Voulez-vous continuer ? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        info "Test annulé"
        exit 0
    fi
}

# Main
main() {
    show_menu
    check_prerequisites
    build_v1
    start_server
    wait_for_user_v1
    build_v2
    restart_server
    
    if wait_for_user_v2; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                ✅ TOUS LES TESTS RÉUSSIS !                 ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        success "Votre système de mise à jour PWA fonctionne correctement !"
        echo ""
        info "Prochaines étapes:"
        echo "  - Déployer en production"
        echo "  - Monitorer les logs après déploiement"
        echo "  - Vérifier que les utilisateurs reçoivent les mises à jour"
        echo ""
        return 0
    else
        echo ""
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                  ❌ TESTS ÉCHOUÉS                          ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        error "Le système de mise à jour ne fonctionne pas correctement"
        echo ""
        info "Consultez la documentation:"
        echo "  docs/pwa/SERVICE_WORKER_UPDATE_GUIDE.md"
        echo ""
        info "Section Dépannage pour résoudre les problèmes courants"
        echo ""
        return 1
    fi
}

# Exécuter
main

