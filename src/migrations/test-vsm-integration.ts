// Script de test pour vérifier l'intégration VSM après migration
// À exécuter après la migration pour valider que tout fonctionne correctement

import { supabase } from '../Lib/supabase';

export const testVSMIntegration = async () => {
  console.log('🧪 Test d\'intégration VSM - Démarrage...\n');

  try {
    // Test 1: Vérifier que les tables existent et sont accessibles
    console.log('1️⃣ Test des tables VSM...');
    const tables = ['vsm_maps', 'vsm_elements', 'vsm_connections', 'vsm_snapshots', 'vsm_comments'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });

        if (error) throw error;
        console.log(`   ✅ Table ${table}: accessible`);
      } catch (error) {
        console.log(`   ❌ Table ${table}: ${(error as Error).message}`);
      }
    }

    // Test 2: Vérifier les politiques RLS
    console.log('\n2️⃣ Test des politiques RLS...');
    try {
      const { data, error } = await supabase
        .from('vsm_maps')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('   ✅ RLS activé (accès refusé sans authentification)');
      } else if (!error) {
        console.log('   ⚠️ RLS peut-être désactivé ou utilisateur authentifié');
      } else {
        console.log(`   ❌ Erreur RLS: ${error.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors du test RLS: ${(error as Error).message}`);
    }

    // Test 3: Vérifier la migration des données
    console.log('\n3️⃣ Test de la migration des données...');
    try {
      const { data: maps, error: mapsError } = await supabase
        .from('vsm_maps')
        .select('id, module_id, title, created_at');

      if (mapsError) throw mapsError;

      console.log(`   📊 ${maps?.length || 0} carte(s) VSM trouvée(s)`);

      if (maps && maps.length > 0) {
        // Test d'une carte spécifique
        const testMap = maps[0];
        console.log(`   🧪 Test de la carte: ${testMap.title}`);

        // Vérifier les éléments
        const { data: elements, error: elementsError } = await supabase
          .from('vsm_elements')
          .select('id, element_type, name')
          .eq('map_id', testMap.id);

        if (elementsError) throw elementsError;
        console.log(`      📦 ${elements?.length || 0} élément(s) trouvé(s)`);

        // Vérifier les connexions
        const { data: connections, error: connectionsError } = await supabase
          .from('vsm_connections')
          .select('id, connection_type')
          .eq('map_id', testMap.id);

        if (connectionsError) throw connectionsError;
        console.log(`      🔗 ${connections?.length || 0} connexion(s) trouvée(s)`);

        // Vérifier les commentaires
        const { data: comments, error: commentsError } = await supabase
          .from('vsm_comments')
          .select('id, content')
          .eq('map_id', testMap.id);

        if (commentsError) throw commentsError;
        console.log(`      💬 ${comments?.length || 0} commentaire(s) trouvé(s)`);
      }

    } catch (error) {
      console.log(`   ❌ Erreur lors du test des données: ${(error as Error).message}`);
    }

    // Test 4: Vérifier les indexes et performances
    console.log('\n4️⃣ Test des performances...');
    try {
      const startTime = Date.now();

      // Test de requête avec jointure
      const { data, error } = await supabase
        .from('vsm_elements')
        .select(`
          id,
          element_type,
          name,
          vsm_maps!inner(title)
        `)
        .limit(10);

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (error) throw error;

      console.log(`   ⚡ Requête exécutée en ${duration}ms`);
      console.log(`   📈 ${data?.length || 0} élément(s) récupéré(s) avec jointure`);

      if (duration > 1000) {
        console.log('   ⚠️ Performance: requête lente (>1s), vérifier les indexes');
      } else {
        console.log('   ✅ Performance: requête rapide');
      }

    } catch (error) {
      console.log(`   ❌ Erreur lors du test de performance: ${(error as Error).message}`);
    }

    // Test 5: Test des fonctionnalités avancées
    console.log('\n5️⃣ Test des fonctionnalités avancées...');

    // Test snapshots
    try {
      const { data: snapshots, error } = await supabase
        .from('vsm_snapshots')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;
      console.log(`   📸 ${snapshots || 0} snapshot(s) disponible(s)`);
    } catch (error) {
      console.log(`   ❌ Erreur snapshots: ${(error as Error).message}`);
    }

    console.log('\n🎉 Tests d\'intégration terminés !');
    console.log('\n📋 Résumé:');
    console.log('- Vérifiez les ✅ pour les tests réussis');
    console.log('- Vérifiez les ❌ pour les erreurs à corriger');
    console.log('- Vérifiez les ⚠️ pour les avertissements');

  } catch (error) {
    console.error('💥 Erreur générale lors des tests:', error);
  }
};

// Fonction de test rapide (connexion seulement)
export const testVSMConnection = async () => {
  console.log('🔗 Test de connexion VSM...');

  try {
    const { data, error } = await supabase
      .from('vsm_maps')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;

    console.log('✅ Connexion VSM réussie');
    return true;

  } catch (error) {
    console.log(`❌ Erreur de connexion VSM: ${(error as Error).message}`);
    return false;
  }
};

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
  (window as any).testVSMIntegration = testVSMIntegration;
  (window as any).testVSMConnection = testVSMConnection;
}

console.log(`
🧪 TESTS D'INTÉGRATION VSM

Commandes disponibles:
- testVSMConnection()     # Test rapide de connexion
- testVSMIntegration()    # Test complet d'intégration

Exécutez ces commandes dans la console du navigateur après la migration.
`);