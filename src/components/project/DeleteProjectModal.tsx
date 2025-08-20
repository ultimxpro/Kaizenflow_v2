// src/components/DeleteProjectModal.tsx
import React, { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteProjectModalProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ 
  projectId, 
  projectTitle, 
  onClose, 
  onDeleted 
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { deleteProject } = useDatabase();

  const handleDelete = async () => {
    if (confirmText !== 'SUPPRIMER') return;
    
    setLoading(true);
    try {
      await deleteProject(projectId);
      onDeleted();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full bg-white backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">Supprimer le projet</h2>
                <p className="text-red-100 text-sm">Cette action est irréversible</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">Attention !</h3>
                <p className="text-sm text-red-700">
                  Vous êtes sur le point de supprimer définitivement le projet :
                </p>
                <p className="text-sm font-semibold text-red-800 mt-2 bg-red-100 px-2 py-1 rounded">
                  "{projectTitle}"
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Cette action supprimera également :
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Tous les modules (5Pourquoi, VSM, Plan d'actions, etc.)</li>
              <li>• Toutes les actions et leurs assignations</li>
              <li>• Tous les membres du projet</li>
              <li>• L'historique complet du projet</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pour confirmer, tapez "SUPPRIMER" :
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              placeholder="SUPPRIMER"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'SUPPRIMER' || loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};