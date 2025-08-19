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
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden border border-white/20">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Network className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Analyse des 5 Pourquoi</h1>
                <p className="text-white/80 text-sm">Identification des causes racines</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Aide"
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Fermer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Zone de contenu avec dégradé subtle */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50">
          {/* Bouton d'ajout stylisé */}
          <div className="p-6 border-b border-gray-200/50">
            <button
              onClick={addProblem}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Ajouter un nouveau problème</span>
            </button>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {problems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Network className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune analyse en cours</h3>
                <p className="text-gray-500 mb-8">Commencez par ajouter un problème à analyser</p>
                <button
                  onClick={addProblem}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Créer ma première analyse
                </button>
              </div>
            ) : (
              <div className="space-y-8 pt-6">
                {problems.map((problem, problemIndex) => (
                  <div 
                    key={problem.id} 
                    className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Header de l'analyse avec style */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Analyse #{problemIndex + 1}
                        {problem.problem && `: ${problem.problem.substring(0, 50)}${problem.problem.length > 50 ? '...' : ''}`}
                      </h3>
                      <button
                        onClick={() => deleteProblem(problem.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        Supprimer
                      </button>
                    </div>

                    {/* Flux horizontal avec style amélioré */}
                    <div className="overflow-x-auto">
                      <div className="flex items-start space-x-4 min-w-max pb-4">
                        {/* Problème avec nouveau style */}
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-4 rounded-xl shadow-lg w-64">
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
                        
                        {problem.whys.map((why, whyIndex) => {
                          const isVisible = whyIndex <= problem.expandedLevel;
                          const isLastVisible = whyIndex === problem.expandedLevel;
                          
                          if (problem.intermediateCause && whyIndex >= problem.intermediateCause.level -1) return null;
                          if (!isVisible) return null;

                          return (
                            <React.Fragment key={whyIndex}>
                              <ChevronRight className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-16" />
                              
                              <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg w-64">
                                  <label className="block text-sm font-bold text-white mb-3 flex items-center">
                                    <Network className="w-4 h-4 mr-2" />
                                    POURQUOI {whyIndex + 1} ?
                                  </label>
                                  <textarea
                                    value={why}
                                    onChange={(e) => updateWhy(problem.id, whyIndex, e.target.value)}
                                    className="w-full h-24 text-sm bg-white/90 backdrop-blur-sm border-0 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
                                    placeholder={`Répondez au pourquoi ${whyIndex + 1}...`}
                                  />
                                </div>
                                {!problem.intermediateCause && (
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
                        
                        {/* Cause racine finale avec style */}
                        {(problem.whys[4] || problem.intermediateCause) && (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'aide avec style moderne */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-8 z-[60]">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20">
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
            
            <div className="p-8 overflow-y-auto max-h-[70vh]">
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
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Objectifs</h4>
                    <ul className="text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Éviter de traiter seulement les symptômes
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Identifier les causes profondes
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Mettre en place des solutions durables
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Comment procéder</h4>
                    <ol className="text-gray-600 space-y-3">
                      <li className="flex items-start">
                        <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                        <span><strong>Définir le problème</strong> clairement et précisément</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                        <span><strong>Demander "Pourquoi ?"</strong> ce problème se produit</span>
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
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  <strong>Note :</strong> Le nombre "5" est indicatif. Vous pouvez avoir besoin de 3 à 7 questions selon la complexité du problème.
                  L'important est d'arriver à une cause racine que vous pouvez traiter efficacement.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
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