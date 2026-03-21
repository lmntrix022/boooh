-- Migration pour insérer les articles de blog initiaux dans content_items
-- Date: 2025-10-29

-- Supprimer les articles existants s'ils existent déjà (pour éviter les doublons lors des ré-exécutions)
DELETE FROM public.content_items WHERE type = 'article' AND metadata->>'date' IN ('2025-01-27', '2025-01-20', '2025-01-15', '2025-01-10', '2025-01-05', '2025-01-01');

-- Article 1: Comment automatiser votre gestion client avec l'IA
INSERT INTO public.content_items (
    title,
    slug,
    type,
    status,
    content,
    metadata,
    author_id,
    created_at
) VALUES (
    'Comment automatiser votre gestion client avec l''IA',
    'comment-automatiser-votre-gestion-client-avec-l-ia',
    'article',
    'published',
    '<p>Dans un monde où chaque contact compte, la gestion manuelle de vos clients devient rapidement un frein à votre croissance. Le CRM IA de Bööh révolutionne votre façon de gérer vos relations client.</p>
<p>Imaginez : vous participez à un salon professionnel, échangez votre carte de visite digitale via QR code ou NFC, et instantanément, les informations de votre contact sont capturées, enrichies et organisées dans votre CRM. Plus besoin de ressaisir manuellement chaque nom, email ou numéro de téléphone.</p>
<p>L''intelligence artificielle intégrée analyse automatiquement les interactions : emails, appels, rendez-vous, et vous propose les prochaines actions optimales. Vous découvrez quels contacts sont les plus intéressants, quels prospects sont prêts à acheter, et comment maximiser vos chances de conversion.</p>
<p>Grâce à l''automatisation, vous gagnez un temps précieux tout en n''oubliant plus jamais un suivi important. Vos clients ressentent une attention personnalisée, même si 80% du travail est automatisé intelligemment.</p>
<p>Avec Bööh, transformez chaque échange en opportunité business concrète, sans effort supplémentaire.</p>',
    jsonb_build_object(
        'summary', 'Découvrez comment le CRM IA de Bööh transforme votre gestion client. Automatisez la capture de contacts, enrichissez vos leads et multipliez vos conversions.',
        'image', '/blog/1.webp',
        'tags', ARRAY['CRM IA', 'Automatisation', 'IA']::text[],
        'author', 'Équipe Bööh',
        'readTime', '5 min',
        'date', '2025-01-27',
        'featured', true
    ),
    NULL,
    '2025-01-27T00:00:00Z'::timestamp with time zone
);

-- Article 2: 5 erreurs à éviter quand on vend du contenu digital
INSERT INTO public.content_items (
    title,
    slug,
    type,
    status,
    content,
    metadata,
    author_id,
    created_at
) VALUES (
    '5 erreurs à éviter quand on vend du contenu digital',
    '5-erreurs-a-eviter-quand-on-vend-du-contenu-digital',
    'article',
    'published',
    '<p>Vendre du contenu digital peut être une source de revenus formidable... à condition de bien protéger vos créations. Malheureusement, de nombreux créateurs commettent des erreurs qui leur coûtent cher.</p>
<p><strong>Erreur #1 : Ne pas protéger vos fichiers.</strong> Publier vos PDF, vidéos ou images sans protection DRM, c''est comme laisser la porte de votre boutique grande ouverte. Un simple partage et vos contenus se retrouvent sur des sites de piratage.</p>
<p><strong>Erreur #2 : Utiliser un watermarking basique.</strong> Un filigrane visible à l''œil nu détériore l''expérience client et peut être facilement retiré. Le watermarking intelligent de Bööh est invisible, mais trace chaque partage.</p>
<p><strong>Erreur #3 : Oublier les limitations d''accès.</strong> Un client achète une licence individuelle, mais partage le lien à toute son équipe ? Avec Bööh, vous contrôlez les téléchargements, les sessions simultanées et la durée d''accès.</p>
<p><strong>Erreur #4 : Ne pas monitorer l''usage.</strong> Comment savoir si vos contenus sont utilisés comme prévu ? Le système de traçage de Bööh vous montre en temps réel qui accède à quoi, depuis où, et pendant combien de temps.</p>
<p><strong>Erreur #5 : Négliger l''expérience utilisateur.</strong> Une protection trop lourde peut frustrer vos clients légitimes. Bööh trouve le parfait équilibre entre sécurité et fluidité.</p>
<p>Protégez vos créations intelligemment, donnez confiance à vos clients, et multipliez vos ventes en toute sérénité.</p>',
    jsonb_build_object(
        'summary', 'Protégez vos fichiers avec DRM et évitez les fuites. Découvrez les meilleures pratiques pour vendre vos contenus numériques en toute sécurité.',
        'image', '/blog/2.webp',
        'tags', ARRAY['DRM', 'Protection', 'Business']::text[],
        'author', 'Équipe Bööh',
        'readTime', '7 min',
        'date', '2025-01-20',
        'featured', false
    ),
    NULL,
    '2025-01-20T00:00:00Z'::timestamp with time zone
);

