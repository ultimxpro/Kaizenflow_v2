// src/components/project/PDCAGrid.tsx
import React, { useState } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { A3Module } from '../../types/database';
import { PDCAGridQuadrant } from './PDCAGridQuadrant';
import { ModuleSelectionModal } from './ModuleSelectionModal';

interface PDCAGridProps {
  projectId: string;
  modules: A3Module[];
  onEditModule: (module: A3Module) => void;
  onMoveModule?: (module: A3Module) => void;
}

const quadrants = [
  { 
    id: 'PLAN', 
    title: 'PLAN', 
    subtitle: 'Description du phénomène',
    bgGradient: 'bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50',
    borderColor: 'border-blue-300/60',
    headerGradient: 'bg-gradient-to-r from-blue-500/90 to-blue-600/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)]',
    allowedTools: ['5Pourquoi', '4M', 'VSM', 'Croquis', 'Iframe']
  },
  { 
    id: 'DO', 
    title: 'DO', 
    subtitle: 'Description de la solution',
    bgGradient: 'bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/50',
    borderColor: 'border-emerald-300/60',
    headerGradient: 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)]',
    allowedTools: ['5S', 'PlanActions', 'Croquis', 'Iframe']
  },
  { 
    id: 'CHECK', 
    title: 'CHECK', 
    subtitle: 'Vérification des résultats',
    bgGradient: 'bg-gradient-to-br from-white via-orange-50/30 to-orange-100/50',
    borderColor: 'border-orange-300/60',
    headerGradient: 'bg-gradient-to-r from-orange-500/90 to-orange-600/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(249,115,22,0.15)]',
    allowedTools: ['Indicateurs', 'Croquis', 'Iframe']
  },
  { 
    id: 'ACT', 
    title: 'ACT', 
    subtitle: 'Standardisation et expansion',
    bgGradient: 'bg-gradient-to-br from-white via-violet-50/30 to-violet-100/50',
    borderColor: 'border-violet-300/60',
    headerGradient: 'bg-gradient-to-r from-violet-500/90 to-violet-600/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(139,92,246,0.15)]',
    allowedTools: ['OPL', 'SOP', 'Croquis', 'Iframe']
  }
];

const uniqueTools = ['5Pourquoi', '4M', 'VSM', '5S', 'PlanActions', 'SOP'];

export const PDCAGrid: React.FC<PDCAGridProps> = ({ projectId, modules, onEditModule, onMoveModule }) => {
  const [showModuleSelection, setShowModuleSelection] = useState<string | null>(null);
  const { createA3Module, deleteA3Module } = useDatabase();

  const handleAddModule = (quadrant: string, toolType: string) => {
    const nextPosition = modules
      .filter(m => m.quadrant === quadrant)
      .length;
    
    createA3Module({
      project_id: projectId,
      quadrant: quadrant as 'PLAN' | 'DO' | 'CHECK' | 'ACT',
      tool_type: toolType as any,
      content: {},
      position: nextPosition
    });
    
    setShowModuleSelection(null);
  };

  const getModulesForQuadrant = (quadrant: string) => {
    return modules
      .filter(module => module.quadrant === quadrant)
      .sort((a, b) => a.position - b.position);
  };

  const getAllowedToolsForQuadrant = (quadrantId: string) => {
    const quadrantConfig = quadrants.find(q => q.id === quadrantId);
    if (!quadrantConfig) return [];
    
    const existingToolTypes = modules.map(m => m.tool_type);
    
    return quadrantConfig.allowedTools.filter(tool => {
      if (uniqueTools.includes(tool)) {
        return !existingToolTypes.includes(tool);
      }
      return true;
    });
  };

  return (
    <div className="h-full p-4 relative">
      {/* Grille PDCA avec glassmorphism */}
      <div className="grid grid-cols-2 grid-rows-2 gap-6 h-full">
        {quadrants.map((quadrant) => {
          const quadrantModules = getModulesForQuadrant(quadrant.id);
          
          return (
            <div
              key={quadrant.id}
              className={`
                ${quadrant.bgGradient} 
                ${quadrant.borderColor} 
                ${quadrant.hoverShadow}
                border-2 rounded-2xl flex flex-col h-full 
                transition-all duration-500 ease-out 
                hover:scale-[1.02] hover:border-opacity-80
                backdrop-blur-sm
                group relative overflow-hidden
              `}
            >
              {/* Effet glassmorphism subtil */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 pointer-events-none"></div>
              
              {/* Header avec dégradé moderne */}
              <div className={`${quadrant.headerGradient} backdrop-blur-xl p-3 rounded-t-2xl border-b border-white/20 flex-shrink-0 relative z-10`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div>
                    <h3 className="font-bold text-lg text-white tracking-wide group-hover:scale-105 transition-transform duration-300">
                      {quadrant.title}
                    </h3>
                    <p className="text-white/80 text-xs font-medium mt-0.5">
                      {quadrant.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu avec glassmorphism */}
              <div className="p-6 flex-1 overflow-y-auto min-h-0 relative z-10">
                <PDCAGridQuadrant
                  id={quadrant.id}
                  title={quadrant.title}
                  subtitle={quadrant.subtitle}
                  icon={null}
                  modules={quadrantModules}
                  onEditModule={onEditModule}
                  onMoveModule={onMoveModule}
                  onAddModule={() => setShowModuleSelection(quadrant.id)}
                  onDeleteModule={(moduleId) => {
                    if(confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
                      deleteA3Module(moduleId);
                    }
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de sélection moderne */}
      {showModuleSelection && (
        <ModuleSelectionModal
          quadrant={showModuleSelection}
          allowedTools={getAllowedToolsForQuadrant(showModuleSelection)}
          onSelect={(toolType) => handleAddModule(showModuleSelection, toolType)}
          onClose={() => setShowModuleSelection(null)}
        />
      )}
    </div>
  );
};