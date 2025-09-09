-- Migration pour les tables du module 5S
-- Créé le: 2025-09-07

-- ===========================================
-- TABLES PRINCIPALES DU MODULE 5S
-- ===========================================

-- Table des checklists 5S (remplace le stockage dans a3_modules.content)
CREATE TABLE IF NOT EXISTS five_s_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES a3_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Checklist 5S',
    description TEXT,
    area VARCHAR(255), -- Zone/poste de travail
    responsible_user_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    target_completion_date DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des items 5S (remplace les arrays dans content)
CREATE TABLE IF NOT EXISTS five_s_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID NOT NULL REFERENCES five_s_checklists(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id),
    position INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des assignations d'utilisateurs aux items 5S
CREATE TABLE IF NOT EXISTS five_s_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES five_s_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(50) DEFAULT 'responsible' CHECK (role IN ('responsible', 'collaborator', 'reviewer')),
    UNIQUE(item_id, user_id)
);

-- ===========================================
-- GESTION DES PHOTOS 5S
-- ===========================================

-- Table pour stocker les informations des photos
CREATE TABLE IF NOT EXISTS five_s_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES five_s_items(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES five_s_checklists(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Chemin dans le storage Supabase
    file_size INTEGER,
    mime_type VARCHAR(100),
    photo_type VARCHAR(50) DEFAULT 'before' CHECK (photo_type IN ('before', 'after', 'progress', 'reference')),
    description TEXT,
    taken_at TIMESTAMP WITH TIME ZONE,
    taken_by UUID REFERENCES auth.users(id),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (item_id IS NOT NULL AND checklist_id IS NULL) OR
        (item_id IS NULL AND checklist_id IS NOT NULL)
    )
);

-- Table pour les commentaires sur les photos
CREATE TABLE IF NOT EXISTS five_s_photo_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES five_s_photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- TABLES DE SUIVI ET HISTORIQUE
-- ===========================================

-- Table pour l'historique des modifications
CREATE TABLE IF NOT EXISTS five_s_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID REFERENCES five_s_checklists(id) ON DELETE CASCADE,
    item_id UUID REFERENCES five_s_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'completed', 'assigned', etc.
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les statistiques de progression
CREATE TABLE IF NOT EXISTS five_s_progress_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID NOT NULL REFERENCES five_s_checklists(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    in_progress_items INTEGER DEFAULT 0,
    pending_items INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(checklist_id, date)
);

-- ===========================================
-- INDEXES POUR LES PERFORMANCES
-- ===========================================

-- Indexes sur les clés étrangères fréquemment utilisées
CREATE INDEX IF NOT EXISTS idx_five_s_checklists_module_id ON five_s_checklists(module_id);
CREATE INDEX IF NOT EXISTS idx_five_s_checklists_status ON five_s_checklists(status);
CREATE INDEX IF NOT EXISTS idx_five_s_items_checklist_id ON five_s_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_five_s_items_category ON five_s_items(category);
CREATE INDEX IF NOT EXISTS idx_five_s_items_status ON five_s_items(status);
CREATE INDEX IF NOT EXISTS idx_five_s_items_assigned_to ON five_s_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_five_s_assignments_item_id ON five_s_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_five_s_assignments_user_id ON five_s_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_five_s_photos_item_id ON five_s_photos(item_id);
CREATE INDEX IF NOT EXISTS idx_five_s_photos_checklist_id ON five_s_photos(checklist_id);
CREATE INDEX IF NOT EXISTS idx_five_s_history_checklist_id ON five_s_history(checklist_id);
CREATE INDEX IF NOT EXISTS idx_five_s_history_item_id ON five_s_history(item_id);

-- ===========================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- ===========================================

-- Activer RLS sur toutes les tables
ALTER TABLE five_s_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_s_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_s_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_s_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_s_photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_s_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_s_progress_stats ENABLE ROW LEVEL SECURITY;

-- Politiques pour five_s_checklists
CREATE POLICY "Users can view checklists they have access to" ON five_s_checklists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM a3_modules am
            JOIN projects p ON am.project_id = p.id
            LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
            WHERE am.id = five_s_checklists.module_id
            AND (p.pilote = auth.uid() OR pm.user_id IS NOT NULL)
        )
    );

CREATE POLICY "Users can create checklists for modules they can access" ON five_s_checklists
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM a3_modules am
            JOIN projects p ON am.project_id = p.id
            LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid()
            WHERE am.id = module_id
            AND (p.pilote = auth.uid() OR pm.user_id IS NOT NULL)
        )
    );

CREATE POLICY "Users can update checklists they created or are assigned to" ON five_s_checklists
    FOR UPDATE USING (
        created_by = auth.uid() OR
        responsible_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM a3_modules am
            JOIN projects p ON am.project_id = p.id
            WHERE am.id = module_id AND p.pilote = auth.uid()
        )
    );

-- Politiques similaires pour les autres tables...
-- (Politiques détaillées pour chaque table selon les besoins d'accès)

-- ===========================================
-- FONCTIONS UTILES
-- ===========================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_five_s_checklists_updated_at BEFORE UPDATE ON five_s_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_five_s_items_updated_at BEFORE UPDATE ON five_s_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_five_s_photos_updated_at BEFORE UPDATE ON five_s_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer les statistiques de progression
CREATE OR REPLACE FUNCTION calculate_5s_progress(checklist_uuid UUID)
RETURNS TABLE (
    total_items BIGINT,
    completed_items BIGINT,
    completion_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_items,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL /
             NULLIF(COUNT(*), 0) * 100)::DECIMAL,
            2
        ) as completion_percentage
    FROM five_s_items
    WHERE checklist_id = checklist_uuid;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- DONNÉES DE TEST (optionnel)
-- ===========================================

-- Insérer quelques données de test si nécessaire
-- INSERT INTO five_s_checklists (module_id, title, description, created_by)
-- VALUES ('your-module-id', 'Checklist Atelier Production', 'Évaluation 5S de l''atelier', 'your-user-id');

COMMENT ON TABLE five_s_checklists IS 'Checklists principales du module 5S';
COMMENT ON TABLE five_s_items IS 'Items individuels des checklists 5S';
COMMENT ON TABLE five_s_assignments IS 'Assignations utilisateurs aux items 5S';
COMMENT ON TABLE five_s_photos IS 'Photos associées aux checklists et items 5S';
COMMENT ON TABLE five_s_photo_comments IS 'Commentaires sur les photos 5S';
COMMENT ON TABLE five_s_history IS 'Historique des modifications du module 5S';
COMMENT ON TABLE five_s_progress_stats IS 'Statistiques de progression des checklists 5S';