-- Article 3: Pourquoi 80% des pros perdent leurs contacts après un salon
INSERT INTO public.content_items (
    title,
    slug,
    type,
    status,
    content,
    metadata,
    author_id,
    created_at
) VALUES (
    'Pourquoi 80% des pros perdent leurs contacts après un salon',
    'pourquoi-80-pourcent-des-pros-perdent-leurs-contacts-apres-un-salon',
    'article',
    'published',
    '<p>Vous rentrez d''un événement professionnel avec une pochette pleine de cartes de visite. Que se passe-t-il ensuite ? Statistiquement, 88% de ces cartes finiront dans un tiroir, oubliées à jamais.</p>
<p>Le problème est simple : vous êtes submergé d''informations au moment de l''échange. Vous promettez de recontacter, mais une fois rentré, vous devez ressaisir manuellement chaque contact. C''est fastidieux, long, et souvent repoussé au lendemain... qui n''arrive jamais.</p>
<p>Avec le scan IA de cartes de visite de Bööh, fini ce gâchis. Scannez une carte papier en une seconde avec votre smartphone, et toutes les informations sont automatiquement extraites et ajoutées à votre CRM.</p>
<p>L''intelligence artificielle reconnaît le nom, le prénom, l''email, le téléphone, l''entreprise, le poste, et même le site web. Elle nettoie et structure les données, évite les doublons, et enrichit les profils avec des informations publiques pertinentes.</p>
<p>Vous pouvez même annoter rapidement chaque contact juste après le scan : contexte de rencontre, points discutés, actions à suivre. Tout est sauvegardé et synchronisé instantanément.</p>
<p>Plus jamais de contact perdu. Transformez chaque échange en opportunité business concrète grâce à l''IA.</p>',
    jsonb_build_object(
        'summary', 'Le problème récurrent du networking : perte d''informations, cartes qui s''égarent... Voici comment Bööh résout ce problème avec le scan IA de cartes de visite.',
        'image', '/blog/3.webp',
        'tags', ARRAY['Networking', 'CRM', 'IA']::text[],
        'author', 'Équipe Bööh',
        'readTime', '6 min',
        'date', '2025-01-15',
        'featured', false
    ),
    NULL,
    '2025-01-15T00:00:00Z'::timestamp with time zone
);

-- Article 4: Témoignage : Marie double ses clients grâce à sa carte digitale Bööh
INSERT INTO public.content_items (
    title,
    slug,
    type,
    status,
    content,
    metadata,
    author_id,
    created_at
) VALUES (
    'Témoignage : Marie double ses clients grâce à sa carte digitale Bööh',
    'temoignage-marie-double-ses-clients-grace-a-sa-carte-digitale-booh',
    'article',
    'published',
    '<p>Marie, consultante en stratégie digitale, cherchait depuis des mois un moyen de professionnaliser son image et d''automatiser sa prospection. Elle a testé plusieurs solutions, mais rien ne correspondait vraiment à ses besoins.</p>
<p>C''est en découvrant Bööh qu''elle a eu son déclic. En quelques jours, elle a créé sa carte digitale professionnelle, intégré son portfolio de réalisations, et connecté son calendrier pour les rendez-vous.</p>
<p>Les résultats ont été impressionnants. En un mois, elle a capturé plus de 200 nouveaux contacts lors d''événements professionnels, tous automatiquement ajoutés à son CRM. Le suivi personnalisé automatisé lui a permis de convertir 15% de ces contacts en clients actifs.</p>
<p>« Avant Bööh, je perdais 90% de mes contacts de salon. Maintenant, j''ai un suivi systématique et personnalisé pour chaque personne que je rencontre. Mon taux de conversion a doublé, et je gagne 10 heures par semaine en gestion administrative. »</p>
<p>Marie a aussi créé une boutique en ligne intégrée pour vendre ses guides et formations. En quelques clics, elle propose ses contenus protégés avec DRM, et suit ses ventes en temps réel.</p>
<p>Le plus surprenant ? Ses clients adorent l''expérience. Ils apprécient la facilité de prise de rendez-vous, l''accès rapide à ses réalisations, et la fluidité des interactions.</p>
<p>Aujourd''hui, Marie ne pourrait plus revenir en arrière. Bööh est devenu le centre nerveux de son business, et elle continue d''explorer de nouvelles fonctionnalités pour optimiser encore son activité.</p>',
    jsonb_build_object(
        'summary', 'Découvrez le parcours de Marie, consultante indépendante qui a transformé son réseau et multiplié ses clients avec la plateforme Bööh.',
        'image', '/blog/4.webp',
        'tags', ARRAY['Success story', 'Témoignage', 'Business']::text[],
        'author', 'Marie D.',
        'readTime', '8 min',
        'date', '2025-01-10',
        'featured', false
    ),
    NULL,
    '2025-01-10T00:00:00Z'::timestamp with time zone
);

