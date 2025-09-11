import React, { useMemo, useState } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { Shield, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import { TWTTPHelp } from './TWTTPHelp';

interface TWTTPEditorProps {
  module: A3Module;
  onClose: () => void;
}

type TWTTPContent = {
  step?: string;                // Description de l'étape / activité
  potential_error?: string;     // Erreur potentielle
  consequence?: string;         // Conséquence de l'erreur
  herca?: 'H' | 'E' | 'R' | 'C' | 'A' | ''; // Cause dominante (HERCA)
  control?: 'Prévention' | 'Détection' | 'Correction' | ''; // Type de contrôle
  poka_yoke?: string;           // Idée de Poka‑Yoke / dispositif
  owner?: string;               // Responsable
  due_date?: string;            // YYYY-MM-DD
  status?: 'À faire' | 'En cours' | 'Fait' | ''; // Statut
  notes?: string;               // Notes complémentaires
};

export const TWTTPEditor: React.FC<TWTTPEditorProps> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const initial: TWTTPContent = module.content || {};

  const [form, setForm] = useState<TWTTPContent>({
    step: initial.step || '',
    potential_error: initial.potential_error || '',
    consequence: initial.consequence || '',
    herca: (initial.herca as TWTTPContent['herca']) || '',
    control: (initial.control as TWTTPContent['control']) || '',
    poka_yoke: initial.poka_yoke || '',
    owner: initial.owner || '',
    due_date: initial.due_date || '',
    status: (initial.status as TWTTPContent['status']) || '',
    notes: initial.notes || ''
  });

  const saveField = (updates: Partial<TWTTPContent>) => {
    updateA3Module(module.id, { content: { ...(module.content || {}), ...updates } });
  };

  const completion = useMemo(() => {
    const keys: (keyof TWTTPContent)[] = ['step', 'potential_error', 'consequence', 'herca', 'control', 'poka_yoke'];
    const done = keys.filter(k => {
      const v = form[k];
      return typeof v === 'string' ? v && v.trim().length > 0 : !!v;
    }).length;
    return Math.round((done / keys.length) * 100);
  }, [form]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white text-lg font-bold">TWTTP – Zéro erreur humaine</div>
            <div className="text-white/80 text-xs">Think What To Think Process (HERCA)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Le panneau d\'aide est disponible en bas de la page.')}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center"
            title="Aide"
          >
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center"
            title="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Progress */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Complétion</span>
            <span className="text-sm font-semibold text-gray-900">{completion}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${completion}%` }} />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Col 1 */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Étape / Activité</div>
              <textarea
                value={form.step}
                onChange={e => setForm(f => ({ ...f, step: e.target.value }))}
                onBlur={() => saveField({ step: form.step })}
                placeholder="Décrivez clairement l'activité réalisée"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Erreur potentielle</div>
              <textarea
                value={form.potential_error}
                onChange={e => setForm(f => ({ ...f, potential_error: e.target.value }))}
                onBlur={() => saveField({ potential_error: form.potential_error })}
                placeholder="Quelle erreur humaine peut survenir ?"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Conséquence</div>
              <textarea
                value={form.consequence}
                onChange={e => setForm(f => ({ ...f, consequence: e.target.value }))}
                onBlur={() => saveField({ consequence: form.consequence })}
                placeholder="Quel impact si l'erreur se produit ?"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">Cause dominante (HERCA)</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'H', label: 'H - Humain' },
                  { key: 'E', label: 'E - Environnement' },
                  { key: 'R', label: 'R - Règle/Procédure' },
                  { key: 'C', label: 'C - Communication' },
                  { key: 'A', label: 'A - Attention/Mémoire' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setForm(f => ({ ...f, herca: opt.key as TWTTPContent['herca'] })); saveField({ herca: opt.key as TWTTPContent['herca'] }); }}
                    className={`px-3 py-2 text-sm rounded-lg border transition ${form.herca === (opt.key as any)
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Type de contrôle</div>
              <div className="flex gap-2">
                {['Prévention', 'Détection', 'Correction'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setForm(f => ({ ...f, control: t as TWTTPContent['control'] })); saveField({ control: t as TWTTPContent['control'] }); }}
                    className={`px-3 py-2 text-sm rounded-lg border transition ${form.control === t
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Poka‑Yoke / Dispositif</div>
              <textarea
                value={form.poka_yoke}
                onChange={e => setForm(f => ({ ...f, poka_yoke: e.target.value }))}
                onBlur={() => saveField({ poka_yoke: form.poka_yoke })}
                placeholder="Décrivez le dispositif visuel/physique idéal"
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="text-sm font-semibold text-gray-800 mb-2">Responsable</div>
                <input
                  type="text"
                  value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  onBlur={() => saveField({ owner: form.owner })}
                  placeholder="Nom / équipe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="text-sm font-semibold text-gray-800 mb-2">Échéance</div>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  onBlur={() => saveField({ due_date: form.due_date })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="text-sm font-semibold text-gray-800 mb-2">Statut</div>
                <select
                  value={form.status}
                  onChange={e => { const v = e.target.value as TWTTPContent['status']; setForm(f => ({ ...f, status: v })); saveField({ status: v }); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">—</option>
                  <option>À faire</option>
                  <option>En cours</option>
                  <option>Fait</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Notes</div>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                onBlur={() => saveField({ notes: form.notes })}
                placeholder="Informations complémentaires, liens, références..."
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Help panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-blue-700" />
            <div className="text-sm font-semibold text-blue-800">Aide TWTTP</div>
          </div>
          <TWTTPHelp />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white flex items-center justify-between">
        <div className="text-sm text-gray-600">Les champs principaux remplis augmentent la complétion.</div>
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Sauvegarde automatique</span>
        </div>
      </div>
    </div>
  );
};

export default TWTTPEditor;

