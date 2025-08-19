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
      id: `diag-${Date.now()}`,
      name: 'Analyse Ishikawa #1',
      problem: '',
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
  const selectedDiagram = diagrams.find(d => d.id === selectedDiagramId) || diagrams[0];

  useEffect(() => {
    if (diagrams.length > 0 && !selectedDiagramId) {
      setSelectedDiagramId(diagrams[0].id);
    }
  }, [diagrams, selectedDiagramId]);

  // Sauvegarde automatique
  useEffect(() => {
    const timer = setTimeout(() => {
      updateA3Module(module.id, { content: { diagrams } });
    }, 1000);
    return () => clearTimeout(timer);
  }, [diagrams, module.id, updateA3Module]);

  // Gestion des diagrammes
  const addDiagram = () => {
    const newDiagram: IshikawaDiagram = {
      id: `diag-${Date.now()}`,
      name: `Analyse Ishikawa #${diagrams.length + 1}`,
      problem: '',
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

  const deleteDiagram = (id: string) => {
    if (diagrams.length === 1) {
      alert('Vous devez conserver au moins un diagramme');
      return;
    }
    setDiagrams(diagrams.filter(d => d.id !== id));
    if (selectedDiagramId === id) {
      setSelectedDiagramId(diagrams[0].id);
    }
  };

  // Changement du type de M
  const changeMType = (newType: IshikawaDiagram['mType']) => {
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
      text: '',
      level: parentId ? 1 : 0,
      parentId
    };

    const updatedBranches = selectedDiagram.branches.map(branch => {
      if (branch.id === branchId) {
        return { ...branch, causes: [...branch.causes, newCause] };
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
        // Supprimer la cause et ses sous-causes
        const causesToDelete = new Set([causeId]);
        const findChildren = (parentId: string) => {
          branch.causes.forEach(c => {
            if (c.parentId === parentId) {
              causesToDelete.add(c.id);
              findChildren(c.id);
            }
          });
        };
        findChildren(causeId);
        
        return {
          ...branch,
          causes: branch.causes.filter(c => !causesToDelete.has(c.id))
        };
      }
      return branch;
    });
    updateDiagram({ branches: updatedBranches });
  };

  // Export
  const exportDiagram = () => {
    const dataStr = JSON.stringify(selectedDiagram, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportName = `ishikawa_${selectedDiagram.name}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const totalCauses = selectedDiagram.branches.reduce((sum, branch) => 
      sum + branch.causes.length, 0
    );
    const branchesWithCauses = selectedDiagram.branches.filter(b => b.causes.length > 0).length;
    const avgCausesPerBranch = branchesWithCauses > 0 
      ? Math.round((totalCauses / branchesWithCauses) * 10) / 10 
      : 0;

    return { totalCauses, branchesWithCauses, avgCausesPerBranch };
  }, [selectedDiagram]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header avec dégradé moderne */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <GitBranch className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Diagramme d'Ishikawa</h1>
                <p className="text-white/80 text-sm">Analyse des causes et effets</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50">
          {/* Sidebar */}
          <div className="w-80 bg-white/70 backdrop-blur-sm border-r border-gray-200/50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Section Diagrammes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Diagrammes</h3>
                  <button
                    onClick={addDiagram}
                    className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                    title="Nouveau diagramme"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {diagrams.map(diag => (
                    <div
                      key={diag.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        diag.id === selectedDiagramId
                          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 shadow-lg'
                          : 'bg-white/80 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDiagramId(diag.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{diag.name}</h4>
                          <p className="text-xs text-gray-500">{diag.mType} - {stats.totalCauses} causes</p>
                        </div>
                        {diagrams.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDiagram(diag.id);
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Problème */}
              {selectedDiagram && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border border-red-200">
                  <h3 className="font-bold text-gray-800 mb-3">Problème à analyser</h3>
                  <textarea
                    value={selectedDiagram.problem}
                    onChange={(e) => updateDiagram({ problem: e.target.value })}
                    placeholder="Décrivez le problème ou l'effet à analyser..."
                    className="w-full h-24 p-3 border border-red-200 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/80"
                  />
                </div>
              )}

              {/* Section Type de M */}
              {selectedDiagram && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Type d'analyse</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(M_CONFIGS).map((type) => (
                      <button
                        key={type}
                        onClick={() => changeMType(type as any)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                          selectedDiagram.mType === type
                            ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  {/* Description du type sélectionné */}
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Branches du {selectedDiagram.mType} :
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {M_CONFIGS[selectedDiagram.mType].map(config => (
                        <li key={config.id} className="flex items-center space-x-2">
                          <span style={{ color: config.color }}>{config.icon}</span>
                          <span>{config.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Statistiques */}
              {selectedDiagram && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-3">Statistiques</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total des causes :</span>
                      <span className="font-semibold text-blue-700">{stats.totalCauses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Branches utilisées :</span>
                      <span className="font-semibold text-blue-700">{stats.branchesWithCauses}/{selectedDiagram.branches.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Moy. par branche :</span>
                      <span className="font-semibold text-blue-700">{stats.avgCausesPerBranch}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col space-y-2">
                {/* Bouton export supprimé */}
              </div>
            </div>
          </div>

          {/* Zone principale - Grille des branches */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedDiagram ? (
              <div>
                {/* En-tête */}
                <div className="mb-6">
                  <input
                    type="text"
                    value={selectedDiagram.name}
                    onChange={(e) => updateDiagram({ name: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-none outline-none focus:bg-white focus:border-2 focus:border-red-300 focus:rounded-lg px-3 py-2 text-gray-900"
                  />
                  <p className="text-gray-600 mt-1">
                    Modifié le {selectedDiagram.updatedAt.toLocaleString('fr-FR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {/* Grille des branches */}
                <div className="space-y-6">
                  {/* Aperçu du diagramme */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <GitBranch className="w-5 h-5 mr-2" style={{ color: '#EF4444' }} />
                      Aperçu du diagramme
                    </h3>
                    
                    {/* Diagramme SVG simplifié */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                      <svg className="w-full h-64" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet">
                        {/* Arête centrale (épine dorsale) */}
                        <line x1="50" y1="150" x2="800" y2="150" stroke="#374151" strokeWidth="4" />
                        
                        {/* Flèche vers le problème */}
                        <polygon points="800,150 780,140 780,160" fill="#EF4444" />
                        
                        {/* Boîte du problème */}
                        <rect x="810" y="120" width="160" height="60" rx="8" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
                        <text x="890" y="145" textAnchor="middle" className="fill-white text-sm font-medium">
                          {selectedDiagram.problem ? 'PROBLÈME' : 'EFFET'}
                        </text>
                        <text x="890" y="165" textAnchor="middle" className="fill-white text-xs">
                          {selectedDiagram.problem ? selectedDiagram.problem.substring(0, 15) + (selectedDiagram.problem.length > 15 ? '...' : '') : 'À définir'}
                        </text>
                        
                        {/* Branches supérieures */}
                        {selectedDiagram.branches.slice(0, Math.ceil(selectedDiagram.branches.length / 2)).map((branch, index) => {
                          const x = 150 + (index * 140);
                          const mainCauses = branch.causes.filter(c => c.level === 0);
                          
                          return (
                            <g key={`top-${branch.id}`}>
                              {/* Ligne de branche principale */}
                              <line 
                                x1={x} 
                                y1="150" 
                                x2={x - 60} 
                                y2="80" 
                                stroke={branch.color} 
                                strokeWidth="3" 
                              />
                              
                              {/* Label de la branche */}
                              <rect 
                                x={x - 80} 
                                y="60" 
                                width="90" 
                                height="30" 
                                rx="6" 
                                fill={branch.color} 
                              />
                              <text 
                                x={x - 35} 
                                y="78" 
                                textAnchor="middle" 
                                className="fill-white text-xs font-medium"
                              >
                                {branch.name}
                              </text>
                              
                              {/* Petites lignes pour les causes */}
                              {mainCauses.slice(0, 3).map((_, causeIndex) => (
                                <line
                                  key={causeIndex}
                                  x1={x - 20 - (causeIndex * 15)}
                                  y1="120 - (causeIndex * 10)"
                                  x2={x - 35 - (causeIndex * 15)}
                                  y2="105 - (causeIndex * 10)"
                                  stroke={branch.color}
                                  strokeWidth="1"
                                  opacity="0.7"
                                />
                              ))}
                              
                              {/* Indicateur nombre de causes */}
                              {mainCauses.length > 0 && (
                                <circle
                                  cx={x - 35}
                                  cy="95"
                                  r="8"
                                  fill="white"
                                  stroke={branch.color}
                                  strokeWidth="2"
                                />
                              )}
                              {mainCauses.length > 0 && (
                                <text
                                  x={x - 35}
                                  y="99"
                                  textAnchor="middle"
                                  className="text-xs font-bold"
                                  fill={branch.color}
                                >
                                  {mainCauses.length}
                                </text>
                              )}
                            </g>
                          );
                        })}
                        
                        {/* Branches inférieures */}
                        {selectedDiagram.branches.slice(Math.ceil(selectedDiagram.branches.length / 2)).map((branch, index) => {
                          const x = 150 + (index * 140);
                          const mainCauses = branch.causes.filter(c => c.level === 0);
                          
                          return (
                            <g key={`bottom-${branch.id}`}>
                              {/* Ligne de branche principale */}
                              <line 
                                x1={x} 
                                y1="150" 
                                x2={x - 60} 
                                y2="220" 
                                stroke={branch.color} 
                                strokeWidth="3" 
                              />
                              
                              {/* Label de la branche */}
                              <rect 
                                x={x - 80} 
                                y="230" 
                                width="90" 
                                height="30" 
                                rx="6" 
                                fill={branch.color} 
                              />
                              <text 
                                x={x - 35} 
                                y="248" 
                                textAnchor="middle" 
                                className="fill-white text-xs font-medium"
                              >
                                {branch.name}
                              </text>
                              
                              {/* Petites lignes pour les causes */}
                              {mainCauses.slice(0, 3).map((_, causeIndex) => (
                                <line
                                  key={causeIndex}
                                  x1={x - 20 - (causeIndex * 15)}
                                  y1="180 + (causeIndex * 10)"
                                  x2={x - 35 - (causeIndex * 15)}
                                  y2="195 + (causeIndex * 10)"
                                  stroke={branch.color}
                                  strokeWidth="1"
                                  opacity="0.7"
                                />
                              ))}
                              
                              {/* Indicateur nombre de causes */}
                              {mainCauses.length > 0 && (
                                <circle
                                  cx={x - 35}
                                  cy="205"
                                  r="8"
                                  fill="white"
                                  stroke={branch.color}
                                  strokeWidth="2"
                                />
                              )}
                              {mainCauses.length > 0 && (
                                <text
                                  x={x - 35}
                                  y="209"
                                  textAnchor="middle"
                                  className="text-xs font-bold"
                                  fill={branch.color}
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <GitBranch className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun diagramme sélectionné</h3>
                  <p className="text-gray-600">Sélectionnez un diagramme dans la barre latérale</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal d'aide avec style moderne */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Diagramme d'Ishikawa - Guide d'utilisation</h3>
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
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-xl border border-red-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Network className="w-5 h-5 mr-2 text-red-600" />
                        Principe
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        Le diagramme d'Ishikawa (ou diagramme en arêtes de poisson) est un outil 
                        d'analyse des causes et effets. Il permet d'identifier et de visualiser 
                        toutes les causes possibles d'un problème ou d'un effet observé.
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Types de diagrammes</h4>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div>
                          <strong className="text-gray-700">4M :</strong> Main d'œuvre, Méthode, Matériel, Matière
                          <p className="text-xs mt-1">Production industrielle</p>
                        </div>
                        <div>
                          <strong className="text-gray-700">5M :</strong> + Milieu (environnement)
                          <p className="text-xs mt-1">Le plus couramment utilisé</p>
                        </div>
                        <div>
                          <strong className="text-gray-700">6M :</strong> + Mesure
                          <p className="text-xs mt-1">Contrôles qualité</p>
                        </div>
                        <div>
                          <strong className="text-gray-700">7M/8M/9M :</strong> + Management, Moyens financiers, Maintenance
                          <p className="text-xs mt-1">Analyses plus complètes selon le contexte</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Comment procéder</h4>
                      <ol className="text-gray-600 space-y-3">
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                          <span><strong>Définir le problème</strong> clairement dans la zone dédiée</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                          <span><strong>Choisir le type</strong> de M adapté (4M, 5M, etc.)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                          <span><strong>Identifier les causes</strong> pour chaque branche (M)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                          <span><strong>Approfondir</strong> en ajoutant des sous-causes</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">5</span>
                          <span><strong>Analyser et prioriser</strong> les causes identifiées</span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Conseils d'utilisation</h4>
                      <ul className="text-gray-600 space-y-2">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Travaillez en équipe pour plus de diversité dans les idées
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Posez-vous "Pourquoi ?" pour chaque cause identifiée
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
        )}
      </div>
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
            <span className="text-white">{branch.icon}</span>
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
            <input
              type="text"
              value={cause.text}
              onChange={(e) => onUpdateCause(branch.id, cause.id, e.target.value)}
              onBlur={() => setEditingCause(null)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') setEditingCause(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingCause(null);
              }}
              className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
              style={{ 
                focusRingColor: branch.color,
                '--tw-ring-color': branch.color
              }}
              autoFocus
              placeholder="Décrivez la cause..."
            />
          ) : (
            <div
              className="flex-1 cursor-pointer py-1 px-2 rounded hover:bg-gray-50 transition-colors"
              onClick={() => setEditingCause(cause.id)}
            >
              <span className={`text-sm ${cause.text ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                {cause.text || 'Cliquez pour éditer...'}
              </span>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddCause(branch.id, cause.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: branch.color }}
              title="Ajouter une sous-cause"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteCause(branch.id, cause.id)}
              className="w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 transition-all duration-200 hover:scale-110"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Sous-causes */}
      {subCauses.length > 0 && (
        <div className="mt-2 space-y-2">
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