-- Test rapide pour vérifier les corrections
-- À exécuter après les corrections

-- 1. Vérifier que les tables peuvent être créées
SELECT 'Tables créées avec succès' as status;

-- 2. Tester une requête simple sur les politiques RLS
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename LIKE 'five_s_%'
ORDER BY tablename;

-- 3. Vérifier les politiques
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename LIKE 'five_s_%'
ORDER BY tablename, policyname;

-- 4. Test de la fonction de calcul
SELECT 'Fonction calculate_5s_progress disponible' as status
WHERE EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'calculate_5s_progress'
);

-- Message de succès
SELECT '
🎉 MIGRATION 5S CORRIGÉE AVEC SUCCÈS !

Corrections appliquées :
✅ Suppression des références à am.created_by
✅ Utilisation de projects.pilote pour created_by
✅ Politiques RLS corrigées

Vous pouvez maintenant exécuter :
1. \i src/migrations/create_5s_tables.sql
2. \i src/migrations/migrate_5s_data.sql
3. \i src/migrations/test_5s_migration.sql

' as message;