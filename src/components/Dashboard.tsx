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

// Helper pour les couleurs des étapes PDCA - style plein comme dans le sidepanel
const getPdcaStepColor = (step: string) => {
  switch (step) {
    case 'PLAN': return 'bg-blue-500 text-white';
    case 'DO': return 'bg-green-500 text-white';
    case 'CHECK': return 'bg-orange-500 text-white';
    case 'ACT': return 'bg-purple-500 text-white';
    default: return 'bg-gray-500 text-white';
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

  // Filtrage avec la barre de recherche
  const filteredProjects = myProjects.filter(project =>
    project.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.kaizen_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tri des projets : En cours d'abord, puis Terminés
  const sortedProjects = filteredProjects.sort((a, b) => {
    if (a.statut === 'En cours' && b.statut === 'Terminé') return -1;
    if (a.statut === 'Terminé' && b.statut === 'En cours') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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
      {/* Éléments décoratifs de fond avec dégradés blanc-gris cohérents avec la page de connexion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-300/15 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-green-200/15 to-teal-300/20 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-br from-orange-100/20 to-yellow-200/15 rounded-full blur-2xl"></div>
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
                className="w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            
            <div className="flex items-center gap-x-4">
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
                      <img 
                        src={signedAvatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold text-sm">
                        {currentUser?.user_metadata?.nom?.[0] || currentUser?.email?.[0] || '?'}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {currentUser?.user_metadata?.nom || currentUser?.email?.split('@')[0] || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 py-2 z-50">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100/70 flex items-center transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Paramètres du profil
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100/70 flex items-center transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-3" />
                        Administration
                      </button>
                    )}

                    <hr className="my-2 border-gray-200/60" />
                    
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
        {/* En-tête de la page avec barre de recherche */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord</h1>
            <p className="text-gray-600 font-medium">Gérez vos projets d'amélioration continue</p>
          </div>
          
          {/* Barre de recherche alignée */}
          <div className="relative w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un élément..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-300 shadow-sm"
            />
          </div>
        </div>
        
        {/* Stats rapides - Version avec couleurs grises élégantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Kaizens - Gris foncé */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/20 shadow-lg hover:shadow-xl transition-all group text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200 opacity-90">Total Kaizens</p>
                <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          {/* En cours - Gris moyen */}
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 backdrop-blur-sm rounded-2xl p-6 border border-gray-500/20 shadow-lg hover:shadow-xl transition-all group text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200 opacity-90">En cours</p>
                <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          {/* Terminés - Gris acier */}
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 backdrop-blur-sm rounded-2xl p-6 border border-slate-500/20 shadow-lg hover:shadow-xl transition-all group text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200 opacity-90">Terminés</p>
                <p className="text-3xl font-bold text-white">{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Économies - Gris bleuté */}
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 backdrop-blur-sm rounded-2xl p-6 border border-gray-500/20 shadow-lg hover:shadow-xl transition-all group text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200 opacity-90">Économies</p>
                <p className="text-2xl font-bold text-white">{stats.totalSavings.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un kaizen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-300 shadow-sm"
            />
          </div>
        </div>

        {/* Layout 4 colonnes avec compteurs ajoutés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Mes Kaizens avec compteur */}
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <FolderOpen className="w-4 h-4 text-gray-600" />
                  </div>
                  Mes Kaizens
                </div>
                <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {filteredProjects.length}
                </span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">Projets que vous pilotez</p>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                </div>
              ) : filteredProjects.length === 0 ? (
                searchTerm ? (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-2" />
                    <p>Aucun kaizen trouvé pour "{searchTerm}"</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      Effacer la recherche
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FolderOpen className="w-12 h-12 mx-auto mb-2" />
                    <p>Aucun projet en cours.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      Créer votre premier Kaizen
                    </button>
                  </div>
                )
              ) : (
                sortedProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => onNavigate('project', project.id)}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">
                        {project.titre}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                        project.statut === 'Terminé' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {project.statut}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{project.kaizen_number}</p>
                    <div className="flex items-center justify-between mt-4">
                        <span className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm ${getPdcaStepColor(project.pdca_step)}`}>
                            {project.pdca_step}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Où j'interviens avec compteur */}
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  Où j'interviens
                </div>
                <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {contributingProjects.length}
                </span>
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

          {/* Mes actions avec compteur */}
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  Mes actions
                </div>
                <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  0
                </span>
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

          {/* Notifications avec compteur */}
          <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-gray-100/70 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <Bell className="w-4 h-4 text-gray-600" />
                  </div>
                  Notifications
                </div>
                <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  0
                </span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">Alertes et mises à jour</p>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune notification.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de création de projet */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};