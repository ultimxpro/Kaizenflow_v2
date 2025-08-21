import React, { useState, useEffect, useMemo } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { 
  GitBranch, Plus, X, HelpCircle, Settings, ChevronRight, 
  Trash2, Edit2, Save, Download, Upload, Users, Factory, 
  DollarSign, Package, Gauge, Clock, Shield, Briefcase, Network
} from 'lucide-react';

// Types
interface Cause {
  id: string;
  text: string;
  level: number; // 0 = branche principale, 1 = sous-cause, 2 = sous-sous-cause
  parentId?: string;
}

interface Branch {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  causes: Cause[];
}

interface IshikawaDiagram {
  id: string;
  name: string;
  problem: string;
  mType: '4M' | '5M' | '6M' | '7M' | '8M' | '9M';
  branches: Branch[];
  createdAt: Date;
  updatedAt: Date;
}

// Configuration des différents types de M
const M_CONFIGS = {
  '4M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', icon: <Users size={16} />, color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', icon: <Briefcase size={16} />, color: '#10B981' },
    { id: 'materiel', name: 'Matériel', icon: <Factory size={16} />, color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', icon: <Package size={16} />, color: '#EF4444' }
  ],
  '5M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', icon: <Users size={16} />, color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', icon: <Briefcase size={16} />, color: '#10B981' },
    { id: 'materiel', name: 'Matériel', icon: <Factory size={16} />, color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', icon: <Package size={16} />, color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', icon: <Shield size={16} />, color: '#8B5CF6' }
  ],
  '6M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', icon: <Users size={16} />, color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', icon: <Briefcase size={16} />, color: '#10B981' },
    { id: 'materiel', name: 'Matériel', icon: <Factory size={16} />, color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', icon: <Package size={16} />, color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', icon: <Shield size={16} />, color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', icon: <Gauge size={16} />, color: '#EC4899' }
  ],
  '7M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', icon: <Users size={16} />, color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', icon: <Briefcase size={16} />, color: '#10B981' },
    { id: 'materiel', name: 'Matériel', icon: <Factory size={16} />, color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', icon: <Package size={16} />, color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', icon: <Shield size={16} />, color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', icon: <Gauge size={16} />, color: '#EC4899' },
    { id: 'management', name: 'Management', icon: <Briefcase size={16} />, color: '#06B6D4' }
  ],
  '8M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', icon: <Users size={16} />, color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', icon: <Briefcase size={16} />, color: '#10B981' },
    { id: 'materiel', name: 'Matériel', icon: <Factory size={16} />, color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', icon: <Package size={16} />, color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', icon: <Shield size={16} />, color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', icon: <Gauge size={16} />, color: '#EC4899' },
    { id: 'management', name: 'Management', icon: <Briefcase size={16} />, color: '#06B6D4' },
    { id: 'moyens-financiers', name: 'Moyens financiers', icon: <DollarSign size={16} />, color: '#84CC16' }
  ],
  '9M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', icon: <Users size={16} />, color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', icon: <Briefcase size={16} />, color: '#10B981' },
    { id: 'materiel', name: 'Matériel', icon: <Factory size={16} />, color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', icon: <Package size={16} />, color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', icon: <Shield size={16} />, color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', icon: <Gauge size={16} />, color: '#EC4899' },
    { id: 'management', name: 'Management', icon: <Briefcase size={16} />, color: '#06B6D4' },
    { id: 'moyens-financiers', name: 'Moyens financiers', icon: <DollarSign size={16} />, color: '#84CC16' },
    { id: 'maintenance', name: 'Maintenance', icon: <Clock size={16} />, color: '#F97316' }
  ]
};

