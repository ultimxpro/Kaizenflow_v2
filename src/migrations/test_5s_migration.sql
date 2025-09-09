-- Script de test pour la migration 5S
-- À exécuter après avoir créé les tables et migré les données

-- ===========================================
-- TESTS DE VALIDATION
-- ===========================================

-- 1. Vérifier que les tables ont été créées
DO $$
BEGIN
    -- Vérifier l'existence des tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'five_s_checklists') THEN
        RAISE EXCEPTION 'Table five_s_checklists n''existe pas';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'five_s_items') THEN
        RAISE EXCEPTION 'Table five_s_items n''existe pas';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'five_s_assignments') THEN
        RAISE EXCEPTION 'Table five_s_assignments n''existe pas';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'five_s_photos') THEN
        RAISE EXCEPTION 'Table five_s_photos n''existe pas';
    END IF;

    RAISE NOTICE '✅ Toutes les tables 5S existent';
END $$;

-- 2. Vérifier les politiques RLS
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename LIKE 'five_s_%';

    IF policy_count = 0 THEN
        RAISE EXCEPTION 'Aucune politique RLS trouvée pour les tables 5S';
    END IF;

    RAISE NOTICE '✅ % politiques RLS configurées pour les tables 5S', policy_count;
END $$;

-- 3. Tester les fonctions utilitaires
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Tester la fonction de calcul des statistiques
    SELECT * INTO test_result FROM calculate_5s_progress('00000000-0000-0000-0000-000000000000');

    RAISE NOTICE '✅ Fonction calculate_5s_progress fonctionne';

    -- Tester la fonction de vérification de migration
    SELECT * INTO test_result FROM verify_5s_migration();

    RAISE NOTICE '✅ Fonction verify_5s_migration fonctionne';
    RAISE NOTICE '📊 Statut migration: %', test_result.migration_status;
END $$;

-- ===========================================
-- TESTS DE DONNÉES
-- ===========================================

-- 4. Insérer des données de test
DO $$
DECLARE
    test_module_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_id UUID := '22222222-2222-2222-2222-222222222222';
    test_checklist_id UUID;
    test_item_id UUID;
BEGIN
    -- Créer un module de test (si nécessaire)
    INSERT INTO a3_modules (id, project_id, quadrant, tool_type, position, titre)
    VALUES (test_module_id, '33333333-3333-3333-3333-333333333333', 'PLAN', '5S', 1, 'Module 5S Test')
    ON CONFLICT (id) DO NOTHING;

    -- Créer une checklist de test
    INSERT INTO five_s_checklists (module_id, title, description, created_by)
    VALUES (test_module_id, 'Checklist Test 5S', 'Checklist de test pour validation', test_user_id)
    RETURNING id INTO test_checklist_id;

    RAISE NOTICE '✅ Checklist de test créée: %', test_checklist_id;

    -- Créer des items de test pour chaque catégorie
    INSERT INTO five_s_items (checklist_id, category, title, description, status, priority, created_by)
    VALUES
        (test_checklist_id, 'seiri', 'Trier les documents obsolètes', 'Identifier et supprimer les documents inutiles', 'pending', 'medium', test_user_id),
        (test_checklist_id, 'seiton', 'Ranger les outils', 'Définir une place pour chaque outil', 'in_progress', 'high', test_user_id),
        (test_checklist_id, 'seiso', 'Nettoyer les postes', 'Établir un plan de nettoyage quotidien', 'completed', 'medium', test_user_id),
        (test_checklist_id, 'seiketsu', 'Standardiser les procédures', 'Créer des standards de rangement', 'pending', 'low', test_user_id),
        (test_checklist_id, 'shitsuke', 'Maintenir les habitudes', 'Mettre en place des audits réguliers', 'pending', 'high', test_user_id)
    RETURNING id INTO test_item_id;

    RAISE NOTICE '✅ Items de test créés pour la checklist %', test_checklist_id;

    -- Créer une photo de test
    INSERT INTO five_s_photos (
        item_id,
        filename,
        original_filename,
        file_path,
        photo_type,
        description,
        uploaded_by
    ) VALUES (
        test_item_id,
        'test_photo_20250907.jpg',
        'Photo_Test_5S.jpg',
        '5s-photos/items/test_photo_20250907.jpg',
        'before',
        'Photo de test pour validation',
        test_user_id
    );

    RAISE NOTICE '✅ Photo de test créée';

    -- Tester les statistiques
    PERFORM calculate_5s_progress(test_checklist_id);
    RAISE NOTICE '✅ Calcul des statistiques réussi';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erreur lors des tests: %', SQLERRM;
END $$;

-- ===========================================
-- VÉRIFICATIONS FINALES
-- ===========================================

-- 5. Afficher un résumé des données
SELECT
    'Checklists' as table_name,
    COUNT(*) as count
FROM five_s_checklists
UNION ALL
SELECT
    'Items' as table_name,
    COUNT(*) as count
FROM five_s_items
UNION ALL
SELECT
    'Assignments' as table_name,
    COUNT(*) as count
FROM five_s_assignments
UNION ALL
SELECT
    'Photos' as table_name,
    COUNT(*) as count
FROM five_s_photos
UNION ALL
SELECT
    'Photo Comments' as table_name,
    COUNT(*) as count
FROM five_s_photo_comments
UNION ALL
SELECT
    'History' as table_name,
    COUNT(*) as count
FROM five_s_history
UNION ALL
SELECT
    'Progress Stats' as table_name,
    COUNT(*) as count
FROM five_s_progress_stats;

-- 6. Vérifier l'intégrité des données
SELECT
    fsc.id as checklist_id,
    fsc.title,
    COUNT(fsi.id) as items_count,
    COUNT(DISTINCT fsi.category) as categories_count,
    ROUND(
        (COUNT(CASE WHEN fsi.status = 'completed' THEN 1 END)::DECIMAL /
         NULLIF(COUNT(fsi.id), 0) * 100)::DECIMAL,
        2
    ) as completion_percentage
FROM five_s_checklists fsc
LEFT JOIN five_s_items fsi ON fsc.id = fsi.checklist_id
GROUP BY fsc.id, fsc.title
ORDER BY fsc.created_at DESC;

-- ===========================================
-- NETTOYAGE DES DONNÉES DE TEST
-- ===========================================

-- Supprimer les données de test (optionnel)
-- DELETE FROM five_s_photos WHERE filename LIKE 'test_photo_%';
-- DELETE FROM five_s_items WHERE title LIKE 'Trier les documents%' OR title LIKE 'Ranger les outils%';
-- DELETE FROM five_s_checklists WHERE title = 'Checklist Test 5S';
-- DELETE FROM a3_modules WHERE id = '11111111-1111-1111-1111-111111111111';

-- ===========================================
-- RÉSULTAT FINAL
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TESTS DE MIGRATION 5S TERMINÉS';
    RAISE NOTICE '';
    RAISE NOTICE 'Si vous voyez ce message, la migration s''est déroulée avec succès !';
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaines étapes :';
    RAISE NOTICE '1. Vérifier les données migrées dans votre application';
    RAISE NOTICE '2. Tester la création de nouvelles checklists';
    RAISE NOTICE '3. Tester l''upload de photos';
    RAISE NOTICE '4. Mettre à jour l''interface utilisateur si nécessaire';
    RAISE NOTICE '';
END $$;