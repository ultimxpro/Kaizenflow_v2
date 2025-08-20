// src/components/ProjectView.tsx - CORRECTION DU MENU PROJET
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { ArrowLeft, Edit3, Save, X, MoreVertical, Trash2, AlertTriangle } from 'lucide-react';
import { PDCAGrid } from './project/PDCAGrid';
import { SidePanel } from './project/SidePanel';
import { ModuleEditModal } from './project/ModuleEditModal';
import { MoveModuleModal } from './project/MoveModuleModal';

interface ProjectViewProps {
  projectId: string;
  onNavigate: (page: string) => void;
}

// Composant Modal de suppression de projet intégré
const DeleteProjectModal: React.FC<{
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}> = ({ projectId, projectTitle, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { deleteProject } = useDatabase();

  const handleDelete = async () => {
    if (confirmText !== 'SUPPRIMER') return;
    
    setLoading(true);
    try {
      await deleteProject(projectId);
      onDeleted();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="max-w-md w-full bg-white backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">Supprimer le projet</h2>
                <p className="text-red-100 text-sm">Cette action est irréversible</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">Attention !</h3>
                <p className="text-sm text-red-700">
                  Vous êtes sur le point de supprimer définitivement le projet :
                </p>
                <p className="text-sm font-semibold text-red-800 mt-2 bg-red-100 px-2 py-1 rounded">
                  "{projectTitle}"
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Cette action supprimera également :
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Tous les modules (5Pourquoi, VSM, Plan d'actions, etc.)</li>
              <li>• Toutes les actions et leurs assignations</li>
              <li>• Tous les membres du projet</li>
              <li>• L'historique complet du projet</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pour confirmer, tapez "SUPPRIMER" :
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              placeholder="SUPPRIMER"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'SUPPRIMER' || loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId, onNavigate }) => {
  const [editingModule, setEditingModule] = useState<A3Module | null>(null);
  const [movingModule, setMovingModule] = useState<A3Module | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { currentUser } = useAuth();
  const { projects, a3Modules, updateProject } = useDatabase();

  const project = projects.find(p => p.id === projectId);
  const projectModules = a3Modules.filter(module => module.project_id === projectId);

  const handleUpdateProject = (updates: any) => {
    if (projectId) {
      updateProject(projectId, updates);
    }
  };

  // Logique automatique PDCA
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

  const handleProjectDeleted = () => {
    setShowDeleteModal(false);
    onNavigate('dashboard');
  };

  const canDeleteProject = currentUser?.id === project?.pilote || currentUser?.role === 'admin';

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Projet non trouvé</h2>
          <button 
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-300/15 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-green-200/15 to-teal-300/20 rounded-full opacity-15 blur-3xl"></div>
      </div>

      {/* Header avec titre éditable */}
      <div className="relative z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Retour</span>
              </button>

              <div className="flex items-center space-x-4">
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none min-w-0 flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                      autoFocus
                    />
                    <button onClick={handleSaveTitle} className="p-1 text-green-600 hover:text-green-700">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCancelEdit('title')} className="p-1 text-red-600 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center group">
                    <h1 className="text-2xl font-bold text-gray-900 mr-2">{project.titre}</h1>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isEditingDescription ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      className="text-sm text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 min-w-0"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveDescription()}
                      placeholder="Description..."
                      autoFocus
                    />
                    <button onClick={handleSaveDescription} className="p-1 text-green-600 hover:text-green-700">
                      <Save className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleCancelEdit('description')} className="p-1 text-red-600 hover:text-red-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center group">
                    <span className="text-sm text-gray-600 mr-2">
                      {project.what || 'Cliquez pour ajouter une description...'}
                    </span>
                    <button
                      onClick={() => setIsEditingDescription(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Menu projet - VERSION CORRIGÉE */}
              {canDeleteProject && (
                <div className="relative ml-4">
                  <button
                    onClick={(e) => {
                      console.log('🎯 Project menu button clicked!');
                      e.stopPropagation();
                      setShowProjectMenu(!showProjectMenu);
                    }}
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-all"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  {showProjectMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[90]">
                      <button
                        onClick={(e) => {
                          console.log('🗑️ Delete project button clicked!');
                          e.stopPropagation();
                          setShowProjectMenu(false);
                          setShowDeleteModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer le projet
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex h-[calc(100vh-120px)] relative z-20">
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

        {/* Sidebar moderne */}
        <div className="w-80 bg-white/80 backdrop-blur-xl border-l border-gray-200/50 flex-shrink-0 overflow-y-auto">
          <SidePanel 
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        </div>
      </div>

      {/* Overlay pour fermer le menu - VERSION CORRIGÉE */}
      {showProjectMenu && (
        <div 
          className="fixed inset-0 z-[85]" 
          onClick={() => {
            console.log('🎯 Project menu overlay clicked!');
            setShowProjectMenu(false);
          }}
        />
      )}

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

      {showDeleteModal && (
        <DeleteProjectModal
          projectId={projectId}
          projectTitle={project.titre}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleProjectDeleted}
        />
      )}
    </div>
  );
};