import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { X, User, Users } from 'lucide-react';

interface AddMemberModalProps {
  projectId: string;
  onClose: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ projectId, onClose }) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'personas'>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { users } = useAuth();
  const { personas, projectMembers, addProjectMember } = useDatabase();

  // Filtrage des utilisateurs disponibles
  const existingMemberIds = projectMembers
    .filter(pm => pm.project_id === projectId)
    .map(pm => pm.user_id);

  const availableUsers = users?.filter(user => !existingMemberIds.includes(user.id)) || [];

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePersonaToggle = (personaId: string) => {
    setSelectedPersonas(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0 && selectedPersonas.length === 0) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ajout des utilisateurs sélectionnés
      for (const userId of selectedUsers) {
        await addProjectMember(projectId, userId, 'Membre');
      }

      // Ajout des personas sélectionnés
      for (const personaId of selectedPersonas) {
        const persona = personas.find(p => p.id === personaId);
        if (persona) {
          await addProjectMember(projectId, personaId, 'Membre');
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout des membres:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'ajout des membres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Ajouter des membres</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span>Utilisateurs</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('personas')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'personas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Personas</span>
            </div>
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-3">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Tous les utilisateurs sont déjà membres du projet
                </p>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                        {user.signedAvatarUrl ? (
                          <img 
                            src={user.signedAvatarUrl} 
                            alt={user.nom} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-white">
                            {user.nom.split(' ').map(n => n.charAt(0)).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.nom}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'personas' && (
            <div className="space-y-3">
              {personas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun persona disponible
                </p>
              ) : (
                personas.map((persona) => (
                  <div
                    key={persona.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPersonas.includes(persona.id)}
                      onChange={() => handlePersonaToggle(persona.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {persona.nom.split(' ').map(n => n.charAt(0)).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{persona.nom}</p>
                        <p className="text-xs text-gray-500">{persona.fonction}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (selectedUsers.length === 0 && selectedPersonas.length === 0)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {loading ? 'Ajout...' : `Ajouter (${selectedUsers.length + selectedPersonas.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};