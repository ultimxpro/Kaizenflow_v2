import React, { useState, useEffect, useMemo } from 'react';
import { FiveSChecklist, FiveSItem, FiveSCategory, FIVE_S_CATEGORIES_CONFIG } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { X, TrendingUp, BarChart3, PieChart, Calendar, Target, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface FiveSProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: FiveSChecklist | null;
  items: FiveSItem[];
}

interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionPercentage: number;
  categoriesBreakdown: { [key in FiveSCategory]: { total: number; completed: number; percentage: number } };
  weeklyProgress: { week: string; completed: number; total: number }[];
  estimatedCompletion: string;
}

export const FiveSProgressModal: React.FC<FiveSProgressModalProps> = ({
  isOpen,
  onClose,
  checklist,
  items
}) => {
  const { calculateFiveSProgress } = useDatabase();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculer les statistiques détaillées
  useEffect(() => {
    if (!checklist || !isOpen) return;

    const calculateStats = async () => {
      setLoading(true);
      try {
        const basicStats = await calculateFiveSProgress(checklist.id);

        // Calculer les statistiques détaillées
        const now = new Date();
        const overdueItems = items.filter(item =>
          item.due_date && new Date(item.due_date) < now && item.status !== 'completed'
        ).length;

        // Répartition par catégories
        const categoriesBreakdown: { [key in FiveSCategory]: { total: number; completed: number; percentage: number } } = {
          seiri: { total: 0, completed: 0, percentage: 0 },
          seiton: { total: 0, completed: 0, percentage: 0 },
          seiso: { total: 0, completed: 0, percentage: 0 },
          seiketsu: { total: 0, completed: 0, percentage: 0 },
          shitsuke: { total: 0, completed: 0, percentage: 0 }
        };

        items.forEach(item => {
          categoriesBreakdown[item.category].total++;
          if (item.status === 'completed') {
            categoriesBreakdown[item.category].completed++;
          }
        });

        // Calculer les pourcentages par catégorie
        Object.keys(categoriesBreakdown).forEach(category => {
          const cat = categoriesBreakdown[category as FiveSCategory];
          cat.percentage = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
        });

        // Progression hebdomadaire (simulation basée sur les dates de création)
        const weeklyProgress = generateWeeklyProgress(items);

        // Estimation de la date de fin
        const estimatedCompletion = calculateEstimatedCompletion(items);

        const detailedStats: ProgressStats = {
          total: basicStats.total_items,
          completed: basicStats.completed_items,
          inProgress: items.filter(i => i.status === 'in_progress').length,
          pending: items.filter(i => i.status === 'pending').length,
          overdue: overdueItems,
          completionPercentage: basicStats.completion_percentage,
          categoriesBreakdown,
          weeklyProgress,
          estimatedCompletion
        };

        setStats(detailedStats);
      } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [checklist, items, isOpen, calculateFiveSProgress]);

  // Générer la progression hebdomadaire
  const generateWeeklyProgress = (items: FiveSItem[]) => {
    const weeklyData: { [week: string]: { completed: number; total: number } } = {};
    const now = new Date();

    // Créer les 8 dernières semaines
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekKey = `S${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7))}`;

      weeklyData[weekKey] = { completed: 0, total: 0 };
    }

    // Compter les items par semaine
    items.forEach(item => {
      if (item.created_at) {
        const itemDate = new Date(item.created_at);
        const weekKey = `S${Math.ceil((itemDate.getTime() - new Date(itemDate.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7))}`;

        if (weeklyData[weekKey]) {
          weeklyData[weekKey].total++;
          if (item.status === 'completed') {
            weeklyData[weekKey].completed++;
          }
        }
      }
    });

    return Object.entries(weeklyData).map(([week, data]) => ({
      week,
      completed: data.completed,
      total: data.total
    }));
  };

  // Calculer la date d'achèvement estimée
  const calculateEstimatedCompletion = (items: FiveSItem[]): string => {
    const completedItems = items.filter(i => i.status === 'completed');
    const pendingItems = items.filter(i => i.status !== 'completed');

    if (completedItems.length === 0 || pendingItems.length === 0) {
      return 'Non calculable';
    }

    // Calculer la vitesse moyenne (items par jour)
    const firstCompletion = Math.min(...completedItems.map(i => new Date(i.completed_at || i.updated_at).getTime()));
    const lastCompletion = Math.max(...completedItems.map(i => new Date(i.completed_at || i.updated_at).getTime()));
    const daysElapsed = Math.max(1, (lastCompletion - firstCompletion) / (1000 * 60 * 60 * 24));
    const avgItemsPerDay = completedItems.length / daysElapsed;

    if (avgItemsPerDay === 0) return 'Non calculable';

    const daysRemaining = pendingItems.length / avgItemsPerDay;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);

    return estimatedDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen || !checklist || !stats) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Suivi de progression</h3>
                <p className="text-sm text-gray-600">{checklist.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Métriques principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Terminés</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% du total
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">En cours</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
                  <div className="text-xs text-blue-600 mt-1">Activement travaillés</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">En attente</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700">{stats.pending}</div>
                  <div className="text-xs text-orange-600 mt-1">À planifier</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-100 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">En retard</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
                  <div className="text-xs text-red-600 mt-1">Échéances dépassées</div>
                </div>
              </div>

              {/* Barre de progression principale */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Progression globale</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Avancement total</span>
                    <span className="font-semibold text-teal-600">{stats.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stats.completionPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{stats.completed} terminés</span>
                    <span>{stats.total - stats.completed} restants</span>
                  </div>
                </div>

                {/* Estimation de fin */}
                <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span className="font-medium text-teal-800">Achèvement estimé :</span>
                    <span className="text-teal-700">{stats.estimatedCompletion}</span>
                  </div>
                </div>
              </div>

              {/* Répartition par catégories */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Répartition par catégories 5S</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.categoriesBreakdown).map(([category, data]) => {
                    const config = FIVE_S_CATEGORIES_CONFIG[category as FiveSCategory];
                    return (
                      <div key={category} className="p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{config.icon}</span>
                          <span className="font-medium text-gray-900">{config.name}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progression</span>
                            <span className="font-semibold" style={{ color: config.color }}>
                              {data.completed}/{data.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${data.percentage}%`,
                                backgroundColor: config.color
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            {data.percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Graphique de progression hebdomadaire */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Évolution hebdomadaire</h4>
                <div className="space-y-3">
                  {stats.weeklyProgress.map((week, index) => (
                    <div key={week.week} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium text-gray-600">{week.week}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{week.completed} terminés</span>
                          <span>{week.total} créés</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: week.total > 0 ? `${(week.completed / week.total) * 100}%` : '0%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommandations */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recommandations
                </h4>
                <div className="space-y-3 text-sm text-blue-800">
                  {stats.overdue > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span><strong>{stats.overdue} items en retard :</strong> Priorisez les tâches dépassées pour maintenir le momentum.</span>
                    </div>
                  )}

                  {stats.completionPercentage < 30 && (
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Progression lente :</strong> Concentrez-vous sur les items à haute priorité pour accélérer l'avancement.</span>
                    </div>
                  )}

                  {stats.inProgress > stats.completed && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Équilibre à trouver :</strong> Finalisez les tâches en cours avant d'en commencer de nouvelles.</span>
                    </div>
                  )}

                  {stats.completionPercentage >= 80 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Excellent progrès !</strong> Continuez sur cette lancée pour finaliser la checklist.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};