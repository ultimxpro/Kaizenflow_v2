// Script d'exécution de la migration VSM
// À exécuter dans la console du navigateur ou via Node.js

import { migrateVSMData, checkVSMMigrationStatus, rollbackVSMMigration } from './migrate-vsm-data';

// Fonction principale pour exécuter la migration
export const runVSMMigration = async () => {
  console.log('🚀 Script de migration VSM - Démarrage...\n');

  try {
    // Vérifier l'état avant migration
    console.log('📊 État avant migration:');
    await checkVSMMigrationStatus();
    console.log('');

    // Demander confirmation
    const shouldProceed = confirm(
      '⚠️ ATTENTION: Cette migration va transférer toutes les données VSM existantes vers les nouvelles tables.\n\n' +
      'Assurez-vous que:\n' +
      '1. Les nouvelles tables VSM ont été créées dans Supabase\n' +
      '2. Vous avez fait une sauvegarde de la base de données\n' +
      '3. Aucun utilisateur n\'est en train d\'éditer des cartes VSM\n\n' +
      'Voulez-vous continuer ?'
    );

    if (!shouldProceed) {
      console.log('❌ Migration annulée par l\'utilisateur');
      return;
    }

    // Exécuter la migration
    console.log('🔄 Exécution de la migration...\n');
    await migrateVSMData();
    console.log('');

    // Vérifier l'état après migration
    console.log('📊 État après migration:');
    await checkVSMMigrationStatus();
    console.log('');

    console.log('🎉 Migration terminée avec succès !');
    console.log('✅ Vous pouvez maintenant utiliser les nouvelles fonctionnalités VSM');

  } catch (error) {
    console.error('💥 Erreur lors de la migration:', error);

    // Proposer le rollback
    const shouldRollback = confirm(
      '❌ Une erreur s\'est produite lors de la migration.\n' +
      'Voulez-vous effectuer un rollback pour revenir à l\'état précédent ?'
    );

    if (shouldRollback) {
      try {
        console.log('🔄 Exécution du rollback...');
        await rollbackVSMMigration();
        console.log('✅ Rollback terminé');
      } catch (rollbackError) {
        console.error('❌ Erreur lors du rollback:', rollbackError);
      }
    }
  }
};

// Fonction pour vérifier seulement l'état
export const checkMigrationStatus = async () => {
  console.log('📊 Vérification de l\'état de migration VSM...\n');
  try {
    await checkVSMMigrationStatus();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
};

// Fonction pour rollback seulement
export const runRollback = async () => {
  const shouldRollback = confirm(
    '⚠️ ATTENTION: Cette action va supprimer toutes les données VSM migrées et revenir à l\'ancien système.\n\n' +
    'Toutes les modifications apportées aux cartes VSM depuis la migration seront perdues.\n\n' +
    'Voulez-vous vraiment continuer ?'
  );

  if (!shouldRollback) {
    console.log('❌ Rollback annulé par l\'utilisateur');
    return;
  }

  try {
    console.log('🔄 Exécution du rollback...');
    await rollbackVSMMigration();
    console.log('✅ Rollback terminé');
  } catch (error) {
    console.error('❌ Erreur lors du rollback:', error);
  }
};

// Instructions d'utilisation
console.log(`
🎯 MIGRATION VSM - INSTRUCTIONS D'UTILISATION

Pour exécuter la migration complète:
  runVSMMigration()

Pour vérifier l'état de la migration:
  checkMigrationStatus()

Pour effectuer un rollback (en cas de problème):
  runRollback()

⚠️ IMPORTANT:
- Faites une sauvegarde complète de votre base de données avant la migration
- Assurez-vous que les nouvelles tables VSM ont été créées dans Supabase
- Aucun utilisateur ne doit être en train d'éditer des cartes VSM pendant la migration
- La migration peut prendre du temps selon le nombre de cartes VSM

📞 Support:
En cas de problème, contactez l'équipe technique avec les logs d'erreur.
`);

// Exposer les fonctions globalement pour utilisation en console
if (typeof window !== 'undefined') {
  (window as any).runVSMMigration = runVSMMigration;
  (window as any).checkMigrationStatus = checkMigrationStatus;
  (window as any).runRollback = runRollback;
}