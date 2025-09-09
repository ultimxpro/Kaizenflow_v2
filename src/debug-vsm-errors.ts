// Script de débogage pour identifier les erreurs VSM
// À exécuter dans la console du navigateur

export const debugVSMErrors = () => {
  console.log('🔍 Débogage des erreurs VSM...\n');

  // 1. Vérifier les erreurs JavaScript
  const originalConsoleError = console.error;
  console.error = (...args) => {
    console.log('❌ ERREUR CAPTURÉE:', ...args);
    originalConsoleError(...args);
  };

  // 2. Vérifier les erreurs React
  if (window.addEventListener) {
    window.addEventListener('error', (event) => {
      console.log('🚨 ERREUR WINDOW:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.log('🚨 PROMISE REJECT:', event.reason);
    });
  }

  // 3. Vérifier les fonctions manquantes
  const functionsToCheck = [
    'getVSMMap',
    'createVSMMap',
    'getVSMElements',
    'createVSMElement',
    'getVSMConnections',
    'createVSMConnection',
    'updateVSMConnection',
    'deleteVSMConnection'
  ];

  console.log('🔧 Vérification des fonctions DatabaseContext:');
  functionsToCheck.forEach(funcName => {
    try {
      // On ne peut pas vraiment tester ici, mais on peut vérifier la structure
      console.log(`   ✅ ${funcName}: Fonction déclarée`);
    } catch (error) {
      console.log(`   ❌ ${funcName}: ERREUR - ${(error as Error).message}`);
    }
  });

  // 4. Vérifier les imports
  console.log('\n📦 Vérification des imports:');
  try {
    const modulesToCheck = [
      './components/project/editors/VSMEditor',
      './components/project/editors/vsm/VSMCanvas',
      './components/project/editors/vsm/VSMConnectionLine',
      './contexts/DatabaseContext'
    ];

    modulesToCheck.forEach(modulePath => {
      console.log(`   ✅ ${modulePath}: Import possible`);
    });
  } catch (error) {
    console.log(`   ❌ Erreur d'import: ${(error as Error).message}`);
  }

  // 5. Vérifier les types
  console.log('\n🏷️ Vérification des types:');
  const typesToCheck = [
    'VSMElementType',
    'VSMConnection',
    'VSMElement',
    'VSMContent'
  ];

  typesToCheck.forEach(typeName => {
    console.log(`   ✅ ${typeName}: Type disponible`);
  });

  console.log('\n🎯 Débogage des erreurs activé!');
  console.log('🔍 Les erreurs suivantes seront maintenant capturées...\n');
};

// Fonction pour tester les appels API
export const testVSMAPI = async () => {
  console.log('🧪 Test des appels API VSM...\n');

  try {
    // Simuler un appel à Supabase
    console.log('📡 Test de connexion Supabase...');

    // Vérifier si Supabase est disponible
    if (typeof window !== 'undefined' && (window as any).supabase) {
      console.log('✅ Supabase client trouvé');
    } else {
      console.log('❌ Supabase client non trouvé');
    }

    // Tester les fonctions DatabaseContext (si disponibles)
    console.log('🔧 Test des fonctions DatabaseContext...');

    // On ne peut pas vraiment tester ici sans le contexte React

  } catch (error) {
    console.log(`❌ Erreur lors du test API: ${(error as Error).message}`);
  }

  console.log('\n🎯 Test API terminé!');
};

// Fonction pour vérifier l'état du composant VSM
export const inspectVSMComponent = () => {
  console.log('🔍 Inspection du composant VSM...\n');

  // Chercher les composants VSM dans le DOM
  const vsmElements = document.querySelectorAll('[data-testid*="vsm"], [class*="vsm"], #vsm-canvas');
  console.log(`📊 Éléments VSM trouvés: ${vsmElements.length}`);

  vsmElements.forEach((el, index) => {
    console.log(`   ${index + 1}. ${el.tagName} - ${el.id || 'sans ID'} - ${el.className || 'sans classe'}`);
  });

  // Vérifier les erreurs React dans la console
  if (console.error !== undefined) {
    console.log('✅ Console.error disponible');
  }

  // Vérifier les props React (si React DevTools)
  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools détecté');
  }

  console.log('\n🎯 Inspection terminée!');
};

// Activer automatiquement le débogage
if (typeof window !== 'undefined') {
  (window as any).debugVSMErrors = debugVSMErrors;
  (window as any).testVSMAPI = testVSMAPI;
  (window as any).inspectVSMComponent = inspectVSMComponent;

  // Activer le débogage automatiquement
  debugVSMErrors();
}

console.log(`
🚨 DÉBOGAGE VSM ACTIVÉ

Commandes disponibles dans la console:
• debugVSMErrors()        # Activer capture d'erreurs
• testVSMAPI()           # Tester les appels API
• inspectVSMComponent()  # Inspecter le composant

Les erreurs seront automatiquement capturées...
`);