// Composant CauseItem pour afficher une cause avec ses sous-causes
const CauseItem: React.FC<{
  cause: Cause;
  branch: Branch;
  allCauses: Cause[];
  onAddCause: (branchId: string, parentId?: string) => void;
  onUpdateCause: (branchId: string, causeId: string, text: string) => void;
  onDeleteCause: (branchId: string, causeId: string) => void;
  editingCause: string | null;
  setEditingCause: (id: string | null) => void;
  level: number;
}> = ({ 
  cause, 
  branch, 
  allCauses, 
  onAddCause, 
  onUpdateCause, 
  onDeleteCause, 
  editingCause, 
  setEditingCause, 
  level 
}) => {
  const subCauses = allCauses.filter(c => c.parentId === cause.id);
  const marginLeft = level * 20;

  return (
    <div style={{ marginLeft: `${marginLeft}px` }}>
      <div className="group relative">
        {/* Barre de connexion pour les sous-causes */}
        {level > 0 && (
          <div 
            className="absolute -left-4 top-0 bottom-0 w-0.5 opacity-30"
            style={{ backgroundColor: branch.color }}
          />
        )}
        
        <div 
          className="flex items-center space-x-2 p-3 rounded-xl border-2 bg-white hover:shadow-lg transition-all duration-200"
          style={{ borderColor: level === 0 ? branch.color : `${branch.color}50` }}
        >
          {editingCause === cause.id ? (
            <>
              <input
                type="text"
                value={cause.text}
                onChange={(e) => onUpdateCause(branch.id, cause.id, e.target.value)}
                onBlur={() => setEditingCause(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingCause(null);
                  if (e.key === 'Escape') setEditingCause(null);
                }}
                className="flex-1 px-2 py-1 text-sm border-b-2 border-blue-400 focus:outline-none"
                autoFocus
                style={{ borderBottomColor: branch.color }}
              />
              <button
                onClick={() => setEditingCause(null)}
                className="p-1 hover:bg-green-100 rounded"
              >
                <Save className="w-4 h-4 text-green-600" />
              </button>
            </>
          ) : (
            <>
              <div 
                className="flex-1 text-sm cursor-pointer"
                onClick={() => setEditingCause(cause.id)}
              >
                {cause.text}
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                {level < 2 && (
                  <button
                    onClick={() => onAddCause(branch.id, cause.id)}
                    className="p-1 hover:bg-blue-100 rounded"
                    title="Ajouter une sous-cause"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                  </button>
                )}
                <button
                  onClick={() => setEditingCause(cause.id)}
                  className="p-1 hover:bg-yellow-100 rounded"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4 text-yellow-600" />
                </button>
                <button
                  onClick={() => onDeleteCause(branch.id, cause.id)}
                  className="p-1 hover:bg-red-100 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sous-causes */}
      {subCauses.length > 0 && (
        <div className="mt-2">
          {subCauses.map(subCause => (
            <CauseItem
              key={subCause.id}
              cause={subCause}
              branch={branch}
              allCauses={allCauses}
              onAddCause={onAddCause}
              onUpdateCause={onUpdateCause}
              onDeleteCause={onDeleteCause}
              editingCause={editingCause}
              setEditingCause={setEditingCause}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Composant BranchCard pour chaque branche (Main d'œuvre, Méthode, etc.)
const BranchCard: React.FC<{
  branch: Branch;
  onAddCause: (branchId: string, parentId?: string) => void;
  onUpdateCause: (branchId: string, causeId: string, text: string) => void;
  onDeleteCause: (branchId: string, causeId: string) => void;
  editingCause: string | null;
  setEditingCause: (id: string | null) => void;
}> = ({ branch, onAddCause, onUpdateCause, onDeleteCause, editingCause, setEditingCause }) => {
  const mainCauses = branch.causes.filter(c => c.level === 0);
  
  return (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border-2 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
      style={{ borderColor: `${branch.color}30` }}
    >
      {/* En-tête de la carte */}
      <div 
        className="px-6 py-4 flex items-center justify-between border-b-2"
        style={{ 
          backgroundColor: `${branch.color}10`, 
          borderBottomColor: branch.color 
        }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: branch.color }}
          >
            {/* FIX: Rendre l'icône directement sans wrapper div */}
            <span className="text-white">
              {branch.icon}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{branch.name}</h3>
            <p className="text-sm text-gray-600">
              {mainCauses.length} cause{mainCauses.length > 1 ? 's' : ''} principale{mainCauses.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAddCause(branch.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          style={{ backgroundColor: branch.color }}
          title={`Ajouter une cause ${branch.name}`}
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Liste des causes avec scroll */}
      <div className="p-6 max-h-80 overflow-y-auto">
        <div className="space-y-3">
          {mainCauses.length === 0 ? (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20"
                style={{ backgroundColor: branch.color }}
              >
                {branch.icon}
              </div>
              <p className="text-gray-500 text-sm mb-4">Aucune cause identifiée</p>
              <button
                onClick={() => onAddCause(branch.id)}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: branch.color }}
              >
                Ajouter la première cause
              </button>
            </div>
          ) : (
            mainCauses.map(cause => (
              <CauseItem
                key={cause.id}
                cause={cause}
                branch={branch}
                allCauses={branch.causes}
                onAddCause={onAddCause}
                onUpdateCause={onUpdateCause}
                onDeleteCause={onDeleteCause}
                editingCause={editingCause}
                setEditingCause={setEditingCause}
                level={0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const IshikawaEditor: React.FC<{ module: A3Module; onClose: () => void }> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
  const [editingCause, setEditingCause] = useState<string | null>(null);

  // Initialisation des données
  const initializeData = (): IshikawaDiagram[] => {
    if (module.content?.diagrams && Array.isArray(module.content.diagrams)) {
      return module.content.diagrams;
    }
    
    // Créer un diagramme par défaut
    const defaultDiagram: IshikawaDiagram = {
      id: `diagram-${Date.now()}`,
      name: 'Nouveau diagramme',
      problem: 'Définir le problème',
      mType: '5M',
      branches: M_CONFIGS['5M'].map(config => ({
        ...config,
        causes: []
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return [defaultDiagram];
  };

  const [diagrams, setDiagrams] = useState<IshikawaDiagram[]>(initializeData);

  const selectedDiagram = useMemo(() => {
    if (!selectedDiagramId || diagrams.length === 0) return diagrams[0];
    return diagrams.find(d => d.id === selectedDiagramId) || diagrams[0];
  }, [selectedDiagramId, diagrams]);

  useEffect(() => {
    if (!selectedDiagramId && diagrams.length > 0) {
      setSelectedDiagramId(diagrams[0].id);
    }
  }, [diagrams, selectedDiagramId]);

  // Sauvegarde automatique
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      updateA3Module(module.id, {
        content: { diagrams }
      });
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [diagrams, module.id, updateA3Module]);

  // Gestion des diagrammes
  const createDiagram = () => {
    const newDiagram: IshikawaDiagram = {
      id: `diagram-${Date.now()}`,
      name: `Diagramme ${diagrams.length + 1}`,
      problem: 'Définir le problème',
      mType: '5M',
      branches: M_CONFIGS['5M'].map(config => ({
        ...config,
        causes: []
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setDiagrams([...diagrams, newDiagram]);
    setSelectedDiagramId(newDiagram.id);
  };

  const updateDiagram = (updates: Partial<IshikawaDiagram>) => {
    setDiagrams(diagrams.map(d => 
      d.id === selectedDiagram.id 
        ? { ...d, ...updates, updatedAt: new Date() } 
        : d
    ));
  };

  const deleteDiagram = () => {
    if (diagrams.length <= 1) return;
    
    const index = diagrams.findIndex(d => d.id === selectedDiagram.id);
    const newDiagrams = diagrams.filter(d => d.id !== selectedDiagram.id);
    setDiagrams(newDiagrams);
    
    const newIndex = Math.min(index, newDiagrams.length - 1);
    setSelectedDiagramId(newDiagrams[newIndex]?.id);
  };

  const changeMType = (newType: '4M' | '5M' | '6M' | '7M' | '8M' | '9M') => {
    const newBranches = M_CONFIGS[newType].map(config => {
      const existingBranch = selectedDiagram.branches.find(b => b.id === config.id);
      return existingBranch || { ...config, causes: [] };
    });
    
    updateDiagram({ mType: newType, branches: newBranches });
  };

  // Gestion des causes
  const addCause = (branchId: string, parentId?: string) => {
    const newCause: Cause = {
      id: `cause-${Date.now()}`,
      text: 'Nouvelle cause',
      level: parentId ? 
        (selectedDiagram.branches.find(b => b.id === branchId)?.causes.find(c => c.id === parentId)?.level || 0) + 1 
        : 0,
      parentId
    };
    
    const updatedBranches = selectedDiagram.branches.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          causes: [...branch.causes, newCause]
        };
      }
      return branch;
    });
    
    updateDiagram({ branches: updatedBranches });
    setEditingCause(newCause.id);
  };

  const updateCause = (branchId: string, causeId: string, text: string) => {
    const updatedBranches = selectedDiagram.branches.map(branch => {
      if (branch.id === branchId) {
        return {
          ...branch,
          causes: branch.causes.map(cause => 
            cause.id === causeId ? { ...cause, text } : cause
          )
        };
      }
      return branch;
    });
    
    updateDiagram({ branches: updatedBranches });
  };

  const deleteCause = (branchId: string, causeId: string) => {
    const updatedBranches = selectedDiagram.branches.map(branch => {
      if (branch.id === branchId) {
        const causesToDelete = new Set<string>();
        
        const findCausesToDelete = (id: string) => {
          causesToDelete.add(id);
          branch.causes.filter(c => c.parentId === id).forEach(c => findCausesToDelete(c.id));
        };
        
        findCausesToDelete(causeId);
        
        return {
          ...branch,
          causes: branch.causes.filter(cause => !causesToDelete.has(cause.id))
        };
      }
      return branch;
    });
    
    updateDiagram({ branches: updatedBranches });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header avec navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Diagramme d'Ishikawa
                </h2>
                <p className="text-sm text-gray-600">
                  Analyse des causes racines
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Sélecteur de type de M */}
            <select
              value={selectedDiagram.mType}
              onChange={(e) => changeMType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              <option value="4M">4M</option>
              <option value="5M">5M</option>
              <option value="6M">6M</option>
              <option value="7M">7M</option>
              <option value="8M">8M</option>
              <option value="9M">9M</option>
            </select>

            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aide"
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar avec liste des diagrammes */}
        <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Liste des diagrammes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Diagrammes</h3>
                <button
                  onClick={createDiagram}
                  className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Nouveau diagramme"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                </button>
              </div>
              
              <div className="space-y-2">
                {diagrams.map(diagram => (
                  <div
                    key={diagram.id}
                    onClick={() => setSelectedDiagramId(diagram.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedDiagram.id === diagram.id
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GitBranch className="w-4 h-4" />
                        <span className="font-medium text-sm">{diagram.name}</span>
                      </div>
                      {selectedDiagram.id === diagram.id && diagrams.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDiagram();
                          }}
                          className="p-1 hover:bg-red-700 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      selectedDiagram.id === diagram.id ? 'text-red-100' : 'text-gray-500'
                    }`}>
                      {diagram.mType} - {diagram.branches.reduce((acc, b) => acc + b.causes.filter(c => c.level === 0).length, 0)} causes
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Informations du diagramme sélectionné */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Problème analysé</h3>
              <textarea
                value={selectedDiagram.problem}
                onChange={(e) => updateDiagram({ problem: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none h-24"
                placeholder="Décrivez le problème..."
              />
            </div>

            {/* Statistiques */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistiques</h3>
              <div className="space-y-2">
                {selectedDiagram.branches.map(branch => {
                  const mainCauses = branch.causes.filter(c => c.level === 0);
                  const totalCauses = branch.causes.length;
                  return (
                    <div key={branch.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: branch.color }}
                        />
                        <span className="text-gray-600">{branch.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {mainCauses.length} ({totalCauses})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Zone principale avec le diagramme */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {selectedDiagram ? (
              <div className="space-y-6">
                {/* En-tête avec le nom du diagramme */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <input
                    type="text"
                    value={selectedDiagram.name}
                    onChange={(e) => updateDiagram({ name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors w-full"
                  />
                  
                  {/* Visualisation du diagramme en arête de poisson */}
                  <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                    <div className="relative">
                      {/* Ligne centrale (arête principale) */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-600 transform -translate-y-1/2"></div>
                      
                      {/* Problème au bout de l'arête */}
                      <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 ml-4">
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold">
                          {selectedDiagram.problem || 'Problème'}
                        </div>
                      </div>
                      
                      {/* Branches du diagramme */}
                      <svg className="w-full h-48" viewBox="0 0 800 200">
                        {selectedDiagram.branches.map((branch, index) => {
                          const totalBranches = selectedDiagram.branches.length;
                          const spacing = 800 / (totalBranches + 1);
                          const x = spacing * (index + 1);
                          const y = index % 2 === 0 ? 50 : 150;
                          const mainCauses = branch.causes.filter(c => c.level === 0);
                          
                          return (
                            <g key={branch.id}>
                              {/* Ligne de la branche */}
                              <line
                                x1={x}
                                y1={y}
                                x2={x}
                                y2={100}
                                stroke={branch.color}
                                strokeWidth="3"
                                opacity="0.7"
                              />
                              
                              {/* Cercle avec icône */}
                              <circle
                                cx={x}
                                cy={y}
                                r="25"
                                fill={branch.color}
                                opacity="0.9"
                              />
                              
                              {/* Nombre de causes */}
                              {mainCauses.length > 0 && (
                                <text
                                  x={x}
                                  y={y + 5}
                                  textAnchor="middle"
                                  className="text-xs font-bold"
                                  fill="white"
                                >
                                  {mainCauses.length}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                      
                      {/* Légende */}
                      <div className="mt-4 flex flex-wrap gap-3 justify-center">
                        {selectedDiagram.branches.map(branch => {
                          const mainCauses = branch.causes.filter(c => c.level === 0);
                          return (
                            <div key={branch.id} className="flex items-center space-x-2 bg-white/80 px-3 py-1 rounded-lg">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: branch.color }}
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {branch.name} ({mainCauses.length})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grille des cartes de branches */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedDiagram.branches.map(branch => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onAddCause={(branchId, parentId) => addCause(branchId, parentId)}
                      onUpdateCause={updateCause}
                      onDeleteCause={deleteCause}
                      editingCause={editingCause}
                      setEditingCause={setEditingCause}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <GitBranch className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucun diagramme sélectionné
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Créez un nouveau diagramme pour commencer
                  </p>
                  <button
                    onClick={createDiagram}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    Créer un diagramme
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'aide */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">Guide d'utilisation - Ishikawa</h3>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Qu'est-ce qu'un diagramme d'Ishikawa ?</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Le diagramme d'Ishikawa, aussi appelé diagramme en arête de poisson ou diagramme de causes et effets, 
                    est un outil de résolution de problèmes qui permet d'identifier et de visualiser toutes les causes 
                    potentielles d'un problème donné.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Les différents types de M</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-900 mb-2">4M - Basique</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Main d'œuvre</li>
                        <li>• Méthode</li>
                        <li>• Matériel</li>
                        <li>• Matière</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-semibold text-green-900 mb-2">5M - Standard</h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 4M + Milieu</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h5 className="font-semibold text-purple-900 mb-2">6M - Étendu</h5>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• 5M + Mesure</li>
                      </ul>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h5 className="font-semibold text-orange-900 mb-2">7M-9M - Complet</h5>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• + Management</li>
                        <li>• + Moyens financiers</li>
                        <li>• + Maintenance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Comment utiliser l'outil ?</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">Définir le problème</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          Formulez clairement le problème à analyser dans la zone dédiée.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">Choisir le type de M</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          Sélectionnez le nombre de catégories adaptées à votre analyse (4M à 9M).
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">Ajouter les causes</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          Cliquez sur le bouton + de chaque branche pour ajouter des causes principales.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">Détailler les sous-causes</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          Pour chaque cause, vous pouvez ajouter des sous-causes (jusqu'à 2 niveaux).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Conseils pour une analyse efficace
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Bonnes pratiques</h5>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Impliquez toute l'équipe dans le brainstorming
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Utilisez la technique des "5 Pourquoi" pour chaque cause identifiée
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Ne vous limitez pas aux causes évidentes
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Validez les causes par des données si possible
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Navigation dans l'interface</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <strong className="text-gray-800">Créer :</strong>
                      <p>Cliquez sur + dans la section "Diagrammes"</p>
                    </div>
                    <div>
                      <strong className="text-gray-800">Éditer :</strong>
                      <p>Cliquez sur les zones de texte pour modifier</p>
                    </div>
                    <div>
                      <strong className="text-gray-800">Ajouter :</strong>
                      <p>Utilisez les boutons + sur chaque carte de branche</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};