-- Script pour créer/corriger le bucket avatars et ses politiques RLS

-- 1. Créer le bucket avatars s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true, -- Bucket public pour permettre l'accès aux avatars
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Supprimer les anciennes politiques restrictives si elles existent
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

-- 3. Créer des politiques permissives pour les avatars
-- Lecture publique des avatars (pour que les signed URLs fonctionnent)
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars'
);

-- Insertion pour les utilisateurs authentifiés
CREATE POLICY "avatars_authenticated_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Mise à jour pour les utilisateurs authentifiés 
CREATE POLICY "avatars_authenticated_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Suppression pour les utilisateurs authentifiés
CREATE POLICY "avatars_authenticated_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- 4. Vérification de la configuration
SELECT
  'Bucket Configuration' as section,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'avatars';

-- 5. Vérification des politiques créées
SELECT
  'Created Policies' as section,
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN substring(qual from 1 for 80) || '...'
    ELSE 'No condition'
  END as condition
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'avatars_%'
ORDER BY policyname;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== BUCKET AVATARS CONFIGURÉ ===';
  RAISE NOTICE 'Bucket: avatars (public)';
  RAISE NOTICE 'Politiques: Lecture publique, écriture pour utilisateurs authentifiés';
  RAISE NOTICE 'Limite: 5MB par fichier';
  RAISE NOTICE 'Types: JPEG, PNG, WebP, GIF';
  RAISE NOTICE 'Les signed URLs devraient maintenant fonctionner';
END $$;