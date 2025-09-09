-- Migration des données 5S existantes
-- Transfert des données depuis a3_modules.content vers les nouvelles tables

-- ===========================================
-- FONCTION DE MIGRATION
-- ===========================================

CREATE OR REPLACE FUNCTION migrate_5s_data()
RETURNS TABLE (
    migrated_checklists INTEGER,
    migrated_items INTEGER,
    errors TEXT[]
) AS $$
DECLARE
    module_record RECORD;
    checklist_record RECORD;
    item_record RECORD;
    new_checklist_id UUID;
    new_item_id UUID;
    error_messages TEXT[] := ARRAY[]::TEXT[];
    checklist_count INTEGER := 0;
    item_count INTEGER := 0;
BEGIN
    -- Parcourir tous les modules A3 de type '5S'
    FOR module_record IN
        SELECT id, project_id, content, created_at
        FROM a3_modules
        WHERE tool_type = '5S'
        AND content IS NOT NULL
        AND content != '{}'::jsonb
    LOOP
        BEGIN
            -- Créer une checklist pour chaque module 5S
            INSERT INTO five_s_checklists (
                module_id,
                title,
                description,
                created_by,
                created_at,
                updated_at
            )
            VALUES (
                module_record.id,
                COALESCE(module_record.content->>'title', 'Checklist 5S'),
                module_record.content->>'description',
                (SELECT p.pilote FROM projects p WHERE p.id = module_record.project_id),
                module_record.created_at,
                NOW()
            )
            RETURNING id INTO new_checklist_id;

            checklist_count := checklist_count + 1;

            -- Migrer les items de chaque catégorie 5S
            -- Seiri
            IF module_record.content ? 'seiri' AND jsonb_typeof(module_record.content->'seiri') = 'array' THEN
                FOR item_record IN
                    SELECT * FROM jsonb_array_elements(module_record.content->'seiri')
                LOOP
                    INSERT INTO five_s_items (
                        checklist_id,
                        category,
                        title,
                        status,
                        created_by,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        new_checklist_id,
                        'seiri',
                        COALESCE(item_record.value->>'text', ''),
                        CASE WHEN (item_record.value->>'checked')::boolean THEN 'completed' ELSE 'pending' END,
                        (SELECT p.pilote FROM projects p WHERE p.id = module_record.project_id),
                        module_record.created_at,
                        NOW()
                    );
                    item_count := item_count + 1;
                END LOOP;
            END IF;

            -- Seiton
            IF module_record.content ? 'seiton' AND jsonb_typeof(module_record.content->'seiton') = 'array' THEN
                FOR item_record IN
                    SELECT * FROM jsonb_array_elements(module_record.content->'seiton')
                LOOP
                    INSERT INTO five_s_items (
                        checklist_id,
                        category,
                        title,
                        status,
                        created_by,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        new_checklist_id,
                        'seiton',
                        COALESCE(item_record.value->>'text', ''),
                        CASE WHEN (item_record.value->>'checked')::boolean THEN 'completed' ELSE 'pending' END,
                        (SELECT p.pilote FROM projects p WHERE p.id = module_record.project_id),
                        module_record.created_at,
                        NOW()
                    );
                    item_count := item_count + 1;
                END LOOP;
            END IF;

            -- Seiso
            IF module_record.content ? 'seiso' AND jsonb_typeof(module_record.content->'seiso') = 'array' THEN
                FOR item_record IN
                    SELECT * FROM jsonb_array_elements(module_record.content->'seiso')
                LOOP
                    INSERT INTO five_s_items (
                        checklist_id,
                        category,
                        title,
                        status,
                        created_by,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        new_checklist_id,
                        'seiso',
                        COALESCE(item_record.value->>'text', ''),
                        CASE WHEN (item_record.value->>'checked')::boolean THEN 'completed' ELSE 'pending' END,
                        (SELECT p.pilote FROM projects p WHERE p.id = module_record.project_id),
                        module_record.created_at,
                        NOW()
                    );
                    item_count := item_count + 1;
                END LOOP;
            END IF;

            -- Seiketsu
            IF module_record.content ? 'seiketsu' AND jsonb_typeof(module_record.content->'seiketsu') = 'array' THEN
                FOR item_record IN
                    SELECT * FROM jsonb_array_elements(module_record.content->'seiketsu')
                LOOP
                    INSERT INTO five_s_items (
                        checklist_id,
                        category,
                        title,
                        status,
                        created_by,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        new_checklist_id,
                        'seiketsu',
                        COALESCE(item_record.value->>'text', ''),
                        CASE WHEN (item_record.value->>'checked')::boolean THEN 'completed' ELSE 'pending' END,
                        (SELECT p.pilote FROM projects p WHERE p.id = module_record.project_id),
                        module_record.created_at,
                        NOW()
                    );
                    item_count := item_count + 1;
                END LOOP;
            END IF;

            -- Shitsuke
            IF module_record.content ? 'shitsuke' AND jsonb_typeof(module_record.content->'shitsuke') = 'array' THEN
                FOR item_record IN
                    SELECT * FROM jsonb_array_elements(module_record.content->'shitsuke')
                LOOP
                    INSERT INTO five_s_items (
                        checklist_id,
                        category,
                        title,
                        status,
                        created_by,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        new_checklist_id,
                        'shitsuke',
                        COALESCE(item_record.value->>'text', ''),
                        CASE WHEN (item_record.value->>'checked')::boolean THEN 'completed' ELSE 'pending' END,
                        (SELECT p.pilote FROM projects p WHERE p.id = module_record.project_id),
                        module_record.created_at,
                        NOW()
                    );
                    item_count := item_count + 1;
                END LOOP;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            -- En cas d'erreur, ajouter le message à la liste des erreurs
            error_messages := array_append(error_messages, 'Module ' || module_record.id || ': ' || SQLERRM);
        END;
    END LOOP;

    -- Retourner les statistiques
    RETURN QUERY SELECT checklist_count, item_count, error_messages;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- EXÉCUTION DE LA MIGRATION
