-- Script de correction des politiques RLS pour le stockage 5S - Version 2
-- Ce script corrige les politiques qui vérifient le mauvais élément du chemin
-- Supprimer les anciennes politiques défaillantes
DROP POLICY IF EXISTS "5s_photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "5s_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "5s_photos_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "5s_photos_read_policy" ON storage.objects;
-- Créer les nouvelles politiques corrigées
-- Pour l'insertion : vérifier que le chemin commence par '5s_photos/'
CREATE POLICY "5s_photos_insert_policy" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = '5s-photos'::text
  AND auth.role() = 'authenticated'::text
  AND name LIKE '5s_photos/%'
);
-- Pour la lecture : permettre aux utilisateurs authentifiés de voir leurs photos
CREATE POLICY "5s_photos_read_policy" ON storage.objects FOR SELECT USING (
  bucket_id = '5s-photos'::text
  AND auth.role() = 'authenticated'::text
);
-- Pour la mise à jour : vérifier que le chemin commence par '5s_photos/'
CREATE POLICY "5s_photos_update_policy" ON storage.objects FOR UPDATE USING (
  bucket_id = '5s-photos'::text
  AND auth.role() = 'authenticated'::text
  AND name LIKE '5s_photos/%'
);
-- Pour la suppression : vérifier que le chemin commence par '5s_photos/'
CREATE POLICY "5s_photos_delete_policy" ON storage.objects FOR DELETE USING (
  bucket_id = '5s-photos'::text
  AND auth.role() = 'authenticated'::text
  AND name LIKE '5s_photos/%'
);
-- Vérifier que le bucket existe
SELECT
  id,
  name,
  created_at,
  updated_at,
  public
FROM storage.buckets
WHERE name = '5s-photos';
-- Vérifier les politiques actuelles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '5s_photos%'
ORDER BY policyname;
-- Tester l'accès aux objets du bucket
SELECT
  COUNT(*) as total_objects,
  COUNT(CASE WHEN name LIKE '5s_photos/%' THEN 1 END) as photos_5s,
  COUNT(CASE WHEN name NOT LIKE '5s_photos/%' THEN 1 END) as autres
FROM storage.objects
WHERE bucket_id = '5s-photos';
-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Politiques RLS corrigées pour le stockage 5S';
  RAISE NOTICE 'Les chemins doivent commencer par ''5s_photos/'' pour être autorisés';
  RAISE NOTICE 'Vérifiez que le bucket ''5s-photos'' existe bien';
END $$;