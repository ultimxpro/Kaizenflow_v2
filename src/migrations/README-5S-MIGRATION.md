# Migration du Module 5S vers Supabase

## Vue d'ensemble

Ce document décrit la migration complète du module 5S depuis son stockage actuel dans `a3_modules.content` vers une architecture de base de données dédiée avec Supabase.

## Tables créées

### Tables principales
- **`five_s_checklists`** : Checklists principales du module 5S
- **`five_s_items`** : Items individuels avec statut et assignations
- **`five_s_assignments`** : Assignations utilisateurs aux items

### Tables pour les photos
- **`five_s_photos`** : Gestion des photos avant/après/progrès
- **`five_s_photo_comments`** : Commentaires sur les photos

### Tables de suivi
- **`five_s_history`** : Historique des modifications
- **`five_s_progress_stats`** : Statistiques de progression

## Instructions de migration

### 1. Préparation

Avant d'exécuter la migration, assurez-vous de :

```bash
# Sauvegarde de la base de données
pg_dump your_database > backup_before_5s_migration.sql

# Vérification des données existantes
SELECT COUNT(*) FROM a3_modules WHERE tool_type = '5S';
```

### ⚠️ **Corrections importantes apportées**

Les erreurs suivantes ont été corrigées dans les scripts :

1. **Erreur `am.created_by` n'existe pas** :
   - ❌ Avant : `SELECT created_by FROM a3_modules WHERE id = module_record.id`
   - ✅ Après : `SELECT p.pilote FROM projects p WHERE p.id = module_record.project_id`

2. **Politiques RLS corrigées** :
   - Supprimé les références à `am.created_by` dans les politiques de sécurité
   - Utilise uniquement `p.pilote` et `pm.user_id` pour l'accès

### 2. Test de la migration (optionnel mais recommandé)

Avant d'exécuter la vraie migration, vous pouvez tester avec des données fictives :

```sql
-- Dans Supabase SQL Editor :
\i src/migrations/test_5s_migration.sql
```

Ce script :
- ✅ Vérifie que toutes les tables existent
- ✅ Teste les politiques RLS
- ✅ Valide les fonctions utilitaires
- ✅ Crée des données de test
- ✅ Vérifie l'intégrité des données

### 2. Création des tables

Exécutez le script de création des tables dans Supabase :

```sql
-- Dans l'éditeur SQL de Supabase, exécutez :
\i src/migrations/create_5s_tables.sql
```

### 3. Migration des données

Exécutez la migration des données existantes :

```sql
-- Dans Supabase SQL Editor :
\i src/migrations/migrate_5s_data.sql
```

### 4. Vérification

Vérifiez que la migration s'est bien déroulée :

```sql
-- Vérifier les résultats
SELECT * FROM verify_5s_migration();

-- Compter les nouvelles données
SELECT
    (SELECT COUNT(*) FROM five_s_checklists) as checklists,
    (SELECT COUNT(*) FROM five_s_items) as items,
    (SELECT COUNT(*) FROM five_s_assignments) as assignments;
```

## Schéma des tables

### five_s_checklists
```sql
id UUID PRIMARY KEY
module_id UUID → a3_modules(id)
title VARCHAR(255)
description TEXT
area VARCHAR(255) -- Zone de travail
responsible_user_id UUID → auth.users(id)
status VARCHAR(50) -- 'draft', 'active', 'completed', 'archived'
target_completion_date DATE
created_by UUID → auth.users(id)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### five_s_items
```sql
id UUID PRIMARY KEY
checklist_id UUID → five_s_checklists(id)
category VARCHAR(50) -- 'seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'
title VARCHAR(500)
description TEXT
status VARCHAR(50) -- 'pending', 'in_progress', 'completed', 'cancelled'
priority VARCHAR(20) -- 'low', 'medium', 'high', 'critical'
assigned_to UUID → auth.users(id)
due_date DATE
completed_at TIMESTAMP
completed_by UUID → auth.users(id)
position INTEGER -- Pour l'ordre d'affichage
created_by UUID → auth.users(id)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### five_s_photos
```sql
id UUID PRIMARY KEY
item_id UUID → five_s_items(id) -- OU
checklist_id UUID → five_s_checklists(id) -- OU (mais pas les deux)
filename VARCHAR(255)
original_filename VARCHAR(255)
file_path TEXT -- Chemin dans Supabase Storage
file_size INTEGER
mime_type VARCHAR(100)
photo_type VARCHAR(50) -- 'before', 'after', 'progress', 'reference'
description TEXT
taken_at TIMESTAMP
taken_by UUID → auth.users(id)
location_lat DECIMAL(10,8) -- Géolocalisation
location_lng DECIMAL(11,8)
uploaded_by UUID → auth.users(id)
uploaded_at TIMESTAMP
```

## Politiques de sécurité (RLS)

Toutes les tables utilisent Row Level Security avec les politiques suivantes :

