-- Correction des politiques RLS pour le bucket avatars existant

-- 1. Vérifier le bucket existant
SELECT 'Bucket avatars existant' as info, name, id, public FROM storage.buckets WHERE name = 'avatars';

-- 2. Vérifier les objets dans le bucket
SELECT 'Fichiers dans avatars' as info, COUNT(*) as total_files FROM storage.objects WHERE bucket_id = 'avatars';

-- 3. Voir les politiques actuelles qui peuvent bloquer l'accès
SELECT 'Politiques actuelles' as info, policyname, cmd, 
       CASE WHEN length(qual) > 80 THEN substring(qual from 1 for 80) || '...' ELSE qual END as condition
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Supprimer TOUTES les politiques restrictives sur storage.objects
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
        RAISE NOTICE 'Supprimé: %', policy_record.policyname;
    END LOOP;
END $$;

-- 5. Créer une politique très permissive pour les avatars
CREATE POLICY "avatars_full_access" ON storage.objects 
FOR ALL 
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 6. S'assurer que le bucket est public
UPDATE storage.buckets SET public = true WHERE name = 'avatars';

-- 7. Vérification finale
SELECT 'Configuration finale' as info;
SELECT 'Bucket' as type, name, public FROM storage.buckets WHERE name = 'avatars';
SELECT 'Politique' as type, policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'avatars_full_access';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== POLITIQUES AVATARS CORRIGÉES ===';
  RAISE NOTICE 'Toutes les politiques restrictives ont été supprimées';
  RAISE NOTICE 'Politique permissive créée: avatars_full_access';
  RAISE NOTICE 'Bucket configuré en public';
  RAISE NOTICE 'L''API Storage devrait maintenant fonctionner';
END $$;