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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-green-50 to-blue-50 rounded-full opacity-30 blur-3xl"></div>
      </div>

      {/* Header moderne */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo et titre */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-600 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src="/leandeck-symbol.png" alt="Leandeck Logo" className="w-6 h-6 filter brightness-0 invert" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Leandeck</h1>
                <p className="text-xs text-gray-500 font-medium">Amélioration continue</p>
              </div>
            </div>
            
            <div className="flex items-center gap-x-4">
              {/* Bouton de notification */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              </button>

              {/* Bouton nouveau kaizen */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all transform hover:scale-[0.98] shadow-lg hover:shadow-xl font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau Kaizen</span>
              </button>

              {/* Menu utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all group"
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
                    className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-down"
                    onMouseLeave={() => setIsMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{currentUser?.nom}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    </div>
                    <button
                      onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profil et paramètres
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-3" />
                        Administration
                      </button>
                    )}
                    <div className="my-1 h-px bg-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
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
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Économies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSavings.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mes Kaizens */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 flex flex-col h-[600px]">
              <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Mes Kaizens</h2>
                      <p className="text-sm text-gray-600">Projets que vous pilotez</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="sm:hidden w-10 h-10 bg-gray-800 text-white rounded-xl flex items-center justify-center hover:bg-gray-900 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un projet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Chargement...</p>
                    </div>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm ? 'Aucun résultat' : 'Aucun projet'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm ? 'Aucun projet ne correspond à votre recherche' : 'Créez votre premier projet Kaizen'}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-colors font-semibold"
                      >
                        Créer un projet
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => onNavigate('project', project.id)}
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
                          {project.titre}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          project.statut === 'Terminé' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {project.statut}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{project.kaizen_number}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPdcaStepColor(project.pdca_step)}`}>
                          {project.pdca_step}
                        </span>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar avec autres sections */}
          <div className="space-y-6">
            {/* Où j'interviens */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Où j'interviens</h2>
                    <p className="text-sm text-gray-600">Projets où vous contribuez</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Aucune contribution</p>
                  <p className="text-sm text-gray-500 mt-1">Vous ne participez à aucun autre projet</p>
                </div>
              </div>
            </div>

            {/* Mes actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Mes actions</h2>
                    <p className="text-sm text-gray-600">Tâches qui vous sont assignées</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Aucune action assignée</p>
                  <p className="text-sm text-gray-500 mt-1">Toutes vos tâches sont à jour</p>
                </div>
              </div>
            </div>

            {/* Actions créées */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Actions créées</h2>
                    <p className="text-sm text-gray-600">Actions initiées par vous</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Aucune action créée</p>
                  <p className="text-sm text-gray-500 mt-1">Commencez par créer un projet</p>
                </div>
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