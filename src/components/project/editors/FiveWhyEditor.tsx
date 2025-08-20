// src/components/project/editors/FiveWhyEditor.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { Plus, HelpCircle, ChevronRight, X, Network, Flag, RotateCcw } from 'lucide-react';

interface FiveWhyEditorProps {
  module: A3Module;
  onClose: () => void;
}

interface Problem {
  id: string;
  problem: string;
  whys: string[];
  rootCause: string;
  expandedLevel: number;
  intermediateCause: { level: number; text: string } | null;
}

export const FiveWhyEditor: React.FC<FiveWhyEditorProps> = ({ module, onClose }) => {
  const { updateA3Module, getFiveWhyAnalyses, createFiveWhyAnalysis, updateFiveWhyAnalysis, deleteFiveWhyAnalysis } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Refs pour le debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');

  // CHARGEMENT INITIAL - une seule fois
  useEffect(() => {
    if (!isLoaded) {
      const loadProblems = () => {
        const dbAnalyses = getFiveWhyAnalyses(module.id);
        const convertedProblems: Problem[] = dbAnalyses.map(analysis => ({
          id: analysis.id,
          problem: analysis.problem_title,
          whys: [
            analysis.why_1 || '',
            analysis.why_2 || '',
            analysis.why_3 || '',
            analysis.why_4 || '',
            analysis.why_5 || ''
          ],
          rootCause: analysis.root_cause || '',
          expandedLevel: analysis.intermediate_cause_level ? analysis.intermediate_cause_level - 1 : 
                       analysis.why_5 ? 4 :
                       analysis.why_4 ? 3 :
                       analysis.why_3 ? 2 :
                       analysis.why_2 ? 1 : 0,
          intermediateCause: analysis.intermediate_cause ? {
            level: analysis.intermediate_cause_level || 1,
            text: analysis.intermediate_cause
          } : null
        }));
        setProblems(convertedProblems);
        setIsLoaded(true);
      };

      loadProblems();
    }
  }, [module.id, getFiveWhyAnalyses, isLoaded]);

  // SAUVEGARDE OPTIMISÉE avec debouncing
  const debouncedSave = useCallback(async (problemsToSave: Problem[]) => {
    const currentDataString = JSON.stringify(problemsToSave);
    
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        updateA3Module(module.id, {
          content: { ...module.content, problems: problemsToSave }
        });

        for (const problem of problemsToSave) {
          await updateFiveWhyAnalysis(problem.id, {
            problem_title: problem.problem,
            why_1: problem.whys[0] || null,
            why_2: problem.whys[1] || null,
            why_3: problem.whys[2] || null,
            why_4: problem.whys[3] || null,
            why_5: problem.whys[4] || null,
            root_cause: problem.rootCause || null,
            intermediate_cause: problem.intermediateCause?.text || null,
            intermediate_cause_level: problem.intermediateCause?.level || null
          });
        }
        
        lastSavedDataRef.current = currentDataString;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }, 1000);
  }, [updateA3Module, updateFiveWhyAnalysis, module.content, module.id]);

  const updateProblems = useCallback((newProblems: Problem[]) => {
    setProblems(newProblems);
    debouncedSave(newProblems);
  }, [debouncedSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const addProblem = async () => {
    try {
      const analysisId = await createFiveWhyAnalysis(module.id, '');
      
      const newProblem: Problem = {
        id: analysisId,
        problem: '',
        whys: ['', '', '', '', ''],
        rootCause: '',
        expandedLevel: 0,
        intermediateCause: null
      };
      
      const newProblems = [...problems, newProblem];
      setProblems(newProblems);
      
      updateA3Module(module.id, {
        content: { ...module.content, problems: newProblems }
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  const updateProblemField = useCallback((problemId: string, field: keyof Problem, value: any) => {
    const updatedProblems = problems.map(p => 
      p.id === problemId ? { ...p, [field]: value } : p
    );
    updateProblems(updatedProblems);
  }, [problems, updateProblems]);

  const updateWhy = useCallback((problemId: string, whyIndex: number, value: string) => {
    const updatedProblems = problems.map(p => {
      if (p.id === problemId) {
        const newWhys = [...p.whys];
        newWhys[whyIndex] = value;
        return { ...p, whys: newWhys };
      }
      return p;
    });
    updateProblems(updatedProblems);
  }, [problems, updateProblems]);
  
  const setIntermediateCause = useCallback((problemId: string, level: number) => {
    const updatedProblems = problems.map(p => {
      if (p.id === problemId) {
        const causeText = p.whys[level - 1] || '';
        return { ...p, intermediateCause: { level, text: causeText } };
      }
      return p;
    });
    updateProblems(updatedProblems);
  }, [problems, updateProblems]);

  const updateIntermediateCauseText = useCallback((problemId: string, text: string) => {
    const updatedProblems = problems.map(p =>
      p.id === problemId && p.intermediateCause ?
        { ...p, intermediateCause: { ...p.intermediateCause, text } } : p
    );
    updateProblems(updatedProblems);
  }, [problems, updateProblems]);

  const clearIntermediateCause = useCallback((problemId: string) => {
    updateProblemField(problemId, 'intermediateCause', null);
  }, [updateProblemField]);

  const expandToLevel = useCallback((problemId: string, level: number) => {
    updateProblemField(problemId, 'expandedLevel', level);
  }, [updateProblemField]);

  const deleteProblem = async (problemId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette analyse ?')) {
      try {
        await deleteFiveWhyAnalysis(problemId);
        const newProblems = problems.filter(p => p.id !== problemId);
        setProblems(newProblems);
        
        updateA3Module(module.id, {
          content: { ...module.content, problems: newProblems }
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-700">Chargement des analyses...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Analyse 5 Pourquoi</h2>
                <p className="text-white/80 text-sm">Identifiez les causes racines de vos problèmes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 group"
                title="Aide"
              >
                <HelpCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Zone de contenu principal avec scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Bouton d'ajout de problème */}
            <div className="flex justify-center">
              <button
                onClick={addProblem}
                className="flex items-center space-x-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Nouvelle analyse</span>
              </button>
            </div>

            {/* Liste des analyses */}
            <div className="space-y-8">
              {problems.length === 0 ? (
                <div className="text-center py-16">
                  <Network className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Aucune analyse 5 Pourquoi</h3>
                  <p className="text-gray-400">Commencez par créer votre première analyse pour identifier les causes racines.</p>
                </div>
              ) : (
                problems.map((problem, problemIndex) => (
                  <div key={problem.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">
                        Analyse #{problemIndex + 1}
                      </h3>
                      <button
                        onClick={() => deleteProblem(problem.id)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-all text-red-600 hover:text-red-700"
                        title="Supprimer cette analyse"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Définition du problème */}
                    <div className="mb-8">
                      <div className="bg-gradient-to-br from-red-500 to-pink-600 p-4 rounded-xl shadow-lg">
                        <label className="block text-sm font-bold text-white mb-3 flex items-center">
                          <Flag className="w-4 h-4 mr-2" />
                          PROBLÈME
                        </label>
                        <textarea
                          value={problem.problem}
                          onChange={(e) => updateProblemField(problem.id, 'problem', e.target.value)}
                          className="w-full h-24 text-sm bg-white/90 backdrop-blur-sm border-0 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
                          placeholder="Décrivez clairement le problème à analyser..."
                        />
                      </div>
                    </div>

                    {/* Séquence des pourquoi avec style amélioré */}
                    <div className="relative">
                      <div className="flex items-start space-x-4 overflow-x-auto pb-4">
                        {/* Problème de départ */}
                        <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-4 rounded-xl shadow-lg w-64">
                            <div className="text-sm font-bold text-white mb-2 text-center">PROBLÈME</div>
                            <div className="text-sm text-white/90 line-clamp-3 text-center">
                              {problem.problem || 'Définissez votre problème...'}
                            </div>
                          </div>
                        </div>

                        {/* Chaîne des pourquoi */}
                        {problem.whys.map((why, whyIndex) => {
                          const isVisible = whyIndex <= problem.expandedLevel;
                          const isLastVisible = whyIndex === problem.expandedLevel;
                          
                          if (!isVisible) return null;

                          return (
                            <React.Fragment key={whyIndex}>
                              <ChevronRight className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-16" />
                              <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg w-64">
                                  <label className="block text-sm font-bold text-white mb-3 flex items-center justify-center">
                                    <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                                      {whyIndex + 1}
                                    </span>
                                    POURQUOI {whyIndex + 1} ?
                                  </label>
                                  <textarea
                                    value={why}
                                    onChange={(e) => updateWhy(problem.id, whyIndex, e.target.value)}
                                    className="w-full h-24 text-sm bg-white/90 backdrop-blur-sm border-0 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
                                    placeholder={`Répondez au pourquoi ${whyIndex + 1}...`}
                                  />
                                </div>
                                {!problem.intermediateCause && whyIndex < 4 && (
                                  <button 
                                    onClick={() => setIntermediateCause(problem.id, whyIndex + 1)}
                                    className="flex items-center space-x-2 text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors px-3 py-1 rounded-lg hover:bg-orange-100"
                                  >
                                    <Flag className="w-3 h-3"/>
                                    <span>Définir comme cause</span>
                                  </button>
                                )}
                              </div>

                              {isLastVisible && whyIndex < 4 && !problem.intermediateCause && (
                                <button
                                  onClick={() => expandToLevel(problem.id, whyIndex + 1)}
                                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 mt-16"
                                  title="Ajouter le pourquoi suivant"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              )}
                            </React.Fragment>
                          );
                        })}
                        
                        {problem.intermediateCause && (
                          <>
                            <ChevronRight className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-16" />
                            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                              <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg w-64">
                                <label className="block text-sm font-bold text-white mb-3 flex items-center">
                                  <Flag className="w-4 h-4 mr-2" />
                                  CAUSE IDENTIFIÉE
                                </label>
                                <textarea
                                  value={problem.intermediateCause.text}
                                  onChange={(e) => updateIntermediateCauseText(problem.id, e.target.value)}
                                  className="w-full h-24 text-sm bg-white/90 backdrop-blur-sm border-0 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
                                  placeholder="Décrivez la cause identifiée..."
                                />
                              </div>
                              <button 
                                onClick={() => clearIntermediateCause(problem.id)}
                                className="flex items-center space-x-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
                              >
                                <RotateCcw className="w-3 h-3"/>
                                <span>Continuer l'analyse</span>
                              </button>
                            </div>
                          </>
                        )}
                        
                        {/* Cause racine finale - SEULEMENT si pourquoi 5 ET pas de cause intermédiaire */}
                        {(problem.whys[4] && !problem.intermediateCause) && (
                          <>
                            <ChevronRight className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-16" />
                            <div className="flex-shrink-0">
                              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg w-64">
                                <label className="block text-sm font-bold text-white mb-3 flex items-center">
                                  <Flag className="w-4 h-4 mr-2" />
                                  CAUSE RACINE
                                </label>
                                <textarea
                                  value={problem.rootCause}
                                  onChange={(e) => updateProblemField(problem.id, 'rootCause', e.target.value)}
                                  className="w-full h-24 text-sm bg-white/90 backdrop-blur-sm border-0 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
                                  placeholder="Identifiez la cause racine principale..."
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal d'aide avec style moderne */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Méthode des 5 Pourquoi</h3>
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
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Network className="w-5 h-5 mr-2 text-indigo-600" />
                        Principe
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        La méthode des 5 Pourquoi est un outil d'analyse des causes racines qui permet 
                        d'identifier la cause profonde d'un problème en se demandant "Pourquoi ?" de manière successive.
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Étapes de l'analyse</h4>
                      <ol className="space-y-3 text-gray-600">
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                          <span><strong>Définir clairement</strong> le problème à résoudre</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                          <span><strong>Se demander pourquoi</strong> ce problème se produit</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                          <span><strong>Répéter la question</strong> pour chaque réponse obtenue</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                          <span><strong>Identifier la cause racine</strong> actionnable</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Conseils pratiques</h4>
                    <ul className="text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Restez factuel et objectif
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Impliquez l'équipe dans l'analyse
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Évitez les raccourcis et suppositions
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Une cause racine doit être actionnable
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    <strong>Note :</strong> Le nombre "5" est indicatif. Vous pouvez avoir besoin de 3 à 7 questions selon la complexité du problème.
                    L'important est d'arriver à une cause racine que vous pouvez traiter efficacement.
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Compris !
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};