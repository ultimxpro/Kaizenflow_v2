// Migration script pour transférer les données VSM du champ content vers les nouvelles tables dédiées
// À exécuter une seule fois après avoir créé les nouvelles tables VSM

import { supabase } from '../Lib/supabase';

export const migrateVSMData = async () => {
  console.log('🚀 Démarrage de la migration des données VSM...');

  try {
    // 1. Récupérer tous les modules VSM existants
    const { data: vsmModules, error: modulesError } = await supabase
      .from('a3_modules')
      .select('id, project_id, content')
      .eq('tool_type', 'VSM')
      .not('content', 'is', null);

    if (modulesError) throw modulesError;

    if (!vsmModules || vsmModules.length === 0) {
      console.log('✅ Aucun module VSM trouvé à migrer');
      return;
    }

    console.log(`📊 ${vsmModules.length} module(s) VSM trouvé(s) à migrer`);

    // 2. Pour chaque module VSM, créer la carte et migrer les données
    for (const module of vsmModules) {
      try {
        console.log(`🔄 Migration du module ${module.id}...`);

        const vsmContent = module.content as any;

        if (!vsmContent || !vsmContent.elements || !vsmContent.global) {
          console.log(`⚠️ Contenu VSM invalide pour le module ${module.id}, ignoré`);
          continue;
        }

        // Créer la carte VSM principale
        const { data: vsmMap, error: mapError } = await supabase
          .from('vsm_maps')
          .insert({
            module_id: module.id,
            title: vsmContent.global.title || 'Carte VSM',
            description: vsmContent.global.description,
            customer_demand: vsmContent.global.demandeClient || 1000,
            opening_time: vsmContent.global.tempsOuverture || 480,
            time_unit: vsmContent.global.uniteTemps || 'minutes',
            company: vsmContent.global.company,
            product: vsmContent.global.product,
            author: vsmContent.global.author,
            version: vsmContent.global.version
          })
          .select()
          .single();

        if (mapError) throw mapError;

        console.log(`✅ Carte VSM créée: ${vsmMap.id}`);

        // Mapper les éléments pour référence future
        const elementIdMapping = new Map();

        // Migrer les éléments
        for (const element of vsmContent.elements) {
          const { data: newElement, error: elementError } = await supabase
            .from('vsm_elements')
            .insert({
              map_id: vsmMap.id,
              element_type: element.type,
              name: element.data?.nom,
              x_position: element.x,
              y_position: element.y,
              width: element.width,
              height: element.height,
              cycle_time: element.data?.tempsCycle,
              setup_time: element.data?.tempsChangt,
              availability_rate: element.data?.tauxDispo,
              operator_count: element.data?.nbOperateurs,
              scrap_rate: element.data?.rebut,
              stock_quantity: element.data?.quantite,
              frequency: element.data?.frequence,
              details: element.data?.details,
              content: element.data?.contenu
            })
            .select()
            .single();

          if (elementError) throw elementError;

          // Garder le mapping ancien ID -> nouveau ID
          elementIdMapping.set(element.id, newElement.id);
        }

        console.log(`✅ ${vsmContent.elements.length} élément(s) migré(s)`);

        // Migrer les connexions
        if (vsmContent.connections && vsmContent.connections.length > 0) {
          for (const connection of vsmContent.connections) {
            const fromElementId = elementIdMapping.get(connection.from?.elementId);
            const toElementId = elementIdMapping.get(connection.to?.elementId);

            if (!fromElementId || !toElementId) {
              console.log(`⚠️ Connexion ignorée: éléments non trouvés`);
              continue;
            }

            const { error: connectionError } = await supabase
              .from('vsm_connections')
              .insert({
                map_id: vsmMap.id,
                from_element_id: fromElementId,
                to_element_id: toElementId,
                from_anchor: connection.from?.anchor || 'right',
                to_anchor: connection.to?.anchor || 'left',
                connection_type: connection.type || 'information',
                arrow_type: connection.data?.arrowType,
                info_type: connection.data?.infoType,
                label: connection.data?.label,
                details: connection.data?.details
              });

            if (connectionError) throw connectionError;
          }

          console.log(`✅ ${vsmContent.connections.length} connexion(s) migrée(s)`);
        }

        // Marquer le module comme migré (optionnel)
        await supabase
          .from('a3_modules')
          .update({
            content: {
              ...vsmContent,
              migrated: true,
              migrated_at: new Date().toISOString(),
              vsm_map_id: vsmMap.id
            }
          })
          .eq('id', module.id);

        console.log(`✅ Module ${module.id} migré avec succès`);

      } catch (error) {
        console.error(`❌ Erreur lors de la migration du module ${module.id}:`, error);
        // Continuer avec les autres modules
      }
    }

    console.log('🎉 Migration VSM terminée avec succès !');

  } catch (error) {
    console.error('💥 Erreur générale lors de la migration:', error);
    throw error;
  }
};

// Fonction utilitaire pour vérifier l'état de la migration
export const checkVSMMigrationStatus = async () => {
  try {
    const { data: maps, error: mapsError } = await supabase
      .from('vsm_maps')
      .select('id, module_id');

    if (mapsError) throw mapsError;

    const { data: modules, error: modulesError } = await supabase
      .from('a3_modules')
      .select('id, content')
      .eq('tool_type', 'VSM');

    if (modulesError) throw modulesError;

    const migratedModules = modules.filter(m => m.content?.migrated === true);
    const totalModules = modules.length;
    const totalMaps = maps.length;

    console.log('📊 État de la migration VSM:');
    console.log(`- Modules VSM totaux: ${totalModules}`);
    console.log(`- Modules migrés: ${migratedModules.length}`);
    console.log(`- Cartes VSM créées: ${totalMaps}`);
    console.log(`- Taux de migration: ${totalModules > 0 ? ((migratedModules.length / totalModules) * 100).toFixed(1) : 0}%`);

    return {
      totalModules,
      migratedModules: migratedModules.length,
      totalMaps,
      migrationRate: totalModules > 0 ? (migratedModules.length / totalModules) * 100 : 0
    };

  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    throw error;
  }
};

// Fonction pour rollback (en cas de problème)
export const rollbackVSMMigration = async () => {
  console.log('🔄 Rollback de la migration VSM...');

  try {
    // Supprimer toutes les données VSM migrées
    await supabase.from('vsm_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vsm_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vsm_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vsm_elements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vsm_maps').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Remettre à jour les modules pour enlever le flag migrated
    const { data: modulesToUpdate, error: fetchError } = await supabase
      .from('a3_modules')
      .select('id, content')
      .eq('tool_type', 'VSM');

    if (fetchError) throw fetchError;

    for (const module of modulesToUpdate || []) {
      if (module.content && typeof module.content === 'object') {
        const updatedContent = { ...module.content };
        delete updatedContent.migrated;
        delete updatedContent.migrated_at;
        delete updatedContent.vsm_map_id;

        await supabase
          .from('a3_modules')
          .update({ content: updatedContent })
          .eq('id', module.id);
      }
    }

    console.log('✅ Rollback terminé');

  } catch (error) {
    console.error('❌ Erreur lors du rollback:', error);
    throw error;
  }
};