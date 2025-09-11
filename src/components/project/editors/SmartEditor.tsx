import React, { useMemo, useState } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { Target, HelpCircle, X, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface SmartEditorProps {
  module: A3Module;
  onClose: () => void;
}

type SmartContent = {
  // Legacy free-texts
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  time_bound?: string;
  kpis?: string;

  // Guided fields
  s_who?: string;
  s_what?: string;
  s_where?: string;
  s_why?: string;

  m_kpi?: string;
  m_unit?: string;
  m_baseline?: string;
  m_target?: string;
  m_method?: string;
  m_review?: 'Hebdomadaire' | 'Quinzomadaire' | 'Mensuel' | '';

  a_feasible?: boolean;
  a_resources?: boolean;
  a_constraints?: string;

  r_alignment?: string[]; // ex: ['Sécurité','Qualité']
  r_benefits?: string;

  t_start?: string;   // YYYY-MM-DD
  t_deadline?: string; // YYYY-MM-DD
  t_cadence?: 'Hebdomadaire' | 'Quinzomadaire' | 'Mensuel' | '';
};

export const SmartEditor: React.FC<SmartEditorProps> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);

  const initial: SmartContent = module.content || {};
  const [form, setForm] = useState<SmartContent>({
    specific: initial.specific || '',
    measurable: initial.measurable || '',
    achievable: initial.achievable || '',
    relevant: initial.relevant || '',
    time_bound: initial.time_bound || '',
    kpis: initial.kpis || '',

    s_who: initial.s_who || '',
    s_what: initial.s_what || '',
    s_where: initial.s_where || '',
    s_why: initial.s_why || '',

    m_kpi: initial.m_kpi || '',
    m_unit: initial.m_unit || '',
    m_baseline: initial.m_baseline || '',
    m_target: initial.m_target || '',
    m_method: initial.m_method || '',
    m_review: initial.m_review || '',

    a_feasible: initial.a_feasible || false,
    a_resources: initial.a_resources || false,
    a_constraints: initial.a_constraints || '',

    r_alignment: initial.r_alignment || [],
    r_benefits: initial.r_benefits || '',

    t_start: initial.t_start || '',
    t_deadline: initial.t_deadline || '',
    t_cadence: initial.t_cadence || ''
  });

  const saveField = (updates: Partial<SmartContent>) => {
    updateA3Module(module.id, { content: { ...(module.content || {}), ...updates } });
  };

  const completion = useMemo(() => {
    const sDone = !!(form.s_what && form.s_why);
    const mDone = !!(form.m_kpi && form.m_target);
    const aDone = !!(form.a_feasible || (form.a_constraints && form.a_constraints.trim().length > 0));
    const rDone = !!(form.r_alignment && form.r_alignment.length > 0);
    const tDone = !!(form.t_deadline || (form.time_bound && form.time_bound.trim().length > 0));
    const done = [sDone, mDone, aDone, rDone, tDone].filter(Boolean).length;
    return Math.round((done / 5) * 100);
  }, [form]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
          {/* Header dégradé */}
          <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center relative">
                  <Target className="w-6 h-6 text-white" />
                  <ArrowUpRight className="w-4 h-4 text-white absolute right-1.5 top-1.5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Objectif SMART</h2>
                  <p className="text-white/80 text-sm">Définir un objectif clair, mesurable et temporel</p>
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

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Progress */}
            <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Complétion SMART</span>
                <span className="text-sm font-semibold text-gray-900">{completion}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" style={{ width: `${completion}%` }} />
              </div>
            </div>

            {/* SMART fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* S */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-sm">
                <div className="px-5 py-3 rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center font-bold">S</div>
                    <div>
                      <div className="text-sm font-semibold">Spécifique</div>
                      <div className="text-xs text-white/80">Décrire précisément l'objectif</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Qui</label>
                      <input
                        type="text"
                        value={form.s_who || ''}
                        onChange={(e) => setForm(f => ({ ...f, s_who: e.target.value }))}
                        onBlur={() => saveField({ s_who: form.s_who })}
                        placeholder="Equipe, service, poste..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Où</label>
                      <input
                        type="text"
                        value={form.s_where || ''}
                        onChange={(e) => setForm(f => ({ ...f, s_where: e.target.value }))}
                        onBlur={() => saveField({ s_where: form.s_where })}
                        placeholder="Atelier, ligne, zone..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quoi</label>
                      <input
                        type="text"
                        value={form.s_what || ''}
                        onChange={(e) => setForm(f => ({ ...f, s_what: e.target.value }))}
                        onBlur={() => saveField({ s_what: form.s_what })}
                        placeholder="Décrivez précisément le résultat attendu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pourquoi</label>
                      <input
                        type="text"
                        value={form.s_why || ''}
                        onChange={(e) => setForm(f => ({ ...f, s_why: e.target.value }))}
                        onBlur={() => saveField({ s_why: form.s_why })}
                        placeholder="Raison / problème adressé"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* M */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 shadow-sm">
                <div className="px-5 py-3 rounded-t-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center font-bold">M</div>
                    <div>
                      <div className="text-sm font-semibold">Mesurable</div>
                      <div className="text-xs text-white/80">Indicateurs et seuils</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Indicateur (KPI)</label>
                      <input
                        type="text"
                        value={form.m_kpi || ''}
                        onChange={(e) => setForm(f => ({ ...f, m_kpi: e.target.value }))}
                        onBlur={() => saveField({ m_kpi: form.m_kpi })}
                        placeholder="Ex: Taux de rebut, TRS, Délai de cycle"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unité</label>
                      <input
                        type="text"
                        value={form.m_unit || ''}
                        onChange={(e) => setForm(f => ({ ...f, m_unit: e.target.value }))}
                        onBlur={() => saveField({ m_unit: form.m_unit })}
                        placeholder="%, sec, pcs..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Baseline</label>
                      <input
                        type="text"
                        value={form.m_baseline || ''}
                        onChange={(e) => setForm(f => ({ ...f, m_baseline: e.target.value }))}
                        onBlur={() => saveField({ m_baseline: form.m_baseline })}
                        placeholder="Ex: 3%"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cible</label>
                      <input
                        type="text"
                        value={form.m_target || ''}
                        onChange={(e) => setForm(f => ({ ...f, m_target: e.target.value }))}
                        onBlur={() => saveField({ m_target: form.m_target })}
                        placeholder="Ex: 1%"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Méthode de mesure</label>
                      <input
                        type="text"
                        value={form.m_method || ''}
                        onChange={(e) => setForm(f => ({ ...f, m_method: e.target.value }))}
                        onBlur={() => saveField({ m_method: form.m_method })}
                        placeholder="Comment et par qui la mesure est réalisée"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Revue</label>
                      <select
                        value={form.m_review || ''}
                        onChange={(e) => { const v=e.target.value as SmartContent['m_review']; setForm(f=>({...f,m_review:v})); saveField({ m_review: v }); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white/80"
                      >
                        <option value="">Choisir</option>
                        <option>Hebdomadaire</option>
                        <option>Quinzomadaire</option>
                        <option>Mensuel</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* A */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-sm">
                <div className="px-5 py-3 rounded-t-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center font-bold">A</div>
                    <div>
                      <div className="text-sm font-semibold">Atteignable</div>
                      <div className="text-xs text-white/80">Ressources et plan réaliste</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!form.a_feasible}
                        onChange={(e) => { const v=e.target.checked; setForm(f=>({...f,a_feasible:v})); saveField({ a_feasible: v }); }}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      Objectif atteignable
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!form.a_resources}
                        onChange={(e) => { const v=e.target.checked; setForm(f=>({...f,a_resources:v})); saveField({ a_resources: v }); }}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      Ressources disponibles
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contraintes / risques</label>
                    <textarea
                      value={form.a_constraints || ''}
                      onChange={(e) => setForm(f => ({ ...f, a_constraints: e.target.value }))}
                      onBlur={() => saveField({ a_constraints: form.a_constraints })}
                      placeholder="Listez les principales contraintes, risques, dépendances..."
                      className="w-full min-h-[90px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white/80"
                    />
                  </div>
                </div>
              </div>

              {/* R */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-200/50 shadow-sm">
                <div className="px-5 py-3 rounded-t-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center font-bold">R</div>
                    <div>
                      <div className="text-sm font-semibold">Pertinent</div>
                      <div className="text-xs text-white/80">Alignement et bénéfices</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Alignement (SQCDM)</label>
                    <div className="flex flex-wrap gap-2">
                      {['Sécurité','Qualité','Coûts','Délais','Morale'].map(tag => {
                        const active = form.r_alignment?.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              let next = new Set(form.r_alignment || []);
                              if (active) next.delete(tag); else next.add(tag);
                              const arr = Array.from(next);
                              setForm(f=>({...f, r_alignment: arr}));
                              saveField({ r_alignment: arr });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${active ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bénéfices attendus</label>
                    <textarea
                      value={form.r_benefits || ''}
                      onChange={(e) => setForm(f => ({ ...f, r_benefits: e.target.value }))}
                      onBlur={() => saveField({ r_benefits: form.r_benefits })}
                      placeholder="Impact attendu (sécurité, qualité, coûts, délais, morale)"
                      className="w-full min-h-[90px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white/80"
                    />
                  </div>
                </div>
              </div>

              {/* T */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-200/50 shadow-sm lg:col-span-2">
                <div className="px-5 py-3 rounded-t-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center font-bold">T</div>
                    <div>
                      <div className="text-sm font-semibold">Temporel</div>
                      <div className="text-xs text-white/80">Délais, jalons et fenêtre temporelle</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date de début</label>
                      <input
                        type="date"
                        value={form.t_start || ''}
                        onChange={(e) => { const v=e.target.value; setForm(f=>({...f,t_start:v})); saveField({ t_start: v }); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date cible</label>
                      <input
                        type="date"
                        value={form.t_deadline || ''}
                        onChange={(e) => { const v=e.target.value; setForm(f=>({...f,t_deadline:v})); saveField({ t_deadline: v }); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white/80"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cadence de suivi</label>
                      <select
                        value={form.t_cadence || ''}
                        onChange={(e) => { const v=e.target.value as SmartContent['t_cadence']; setForm(f=>({...f,t_cadence:v})); saveField({ t_cadence: v }); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white/80"
                      >
                        <option value="">Choisir</option>
                        <option>Hebdomadaire</option>
                        <option>Quinzomadaire</option>
                        <option>Mensuel</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Détails temporels</label>
                      <textarea
                        value={form.time_bound || ''}
                        onChange={(e) => setForm(f => ({ ...f, time_bound: e.target.value }))}
                        onBlur={() => saveField({ time_bound: form.time_bound })}
                        placeholder="Jalons, période, modalités de revue..."
                        className="w-full min-h-[90px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white/80"
                      />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 mr-2" />
                    Conseil: reliez cet objectif au Plan d'Actions
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer intentionally removed (help icon already in header) */}
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Objectif SMART - Guide d'utilisation</h3>
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
                    <h4 className="text-lg font-semibold text-teal-800 mb-3">Qu'est-ce que SMART ?</h4>
                    <ul className="text-teal-700 text-sm space-y-2">
                      <li><strong>S — Spécifique :</strong> clair et précis, sans ambiguïté.</li>
                      <li><strong>M — Mesurable :</strong> associé à des indicateurs concrets.</li>
                      <li><strong>A — Atteignable :</strong> réaliste avec les ressources disponibles.</li>
                      <li><strong>R — Pertinent :</strong> aligné avec les priorités de l'entreprise.</li>
                      <li><strong>T — Temporel :</strong> défini dans le temps avec une échéance.</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">Exemple d'objectif</h4>
                    <p className="text-blue-700 text-sm">Réduire le taux de rebut de <strong>3% à 1%</strong> d'ici <strong>le 30/11</strong> sur la ligne X.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                    <h4 className="text-lg font-semibold text-yellow-800 mb-3">Indicateurs utiles</h4>
                    <ul className="text-yellow-700 text-sm space-y-2 list-disc list-inside">
                      <li>Taux de rebut (%)</li>
                      <li>TRS / OEE (%)</li>
                      <li>Nombre d'incidents qualité</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-3">Conseils</h4>
                    <ul className="text-green-700 text-sm space-y-2 list-disc list-inside">
                      <li>Renseignez un objectif <strong>clair et mesurable</strong>.</li>
                      <li>Reliez l'objectif à un <strong>Plan d'Actions</strong>.</li>
                      <li>Suivez vos <strong>KPIs</strong> pour piloter la progression.</li>
                    </ul>
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
    </>
  );
};
