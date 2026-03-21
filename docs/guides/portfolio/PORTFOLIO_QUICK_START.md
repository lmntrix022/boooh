# Portfolio/Services - Guide de démarrage rapide

## 🚀 Mise en place en 5 minutes

### Étape 1 : Appliquer la migration de base de données

#### Option A : Via Supabase Dashboard (Recommandé)

1. Connectez-vous à votre [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet Bööh
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez le contenu de `supabase/migrations/20251014_create_portfolio_services_tables.sql`
6. Collez dans l'éditeur
7. Cliquez sur **Run** (ou Ctrl/Cmd + Enter)

✅ Vous devriez voir : "Success. No rows returned"

#### Option B : Via Supabase CLI

```bash
# Si vous avez la CLI installée
cd /Users/valerie/Downloads/boooh-main
supabase db push
```

### Étape 2 : Vérifier que tout fonctionne

Exécutez cette requête dans le SQL Editor :

```sql
-- Vérifier que les tables sont créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'portfolio%';

-- Résultat attendu :
-- portfolio_projects
-- portfolio_settings
-- portfolio_analytics
```

```sql
-- Vérifier que la fonction stats existe
SELECT proname
FROM pg_proc
WHERE proname = 'get_portfolio_stats';

-- Résultat attendu :
-- get_portfolio_stats
```

### Étape 3 : Créer des données de test (Optionnel)

```sql
-- 1. Activer le portfolio pour votre compte
INSERT INTO portfolio_settings (user_id, card_id, is_enabled, title, subtitle)
VALUES (
  auth.uid(), -- Votre user_id
  (SELECT id FROM business_cards WHERE user_id = auth.uid() LIMIT 1), -- Votre première carte
  true,
  'Mon Univers',
  'Découvrez mes réalisations et demandez un devis personnalisé'
);

-- 2. Créer un projet de test
INSERT INTO portfolio_projects (
  user_id,
  card_id,
  title,
  slug,
  category,
  tags,
  short_description,
  challenge,
  solution,
  result,
  featured_image,
  cta_type,
  cta_label,
  is_published
)
VALUES (
  auth.uid(),
  (SELECT id FROM business_cards WHERE user_id = auth.uid() LIMIT 1),
  'Refonte Identité Visuelle - Startup Tech',
  'refonte-identite-startup-tech',
  'Graphisme',
  ARRAY['Branding', 'Logo', 'Charte Graphique'],
  'Création complète d''une identité visuelle pour une startup innovante dans le secteur tech',
  'La startup TechNova n''avait aucune identité visuelle cohérente. Chaque support utilisait des couleurs et logos différents, créant une confusion auprès des clients.',
  'Nous avons développé une identité complète : nouveau logo, palette de couleurs, typographies, guidelines, et déclinaisons sur tous les supports (carte de visite, site web, réseaux sociaux).',
  'Identité forte et moderne qui reflète les valeurs d''innovation. +45% de reconnaissance de marque en 3 mois. Le client a remporté un prix design régional.',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
  'quote',
  'Demander un devis similaire',
  true
);

-- 3. Créer une demande de devis de test
INSERT INTO service_quotes (
  user_id,
  card_id,
  project_id,
  client_name,
  client_email,
  client_phone,
  service_requested,
  project_description,
  budget_range,
  urgency,
  status,
  priority
)
VALUES (
  auth.uid(),
  (SELECT id FROM business_cards WHERE user_id = auth.uid() LIMIT 1),
  (SELECT id FROM portfolio_projects WHERE user_id = auth.uid() LIMIT 1),
  'Jean Dupont',
  'jean.dupont@example.com',
  '+241 06 12 34 56 78',
  'Création identité visuelle',
  'Nous lançons une nouvelle marque de cosmétiques bio et cherchons à créer une identité complète qui reflète nos valeurs d''authenticité et de naturalité.',
  '5000-10000',
  'normal',
  'new',
  'high'
);
```

### Étape 4 : Tester via le service TypeScript

Créez un fichier de test :

```typescript
// test-portfolio.ts
import { PortfolioService } from '@/services/portfolioService';

async function testPortfolio() {
  const userId = 'VOTRE_USER_ID'; // Remplacez par votre user_id

  try {
    // 1. Obtenir les paramètres
    const settings = await PortfolioService.getSettings(userId);
    console.log('Settings:', settings);

    // 2. Obtenir les projets
    const projects = await PortfolioService.getUserProjects(userId);
    console.log('Projects:', projects.length);

    // 3. Obtenir les devis
    const quotes = await PortfolioService.getUserQuotes(userId);
    console.log('Quotes:', quotes.length);

    // 4. Obtenir les statistiques
    const stats = await PortfolioService.getStats(userId);
    console.log('Stats:', stats);

    console.log('✅ Tout fonctionne !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testPortfolio();
```

---

## 📊 Vérification des données

### Voir vos projets
```sql
SELECT
  id,
  title,
  category,
  is_published,
  view_count,
  created_at
FROM portfolio_projects
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Voir vos devis
```sql
SELECT
  id,
  client_name,
  client_email,
  service_requested,
  status,
  created_at
FROM service_quotes
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Voir les statistiques
```sql
SELECT * FROM get_portfolio_stats(auth.uid());
```

---

## 🎨 Tester l'interface (Prochaines étapes)

Une fois les composants UI créés, vous pourrez :

1. Activer le portfolio dans vos paramètres
2. Créer des projets depuis le dashboard
3. Afficher "Mon Univers" sur votre carte publique
4. Recevoir des demandes de devis
5. Suivre les statistiques

---

## 🐛 Résolution de problèmes

### Erreur : "relation does not exist"
```sql
-- Les tables n'ont pas été créées
-- Réappliquez la migration (Étape 1)
```

### Erreur : "permission denied"
```sql
-- Problème de RLS
-- Vérifiez que vous êtes authentifié
SELECT auth.uid(); -- Doit retourner votre UUID

-- Ou vérifiez les policies
SELECT * FROM pg_policies WHERE tablename LIKE 'portfolio%';
```

### Erreur : "function does not exist"
```sql
-- La fonction n'a pas été créée
-- Vérifiez dans la migration que toutes les fonctions sont bien créées

-- Recréer manuellement si nécessaire
CREATE OR REPLACE FUNCTION get_portfolio_stats(user_uuid UUID)
RETURNS JSON AS $$
-- ... (voir migration)
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📱 Prochaines étapes

Maintenant que la base de données est configurée :

1. **Créer les composants UI** :
   - `PortfolioView.tsx` - Vue principale
   - `ProjectCard.tsx` - Carte projet
   - `QuoteRequestForm.tsx` - Formulaire devis

2. **Ajouter le bouton sur la carte** :
   - Modifier `BusinessCard.tsx` ou `BusinessCardModern.tsx`
   - Condition : `if (portfolioSettings?.is_enabled)`

3. **Créer le dashboard de gestion** :
   - Liste des projets
   - Gestion des devis
   - Analytics

4. **Tester en production** :
   - Créer quelques projets
   - Publier votre portfolio
   - Recevoir vos premières demandes de devis !

---

## 💡 Conseils

### Pour un beau portfolio :

- **Photos** : Utilisez des images HD (1920x1080 min)
- **Texte** : Soyez concis et impactant
- **Témoignages** : Demandez des recommandations spécifiques
- **CTA** : Un seul call-to-action clair par projet

### Pour optimiser les conversions :

- **Catégories** : Facilitent la navigation
- **Tags** : Aident au référencement
- **Ordre** : Mettez vos meilleurs projets en premier
- **Mise à jour** : Ajoutez régulièrement de nouveaux projets

---

## 📞 Besoin d'aide ?

Consultez :
- `PORTFOLIO_SERVICES_MODULE.md` - Documentation complète
- `supabase/migrations/20251014_create_portfolio_services_tables.sql` - Structure de la base
- `src/services/portfolioService.ts` - API TypeScript

---

**Version** : 1.0.0
**Date** : 14 octobre 2025
