// src/components/project/ModuleCard.tsx
import React from 'react';
import { A3Module } from '../../types/database';
import { 
  MessageSquare, GitBranch, BookOpen, CheckSquare, 
  Workflow, Monitor, PenTool, Activity, FileText, 
  Trash2, Move, Heart, Target, ArrowUpRight, Route, Search, Shield
} from 'lucide-react';

interface ModuleCardProps {
  module: A3Module;
  onClick: () => void;
  onMove?: (module: A3Module) => void;
  onDelete?: (moduleId: string) => void;
}

const getToolIcon = (toolType: string) => {
  switch (toolType) {
    case 'SMART':
      return (
        <div className="relative w-4 h-4">
          <Target className="w-4 h-4" />
          <ArrowUpRight className="w-2.5 h-2.5 absolute right-0 top-0" />
        </div>
      );
    case '5Pourquoi': return <MessageSquare className="w-4 h-4" />;
    case '4M': return <GitBranch className="w-4 h-4" />;
    case 'VSM': return <Workflow className="w-4 h-4" />;
    case 'OPL': return <BookOpen className="w-4 h-4" />;
    case '5S': return <CheckSquare className="w-4 h-4" />;
    case 'PlanActions': return <CheckSquare className="w-4 h-4" />;
    case 'Croquis': return <PenTool className="w-4 h-4" />;
    case 'Spaghetti': return <Route className="w-4 h-4" />;
    case '3G5G': return <Search className="w-4 h-4" />;
    case 'Iframe': return <Monitor className="w-4 h-4" />;
    case 'Indicateurs': return <Activity className="w-4 h-4" />;
    case 'Satisfaction': return <Heart className="w-4 h-4" />;
    case 'SOP': return <FileText className="w-4 h-4" />;
    case 'TWTTP': return <Shield className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getToolColor = (toolType: string) => {
  switch (toolType) {
    case 'SMART': return 'from-blue-500 to-indigo-600';
    case '5Pourquoi': return 'from-purple-500 to-purple-600';
    case '4M': return 'from-red-500 to-red-600';
    case 'VSM': return 'from-emerald-500 to-emerald-600';
    case 'OPL': return 'from-indigo-500 to-indigo-600';
    case '5S': return 'from-teal-500 to-teal-600';
    case 'PlanActions': return 'from-green-500 to-green-600';
    case 'Croquis': return 'from-yellow-500 to-yellow-600';
    case 'Spaghetti': return 'from-red-500 to-pink-600';
    case 'Iframe': return 'from-gray-500 to-gray-600';
    case 'Indicateurs': return 'from-cyan-500 to-cyan-600';
    case 'Satisfaction': return 'from-emerald-500 to-emerald-600';
    case 'SOP': return 'from-indigo-500 to-indigo-600';
    case '3G5G': return 'from-red-500 to-pink-600';
    case 'TWTTP': return 'from-sky-500 to-blue-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

const getToolName = (toolType: string) => {
  switch (toolType) {
    case 'SMART': return 'Objectif SMART';
    case '5Pourquoi': return '5 Pourquoi';
    case '4M': return '4M (Ishikawa)';
    case 'VSM': return 'VSM';
    case 'OPL': return 'OPL';
    case '5S': return '5S';
    case 'PlanActions': return 'Plan d\'Actions';
    case 'Croquis': return 'Croquis';
    case 'Spaghetti': return 'Spaghetti Chart';
    case 'Iframe': return 'Iframe';
    case 'Indicateurs': return 'Kamishibai';
    case 'Satisfaction': return 'Satisfaction';
    case 'SOP': return 'SOP';
    case '3G5G': return '3G / 5G';
    case 'TWTTP': return 'TWTTP - HERCA';
    default: return toolType;
  }
};

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick, onMove, onDelete }) => {
  return (
    <div className="relative group">
      <div 
        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/60 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer hover:bg-white/90"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 bg-gradient-to-br ${getToolColor(module.tool_type)} rounded-lg flex items-center justify-center text-white shadow-sm`}>
              {getToolIcon(module.tool_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {module.titre || getToolName(module.tool_type)}
              </h4>
            </div>
          </div>
          
          {/* Boutons d'action directs - PLUS DE MENU TROIS POINTS */}
          <div className="flex items-center space-x-2">
            {/* Bouton déplacer BLEU */}
            {onMove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onMove(module);
                }}
                className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                title="Déplacer"
              >
                <Move className="w-4 h-4 text-white" />
              </button>
            )}
            
            {/* Bouton rouge supprimer */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (confirm('Supprimer ce module ?')) {
                    onDelete(module.id);
                  }
                }}
                className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>

        {module.date_echeance && (
          <div className="text-xs text-gray-500">
            Échéance : {new Date(module.date_echeance).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>
    </div>
  );
};
