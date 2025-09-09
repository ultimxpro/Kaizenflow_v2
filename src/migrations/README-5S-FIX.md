# 🔧 Guide de Dépannage - Module 5S
## 🚨 Problème Identifié : Erreur d'Upload de Photos
### Description du Problème
L'erreur "Erreur lors de l'upload de la photo" persiste malgré l'authentification fonctionnelle. Le problème vient des **politiques RLS (Row Level Security) mal configurées** pour le stockage Supabase.
### Cause Racine
Les politiques RLS vérifiaient le mauvais élément du chemin de fichier :
- **Code d'upload** : `5s_photos/filename.jpg`
- **Politique défaillante** : `(storage.foldername(name))[1] = '5s_photos'` ❌
- **Problème** : `[1]` vérifie le 2ème élément (nom du fichier), pas le dossier
## 🛠️ Scripts de Diagnostic et Correction
### 1. Diagnostic Rapide
```sql
-- Exécutez d'abord ce script pour diagnostiquer
\i src/migrations/diagnose_storage_v2.sql
```
### 2. Correction des Politiques RLS
```sql
-- Appliquez ce script pour corriger les politiques
\i src/migrations/fix_storage_policies_v2.sql
```
## 📋 Scripts Disponibles
| Script | Description | Usage |
|--------|-------------|-------|
| `diagnose_storage_v2.sql` | Diagnostic complet du stockage | Premier script à exécuter |
| `fix_storage_policies_v2.sql` | Correction des politiques RLS | À appliquer après diagnostic |
| `diagnose_5s.sql` | Diagnostic général RLS | Pour problèmes généraux |
| `fix_5s_policies.sql` | Correction générale RLS | Solution complète |
| `test_auth_status.sql` | Test authentification | Vérifier l'état de connexion |
## 🔍 Détails Techniques
### Politiques RLS Corrigées
**Avant (Défaillant)** :
```sql
CREATE POLICY "5s_photos_insert_policy" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = '5s-photos'::text AND
  auth.role() = 'authenticated'::text AND
  (storage.foldername(name))[1] = '5s_photos'::text  -- ❌ Mauvais index
);
```
**Après (Corrigé)** :
```sql
CREATE POLICY "5s_photos_insert_policy" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = '5s-photos'::text AND
  auth.role() = 'authenticated'::text AND
  name LIKE '5s_photos/%'  -- ✅ Chemin correct
);
```
### Chemin d'Upload dans le Code
```typescript
// src/components/project/editors/FiveSEditorNew.tsx:796
const filePath = `5s_photos/${filename}`;
// Upload vers Supabase
const { data, error } = await supabase.storage
  .from('5s-photos')
  .upload(filePath, file, { cacheControl: '3600', upsert: false });
```
## 🚀 Procédure de Résolution
### Étape 1 : Diagnostic
1. Connectez-vous à Supabase (SQL Editor)
2. Exécutez `diagnose_storage_v2.sql`
3. Vérifiez les résultats pour identifier les problèmes
### Étape 2 : Correction
1. Si des ❌ sont présents, exécutez `fix_storage_policies_v2.sql`
2. Vérifiez que les politiques sont correctement appliquées
### Étape 3 : Test
1. Retournez dans l'application
2. Essayez d'uploader une photo dans un item 5S
3. Vérifiez que l'upload fonctionne sans erreur
## ⚠️ Points d'Attention
### Authentification
- ✅ L'utilisateur doit être connecté
- ✅ Le contexte d'authentification doit détecter la session
- ✅ `userId` doit être correctement passé à `uploadPhoto`
### Stockage Supabase
- ✅ Bucket "5s-photos" doit exister
- ✅ Politiques RLS doivent autoriser l'upload
- ✅ Chemin doit commencer par `5s_photos/`
### Code Frontend
- ✅ `uploadPhoto` reçoit le bon `userId`
- ✅ Gestion d'erreur appropriée
- ✅ Format de fichier correct (image/*)
## 🔧 Dépannage Avancé
### Si l'upload échoue encore :
1. **Vérifiez les logs du navigateur** (Console F12)
2. **Testez avec un fichier plus petit** (< 5MB)
3. **Vérifiez le format du fichier** (JPEG, PNG)
4. **Testez la connexion réseau**
### Scripts de Debug Additionnels :
```sql
-- Test rapide d'authentification
\i src/migrations/test_auth_status.sql
-- Diagnostic complet
\i src/migrations/diagnose_auth_issue.sql
```
## 📞 Support
Si le problème persiste après avoir appliqué ces corrections :
1. Fournissez les résultats du script de diagnostic
2. Indiquez le message d'erreur exact dans la console
3. Précisez le navigateur et la taille du fichier testé
---
**Dernière mise à jour** : Septembre 2024
**Version des scripts** : v2.0 (Correction des politiques RLS)