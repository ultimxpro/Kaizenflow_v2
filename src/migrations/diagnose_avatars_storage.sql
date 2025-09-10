-- Script de diagnostic pour le bucket avatars
-- Vérifie l'existence du bucket et les politiques RLS

-- 1. Vérifier l'existence du bucket avatars
SELECT
  'Bucket avatars Status' as check_type,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Bucket ''avatars'' existe'
    ELSE '❌ Bucket ''avatars'' manquant - À créer'
  END as status,
  id,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'avatars'
GROUP BY id, public, file_size_limit, allowed_mime_types;

-- 2. Vérifier les politiques RLS pour les avatars
SELECT
  'Avatar RLS Policies' as check_type,
  policyname as nom,
  cmd as operation,
  qual as condition,
  with_check as check_condition
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (policyname LIKE '%avatar%' OR qual LIKE '%avatar%');

-- 3. Vérifier tous les buckets existants
SELECT
  'All Buckets' as section,
  name,
  id,
  public,
  created_at
FROM storage.buckets
ORDER BY name;

-- 4. Vérifier les objets dans le bucket avatars (si il existe)
SELECT
  'Avatar Objects' as section,
  COUNT(*) as total_files,
  string_agg(DISTINCT substring(name from 1 for 50), ', ') as sample_files
FROM storage.objects
WHERE bucket_id = 'avatars'
  OR bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'avatars');

-- 5. Test de permissions utilisateur
SELECT
  'User Permissions' as section,
  auth.uid() as current_user_id,
  auth.role() as current_role,
  CASE
    WHEN auth.role() = 'authenticated' THEN '✅ Utilisateur authentifié'
    WHEN auth.role() = 'anon' THEN '⚠️ Utilisateur anonyme'
    ELSE '❌ Rôle inconnu: ' || auth.role()
  END as auth_status;

-- 6. Vérifier les politiques générales sur storage.objects
SELECT
  'Storage Object Policies' as section,
  policyname,
  cmd,
  roles,
  CASE
    WHEN qual IS NOT NULL THEN substring(qual from 1 for 100) || '...'
    ELSE 'No condition'
  END as condition_preview
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Message d'information
DO $$
BEGIN
  RAISE NOTICE '=== DIAGNOSTIC BUCKET AVATARS ===';
  RAISE NOTICE 'Ce script vérifie l''état du bucket avatars et ses politiques';
  RAISE NOTICE 'Si le bucket n''existe pas, il doit être créé';
  RAISE NOTICE 'Si les politiques sont restrictives, elles doivent être ajustées';
END $$;