-- Article 5: Guide complet : Créer votre boutique en ligne en 10 minutes
INSERT INTO public.content_items (
    title,
    slug,
    type,
    status,
    content,
    metadata,
    author_id,
    created_at
) VALUES (
    'Guide complet : Créer votre boutique en ligne en 10 minutes',
    'guide-complet-creer-votre-boutique-en-ligne-en-10-minutes',
    'article',
    'published',
    '<p>Vous souhaitez vendre vos produits ou services en ligne, mais vous pensez que c''est compliqué et coûteux ? Détrompez-vous. Avec Bööh, créez votre boutique e-commerce professionnelle en 10 minutes chrono.</p>
<p><strong>Étape 1 : Ajoutez vos produits (2 min).</strong> Uploadez vos images, ajoutez vos descriptions, fixez vos prix. Support pour produits physiques, numériques, services, abonnements...</p>
<p><strong>Étape 2 : Configurez vos méthodes de paiement (1 min).</strong> Carte bancaire, virement, paiement mobile... Choisissez ce qui convient à votre business.</p>
<p><strong>Étape 3 : Personnalisez votre boutique (2 min).</strong> Ajoutez votre logo, choisissez vos couleurs, personnalisez votre page de vente.</p>
<p><strong>Étape 4 : Activez votre stock (2 min).</strong> Définissez vos quantités, configurez les alertes, gérez vos variations (tailles, couleurs, etc.).</p>
<p><strong>Étape 5 : Protégez vos contenus numériques (2 min).</strong> Si vous vendez des fichiers, activez le DRM et le watermarking pour une protection totale.</p>
<p><strong>Étape 6 : Lancez (1 min).</strong> Partagez le lien de votre boutique directement depuis votre carte digitale, ou créez une page dédiée.</p>
<p>Votre boutique est maintenant opérationnelle ! Gérez vos commandes, suivez vos stocks, et analysez vos ventes, tout au même endroit. Plus besoin de jongler entre plusieurs plateformes.</p>',
    jsonb_build_object(
        'summary', 'Avec Bööh, lancez votre e-commerce intégré à votre carte digitale. Vendez vos produits, gérez vos commandes et votre stock, tout au même endroit.',
        'image', '/blog/5.webp',
        'tags', ARRAY['E-commerce', 'Tutoriel', 'Business']::text[],
        'author', 'Équipe Bööh',
        'readTime', '10 min',
        'date', '2025-01-05',
        'featured', false
    ),
    NULL,
    '2025-01-05T00:00:00Z'::timestamp with time zone
);

-- Article 6: Watermarking intelligent : Protégez vos visuels automatiquement
INSERT INTO public.content_items (
    title,
    slug,
    type,
    status,
    content,
    metadata,
    author_id,
    created_at
) VALUES (
    'Watermarking intelligent : Protégez vos visuels automatiquement',
    'watermarking-intelligent-protegez-vos-visuels-automatiquement',
    'article',
    'published',
    '<p>Vous partagez vos créations visuelles et redoutez qu''elles soient réutilisées sans autorisation ? Le watermarking intelligent de Bööh protège automatiquement vos images, tout en gardant une expérience utilisateur optimale.</p>
<p>Contrairement aux watermarks visibles qui détériorent l''image, notre système utilise des techniques d''intelligence artificielle pour intégrer des marqueurs invisibles à l''œil nu, mais décelables par nos algorithmes.</p>
<p>Chaque image téléchargée est automatiquement tracée. Si elle est partagée illégalement, nous pouvons identifier l''origine du partage, l''utilisateur concerné, et même le moment exact où l''infraction a eu lieu.</p>
<p>Le système est si discret que vos clients ne remarquent même pas la protection. Ils profitent pleinement de vos créations, tandis que vous conservez un contrôle total sur leur usage.</p>
<p>En cas de partage suspect, vous recevez une alerte en temps réel et pouvez agir immédiatement : bloquer l''accès, envoyer un avertissement, ou même poursuivre légalement si nécessaire.</p>
<p>Protégez vos visuels intelligemment, maintenez la confiance de vos clients, et concentrez-vous sur votre créativité plutôt que sur la surveillance constante.</p>',
    jsonb_build_object(
        'summary', 'Découvrez comment le watermarking IA de Bööh protège automatiquement vos images lors du partage, sans altérer l''expérience utilisateur.',
        'image', '/blog/6.webp',
        'tags', ARRAY['DRM', 'Protection', 'IA']::text[],
        'author', 'Équipe Bööh',
        'readTime', '6 min',
        'date', '2025-01-01',
        'featured', false
    ),
    NULL,
    '2025-01-01T00:00:00Z'::timestamp with time zone
);

-- Commentaire de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Les 6 articles de blog ont été insérés avec succès dans content_items';
END $$;

