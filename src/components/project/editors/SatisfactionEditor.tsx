import React, { useState, useEffect, useCallback, useRef } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import {
  Heart, Plus, X, HelpCircle, Settings, Calendar, MessageCircle,
  Star, TrendingUp, Users, Wrench, Factory, ChevronRight, 
  ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, Target,
  BarChart3, Clock, FileText, Smile, Frown, Meh, Edit2
} from 'lucide-react';

// Types pour le module de satisfaction
interface SatisfactionEntry {
  id: string;
  category: string;
  rating: number; // 1-5
  comment?: string;
  improvementSuggestion?: string;
  date: string;
  evaluatedBy?: string;
}

interface SatisfactionCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  examples: string[];
}

interface SatisfactionContent {
  entries: SatisfactionEntry[];
  categories: SatisfactionCategory[];
  settings?: {
    enableComments: boolean;
    enableSuggestions: boolean;
    anonymousMode: boolean;
  };
}

// Configuration des catégories de satisfaction
const DEFAULT_CATEGORIES: SatisfactionCategory[] = [
  {
    id: 'workplace',
    name: 'Poste de Travail',
    icon: Factory,
    color: 'blue',
    description: 'Ergonomie, sécurité et conditions de travail',
    examples: [
      'Confort et ergonomie du poste',
      'Disponibilité des outils nécessaires',
      'Sécurité et propreté de l\'environnement',
      'Éclairage et température'
    ]
  },
  {
    id: 'process',
    name: 'Processus & Méthodes',
    icon: Settings,
    color: 'green',
    description: 'Efficacité et clarté des processus de travail',
    examples: [
      'Clarté des instructions de travail',
      'Fluidité du processus de production',
      'Facilité de réalisation des tâches',
      'Temps alloué pour les activités'
    ]
  },
  {
    id: 'equipment',
    name: 'Équipements & Outils',
    icon: Wrench,
    color: 'orange',
    description: 'Performance et fiabilité des équipements',
    examples: [
      'Fiabilité des machines',
      'Facilité d\'utilisation des outils',
      'Maintenance et disponibilité',
      'Performance des équipements'
    ]
  },
  {
    id: 'management',
    name: 'Management & Communication',
    icon: Users,
    color: 'purple',
    description: 'Relations, communication et soutien hiérarchique',
    examples: [
      'Qualité de la communication',
      'Soutien de la hiérarchie',
      'Reconnaissance du travail',
      'Écoute et feedback'
    ]
  },
  {
    id: 'improvement',
    name: 'Amélioration Continue',
    icon: TrendingUp,
    color: 'emerald',
    description: 'Participation et efficacité des améliorations',
    examples: [
      'Possibilité de proposer des améliorations',
      'Mise en œuvre des suggestions',
      'Formation et développement',
      'Innovation et créativité'
    ]
  }
];

// Map de résolution d'icônes pour normaliser les données persistées
const ICONS_BY_ID: Record<string, any> = {
  workplace: Factory,
  process: Settings,
  equipment: Wrench,
  management: Users,
  improvement: TrendingUp,
};

const ICONS_BY_NAME: Record<string, any> = {
  Heart,
  Plus,
  X,
  HelpCircle,
  Settings,
  Calendar,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Factory,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle2,
  Target,
  BarChart3,
  Clock,
  FileText,
  Smile,
  Frown,
  Meh,
  Edit2,
};

