import React, { useState, useEffect } from 'react';
import { FiveSItem, FiveSAssignment, FiveSItemPriority } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { X, User, Users, Crown, Plus, Trash2, Save } from 'lucide-react';

interface FiveSAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FiveSItem | null;
  onSave: () => void;
}

interface UserOption {
  id: string;
  nom: string;
  avatar_url?: string;
}

export const FiveSAssignmentModal: React.FC<FiveSAssignmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave
}) => {
  const { user } = useAuth();
  const {
    getFiveSAssignments,
    createFiveSAssignment,
    removeFiveSAssignment,
    projectMembers
  } = useDatabase();

  const [assignments, setAssignments] = useState<FiveSAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'responsible' | 'collaborator' | 'reviewer'>('responsible');

  // Charger les assignations existantes
  useEffect(() => {
    if (item && isOpen) {
      const itemAssignments = getFiveSAssignments(item.id);
      setAssignments(itemAssignments);
    }
  }, [item, isOpen, getFiveSAssignments]);

  // Fermer le modal
  const handleClose = () => {
    setAssignments([]);
    setSelectedUserId('');
    setSelectedRole('responsible');
    onClose();
  };

  // Ajouter une assignation
  const handleAddAssignment = async () => {
    if (!item || !selectedUserId || !user) return;

    setLoading(true);
    try {
      await createFiveSAssignment(item.id, selectedUserId, selectedRole);
      const updatedAssignments = getFiveSAssignments(item.id);
      setAssignments(updatedAssignments);
      setSelectedUserId('');
      setSelectedRole('responsible');
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une assignation
  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!user || !item) return;

    // Trouver l'assignation pour obtenir itemId et userId
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    setLoading(true);
    try {
      await removeFiveSAssignment(assignment.item_id, assignment.user_id);
      const updatedAssignments = getFiveSAssignments(item.id);
      setAssignments(updatedAssignments);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir la liste des utilisateurs disponibles
  const getAvailableUsers = (): UserOption[] => {
    return projectMembers
      .filter(pm => pm.project_id === item?.checklist_id) // Note: devrait être module_id
      .map(pm => ({
        id: pm.user_id,
        nom: pm.user_id, // À remplacer par le vrai nom depuis auth.users
        avatar_url: undefined
      }));
  };

  // Vérifier si un utilisateur est déjà assigné
  const isUserAssigned = (userId: string): boolean => {
    return assignments.some(a => a.user_id === userId);
  };

  // Obtenir les utilisateurs assignés avec leurs rôles
  const getAssignedUsers = () => {
    const assignedUsers: { [userId: string]: { roles: string[], assignments: FiveSAssignment[] } } = {};

    assignments.forEach(assignment => {
      if (!assignedUsers[assignment.user_id]) {
        assignedUsers[assignment.user_id] = {
          roles: [],
          assignments: []
        };
      }
      assignedUsers[assignment.user_id].roles.push(assignment.role);
      assignedUsers[assignment.user_id].assignments.push(assignment);
    });

    return assignedUsers;
  };

  if (!isOpen || !item) return null;

  const availableUsers = getAvailableUsers();
  const assignedUsers = getAssignedUsers();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assignations</h3>
                <p className="text-sm text-gray-600">{item.title}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">

            {/* Utilisateurs assignés */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Utilisateurs assignés ({Object.keys(assignedUsers).length})
              </h4>

              {Object.keys(assignedUsers).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">Aucun utilisateur assigné</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(assignedUsers).map(([userId, userData]) => (
                    <div
                      key={userId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{userId}</div>
                          <div className="flex gap-2 mt-1">
                            {userData.roles.map(role => (
                              <span
                                key={role}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  role === 'responsible'
                                    ? 'bg-red-100 text-red-700'
                                    : role === 'collaborator'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {role === 'responsible' && <Crown className="w-3 h-3 inline mr-1" />}
                                {role === 'responsible' ? 'Responsable' :
                                 role === 'collaborator' ? 'Collaborateur' : 'Relecteur'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {userData.assignments.map(assignment => (
                          <button
                            key={assignment.id}
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
                            title={`Retirer en tant que ${assignment.role}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ajouter une assignation */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une assignation
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utilisateur
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {availableUsers
                      .filter(u => !isUserAssigned(u.id))
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.nom}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'responsible' | 'collaborator' | 'reviewer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="responsible">Responsable</option>
                    <option value="collaborator">Collaborateur</option>
                    <option value="reviewer">Relecteur</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddAssignment}
                    disabled={!selectedUserId || loading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Informations sur les rôles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-blue-900 mb-2">Rôles disponibles</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Crown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Responsable</div>
                    <div className="text-gray-600">En charge de l'exécution</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Collaborateur</div>
                    <div className="text-gray-600">Participe à l'exécution</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Relecteur</div>
                    <div className="text-gray-600">Valide et contrôle</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onSave();
                handleClose();
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};