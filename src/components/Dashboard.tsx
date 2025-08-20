// src/components/Dashboard.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { 
  Plus, FolderOpen, Users, Calendar, Settings, LogOut, Shield, 
  ChevronDown, TrendingUp, Activity, Target, Clock, Search, Filter, Bell
} from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';

interface DashboardProps {
  onNavigate: (page: string, projectId?: string) => void;
}

// Helper pour les couleurs des étapes PDCA
const getPdcaStepColor = (step: string) => {
  switch (step) {
    case 'PLAN': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'DO': return 'bg-green-100 text-green-700 border-green-200';
    case 'CHECK': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'ACT': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser, signedAvatarUrl, signOut, isAdmin } = useAuth();
  const { projects, loading } = useDatabase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const myProjects = projects.filter(p => p.pilote === currentUser?.id);
  const contributingProjects = projects.filter(p => p.pilote !== currentUser?.id && false);

  const filteredProjects = myProjects.filter(project =>
    project.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.kaizen_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    signOut();
    onNavigate('login');
  };

  // Stats rapides
  const stats = {
    totalProjects: myProjects.length,
    inProgress: myProjects.filter(p => p.statut === 'En cours').length,
    completed: myProjects.filter(p => p.statut === 'Terminé').length,
    totalSavings: myProjects.reduce((sum, p) => sum + ((p.benefit || 0) - (p.cost || 0)), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 relative overflow-hidden">
      {/* Éléments décoratifs de fond avec dégradés blanc-gris */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full opacity-15 blur-3xl"></div>
      </div>

      {/* Header moderne avec glassmorphism */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo et titre */}
        <div className="cursor-pointer group" onClick={() => onNavigate('dashboard')}>
  <img 
    src="/leandeck-symbol.png" 
    alt="Leandeck Logo" 
    className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-300" 
  />
</div>
            
            <div className="flex items-center gap-x-4">
              {/* Bouton de notification */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-xl transition-all backdrop-blur-sm">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              </button>

              {/* Bouton nouveau kaizen */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all transform hover:scale-[0.98] shadow-lg hover:shadow-xl font-semibold backdrop-blur-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau Kaizen</span>
              </button>

              {/* Menu utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/70 transition-all group backdrop-blur-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                    {signedAvatarUrl ? (
                      <img src={signedAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-700">
                        {currentUser?.nom?.split(' ').map(n => n.charAt(0)).join('') || '?'}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{currentUser?.nom}</p>
                    <p className="text-xs text-gray-500">En ligne</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-down"
                    onMouseLeave={() => setIsMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{currentUser?.nom}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    </div>
                    <button
                      onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/70 flex items-center transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profil et paramètres
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/70 flex items-center transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-3" />
                        Administration
                      </button>
                    )}
                    <div className="my-1 h-px bg-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/70 flex items-center transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* En-tête de la page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord</h1>
          <p className="text-gray-600 font-medium">Gérez vos projets d'amélioration continue</p>
        </div>
        
        {/* Stats rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Économies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSavings.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Layout 4 colonnes comme avant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                </div>
                Mes Kaizens
              </h2>
              <p className="text-gray-400 text-sm mt-1">Projets que vous pilotez</p>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Aucun projet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-3 text-sm bg-gradient-to-br from-gray-800 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-900 hover:to-gray-800 transition-all"
                  >
                    Créer un projet
                  </button>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onNavigate('project', project.id)}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200/60 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{project.titre}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.statut === 'Terminé' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {project.statut}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{project.kaizen_number}</p>
                    <div className="flex items-center justify-between mt-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPdcaStepColor(project.pdca_step)}`}>
                            {project.pdca_step}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                Où j'interviens
              </h2>
              <p className="text-gray-400 text-sm mt-1">Projets où vous contribuez</p>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune contribution.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                Mes actions
              </h2>
              <p className="text-gray-400 text-sm mt-1">Tâches qui vous sont assignées</p>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune action assignée.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="w-4 h-4 text-purple-600" />
                </div>
                Actions créées
              </h2>
              <p className="text-gray-400 text-sm mt-1">Actions initiées par vous</p>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="text-center py-8 text-gray-400">
                <Plus className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune action créée.</p>
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