export const SatisfactionEditor: React.FC<{ module: A3Module; onClose: () => void }> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SatisfactionEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Formulaire pour nouvelle évaluation
  const [newEntry, setNewEntry] = useState({
    category: '',
    rating: 0,
    comment: '',
    improvementSuggestion: ''
  });

  // Initialisation du contenu
  const initializeContent = (): SatisfactionContent => {
    if (module.content?.entries) {
      const saved = module.content as SatisfactionContent;
      // Normaliser les icônes persistées (qui ne doivent PAS être stockées comme composants)
      const normalizedCategories = (saved.categories && saved.categories.length > 0
        ? saved.categories
        : DEFAULT_CATEGORIES
      ).map((c) => {
        const iconFromId = ICONS_BY_ID[c.id];
        const iconFromName = typeof c.icon === 'string' ? ICONS_BY_NAME[c.icon] : undefined;
        const iconIsComponent = typeof c.icon === 'function';
        return {
          ...c,
          icon: iconIsComponent ? c.icon : (iconFromId || iconFromName || (DEFAULT_CATEGORIES.find(d => d.id === c.id)?.icon) || Heart),
        };
      });

      return {
        ...saved,
        categories: normalizedCategories,
      } as SatisfactionContent;
    }
    return {
      entries: [],
      categories: DEFAULT_CATEGORIES,
      settings: {
        enableComments: true,
        enableSuggestions: true,
        anonymousMode: false
      }
    };
  };

  const [content, setContent] = useState<SatisfactionContent>(initializeContent());

  // Sauvegarde avec debounce
  const debouncedSave = useCallback(async (newContent: SatisfactionContent) => {
    setSaveStatus('saving');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setContent(newContent);
        await updateA3Module(module.id, { content: newContent });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (error) {
        setSaveStatus('error');
        console.error('Erreur de sauvegarde:', error);
      }
    }, 1000);
  }, [updateA3Module, module.id]);

  // Ouvrir une évaluation en édition
  const editEntry = (entry: SatisfactionEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      category: entry.category,
      rating: entry.rating,
      comment: entry.comment || '',
      improvementSuggestion: entry.improvementSuggestion || ''
    });
    setShowNewEntry(true);
  };

  // Ajouter ou modifier une évaluation
  const addEntry = () => {
    if (!newEntry.category || newEntry.rating === 0) {
      alert('Veuillez sélectionner une catégorie et une note');
      return;
    }

    if (editingEntry) {
      // Mode édition : modifier l'entrée existante
      const updatedEntry: SatisfactionEntry = {
        ...editingEntry,
        category: newEntry.category,
        rating: newEntry.rating,
        comment: newEntry.comment || undefined,
        improvementSuggestion: newEntry.improvementSuggestion || undefined,
        date: editingEntry.date // Garder la date originale
      };

      const newContent = {
        ...content,
        entries: content.entries.map(e => e.id === editingEntry.id ? updatedEntry : e)
      };

      debouncedSave(newContent);
    } else {
      // Mode création : nouvelle entrée
      const entry: SatisfactionEntry = {
        id: `entry-${Date.now()}`,
        category: newEntry.category,
        rating: newEntry.rating,
        comment: newEntry.comment || undefined,
        improvementSuggestion: newEntry.improvementSuggestion || undefined,
        date: new Date().toISOString(),
        evaluatedBy: content.settings?.anonymousMode ? undefined : 'Utilisateur'
      };

      const newContent = {
        ...content,
        entries: [...content.entries, entry]
      };

      debouncedSave(newContent);
    }
    
    // Reset du formulaire
    setNewEntry({
      category: '',
      rating: 0,
      comment: '',
      improvementSuggestion: ''
    });
    setEditingEntry(null);
    setShowNewEntry(false);
  };

  // Supprimer une évaluation
  const deleteEntry = (entryId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
      const newContent = {
        ...content,
        entries: content.entries.filter(e => e.id !== entryId)
      };
      debouncedSave(newContent);
    }
  };

  // Obtenir les statistiques d'une catégorie
  const getCategoryStats = (categoryId: string) => {
    const categoryEntries = content.entries.filter(e => e.category === categoryId);
    if (categoryEntries.length === 0) return null;

    const avgRating = categoryEntries.reduce((sum, e) => sum + e.rating, 0) / categoryEntries.length;
    const lastEntry = categoryEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return {
      count: categoryEntries.length,
      avgRating: Math.round(avgRating * 10) / 10,
      lastRating: lastEntry.rating,
      lastDate: lastEntry.date,
      trend: categoryEntries.length >= 2 ? 
        (lastEntry.rating - categoryEntries[categoryEntries.length - 2].rating) : 0
    };
  };

  // Obtenir l'emoji de satisfaction
  const getSatisfactionEmoji = (rating: number) => {
    switch (rating) {
      case 1: return '😞';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😍';
      default: return '❓';
    }
  };

  // Obtenir la couleur selon la note
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100';
    if (rating >= 3.5) return 'text-blue-600 bg-blue-100';
    if (rating >= 2.5) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 1.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header avec dégradé satisfaction */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Baromètre Satisfaction</h1>
                <p className="text-white/80 text-sm">Évaluation continue pour l'amélioration Lean</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Indicateur de sauvegarde */}
              {saveStatus && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
                  saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
                  saveStatus === 'saved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>
                    {saveStatus === 'saving' ? 'Sauvegarde...' :
                     saveStatus === 'saved' ? 'Sauvegardé' :
                     'Erreur de sauvegarde'}
                  </span>
                </div>
              )}
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
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Zone principale */}
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-white via-slate-50 to-emerald-50">
          {/* Zone principale avec scroll */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {/* Bouton d'ajout */}
            <div className="mb-6">
              <button
                onClick={() => setShowNewEntry(true)}
                className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Nouvelle Évaluation</span>
                <Heart className="w-4 h-4" />
              </button>
            </div>

            {content.entries.length === 0 ? (
              // État vide
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune évaluation encore</h3>
                  <p className="text-gray-600 mb-6">Commencez par évaluer la satisfaction sur votre environnement de travail.</p>
                  <button
                    onClick={() => setShowNewEntry(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Première évaluation</span>
                  </button>
                </div>
              </div>
            ) : (
              // Grille des catégories avec statistiques
              <div className="space-y-8">
                {/* Vue d'ensemble */}
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-emerald-600" />
                    Vue d'ensemble
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-emerald-700 font-medium">Total Évaluations</p>
                          <p className="text-2xl font-bold text-emerald-900">{content.entries.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-emerald-600" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-teal-700 font-medium">Note Moyenne</p>
                          <p className="text-2xl font-bold text-teal-900">
                            {content.entries.length > 0 
                              ? (content.entries.reduce((sum, e) => sum + e.rating, 0) / content.entries.length).toFixed(1)
                              : '0.0'
                            }
                          </p>
                        </div>
                        <Star className="w-8 h-8 text-teal-600" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-cyan-700 font-medium">Dernière Évaluation</p>
                          <p className="text-sm font-semibold text-cyan-900">
                            {content.entries.length > 0
                              ? new Date(content.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date)
                                  .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                              : 'Aucune'
                            }
                          </p>
                        </div>
                        <Calendar className="w-8 h-8 text-cyan-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grille des catégories */}
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  {content.categories.map((category) => {
                    const stats = getCategoryStats(category.id);
                    const Icon = category.icon;
                    
                    return (
                      <div key={category.id} className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200">
                        {/* Header de catégorie */}
                        <div className={`bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 p-4 border-b border-white/10`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white">{category.name}</h4>
                                <p className="text-white/80 text-sm">{category.description}</p>
                              </div>
                            </div>
                            {stats && (
                              <div className="text-right">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRatingColor(stats.avgRating)}`}>
                                  <Star className="w-4 h-4 mr-1" />
                                  {stats.avgRating}
                                </div>
                                <p className="text-white/70 text-xs mt-1">
                                  {stats.count} évaluation{stats.count > 1 ? 's' : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contenu de la catégorie */}
                        <div className="p-4">
                          {stats ? (
                            <div className="space-y-4">
                              {/* Dernières évaluations */}
                              <div>
                                <h5 className="font-semibold text-gray-800 mb-2">Dernières évaluations</h5>
                                <div className="space-y-2">
                                  {content.entries
                                    .filter(e => e.category === category.id)
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .slice(0, 3)
                                    .map((entry) => (
                                      <div key={entry.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                          <span className="text-2xl">{getSatisfactionEmoji(entry.rating)}</span>
                                          <div>
                                            <div className="flex items-center space-x-1">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                  key={star}
                                                  className={`w-4 h-4 ${
                                                    star <= entry.rating 
                                                      ? 'text-yellow-400 fill-current' 
                                                      : 'text-gray-300'
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                              {new Date(entry.date).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {entry.comment && (
                                            <MessageCircle className="w-4 h-4 text-blue-500" title="Commentaire" />
                                          )}
                                          {entry.improvementSuggestion && (
                                            <TrendingUp className="w-4 h-4 text-green-500" title="Suggestion" />
                                          )}
                                          <button
                                            onClick={() => editEntry(entry)}
                                            className="w-6 h-6 text-blue-500 hover:bg-blue-100 rounded flex items-center justify-center transition-colors"
                                            title="Modifier"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => deleteEntry(entry.id)}
                                            className="w-6 h-6 text-red-500 hover:bg-red-100 rounded flex items-center justify-center transition-colors"
                                            title="Supprimer"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon className={`w-6 h-6 text-${category.color}-500`} />
                              </div>
                              <p className="text-gray-500 text-sm">Aucune évaluation pour cette catégorie</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de nouvelle évaluation */}
      {showNewEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header du modal */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingEntry ? 'Modifier l\'Évaluation' : 'Nouvelle Évaluation'}
                    </h3>
                    <p className="text-emerald-100 text-sm">
                      {editingEntry ? 'Modifiez votre évaluation existante' : 'Évaluez votre satisfaction'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowNewEntry(false);
                    setEditingEntry(null);
                    setNewEntry({
                      category: '',
                      rating: 0,
                      comment: '',
                      improvementSuggestion: ''
                    });
                  }}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Sélection de catégorie */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Catégorie à évaluer *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {content.categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setNewEntry({ ...newEntry, category: category.id })}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          newEntry.category === category.id
                            ? `border-${category.color}-500 bg-${category.color}-50 shadow-lg`
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-${category.color}-100`}>
                            <Icon className={`w-5 h-5 text-${category.color}-600`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note de satisfaction */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Note de satisfaction *
                </label>
                <div className="flex items-center justify-center space-x-4 bg-gray-50 p-6 rounded-xl">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setNewEntry({ ...newEntry, rating })}
                      className={`flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 ${
                        newEntry.rating === rating
                          ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg'
                          : 'hover:bg-white hover:shadow-md border-2 border-transparent'
                      }`}
                    >
                      <span className="text-3xl">{getSatisfactionEmoji(rating)}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {rating === 1 ? 'Très insatisfait' :
                         rating === 2 ? 'Insatisfait' :
                         rating === 3 ? 'Neutre' :
                         rating === 4 ? 'Satisfait' :
                         'Très satisfait'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={newEntry.comment}
                  onChange={(e) => setNewEntry({ ...newEntry, comment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  rows={3}
                  placeholder="Expliquez les raisons de votre évaluation..."
                />
              </div>

              {/* Suggestion d'amélioration */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Suggestion d'amélioration (optionnel)
                </label>
                <textarea
                  value={newEntry.improvementSuggestion}
                  onChange={(e) => setNewEntry({ ...newEntry, improvementSuggestion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  rows={3}
                  placeholder="Comment pourrait-on améliorer cette situation ?"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowNewEntry(false);
                    setEditingEntry(null);
                    setNewEntry({
                      category: '',
                      rating: 0,
                      comment: '',
                      improvementSuggestion: ''
                    });
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={addEntry}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  {editingEntry ? 'Modifier l\'évaluation' : 'Enregistrer l\'évaluation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header avec dégradé satisfaction */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Baromètre Satisfaction</h3>
                    <p className="text-white/80 text-sm">Guide d'utilisation - Lean Management</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                  title="Fermer l'aide"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="p-8">
                {/* Introduction */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 mb-8">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <Target className="w-6 h-6 mr-3 text-emerald-600" />
                    Qu'est-ce que le Baromètre Satisfaction ?
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Le <strong>Baromètre Satisfaction</strong> est un outil Lean permettant de mesurer et suivre la satisfaction des collaborateurs 
                    sur différents aspects de leur environnement de travail. Cette approche favorise l'amélioration continue et l'engagement.
                  </p>
                  <div className="bg-white/70 rounded-lg p-4 border border-emerald-300">
                    <p className="text-sm text-emerald-800 font-medium">
                      🎯 <strong>Objectif :</strong> Identifier rapidement les axes d'amélioration et maintenir un environnement de travail optimal.
                    </p>
                  </div>
                </div>

                {/* Catégories d'évaluation */}
                <div className="grid md:grid-cols-1 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="w-6 h-6 mr-3 text-blue-600" />
                      Catégories d'Évaluation
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {DEFAULT_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        return (
                          <div key={category.id} className={`bg-gradient-to-br from-${category.color}-50 to-${category.color}-50 p-4 rounded-lg border border-${category.color}-200`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className={`w-5 h-5 text-${category.color}-600`} />
                              <h5 className="font-semibold text-gray-800">{category.name}</h5>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{category.description}</p>
                            <div className="text-xs text-gray-600">
                              <strong>Exemples :</strong>
                              <ul className="mt-1 space-y-1">
                                {category.examples.slice(0, 2).map((example, index) => (
                                  <li key={index}>• {example}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Système de notation */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 mb-8">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="w-6 h-6 mr-3 text-yellow-600" />
                    Système de Notation
                  </h4>
                  <div className="grid md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="text-center bg-white p-4 rounded-lg border">
                        <span className="text-4xl block mb-2">{getSatisfactionEmoji(rating)}</span>
                        <div className="flex justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm font-semibold">
                          {rating === 1 ? 'Très insatisfait' :
                           rating === 2 ? 'Insatisfait' :
                           rating === 3 ? 'Neutre' :
                           rating === 4 ? 'Satisfait' :
                           'Très satisfait'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mode d'emploi */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle2 className="w-6 h-6 mr-3 text-green-600" />
                      Comment utiliser
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Cliquez sur "Nouvelle Évaluation" pour commencer
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Choisissez la catégorie à évaluer
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Attribuez une note de 1 à 5 étoiles
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Ajoutez un commentaire explicatif (optionnel)
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Proposez une amélioration (optionnel)
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-6 h-6 mr-3 text-purple-600" />
                      Bénéfices Lean
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Détection rapide des problèmes ergonomiques
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Amélioration continue de l'environnement de travail
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Engagement et motivation des équipes
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Traçabilité et suivi des améliorations
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Culture de feedback constructif
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer avec bouton de fermeture */}
            <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Compris ! Je suis prêt à utiliser le Baromètre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
