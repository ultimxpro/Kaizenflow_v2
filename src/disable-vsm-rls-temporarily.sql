-- Script pour DÉSACTIVER temporairement RLS sur les tables VSM
-- Permet de tester le système VSM sans problèmes de sécurité
-- À utiliser seulement pour les tests, puis réactiver RLS

-- =====================================================
-- DÉSACTIVATION TEMPORAIRE DE RLS
-- =====================================================

-- Désactiver RLS sur toutes les tables VSM
ALTER TABLE vsm_maps DISABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_elements DISABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_comments DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que RLS est désactivé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'vsm_%'
ORDER BY tablename;

-- =====================================================
-- TEST RAPIDE
-- =====================================================

-- Vous pouvez maintenant tester avec ces requêtes :
/*
-- Test d'insertion (devrait marcher maintenant)
INSERT INTO vsm_maps (module_id, title, customer_demand, opening_time, time_unit)
VALUES ('your-module-id', 'Test Map', 1000, 480, 'minutes')
RETURNING id;

-- Test de lecture
SELECT * FROM vsm_maps;
SELECT * FROM vsm_elements;
SELECT * FROM vsm_connections;
*/

-- =====================================================
-- POUR RÉACTIVER RLS PLUS TARD
-- =====================================================

/*
-- Quand tout fonctionne, réactivez RLS avec :
ALTER TABLE vsm_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_comments ENABLE ROW LEVEL SECURITY;

-- Puis exécutez le script fix-vsm-rls-simple.sql pour recréer les politiques
*/