// src/components/project/PDCAGrid.tsx - VERSION DEBUG
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
    bgGradient: 'bg-gradient-to-br from-white via-sky-50/30 to-indigo-100/50',
    headerGradient: 'bg-gradient-to-r from-indigo-800/90 via-blue-600/90 to-sky-400/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)]',
    allowedTools: ['5Pourquoi', '4M', 'VSM', 'Croquis', 'Iframe']
  },
  { 
    id: 'DO', 
    title: 'DO', 
    subtitle: 'Description de la solution',
    bgGradient: 'bg-gradient-to-br from-white via-lime-50/30 to-emerald-100/50',
    headerGradient: 'bg-gradient-to-r from-emerald-700/90 via-green-500/90 to-lime-400/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)]',
    allowedTools: ['5S', 'PlanActions', 'Croquis', 'Iframe']
  },
  { 
    id: 'CHECK', 
    title: 'CHECK', 
    subtitle: 'Vérification des résultats',
    bgGradient: 'bg-gradient-to-br from-white via-orange-50/30 to-pink-100/50',
    headerGradient: 'bg-gradient-to-r from-pink-600/90 via-orange-500/90 to-orange-300/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(249,115,22,0.15)]',
    allowedTools: ['Indicateurs', 'Croquis', 'Iframe']
  },
  { 
    id: 'ACT', 
    title: 'ACT', 
    subtitle: 'Standardisation et expansion',
    bgGradient: 'bg-gradient-to-br from-white via-violet-50/30 to-indigo-100/50',
    headerGradient: 'bg-gradient-to-r from-indigo-900/90 via-purple-600/90 to-violet-400/90',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgb(139,92,246,0.15)]',
    allowedTools: ['OPL', 'SOP', 'Croquis', 'Iframe']
  }
];

const uniqueTools = ['5Pourquoi', '4M', 'VSM', '5S', 'PlanActions', 'SOP'];

export const PDCAGrid: React.FC<PDCAGridProps> = ({ projectId, modules, onEditModule, onMoveModule }) => {
  const [showModuleSelection, setShowModuleSelection] = useState<string | null>(null);
  const [deletingModule, setDeletingModule] = useState<string | null>(null);
  const { createA3Module, deleteA3Module } = useDatabase();

  const handleAddModule = (quadrant: string, toolType: string) => {
    console.log('➕ Adding module:', { quadrant, toolType });
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

  const handleDeleteModule = async (moduleId: string) => {
    console.log('🗑️ DELETE MODULE CALLED with ID:', moduleId);
    console.log('🗑️ deleteA3Module function exists:', !!deleteA3Module);
    
    setDeletingModule(moduleId);
    
    try {
      console.log('🗑️ Attempting to delete module...');
      await deleteA3Module(moduleId);
      console.log('✅ Module deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting module:', error);
      alert('Erreur lors de la suppression du module: ' + error.message);
    } finally {
      setDeletingModule(null);
    }
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

  // Debug: log des props au montage
  React.useEffect(() => {
    console.log('🏗️ PDCAGrid rendered:', {
      projectId,
      modulesCount: modules.length,
      hasDeleteFunction: !!deleteA3Module
    });
  }, [projectId, modules.length, deleteA3Module]);

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
                ${quadrant.hoverShadow}
                rounded-2xl flex flex-col h-full 
                transition-all duration-500 ease-out 
                border border-white/40 
                backdrop-blur-sm
                group relative overflow-hidden
              `}
            >
              {/* Effet glassmorphism subtil */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 pointer-events-none"></div>
              
              {/* Header avec dégradé moderne */}
              <div className={`${quadrant.headerGradient} backdrop-blur-xl p-4 rounded-t-2xl border-b border-white/20 flex-shrink-0 relative z-10`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div>
                    <h3 className="font-bold text-lg text-white tracking-wide transition-colors duration-300">
                      {quadrant.title}
                    </h3>
                    <p className="text-white/80 text-xs font-medium mt-0.5">
                      {quadrant.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu avec glassmorphism */}
              <div className="p-6 flex-1 overflow-y-auto min-h-0 relative z-20">
                <PDCAGridQuadrant
                  id={quadrant.id}
                  title={quadrant.title}
                  subtitle={quadrant.subtitle}
                  icon={null}
                  modules={quadrantModules}
                  onEditModule={onEditModule}
                  onMoveModule={onMoveModule}
                  onAddModule={() => setShowModuleSelection(quadrant.id)}
                  onDeleteModule={handleDeleteModule}
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

      {/* Overlay de chargement lors de la suppression */}
      {deletingModule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80]">
          <div className="bg-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">Suppression en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};