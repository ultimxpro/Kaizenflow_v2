// src/components/project/ModuleSelectionModal.tsx
import React from 'react';
import { X, HelpCircle, MessageSquare, Image, GitBranch, BookOpen, CheckSquare, Workflow, Monitor, PenTool, Activity, FileText } from 'lucide-react';

interface ModuleSelectionModalProps {
  quadrant: string;
  allowedTools: string[];
  onSelect: (toolType: string) => void;
  onClose: () => void;
}

const toolsConfig = {
  '5Pourquoi': {
    name: '5 Pourquoi',
    icon: <MessageSquare className="w-6 h-6" />,
    description: 'Analyse des causes racines',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    lightBg: 'from-purple-50 to-purple-100'
  },
  '4M': {
    name: '4M (Ishikawa)',
    icon: <GitBranch className="w-6 h-6" />,
    description: 'Diagramme en arêtes de poisson',
    gradient: 'bg-gradient-to-br from-red-500 to-red-600',
    lightBg: 'from-red-50 to-red-100'
  },
  'VSM': {
    name: 'VSM',
    icon: <Workflow className="w-6 h-6" />,
    description: 'Value Stream Mapping',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    lightBg: 'from-emerald-50 to-emerald-100'
  },
  'OPL': {
    name: 'OPL',
    icon: <BookOpen className="w-6 h-6" />,
    description: 'One Point Lesson',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    lightBg: 'from-indigo-50 to-indigo-100'
  },
  '5S': {
    name: '5S',
    icon: <CheckSquare className="w-6 h-6" />,
    description: 'Checklist 5S',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-600',
    lightBg: 'from-teal-50 to-teal-100'
  },
  'PlanActions': {
    name: 'Plan d\'Actions',
    icon: <CheckSquare className="w-6 h-6" />,
    description: 'Gestion des actions et matrice Gain/Effort',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    lightBg: 'from-green-50 to-green-100'
  },
  'Croquis': {
    name: 'Croquis',
    icon: <PenTool className="w-6 h-6" />,
    description: 'Outil de dessin libre',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    lightBg: 'from-yellow-50 to-yellow-100'
  },
  'Iframe': {
    name: 'Iframe',
    icon: <Monitor className="w-6 h-6" />,
    description: 'Intégration web (Power BI, etc.)',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-600',
    lightBg: 'from-gray-50 to-gray-100'
  },
  'Indicateurs': {
    name: 'Indicateurs',
    icon: <Activity className="w-6 h-6" />,
    description: 'Suivi et vérification des résultats',
    gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    lightBg: 'from-cyan-50 to-cyan-100'
  },
  'SOP': {
    name: 'SOP',
    icon: <FileText className="w-6 h-6" />,
    description: 'Standard Operating Procedure',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    lightBg: 'from-indigo-50 to-indigo-100'
  }
};

const getQuadrantColor = (quadrant: string) => {
  switch (quadrant) {
    case 'PLAN': return 'from-blue-500 to-blue-600';
    case 'DO': return 'from-green-500 to-green-600';
    case 'CHECK': return 'from-orange-500 to-orange-600';
    case 'ACT': return 'from-purple-500 to-purple-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

export const ModuleSelectionModal: React.FC<ModuleSelectionModalProps> = ({
  quadrant,
  allowedTools,
  onSelect,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header avec dégradé du quadrant */}
        <div className={`bg-gradient-to-r ${getQuadrantColor(quadrant)} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Ajouter un module - {quadrant}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Sélectionnez l'outil que vous souhaitez utiliser
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>-r ${getQuadrantColor(quadrant)} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Ajouter un module - {quadrant}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Sélectionnez l'outil que vous souhaitez utiliser
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allowedTools.map((toolType) => {
              const tool = toolsConfig[toolType as keyof typeof toolsConfig];
              if (!tool) return null;
              
              return (
                <button
                  key={toolType}
                  onClick={() => onSelect(toolType)}
                  className={`
                    relative overflow-hidden
                    bg-gradient-to-br ${tool.lightBg}
                    border border-gray-200/50 rounded-2xl p-6
                    hover:border-gray-300/70 hover:shadow-lg 
                    transition-all duration-300 
                    text-left group
                    backdrop-blur-sm
                  `}
                >
                  {/* Effet glassmorphism */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 group-hover:from-white/60 group-hover:to-white/30 transition-all"></div>
                  
                  <div className="relative z-10 flex items-start space-x-4">
                    <div className={`${tool.gradient} text-white p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {tool.name}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {allowedTools.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun module disponible</h3>
              <p className="text-gray-600">
                Tous les modules autorisés pour ce quadrant ont déjà été ajoutés.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t border-gray-100/70 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
      </div>
    </div>
  );
};