- **Lecture** : Utilisateurs ayant accès au projet via `project_members` ou propriétaires
- **Création** : Utilisateurs autorisés sur le module/projet
- **Modification** : Créateurs, responsables, ou pilotes de projet

## Utilisation des photos

### Upload de photos
```sql
-- Exemple d'insertion de photo
INSERT INTO five_s_photos (
    item_id,
    filename,
    original_filename,
    file_path,
    photo_type,
    description,
    uploaded_by
) VALUES (
    'item-uuid',
    'photo_20250907_143022.jpg',
    'Atelier_Avant_5S.jpg',
    '5s-photos/item-uuid/photo_20250907_143022.jpg',
    'before',
    'État initial de l''atelier avant application 5S',
    'user-uuid'
);
```

### Récupération des photos
```sql
-- Photos d'un item spécifique
SELECT * FROM five_s_photos
WHERE item_id = 'item-uuid'
ORDER BY uploaded_at DESC;

-- Toutes les photos d'une checklist
SELECT * FROM five_s_photos
WHERE checklist_id = 'checklist-uuid'
ORDER BY uploaded_at DESC;
```

## Fonctions utilitaires

### Calcul des statistiques
```sql
-- Obtenir les stats de progression d'une checklist
SELECT * FROM calculate_5s_progress('checklist-uuid');
```

### Mise à jour automatique des statistiques
```sql
-- Trigger pour mettre à jour les stats quand un item change
CREATE OR REPLACE FUNCTION update_5s_progress_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Logique pour mettre à jour five_s_progress_stats
    -- Se déclenche après INSERT/UPDATE/DELETE sur five_s_items
END;
$$ LANGUAGE plpgsql;
```

## Rollback en cas de problème

Si la migration échoue, vous pouvez restaurer :

```bash
# Restaurer la sauvegarde
psql your_database < backup_before_5s_migration.sql

# Ou supprimer les nouvelles tables
DROP TABLE IF EXISTS five_s_progress_stats;
DROP TABLE IF EXISTS five_s_history;
DROP TABLE IF EXISTS five_s_photo_comments;
DROP TABLE IF EXISTS five_s_photos;
DROP TABLE IF EXISTS five_s_assignments;
DROP TABLE IF EXISTS five_s_items;
DROP TABLE IF EXISTS five_s_checklists;
```

## Tests post-migration

Après la migration, testez :

1. **Accès aux checklists** : Vérifiez que les anciennes données sont accessibles
2. **Création de nouvelles données** : Testez l'ajout de nouveaux items
3. **Permissions** : Vérifiez que les RLS fonctionnent correctement
4. **Performance** : Comparez les temps de réponse

## Support des photos

### Configuration Supabase Storage

Créez un bucket `5s-photos` avec la structure :
```
5s-photos/
├── checklists/
│   └── {checklist_id}/
│       ├── before/
│       ├── after/
│       └── progress/
└── items/
    └── {item_id}/
        ├── before/
        ├── after/
        └── progress/
```

### Politiques Storage
```sql
-- Politique pour l'upload
CREATE POLICY "Users can upload 5S photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = '5s-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Politique pour la lecture
CREATE POLICY "Users can view 5S photos they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = '5s-photos'
        AND EXISTS (
            SELECT 1 FROM five_s_checklists fsc
            JOIN a3_modules am ON fsc.module_id = am.id
            WHERE am.id::text = (storage.foldername(name))[1]
        )
    );
```

## Migration côté application

Après la migration de la base de données, mettez à jour le code :

1. **Types TypeScript** : Ajoutez les nouvelles interfaces
2. **DatabaseContext** : Ajoutez les fonctions CRUD pour 5S
3. **FiveSEditor** : Refactorisez pour utiliser les nouvelles tables
4. **Migration des données côté client** : Si nécessaire

## Monitoring post-migration

Surveillez les métriques suivantes :

- **Performance** : Temps de réponse des requêtes
- **Utilisation** : Nombre de checklists créées/modifiées
- **Erreurs** : Logs d'erreur liés au module 5S
- **Stockage** : Utilisation du stockage pour les photos

---

## Checklist de validation

- [ ] **Test de migration exécuté** : `src/migrations/test_5s_migration.sql`
- [ ] Tables créées avec succès
- [ ] Données migrées sans erreur (utilise `projects.pilote` au lieu de `a3_modules.created_by`)
- [ ] Politiques RLS configurées
- [ ] Fonctions utilitaires opérationnelles (`calculate_5s_progress`, `verify_5s_migration`)
- [ ] Bucket de stockage créé (`5s-photos`)
- [ ] Permissions de stockage configurées
- [ ] Tests fonctionnels passés
- [ ] Code application mis à jour
- [ ] Utilisateurs informés de la migration

## Scripts disponibles

1. **`create_5s_tables.sql`** - Création des tables et politiques
2. **`migrate_5s_data.sql`** - Migration des données existantes
3. **`test_5s_migration.sql`** - Tests complets et validation (recommandé)
4. **`quick_test.sql`** - Test rapide après corrections
5. **`README-5S-MIGRATION.md`** - Cette documentation