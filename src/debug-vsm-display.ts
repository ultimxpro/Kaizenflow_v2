// Script de débogage pour vérifier l'affichage des connexions VSM
// À exécuter dans la console du navigateur

export const debugVSMCanvas = () => {
  console.log('🔍 Débogage de l\'affichage VSM...\n');

  // 1. Vérifier si le canvas existe
  const canvas = document.querySelector('[data-testid="vsm-canvas"], .canvas-background, #vsm-canvas');
  console.log('Canvas trouvé:', !!canvas);

  if (canvas) {
    console.log('Canvas dimensions:', canvas.getBoundingClientRect());
  }

  // 2. Chercher les éléments SVG
  const svgElements = document.querySelectorAll('svg');
  console.log('Éléments SVG trouvés:', svgElements.length);

  svgElements.forEach((svg, index) => {
    console.log(`SVG ${index + 1}:`, {
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      viewBox: svg.getAttribute('viewBox'),
      children: svg.children.length
    });
  });

  // 3. Chercher les paths (lignes de connexion)
  const paths = document.querySelectorAll('path[d]');
  console.log('Chemins SVG trouvés:', paths.length);

  paths.forEach((path, index) => {
    const d = path.getAttribute('d');
    const stroke = path.getAttribute('stroke');
    const markerEnd = path.getAttribute('marker-end');

    console.log(`Path ${index + 1}:`, {
      d: d?.substring(0, 50) + '...',
      stroke,
      markerEnd,
      visible: path.style.display !== 'none'
    });
  });

  // 4. Chercher les marqueurs (flèches)
  const markers = document.querySelectorAll('marker');
  console.log('Marqueurs trouvés:', markers.length);

  markers.forEach((marker, index) => {
    console.log(`Marker ${index + 1}:`, marker.id);
  });

  // 5. Vérifier le contenu React
  const reactRoot = document.querySelector('#root');
  if (reactRoot) {
    console.log('Root React trouvé, contenu:', reactRoot.children.length, 'enfants');
  }

  console.log('\n🎯 Débogage terminé!');
};

// Fonction pour forcer le re-rendu du canvas
export const forceVSMCanvasUpdate = () => {
  console.log('🔄 Forçage de la mise à jour du canvas VSM...\n');

  // Simuler un clic pour déclencher un re-rendu
  const canvas = document.querySelector('.canvas-background');
  if (canvas) {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: canvas.getBoundingClientRect().left + 10,
      clientY: canvas.getBoundingClientRect().top + 10
    });
    canvas.dispatchEvent(event);
    console.log('✅ Événement de clic simulé sur le canvas');
  } else {
    console.log('❌ Canvas non trouvé');
  }

  // Attendre un peu puis vérifier à nouveau
  setTimeout(() => {
    debugVSMCanvas();
  }, 1000);
};

// Fonction pour vérifier les données dans le state React
export const inspectVSMState = () => {
  console.log('🔍 Inspection de l\'état VSM...\n');

  // Chercher les composants React (si React DevTools est disponible)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools détecté');
    console.log('💡 Utilisez React DevTools pour inspecter le composant VSMEditor');
  } else {
    console.log('❌ React DevTools non détecté');
  }

  // Chercher les éléments avec des IDs qui commencent par 'el-'
  const vsmElements = document.querySelectorAll('[id^="el-"]');
  console.log('Éléments VSM trouvés dans le DOM:', vsmElements.length);

  vsmElements.forEach((el, index) => {
    console.log(`Élément ${index + 1}:`, {
      id: el.id,
      tagName: el.tagName,
      className: el.className,
      position: el.getBoundingClientRect()
    });
  });

  console.log('\n🎯 Inspection terminée!');
};

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
  (window as any).debugVSMCanvas = debugVSMCanvas;
  (window as any).forceVSMCanvasUpdate = forceVSMCanvasUpdate;
  (window as any).inspectVSMState = inspectVSMState;
}

console.log(`
🧪 SCRIPTS DE DÉBOGAGE VSM DISPONIBLES:

debugVSMCanvas()           # Vérifie l'affichage du canvas
forceVSMCanvasUpdate()     # Force une mise à jour du canvas
inspectVSMState()          # Inspecte l'état des éléments VSM

Exécutez ces commandes dans la console du navigateur.
`);