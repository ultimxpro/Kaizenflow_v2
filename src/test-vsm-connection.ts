// Script de test rapide pour vérifier la connexion VSM
// À exécuter dans la console du navigateur

import { supabase } from './Lib/supabase';

export const testVSMConnection = async () => {
  console.log('🔍 Test de connexion aux tables VSM...\n');

  const tables = ['vsm_maps', 'vsm_elements', 'vsm_connections', 'vsm_snapshots', 'vsm_comments'];

  for (const table of tables) {
    try {
      console.log(`📋 Test de ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        if (error.code === 'PGRST116') {
          console.log(`   ℹ️  ${table}: Table existe mais RLS actif (normal)`);
        }
      } else {
        console.log(`   ✅ ${table}: Accessible`);
      }
    } catch (error) {
      console.log(`   ❌ ${table}: Erreur de connexion - ${(error as Error).message}`);
    }
  }

  console.log('\n🎯 Test terminé!');
  console.log('\n💡 Si vous voyez des erreurs:');
  console.log('   - Vérifiez que les tables ont été créées dans Supabase');
  console.log('   - Vérifiez vos permissions utilisateur');
  console.log('   - Vérifiez la configuration RLS');
};

// Test rapide pour voir s'il y a des données VSM
export const checkVSMData = async () => {
  console.log('📊 Vérification des données VSM existantes...\n');

  try {
    // Vérifier les modules VSM
    const { data: modules, error: modulesError } = await supabase
      .from('a3_modules')
      .select('id, project_id, content')
      .eq('tool_type', 'VSM');

    if (modulesError) throw modulesError;

    console.log(`📋 Modules VSM trouvés: ${modules?.length || 0}`);

    if (modules && modules.length > 0) {
      modules.forEach((module, index) => {
        const hasContent = module.content && Object.keys(module.content).length > 0;
        console.log(`   ${index + 1}. Module ${module.id}: ${hasContent ? '✅ A du contenu' : '❌ Vide'}`);
      });
    }

    // Vérifier les cartes VSM
    const { data: maps, error: mapsError } = await supabase
      .from('vsm_maps')
      .select('id, module_id, title, created_at');

    if (mapsError) {
      console.log(`❌ Erreur cartes VSM: ${mapsError.message}`);
    } else {
      console.log(`🗺️ Cartes VSM trouvées: ${maps?.length || 0}`);
      if (maps && maps.length > 0) {
        maps.forEach((map, index) => {
          console.log(`   ${index + 1}. ${map.title} (Module: ${map.module_id})`);
        });
      }
    }

  } catch (error) {
    console.log(`❌ Erreur lors de la vérification: ${(error as Error).message}`);
  }

  console.log('\n🎯 Vérification terminée!');
};

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
  (window as any).testVSMConnection = testVSMConnection;
  (window as any).checkVSMData = checkVSMData;
}

console.log(`
🧪 SCRIPTS DE TEST VSM DISPONIBLES:

testVSMConnection()  # Test de connexion aux tables
checkVSMData()       # Vérification des données existantes

Exécutez ces commandes dans la console du navigateur.
`);