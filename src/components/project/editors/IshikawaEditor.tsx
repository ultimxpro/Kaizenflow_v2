import React, { useState, useEffect, useRef, useMemo } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { 
  GitBranch, Plus, X, HelpCircle, Settings, ChevronRight, 
  Trash2, Edit2, Save, Download, Upload, ZoomIn, ZoomOut,
  Maximize2, Copy, Users, Factory, DollarSign, Package,
  Gauge, Clock, Shield, Briefcase, Eye, Network
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
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDiagramId, setSelectedDiagramId] = useState<string | null>(null);
  const [editingCause, setEditingCause] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialisation des données
  const initializeData = (): IshikawaDiagram[] => {
    if (module.content?.diagrams && Array.isArray(module.content.diagrams)) {
      return module.content.diagrams;
    }
    return [];
  };

  const [diagrams, setDiagrams] = useState<IshikawaDiagram[]>(initializeData());

  // Sauvegarde
  const saveDiagrams = async (newDiagrams: IshikawaDiagram[]) => {
    setDiagrams(newDiagrams);
    await updateA3Module(module.id, {
      content: { ...module.content, diagrams: newDiagrams }
    });
  };

  // Créer un nouveau diagramme
  const createDiagram = (mType: '4M' | '5M' | '6M' | '7M' | '8M' | '9M' = '5M') => {
    const config = M_CONFIGS[mType];
    const newDiagram: IshikawaDiagram = {
      id: `diagram-${Date.now()}`,
      name: `Diagramme ${mType} - ${diagrams.length + 1}`,
      problem: '',
      mType,
      branches: config.map(branch => ({
        ...branch,
        causes: []
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newDiagrams = [...diagrams, newDiagram];
    saveDiagrams(newDiagrams);
    setSelectedDiagramId(newDiagram.id);
  };

  // Ajouter une cause
  const addCause = (diagramId: string, branchId: string, parentId?: string) => {
    const newDiagrams = diagrams.map(diagram => {
      if (diagram.id === diagramId) {
        const updatedBranches = diagram.branches.map(branch => {
          if (branch.id === branchId) {
            const parentCause = parentId ? branch.causes.find(c => c.id === parentId) : null;
            const level = parentCause ? parentCause.level + 1 : 0;
            
            const newCause: Cause = {
              id: `cause-${Date.now()}`,
              text: '',
              level,
              parentId
            };

            return {
              ...branch,
              causes: [...branch.causes, newCause]
            };
          }
          return branch;
        });

        return {
          ...diagram,
          branches: updatedBranches,
          updatedAt: new Date()
        };
      }
      return diagram;
    });

    saveDiagrams(newDiagrams);
  };

  // Supprimer une cause
  const deleteCause = (diagramId: string, branchId: string, causeId: string) => {
    const newDiagrams = diagrams.map(diagram => {
      if (diagram.id === diagramId) {
        const updatedBranches = diagram.branches.map(branch => {
          if (branch.id === branchId) {
            // Supprimer la cause et toutes ses sous-causes
            const causesToDelete = new Set([causeId]);
            const findChildCauses = (parentId: string) => {
              branch.causes.forEach(cause => {
                if (cause.parentId === parentId) {
                  causesToDelete.add(cause.id);
                  findChildCauses(cause.id);
                }
              });
            };
            findChildCauses(causeId);

            return {
              ...branch,
              causes: branch.causes.filter(cause => !causesToDelete.has(cause.id))
            };
          }
          return branch;
        });

        return {
          ...diagram,
          branches: updatedBranches,
          updatedAt: new Date()
        };
      }
      return diagram;
    });

    saveDiagrams(newDiagrams);
  };

  // Mettre à jour une cause
  const updateCause = (diagramId: string, branchId: string, causeId: string, text: string) => {
    const newDiagrams = diagrams.map(diagram => {
      if (diagram.id === diagramId) {
        const updatedBranches = diagram.branches.map(branch => {
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

        return {
          ...diagram,
          branches: updatedBranches,
          updatedAt: new Date()
        };
      }
      return diagram;
    });

    saveDiagrams(newDiagrams);
  };

  // Supprimer un diagramme
  const deleteDiagram = async (diagramId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce diagramme ?')) {
      const newDiagrams = diagrams.filter(d => d.id !== diagramId);
      await saveDiagrams(newDiagrams);
      if (selectedDiagramId === diagramId) {
        setSelectedDiagramId(null);
      }
    }
  };

  // Rendu du diagramme SVG
  const renderDiagram = (diagram: IshikawaDiagram) => {
    const width = 1200 * zoom;
    const height = 800 * zoom;
    const centerX = width * 0.8;
    const centerY = height / 2;
    const branchLength = 200 * zoom;

    const branches = diagram.branches;
    const branchAngles = branches.map((_, index) => {
      const totalBranches = branches.length;
      const angleStep = (Math.PI * 1.2) / (totalBranches - 1);
      return -Math.PI * 0.6 + (index * angleStep);
    });

    return (
      <div className="relative w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <svg width={width} height={height} className="min-w-full min-h-full">
          {/* Ligne principale (épine dorsale) */}
          <line
            x1={50 * zoom}
            y1={centerY}
            x2={centerX}
            y2={centerY}
            stroke="#374151"
            strokeWidth={4 * zoom}
            markerEnd="url(#arrowhead)"
          />
          
          {/* Définition de la flèche */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#374151"
              />
            </marker>
          </defs>

          {/* Boîte du problème */}
          <foreignObject
            x={centerX + 20 * zoom}
            y={centerY - 30 * zoom}
            width={300 * zoom}
            height={60 * zoom}
          >
            <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-3 rounded-lg shadow-lg">
              <textarea
                value={diagram.problem}
                onChange={(e) => {
                  const newDiagrams = diagrams.map(d =>
                    d.id === diagram.id ? { ...d, problem: e.target.value, updatedAt: new Date() } : d
                  );
                  saveDiagrams(newDiagrams);
                }}
                placeholder="Décrivez le problème ici..."
                className="w-full h-full bg-transparent text-white placeholder-white/70 resize-none border-none outline-none text-sm font-medium"
                style={{ fontSize: `${12 * zoom}px` }}
              />
            </div>
          </foreignObject>

          {/* Branches principales */}
          {branches.map((branch, index) => {
            const angle = branchAngles[index];
            const endX = centerX + Math.cos(angle) * branchLength;
            const endY = centerY + Math.sin(angle) * branchLength;
            
            return (
              <g key={branch.id}>
                {/* Ligne de branche */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={endX}
                  y2={endY}
                  stroke={branch.color}
                  strokeWidth={3 * zoom}
                />
                
                {/* Label de branche */}
                <foreignObject
                  x={endX - 80 * zoom}
                  y={endY - 25 * zoom}
                  width={160 * zoom}
                  height={50 * zoom}
                >
                  <div 
                    className="p-2 rounded-lg shadow-lg text-white font-semibold text-center"
                    style={{ 
                      backgroundColor: branch.color,
                      fontSize: `${12 * zoom}px`
                    }}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      {branch.icon}
                      <span>{branch.name}</span>
                    </div>
                  </div>
                </foreignObject>

                {/* Causes de cette branche */}
                {branch.causes
                  .filter(cause => !cause.parentId)
                  .map((cause, causeIndex) => {
                    const causeAngle = angle + (causeIndex - branch.causes.filter(c => !c.parentId).length / 2 + 0.5) * 0.3;
                    const causeX = endX + Math.cos(causeAngle) * 150 * zoom;
                    const causeY = endY + Math.sin(causeAngle) * 150 * zoom;

                    return (
                      <g key={cause.id}>
                        {/* Ligne vers la cause */}
                        <line
                          x1={endX}
                          y1={endY}
                          x2={causeX}
                          y2={causeY}
                          stroke={branch.color}
                          strokeWidth={2 * zoom}
                          opacity={0.7}
                        />
                        
                        {/* Boîte de cause */}
                        <foreignObject
                          x={causeX - 60 * zoom}
                          y={causeY - 15 * zoom}
                          width={120 * zoom}
                          height={30 * zoom}
                        >
                          <div className="relative group">
                            {editingCause === cause.id ? (
                              <input
                                type="text"
                                value={cause.text}
                                onChange={(e) => updateCause(diagram.id, branch.id, cause.id, e.target.value)}
                                onBlur={() => setEditingCause(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCause(null)}
                                className="w-full p-1 text-xs border border-gray-300 rounded"
                                style={{ fontSize: `${10 * zoom}px` }}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="bg-white p-1 rounded shadow border cursor-pointer hover:bg-gray-50"
                                onClick={() => setEditingCause(cause.id)}
                                style={{ fontSize: `${10 * zoom}px` }}
                              >
                                {cause.text || 'Cliquez pour éditer'}
                              </div>
                            )}
                            
                            {/* Boutons d'action */}
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => addCause(diagram.id, branch.id, cause.id)}
                                className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-1"
                                title="Ajouter une sous-cause"
                              >
                                <Plus size={8} />
                              </button>
                              <button
                                onClick={() => deleteCause(diagram.id, branch.id, cause.id)}
                                className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                                title="Supprimer"
                              >
                                <X size={8} />
                              </button>
                            </div>
                          </div>
                        </foreignObject>

                        {/* Sous-causes */}
                        {branch.causes
                          .filter(subCause => subCause.parentId === cause.id)
                          .map((subCause, subIndex) => {
                            const subAngle = causeAngle + (subIndex - 1) * 0.2;
                            const subX = causeX + Math.cos(subAngle) * 100 * zoom;
                            const subY = causeY + Math.sin(subAngle) * 100 * zoom;

                            return (
                              <g key={subCause.id}>
                                <line
                                  x1={causeX}
                                  y1={causeY}
                                  x2={subX}
                                  y2={subY}
                                  stroke={branch.color}
                                  strokeWidth={1 * zoom}
                                  opacity={0.5}
                                />
                                
                                <foreignObject
                                  x={subX - 40 * zoom}
                                  y={subY - 10 * zoom}
                                  width={80 * zoom}
                                  height={20 * zoom}
                                >
                                  <div className="relative group">
                                    {editingCause === subCause.id ? (
                                      <input
                                        type="text"
                                        value={subCause.text}
                                        onChange={(e) => updateCause(diagram.id, branch.id, subCause.id, e.target.value)}
                                        onBlur={() => setEditingCause(null)}
                                        onKeyPress={(e) => e.key === 'Enter' && setEditingCause(null)}
                                        className="w-full p-0.5 text-xs border border-gray-300 rounded"
                                        style={{ fontSize: `${8 * zoom}px` }}
                                        autoFocus
                                      />
                                    ) : (
                                      <div
                                        className="bg-white p-0.5 rounded shadow border cursor-pointer hover:bg-gray-50 text-xs"
                                        onClick={() => setEditingCause(subCause.id)}
                                        style={{ fontSize: `${8 * zoom}px` }}
                                      >
                                        {subCause.text || 'Sous-cause'}
                                      </div>
                                    )}
                                    
                                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => deleteCause(diagram.id, branch.id, subCause.id)}
                                        className="w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center"
                                        title="Supprimer"
                                      >
                                        <X size={6} />
                                      </button>
                                    </div>
                                  </div>
                                </foreignObject>
                              </g>
                            );
                          })}
                      </g>
                    );
                  })}

                {/* Bouton d'ajout de cause sur la branche */}
                <foreignObject
                  x={endX + 20 * zoom}
                  y={endY + 30 * zoom}
                  width={30 * zoom}
                  height={30 * zoom}
                >
                  <button
                    onClick={() => addCause(diagram.id, branch.id)}
                    className="w-full h-full bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg"
                    title={`Ajouter une cause ${branch.name}`}
                  >
                    <Plus size={12 * zoom} />
                  </button>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const selectedDiagram = diagrams.find(d => d.id === selectedDiagramId);

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
                <h1 className="text-2xl font-bold text-white">Diagramme d'Ishikawa (4M)</h1>
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

        {/* Zone de contenu avec dégradé subtle */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50">
          {/* Barre d'outils */}
          <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Boutons pour créer des diagrammes */}
                <div className="flex items-center space-x-2">
                  {Object.keys(M_CONFIGS).map((mType) => (
                    <button
                      key={mType}
                      onClick={() => createDiagram(mType as any)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
                    >
                      Nouveau {mType}
                    </button>
                  ))}
                </div>

                {/* Contrôles de zoom */}
                {selectedDiagram && (
                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
                    <button
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Liste des diagrammes */}
              {diagrams.length > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedDiagramId || ''}
                    onChange={(e) => setSelectedDiagramId(e.target.value || null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un diagramme</option>
                    {diagrams.map((diagram) => (
                      <option key={diagram.id} value={diagram.id}>
                        {diagram.name} ({diagram.mType})
                      </option>
                    ))}
                  </select>
                  
                  {selectedDiagramId && (
                    <button
                      onClick={() => deleteDiagram(selectedDiagramId)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                      title="Supprimer le diagramme"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 overflow-hidden">
            {diagrams.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <GitBranch className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun diagramme</h3>
                  <p className="text-gray-600 mb-6">Créez votre premier diagramme d'Ishikawa pour analyser les causes d'un problème</p>
                  <button
                    onClick={() => createDiagram('5M')}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Créer un diagramme 5M
                  </button>
                </div>
              </div>
            ) : selectedDiagram ? (
              <div className="h-full p-6">
                <div className="bg-white rounded-2xl shadow-lg h-full overflow-hidden">
                  {/* En-tête du diagramme */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}>
                          <GitBranch className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={selectedDiagram.name}
                            onChange={(e) => {
                              const newDiagrams = diagrams.map(d =>
                                d.id === selectedDiagram.id ? { ...d, name: e.target.value, updatedAt: new Date() } : d
                              );
                              saveDiagrams(newDiagrams);
                            }}
                            className="font-semibold text-lg bg-transparent border-none outline-none focus:bg-white focus:border focus:border-red-300 focus:rounded px-2 py-1"
                          />
                          <p className="text-sm text-gray-500">
                            Type: {selectedDiagram.mType} • 
                            Modifié: {selectedDiagram.updatedAt.toLocaleString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Zone de rendu du diagramme */}
                  <div ref={canvasRef} className="flex-1 h-full">
                    {renderDiagram(selectedDiagram)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionner un diagramme</h3>
                  <p className="text-gray-600">Choisissez un diagramme dans la liste déroulante ci-dessus</p>
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
                          <p className="text-xs mt-1">Utilisé principalement en production industrielle</p>
                        </div>
                        <div>
                          <strong className="text-gray-700">5M :</strong> + Milieu (environnement)
                          <p className="text-xs mt-1">Le plus couramment utilisé</p>
                        </div>
                        <div>
                          <strong className="text-gray-700">6M :</strong> + Mesure
                          <p className="text-xs mt-1">Pour les processus nécessitant des contrôles qualité</p>
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
                          <span><strong>Définir le problème</strong> clairement dans la boîte de droite</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                          <span><strong>Identifier les catégories</strong> de causes (4M, 5M, etc.)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                          <span><strong>Brainstormer les causes</strong> pour chaque catégorie</span>
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
                      <p>Utilisez les boutons "Nouveau 4M", "Nouveau 5M", etc.</p>
                    </div>
                    <div>
                      <strong className="text-gray-800">Éditer :</strong>
                      <p>Cliquez sur les boîtes de texte pour modifier le contenu</p>
                    </div>
                    <div>
                      <strong className="text-gray-800">Ajouter :</strong>
                      <p>Cliquez sur les boutons + verts pour ajouter des causes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};