// src/components/CreateProjectModal.tsx
import React, { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Loader } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: any) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createProject } = useDatabase();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Vous devez être connecté pour créer un projet.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const newProject = await createProject(nom, description, user.id);
      onProjectCreated(newProject);
      setNom('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la création du projet.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full bg-gray-800 bg-opacity-80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Nouveau Projet</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-300 mb-2">
                Nom du projet
              </label>
              <input
                type="text"
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-gray-900 bg-opacity-70 border border-gray-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white"
                placeholder="Ex: Optimisation de la ligne 5"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description (facultatif)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-gray-900 bg-opacity-70 border border-gray-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white"
                placeholder="Quel est l'objectif de ce projet ?"
              ></textarea>
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end space-x-4">
               <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-gray-300 hover:bg-gray-700 transition">
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-5 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Créer le projet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};