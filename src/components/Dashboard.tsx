import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { Plus, FolderOpen, Users, LogOut, Calendar, Settings, Shield } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';

interface DashboardProps {
  onNavigate: (page: string, projectId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser, signedAvatarUrl, signOut, isAdmin } = useAuth();
  const { projects, loading } = useDatabase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const myProjects = projects.filter(p => p.pilote === currentUser?.id);
  const contributingProjects = projects.filter(p => 
    p.pilote !== currentUser?.id && 
    false
  );

  const handleLogout = () => {
    signOut();
    onNavigate('login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">LeanDeck</h1>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>Bonjour, {currentUser?.nom}</span>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {signedAvatarUrl ? (
                    <img
                      src={signedAvatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {currentUser?.nom?.split(' ').map(n => n.charAt(0)).join('') || '?'}
                    </span>
                  )}
                </div>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Profil
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord</h1>
          <p className="text-gray-600">Gérez vos projets d'amélioration continue</p>
        </div>

        {/* New Project Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau Kaizen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* My Kaizens */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FolderOpen className="w-5 h-5 mr-2 text-blue-600" />
                Mes Kaizens
              </h2>
              <p className="text-gray-600 text-sm mt-1">Projets que vous pilotez</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Chargement...</p>
                </div>
              ) : myProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun projet Kaizen en cours</p>
                  <p className="text-gray-400 text-sm">Créez votre premier projet pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => onNavigate('project', project.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.titre}</h3>
                          <p className="text-sm text-gray-500 mt-1">{project.kaizen_number}</p>
                          {project.what && (
                            <p className="text-sm text-gray-600 mt-2">{project.what}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.statut === 'En cours'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {project.statut}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.pdca_step === 'PLAN' ? 'bg-blue-100 text-blue-700' :
                          project.pdca_step === 'DO' ? 'bg-green-100 text-green-700' :
                          project.pdca_step === 'CHECK' ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {project.pdca_step}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(project.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kaizens where I contribute */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Les Kaizens où j'interviens
              </h2>
              <p className="text-gray-600 text-sm mt-1">Projets où vous contribuez</p>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune contribution active</p>
                <p className="text-gray-400 text-sm">Vous serez invité à collaborer sur des projets</p>
              </div>
            </div>
          </div>

          {/* Actions assigned to me */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                Actions qui me sont assignées
              </h2>
              <p className="text-gray-600 text-sm mt-1">Tâches à réaliser</p>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune action assignée</p>
                <p className="text-gray-400 text-sm">Les actions vous seront assignées dans les projets</p>
              </div>
            </div>
          </div>

          {/* Actions I created */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-purple-600" />
                Actions que j'ai créées
              </h2>
              <p className="text-gray-600 text-sm mt-1">Actions initiées par vous</p>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune action créée</p>
                <p className="text-gray-400 text-sm">Créez des actions dans vos projets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};