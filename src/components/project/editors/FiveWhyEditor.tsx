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
    
    // Ne pas sauvegarder si les données n'ont pas changé
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }
    
    // Annuler la sauvegarde précédente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde dans 1 seconde
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Sauvegarde des 5 Pourquoi...');
        
        // Sauvegarder dans le content du module (pour compatibilité)
        updateA3Module(module.id, {
          content: { ...module.content, problems: problemsToSave }
        });

        // Sauvegarder chaque problème en base
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
        console.log('Sauvegarde terminée');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }, 1000); // Attendre 1 seconde après la dernière modification
  }, [updateA3Module, updateFiveWhyAnalysis, module.content, module.id]);

  // MODIFICATION des problèmes avec sauvegarde optimisée
  const updateProblems = useCallback((newProblems: Problem[]) => {
    setProblems(newProblems);
    debouncedSave(newProblems);
  }, [debouncedSave]);

  // Nettoyage au démontage
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
      
      // Sauvegarder immédiatement pour la création
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
        
        // Mettre à jour le content immédiatement pour la suppression
        updateA3Module(module.id, {
          content: { ...module.content, problems: newProblems }
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  // Affichage du loader pendant le chargement initial
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
        <div 
            className="bg-white rounded-2xl shadow-xl flex flex-col w-full h-full overflow-hidden"
        >
            <div 
            className="flex items-center justify-between p-6 border-b bg-white"
            style={{ flexGrow: 0, flexShrink: 0 }}
            >
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Network className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Analyse des 5 Pourquoi</h1>
            </div>
            <div className="flex items-center space-x-3">
                <button
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                title="Aide"
                >
                <HelpCircle className="w-5 h-5 text-gray-600" />
                </button>
                <button
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                title="Fermer"
                >
                <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>
            </div>

            <div 
            className="bg-gray-50"
            style={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflowY: 'auto',
                width: '100%'
            }}
            >
            <div 
                className="p-6 pb-4 bg-gray-50"
                style={{ flexShrink: 0 }}
            >
                <button
                onClick={addProblem}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Ajouter un nouveau problème</span>
                </button>
            </div>

            <div 
                className="px-6 pb-6"
                style={{ 
                flexGrow: 1,
                overflowY: 'auto',
                width: '100%'
                }}
            >
                <div className="space-y-8" style={{ width: '100%' }}>
                {problems.length === 0 ? (
                    <div 
                    className="text-center flex flex-col justify-center items-center"
                    style={{ height: '100%', minHeight: '400px' }}
                    >
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Network className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune analyse en cours</h3>
                    <p className="text-gray-500 mb-6">Commencez par ajouter un problème à analyser</p>
                    <button
                        onClick={addProblem}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Créer ma première analyse
                    </button>
                    </div>
                ) : (
                    problems.map((problem, problemIndex) => (
                    <div 
                        key={problem.id} 
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                        style={{ width: '100%' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                        <h3 
                          className="text-lg font-semibold text-gray-900 truncate"
                          title={`Analyse #${problemIndex + 1}${problem.problem ? `: ${problem.problem}` : ''}`}
                        >
                            {`Analyse #${problemIndex + 1}${problem.problem ? `: ${problem.problem}` : ''}`}
                        </h3>
                        <button
                            onClick={() => deleteProblem(problem.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                            Supprimer
                        </button>
                        </div>

                        <div 
                        className="overflow-x-auto"
                        style={{ width: '100%' }}
                        >
                        <div className="flex items-start space-x-4 min-w-max pb-4">
                            <div className="flex-shrink-0">
                            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 w-56">
                                <label className="block text-sm font-bold text-red-800 mb-3">
                                PROBLÈME
                                </label>
                                <textarea
                                value={problem.problem}
                                onChange={(e) => updateProblemField(problem.id, 'problem', e.target.value)}
                                className="w-full h-24 text-sm border border-red-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Décrivez clairement le problème à analyser..."
                                />
                            </div>
                            </div>
                            
                            {problem.whys.map((why, whyIndex) => {
                                const isVisible = whyIndex <= problem.expandedLevel;
                                const isLastVisible = whyIndex === problem.expandedLevel;
                                
                                // Ne rien afficher pour ce "Pourquoi" si une cause intermédiaire a été définie à un niveau inférieur ou égal
                                if (problem.intermediateCause && whyIndex >= problem.intermediateCause.level -1) return null;
                                if (!isVisible) return null;

                                return (
                                    <React.Fragment key={whyIndex}>
                                      {/* Affiche la flèche AVANT chaque boîte "Pourquoi" (sauf la première) */}
                                      {whyIndex >= 0 && <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0 mt-16" />}
                                      
                                      <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-56">
                                          <label className="block text-sm font-bold text-blue-800 mb-3">
                                              POURQUOI {whyIndex + 1} ?
                                          </label>
                                          <textarea
                                              value={why}
                                              onChange={(e) => updateWhy(problem.id, whyIndex, e.target.value)}
                                              className="w-full h-24 text-sm border border-blue-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              placeholder={`Répondez au pourquoi ${whyIndex + 1}...`}
                                          />
                                          </div>
                                          {!problem.intermediateCause && (
                                          <button 
                                              onClick={() => setIntermediateCause(problem.id, whyIndex + 1)}
                                              className="flex items-center space-x-2 text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors px-2 py-1 rounded-md hover:bg-orange-100"
                                          >
                                              <Flag className="w-3 h-3"/>
                                              <span>Définir comme cause</span>
                                          </button>
                                          )}
                                      </div>

                                      {isLastVisible && whyIndex < 4 && !problem.intermediateCause && (
                                          <button
                                             onClick={() => expandToLevel(problem.id, whyIndex + 1)}
                                              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors mt-16"
                                              title="Ajouter le pourquoi suivant"
                                          >
                                              <Plus className="w-4 h-4" />
                                          </button>
                                      )}
                                    </React.Fragment>
                                );
                            })}
                            
                            {problem.intermediateCause && (
                                <>
                                <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0 mt-16" />
                                <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                                    <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4 w-56">
                                        <label className="block text-sm font-bold text-orange-800 mb-3">
                                        CAUSE IDENTIFIÉE
                                        </label>
                                        <textarea
                                        value={problem.intermediateCause.text}
                                        onChange={(e) => updateIntermediateCauseText(problem.id, e.target.value)}
                                        className="w-full h-24 text-sm border border-orange-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Décrivez la cause identifiée..."
                                        />
                                    </div>
                                    <button 
                                        onClick={() => clearIntermediateCause(problem.id)}
                                        className="flex items-center space-x-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                                    >
                                        <RotateCcw className="w-3 h-3"/>
                                        <span>Continuer l'analyse</span>
                                    </button>
                                </div>
                                </>
                            )}
                            
                            {/* Cause racine finale */}
                            {(problem.whys[4] || problem.intermediateCause) && (
                                <>
                                <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0 mt-16" />
                                <div className="flex-shrink-0">
                                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 w-56">
                                    <label className="block text-sm font-bold text-green-800 mb-3">
                                        CAUSE RACINE
                                    </label>
                                    <textarea
                                        value={problem.rootCause}
                                        onChange={(e) => updateProblemField(problem.id, 'rootCause', e.target.value)}
                                        className="w-full h-24 text-sm border border-green-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
        </div>

        {/* Modal d'aide */}
        {showHelp && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-8 z-[60]">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Méthode des 5 Pourquoi</h3>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                        <Network className="w-5 h-5 mr-2 text-purple-600" />
                                        Principe
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        La méthode des 5 Pourquoi est un outil d'analyse des causes racines qui permet 
                                        d'identifier la cause profonde d'un problème en se demandant "Pourquoi ?" de manière successive.
                                    </p>
                                </div>
                                
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Objectifs</h4>
                                    <ul className="text-gray-600 space-y-2">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Éviter de traiter seulement les symptômes
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Identifier les causes profondes
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Mettre en place des solutions durables
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Comment procéder</h4>
                                    <ol className="text-gray-600 space-y-3">
                                        <li className="flex items-start">
                                            <span className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                                            <span><strong>Définir le problème</strong> clairement et précisément</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                                            <span><strong>Demander "Pourquoi ?"</strong> ce problème se produit</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                                            <span><strong>Répéter la question</strong> pour chaque réponse obtenue</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                                            <span><strong>Identifier la cause racine</strong> actionnable</span>
                                        </li>
                                    </ol>
                                </div>
                                
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Conseils pratiques</h4>
                                    <ul className="text-gray-600 space-y-2">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Restez factuel et objectif
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Impliquez l'équipe dans l'analyse
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Évitez les raccourcis et suppositions
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                            Une cause racine doit être actionnable
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Note :</strong> Le nombre "5" est indicatif. Vous pouvez avoir besoin de 3 à 7 questions selon la complexité du problème.
                                L'important est d'arriver à une cause racine que vous pouvez traiter efficacement.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};