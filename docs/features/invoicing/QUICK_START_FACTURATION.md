# 🚀 Guide Rapide - Nouvelles Fonctionnalités de Facturation

## 📋 Résumé des Nouveautés

Trois nouvelles fonctionnalités ont été ajoutées au système de facturation :

1. **📧 Envoi d'Emails** - Envoyez vos factures par email automatiquement
2. **✅ Marquer comme Payée** - Gérez le statut de paiement facilement
3. **📊 Export Comptable** - Exportez vos données en CSV ou FEC

---

## 1. 📧 Envoi d'Emails Automatique

### ✨ Utilisation Immédiate (Mode Simulation)

**Aucune configuration requise** - fonctionne dès maintenant avec simulation !

1. Allez dans **Facturation**
2. Trouvez une facture dans la liste
3. Cliquez sur **⋮ (menu actions)**
4. Sélectionnez **"Envoyer"**
5. La facture est marquée comme "Envoyée" ✅

### 🔧 Configuration Avancée (Envoi Réel - Optionnel)

Pour envoyer de vrais emails aux clients :

**Étape 1 : Créer un compte Resend (gratuit)**
```
1. Allez sur https://resend.com
2. Créez un compte (100 emails/jour GRATUITS)
3. Allez dans "API Keys"
4. Créez une nouvelle clé API
5. Copiez la clé (commence par "re_...")
```

**Étape 2 : Configurer Supabase**
```bash
# Dans votre terminal
supabase secrets set RESEND_API_KEY=re_votre_cle_api_ici
```

**Étape 3 : Déployer la fonction**
```bash
cd /Users/quantinekouaghe/Downloads/boooh-main
supabase functions deploy send-invoice-email
```

**C'est tout !** 🎉 Les emails réels seront maintenant envoyés.

---

## 2. ✅ Marquer comme Payée

### Utilisation

**Depuis la liste des factures :**

1. Trouvez une facture non payée
2. Cliquez sur **⋮ (menu actions)**
3. Sélectionnez **"Marquer comme payée"** 💵
4. Choisissez la **date de paiement**
5. Cliquez sur **"Confirmer le paiement"**

**Résultat :**
- ✅ Statut passe à "Payée" (badge vert)
- 📊 Statistiques mises à jour automatiquement
- 💰 Montant ajouté au total "Payé"

### Astuce
Le dialog affiche les informations du client pour confirmer avant validation.

---

## 3. 📊 Export Comptable

### Format CSV (Excel/Google Sheets)

**Utilisation :**

1. Dans la page **Facturation**
2. Cliquez sur **"Exporter"** (bouton violet)
3. Sélectionnez **"CSV (Excel)"**
4. Cliquez sur **"Exporter"**
5. Le fichier `factures_YYYY-MM-DD.csv` est téléchargé

**Contenu du CSV :**
- Toutes vos factures
- Colonnes : Numéro, Dates, Client, Montants, Statut...
- Compatible : Excel, Google Sheets, LibreOffice

**Utilisation Excel :**
```
1. Ouvrir Excel
2. Fichier > Ouvrir > factures_2025-01-15.csv
3. Les données sont prêtes à analyser !
```

### Format FEC (Comptabilité Française)

**C'est quoi ?**
Le Fichier des Écritures Comptables, format officiel exigé par l'administration fiscale française.

**Utilisation :**

1. Cliquez sur **"Exporter"**
2. Sélectionnez **"FEC (Comptabilité)"**
3. Cliquez sur **"Exporter"**
4. Le fichier `2025FEC20250115.txt` est téléchargé

**Contenu du FEC :**
- Écritures comptables automatiques
- Comptes : 411000 (Clients), 707000 (Ventes), 445710 (TVA)
- Format normalisé conforme NF Z67-190

**Pour votre expert-comptable :**
```
1. Envoyer le fichier FEC à votre comptable
2. Il peut l'importer dans son logiciel (Sage, Ciel, EBP...)
3. Gain de temps énorme sur la saisie comptable !
```

---

## 🎯 Scénarios d'Usage

### Scénario 1 : Workflow Complet
```
1. Créer une facture → Status "Brouillon"
2. Générer le PDF → Vérifier le contenu
3. Envoyer par email → Status "Envoyée"
4. Client paie → Marquer comme payée
5. Fin du mois → Exporter en FEC pour comptable
```

### Scénario 2 : Suivi des Paiements
```
1. Filtrer les factures "Envoyées"
2. Contacter les clients
3. Marquer comme payée quand reçu
4. Exporter CSV pour tableau de bord Excel
```

### Scénario 3 : Déclaration Fiscale
```
1. Fin de période fiscale
2. Exporter au format FEC
3. Envoyer à l'expert-comptable
4. Il intègre dans la déclaration
```

---

## 💡 Astuces et Conseils

### Pour les Emails

✅ **Vérifiez l'email client** avant d'envoyer
✅ **Mode simulation** fonctionne sans configuration
✅ **Utilisez Resend** pour les vrais emails (gratuit)
❌ **N'oubliez pas** de générer le PDF avant d'envoyer

### Pour le Paiement

✅ **Notez la date réelle** de réception
✅ **Vérifiez les infos** avant de confirmer
✅ **Statistiques mises à jour** automatiquement
❌ **Pas de date future** possible

### Pour l'Export

✅ **Exportez régulièrement** (mensuel recommandé)
✅ **CSV pour analyse**, FEC pour comptabilité
✅ **Gardez une copie** sur votre ordinateur
❌ **Ne modifiez pas** le format FEC

---

## 📱 Raccourcis Clavier (À venir)

```
Ctrl/Cmd + E  → Exporter
Ctrl/Cmd + S  → Envoyer facture sélectionnée
Ctrl/Cmd + P  → Marquer comme payée
```

---

## 🆘 Aide Rapide

### L'email ne part pas
**Solution :** C'est normal ! En mode par défaut, c'est une simulation. Pour envoyer de vrais emails, suivez la section "Configuration Avancée" ci-dessus.

### Je ne trouve pas le bouton "Marquer comme payée"
**Solution :** Ce bouton n'apparaît que pour les factures avec statut "Envoyée", "En retard" ou "Brouillon" (pas "Payée" ou "Annulée").

### L'export ne fonctionne pas
**Solution :**
1. Vérifiez que vous avez des factures
2. Essayez un autre navigateur
3. Vérifiez les autorisations de téléchargement

### Mon comptable refuse le fichier FEC
**Solution :** Vérifiez que :
- Le fichier s'appelle `YYYYFECYYYYMMDD.txt`
- L'extension est `.txt` (pas `.csv`)
- Vous l'avez exporté au format "FEC", pas "CSV"

---

## 📞 Support

**Documentation complète :** Voir `INVOICE_FEATURES_IMPLEMENTATION.md`

**Questions ?** Consultez la documentation ou créez une issue GitHub.

---

## ✨ Récapitulatif

| Fonctionnalité | Status | Configuration Requise |
|----------------|--------|-----------------------|
| Envoi Email (simulation) | ✅ Actif | Aucune |
| Envoi Email (réel) | ⚙️ Optionnel | Compte Resend + Déploiement |
| Marquer comme Payée | ✅ Actif | Aucune |
| Export CSV | ✅ Actif | Aucune |
| Export FEC | ✅ Actif | Aucune |

**Toutes les fonctionnalités sont utilisables dès maintenant !** 🎉

La configuration avancée (emails réels) est optionnelle et peut être faite plus tard.

---

**Bon travail !** 🚀

*Dernière mise à jour : 15 janvier 2025*
