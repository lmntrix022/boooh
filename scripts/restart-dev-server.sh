#!/bin/bash

# Script pour redémarrer le serveur de développement et vider les caches
# Utile après des modifications importantes de React Query

echo "🔄 Redémarrage du serveur de développement..."

# Arrêter le serveur s'il tourne
echo "⏹️ Arrêt du serveur..."
pkill -f "vite" || true
pkill -f "npm run dev" || true
pkill -f "yarn dev" || true

# Attendre un peu
sleep 2

# Nettoyer les caches
echo "🧹 Nettoyage des caches..."
rm -rf node_modules/.vite || true
rm -rf .vite || true
rm -rf dist || true

# Nettoyer le cache du navigateur (localStorage)
echo "💾 Nettoyage du cache navigateur..."
echo "Ouvrez les DevTools (F12) et exécutez:"
echo "localStorage.clear(); sessionStorage.clear(); indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));"

# Redémarrer le serveur
echo "🚀 Redémarrage du serveur..."
npm run dev
