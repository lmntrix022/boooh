# Solution : Factures pour toutes les cartes

## Problème identifié

Actuellement, la table `invoices` n'a pas de colonne `card_id`. Les factures sont liées uniquement à `user_id`.

## Solutions possibles

### Option 1 : Migration - Ajouter card_id aux factures (RECOMMANDÉ)

Si vous voulez lier les factures aux cartes spécifiques :

```sql
-- Ajouter la colonne card_id
ALTER TABLE invoices ADD COLUMN card_id UUID REFERENCES business_cards(id) ON DELETE SET NULL;

-- Créer un index
CREATE INDEX idx_invoices_card_id ON invoices(card_id);

-- Mettre à jour la politique RLS pour permettre de voir les factures de toutes ses cartes
DROP POLICY "Users can view their own invoices" ON invoices;

CREATE POLICY "Users can view invoices of their cards"
ON invoices FOR SELECT
USING (
  auth.uid() = user_id
  OR
  card_id IN (
    SELECT id FROM business_cards WHERE user_id = auth.uid()
  )
);
```

### Option 2 : Modifier le service pour chercher par cartes

Modifier `getUserInvoices` pour récupérer les factures via les cartes :

```typescript
static async getUserInvoices(userId: string): Promise<Invoice[]> {
  // Récupérer toutes les cartes de l'utilisateur
  const { data: cards } = await supabase
    .from('business_cards')
    .select('id')
    .eq('user_id', userId);

  if (!cards || cards.length === 0) {
    // Fallback : chercher par user_id uniquement
    const { data, error } = await supabase
      .from('invoices')
      .select(`*, invoice_items (*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((invoice: any) => ({
      ...invoice,
      items: invoice.invoice_items || [],
    }));
  }

  const cardIds = cards.map(c => c.id);

  // Chercher les factures par user_id OU card_id
  const { data, error } = await supabase
    .from('invoices')
    .select(`*, invoice_items (*)`)
    .or(`user_id.eq.${userId},card_id.in.(${cardIds.join(',')})`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((invoice: any) => ({
    ...invoice,
    items: invoice.invoice_items || [],
  }));
}
```

## Debug recommandé

1. Ouvrez la console navigateur (F12)
2. Regardez les logs ajoutés dans Facture.tsx
3. Vérifiez :
   - L'ID utilisateur connecté
   - Le nombre de factures récupérées
   - Les user_id de chaque facture

## Vérifications Supabase

```sql
-- Voir toutes les factures avec leur user_id
SELECT
  invoice_number,
  client_name,
  user_id,
  created_at
FROM invoices
ORDER BY created_at DESC;

-- Voir toutes les cartes d'un utilisateur
SELECT id, full_name, user_id
FROM business_cards
WHERE user_id = 'VOTRE_USER_ID';

-- Compter les factures par user_id
SELECT user_id, COUNT(*) as total
FROM invoices
GROUP BY user_id;
```
