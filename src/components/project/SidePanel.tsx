import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Plus, Crown, X } from 'lucide-react';
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
      case 'PLAN': return 'bg-blue-500 text-white';
      case 'DO': return 'bg-green-500 text-white';
      case 'CHECK': return 'bg-orange-500 text-white';
      case 'ACT': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
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
    <div className="w-80 bg-gray-50 p-6 overflow-y-auto border-l border-gray-200">
      {/* Informations du projet */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Informations</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Titre</label>
              <input
                type="text"
                value={project?.titre || ''}
                onChange={(e) => handleFieldChange('titre', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Description du problème</label>
              <textarea
                value={project?.what || ''}
                onChange={(e) => handleFieldChange('what', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 h-20 resize-none"
                placeholder="Quel est le problème à résoudre ?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Lieu</label>
              <input
                type="text"
                value={project?.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                placeholder="Ligne 2, Poste 5..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bénéfice / Coût */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Bénéfice / Coût (B/C)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Coût:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={project?.cost || 0}
                  onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5"
                />
                <span className="text-sm text-gray-500">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Gain:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={project?.benefit || 0}
                  onChange={(e) => handleFieldChange('benefit', parseFloat(e.target.value) || 0)}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5"
                />
                <span className="text-sm text-gray-500">€</span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <span className="text-sm font-medium text-gray-500">B/C: </span>
              <span className={`font-bold ${(project?.benefit - project?.cost) >= 0 ? 
                'text-green-600' : 'text-red-600'}`}>
                {((project?.benefit || 0) - (project?.cost || 0)).toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statut du Kaizen */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Statut du Kaizen</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Statut</label>
              <select
                value={project?.statut || 'En cours'}
                onChange={(e) => handleStatusChange(e.target.value as 'En cours' | 'Terminé')}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
              >
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Étape Actuelle (Automatique)</label>
              <div className={`px-3 py-2 text-sm font-bold rounded-md text-center ${getStepActiveColor(project?.pdca_step)}`}>
                {project?.pdca_step || 'PLAN'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Équipe */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Équipe</h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun membre assigné</p>
            ) : (
              members.map((member) => {
                const user = users?.find(u => u.id === member.user_id);
                const isLeader = member.role_in_project === 'Leader';

                return (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {user?.signedAvatarUrl ? (
                            <img src={user.signedAvatarUrl} alt={user.nom} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {user?.nom?.split(' ').map(n => n.charAt(0)).join('') || '?'}
                            </span>
                          )}
                        </div>
                        {isLeader && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                            <Crown className="w-3 h-3 text-yellow-800" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.nom || 'Utilisateur inconnu'}</p>
                        <p className="text-xs text-gray-500">{member.role_in_project}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {!isLeader && (
                        <button
                          onClick={() => setNewLeader(member.id)}
                          className="text-gray-400 hover:text-yellow-500 transition-colors p-1 rounded-full"
                          title="Définir comme leader"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full"
                        title="Retirer du projet"
                      >
                        <X className="w-4 h-4" />
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