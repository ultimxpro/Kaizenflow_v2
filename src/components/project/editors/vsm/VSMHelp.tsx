// src/components/project/editors/vsm/VSMHelp.tsx

import React from 'react';
import { X, Keyboard, Mouse, Info } from 'lucide-react';

interface VSMHelpProps {
  onClose: () => void;
}

export const VSMHelp: React.FC<VSMHelpProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[65vh] overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Guide d'utilisation VSM</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(65vh - 160px)' }}>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-teal-600" />
                  Value Stream Mapping (VSM)
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Le VSM est un outil de lean management qui permet de visualiser et analyser
                  le flux de matériaux et d'informations nécessaires pour amener un produit
                  ou service jusqu'au client.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Mouse className="w-5 h-5 mr-2 text-blue-600" />
                  Modes de travail
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-mono mr-4 shadow-md">V</kbd>
                    <div>
                      <strong className="text-gray-900">Mode Sélection :</strong>
                      <span className="text-gray-700 ml-2">Sélectionner et déplacer les éléments</span>
                    </div>
                  </div>
                  <div className="flex items-start bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-sm font-mono mr-4 shadow-md">C</kbd>
                    <div>
                      <strong className="text-gray-900">Mode Connexion :</strong>
                      <span className="text-gray-700 ml-2">Créer des connexions entre éléments</span>
                    </div>
                  </div>
                  <div className="flex items-start bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg text-sm font-mono mr-4 shadow-md">H</kbd>
                    <div>
                      <strong className="text-gray-900">Mode Pan :</strong>
                      <span className="text-gray-700 ml-2">Déplacer la vue</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Keyboard className="w-5 h-5 mr-2 text-purple-600" />
                  Raccourcis clavier
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-sm font-mono mr-4 shadow-md">Delete</kbd>
                    <span className="text-gray-700">Supprimer l'élément sélectionné</span>
                  </div>
                  <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-mono mr-4 shadow-md">Ctrl+D</kbd>
                    <span className="text-gray-700">Dupliquer l'élément</span>
                  </div>
                  <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-sm font-mono mr-4 shadow-md">Ctrl+C/V</kbd>
                    <span className="text-gray-700">Copier/Coller l'élément</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Types d'éléments</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <div>
                      <strong className="text-gray-900">Fournisseur</strong>
                      <p className="text-sm text-gray-600">Source externe de matériaux</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">C</span>
                    </div>
                    <div>
                      <strong className="text-gray-900">Client</strong>
                      <p className="text-sm text-gray-600">Destinataire final</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div>
                      <strong className="text-gray-900">Processus</strong>
                      <p className="text-sm text-gray-600">Étape de transformation</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">▲</span>
                    </div>
                    <div>
                      <strong className="text-gray-900">Stock</strong>
                      <p className="text-sm text-gray-600">Inventaire entre processus</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Conseils d'utilisation</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Commencez par placer le client et le fournisseur aux extrémités
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Ajoutez les processus principaux de gauche à droite
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Utilisez le zoom et le pan pour naviguer
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Identifiez les opportunités Kaizen
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Navigation dans l'interface</h4>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
                  <div>
                    <strong className="text-gray-800">Créer :</strong>
                    <p>Cliquez sur les boutons de la barre d'outils</p>
                  </div>
                  <div>
                    <strong className="text-gray-800">Éditer :</strong>
                    <p>Cliquez sur les éléments pour les modifier</p>
                  </div>
                  <div>
                    <strong className="text-gray-800">Connecter :</strong>
                    <p>Mode C + clic sur les ancres des éléments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Métriques clés du VSM</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <strong className="text-teal-700">Lead Time :</strong> Temps total du processus<br/>
                <strong className="text-teal-700">Temps VA :</strong> Temps où de la valeur est ajoutée<br/>
                <strong className="text-teal-700">Efficacité :</strong> Ratio VA/Lead Time
              </div>
              <div>
                <strong className="text-teal-700">Takt Time :</strong> Rythme de production nécessaire<br/>
                <strong className="text-teal-700">TC :</strong> Temps de Cycle d'une opération<br/>
                <strong className="text-teal-700">TCH :</strong> Temps de Changement
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:via-cyan-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            Compris !
          </button>
        </div>
      </div>
    </div>
  );
};