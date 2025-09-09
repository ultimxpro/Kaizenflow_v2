// Script de test pour vérifier les connexions VSM
// À exécuter dans la console du navigateur

import { supabase } from './Lib/supabase';

export const testVSMConnections = async () => {
  console.log('🔍 Test des connexions VSM...\n');

  try {
    // 1. Vérifier les cartes VSM
    const { data: maps, error: mapsError } = await supabase
      .from('vsm_maps')
      .select('id, title')
      .limit(5);

    if (mapsError) throw mapsError;

    console.log(`📋 Cartes VSM trouvées: ${maps?.length || 0}`);
    if (maps && maps.length > 0) {
      maps.forEach((map, index) => {
        console.log(`   ${index + 1}. ${map.title} (ID: ${map.id})`);
      });

      // 2. Pour la première carte, vérifier les éléments
      const firstMap = maps[0];
      console.log(`\n🔍 Analyse de la carte: ${firstMap.title}`);

      const { data: elements, error: elementsError } = await supabase
        .from('vsm_elements')
        .select('id, name, type')
        .eq('map_id', firstMap.id);

      if (elementsError) throw elementsError;

      console.log(`📦 Éléments trouvés: ${elements?.length || 0}`);
      if (elements && elements.length > 0) {
        elements.forEach((el, index) => {
          console.log(`   ${index + 1}. ${el.name || 'Sans nom'} (${el.type}) - ID: ${el.id}`);
        });
      }

      // 3. Vérifier les connexions
      const { data: connections, error: connectionsError } = await supabase
        .from('vsm_connections')
        .select('*')
        .eq('map_id', firstMap.id);

      if (connectionsError) throw connectionsError;

      console.log(`🔗 Connexions trouvées: ${connections?.length || 0}`);
      if (connections && connections.length > 0) {
        connections.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.from_element_id} → ${conn.to_element_id}`);
          console.log(`       Type: ${conn.connection_type}, Flèche: ${conn.arrow_type || 'Aucune'}`);
          if (conn.label) console.log(`       Label: ${conn.label}`);
          if (conn.details) console.log(`       Détails: ${conn.details}`);
        });
      } else {
        console.log('   ❌ Aucune connexion trouvée !');
        console.log('   💡 Les connexions devraient être créées automatiquement avec l\'exemple');
      }
    }

  } catch (error) {
    console.log(`❌ Erreur lors du test: ${(error as Error).message}`);
  }

  console.log('\n🎯 Test terminé!');
};

// Test rapide pour voir si les connexions sont visibles dans l'interface
export const checkVSMCanvasConnections = () => {
  console.log('🎨 Vérification des connexions dans le canvas...\n');

  // Chercher les éléments SVG de connexions
  const svgElements = document.querySelectorAll('svg line, svg path, svg polygon');
  console.log(`🔍 Éléments SVG trouvés: ${svgElements.length}`);

  // Chercher les éléments de connexion dans le DOM
  const connectionElements = document.querySelectorAll('[data-connection], .connection, .vsm-connection');
  console.log(`🔗 Éléments de connexion trouvés: ${connectionElements.length}`);

  if (svgElements.length === 0 && connectionElements.length === 0) {
    console.log('❌ Aucune connexion visible dans l\'interface');
    console.log('💡 Vérifiez que les connexions sont bien créées dans la base de données');
  } else {
    console.log('✅ Des éléments graphiques de connexion sont présents');
  }

  console.log('\n🎯 Vérification terminée!');
};

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
  (window as any).testVSMConnections = testVSMConnections;
  (window as any).checkVSMCanvasConnections = checkVSMCanvasConnections;
}

console.log(`
🧪 SCRIPTS DE TEST DES CONNEXIONS VSM DISPONIBLES:

testVSMConnections()              # Vérifie les connexions en base
checkVSMCanvasConnections()       # Vérifie l'affichage dans l'interface

Exécutez ces commandes dans la console du navigateur.
`);