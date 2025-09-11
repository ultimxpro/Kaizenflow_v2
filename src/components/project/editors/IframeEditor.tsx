import React, { useEffect, useMemo, useState } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { Monitor, HelpCircle, ExternalLink, AlertTriangle, Plus, Trash2, X } from 'lucide-react';

interface IframeEditorProps {
  module: A3Module;
  onClose: () => void;
}

type IframeItem = {
  id: string;
  title?: string;
  url: string;
  height?: number; // px
  allowFullscreen?: boolean;
  notes?: string;
};

type IframeContent = {
  items: IframeItem[];
};

const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const IframeEditor: React.FC<IframeEditorProps> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);

  const initial: IframeContent = useMemo(() => {
    const c = module.content || {};
    // Backward compatibility: single url -> items
    if (c && (c as any).url && !(c as any).items) {
      return { items: [{ id: makeId(), title: 'Intégration', url: (c as any).url, height: 480, allowFullscreen: true }] };
    }
    return { items: Array.isArray((c as any).items) ? (c as any).items : [] };
  }, [module.content]);

  const [items, setItems] = useState<IframeItem[]>(initial.items);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // If we converted legacy content, persist once
  useEffect(() => {
    if (module.content && (module.content as any).url && !(module.content as any).items) {
      updateA3Module(module.id, { content: { items } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveItems = (next: IframeItem[]) => {
    setItems(next);
    updateA3Module(module.id, { content: { items: next } });
  };

  const addItem = () => {
    const next = [...items, { id: makeId(), title: '', url: '', height: 480, allowFullscreen: true }];
    saveItems(next);
  };

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id);
    saveItems(next);
  };

  const updateItem = (id: string, updates: Partial<IframeItem>, save = false) => {
    const next = items.map(i => (i.id === id ? { ...i, ...updates } : i));
    setItems(next);
    if (save) updateA3Module(module.id, { content: { items: next } });
  };

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header dégradé */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Intégrations Web (Iframe)</h2>
                <p className="text-white/80 text-sm">Ajoutez plusieurs iframes (Power BI, Tableau, etc.)</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                title="Aide"
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                title="Fermer"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-end">
            <button
              onClick={addItem}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-md"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Ajouter une iframe
            </button>
          </div>

          {items.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50 text-center text-gray-600">
              Aucune iframe. Cliquez sur “Ajouter une iframe”.
            </div>
          ) : (
            items.map((item) => {
              const invalid = item.url && !isValidUrl(item.url);
              const hasError = errors[item.id];
              const height = Math.max(200, item.height || 480);
              return (
                <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                  {/* Config bar */}
                  <div className="p-4 border-b border-gray-200/60 bg-gray-50/60">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          onBlur={() => updateItem(item.id, {}, true)}
                          placeholder="Ex: Tableau de bord Qualité"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white/80"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                        <input
                          type="url"
                          value={item.url}
                          onChange={(e) => updateItem(item.id, { url: e.target.value })}
                          onBlur={() => { updateItem(item.id, {}, true); setErrors(prev => ({ ...prev, [item.id]: false })); }}
                          placeholder="https://... (URL d’intégration)"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-white/80 ${invalid ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hauteur (px)</label>
                        <input
                          type="number"
                          min={200}
                          value={item.height || 480}
                          onChange={(e) => updateItem(item.id, { height: parseInt(e.target.value || '0', 10) || 480 })}
                          onBlur={() => updateItem(item.id, {}, true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white/80"
                        />
                      </div>
                      <div className="flex items-center justify-end md:justify-start gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Supprimer cette iframe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {item.url && isValidUrl(item.url) && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                            title="Ouvrir dans un nouvel onglet"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ouvrir
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="px-4 pt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optionnel)</label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                      onBlur={() => updateItem(item.id, {}, true)}
                      placeholder="Contexte, instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white/80"
                    />
                  </div>

                  {/* Preview */}
                  <div className="mt-4">
                    <div className="bg-gray-100 px-4 py-2 border-t border-b">
                      <h3 className="text-sm font-medium text-gray-700">Prévisualisation</h3>
                    </div>
                    <div className="relative bg-white" style={{ height }}>
                      {item.url && isValidUrl(item.url) && !hasError ? (
                        <iframe
                          key={item.id}
                          src={item.url}
                          className="absolute top-0 left-0 w-full h-full border-0"
                          title={item.title || 'Intégration'}
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          allow={"clipboard-read; clipboard-write; fullscreen"}
                          allowFullScreen
                          onError={() => setErrors(prev => ({ ...prev, [item.id]: true }))}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          {item.url ? (
                            <div className="text-center p-6">
                              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                              <h4 className="text-lg font-medium text-red-800 mb-2">Intégration impossible</h4>
                              <p className="text-sm text-red-600 mb-4">
                                L’URL est invalide ou le site bloque l’intégration iframe. Vérifiez les paramètres de partage (ex: Power BI) ou utilisez une URL d’intégration.
                              </p>
                            </div>
                          ) : (
                            <div className="text-center p-6">
                              <Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">Renseignez une URL pour voir la prévisualisation</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer (no extra actions; help icon in header) */}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Intégrations Iframe - Guide d'utilisation</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                    <h4 className="text-lg font-semibold text-teal-800 mb-3">Cas d’usage</h4>
                    <ul className="text-teal-700 text-sm space-y-2 list-disc list-inside">
                      <li>Tableaux de bord Power BI / Tableau / Looker</li>
                      <li>Google Data Studio / Appsheet / Outils internes</li>
                      <li>Tout contenu web autorisant l’intégration iframe</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">Bonnes pratiques</h4>
                    <ul className="text-blue-700 text-sm space-y-2 list-disc list-inside">
                      <li>Utilisez l’URL “Intégrer” fournie par l’outil source</li>
                      <li>Privilégiez des hauteurs adaptées (ex: 480–900px)</li>
                      <li>Ouvrez dans un onglet si l’intégration est bloquée</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-3">Problèmes courants</h4>
                    <ul className="text-yellow-700 text-sm space-y-2 list-disc list-inside">
                      <li>Erreur X-Frame-Options / CSP: site non intégrable</li>
                      <li>URL privée: activer le partage public ou restreint</li>
                      <li>Réseau: vérifier proxies/VPN si nécessaire</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-3">Astuce</h4>
                    <p className="text-green-700 text-sm">Ajoutez plusieurs iframes pour juxtaposer indicateurs, rapports et apps, avec des titres clairs pour la lecture.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Compris !
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

