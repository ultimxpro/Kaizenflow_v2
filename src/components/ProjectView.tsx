// src/components/ProjectView.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { ArrowLeft, Edit3, Save, X } from 'lucide-react';
import { PDCAGrid } from './project/PDCAGrid';
import { SidePanel } from './project/SidePanel';
import { ModuleEditModal } from './project/ModuleEditModal';
import { MoveModuleModal } from './project/MoveModuleModal';

interface ProjectViewProps {
  projectId: string;
  onNavigate: (page: string) => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId, onNavigate }) => {
  const [editingModule, setEditingModule] = useState<A3Module | null>(null);
  const [movingModule, setMovingModule] = useState<A3Module | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  
  const { currentUser } = useAuth();
  const { projects, a3Modules, updateProject } = useDatabase();

  const project = projects.find(p => p.id === projectId);
  const projectModules = a3Modules.filter(module => module.project_id === projectId);

  const handleUpdateProject = (updates: any) => {
    if (projectId) {
      updateProject(projectId, updates);
    }
  };

  // MODIFICATION ICI : La logique automatique est de retour
  useEffect(() => {
    if (!project || !projectModules) return;

    const hasAct = projectModules.some(m => m.quadrant === 'ACT');
    const hasCheck = projectModules.some(m => m.quadrant === 'CHECK');
    const hasDo = projectModules.some(m => m.quadrant === 'DO');
    const hasPlan = projectModules.some(m => m.quadrant === 'PLAN');

    let newStep = 'PLAN';

    if (hasAct) newStep = 'ACT';
    else if (hasCheck) newStep = 'CHECK';
    else if (hasDo) newStep = 'DO';
    else if (hasPlan) newStep = 'PLAN';
    
    if (project.pdca_step !== newStep) {
      handleUpdateProject({ pdca_step: newStep });
    }
  }, [projectModules, project?.pdca_step]);

  // Initialiser les valeurs temporaires
  useEffect(() => {
    if (project) {
      setTempTitle(project.titre);
      setTempDescription(project.what || '');
    }
  }, [project]);

  const handleSaveTitle = () => {
    handleUpdateProject({ titre: tempTitle });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    handleUpdateProject({ what: tempDescription });
    setIsEditingDescription(false);
  };

  const handleCancelEdit = (type: 'title' | 'description') => {
    if (type === 'title') {
      setTempTitle(project?.titre || '');
      setIsEditingTitle(false);
    } else {
      setTempDescription(project?.what || '');
      setIsEditingDescription(false);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Projet non trouvé</h2>
          <p className="text-gray-600 mb-6">Ce projet n'existe pas ou vous n'y avez pas accès</p>
          <button 
            onClick={() => onNavigate('dashboard')} 
            className="bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-colors font-semibold"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const getPDCABarColor = (step: string) => {
    switch (step) {
      case 'PLAN': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'DO': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'CHECK': return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'ACT': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-80 h-80 bg-gradient-to-br from-green-50 to-blue-50 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Barre PDCA moderne */}
      <div className={`h-1 ${getPDCABarColor(project.pdca_step)} relative z-20 shadow-lg`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
      
      <div className="flex flex-row flex-1 overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header moderne */}
          <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 flex-shrink-0">
            <div className="max-w-full px-6 h-20 flex items-center">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-all hover:bg-gray-100 px-3 py-2 rounded-xl group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-semibold">Retour</span>
              </button>
              
              <div className="flex-1 min-w-0">
                {/* Titre éditable */}
                <div className="mb-1">
                  {isEditingTitle ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className="text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                        placeholder="Titre du Kaizen"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle();
                          if (e.key === 'Escape') handleCancelEdit('title');
                        }}
                      />
                      <button
                        onClick={handleSaveTitle}
                        className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancelEdit('title')}
                        className="w-8 h-8 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingTitle(true)}
                      className="group flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg px-3 py-1 -mx-3 transition-all"
                    >
                      <h1 className="text-2xl font-bold text-gray-900 truncate">
                        {project.titre || 'Titre du Kaizen'}
                      </h1>
                      <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  )}
                </div>

                {/* Description éditable */}
                <div>
                  {isEditingDescription ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-sm font-medium text-gray-500 mr-2 flex-shrink-0">
                        Problème :
                      </div>
                      <input
                        type="text"
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        className="text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                        placeholder="Quel est le problème ? (Quoi ?)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveDescription();
                          if (e.key === 'Escape') handleCancelEdit('description');
                        }}
                      />
                      <button
                        onClick={handleSaveDescription}
                        className="w-6 h-6 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleCancelEdit('description')}
                        className="w-6 h-6 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingDescription(true)}
                      className="group flex items-center cursor-pointer hover:bg-gray-100 rounded-lg px-3 py-1 -mx-3 transition-all"
                    >
                      <label className="text-sm font-medium text-gray-500 mr-2 flex-shrink-0">
                        Problème :
                      </label>
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {project.what || 'Cliquez pour décrire le problème...'}
                      </span>
                      <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Zone principale avec PDCA Grid */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <PDCAGrid 
                projectId={projectId}
                modules={projectModules}
                onEditModule={setEditingModule}
                onMoveModule={setMovingModule}
              />
            </div>
          </div>
        </div>

        {/* Sidebar moderne */}
        <div className="w-80 bg-white/80 backdrop-blur-xl border-l border-gray-200/50 flex-shrink-0 overflow-y-auto">
          <SidePanel 
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        </div>
      </div>

      {editingModule && (
        <ModuleEditModal
          module={editingModule}
          onClose={() => setEditingModule(null)}
        />
      )}

      {movingModule && (
        <MoveModuleModal
          module={movingModule}
          onClose={() => setMovingModule(null)}
        />
      )}
    </div>
  );
};