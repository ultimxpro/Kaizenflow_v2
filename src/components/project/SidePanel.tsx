// src/components/project/SidePanel.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Plus, Crown, X, MapPin, Calendar, Euro, TrendingUp, Users, Settings } from 'lucide-react';
import { AddMemberModal } from './AddMemberModal';

interface SidePanelProps {
  project: any;
  onUpdateProject: (updates: any) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ project, onUpdateProject }) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const { users } = useAuth();
  const { projectMembers, updateProjectMember, removeProjectMember } = useDatabase();

  // Filtrage des membres du projet
  const members = projectMembers.filter(pm => pm.project_id === project?.id);

  const handleFieldChange = (field: string, value: any) => {
    onUpdateProject({ [field]: value });
  };

  const handleStatusChange = (statut: 'En cours' | 'Terminé') => {
    onUpdateProject({ statut });
  };

  const getStepActiveColor = (step: string) => {
    switch (step) {
      case 'PLAN': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg';
      case 'DO': return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg';
      case 'CHECK': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg';
      case 'ACT': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
    }
  };

  const setNewLeader = (memberId: string) => {
    // Trouver le leader actuel et le rétrograder en membre
    const currentLeader = members.find(m => m.role_in_project === 'Leader');
    if (currentLeader && currentLeader.id !== memberId) {
      updateProjectMember(currentLeader.id, { role_in_project: 'Membre' });
    }
    // Promouvoir le nouveau leader
    updateProjectMember(memberId, { role_in_project: 'Leader' });
  };

  const removeMember = (memberId: string) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce membre du projet ?')) {
      removeProjectMember(memberId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header du sidebar */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Paramètres du projet</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Informations générales */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              <MapPin className="w-3 h-3 text-blue-600" />
            </div>
            Informations générales
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro Kaizen</label>
              <input
                type="text"
                value={project?.kaizen_number || ''}
                onChange={(e) => handleFieldChange('kaizen_number', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                placeholder="Ex: KZ-2025-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
              <input
                type="text"
                value={project?.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                placeholder="Ex: Atelier A, Ligne 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thème</label>
              <input
                type="text"
                value={project?.theme || ''}
                onChange={(e) => handleFieldChange('theme', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                placeholder="Ex: Qualité, Productivité, Sécurité"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date du problème</label>
              <input
                type="date"
                value={project?.date_probleme ? new Date(project.date_probleme).toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldChange('date_probleme', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
              />
            </div>
          </div>
        </div>

        {/* Impact financier */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
              <Euro className="w-3 h-3 text-green-600" />
            </div>
            Impact financier
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coût</label>
                <input
                  type="number"
                  value={project?.cost || 0}
                  onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bénéfice</label>
                <input
                  type="number"
                  value={project?.benefit || 0}
                  onChange={(e) => handleFieldChange('benefit', parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">ROI :</span>
                <span className={`text-lg font-bold ${
                  ((project?.benefit || 0) - (project?.cost || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {((project?.benefit || 0) - (project?.cost || 0)).toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statut du Kaizen */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
              <TrendingUp className="w-3 h-3 text-orange-600" />
            </div>
            Statut du Kaizen
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={project?.statut || 'En cours'}
                onChange={(e) => handleStatusChange(e.target.value as 'En cours' | 'Terminé')}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
              >
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Étape Actuelle (Automatique)</label>
              <div className={`px-4 py-3 text-sm font-bold rounded-lg text-center ${getStepActiveColor(project?.pdca_step)} transform transition-all hover:scale-[0.98]`}>
                {project?.pdca_step || 'PLAN'}
              </div>
            </div>
          </div>
        </div>

        {/* Équipe */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                <Users className="w-3 h-3 text-purple-600" />
              </div>
              Équipe
            </h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {members.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Aucun membre assigné</p>
                <p className="text-xs text-gray-500 mt-1">Ajoutez des collaborateurs au projet</p>
              </div>
            ) : (
              members.map((member) => {
                const user = users?.find(u => u.id === member.user_id);
                const isLeader = member.role_in_project === 'Leader';

                return (
                  <div key={member.id} className="flex items-center justify-between bg-white/50 rounded-lg p-3 border border-gray-200/50 hover:bg-white/80 transition-all group">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
                          {user?.signedAvatarUrl ? (
                            <img src={user.signedAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-gray-700">
                              {user?.nom?.split(' ').map(n => n.charAt(0)).join('') || '?'}
                            </span>
                          )}
                        </div>
                        {isLeader && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.nom || 'Utilisateur inconnu'}</p>
                        <p className="text-xs text-gray-600">{isLeader ? 'Leader' : 'Membre'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isLeader && (
                        <button
                          onClick={() => setNewLeader(member.id)}
                          className="w-7 h-7 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg flex items-center justify-center transition-colors"
                          title="Promouvoir leader"
                        >
                          <Crown className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeMember(member.id)}
                        className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center justify-center transition-colors"
                        title="Retirer du projet"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          projectId={project?.id}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
};