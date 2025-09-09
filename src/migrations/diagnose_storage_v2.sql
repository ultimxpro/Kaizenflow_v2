-- Script de diagnostic du stockage 5S - Version 2
-- Vérifie l'état du bucket et des politiques après correction
-- 1. Vérifier l'existence du bucket
SELECT
  'Bucket Status' as check_type,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Bucket ''5s-photos'' existe'
    ELSE '❌ Bucket ''5s-photos'' manquant - À créer'
  END as status,
  COUNT(*) as count
FROM storage.buckets
WHERE name = '5s-photos'
UNION ALL
-- 2. Vérifier les politiques RLS
SELECT
  'RLS Policies' as check_type,
  CASE
    WHEN COUNT(*) >= 4 THEN '✅ 4 politiques RLS présentes'
    ELSE '❌ Politiques RLS manquantes - ' || COUNT(*)::text || '/4 présentes'
  END as status,
  COUNT(*) as count
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '5s_photos%'
UNION ALL
-- 3. Vérifier les objets existants
SELECT
  'Storage Objects' as check_type,
  CASE
    WHEN COUNT(*) > 0 THEN 'ℹ️ ' || COUNT(*)::text || ' objets dans le bucket'
    ELSE 'ℹ️ Aucun objet dans le bucket'
  END as status,
  COUNT(*) as count
FROM storage.objects
WHERE bucket_id = '5s-photos';
-- 4. Détails des politiques actuelles
SELECT
  'Politiques RLS actuelles' as section,
  policyname as nom,
  cmd as operation,
  CASE
    WHEN qual LIKE '%name LIKE ''5s_photos/%''' THEN '✅ Chemin correct'
    ELSE '❌ Chemin incorrect'
  END as validation_chemin,
  qual as condition
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '5s_photos%'
ORDER BY policyname;
-- 5. Test de simulation d'upload
SELECT
  'Test Simulation Upload' as section,
  'Chemin: 5s_photos/test_123.jpg' as exemple_chemin,
  CASE
    WHEN '5s_photos/test_123.jpg' LIKE '5s_photos/%' THEN '✅ Chemin valide pour upload'
    ELSE '❌ Chemin invalide pour upload'
  END as validation,
  'Politiques RLS devraient autoriser' as remarque;
-- 6. Vérifier les permissions utilisateur
SELECT
  'Permissions Utilisateur' as section,
  CASE
    WHEN auth.role() = 'authenticated' THEN '✅ Utilisateur authentifié'
    ELSE '❌ Utilisateur non authentifié'
  END as status_auth,
  auth.uid() as user_id,
  auth.role() as role;
-- 7. Résumé des problèmes identifiés
WITH diagnostics AS (
  SELECT
    CASE WHEN (SELECT COUNT(*) FROM storage.buckets WHERE name = '5s-photos') = 0 THEN 1 ELSE 0 END as bucket_missing,
    CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '5s_photos%') < 4 THEN 1 ELSE 0 END as policies_missing,
    CASE WHEN auth.role() != 'authenticated' THEN 1 ELSE 0 END as auth_issue
)
SELECT
  'Résumé Diagnostic' as section,
  CASE
    WHEN bucket_missing = 1 THEN '❌ Créer le bucket ''5s-photos'''
    WHEN policies_missing = 1 THEN '❌ Appliquer les politiques RLS corrigées'
    WHEN auth_issue = 1 THEN '❌ Problème d''authentification'
    ELSE '✅ Configuration correcte - Test d''upload possible'
  END as statut_global,
  'Vérifiez les détails ci-dessus' as recommandations
FROM diagnostics;
-- Message d'aide
DO $$
BEGIN
  RAISE NOTICE '=== DIAGNOSTIC STOCKAGE 5S ===';
  RAISE NOTICE 'Si des ❌ sont présents, appliquez fix_storage_policies_v2.sql';
  RAISE NOTICE 'Puis testez l''upload de photos dans l''application';
  RAISE NOTICE 'Le chemin d''upload doit être: 5s_photos/nom_fichier.jpg';
END $$;