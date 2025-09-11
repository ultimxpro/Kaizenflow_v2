import React, { useState, useEffect } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import {
  Target, Plus, X, HelpCircle, Settings, Calendar, Camera,
  CheckCircle2, XCircle, Clock, AlertTriangle, Eye,
  ChevronDown, ChevronUp, Edit2, Trash2, Upload, Zap,
  Shield, TrendingUp, DollarSign, Users, Wrench, Factory,
  ChevronLeft, ChevronRight, RotateCcw, Activity
} from 'lucide-react';

// Types pour le Kamishibai numérique
interface KamishibaiEntry {
  id: string;
  date: string;
  status: 'ok' | 'nok' | 'pending';
  value?: string;
  reason?: string;
  photo?: string;
  comment?: string;
  updatedBy?: string;
  // Champs spécifiques pour qualité/sécurité
  severity?: 'faible' | 'moyen' | 'elevé' | 'critique';
  correctiveAction?: string;
  // Champs spécifiques pour amélioration continue
  kaizenAction?: string;
  improvementIdea?: string;
}

interface KamishibaiIndicator {
  id: string;
  name: string;
  family: 'standards' | 'performance' | 'quality' | 'improvement';
  description: string;
  target?: string;
  unit?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'shift';
  entries: KamishibaiEntry[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface KamishibaiContent {
  indicators: KamishibaiIndicator[];
  selectedDate: string;
  viewMode: 'board' | 'history';
  selectedFamily?: string;
}

// Configuration des familles d'indicateurs
const INDICATOR_FAMILIES = {
  standards: {
    name: 'Respect des Standards',
    icon: CheckCircle2,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    description: 'Fait / Pas Fait - Vérification binaire des bases',
    examples: [
      'Tournée 5S du matin effectuée',
      'Check-list de démarrage machine remplie',
      'Point Top 5 de l\'équipe animé',
      'Maintenance préventive niveau 1 faite'
    ]
  },
  performance: {
    name: 'Performance Cible',
    icon: Target,
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    description: 'Atteint / Pas Atteint - Comparaison à un objectif chiffré',
    examples: [
      'Objectif production 8000 pièces atteint',
      'TRS > 85%',
      'Temps changement série < 20 min',
      'Expédier 100% commandes à l\'heure'
    ]
  },
  quality: {
    name: 'Qualité & Sécurité',
    icon: Shield,
    color: 'red',
    gradient: 'from-red-500 to-red-600',
    description: 'Zéro Problème - L\'état normal est OK',
    examples: [
      'Zéro accident de travail',
      'Zéro défaut qualité sur la ligne',
      'Zéro réclamation client',
      'Zéro arrêt machine > 5 min'
    ]
  },
  improvement: {
    name: 'Amélioration Continue',
    icon: TrendingUp,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    description: 'Progrès - Suivi de l\'activité Kaizen',
    examples: [
      'Une idée d\'amélioration proposée',
      'Problème de la veille analysé',
      'Action du plan clôturée',
      'Formation réalisée'
    ]
  }
};

export const IndicatorsEditor: React.FC<{ module: A3Module; onClose: () => void }> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // États principaux
  const [selectedEntry, setSelectedEntry] = useState<{ indicatorId: string; date: string } | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<KamishibaiIndicator | null>(null);
  const [newIndicatorFamily, setNewIndicatorFamily] = useState<string>('standards');
  const [newIndicatorFrequency, setNewIndicatorFrequency] = useState<string>('daily');
  
  // Navigation temporelle par fréquence
  const [timeOffsets, setTimeOffsets] = useState<Record<string, number>>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    shift: 0
  });
  
  // Données du formulaire d'entrée
  const [entryForm, setEntryForm] = useState({
    status: 'pending' as 'ok' | 'nok' | 'pending',
    value: '',
    reason: '',
    comment: '',
    photo: ''
  });

  // Initialisation des données
  const initializeContent = (): KamishibaiContent => {
    if (module.content?.indicators) {
      return module.content as KamishibaiContent;
    }
    return {
      indicators: [],
      selectedDate: new Date().toISOString().split('T')[0],
      viewMode: 'board'
    };
  };

  const [content, setContent] = useState<KamishibaiContent>(initializeContent());

  // Sauvegarder les modifications
  const saveContent = async (newContent: KamishibaiContent) => {
    setContent(newContent);
    await updateA3Module(module.id, { content: newContent });
  };

  // Générer les dates pour la matrice selon la fréquence avec offset temporel
  const getMatrixDates = (frequency: string = 'daily', offset: number = 0) => {
    const dates = [];
    const today = new Date();
    
    switch (frequency) {
      case 'daily':
        // 7 jours avec offset
        const baseDay = new Date(today);
        baseDay.setDate(today.getDate() + (offset * 7)); // Décalage par semaines
        for (let i = 6; i >= 0; i--) {
          const date = new Date(baseDay);
          date.setDate(baseDay.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
        
      case 'weekly':
        // 6 semaines avec offset
        const baseWeek = new Date(today);
        const dayOfWeek = baseWeek.getDay();
        const daysToMonday = (dayOfWeek + 6) % 7; // 0 = lundi
        baseWeek.setDate(today.getDate() - daysToMonday + (offset * 7 * 6)); // Décalage par périodes de 6 semaines
        for (let i = 5; i >= 0; i--) {
          const date = new Date(baseWeek);
          date.setDate(baseWeek.getDate() - (i * 7));
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
        
      case 'monthly':
        // 6 mois avec offset
        for (let i = 5; i >= 0; i--) {
          const date = new Date(today.getFullYear(), today.getMonth() - i + (offset * 6), 1);
          dates.push(date.toISOString().split('T')[0]);
        }
        break;
        
      case 'shift':
        // 14 postes avec offset
        const baseShift = new Date(today);
        baseShift.setDate(today.getDate() + (offset * 7)); // Décalage par semaines
        for (let i = 13; i >= 0; i--) {
          const date = new Date(baseShift);
          const shift = i % 2 === 0 ? 'Matin' : 'Soir';
          date.setDate(baseShift.getDate() - Math.floor(i / 2));
          dates.push(`${date.toISOString().split('T')[0]}-${shift}`);
        }
        break;
        
      default:
        // Par défaut : journalier avec offset
        const defaultBase = new Date(today);
        defaultBase.setDate(today.getDate() + (offset * 7));
        for (let i = 6; i >= 0; i--) {
          const date = new Date(defaultBase);
          date.setDate(defaultBase.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
    }
    
    return dates;
  };

  // Obtenir le statut pour une date donnée
  const getStatusForDate = (indicator: KamishibaiIndicator, date: string) => {
    return indicator.entries?.find(entry => entry.date === date);
  };
  
  // Formater l'affichage des dates selon la fréquence
  const formatDateDisplay = (date: string, frequency: string) => {
    if (frequency === 'shift' && date.includes('-')) {
      const [dateStr, shift] = date.split('-');
      const dateObj = new Date(dateStr);
      return {
        short: shift.substring(0, 1), // M ou S
        long: `${dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${shift}`
      };
    }
    
    const dateObj = new Date(date);
    
    switch (frequency) {
      case 'weekly':
        return {
          short: `S${getWeekNumber(dateObj)}`,
          long: `Semaine ${getWeekNumber(dateObj)}`
        };
      case 'monthly':
        return {
          short: dateObj.toLocaleDateString('fr-FR', { month: 'short' }),
          long: dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        };
      default: // daily
        return {
          short: dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }),
          long: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        };
    }
  };
  
  // Obtenir le numéro de semaine
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  // Fonctions de navigation temporelle
  const navigateTime = (frequency: string, direction: 'prev' | 'next') => {
    setTimeOffsets(prev => ({
      ...prev,
      [frequency]: prev[frequency] + (direction === 'next' ? 1 : -1)
    }));
  };
  
  const resetTimeOffset = (frequency: string) => {
    setTimeOffsets(prev => ({
      ...prev,
      [frequency]: 0
    }));
  };
  
  // Obtenir le libellé de la période courante
  const getCurrentPeriodLabel = (frequency: string, offset: number) => {
    const today = new Date();
    
    switch (frequency) {
      case 'daily':
        const baseDate = new Date(today);
        baseDate.setDate(today.getDate() + (offset * 7));
        if (offset === 0) return 'Cette semaine';
        if (offset === -1) return 'Semaine dernière';
        if (offset === 1) return 'Semaine prochaine';
        return baseDate.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short',
          year: baseDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
        
      case 'weekly':
        if (offset === 0) return 'Période actuelle';
        if (offset === -1) return 'Période précédente';
        if (offset === 1) return 'Période suivante';
        return `${Math.abs(offset)} période${Math.abs(offset) > 1 ? 's' : ''} ${offset > 0 ? 'dans le futur' : 'dans le passé'}`;
        
      case 'monthly':
        const baseMonth = new Date(today.getFullYear(), today.getMonth() + (offset * 6), 1);
        if (offset === 0) return 'Semestre actuel';
        if (offset === -1) return 'Semestre précédent';
        if (offset === 1) return 'Semestre suivant';
        return baseMonth.toLocaleDateString('fr-FR', { 
          month: 'long', 
          year: 'numeric' 
        });
        
      case 'shift':
        const baseShift = new Date(today);
        baseShift.setDate(today.getDate() + (offset * 7));
        if (offset === 0) return 'Cette semaine';
        if (offset === -1) return 'Semaine dernière';
        if (offset === 1) return 'Semaine prochaine';
        return baseShift.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        });
        
      default:
        return 'Période inconnue';
    }
  };

  // Obtenir la couleur de la cellule selon le statut
  const getCellColor = (entry: KamishibaiEntry | undefined) => {
    if (!entry || entry.status === 'pending') return 'bg-gray-100 border-gray-300';
    if (entry.status === 'ok') return 'bg-green-400 border-green-500';
    if (entry.status === 'nok') return 'bg-red-400 border-red-500';
    return 'bg-gray-100 border-gray-300';
  };

  // Obtenir la couleur spécifique selon la famille et le statut
  const getFamilyCellColor = (entry: KamishibaiEntry | undefined, family: string) => {
    if (!entry || entry.status === 'pending') return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    
    const familyConfig = INDICATOR_FAMILIES[family as keyof typeof INDICATOR_FAMILIES];
    const baseColor = familyConfig.color;
    
    if (entry.status === 'ok') {
      return `bg-${baseColor}-400 border-${baseColor}-500 shadow-${baseColor}-200 shadow-lg`;
    }
    if (entry.status === 'nok') {
      return 'bg-red-400 border-red-500 shadow-red-200 shadow-lg';
    }
    return 'bg-gray-100 border-gray-300';
  };

  // Obtenir le label OK spécifique à la famille
  const getFamilyOkLabel = (family: string) => {
    switch (family) {
      case 'standards': return 'Fait';
      case 'performance': return 'Atteint';
      case 'quality': return 'Zéro Problème';
      case 'improvement': return 'Progrès';
      default: return 'OK';
    }
  };

  // Obtenir le label NOK spécifique à la famille
  const getFamilyNokLabel = (family: string) => {
    switch (family) {
      case 'standards': return 'Pas Fait';
      case 'performance': return 'Pas Atteint';
      case 'quality': return 'Problème Détecté';
      case 'improvement': return 'Pas de Progrès';
      default: return 'NOK';
    }
  };

  // Obtenir l'icône spécifique à la famille
  const getFamilyCellIcon = (entry: KamishibaiEntry | undefined, family: string) => {
    if (!entry || entry.status === 'pending') {
      return <Plus className="w-4 h-4 text-gray-400" />;
    }

    if (entry.status === 'ok') {
      switch (family) {
        case 'standards':
          return <CheckCircle2 className="w-6 h-6 text-white" />;
        case 'performance':
          return <Target className="w-6 h-6 text-white" />;
        case 'quality':
          return <Shield className="w-6 h-6 text-white" />;
        case 'improvement':
          return <TrendingUp className="w-6 h-6 text-white" />;
        default:
          return <CheckCircle2 className="w-6 h-6 text-white" />;
      }
    }
    
    if (entry.status === 'nok') {
      switch (family) {
        case 'standards':
          return <XCircle className="w-6 h-6 text-white" />;
        case 'performance':
          return <XCircle className="w-6 h-6 text-white" />;
        case 'quality':
          return <AlertTriangle className="w-6 h-6 text-white" />;
        case 'improvement':
          return <Clock className="w-6 h-6 text-white" />;
        default:
          return <XCircle className="w-6 h-6 text-white" />;
      }
    }

    return <Plus className="w-4 h-4 text-gray-400" />;
  };

  // Ouvrir le modal de saisie
  const openEntryModal = (indicatorId: string, date: string) => {
    const indicator = content.indicators.find(i => i.id === indicatorId);
    if (!indicator) return;
    
    const existingEntry = getStatusForDate(indicator, date);
    
    setSelectedEntry({ indicatorId, date });
    setEntryForm({
      status: existingEntry?.status || 'pending',
      value: existingEntry?.value || '',
      reason: existingEntry?.reason || '',
      comment: existingEntry?.comment || '',
      photo: existingEntry?.photo || ''
    });
    setShowEntryModal(true);
  };

  // Sauvegarder une entrée avec validations spécifiques par famille
  const saveEntry = () => {
    if (!selectedEntry) return;
    
    const { indicatorId, date } = selectedEntry;
    const indicator = content.indicators.find(i => i.id === indicatorId);
    if (!indicator) return;

    // Validations spécifiques selon la famille d'indicateurs
    switch (indicator.family) {
      case 'standards':
        // Standards : "Pourquoi" obligatoire si Pas Fait
        if (entryForm.status === 'nok' && !entryForm.reason.trim()) {
          alert('Pour les standards : le champ "Pourquoi le standard n\'a-t-il pas été respecté ?" est obligatoire.');
          return;
        }
        break;

      case 'performance':
        // Performance : Valeur mesurée obligatoire
        if (!entryForm.value.trim()) {
          alert('Pour les indicateurs de performance : la valeur mesurée est obligatoire.');
          return;
        }
        // Si pas atteint, explication obligatoire
        if (entryForm.status === 'nok' && !entryForm.reason.trim()) {
          alert('Pour les performances non atteintes : l\'explication des causes est obligatoire.');
          return;
        }
        break;

      case 'quality':
        // Qualité/Sécurité : Si problème détecté, tous les champs obligatoires
        if (entryForm.status === 'nok') {
          if (!entryForm.reason.trim()) {
            alert('Pour les problèmes qualité/sécurité : la description précise du problème est obligatoire.');
            return;
          }
          if (!entryForm.value.trim()) {
            alert('Pour les problèmes qualité/sécurité : le niveau de gravité est obligatoire.');
            return;
          }
          if (!entryForm.comment.trim()) {
            alert('Pour les problèmes qualité/sécurité : l\'action corrective immédiate est obligatoire.');
            return;
          }
          if (!entryForm.photo) {
            alert('Pour les problèmes qualité/sécurité : la photo du problème est obligatoire.');
            return;
          }
        }
        break;

      case 'improvement':
        // Amélioration Continue : Description du progrès ou de l'absence obligatoire
        if (!entryForm.reason.trim()) {
          const message = entryForm.status === 'ok' 
            ? 'Pour l\'amélioration continue : la description du progrès réalisé est obligatoire.'
            : 'Pour l\'amélioration continue : l\'explication de l\'absence de progrès est obligatoire.';
          alert(message);
          return;
        }
        // Si progrès, action Kaizen obligatoire
        if (entryForm.status === 'ok' && !entryForm.value.trim()) {
          alert('Pour l\'amélioration continue avec progrès : l\'Action Kaizen du jour est obligatoire.');
          return;
        }
        break;

      default:
        // Validation générique
        if (entryForm.status === 'nok' && !entryForm.reason.trim()) {
          alert('Le champ "Pourquoi" est obligatoire en cas de problème.');
          return;
        }
        break;
    }

    // Création de l'entrée
    const entry: KamishibaiEntry = {
      id: `entry-${Date.now()}`,
      date,
      status: entryForm.status,
      value: entryForm.value || undefined,
      reason: entryForm.reason || undefined,
      comment: entryForm.comment || undefined,
      photo: entryForm.photo || undefined,
      updatedBy: 'Utilisateur' // À remplacer par l'utilisateur connecté
    };

    // Mettre à jour ou ajouter l'entrée
    const updatedIndicator = {
      ...indicator,
      entries: [
        ...(indicator.entries || []).filter(e => e.date !== date),
        entry
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      updatedAt: new Date()
    };

    const newContent = {
      ...content,
      indicators: content.indicators.map(i => 
        i.id === indicatorId ? updatedIndicator : i
      )
    };

    saveContent(newContent);
    setShowEntryModal(false);
    setSelectedEntry(null);
    
    // Reset du formulaire
    setEntryForm({
      status: 'pending',
      value: '',
      reason: '',
      comment: '',
      photo: ''
    });
  };

  // Créer un nouvel indicateur
  const createIndicator = (family: string, name: string, frequency: string = 'daily') => {
    const newIndicator: KamishibaiIndicator = {
      id: `indicator-${Date.now()}`,
      name,
      family: family as any,
      description: `Indicateur ${INDICATOR_FAMILIES[family as keyof typeof INDICATOR_FAMILIES].name}`,
      frequency: frequency as any,
      entries: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const newContent = {
      ...content,
      indicators: [...content.indicators, newIndicator]
    };

    saveContent(newContent);
    setEditingIndicator(null);
  };

  // Supprimer un indicateur
  const deleteIndicator = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet indicateur ?')) {
      const newContent = {
        ...content,
        indicators: content.indicators.filter(i => i.id !== id)
      };
      saveContent(newContent);
    }
  };

  // Upload d'image (simulation)
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulation - en réalité il faudrait uploader vers un service
      const reader = new FileReader();
      reader.onload = (e) => {
        setEntryForm({
          ...entryForm,
          photo: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header avec dégradé moderne */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Kamishibai</h1>
                <p className="text-white/80 text-sm">Tableau de Management Visuel Lean</p>
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
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50">
          {/* Barre d'outils moderne */}
          <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 p-2 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Factory className="w-4 h-4 text-indigo-600" />
                  Management Visuel
                </div>
              </div>
              
              <button
                onClick={() => setEditingIndicator({} as KamishibaiIndicator)}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Nouvel Indicateur</span>
              </button>
            </div>
          </div>

          {/* Contenu principal avec scroll */}
          <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {content.indicators.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun indicateur créé</h3>
                  <p className="text-gray-600 mb-6">Commencez par créer votre premier indicateur pour votre tableau de management visuel.</p>
                  <button
                    onClick={() => setEditingIndicator({} as KamishibaiIndicator)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Créer mon premier indicateur</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header général */}
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Matrice de Bâtonnage - {new Date().toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long'
                        })}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Suivi visuel des indicateurs lean par famille</p>
                    </div>
                  </div>
                </div>

                {/* Blocs séparés par famille d'indicateurs */}
                {Object.entries(INDICATOR_FAMILIES).map(([familyKey, familyConfig]) => {
                  const familyIndicators = content.indicators.filter(i => i.family === familyKey);
                  
                  // N'afficher que les familles qui ont des indicateurs
                  if (familyIndicators.length === 0) return null;
                  
                  // Regrouper les indicateurs par fréquence
                  const indicatorsByFrequency = familyIndicators.reduce((acc, indicator) => {
                    const freq = indicator.frequency || 'daily';
                    if (!acc[freq]) acc[freq] = [];
                    acc[freq].push(indicator);
                    return acc;
                  }, {} as Record<string, typeof familyIndicators>);
                  
                  const FamilyIcon = familyConfig.icon;
                  
                  return (
                    <div key={familyKey} className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden shadow-lg">
                      {/* Header coloré de la famille */}
                      <div className={`bg-gradient-to-r ${familyConfig.gradient} p-6 border-b border-white/10`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                              <FamilyIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-white">{familyConfig.name}</h4>
                              <p className="text-white/80 text-sm">{familyConfig.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 bg-${familyConfig.color}-200 rounded-full shadow-sm border border-white`}></div>
                              <span className="text-sm font-medium text-white">{getFamilyOkLabel(familyKey)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-200 rounded-full shadow-sm border border-white"></div>
                              <span className="text-sm font-medium text-white">{getFamilyNokLabel(familyKey)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gray-300 rounded-full border-2 border-white shadow-sm"></div>
                              <span className="text-sm font-medium text-white">À faire</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sous-sections par fréquence */}
                      <div className="p-6 space-y-8">
                        {Object.entries(indicatorsByFrequency).map(([frequency, indicators]) => {
                          const frequencyLabels = {
                            'daily': { label: '📅 Quotidien', desc: 'Suivi journalier' },
                            'weekly': { label: '📊 Hebdomadaire', desc: 'Suivi par semaine' },
                            'monthly': { label: '📆 Mensuel', desc: 'Suivi mensuel' },
                            'shift': { label: '🕐 Par équipe', desc: 'Suivi par poste' }
                          };
                          
                          const freqInfo = frequencyLabels[frequency as keyof typeof frequencyLabels] || 
                                         { label: 'Autre', desc: 'Autre fréquence' };
                          
                          return (
                            <div key={frequency} className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200/50">
                              {/* Header de la fréquence avec navigation */}
                              <div className={`bg-gradient-to-r from-${familyConfig.color}-100 to-${familyConfig.color}-200/50 px-6 py-3 border-b`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <h5 className="text-lg font-semibold text-gray-800">{freqInfo.label}</h5>
                                    <span className="text-sm text-gray-600">{freqInfo.desc}</span>
                                  </div>
                                  
                                  {/* Navigation temporelle */}
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center bg-white/80 rounded-lg shadow-sm">
                                      <button
                                        onClick={() => navigateTime(frequency, 'prev')}
                                        className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                                        title="Période précédente"
                                      >
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                      </button>
                                      
                                      <div className="px-3 py-2 text-sm font-medium text-gray-700 border-x">
                                        {getCurrentPeriodLabel(frequency, timeOffsets[frequency] || 0)}
                                      </div>
                                      
                                      <button
                                        onClick={() => navigateTime(frequency, 'next')}
                                        className="p-2 hover:bg-gray-100 transition-colors"
                                        title="Période suivante"
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                      </button>
                                      
                                      {(timeOffsets[frequency] || 0) !== 0 && (
                                        <button
                                          onClick={() => resetTimeOffset(frequency)}
                                          className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors border-l"
                                          title="Retour à aujourd'hui"
                                        >
                                          <RotateCcw className="w-4 h-4 text-indigo-600" />
                                        </button>
                                      )}
                                    </div>
                                    
                                    <span className="text-sm text-gray-500 bg-white/70 px-3 py-1 rounded-full">
                                      {indicators.length} indicateur{indicators.length > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Table pour cette fréquence */}
                              <table className="w-full">
                                <thead className={`bg-gradient-to-r from-${familyConfig.color}-50 to-${familyConfig.color}-100/30`}>
                                  <tr>
                                    <th className="text-left p-4 font-medium text-gray-700 min-w-[300px]">
                                      Indicateur
                                    </th>
                                    {(() => {
                                      const offset = timeOffsets[frequency] || 0;
                                      return getMatrixDates(frequency, offset).map((date) => {
                                        const dateDisplay = formatDateDisplay(date, frequency);
                                        return (
                                          <th key={date} className="text-center p-4 font-medium text-gray-700 min-w-[80px]">
                                            <div className="text-xs">
                                              {dateDisplay.short}
                                            </div>
                                            <div className="text-sm">
                                              {dateDisplay.long}
                                            </div>
                                          </th>
                                        );
                                      });
                                    })()}
                                    <th className="text-center p-4 font-medium text-gray-700">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {indicators.map((indicator) => {
                                    return (
                                      <tr key={indicator.id} className="border-b hover:bg-gray-50/50">
                                        <td className="p-4">
                                          <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg bg-${familyConfig.color}-100`}>
                                              <FamilyIcon className={`w-5 h-5 text-${familyConfig.color}-600`} />
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-900">{indicator.name}</p>
                                              <p className="text-sm text-gray-600">{indicator.description}</p>
                                              {indicator.target && (
                                                <div className="flex items-center space-x-2 mt-1">
                                                  <span className="text-xs text-gray-500">
                                                    Cible: {indicator.target} {indicator.unit}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        {(() => {
                                          const offset = timeOffsets[frequency] || 0;
                                          return getMatrixDates(frequency, offset).map((date) => {
                                            const entry = getStatusForDate(indicator, date);
                                            return (
                                              <td key={date} className="p-4 text-center">
                                                <button
                                                  onClick={() => openEntryModal(indicator.id, date)}
                                                  className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${getFamilyCellColor(entry, familyKey)} flex items-center justify-center`}
                                                  title={entry ? 
                                                    (entry.status === 'ok' ? getFamilyOkLabel(familyKey) : 
                                                     entry.status === 'nok' ? `${getFamilyNokLabel(familyKey)}: ${entry.reason}` : 
                                                     'À compléter') : 
                                                    'Cliquez pour saisir'
                                                  }
                                                >
                                                  {getFamilyCellIcon(entry, familyKey)}
                                                </button>
                                              </td>
                                            );
                                          });
                                        })()}
                                        <td className="p-4 text-center">
                                          <div className="flex justify-center space-x-2">
                                            <button
                                              onClick={() => setEditingIndicator(indicator)}
                                              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                              title="Modifier"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => deleteIndicator(indicator.id)}
                                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                                              title="Supprimer"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals de saisie différenciés par famille */}
      {showEntryModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {(() => {
            const indicator = content.indicators.find(i => i.id === selectedEntry.indicatorId);
            if (!indicator) return null;
            
            const family = INDICATOR_FAMILIES[indicator.family] || INDICATOR_FAMILIES.standards;
            const Icon = family.icon;
            
            // Modal pour Standards (Fait/Pas Fait)
            if (indicator.family === 'standards') {
              return (
                <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                  {/* Header coloré Standards */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Standard de Travail</h3>
                          <p className="text-blue-100 text-sm">Fait / Pas Fait</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Info indicateur */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-900 mb-1">{indicator.name}</h4>
                      <p className="text-sm text-blue-700">
                        {new Date(selectedEntry.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', day: 'numeric', month: 'long' 
                        })}
                      </p>
                    </div>

                    {/* Saisie binaire Standards */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Le standard a-t-il été respecté ? *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'ok' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'ok'
                              ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200/50'
                              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${
                            entryForm.status === 'ok' ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <span className="block font-medium">Fait</span>
                          <span className="text-xs text-gray-600">Standard respecté</span>
                        </button>
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'nok' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'nok'
                              ? 'border-red-500 bg-red-50 shadow-lg shadow-red-200/50'
                              : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                          }`}
                        >
                          <XCircle className={`w-8 h-8 mx-auto mb-2 ${
                            entryForm.status === 'nok' ? 'text-red-600' : 'text-gray-400'
                          }`} />
                          <span className="block font-medium">Pas Fait</span>
                          <span className="text-xs text-gray-600">Standard non respecté</span>
                        </button>
                      </div>
                    </div>

                    {/* Pourquoi obligatoire si Pas Fait */}
                    {entryForm.status === 'nok' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-red-800 mb-2">
                          Pourquoi le standard n'a-t-il pas été respecté ? *
                        </label>
                        <textarea
                          value={entryForm.reason}
                          onChange={(e) => setEntryForm({ ...entryForm, reason: e.target.value })}
                          className="w-full border border-red-300 rounded-lg px-3 py-3 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          rows={3}
                          placeholder="Décrivez précisément ce qui a empêché le respect du standard..."
                          required
                        />
                      </div>
                    )}

                    {/* Photo recommandée si Pas Fait */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Photo {entryForm.status === 'nok' ? '(fortement recommandée)' : '(optionnelle)'}
                      </label>
                      <div className={`border-2 border-dashed rounded-xl p-6 ${
                        entryForm.status === 'nok' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload-standards"
                        />
                        <label htmlFor="photo-upload-standards" className="flex flex-col items-center cursor-pointer">
                          <Camera className={`w-10 h-10 mb-3 ${
                            entryForm.status === 'nok' ? 'text-red-400' : 'text-gray-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-700 text-center">
                            {entryForm.status === 'nok' 
                              ? 'Photo recommandée pour documenter le problème'
                              : 'Ajoutez une photo si nécessaire'
                            }
                          </span>
                        </label>
                        {entryForm.photo && (
                          <div className="mt-4">
                            <img src={entryForm.photo} alt="Preuve" className="max-w-full h-40 object-cover rounded-lg mx-auto" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Commentaire */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Commentaire additionnel
                      </label>
                      <textarea
                        value={entryForm.comment}
                        onChange={(e) => setEntryForm({ ...entryForm, comment: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        rows={2}
                        placeholder="Observations, actions prises, améliorations..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveEntry}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Modal pour Performance (Atteint/Pas Atteint)
            if (indicator.family === 'performance') {
              return (
                <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                  {/* Header coloré Performance */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Target className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Indicateur Performance</h3>
                          <p className="text-green-100 text-sm">Atteint / Pas Atteint</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Info indicateur avec objectif */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="font-semibold text-green-900 mb-1">{indicator.name}</h4>
                      <p className="text-sm text-green-700 mb-2">
                        {new Date(selectedEntry.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', day: 'numeric', month: 'long' 
                        })}
                      </p>
                      {indicator.target && (
                        <div className="bg-white rounded-lg p-3 border border-green-300">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Objectif: <strong>{indicator.target} {indicator.unit}</strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Saisie valeur mesurée obligatoire */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Valeur mesurée *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={entryForm.value}
                          onChange={(e) => {
                            setEntryForm({ ...entryForm, value: e.target.value });
                            // Auto-détermination du statut
                            if (indicator.target && e.target.value) {
                              const measured = parseFloat(e.target.value);
                              const target = parseFloat(indicator.target);
                              setEntryForm(prev => ({
                                ...prev,
                                value: e.target.value,
                                status: measured >= target ? 'ok' : 'nok'
                              }));
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          placeholder={`Ex: 8500 ${indicator.unit || ''}`}
                          required
                        />
                        <div className="absolute right-3 top-3 text-gray-500">
                          {indicator.unit}
                        </div>
                      </div>
                      
                      {/* Comparaison automatique */}
                      {entryForm.value && indicator.target && (
                        <div className="mt-3 p-3 rounded-lg border">
                          {(() => {
                            const measured = parseFloat(entryForm.value);
                            const target = parseFloat(indicator.target);
                            const isAtteint = measured >= target;
                            return (
                              <div className={`flex items-center space-x-2 ${
                                isAtteint ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                              } p-2 rounded`}>
                                {isAtteint ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <XCircle className="w-5 h-5" />
                                )}
                                <span className="font-medium">
                                  {measured} / {target} {indicator.unit} - {isAtteint ? 'OBJECTIF ATTEINT' : 'OBJECTIF NON ATTEINT'}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Résultat automatique ou manuel */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Résultat *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'ok' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'ok'
                              ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200/50'
                              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          <Target className={`w-8 h-8 mx-auto mb-2 ${
                            entryForm.status === 'ok' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <span className="block font-medium">Atteint</span>
                          <span className="text-xs text-gray-600">Objectif réussi</span>
                        </button>
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'nok' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'nok'
                              ? 'border-red-500 bg-red-50 shadow-lg shadow-red-200/50'
                              : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                          }`}
                        >
                          <XCircle className={`w-8 h-8 mx-auto mb-2 ${
                            entryForm.status === 'nok' ? 'text-red-600' : 'text-gray-400'
                          }`} />
                          <span className="block font-medium">Pas Atteint</span>
                          <span className="text-xs text-gray-600">Objectif non réussi</span>
                        </button>
                      </div>
                    </div>

                    {/* Explication + Plan d'action si pas atteint */}
                    {entryForm.status === 'nok' && (
                      <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-red-800 mb-2">
                            Pourquoi l'objectif n'a-t-il pas été atteint ? *
                          </label>
                          <textarea
                            value={entryForm.reason}
                            onChange={(e) => setEntryForm({ ...entryForm, reason: e.target.value })}
                            className="w-full border border-red-300 rounded-lg px-3 py-3 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200"
                            rows={3}
                            placeholder="Analysez les causes de l'écart..."
                            required
                          />
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-orange-800 mb-2">
                            Plan d'action immédiate
                          </label>
                          <textarea
                            value={entryForm.comment}
                            onChange={(e) => setEntryForm({ ...entryForm, comment: e.target.value })}
                            className="w-full border border-orange-300 rounded-lg px-3 py-3 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            rows={2}
                            placeholder="Actions prévues pour rattraper l'objectif ou éviter la récurrence..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Commentaire pour succès */}
                    {entryForm.status === 'ok' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Commentaire de réussite
                        </label>
                        <textarea
                          value={entryForm.comment}
                          onChange={(e) => setEntryForm({ ...entryForm, comment: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          rows={2}
                          placeholder="Facteurs de succès, bonnes pratiques à retenir..."
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveEntry}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Modal pour Qualité/Sécurité (Zéro Problème)
            if (indicator.family === 'quality') {
              return (
                <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                  {/* Header coloré Qualité/Sécurité */}
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Qualité & Sécurité</h3>
                          <p className="text-red-100 text-sm">Zéro Problème</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Info indicateur */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h4 className="font-semibold text-red-900 mb-1">{indicator.name}</h4>
                      <p className="text-sm text-red-700 mb-2">
                        {new Date(selectedEntry.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', day: 'numeric', month: 'long' 
                        })}
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-red-300">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-700">
                            L'état normal est <strong>"Tout va bien"</strong> - Signaler seulement les exceptions
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Focus sur l'exception */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Statut de la journée *
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'ok' })}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'ok'
                              ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200/50'
                              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <Shield className={`w-8 h-8 ${
                              entryForm.status === 'ok' ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <div className="text-left">
                              <span className="block text-lg font-semibold">Zéro Problème</span>
                              <span className="text-sm text-gray-600">Tout s'est bien passé, aucun incident</span>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'nok' })}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'nok'
                              ? 'border-red-500 bg-red-50 shadow-lg shadow-red-200/50'
                              : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <AlertTriangle className={`w-8 h-8 ${
                              entryForm.status === 'nok' ? 'text-red-600' : 'text-gray-400'
                            }`} />
                            <div className="text-left">
                              <span className="block text-lg font-semibold">Problème Détecté</span>
                              <span className="text-sm text-gray-600">Un incident ou anomalie s'est produit</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Détails du problème si détecté */}
                    {entryForm.status === 'nok' && (
                      <div className="space-y-4 bg-red-50 border border-red-200 rounded-xl p-4">
                        <h5 className="font-semibold text-red-800 mb-3">Détails du problème détecté</h5>
                        
                        {/* Description détaillée obligatoire */}
                        <div>
                          <label className="block text-sm font-semibold text-red-800 mb-2">
                            Description précise du problème *
                          </label>
                          <textarea
                            value={entryForm.reason}
                            onChange={(e) => setEntryForm({ ...entryForm, reason: e.target.value })}
                            className="w-full border border-red-300 rounded-lg px-3 py-3 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200"
                            rows={4}
                            placeholder="Décrivez précisément ce qui s'est passé, quand, où, comment..."
                            required
                          />
                        </div>

                        {/* Gravité */}
                        <div>
                          <label className="block text-sm font-semibold text-red-800 mb-2">
                            Niveau de gravité *
                          </label>
                          <select
                            value={entryForm.value || ''}
                            onChange={(e) => setEntryForm({ ...entryForm, value: e.target.value })}
                            className="w-full border border-red-300 rounded-lg px-3 py-2 bg-white focus:border-red-500"
                            required
                          >
                            <option value="">Sélectionnez la gravité</option>
                            <option value="faible">Faible - Pas d'impact immédiat</option>
                            <option value="moyen">Moyen - Impact modéré</option>
                            <option value="elevé">Élevé - Impact significatif</option>
                            <option value="critique">Critique - Arrêt ou danger</option>
                          </select>
                        </div>

                        {/* Action corrective immédiate */}
                        <div>
                          <label className="block text-sm font-semibold text-red-800 mb-2">
                            Action corrective immédiate prise *
                          </label>
                          <textarea
                            value={entryForm.comment}
                            onChange={(e) => setEntryForm({ ...entryForm, comment: e.target.value })}
                            className="w-full border border-red-300 rounded-lg px-3 py-3 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200"
                            rows={3}
                            placeholder="Qu'avez-vous fait immédiatement pour corriger/sécuriser la situation ?"
                            required
                          />
                        </div>

                        {/* Photo obligatoire si problème */}
                        <div>
                          <label className="block text-sm font-semibold text-red-800 mb-2">
                            Photo du problème *
                          </label>
                          <div className="border-2 border-dashed border-red-400 rounded-xl p-6 bg-white">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              id="photo-upload-quality"
                              required={entryForm.status === 'nok'}
                            />
                            <label htmlFor="photo-upload-quality" className="flex flex-col items-center cursor-pointer">
                              <Camera className="w-10 h-10 text-red-500 mb-3" />
                              <span className="text-sm font-medium text-red-800 text-center">
                                Photo obligatoire pour documenter le problème
                              </span>
                              <span className="text-xs text-red-600 mt-1">
                                Indispensable pour l'analyse et le suivi
                              </span>
                            </label>
                            {entryForm.photo && (
                              <div className="mt-4">
                                <img src={entryForm.photo} alt="Problème détecté" className="max-w-full h-40 object-cover rounded-lg mx-auto" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Commentaire optionnel pour zéro problème */}
                    {entryForm.status === 'ok' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Observation positive (optionnel)
                        </label>
                        <textarea
                          value={entryForm.comment}
                          onChange={(e) => setEntryForm({ ...entryForm, comment: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          rows={2}
                          placeholder="Bonne pratique observée, amélioration notée..."
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveEntry}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Modal pour Amélioration Continue (Progrès)
            if (indicator.family === 'improvement') {
              return (
                <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                  {/* Header coloré Amélioration */}
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Amélioration Continue</h3>
                          <p className="text-purple-100 text-sm">Progrès & Kaizen</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Info indicateur */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <h4 className="font-semibold text-purple-900 mb-1">{indicator.name}</h4>
                      <p className="text-sm text-purple-700 mb-2">
                        {new Date(selectedEntry.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', day: 'numeric', month: 'long' 
                        })}
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-purple-300">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Focus sur le <strong>progrès</strong> et l'<strong>amélioration continue</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Statut du progrès */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Y a-t-il eu du progrès aujourd'hui ? *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'ok' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'ok'
                              ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-200/50'
                              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                          }`}
                        >
                          <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${
                            entryForm.status === 'ok' ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                          <span className="block font-medium">Progrès</span>
                          <span className="text-xs text-gray-600">Amélioration réalisée</span>
                        </button>
                        <button
                          onClick={() => setEntryForm({ ...entryForm, status: 'nok' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            entryForm.status === 'nok'
                              ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-200/50'
                              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          <Clock className={`w-8 h-8 mx-auto mb-2 ${
                            entryForm.status === 'nok' ? 'text-orange-600' : 'text-gray-400'
                          }`} />
                          <span className="block font-medium">Pas de Progrès</span>
                          <span className="text-xs text-gray-600">Stagnation temporaire</span>
                        </button>
                      </div>
                    </div>

                    {/* Description du progrès si OK */}
                    {entryForm.status === 'ok' && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-purple-800 mb-2">
                            Quel progrès a été réalisé ? *
                          </label>
                          <textarea
                            value={entryForm.reason}
                            onChange={(e) => setEntryForm({ ...entryForm, reason: e.target.value })}
                            className="w-full border border-purple-300 rounded-lg px-3 py-3 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            rows={3}
                            placeholder="Décrivez concrètement l'amélioration, l'avancement, la solution trouvée..."
                            required
                          />
                        </div>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-indigo-800 mb-2">
                            Action Kaizen du jour *
                          </label>
                          <textarea
                            value={entryForm.value}
                            onChange={(e) => setEntryForm({ ...entryForm, value: e.target.value })}
                            className="w-full border border-indigo-300 rounded-lg px-3 py-3 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            rows={2}
                            placeholder="Quelle action concrète d'amélioration avez-vous menée ?"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Raison du manque de progrès si NOK */}
                    {entryForm.status === 'nok' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-orange-800 mb-2">
                          Pourquoi pas de progrès aujourd'hui ? *
                        </label>
                        <textarea
                          value={entryForm.reason}
                          onChange={(e) => setEntryForm({ ...entryForm, reason: e.target.value })}
                          className="w-full border border-orange-300 rounded-lg px-3 py-3 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          rows={3}
                          placeholder="Obstacles rencontrés, priorités différentes, manque de temps..."
                          required
                        />
                      </div>
                    )}

                    {/* Idée d'amélioration */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-green-800 mb-2">
                        Idée d'amélioration pour demain
                      </label>
                      <textarea
                        value={entryForm.comment}
                        onChange={(e) => setEntryForm({ ...entryForm, comment: e.target.value })}
                        className="w-full border border-green-300 rounded-lg px-3 py-3 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        rows={2}
                        placeholder="Nouvelle idée, prochaine étape, amélioration à tester..."
                      />
                    </div>

                    {/* Photo optionnelle */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Photo du progrès (optionnelle)
                      </label>
                      <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 bg-purple-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload-improvement"
                        />
                        <label htmlFor="photo-upload-improvement" className="flex flex-col items-center cursor-pointer">
                          <Camera className="w-10 h-10 text-purple-400 mb-3" />
                          <span className="text-sm font-medium text-purple-700 text-center">
                            Immortalisez votre amélioration
                          </span>
                          <span className="text-xs text-purple-600 mt-1">
                            Avant/après, nouvelle solution, résultat obtenu...
                          </span>
                        </label>
                        {entryForm.photo && (
                          <div className="mt-4">
                            <img src={entryForm.photo} alt="Progrès réalisé" className="max-w-full h-40 object-cover rounded-lg mx-auto" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        onClick={() => setShowEntryModal(false)}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveEntry}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Fallback au modal générique pour les autres cas
            return (
              <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Saisie Kamishibai</h3>
                    <button
                      onClick={() => setShowEntryModal(false)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-600">Type d'indicateur non reconnu.</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal de création/édition d'indicateur */}
      {editingIndicator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingIndicator.id ? 'Modifier l\'indicateur' : 'Nouvel Indicateur'}
              </h3>
              
              <div className="space-y-4">
                {/* Sélection de famille */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Famille d'indicateur
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(INDICATOR_FAMILIES).map(([key, family]) => {
                      const Icon = family.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewIndicatorFamily(key)}
                          className={`p-4 rounded-lg border-2 text-left ${
                            newIndicatorFamily === key
                              ? `border-${family.color}-500 bg-${family.color}-50`
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <Icon className={`w-5 h-5 text-${family.color}-600`} />
                            <span className="font-medium">{family.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">{family.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exemples pour la famille sélectionnée */}
                {newIndicatorFamily && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Exemples d'indicateurs {INDICATOR_FAMILIES[newIndicatorFamily as keyof typeof INDICATOR_FAMILIES].name}:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {INDICATOR_FAMILIES[newIndicatorFamily as keyof typeof INDICATOR_FAMILIES].examples.map((example, index) => (
                        <li key={index}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fréquence de bâtonnage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence de bâtonnage *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'daily', label: 'Quotidien', desc: '7 derniers jours', icon: '📅' },
                      { key: 'weekly', label: 'Hebdomadaire', desc: '6 dernières semaines', icon: '📊' },
                      { key: 'monthly', label: 'Mensuel', desc: '6 derniers mois', icon: '📆' },
                      { key: 'shift', label: 'Par équipe', desc: 'Matin/Soir sur 7 jours', icon: '🕐' }
                    ].map((freq) => (
                      <button
                        key={freq.key}
                        onClick={() => setNewIndicatorFrequency(freq.key)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          newIndicatorFrequency === freq.key
                            ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                            : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{freq.icon}</span>
                          <span className="font-medium text-gray-900">{freq.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{freq.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'indicateur *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tournée 5S du matin effectuée"
                    className="w-full border rounded-lg px-3 py-2"
                    id="indicator-name"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingIndicator(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const nameInput = document.getElementById('indicator-name') as HTMLInputElement;
                    const name = nameInput?.value.trim();
                    if (name) {
                      createIndicator(newIndicatorFamily, name, newIndicatorFrequency);
                    } else {
                      alert('Veuillez saisir un nom pour l\'indicateur');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Panel - Style cohérent avec les autres modules */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Header avec dégradé moderne Kamishibai */}
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Kamishibai Numérique</h3>
                    <p className="text-white/80 text-sm">Management Visuel Lean - Guide d'utilisation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                  title="Fermer l'aide"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
              <div className="p-8">
                {/* Introduction */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-8">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="w-6 h-6 mr-3 text-yellow-500" />
                    Qu'est-ce que le Kamishibai ?
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Le <strong>Kamishibai</strong> est un système de management visuel inspiré du théâtre traditionnel japonais. 
                    Dans le contexte Lean, chaque "planche" correspond à un standard, objectif ou contrôle à vérifier régulièrement.
                  </p>
                  <div className="bg-white/70 rounded-lg p-4 border border-blue-300">
                    <p className="text-sm text-blue-800 font-medium">
                      🎯 <strong>Objectif :</strong> Créer un système de pilotage visuel permettant de détecter rapidement les écarts et d'agir en conséquence.
                    </p>
                  </div>
                </div>

                {/* Familles d'indicateurs */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {Object.entries(INDICATOR_FAMILIES).map(([key, family]) => {
                    const Icon = family.icon;
                    const colorMap = {
                      'standards': 'blue',
                      'performance': 'green', 
                      'quality': 'red',
                      'improvement': 'purple'
                    };
                    const color = colorMap[key as keyof typeof colorMap] || 'gray';
                    
                    return (
                      <div key={key} className={`bg-gradient-to-br from-${color}-50 to-${color}-50 p-6 rounded-xl border border-${color}-200`}>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`p-2 rounded-lg bg-${color}-100`}>
                            <Icon className={`w-6 h-6 text-${color}-600`} />
                          </div>
                          <div>
                            <h5 className="text-lg font-semibold text-gray-900">{family.name}</h5>
                            <p className={`text-sm text-${color}-700 font-medium`}>{family.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h6 className="text-sm font-semibold text-gray-800">Exemples d'indicateurs :</h6>
                          <ul className="space-y-1.5">
                            {family.examples.slice(0, 3).map((example, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-700">
                                <span className={`w-2 h-2 bg-gradient-to-r from-${color}-500 to-${color}-500 rounded-full mt-2 mr-3 flex-shrink-0`}></span>
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation temporelle */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 mb-8">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-6 h-6 mr-3 text-purple-600" />
                    Navigation Temporelle
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Fréquences de bâtonnage :</h5>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center">
                          <span className="text-lg mr-2">📅</span>
                          <strong>Quotidien :</strong> 7 derniers jours (navigation par semaines)
                        </li>
                        <li className="flex items-center">
                          <span className="text-lg mr-2">📊</span>
                          <strong>Hebdomadaire :</strong> 6 dernières semaines 
                        </li>
                        <li className="flex items-center">
                          <span className="text-lg mr-2">📆</span>
                          <strong>Mensuel :</strong> 6 derniers mois (navigation par semestres)
                        </li>
                        <li className="flex items-center">
                          <span className="text-lg mr-2">🕐</span>
                          <strong>Par équipe :</strong> Postes Matin/Soir sur 7 jours
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Contrôles de navigation :</h5>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center">
                          <ChevronLeft className="w-4 h-4 mr-2 text-gray-500" />
                          Naviguer vers le passé
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
                          Naviguer vers le futur
                        </li>
                        <li className="flex items-center">
                          <RotateCcw className="w-4 h-4 mr-2 text-indigo-600" />
                          Retour à la période actuelle
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Mode d'emploi */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle2 className="w-6 h-6 mr-3 text-green-600" />
                      Comment utiliser
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Cliquez sur une cellule pour saisir le statut de l'indicateur
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Chaque famille a ses propres labels (Fait/Pas Fait, Atteint/Pas Atteint...)
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Le "Pourquoi" est obligatoire en cas de problème (NOK)
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Photos recommandées/obligatoires selon la famille d'indicateur
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-6 h-6 mr-3 text-amber-600" />
                      Bonnes pratiques
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Consultez la matrice en équipe lors du briefing quotidien
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Analysez les tendances avec la navigation temporelle
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Définissez des actions correctives immédiates en cas de NOK
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Utilisez les fréquences adaptées à vos processus
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer avec bouton de fermeture */}
            <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Compris ! Je suis prêt à utiliser le Kamishibai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};