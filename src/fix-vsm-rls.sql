-- Script SQL pour corriger les politiques RLS des tables VSM
-- À exécuter dans Supabase SQL Editor

-- =====================================================
-- POLITIQUES RLS POUR LES TABLES VSM
-- =====================================================

-- Activer RLS sur toutes les tables VSM
ALTER TABLE vsm_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vsm_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES POUR vsm_maps
-- =====================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view VSM maps they have access to" ON vsm_maps;
DROP POLICY IF EXISTS "Users can create VSM maps in their projects" ON vsm_maps;
DROP POLICY IF EXISTS "Users can update VSM maps they have access to" ON vsm_maps;
DROP POLICY IF EXISTS "Users can delete VSM maps they have access to" ON vsm_maps;

-- Fonction helper pour vérifier l'accès au projet d'un module
CREATE OR REPLACE FUNCTION can_access_vsm_module(module_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM a3_modules am
    JOIN project_members pm ON am.project_id = pm.project_id
    WHERE am.id = module_id_param
    AND pm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique SELECT : Voir les cartes VSM des modules auxquels on a accès
CREATE POLICY "Users can view VSM maps they have access to" ON vsm_maps
    FOR SELECT USING (can_access_vsm_module(module_id));

-- Politique INSERT : Créer des cartes VSM pour les modules auxquels on a accès
CREATE POLICY "Users can create VSM maps in their projects" ON vsm_maps
    FOR INSERT WITH CHECK (can_access_vsm_module(module_id));

-- Politique UPDATE : Modifier les cartes VSM des modules auxquels on a accès
CREATE POLICY "Users can update VSM maps they have access to" ON vsm_maps
    FOR UPDATE USING (can_access_vsm_module(module_id));

-- Politique DELETE : Supprimer les cartes VSM des modules auxquels on a accès
CREATE POLICY "Users can delete VSM maps they have access to" ON vsm_maps
    FOR DELETE USING (can_access_vsm_module(module_id));

-- =====================================================
-- POLITIQUES POUR vsm_elements
-- =====================================================

DROP POLICY IF EXISTS "Users can view VSM elements they have access to" ON vsm_elements;
DROP POLICY IF EXISTS "Users can create VSM elements in their projects" ON vsm_elements;
DROP POLICY IF EXISTS "Users can update VSM elements they have access to" ON vsm_elements;
DROP POLICY IF EXISTS "Users can delete VSM elements they have access to" ON vsm_elements;

-- Fonction helper pour vérifier l'accès à une carte VSM
CREATE OR REPLACE FUNCTION can_access_vsm_map(map_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vsm_maps vm
    WHERE vm.id = map_id_param
    AND can_access_vsm_module(vm.module_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique SELECT : Voir les éléments des cartes VSM auxquelles on a accès
CREATE POLICY "Users can view VSM elements they have access to" ON vsm_elements
    FOR SELECT USING (can_access_vsm_map(map_id));

-- Politique INSERT : Créer des éléments dans les cartes VSM auxquelles on a accès
CREATE POLICY "Users can create VSM elements in their projects" ON vsm_elements
    FOR INSERT WITH CHECK (can_access_vsm_map(map_id));

-- Politique UPDATE : Modifier les éléments des cartes VSM auxquelles on a accès
CREATE POLICY "Users can update VSM elements they have access to" ON vsm_elements
    FOR UPDATE USING (can_access_vsm_map(map_id));

-- Politique DELETE : Supprimer les éléments des cartes VSM auxquelles on a accès
CREATE POLICY "Users can delete VSM elements they have access to" ON vsm_elements
    FOR DELETE USING (can_access_vsm_map(map_id));

-- =====================================================
-- POLITIQUES POUR vsm_connections
-- =====================================================

DROP POLICY IF EXISTS "Users can view VSM connections they have access to" ON vsm_connections;
DROP POLICY IF EXISTS "Users can create VSM connections in their projects" ON vsm_connections;
DROP POLICY IF EXISTS "Users can update VSM connections they have access to" ON vsm_connections;
DROP POLICY IF EXISTS "Users can delete VSM connections they have access to" ON vsm_connections;

-- Politique SELECT : Voir les connexions des cartes VSM auxquelles on a accès
CREATE POLICY "Users can view VSM connections they have access to" ON vsm_connections
    FOR SELECT USING (can_access_vsm_map(map_id));

-- Politique INSERT : Créer des connexions dans les cartes VSM auxquelles on a accès
CREATE POLICY "Users can create VSM connections in their projects" ON vsm_connections
    FOR INSERT WITH CHECK (can_access_vsm_map(map_id));

-- Politique UPDATE : Modifier les connexions des cartes VSM auxquelles on a accès
CREATE POLICY "Users can update VSM connections they have access to" ON vsm_connections
    FOR UPDATE USING (can_access_vsm_map(map_id));

-- Politique DELETE : Supprimer les connexions des cartes VSM auxquelles on a accès
CREATE POLICY "Users can delete VSM connections they have access to" ON vsm_connections
    FOR DELETE USING (can_access_vsm_map(map_id));

-- =====================================================
-- POLITIQUES POUR vsm_snapshots
-- =====================================================

DROP POLICY IF EXISTS "Users can view VSM snapshots they have access to" ON vsm_snapshots;
DROP POLICY IF EXISTS "Users can create VSM snapshots in their projects" ON vsm_snapshots;
DROP POLICY IF EXISTS "Users can delete VSM snapshots they have access to" ON vsm_snapshots;

-- Politique SELECT : Voir les snapshots des cartes VSM auxquelles on a accès
CREATE POLICY "Users can view VSM snapshots they have access to" ON vsm_snapshots
    FOR SELECT USING (can_access_vsm_map(map_id));

-- Politique INSERT : Créer des snapshots dans les cartes VSM auxquelles on a accès
CREATE POLICY "Users can create VSM snapshots in their projects" ON vsm_snapshots
    FOR INSERT WITH CHECK (can_access_vsm_map(map_id));

-- Politique DELETE : Supprimer les snapshots des cartes VSM auxquelles on a accès
CREATE POLICY "Users can delete VSM snapshots they have access to" ON vsm_snapshots
    FOR DELETE USING (can_access_vsm_map(map_id));

-- =====================================================
-- POLITIQUES POUR vsm_comments
-- =====================================================

DROP POLICY IF EXISTS "Users can view VSM comments they have access to" ON vsm_comments;
DROP POLICY IF EXISTS "Users can create VSM comments in their projects" ON vsm_comments;
DROP POLICY IF EXISTS "Users can update VSM comments they have access to" ON vsm_comments;
DROP POLICY IF EXISTS "Users can delete VSM comments they have access to" ON vsm_comments;

-- Politique SELECT : Voir les commentaires des cartes VSM auxquelles on a accès
CREATE POLICY "Users can view VSM comments they have access to" ON vsm_comments
    FOR SELECT USING (can_access_vsm_map(map_id));

-- Politique INSERT : Créer des commentaires dans les cartes VSM auxquelles on a accès
CREATE POLICY "Users can create VSM comments in their projects" ON vsm_comments
    FOR INSERT WITH CHECK (can_access_vsm_map(map_id));

-- Politique UPDATE : Modifier ses propres commentaires
CREATE POLICY "Users can update VSM comments they have access to" ON vsm_comments
    FOR UPDATE USING (can_access_vsm_map(map_id) AND user_id = auth.uid());

-- Politique DELETE : Supprimer ses propres commentaires
CREATE POLICY "Users can delete VSM comments they have access to" ON vsm_comments
    FOR DELETE USING (can_access_vsm_map(map_id) AND user_id = auth.uid());

-- =====================================================
-- VÉRIFICATION DES POLITIQUES
-- =====================================================

-- Afficher toutes les politiques RLS pour vérifier
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'vsm_%'
ORDER BY tablename, policyname;

-- =====================================================
-- TEST DES POLITIQUES (optionnel)
-- =====================================================

-- Vous pouvez tester avec ces requêtes (remplacez les UUIDs par des valeurs réelles) :
/*
-- Test SELECT
SELECT * FROM vsm_maps WHERE module_id = 'your-module-id';

-- Test INSERT
INSERT INTO vsm_maps (module_id, title, customer_demand, opening_time, time_unit)
VALUES ('your-module-id', 'Test Map', 1000, 480, 'minutes');

-- Test avec un utilisateur qui n'a pas accès (devrait échouer)
-- Connectez-vous avec un autre utilisateur et essayez les mêmes requêtes
*/