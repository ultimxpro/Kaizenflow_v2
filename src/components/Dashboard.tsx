import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { Plus, FolderOpen, Users, LogOut, Calendar, Settings, Shield, ChevronDown } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';

interface DashboardProps {
  onNavigate: (page: string, projectId?: string) => void;
}

// Helper pour les couleurs des étapes PDCA
const getPdcaStepColor = (step: string) => {
  switch (step) {
    case 'PLAN': return 'bg-blue-500/20 text-blue-300';
    case 'DO': return 'bg-green-500/20 text-green-300';
    case 'CHECK': return 'bg-orange-500/20 text-orange-300';
    case 'ACT': return 'bg-purple-500/20 text-purple-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser, signedAvatarUrl, signOut, isAdmin } = useAuth();
  const { projects, loading } = useDatabase();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const myProjects = projects.filter(p => p.pilote === currentUser?.id);
  const contributingProjects = projects.filter(p => p.pilote !== currentUser?.id && false);

  const handleLogout = () => {
    signOut();
    onNavigate('login');
  };

  return (
    <div className="min-h-screen w-full text-white" style={{
      background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)'
    }}>
      {/* ===== HEADER AMÉLIORÉ ===== */}
      <header className="bg-gray-900/30 backdrop-blur-lg sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
              <img src="/leandeck-symbol.png" alt="KaizenFlow Logo" className="w-9 h-9" />
              <h1 className="text-xl font-bold tracking-wider">KaizenFlow</h1>
            </div>
            
            <div className="flex items-center gap-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau Kaizen</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                    {signedAvatarUrl ? (
                      <img src={signedAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-gray-200">
                        {currentUser?.nom?.split(' ').map(n => n.charAt(0)).join('') || '?'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden md:block">{currentUser?.nom}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-gray-800 border border-white/10 rounded-lg shadow-2xl py-2 z-50 animate-fade-in-down"
                    onMouseLeave={() => setIsMenuOpen(false)}
                  >
                    <button
                      onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 flex items-center transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profil
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 flex items-center transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-3" />
                        Administration
                      </button>
                    )}
                    <div className="my-1 h-px bg-white/10"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 flex items-center transition-colors"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Tableau de Bord</h1>
            <p className="text-gray-300">Gérez vos projets d'amélioration continue</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          
          <div className="bg-gray-900/40 backdrop-blur-md rounded-xl shadow-lg border border-white/10 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-white/10 flex-shrink-0">
              <h2 className="text-lg font-semibold flex items-center"><FolderOpen className="w-5 h-5 mr-3 text-blue-400" />Mes Kaizens</h2>
              <p className="text-gray-400 text-sm mt-1">Projets que vous pilotez</p>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {loading ? (
                 <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div></div>
              ) : myProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400"><FolderOpen className="w-12 h-12 mx-auto mb-2" /><p>Aucun projet Kaizen.</p></div>
              ) : (
                myProjects.map((project) => (
                  <div key={project.id} onClick={() => onNavigate('project', project.id)}
                    className="p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-blue-500/50"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-white pr-2">{project.titre}</h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${project.statut === 'En cours' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
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

          <div className="bg-gray-900/40 backdrop-blur-md rounded-xl shadow-lg border border-white/10 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-white/10 flex-shrink-0"><h2 className="text-lg font-semibold flex items-center"><Users className="w-5 h-5 mr-3 text-green-400" />Où j'interviens</h2><p className="text-gray-400 text-sm mt-1">Projets où vous contribuez</p></div>
            <div className="p-5 overflow-y-auto"><div className="text-center py-8 text-gray-400"><Users className="w-12 h-12 mx-auto mb-2" /><p>Aucune contribution.</p></div></div>
          </div>

          <div className="bg-gray-900/40 backdrop-blur-md rounded-xl shadow-lg border border-white/10 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-white/10 flex-shrink-0"><h2 className="text-lg font-semibold flex items-center"><Calendar className="w-5 h-5 mr-3 text-orange-400" />Mes actions</h2><p className="text-gray-400 text-sm mt-1">Tâches qui vous sont assignées</p></div>
            <div className="p-5 overflow-y-auto"><div className="text-center py-8 text-gray-400"><Calendar className="w-12 h-12 mx-auto mb-2" /><p>Aucune action assignée.</p></div></div>
          </div>
          
          <div className="bg-gray-900/40 backdrop-blur-md rounded-xl shadow-lg border border-white/10 flex flex-col max-h-[70vh]">
            <div className="p-5 border-b border-white/10 flex-shrink-0"><h2 className="text-lg font-semibold flex items-center"><Plus className="w-5 h-5 mr-3 text-purple-400" />Actions créées</h2><p className="text-gray-400 text-sm mt-1">Actions initiées par vous</p></div>
            <div className="p-5 overflow-y-auto"><div className="text-center py-8 text-gray-400"><Plus className="w-12 h-12 mx-auto mb-2" /><p>Aucune action créée.</p></div></div>
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