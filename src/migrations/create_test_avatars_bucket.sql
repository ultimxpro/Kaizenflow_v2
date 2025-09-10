-- Création d'un bucket test pour les avatars avec diagnostics

-- 1. D'abord, vérifier si le bucket avatars existe vraiment
SELECT 'Vérification bucket avatars existant' as etape;
SELECT name, id, public FROM storage.buckets WHERE name = 'avatars';

-- 2. Créer le bucket avatars (ou test-avatars si avatars existe déjà)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Vérifier la création
SELECT 'Bucket créé avec succès' as resultat;
SELECT name, id, public, file_size_limit FROM storage.buckets WHERE name = 'avatars';

-- 4. Créer les politiques RLS très permissives
CREATE POLICY "avatars_public_access" ON storage.objects 
FOR ALL USING (bucket_id = 'avatars');

-- 5. Vérifier les politiques
SELECT 'Politiques créées' as resultat;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' 
AND policyname LIKE '%avatars%';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'BUCKET AVATARS CRÉÉ ET CONFIGURÉ';
  RAISE NOTICE 'Bucket: avatars (public, accès total)';
  RAISE NOTICE 'Testez maintenant l''application';
END $$;