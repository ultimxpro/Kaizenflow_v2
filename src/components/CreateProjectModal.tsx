import React, { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onNavigate: (page: string, projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onNavigate }) => {
  const [titre, setTitre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createProject } = useDatabase();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Vous devez être connecté pour créer un projet.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      // La logique de création est conservée de votre fichier original
      const newProject = await createProject({
        titre: titre,
        pilote: currentUser.id,
        statut: 'En cours',
        pdca_step: 'PLAN',
        // Ajoutez d'autres champs par défaut si nécessaire
      });

      if (newProject) {
        onNavigate('project', newProject.id); // Redirige vers le nouveau projet
      }
      onClose(); // Ferme la modale dans tous les cas
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la création.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="max-w-md w-full bg-gray-800 bg-opacity-90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Nouveau Projet Kaizen</h2>
            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="titre" className="block text-sm font-medium text-gray-300 mb-2">
                Titre du Kaizen
              </label>
              <input
                id="titre"
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="w-full bg-gray-900/70 border border-white/20 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white placeholder-gray-500"
                placeholder="Ex: Réduire les temps d'attente à la machine X"
                required
              />
            </div>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <div className="flex justify-end space-x-4 pt-4">
               <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-gray-300 hover:bg-white/10 transition">
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !titre}
                className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-5 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Création...
                  </>
                ) : 'Créer et Ouvrir'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};