-- ===========================================

-- Créer une sauvegarde des données actuelles (recommandé)
CREATE TABLE IF NOT EXISTS backup_a3_modules_5s AS
SELECT * FROM a3_modules WHERE tool_type = '5S';

-- Exécuter la migration
SELECT * FROM migrate_5s_data();

-- ===========================================
-- NETTOYAGE APRÈS MIGRATION (à exécuter après vérification)
-- ===========================================

-- Une fois la migration vérifiée, on peut nettoyer l'ancien stockage
-- ATTENTION: Ne faire cela qu'après avoir vérifié que la migration s'est bien passée

-- UPDATE a3_modules
-- SET content = NULL
-- WHERE tool_type = '5S'
-- AND EXISTS (SELECT 1 FROM five_s_checklists WHERE module_id = a3_modules.id);

-- ===========================================
-- FONCTIONS UTILITAIRES POST-MIGRATION
-- ===========================================

-- Fonction pour vérifier l'intégrité des données migrées
CREATE OR REPLACE FUNCTION verify_5s_migration()
RETURNS TABLE (
    total_modules INTEGER,
    migrated_modules INTEGER,
    total_items_old INTEGER,
    total_items_new INTEGER,
    migration_status TEXT
) AS $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Compter les modules 5S
    SELECT COUNT(*) INTO total_modules FROM a3_modules WHERE tool_type = '5S';

    -- Compter les checklists migrées
    SELECT COUNT(*) INTO migrated_modules FROM five_s_checklists;

    -- Compter les anciens items (approximatif)
    SELECT
        COALESCE(array_length((content->'seiri')::text[], 1), 0) +
        COALESCE(array_length((content->'seiton')::text[], 1), 0) +
        COALESCE(array_length((content->'seiso')::text[], 1), 0) +
        COALESCE(array_length((content->'seiketsu')::text[], 1), 0) +
        COALESCE(array_length((content->'shitsuke')::text[], 1), 0)
    INTO old_count
    FROM a3_modules
    WHERE tool_type = '5S' AND content IS NOT NULL;

    -- Compter les nouveaux items
    SELECT COUNT(*) INTO new_count FROM five_s_items;

    -- Déterminer le statut
    migration_status := CASE
        WHEN migrated_modules = total_modules AND new_count >= old_count THEN 'SUCCESS'
        WHEN migrated_modules < total_modules THEN 'PARTIAL'
        ELSE 'ERROR'
    END;

    RETURN QUERY SELECT total_modules, migrated_modules, old_count, new_count, migration_status;
END;
$$ LANGUAGE plpgsql;

-- Vérifier la migration
SELECT * FROM verify_5s_migration();

-- ===========================================
-- INDEXES SUPPLÉMENTAIRES POUR LA MIGRATION
-- ===========================================

-- Index pour accélérer les requêtes de migration
CREATE INDEX IF NOT EXISTS idx_a3_modules_tool_type ON a3_modules(tool_type) WHERE tool_type = '5S';
CREATE INDEX IF NOT EXISTS idx_five_s_checklists_created_at ON five_s_checklists(created_at);
CREATE INDEX IF NOT EXISTS idx_five_s_items_created_at ON five_s_items(created_at);