-- Script SQL simplifié pour corriger RLS VSM
-- Supprime d'abord les fonctions existantes puis les recrée

-- =====================================================
-- SUPPRESSION DES FONCTIONS EXISTANTES
-- =====================================================

DROP FUNCTION IF EXISTS can_access_vsm_module(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_access_vsm_map(UUID) CASCADE;

-- =====================================================
-- RECRÉATION DES FONCTIONS
-- =====================================================

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

-- =====================================================
-- SUPPRESSION ET RECRÉATION DES POLITIQUES
-- =====================================================

-- Supprimer toutes les politiques existantes pour les tables VSM
DROP POLICY IF EXISTS "Users can view VSM maps they have access to" ON vsm_maps;
DROP POLICY IF EXISTS "Users can create VSM maps in their projects" ON vsm_maps;
DROP POLICY IF EXISTS "Users can update VSM maps they have access to" ON vsm_maps;
DROP POLICY IF EXISTS "Users can delete VSM maps they have access to" ON vsm_maps;

DROP POLICY IF EXISTS "Users can view VSM elements they have access to" ON vsm_elements;
DROP POLICY IF EXISTS "Users can create VSM elements in their projects" ON vsm_elements;
DROP POLICY IF EXISTS "Users can update VSM elements they have access to" ON vsm_elements;
DROP POLICY IF EXISTS "Users can delete VSM elements they have access to" ON vsm_elements;

DROP POLICY IF EXISTS "Users can view VSM connections they have access to" ON vsm_connections;
DROP POLICY IF EXISTS "Users can create VSM connections in their projects" ON vsm_connections;
DROP POLICY IF EXISTS "Users can update VSM connections they have access to" ON vsm_connections;
DROP POLICY IF EXISTS "Users can delete VSM connections they have access to" ON vsm_connections;

-- =====================================================
-- CRÉATION DES NOUVELLES POLITIQUES
-- =====================================================

-- Politiques pour vsm_maps
CREATE POLICY "Users can view VSM maps they have access to" ON vsm_maps
    FOR SELECT USING (can_access_vsm_module(module_id));

CREATE POLICY "Users can create VSM maps in their projects" ON vsm_maps
    FOR INSERT WITH CHECK (can_access_vsm_module(module_id));

CREATE POLICY "Users can update VSM maps they have access to" ON vsm_maps
    FOR UPDATE USING (can_access_vsm_module(module_id));

CREATE POLICY "Users can delete VSM maps they have access to" ON vsm_maps
    FOR DELETE USING (can_access_vsm_module(module_id));

-- Politiques pour vsm_elements
CREATE POLICY "Users can view VSM elements they have access to" ON vsm_elements
    FOR SELECT USING (can_access_vsm_map(map_id));

CREATE POLICY "Users can create VSM elements in their projects" ON vsm_elements
    FOR INSERT WITH CHECK (can_access_vsm_map(map_id));

CREATE POLICY "Users can update VSM elements they have access to" ON vsm_elements
    FOR UPDATE USING (can_access_vsm_map(map_id));

CREATE POLICY "Users can delete VSM elements they have access to" ON vsm_elements
    FOR DELETE USING (can_access_vsm_map(map_id));

-- Politiques pour vsm_connections
CREATE POLICY "Users can view VSM connections they have access to" ON vsm_connections
    FOR SELECT USING (can_access_vsm_map(map_id));

CREATE POLICY "Users can create VSM connections in their projects" ON vsm_connections
    FOR INSERT WITH CHECK (can_access_vsm_map(map_id));

CREATE POLICY "Users can update VSM connections they have access to" ON vsm_connections
    FOR UPDATE USING (can_access_vsm_map(map_id));

CREATE POLICY "Users can delete VSM connections they have access to" ON vsm_connections
    FOR DELETE USING (can_access_vsm_map(map_id));

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Afficher les politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'vsm_%'
ORDER BY tablename, policyname;