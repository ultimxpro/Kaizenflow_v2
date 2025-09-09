import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import {
  HelpCircle, X, Workflow, ZoomIn, ZoomOut, Move
} from 'lucide-react';
import { VSMToolbar } from './vsm/VSMToolbar';
import { VSMCanvas } from './vsm/VSMCanvas';
import { VSMDetailsPanel } from './vsm/VSMDetailsPanel';
import { VSMHelp } from './vsm/VSMHelp';
import { getInitialContent, calculateMetrics } from './vsm/VSMUtils';
import { VSMContent, VSMElement, VSMConnection, VSMElementType } from './vsm/VSMTypes';
import { OptimizedVSMNode } from './vsm/VSMNode';

export const VSMEditor: React.FC<{ module: A3Module; onClose: () => void; }> = ({ module, onClose }) => {
  const {
    updateA3Module,
    getVSMMap,
    createVSMMap,
    updateVSMMap,
    getVSMElements,
    createVSMElement,
    updateVSMElement,
    deleteVSMElement,
    getVSMConnections,
    createVSMConnection,
    updateVSMConnection,
    deleteVSMConnection
  } = useDatabase();

  // Fallback functions si les fonctions DB ne sont pas encore implémentées
  const safeGetVSMMap = getVSMMap || (() => null);
  const safeCreateVSMMap = createVSMMap || (async () => { throw new Error('createVSMMap not implemented'); });
  const safeUpdateVSMMap = updateVSMMap || (async () => { throw new Error('updateVSMMap not implemented'); });
  const safeGetVSMElements = getVSMElements || (() => []);
  const safeCreateVSMElement = createVSMElement || (async () => { throw new Error('createVSMElement not implemented'); });
  const safeUpdateVSMElement = updateVSMElement || (async () => { throw new Error('updateVSMElement not implemented'); });
  const safeDeleteVSMElement = deleteVSMElement || (async () => { throw new Error('deleteVSMElement not implemented'); });
  const safeGetVSMConnections = getVSMConnections || (() => []);
  const safeCreateVSMConnection = createVSMConnection || (async () => { throw new Error('createVSMConnection not implemented'); });
  const safeUpdateVSMConnection = updateVSMConnection || (async () => { throw new Error('updateVSMConnection not implemented'); });
  const safeDeleteVSMConnection = deleteVSMConnection || (async () => { throw new Error('deleteVSMConnection not implemented'); });

  // États pour le nouveau système de base de données
  const [vsmMap, setVsmMap] = useState<any>(null);
  const [vsmElements, setVsmElements] = useState<any[]>([]);
  const [vsmConnections, setVsmConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // États pour la compatibilité avec l'ancien système
  const [content, setContent] = useState<VSMContent>(() => getInitialContent(module.content));
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewState, setViewState] = useState({ zoom: 0.8, pan: { x: 0, y: 0 } });
  const [mode, setMode] = useState<'select' | 'connect' | 'pan'>('select');
  const [connectingFrom, setConnectingFrom] = useState<{elementId: string, anchor: 'top' | 'bottom' | 'left' | 'right'} | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [copiedElement, setCopiedElement] = useState<VSMElement | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Fonction pour créer des éléments d'exemple (votre ancien exemple)
  const createVSMExampleElements = async (mapId: string) => {
    try {
      // Utiliser votre ancien exemple complet avec dimensions optimisées
      const exampleElements = [
        { id: 'el-fournisseur', type: 'Fournisseur' as VSMElementType, x: 50, y: 300, width: 220, height: 160, data: { nom: 'Aciérie XYZ', frequence: '2 / semaine', details: 'Livraison par camion\nMOQ: 1000 pièces' } },
        { id: 'el-stock1', type: 'Stock' as VSMElementType, x: 300, y: 350, width: 140, height: 120, data: { quantite: 5, details: '~2500 pièces' } },
        { id: 'el-decoupe', type: 'Processus' as VSMElementType, x: 470, y: 300, width: 280, height: 180, data: { nom: 'Découpe Laser', tempsCycle: 39, tempsChangt: 600, tauxDispo: 100, nbOperateurs: 1, rebut: 1, lotSize: 50 } },
        { id: 'el-stock2', type: 'Stock' as VSMElementType, x: 780, y: 350, width: 140, height: 120, data: { quantite: 2, details: '~1000 pièces' } },
        { id: 'el-pliage', type: 'Processus' as VSMElementType, x: 950, y: 300, width: 280, height: 180, data: { nom: 'Pliage', tempsCycle: 46, tempsChangt: 900, tauxDispo: 80, nbOperateurs: 1, rebut: 4, lotSize: 25 } },
        { id: 'el-stock3', type: 'Stock' as VSMElementType, x: 1260, y: 350, width: 140, height: 120, data: { quantite: 1.5, details: '~750 pièces' } },
        { id: 'el-soudure', type: 'Processus' as VSMElementType, x: 1430, y: 300, width: 280, height: 180, data: { nom: 'Soudure', tempsCycle: 62, tempsChangt: 0, tauxDispo: 90, nbOperateurs: 1, rebut: 1, lotSize: 10 } },
        { id: 'el-stock4', type: 'Stock' as VSMElementType, x: 1740, y: 350, width: 140, height: 120, data: { quantite: 2.7, details: '~1350 pièces' } },
        { id: 'el-assemblage', type: 'Processus' as VSMElementType, x: 1910, y: 300, width: 280, height: 180, data: { nom: 'Assemblage', tempsCycle: 40, tempsChangt: 0, tauxDispo: 100, nbOperateurs: 1, rebut: 0.5, lotSize: 20 } },
        { id: 'el-stock5', type: 'Stock' as VSMElementType, x: 2220, y: 350, width: 140, height: 120, data: { quantite: 1.2, details: '~600 pièces' } },
        { id: 'el-livraison', type: 'Livraison' as VSMElementType, x: 2390, y: 300, width: 220, height: 160, data: { nom: 'Expédition', frequence: 'Quotidienne', details: 'Transporteur: DHL\nDélai: J+1' } },
        { id: 'el-client', type: 'Client' as VSMElementType, x: 2650, y: 300, width: 220, height: 160, data: { nom: 'Client Final', frequence: '920 p/jour', details: 'Automobile OEM' } },
        { id: 'el-controleprod', type: 'ControleProduction' as VSMElementType, x: 1260, y: 80, width: 280, height: 160, data: { nom: 'Planification', details: 'ERP: SAP\nMRP hebdomadaire' } },
        { id: 'el-kaizen1', type: 'Kaizen' as VSMElementType, x: 1000, y: 450, width: 180, height: 140, data: { details: 'Réduire TCH\nde 900s à 300s' } },
        { id: 'el-kaizen2', type: 'Kaizen' as VSMElementType, x: 1500, y: 450, width: 180, height: 140, data: { details: 'SMED\nChangement < 10min' } }
      ];

      // Créer tous les éléments d'exemple
      for (const element of exampleElements) {
        await createVSMElement(mapId, {
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          data: element.data
        } as any);
      }

      console.log('Éléments d\'exemple créés avec succès (ancien exemple)');

    } catch (error) {
      console.error('Erreur lors de la création des éléments d\'exemple:', error);
    }
  };

  // Fonction pour créer les connexions d'exemple (exactement comme dans VSMUtils.ts)
  const createVSMExampleConnections = async (mapId: string) => {
    try {
      const exampleConnections = [
        { id: 'c1', from: { elementId: 'el-fournisseur', anchor: 'right' }, to: { elementId: 'el-decoupe', anchor: 'left' }, type: 'matiere', data: { arrowType: 'pousse', label: 'Tôles brutes' } },
        { id: 'c2', from: { elementId: 'el-decoupe', anchor: 'right' }, to: { elementId: 'el-pliage', anchor: 'left' }, type: 'matiere', data: { arrowType: 'pousse', label: 'Pièces découpées' } },
        { id: 'c3', from: { elementId: 'el-pliage', anchor: 'right' }, to: { elementId: 'el-soudure', anchor: 'left' }, type: 'matiere', data: { arrowType: 'pousse' } },
        { id: 'c4', from: { elementId: 'el-soudure', anchor: 'right' }, to: { elementId: 'el-assemblage', anchor: 'left' }, type: 'matiere', data: { arrowType: 'retrait' } },
        { id: 'c5', from: { elementId: 'el-assemblage', anchor: 'right' }, to: { elementId: 'el-livraison', anchor: 'left' }, type: 'matiere', data: { arrowType: 'retrait' } },
        { id: 'c6', from: { elementId: 'el-livraison', anchor: 'right' }, to: { elementId: 'el-client', anchor: 'left' }, type: 'matiere' },
        { id: 'c7', from: { elementId: 'el-client', anchor: 'top' }, to: { elementId: 'el-controleprod', anchor: 'right' }, type: 'information', data: { infoType: 'electronique', details: 'Prévisions 6 mois' } },
        { id: 'c8', from: { elementId: 'el-controleprod', anchor: 'left' }, to: { elementId: 'el-fournisseur', anchor: 'top' }, type: 'information', data: { infoType: 'electronique', details: 'Commandes hebdo' } },
        { id: 'c9', from: { elementId: 'el-controleprod', anchor: 'bottom' }, to: { elementId: 'el-assemblage', anchor: 'top' }, type: 'information', data: { infoType: 'manuel', details: 'Planning quotidien' } }
      ];

      // Créer toutes les connexions d'exemple
      for (const connection of exampleConnections) {
        console.log('Création connexion:', connection.id, 'de', connection.from.elementId, 'à', connection.to.elementId);

        const connectionId = await createVSMConnection(mapId, {
          from_element_id: connection.from.elementId,
          to_element_id: connection.to.elementId,
          from_anchor: connection.from.anchor,
          to_anchor: connection.to.anchor,
          connection_type: connection.type,
          arrow_type: connection.data?.arrowType,
          info_type: connection.data?.infoType,
          label: connection.data?.label,
          details: connection.data?.details
        } as any);

        console.log('Connexion créée avec ID:', connectionId);
      }

      console.log('Toutes les connexions d\'exemple créées avec succès (9 connexions)');

    } catch (error) {
      console.error('Erreur lors de la création des connexions d\'exemple:', error);
    }
  };

  // CHARGEMENT INITIAL - Charger depuis les nouvelles tables VSM
  useEffect(() => {
    const loadVSMData = async () => {
      try {
        setIsLoading(true);

        // Vérifier si une carte VSM existe déjà pour ce module
        const existingMap = getVSMMap(module.id);

        if (existingMap) {
          // Charger les données depuis les nouvelles tables
          setVsmMap(existingMap);
          const elements = getVSMElements(existingMap.id);
          const connections = getVSMConnections(existingMap.id);

          // Convertir les données de la DB vers le format du composant
          const convertedElements: VSMElement[] = elements.map((el: any) => ({
            id: el.id,
            type: el.element_type as VSMElementType,
            x: el.x_position,
            y: el.y_position,
            width: el.width,
            height: el.height,
            data: {
              nom: el.name || '',
              tempsCycle: el.cycle_time || undefined,
              tempsChangt: el.setup_time || undefined,
              tauxDispo: el.availability_rate || undefined,
              nbOperateurs: el.operator_count || undefined,
              rebut: el.scrap_rate || undefined,
              quantite: el.stock_quantity || undefined,
              frequence: el.frequency || undefined,
              details: el.details || undefined,
              contenu: el.content || undefined
            }
          }));

          const convertedConnections: VSMConnection[] = connections.map((conn: any) => ({
            id: conn.id,
            from: { elementId: conn.from_element_id, anchor: conn.from_anchor },
            to: { elementId: conn.to_element_id, anchor: conn.to_anchor },
            type: conn.connection_type,
            data: {
              arrowType: conn.arrow_type,
              infoType: conn.info_type,
              label: conn.label,
              details: conn.details
            }
          }));

          setVsmElements(elements);
          setVsmConnections(connections);

          // Créer le content pour la compatibilité avec l'ancien système
          const vsmContent: VSMContent = {
            elements: convertedElements,
            connections: convertedConnections,
            global: {
              title: existingMap.title || '',
              demandeClient: existingMap.customer_demand,
              tempsOuverture: existingMap.opening_time,
              uniteTemps: existingMap.time_unit,
              company: existingMap.company,
              product: existingMap.product,
              author: existingMap.author,
              version: existingMap.version
            }
          };

          setContent(vsmContent);

        } else {
          // Créer une nouvelle carte VSM avec des exemples
          console.log('Création d\'une nouvelle carte VSM avec exemples...');
          const newMapId = await createVSMMap(module.id, `Carte VSM - ${module.titre || 'Sans titre'}`);
          const newMap = getVSMMap(module.id);

          if (newMap) {
            setVsmMap(newMap);

            // Créer des éléments d'exemple
            await createVSMExampleElements(newMapId);

            // Créer les connexions d'exemple
            await createVSMExampleConnections(newMapId);

            // Recharger les éléments et connexions
            const elements = safeGetVSMElements(newMapId);
            const connections = safeGetVSMConnections(newMapId);
            console.log('Éléments rechargés depuis DB:', elements.length);
            console.log('Connexions rechargées depuis DB:', connections.length);
            setVsmElements(elements);
            setVsmConnections(connections);

            // Créer le content complet avec les exemples
            const exampleElements: VSMElement[] = elements.map((el: any) => ({
              id: el.id,
              type: el.type as VSMElementType,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              data: el.data || {}
            }));

            const exampleConnections: VSMConnection[] = connections.map((conn: any) => ({
              id: conn.id,
              from: { elementId: conn.from_element_id, anchor: conn.from_anchor as any },
              to: { elementId: conn.to_element_id, anchor: conn.to_anchor as any },
              type: conn.connection_type as any,
              data: {
                arrowType: conn.arrow_type as any,
                infoType: conn.info_type as any,
                label: conn.label || undefined,
                details: conn.details || undefined
              }
            }));

            const exampleContent: VSMContent = {
              elements: exampleElements,
              connections: exampleConnections,
              global: {
                title: 'VSM - Ligne de Production',
                demandeClient: 18400,
                tempsOuverture: 28800,
                uniteTemps: 'secondes',
                company: 'Manufacturing Corp',
                product: 'Pièce métallique ref. XYZ-123',
                author: 'Équipe Kaizen',
                version: '1.0'
              }
            };

            setContent(exampleContent);
            console.log('Exemple complet chargé avec', exampleElements.length, 'éléments et', exampleConnections.length, 'connexions');

            // Debug: Afficher les connexions créées
            console.log('Connexions créées:', exampleConnections.map(c => ({
              id: c.id,
              from: `${c.from.elementId} (${c.from.anchor})`,
              to: `${c.to.elementId} (${c.to.anchor})`,
              type: c.type,
              data: c.data
            })));
          }
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données VSM:', error);
        // Fallback vers l'ancien système
      } finally {
        setIsLoading(false);
      }
    };

    loadVSMData();
  }, [module.id, getVSMMap, createVSMMap, getVSMElements, getVSMConnections]);

  // SAUVEGARDE AUTOMATIQUE - Vers les nouvelles tables
  useEffect(() => {
    if (!vsmMap || isLoading) return;

    const handler = setTimeout(async () => {
      try {
        // Sauvegarder les métadonnées globales
        await updateVSMMap(vsmMap.id, {
          title: content.global?.title,
          customer_demand: content.global?.demandeClient || 1000,
          opening_time: content.global?.tempsOuverture || 480,
          time_unit: content.global?.uniteTemps || 'minutes',
          company: content.global?.company,
          product: content.global?.product,
          author: content.global?.author,
          version: content.global?.version
        });

        // Pour l'instant, on garde aussi la sauvegarde dans content pour compatibilité
        await updateA3Module(module.id, { content });

      } catch (error) {
        console.error('Erreur lors de la sauvegarde VSM:', error);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [content, vsmMap, isLoading, updateVSMMap, updateA3Module, module.id]);

  // Calcul des métriques
  const metrics = useMemo(() => calculateMetrics(content), [content]);

  // Fonctions de manipulation des éléments
  const addElement = async (type: VSMElementType) => {
    if (!vsmMap) {
      console.error('Aucune carte VSM trouvée');
      return;
    }

    try {
      const centerX = (window.innerWidth / 2 - viewState.pan.x) / viewState.zoom;
      const centerY = (window.innerHeight / 2 - viewState.pan.y) / viewState.zoom;

      // Créer l'élément dans la base de données
      const newElementId = await createVSMElement(vsmMap.id, {
        type: type,
        x: centerX - 140,
        y: centerY - 100,
        width: type === 'Kaizen' || type === 'Stock' ? 180 : 280,
        height: type === 'Stock' ? 140 : type === 'Kaizen' ? 140 : 180,
        data: { nom: `Nouveau ${type}` }
      } as any);

      console.log('Élément créé avec ID:', newElementId);

      // Recharger les éléments depuis la DB
      const updatedElements = getVSMElements(vsmMap.id);
      setVsmElements(updatedElements);

      // Convertir pour le format du composant
      const convertedElement: VSMElement = {
        id: newElementId,
        type,
        x: centerX - 140,
        y: centerY - 100,
        width: type === 'Kaizen' || type === 'Stock' ? 180 : 280,
        height: type === 'Stock' ? 140 : type === 'Kaizen' ? 140 : 180,
        data: { nom: `Nouveau ${type}` }
      };

      setContent(c => ({ ...c, elements: [...c.elements, convertedElement] }));
      setSelectedItemId(newElementId);

      console.log('Élément ajouté avec succès');

    } catch (error) {
      console.error('Erreur lors de la création de l\'élément:', error);
      // Fallback: ajouter l'élément localement si la DB échoue
      const centerX = (window.innerWidth / 2 - viewState.pan.x) / viewState.zoom;
      const centerY = (window.innerHeight / 2 - viewState.pan.y) / viewState.zoom;

      const fallbackElement: VSMElement = {
        id: `el-${Date.now()}`,
        type,
        x: centerX - 140,
        y: centerY - 100,
        width: type === 'Kaizen' || type === 'Stock' ? 180 : 280,
        height: type === 'Stock' ? 140 : type === 'Kaizen' ? 140 : 180,
        data: { nom: `Nouveau ${type}` }
      };

      setContent(c => ({ ...c, elements: [...c.elements, fallbackElement] }));
      setSelectedItemId(fallbackElement.id);
      console.log('Élément ajouté en mode fallback');
    }
  };

  const duplicateElement = async () => {
    if (!selectedItemId || !vsmMap) return;
    const element = content.elements.find(el => el.id === selectedItemId);
    if (!element) return;

    try {
      // Créer la copie dans la base de données
      const newElementId = await safeCreateVSMElement(vsmMap.id, {
        type: element.type,
        x: element.x + 20,
        y: element.y + 20,
        width: element.width,
        height: element.height,
        data: { ...element.data, nom: `${element.data.nom || 'Élément'} (copie)` }
      } as any);

      // Recharger les éléments depuis la DB
      const updatedElements = safeGetVSMElements(vsmMap.id);
      setVsmElements(updatedElements);

      // Créer l'élément dupliqué pour le composant
      const newElement: VSMElement = {
        ...element,
        id: newElementId,
        x: element.x + 20,
        y: element.y + 20,
        data: { ...element.data, nom: `${element.data.nom || 'Élément'} (copie)` }
      };

      setContent(c => ({ ...c, elements: [...c.elements, newElement] }));
      setSelectedItemId(newElementId);

      console.log('Élément dupliqué avec succès');

    } catch (error) {
      console.error('Erreur lors de la duplication de l\'élément:', error);
      // Fallback local
      const newElement: VSMElement = {
        ...element,
        id: `el-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
        data: { ...element.data, nom: `${element.data.nom || 'Élément'} (copie)` }
      };

      setContent(c => ({ ...c, elements: [...c.elements, newElement] }));
      setSelectedItemId(newElement.id);
    }
  };

  const updateElement = async (id: string, updates: Partial<VSMElement>) => {
    try {
      // Convertir les updates vers le format DB
      const dbUpdates: any = {};

      if (updates.x !== undefined) dbUpdates.x_position = updates.x;
      if (updates.y !== undefined) dbUpdates.y_position = updates.y;
      if (updates.width !== undefined) dbUpdates.width = updates.width;
      if (updates.height !== undefined) dbUpdates.height = updates.height;

      if (updates.data) {
        if (updates.data.nom !== undefined) dbUpdates.name = updates.data.nom;
        if (updates.data.tempsCycle !== undefined) dbUpdates.cycle_time = updates.data.tempsCycle;
        if (updates.data.tempsChangt !== undefined) dbUpdates.setup_time = updates.data.tempsChangt;
        if (updates.data.tauxDispo !== undefined) dbUpdates.availability_rate = updates.data.tauxDispo;
        if (updates.data.nbOperateurs !== undefined) dbUpdates.operator_count = updates.data.nbOperateurs;
        if (updates.data.rebut !== undefined) dbUpdates.scrap_rate = updates.data.rebut;
        if (updates.data.quantite !== undefined) dbUpdates.stock_quantity = updates.data.quantite;
        if (updates.data.frequence !== undefined) dbUpdates.frequency = updates.data.frequence;
        if (updates.data.details !== undefined) dbUpdates.details = updates.data.details;
        if (updates.data.contenu !== undefined) dbUpdates.content = updates.data.contenu;
      }

      await updateVSMElement(id, dbUpdates);

      // Mettre à jour l'état local
      setContent(c => ({
        ...c,
        elements: c.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      }));

    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'élément:', error);
    }
  };

  const deleteElement = async (id: string) => {
    try {
      await deleteVSMElement(id);

      // Mettre à jour l'état local
      setContent(c => ({
        ...c,
        elements: c.elements.filter(el => el.id !== id),
        connections: c.connections.filter(conn => conn.from.elementId !== id && conn.to.elementId !== id)
      }));

      setSelectedItemId(null);

    } catch (error) {
      console.error('Erreur lors de la suppression de l\'élément:', error);
    }
  };

  const updateConnection = async (id: string, updates: Partial<VSMConnection>) => {
    try {
      // Convertir les updates vers le format DB
      const dbUpdates: any = {};

      if (updates.type !== undefined) dbUpdates.connection_type = updates.type;
      if (updates.data) {
        if (updates.data.arrowType !== undefined) dbUpdates.arrow_type = updates.data.arrowType;
        if (updates.data.infoType !== undefined) dbUpdates.info_type = updates.data.infoType;
        if (updates.data.label !== undefined) dbUpdates.label = updates.data.label;
        if (updates.data.details !== undefined) dbUpdates.details = updates.data.details;
      }

      await updateVSMConnection(id, dbUpdates);

      // Mettre à jour l'état local
      setContent(c => ({
        ...c,
        connections: c.connections.map(conn => conn.id === id ? { ...conn, ...updates } : conn)
      }));

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la connexion:', error);
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      await deleteVSMConnection(id);

      // Mettre à jour l'état local
      setContent(c => ({
        ...c,
        connections: c.connections.filter(conn => conn.id !== id)
      }));

      setSelectedItemId(null);

    } catch (error) {
      console.error('Erreur lors de la suppression de la connexion:', error);
    }
  };

  // Gestion du zoom
  const resetView = () => {
    setViewState({ zoom: 1, pan: { x: 0, y: 0 } });
  };

  // Fonction de déselection
  const deselectAll = useCallback(() => {
    setSelectedItemId(null);
    setConnectingFrom(null);
  }, []);

  const zoomToFit = () => {
    if (content.elements.length === 0) return;
    
    const bounds = content.elements.reduce((acc, el) => ({
      minX: Math.min(acc.minX, el.x),
      maxX: Math.max(acc.maxX, el.x + el.width),
      minY: Math.min(acc.minY, el.y),
      maxY: Math.max(acc.maxY, el.y + el.height)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    
    if (canvasRect) {
      const scaleX = (canvasRect.width - 100) / width;
      const scaleY = (canvasRect.height - 100) / height;
      const newZoom = Math.min(scaleX, scaleY, 1.5);
      
      setViewState({
        zoom: newZoom,
        pan: {
          x: (canvasRect.width - width * newZoom) / 2 - bounds.minX * newZoom,
          y: (canvasRect.height - height * newZoom) / 2 - bounds.minY * newZoom
        }
      });
    }
  };

  // Gestion des connexions
  const handleAnchorClick = async (elementId: string, anchor: 'top' | 'bottom' | 'left' | 'right') => {
    if (mode !== 'connect' || !vsmMap) return;

    if (!connectingFrom) {
      setConnectingFrom({ elementId, anchor });
    } else {
      if (connectingFrom.elementId === elementId) {
        setConnectingFrom(null);
        return;
      }

      try {
        const connectionData = {
          from_element_id: connectingFrom.elementId,
          to_element_id: elementId,
          from_anchor: connectingFrom.anchor,
          to_anchor: anchor,
          connection_type: 'information' as const
        };

        const newConnectionId = await safeCreateVSMConnection(vsmMap.id, connectionData as any);

        const newConnection: VSMConnection = {
          id: newConnectionId,
          from: connectingFrom,
          to: { elementId, anchor },
          type: 'information',
          data: {}
        };

        setContent(c => ({ ...c, connections: [...c.connections, newConnection] }));
        setConnectingFrom(null);
        setMode('select');

      } catch (error) {
        console.error('Erreur lors de la création de la connexion:', error);
      }
    }
  };

  // Export/Import
  const exportVSM = () => {
    const dataStr = JSON.stringify(content, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportName = `VSM_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const importVSM = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setContent(imported);
          zoomToFit();
        } catch (error) {
          alert('Erreur lors de l\'import du fichier');
        }
      };
      reader.readAsText(file);
    }
  };

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        e.preventDefault();
        const element = content.elements.find(el => el.id === selectedItemId);
        const connection = content.connections.find(c => c.id === selectedItemId);
        if (element) deleteElement(selectedItemId);
        if (connection) deleteConnection(selectedItemId);
      }
      
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedItemId) {
        e.preventDefault();
        duplicateElement();
      }
      
      // Copy/Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedItemId) {
        e.preventDefault();
        const element = content.elements.find(el => el.id === selectedItemId);
        if (element) setCopiedElement(element);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedElement) {
        e.preventDefault();
        const newElement: VSMElement = {
          ...copiedElement,
          id: `el-${Date.now()}`,
          x: copiedElement.x + 20,
          y: copiedElement.y + 20
        };
        setContent(c => ({ ...c, elements: [...c.elements, newElement] }));
        setSelectedItemId(newElement.id);
      }
      
      // Modes
      if (e.key === 'v') setMode('select');
      if (e.key === 'c') setMode('connect');
      if (e.key === 'h') setMode('pan');

      // Désélection
      if (e.key === 'Escape') {
        e.preventDefault();
        deselectAll();
      }
      
      // Zoom
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetView();
      }
      if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setViewState(vs => ({ ...vs, zoom: Math.min(3, vs.zoom * 1.1) }));
      }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setViewState(vs => ({ ...vs, zoom: Math.max(0.2, vs.zoom / 1.1) }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, copiedElement, content, deselectAll]);

  // Fonction pour inverser le sens d'une connexion
  const handleReverseConnection = async (connectionId: string) => {
    if (!vsmMap) return;

    try {
      const connection = content.connections.find(c => c.id === connectionId);
      if (!connection) return;

      // Inverser from et to
      const reversedConnection = {
        from_element_id: connection.to.elementId,
        to_element_id: connection.from.elementId,
        from_anchor: connection.to.anchor,
        to_anchor: connection.from.anchor
      };

      // Mettre à jour dans la base de données
      await safeUpdateVSMConnection(connectionId, reversedConnection as any);

      // Recharger les connexions depuis la DB
      const updatedConnections = safeGetVSMConnections(vsmMap.id);
      setVsmConnections(updatedConnections);

      // Convertir pour le format du composant
      const convertedConnections = updatedConnections.map((conn: any) => ({
        id: conn.id,
        from: { elementId: conn.from_element_id, anchor: conn.from_anchor },
        to: { elementId: conn.to_element_id, anchor: conn.to_anchor },
        type: conn.connection_type,
        data: {
          arrowType: conn.arrow_type,
          infoType: conn.info_type,
          label: conn.label,
          details: conn.details
        }
      }));

      setContent(c => ({ ...c, connections: convertedConnections }));

      console.log('Connexion inversée avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'inversion de la connexion:', error);
    }
  };

  // Optimisations de performance avec useMemo
  const selectedElement = useMemo(() => content.elements.find(el => el.id === selectedItemId), [content.elements, selectedItemId]);
  const selectedConnection = useMemo(() => content.connections.find(c => c.id === selectedItemId), [content.connections, selectedItemId]);

  // Memo des éléments pour éviter les re-renders inutiles
  const memoizedElements = useMemo(() => content.elements, [content.elements]);
  const memoizedConnections = useMemo(() => content.connections, [content.connections]);

  // Refs pour optimiser les performances
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingUpdatesRef = useRef<Map<string, Partial<VSMElement>>>(new Map());

  // Callback optimisés avec useCallback et throttling
  const handleUpdateElement = useCallback(async (id: string, updates: Partial<VSMElement>) => {
    // Mettre à jour l'état local immédiatement pour une réponse fluide
    setContent(c => ({
      ...c,
      elements: c.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    }));

    // Accumuler les mises à jour en attente
    const currentPending = pendingUpdatesRef.current.get(id) || {};
    const newPending = { ...currentPending, ...updates };
    pendingUpdatesRef.current.set(id, newPending);

    // Annuler le timeout précédent
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Programmer la sauvegarde avec un délai optimisé
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const pendingUpdate = pendingUpdatesRef.current.get(id);
        if (pendingUpdate) {
          await updateElement(id, pendingUpdate);
          pendingUpdatesRef.current.delete(id);
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du déplacement:', error);
        // En cas d'erreur, recharger les données depuis la DB pour revenir à l'état correct
        if (vsmMap) {
          const elements = getVSMElements(vsmMap.id);
          const convertedElements = elements.map((el: any) => ({
            id: el.id,
            type: el.element_type as VSMElementType,
            x: el.x_position,
            y: el.y_position,
            width: el.width,
            height: el.height,
            data: {
              nom: el.name || '',
              tempsCycle: el.cycle_time || undefined,
              tempsChangt: el.setup_time || undefined,
              tauxDispo: el.availability_rate || undefined,
              nbOperateurs: el.operator_count || undefined,
              rebut: el.scrap_rate || undefined,
              quantite: el.stock_quantity || undefined,
              frequence: el.frequency || undefined,
              details: el.details || undefined,
              contenu: el.content || undefined
            }
          }));
          setContent(c => ({ ...c, elements: convertedElements }));
        }
      }
    }, 150); // Délai optimisé pour la fluidité
  }, [updateElement, vsmMap, getVSMElements]);

  const handleDeleteConnection = useCallback(async (id: string) => {
    if (!vsmMap) return;

    try {
      await safeDeleteVSMConnection(id);
      const updatedConnections = safeGetVSMConnections(vsmMap.id);
      setVsmConnections(updatedConnections);

      const convertedConnections = updatedConnections.map((conn: any) => ({
        id: conn.id,
        from: { elementId: conn.from_element_id, anchor: conn.from_anchor },
        to: { elementId: conn.to_element_id, anchor: conn.to_anchor },
        type: conn.connection_type,
        data: {
          arrowType: conn.arrow_type,
          infoType: conn.info_type,
          label: conn.label,
          details: conn.details
        }
      }));

      setContent(c => ({ ...c, connections: convertedConnections }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la connexion:', error);
    }
  }, [vsmMap]);

  // Optimisation supplémentaire : éviter les re-renders du canvas
  const canvasProps = useMemo(() => ({
    content: {
      ...content,
      elements: memoizedElements,
      connections: memoizedConnections
    },
    viewState,
    setViewState,
    mode,
    selectedItemId,
    setSelectedItemId,
    connectingFrom,
    setConnectingFrom,
    showGrid,
    onUpdateElement: handleUpdateElement,
    onDeleteConnection: handleDeleteConnection,
    onReverseConnection: handleReverseConnection,
    onAnchorClick: handleAnchorClick
  }), [
    content,
    memoizedElements,
    memoizedConnections,
    viewState,
    mode,
    selectedItemId,
    connectingFrom,
    showGrid,
    handleUpdateElement,
    handleDeleteConnection,
    handleReverseConnection,
    handleAnchorClick
  ]);

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Workflow className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Value Stream Mapping</h2>
                <p className="text-white/80 text-sm">Chargement de la carte VSM...</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Workflow className="w-8 h-8 text-teal-600" />
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement en cours</h3>
              <p className="text-gray-600">Connexion à la base de données VSM...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header avec dégradé moderne */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Workflow className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Value Stream Mapping</h2>
                <p className="text-white/80 text-sm">Cartographie de la chaîne de valeur - {content.global?.title || 'Sans titre'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <VSMToolbar
                onAddElement={addElement}
                mode={mode}
                setMode={setMode}
                onExport={exportVSM}
                onImport={importVSM}
                onResetView={resetView}
                onZoomToFit={zoomToFit}
                onDeselectAll={deselectAll}
                onResetWithExamples={async () => {
                  if (!vsmMap) return;

                  if (confirm('Cela va supprimer tous les éléments actuels et les remplacer par des exemples. Continuer ?')) {
                    try {
                      // Supprimer tous les éléments actuels
                      const currentElements = safeGetVSMElements(vsmMap.id);
                      const currentConnections = safeGetVSMConnections(vsmMap.id);

                      for (const element of currentElements) {
                        await safeDeleteVSMElement(element.id);
                      }

                      for (const connection of currentConnections) {
                        await safeDeleteVSMConnection(connection.id);
                      }

                      // Créer les exemples
                      await createVSMExampleElements(vsmMap.id);
                      await createVSMExampleConnections(vsmMap.id);

                      // Recharger
                      const elements = safeGetVSMElements(vsmMap.id);
                      const connections = safeGetVSMConnections(vsmMap.id);
                      setVsmElements(elements);
                      setVsmConnections(connections);

                      const convertedElements = elements.map((el: any) => ({
                        id: el.id,
                        type: el.type as VSMElementType,
                        x: el.x,
                        y: el.y,
                        width: el.width,
                        height: el.height,
                        data: el.data || {}
                      }));

                      const convertedConnections = connections.map((conn: any) => ({
                        id: conn.id,
                        from: { elementId: conn.from_element_id, anchor: conn.from_anchor },
                        to: { elementId: conn.to_element_id, anchor: conn.to_anchor },
                        type: conn.connection_type,
                        data: {
                          arrowType: conn.arrow_type,
                          infoType: conn.info_type,
                          label: conn.label,
                          details: conn.details
                        }
                      }));

                      setContent(c => ({
                        ...c,
                        elements: convertedElements,
                        connections: convertedConnections
                      }));

                      console.log('Exemples remis avec succès');

                    } catch (error) {
                      console.error('Erreur lors de la remise des exemples:', error);
                    }
                  }
                }}
                zoom={viewState.zoom}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                showMetrics={showMetrics}
                setShowMetrics={setShowMetrics}
              />
              <button
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Aide"
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Fermer"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <VSMCanvas
          ref={canvasRef}
          {...canvasProps}
        />

        {/* Right Panel avec style harmonisé */}
        <aside className="w-96 bg-white/70 backdrop-blur-sm border-l border-gray-200/50 p-6 overflow-y-auto">
          <VSMDetailsPanel
            element={selectedElement}
            connection={selectedConnection}
            onUpdateElement={updateElement}
            onUpdateConnection={updateConnection}
            onDelete={(id) => {
              if (selectedElement) deleteElement(id);
              if (selectedConnection) deleteConnection(id);
            }}
            globalData={content.global}
            onUpdateGlobal={(updates) => {
              setContent(c => ({ ...c, global: { ...c.global, ...updates } }));
            }}
            metrics={metrics}
            showMetrics={showMetrics}
          />
        </aside>
      </main>

        {/* Help Modal */}
        {showHelp && <VSMHelp onClose={() => setShowHelp(false)} />}
      </div>
    </div>
  );
};