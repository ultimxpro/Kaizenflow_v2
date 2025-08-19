import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../Lib/supabase'; // Import direct de Supabase
import { X, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onNavigate: (page: string, projectId: string) => void;
}

// Données par défaut pour un nouveau projet, comme dans votre code original
const defaultProjectData = {
  statut: 'En cours',
  pdca_step: 'PLAN',
  modules: [
    { id: 'module-plan-1', type: '5-why', title: '5 Pourquoi', content: null, quadrant: 'PLAN' },
    { id: 'module-plan-2', type: 'ishikawa', title: 'Ishikawa', content: null, quadrant: 'PLAN' },
    { id: 'module-do-1', type: 'plan-actions', title: 'Plan d\'actions', content: null, quadrant: 'DO' },
  ],
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onNavigate }) => {
  const [titre, setTitre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      // On utilise la logique de création directe de votre code original
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([{ 
          titre: titre, // Assure que 'titre' est bien une chaîne de caractères
          pilote: currentUser.id, 
          ...defaultProjectData 
        }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        // La navigation utilise l'ID du projet créé, comme dans votre code original
        onNavigate('project', data.id);
      } else {
        throw new Error("La création a échoué : aucune donnée retournée.");
      }
      
      onClose();

    } catch (err: any) {
      console.error("Erreur de création du projet:", err);
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