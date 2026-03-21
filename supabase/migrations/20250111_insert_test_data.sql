-- Migration pour insérer des données de test dans le dashboard
-- Date: 2025-01-11
-- ATTENTION: Ce script est pour le développement/test uniquement
-- Commentez ou supprimez en production

-- ============================================
-- 1. VUES DE CARTES (card_views)
-- ============================================

-- Insérer des vues de test pour les cartes existantes
INSERT INTO card_views (card_id, viewer_ip, user_agent, referrer, viewed_at, count, visitor_id)
SELECT
    bc.id as card_id,
    '192.168.1.' || (FLOOR(RANDOM() * 255)::INT) as viewer_ip,
    CASE (FLOOR(RANDOM() * 3)::INT)
        WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        ELSE 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
    END as user_agent,
    CASE (FLOOR(RANDOM() * 4)::INT)
        WHEN 0 THEN 'https://google.com'
        WHEN 1 THEN 'https://facebook.com'
        WHEN 2 THEN 'https://instagram.com'
        ELSE NULL
    END as referrer,
    NOW() - (RANDOM() * INTERVAL '30 days') as viewed_at,
    1 as count,
    'visitor_' || (FLOOR(RANDOM() * 1000)::INT) as visitor_id
FROM business_cards bc
CROSS JOIN generate_series(1, 20) -- 20 vues par carte
WHERE bc.is_public = true
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. PRODUITS (si la table products existe)
-- ============================================

-- Vérifier si des produits existent, sinon en créer
DO $$
DECLARE
    card_record RECORD;
    product_id UUID;
BEGIN
    -- Pour chaque carte publique, créer 2-3 produits de test
    FOR card_record IN
        SELECT id, user_id
        FROM business_cards
        WHERE is_public = true
        LIMIT 10
    LOOP
        -- Produit 1
        INSERT INTO products (
            card_id,
            name,
            description,
            price,
            image_url,
            created_at
        ) VALUES (
            card_record.id,
            'Produit Premium ' || FLOOR(RANDOM() * 100),
            'Description du produit de qualité supérieure',
            (FLOOR(RANDOM() * 10000) + 1000)::NUMERIC,
            NULL,
            NOW() - (RANDOM() * INTERVAL '60 days')
        )
        RETURNING id INTO product_id;

        -- Créer des commandes pour ce produit
        INSERT INTO product_inquiries (
            card_id,
            product_id,
            client_name,
            client_email,
            client_phone,
            quantity,
            status,
            created_at
        ) VALUES
        (
            card_record.id,
            product_id,
            'Client Test ' || FLOOR(RANDOM() * 100),
            'client' || FLOOR(RANDOM() * 1000) || '@test.com',
            '+33612345' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
            FLOOR(RANDOM() * 5) + 1,
            CASE (FLOOR(RANDOM() * 3)::INT)
                WHEN 0 THEN 'pending'
                WHEN 1 THEN 'confirmed'
                ELSE 'completed'
            END,
            NOW() - (RANDOM() * INTERVAL '30 days')
        );

        -- Produit 2
        INSERT INTO products (
            card_id,
            name,
            description,
            price,
            image_url,
            created_at
        ) VALUES (
            card_record.id,
            'Service Pro ' || FLOOR(RANDOM() * 100),
            'Service professionnel de haute qualité',
            (FLOOR(RANDOM() * 5000) + 500)::NUMERIC,
            NULL,
            NOW() - (RANDOM() * INTERVAL '60 days')
        )
        RETURNING id INTO product_id;

        -- Créer des commandes pour ce produit
        INSERT INTO product_inquiries (
            card_id,
            product_id,
            client_name,
            client_email,
            client_phone,
            quantity,
            status,
            created_at
        ) VALUES
        (
            card_record.id,
            product_id,
            'Client Premium ' || FLOOR(RANDOM() * 100),
            'premium' || FLOOR(RANDOM() * 1000) || '@test.com',
            '+33698765' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
            FLOOR(RANDOM() * 3) + 1,
            CASE (FLOOR(RANDOM() * 3)::INT)
                WHEN 0 THEN 'pending'
                WHEN 1 THEN 'confirmed'
                ELSE 'completed'
            END,
            NOW() - (RANDOM() * INTERVAL '15 days')
        );
    END LOOP;

    RAISE NOTICE 'Données de test insérées avec succès';

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de l''insertion des produits de test: %', SQLERRM;
END $$;

-- ============================================
-- 3. RENDEZ-VOUS (appointments)
-- ============================================

-- Insérer des rendez-vous de test
INSERT INTO appointments (
    card_id,
    client_name,
    client_email,
    client_phone,
    appointment_date,
    appointment_time,
    message,
    status,
    created_at
)
SELECT
    bc.id as card_id,
    'Client RDV ' || (FLOOR(RANDOM() * 100)::INT) as client_name,
    'rdv' || (FLOOR(RANDOM() * 1000)::INT) || '@test.com' as client_email,
    '+336' || LPAD((FLOOR(RANDOM() * 100000000)::BIGINT)::TEXT, 8, '0') as client_phone,
    CURRENT_DATE + (FLOOR(RANDOM() * 30)::INT) as appointment_date,
    (FLOOR(RANDOM() * 8) + 9)::TEXT || ':00' as appointment_time,
    'Message de test pour rendez-vous' as message,
    CASE (FLOOR(RANDOM() * 3)::INT)
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'confirmed'
        ELSE 'completed'
    END as status,
    NOW() - (RANDOM() * INTERVAL '20 days') as created_at
FROM business_cards bc
CROSS JOIN generate_series(1, 5) -- 5 rendez-vous par carte
WHERE bc.is_public = true
LIMIT 50
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. RÉSUMÉ
-- ============================================

-- Afficher un résumé des données insérées
DO $$
DECLARE
    views_count INT;
    orders_count INT;
    appointments_count INT;
    products_count INT;
BEGIN
    SELECT COUNT(*) INTO views_count FROM card_views;
    SELECT COUNT(*) INTO orders_count FROM product_inquiries;
    SELECT COUNT(*) INTO appointments_count FROM appointments;
    SELECT COUNT(*) INTO products_count FROM products;

    RAISE NOTICE '====================================';
    RAISE NOTICE 'RÉSUMÉ DES DONNÉES DE TEST';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Vues de cartes: %', views_count;
    RAISE NOTICE 'Produits: %', products_count;
    RAISE NOTICE 'Commandes: %', orders_count;
    RAISE NOTICE 'Rendez-vous: %', appointments_count;
    RAISE NOTICE '====================================';
END $$;
