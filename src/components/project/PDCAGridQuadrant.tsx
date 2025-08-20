// src/components/project/PDCAGridQuadrant.tsx
import React from 'react';
import { A3Module } from '../../types/database';
import { ModuleCard } from './ModuleCard';
import { Plus } from 'lucide-react';

interface PDCAGridQuadrantProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  modules: A3Module[];
  onEditModule: (module: A3Module) => void;
  onMoveModule?: (module: A3Module) => void;
  onAddModule: () => void;
  onDeleteModule?: (moduleId: string) => void;
}

export const PDCAGridQuadrant: React.FC<PDCAGridQuadrantProps> = ({
  modules,
  onEditModule,
  onMoveModule,
  onAddModule,
  onDeleteModule
}) => {
  return (
    <>
      {modules.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <button
            onClick={onAddModule}
            className="
              flex items-center justify-center space-x-3 
              w-full h-32
              border-2 border-dashed border-gray-300/60 
              rounded-xl 
              hover:border-gray-400/80 hover:bg-white/40 
              transition-all duration-300 
              backdrop-blur-sm
              group
            "
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-gray-200/80 transition-all">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
                Ajouter un module
              </p>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4 h-full">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={() => onEditModule(module)}
              onMove={onMoveModule}
              onDelete={onDeleteModule ? () => onDeleteModule(module.id) : undefined}
            />
          ))}
          
          {/* Bouton d'ajout en bas */}
          <button
            onClick={onAddModule}
            className="
              w-full py-3 
              border border-dashed border-gray-300/60 
              rounded-xl 
              hover:border-gray-400/80 hover:bg-white/40 
              transition-all duration-300 
              backdrop-blur-sm
              flex items-center justify-center space-x-2
              group
            "
          >
            <Plus className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
              Ajouter
            </span>
          </button>
        </div>
      )}
    </>
  );
};