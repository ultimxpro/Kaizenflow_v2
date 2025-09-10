-- Vérification détaillée de l'état du bucket avatars après correction

-- 1. Vérifier tous les buckets existants
SELECT 
  'Tous les buckets existants' as section,
  name,
  id,
  public,
  created_at
FROM storage.buckets
ORDER BY name;

-- 2. Vérifier spécifiquement le bucket avatars
SELECT
  'Bucket avatars spécifique' as section,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Bucket avatars existe'
    ELSE '❌ Bucket avatars n''existe pas'
  END as status,
  COUNT(*) as count
FROM storage.buckets
WHERE name = 'avatars';

-- 3. Vérifier les politiques RLS pour avatars
SELECT
  'Politiques RLS avatars' as section,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN length(qual) > 100 THEN substring(qual from 1 for 100) || '...'
    ELSE qual
  END as condition_resume
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'avatars_%'
ORDER BY policyname;

-- 4. Test d'accès au bucket avatars via API
SELECT
  'Test API Storage' as section,
  'Tentez de faire un appel getBucket(''avatars'') depuis votre application' as instruction,
  'Si erreur 400, il y a un problème de permissions ou de configuration' as note;

-- 5. Vérifier les permissions actuelles
SELECT
  'Permissions utilisateur' as section,
  current_user as postgres_user,
  session_user as session_user,
  'authenticated' as expected_supabase_role;

-- 6. Alternative: Recréer le bucket avec un nom différent
SELECT
  'Alternative de test' as section,
  'Essayez de créer un bucket test-avatars pour voir si le problème persiste' as suggestion;