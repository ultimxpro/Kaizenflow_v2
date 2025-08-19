import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { X } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onNavigate: (page: string, projectId?: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onNavigate }) => {
  const [titre, setTitre] = useState('');
  const [what, setWhat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { createProject } = useDatabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('handleSubmit called, currentUser:', currentUser);
      
      // Ensure we have a valid user profile before creating project
      if (!currentUser?.id) {
        console.error('No currentUser found:', currentUser);
        setError('Profil utilisateur non trouvé. Veuillez vous déconnecter et vous reconnecter.');
        setLoading(false);
        return;
      }

      console.log('Creating project with title:', titre.trim());
      console.log('Current user:', currentUser);
      const projectId = await createProject(titre.trim(), what.trim() || undefined);
      console.log('Project created with ID:', projectId);
      
      onClose();
      onNavigate('project', projectId);
    } catch (error: any) {
      console.error('Error creating project:', error);
      setError(error.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Nouveau Projet Kaizen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">
              Titre du Kaizen
            </label>
            <input
              type="text"
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Réduction des temps d'attente..."
              required
            />
            <p className="text-gray-500 text-xs mt-2">
              Décrivez brièvement l'objectif d'amélioration à atteindre
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="what" className="block text-sm font-medium text-gray-700 mb-2">
              Description du problème (optionnel)
            </label>
            <textarea
              id="what"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Quel est le problème à résoudre ?"
              rows={3}
            />
            <p className="text-gray-500 text-xs mt-2">
              Décrivez brièvement le problème ou la situation à améliorer
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !titre.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};