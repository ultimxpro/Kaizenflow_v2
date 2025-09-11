import React, { useEffect, useMemo, useState } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { Search, HelpCircle, Save, X, List, BookOpen, CheckCircle2 } from 'lucide-react';

type GItemKey = 'gemba' | 'genbutsu' | 'genjitsu' | 'genri' | 'gensoku';

type GItem = {
  key: GItemKey;
  title: string;
  subtitle: string;
  description: string;
  verified?: boolean;
  notes?: string;
};

type Content = {
  mode: '3G' | '5G';
  items: Record<GItemKey, GItem>;
  conclusion?: string;
};

const DEFAULT_ITEMS: Record<GItemKey, GItem> = {
  gemba: {
    key: 'gemba',
    title: 'Gemba',
    subtitle: 'Le lieu réel',
    description: "Aller sur le terrain (atelier, poste) pour voir la réalité du processus et du problème.",
  },
  genbutsu: {
    key: 'genbutsu',
    title: 'Genbutsu',
    subtitle: 'L’objet réel',
    description: "Observer l’objet/la pièce/le document réel concerné par le problème.",
  },
  genjitsu: {
    key: 'genjitsu',
    title: 'Genjitsu',
    subtitle: 'Les faits réels',
    description: "Collecter des faits et des données objectives (qui, quoi, quand, où, combien).",
  },
  genri: {
    key: 'genri',
    title: 'Genri',
    subtitle: 'Les principes',
    description: "Analyser selon les principes/lois du procédé (physiques, qualité, process).",
  },
  gensoku: {
    key: 'gensoku',
    title: 'Gensoku',
    subtitle: 'Les standards/règles',
    description: "Comparer avec les standards, procédures, règles et bonnes pratiques en vigueur.",
  },
};

interface Props { module: A3Module; onClose: () => void; }

export const ThreeGFiveGEditor: React.FC<Props> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);
  // Intercepte les anciens alerts d'aide et ouvre la modale cohérente
  useEffect(() => {
    const orig = window.alert;
    (window as any).alert = () => setShowHelp(true);
    return () => { (window as any).alert = orig; };
  }, []);

  const initial: Content = useMemo(() => {
    const c = module.content as Content | undefined;
    if (c && c.items) return c;
    return {
      mode: '5G',
      items: DEFAULT_ITEMS,
      conclusion: '',
    };
  }, [module.content]);

  const [mode, setMode] = useState<'3G' | '5G'>(initial.mode);
  const [items, setItems] = useState<Record<GItemKey, GItem>>(initial.items);
  const [conclusion, setConclusion] = useState<string>(initial.conclusion || '');

  const visibleKeys: GItemKey[] = mode === '3G'
    ? ['gemba', 'genbutsu', 'genjitsu']
    : ['gemba', 'genbutsu', 'genjitsu', 'genri', 'gensoku'];

  const save = () => {
    updateA3Module(module.id, { content: { mode, items, conclusion } });
  };

  const updateItem = (key: GItemKey, updates: Partial<GItem>) => {
    setItems(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header rouge */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Search className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">3G / 5G - Principes</h2>
                <p className="text-white/80 text-sm">Aller au fait: terrain, objet, faits, principes, standards</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => alert('3G: Gemba (lieu réel), Genbutsu (objet réel), Genjitsu (faits réels). 5G ajoute Genri (principes) et Gensoku (standards). Utilisez ce module pour structurer votre observation en PLAN.')}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg"
                title="Aide"
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </button>
              <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg" title="Fermer">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mode */}
          <div className="flex items-center justify-between bg-white/80 rounded-2xl border border-gray-200 p-4">
            <div>
              <div className="text-gray-900 font-semibold">Sélection du cadre</div>
              <div className="text-gray-600 text-sm">Choisissez le périmètre d'observation</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('3G')}
                className={`px-4 py-2 rounded-lg border text-sm ${mode === '3G' ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-transparent' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
              >3G</button>
              <button
                onClick={() => setMode('5G')}
                className={`px-4 py-2 rounded-lg border text-sm ${mode === '5G' ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-transparent' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
              >5G</button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleKeys.map((key) => {
              const it = items[key];
              return (
                <div key={key} className="bg-white/80 rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 px-4 py-3 border-b border-red-200">
                    <div className="font-bold text-gray-900">{it.title} <span className="text-gray-500 font-normal">— {it.subtitle}</span></div>
                    <div className="text-xs text-gray-600">{it.description}</div>
                  </div>
                  <div className="p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!it.verified} onChange={(e) => updateItem(key, { verified: e.target.checked })} />
                      <span>Vérifié sur le terrain</span>
                    </label>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Constats / Observations</label>
                      <textarea
                        value={it.notes || ''}
                        onChange={(e) => updateItem(key, { notes: e.target.value })}
                        rows={5}
                        placeholder="Faits observés, preuves, écarts aux standards, éléments clés..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 bg-white/90"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conclusion / Synthèse */}
          <div className="bg-white/80 rounded-2xl border border-gray-200 p-4">
            <div className="font-semibold text-gray-900 mb-2">Synthèse</div>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              rows={4}
              placeholder="Points saillants, zones à approfondir, hypothèses, prochaine étape..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 bg-white/90"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={save} className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 flex items-center gap-2 shadow">
              <Save className="w-4 h-4" /> Sauvegarder
            </button>
          </div>
        </div>

        {/* Help modal - style 5S */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">3G / 5G - Guide d'utilisation</h3>
                  <button onClick={() => setShowHelp(false)} className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
                      <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                        <Search className="w-5 h-5 mr-2" /> Principe 3G / 5G
                      </h4>
                      <p className="text-red-700 text-sm">
                        Cadrez une observation factuelle du problème: allez au <b>Gemba</b> (lieu),
                        examinez le <b>Genbutsu</b> (objet) et collectez le <b>Genjitsu</b> (faits). En 5G,
                        complétez par <b>Genri</b> (principes) et <b>Gensoku</b> (standards).
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                      <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                        <List className="w-5 h-5 mr-2" /> Les 3G
                      </h4>
                      <ul className="text-purple-700 space-y-2 text-sm">
                        <li><b>Gemba</b> — Lieu réel: voir la réalité sur le terrain.</li>
                        <li><b>Genbutsu</b> — Objet réel: pièce/document réellement concerné.</li>
                        <li><b>Genjitsu</b> — Faits réels: données objectives, horodatées, mesurées.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-indigo-200">
                      <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" /> Les compléments 5G
                      </h4>
                      <ul className="text-indigo-700 space-y-2 text-sm">
                        <li><b>Genri</b> — Principes/lois du procédé (physique, qualité, process).</li>
                        <li><b>Gensoku</b> — Standards/règles: comparer aux référentiels en vigueur.</li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-amber-200">
                      <h4 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Conseils pratiques
                      </h4>
                      <ul className="text-amber-700 space-y-2 text-sm">
                        <li>Écrivez des faits vérifiables, pas des opinions.</li>
                        <li>Ajoutez photos/mesures/horodatages pour objectiver.</li>
                        <li>Concluez par une synthèse claire et des points ouverts.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                <button onClick={() => setShowHelp(false)} className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium">Compris !</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
