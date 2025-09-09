// src/components/project/editors/FiveSEditorNew.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { A3Module, FiveSItem as DBFiveSItem, FiveSPhoto, FiveSCategory } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../Lib/supabase';
import {
  Plus,
  HelpCircle,
  X,
  Camera,
  Users,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';
interface FiveSEditorNewProps {
  module: A3Module;
  onClose: () => void;
}
// Interfaces locales pour l'interface utilisateur
interface FiveSItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  position: number;
  photos?: FiveSPhoto[];
}
interface FiveSChecklist {
  id: string;
  title: string;
  description?: string;
  area?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  seiri: FiveSItem[];
  seiton: FiveSItem[];
  seiso: FiveSItem[];
  seiketsu: FiveSItem[];
  shitsuke: FiveSItem[];
  created_at: string;
  updated_at: string;
}
const FIVE_S_PILLARS = [
  {
    key: 'seiri' as const,
    title: 'Seiri - Trier',
    description: 'Éliminer l\'inutile',
    color: 'from-red-500 to-pink-600',
    bgColor: 'from-red-50 to-pink-50',
    borderColor: 'border-red-200',
    icon: '🗂️'
  },
  {
    key: 'seiton' as const,
    title: 'Seiton - Ranger',
    description: 'Une place pour chaque chose',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    icon: '📍'
  },
  {
    key: 'seiso' as const,
    title: 'Seiso - Nettoyer',
    description: 'Nettoyer et inspecter',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    icon: '🧽'
  },
  {
    key: 'seiketsu' as const,
    title: 'Seiketsu - Standardiser',
    description: 'Maintenir la propreté',
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-200',
    icon: '📋'
  },
  {
    key: 'shitsuke' as const,
    title: 'Shitsuke - Maintenir',
    description: 'Respecter les règles',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    icon: '🔄'
  }
];
export const FiveSEditorNew: React.FC<FiveSEditorNewProps> = ({ module, onClose }) => {
   const { user } = useAuth();
   const {
     updateA3Module,
     getFiveSChecklists,
     createFiveSChecklist,
     updateFiveSChecklist,
     getFiveSItems,
     createFiveSItem,
     updateFiveSItem,
     deleteFiveSItem
   } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);
  const [checklist, setChecklist] = useState<FiveSChecklist | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'seiri' | 'seiton' | 'seiso' | 'seiketsu' | 'shitsuke'>('overview');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FiveSItem | null>(null);
  // Refs pour le debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');
  // CHARGEMENT INITIAL
  useEffect(() => {
    if (!isLoaded) {
      const loadChecklist = async () => {
        try {
          // Charger les checklists 5S depuis Supabase
          const checklists = getFiveSChecklists(module.id);
          if (checklists.length > 0) {
            const checklist = checklists[0]; // Prendre la première checklist
            // Charger les items pour chaque pilier
            const allItems = getFiveSItems(checklist.id);
            const seiriItems: FiveSItem[] = allItems.filter(item => item.category === 'seiri').map(item => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              status: item.status,
              priority: item.priority,
              assigned_to: item.assigned_to || undefined,
              due_date: item.due_date || undefined,
              completed_at: item.completed_at || undefined,
              position: item.position,
              photos: [] // Sera chargé séparément si nécessaire
            }));
            const seitonItems: FiveSItem[] = allItems.filter(item => item.category === 'seiton').map(item => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              status: item.status,
              priority: item.priority,
              assigned_to: item.assigned_to || undefined,
              due_date: item.due_date || undefined,
              completed_at: item.completed_at || undefined,
              position: item.position,
              photos: []
            }));
            const seisoItems: FiveSItem[] = allItems.filter(item => item.category === 'seiso').map(item => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              status: item.status,
              priority: item.priority,
              assigned_to: item.assigned_to || undefined,
              due_date: item.due_date || undefined,
              completed_at: item.completed_at || undefined,
              position: item.position,
              photos: []
            }));
            const seiketsuItems: FiveSItem[] = allItems.filter(item => item.category === 'seiketsu').map(item => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              status: item.status,
              priority: item.priority,
              assigned_to: item.assigned_to || undefined,
              due_date: item.due_date || undefined,
              completed_at: item.completed_at || undefined,
              position: item.position,
              photos: []
            }));
            const shitsukeItems: FiveSItem[] = allItems.filter(item => item.category === 'shitsuke').map(item => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              status: item.status,
              priority: item.priority,
              assigned_to: item.assigned_to || undefined,
              due_date: item.due_date || undefined,
              completed_at: item.completed_at || undefined,
              position: item.position,
              photos: []
            }));
            const fullChecklist: FiveSChecklist = {
              ...checklist,
              seiri: seiriItems,
              seiton: seitonItems,
              seiso: seisoItems,
              seiketsu: seiketsuItems,
              shitsuke: shitsukeItems
            };
            setChecklist(fullChecklist);
          } else {
            // Créer une nouvelle checklist si aucune n'existe
            const checklistId = await createFiveSChecklist(module.id, 'Checklist 5S', 'Évaluation et amélioration selon la méthode 5S');
            const newChecklist: FiveSChecklist = {
              id: checklistId,
              title: 'Checklist 5S',
              description: 'Évaluation et amélioration selon la méthode 5S',
              status: 'draft',
              seiri: [],
              seiton: [],
              seiso: [],
              seiketsu: [],
              shitsuke: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setChecklist(newChecklist);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la checklist:', error);
          // Fallback vers le stockage local si Supabase échoue
          const existingChecklist = module.content?.checklist;
          if (existingChecklist) {
            setChecklist(existingChecklist);
          }
        }
        setIsLoaded(true);
      };
      loadChecklist();
    }
  }, [module.id, module.content, isLoaded, getFiveSChecklists, getFiveSItems, createFiveSChecklist]);
  // SAUVEGARDE OPTIMISÉE avec debouncing
  const debouncedSave = useCallback(async (checklistToSave: FiveSChecklist) => {
    const currentDataString = JSON.stringify(checklistToSave);
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateA3Module(module.id, {
          content: { ...module.content, checklist: checklistToSave }
        });
        lastSavedDataRef.current = currentDataString;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }, 1000);
  }, [updateA3Module, module.content, module.id]);
  const updateChecklist = useCallback((newChecklist: FiveSChecklist) => {
    setChecklist(newChecklist);
    debouncedSave(newChecklist);
  }, [debouncedSave]);
  // Gestion des items
  const addItem = async (pillar: keyof FiveSChecklist) => {
    if (!checklist || !user) return;
    try {
      const pillarItems = checklist[pillar] as FiveSItem[];
      const itemId = await createFiveSItem(checklist.id, pillar as FiveSCategory, '', '');
      const newItem: FiveSItem = {
        id: itemId,
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        position: pillarItems.length,
        photos: []
      };
      const updatedChecklist = {
        ...checklist,
        [pillar]: [...pillarItems, newItem],
        updated_at: new Date().toISOString()
      };
      updateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Erreur lors de la création de l\'item:', error);
      alert('Erreur lors de la création de l\'item.');
    }
  };
  const updateItem = async (pillar: keyof FiveSChecklist, itemId: string, updates: Partial<FiveSItem>) => {
    if (!checklist) return;
    try {
      await updateFiveSItem(itemId, updates);
      const pillarItems = checklist[pillar] as FiveSItem[];
      const updatedItems = pillarItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      const updatedChecklist = {
        ...checklist,
        [pillar]: updatedItems,
        updated_at: new Date().toISOString()
      };
      updateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'item:', error);
      alert('Erreur lors de la mise à jour de l\'item.');
    }
  };
  const removeItem = async (pillar: keyof FiveSChecklist, itemId: string) => {
    if (!checklist) return;
    try {
      await deleteFiveSItem(itemId);
      const pillarItems = checklist[pillar] as FiveSItem[];
      const updatedItems = pillarItems.filter(item => item.id !== itemId);
      const updatedChecklist = {
        ...checklist,
        [pillar]: updatedItems,
        updated_at: new Date().toISOString()
      };
      updateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'item:', error);
      alert('Erreur lors de la suppression de l\'item.');
    }
  };
  // Calcul des statistiques
  const getStats = () => {
    if (!checklist) return { total: 0, completed: 0, inProgress: 0, percentage: 0 };
    const allItems = [
      ...checklist.seiri,
      ...checklist.seiton,
      ...checklist.seiso,
      ...checklist.seiketsu,
      ...checklist.shitsuke
    ];
    const total = allItems.length;
    const completed = allItems.filter(item => item.status === 'completed').length;
    const inProgress = allItems.filter(item => item.status === 'in_progress').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, percentage };
  };
  const stats = getStats();
  if (!isLoaded || !checklist) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-gray-700">Chargement du module 5S...</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">5S</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{checklist.title}</h2>
                <p className="text-white/80 text-sm">Module 5S - Amélioration continue</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 group"
                title="Aide"
              >
                <HelpCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
        {/* Navigation par onglets */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Vue d'ensemble
            </button>
            {FIVE_S_PILLARS.map((pillar) => (
              <button
                key={pillar.key}
                onClick={() => setActiveTab(pillar.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === pillar.key
                    ? `bg-gradient-to-r ${pillar.color} text-white shadow-lg`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{pillar.icon}</span>
                <span>{pillar.title.split(' - ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Zone de contenu principal avec scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Statistiques générales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total items</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Terminés</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">En cours</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{stats.percentage}%</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Progression</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.percentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Aperçu des piliers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {FIVE_S_PILLARS.map((pillar) => {
                    const pillarItems = checklist[pillar.key];
                    const completedCount = pillarItems.filter(item => item.status === 'completed').length;
                    const progress = pillarItems.length > 0 ? Math.round((completedCount / pillarItems.length) * 100) : 0;
                    return (
                      <div
                        key={pillar.key}
                        className={`bg-gradient-to-br ${pillar.bgColor} rounded-2xl p-6 border ${pillar.borderColor} cursor-pointer hover:shadow-lg transition-all duration-200`}
                        onClick={() => setActiveTab(pillar.key)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{pillar.icon}</span>
                            <div>
                              <h3 className="font-bold text-gray-900">{pillar.title}</h3>
                              <p className="text-sm text-gray-600">{pillar.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progression</span>
                            <span className="font-semibold">{completedCount}/{pillarItems.length}</span>
                          </div>
                          <div className="w-full bg-white/50 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${pillar.color}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Onglets des piliers */}
            {FIVE_S_PILLARS.map((pillar) => {
              if (activeTab !== pillar.key) return null;
              const pillarItems = checklist[pillar.key];
              return (
                <div key={pillar.key} className="space-y-6">
                  {/* Header du pilier */}
                  <div className={`bg-gradient-to-r ${pillar.color} rounded-2xl p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">{pillar.icon}</span>
                        <div>
                          <h3 className="text-xl font-bold">{pillar.title}</h3>
                          <p className="text-white/80">{pillar.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addItem(pillar.key)}
                        className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-xl transition-all duration-200"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Ajouter un item</span>
                      </button>
                    </div>
                  </div>
                  {/* Liste des items */}
                  <div className="space-y-4">
                    {pillarItems.length === 0 ? (
                      <div className="text-center py-16">
                        <span className="text-6xl mb-4 block">{pillar.icon}</span>
                        <h3 className="text-xl font-semibold text-gray-500 mb-2">Aucun item défini</h3>
                        <p className="text-gray-400">Commencez par ajouter des points de contrôle pour ce pilier.</p>
                      </div>
                    ) : (
                      pillarItems.map((item, index) => (
                        <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4 flex-1">
                              {/* Status */}
                              <div className="flex-shrink-0">
                                {item.status === 'completed' ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                                ) : item.status === 'in_progress' ? (
                                  <Clock className="w-6 h-6 text-yellow-600" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              {/* Contenu */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(pillar.key, item.id, { title: e.target.value })}
                                    className="flex-1 text-lg font-semibold bg-transparent border-0 focus:ring-0 p-0 placeholder-gray-400"
                                    placeholder="Titre de l'item..."
                                  />
                                  <select
                                    value={item.priority}
                                    onChange={(e) => updateItem(pillar.key, item.id, { priority: e.target.value as any })}
                                    className="px-3 py-1 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500"
                                  >
                                    <option value="low">Faible</option>
                                    <option value="medium">Moyen</option>
                                    <option value="high">Élevé</option>
                                    <option value="critical">Critique</option>
                                  </select>
                                </div>
                                <textarea
                                  value={item.description}
                                  onChange={(e) => updateItem(pillar.key, item.id, { description: e.target.value })}
                                  className="w-full text-sm bg-transparent border-0 focus:ring-0 p-0 placeholder-gray-400 resize-none"
                                  placeholder="Description détaillée..."
                                  rows={2}
                                />
                                {/* Métadonnées */}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  {item.assigned_to && (
                                    <div className="flex items-center space-x-1">
                                      <User className="w-4 h-4" />
                                      <span>Assigné à {item.assigned_to}</span>
                                    </div>
                                  )}
                                  {item.due_date && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>Échéance: {new Date(item.due_date).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {item.photos && item.photos.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <ImageIcon className="w-4 h-4" />
                                      <span>{item.photos.length} photo(s)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <select
                                value={item.status}
                                onChange={(e) => updateItem(pillar.key, item.id, {
                                  status: e.target.value as any,
                                  completed_at: e.target.value === 'completed' ? new Date().toISOString() : undefined
                                })}
                                className="px-3 py-1 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500"
                              >
                                <option value="pending">À faire</option>
                                <option value="in_progress">En cours</option>
                                <option value="completed">Terminé</option>
                                <option value="cancelled">Annulé</option>
                              </select>
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowPhotoModal(true);
                                }}
                                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                                title="Gérer les photos"
                              >
                                <Camera className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => removeItem(pillar.key, item.id)}
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Modal d'aide */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Méthode 5S - Guide complet</h3>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
                <div className="grid md:grid-cols-2 gap-8">
                  {FIVE_S_PILLARS.map((pillar) => (
                    <div key={pillar.key} className={`bg-gradient-to-br ${pillar.bgColor} p-6 rounded-xl border ${pillar.borderColor}`}>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="text-2xl mr-3">{pillar.icon}</span>
                        {pillar.title}
                      </h4>
                      <p className="text-gray-600 mb-4">{pillar.description}</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>Définir des objectifs clairs et mesurables</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>Assigner des responsabilités</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>Suivre la progression régulièrement</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-3">Conseils pratiques</h4>
                  <ul className="text-yellow-700 space-y-2">
                    <li>• Commencez petit : choisissez une zone limitée pour appliquer la méthode</li>
                    <li>• Impliquez toute l'équipe dans le processus</li>
                    <li>• Prenez des photos avant/après pour documenter les améliorations</li>
                    <li>• Fixez des dates d'échéance réalistes pour chaque action</li>
                    <li>• Célébrez les succès et apprenez des difficultés rencontrées</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Compris !
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de gestion des photos */}
        {showPhotoModal && selectedItem && (
          <PhotoManagerModal
            item={selectedItem}
            checklistId={checklist.id}
            userId={user?.id}
            onClose={() => {
              setShowPhotoModal(false);
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
// Composant de gestion des photos
interface PhotoManagerModalProps {
  item: FiveSItem;
  checklistId: string;
  userId?: string;
  onClose: () => void;
}
const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({ item, checklistId, userId, onClose }) => {
  const { getFiveSPhotos, createFiveSPhoto, deleteFiveSPhoto, getFiveSPhotoComments, createFiveSPhotoComment } = useDatabase();
  const [photos, setPhotos] = useState<FiveSPhoto[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'progress' | 'reference'>('before');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // Charger les photos existantes
    const existingPhotos = getFiveSPhotos(item.id);
    setPhotos(existingPhotos);
  }, [item.id, getFiveSPhotos]);
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Caméra arrière si disponible
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Erreur lors de l\'accès à la caméra:', error);
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Dessiner l'image de la vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Convertir en blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        await uploadPhoto(blob);
      }
    }, 'image/jpeg', 0.8);
  };
  const uploadPhoto = async (blob: Blob) => {
    if (!userId) {
      alert('Vous devez être connecté pour uploader des photos.');
      return;
    }
    setIsUploading(true);
    try {
      // Créer un nom de fichier unique
      const filename = `5s_${item.id}_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });
      // Upload vers Supabase Storage
      const filePath = `5s_photos/${filename}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('5s-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) {
        throw uploadError;
      }
      // Créer l'entrée dans la base de données
      await createFiveSPhoto({
        item_id: item.id,
        checklist_id: checklistId,
        filename,
        original_filename: filename,
        file_path: filePath,
        file_size: blob.size,
        mime_type: 'image/jpeg',
        photo_type: photoType,
        description: description || undefined,
        taken_at: new Date().toISOString(),
        uploaded_by: userId
      });
      // Recharger les photos
      const updatedPhotos = getFiveSPhotos(item.id);
      setPhotos(updatedPhotos);
      // Réinitialiser le formulaire
      setDescription('');
      setPhotoType('before');
      stopCamera();
      alert('Photo ajoutée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de la photo.');
    } finally {
      setIsUploading(false);
    }
  };
  const deletePhoto = async (photoId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      try {
        // Récupérer les informations de la photo avant suppression
        const photoToDelete = photos.find(p => p.id === photoId);
        if (!photoToDelete) {
          throw new Error('Photo non trouvée');
        }
        // Supprimer d'abord de la base de données
        await deleteFiveSPhoto(photoId);
        // Supprimer le fichier du storage Supabase si le chemin existe
        if (photoToDelete.file_path) {
          const { error: storageError } = await supabase.storage
            .from('5s-photos')
            .remove([photoToDelete.file_path]);
          if (storageError) {
            console.warn('Erreur lors de la suppression du fichier storage:', storageError);
            // Ne pas échouer complètement si la suppression du storage échoue
          }
        }
        // Recharger les photos
        const updatedPhotos = getFiveSPhotos(item.id);
        setPhotos(updatedPhotos);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la photo.');
      }
    }
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadPhoto(file);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Photos - {item.title}</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={startCamera}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              <Camera className="w-5 h-5" />
              <span>Prendre une photo</span>
            </button>
            <label className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 cursor-pointer">
              <ImageIcon className="w-5 h-5" />
              <span>Importer une photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          {/* Interface caméra */}
          {isCameraOpen && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex flex-col items-center space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md rounded-lg border border-gray-300"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex flex-col space-y-3 w-full max-w-md">
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="before">Avant (Before)</option>
                    <option value="after">Après (After)</option>
                    <option value="progress">Progression</option>
                    <option value="reference">Référence</option>
                  </select>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description de la photo..."
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={takePhoto}
                      disabled={isUploading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isUploading ? 'Upload...' : 'Prendre la photo'}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Galerie de photos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Photos ({photos.length})</h4>
            {photos.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h5 className="text-lg font-semibold text-gray-500 mb-2">Aucune photo</h5>
                <p className="text-gray-400">Ajoutez des photos pour documenter vos progrès 5S.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      {photo.file_path ? (
                        <img
                          src={supabase.storage.from('5s-photos').getPublicUrl(photo.file_path).data.publicUrl}
                          alt={photo.description || 'Photo 5S'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Erreur de chargement de l\'image:', e);
                            // Fallback vers l'icône si l'image ne se charge pas
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <ImageIcon className="w-12 h-12 text-gray-400 fallback-icon" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          photo.photo_type === 'before' ? 'bg-red-100 text-red-800' :
                          photo.photo_type === 'after' ? 'bg-green-100 text-green-800' :
                          photo.photo_type === 'progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {photo.photo_type === 'before' ? 'Avant' :
                           photo.photo_type === 'after' ? 'Après' :
                           photo.photo_type === 'progress' ? 'Progression' : 'Référence'}
                        </span>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                      {photo.description && (
                        <p className="text-sm text-gray-600 mb-2">{photo.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(photo.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};