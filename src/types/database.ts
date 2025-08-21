export interface User {
  id: string;
  email: string;
  password: string;
  nom: string;
  avatarUrl?: string;
}

export interface Persona {
  id: string;
  nom: string;
  fonction: string;
  photo?: string;
}

export interface Project {
  id: string;
  pilote: string;
  titre: string;
  what?: string;
  theme?: string;
  date_creation: string;
  date_probleme?: string;
  kaizen_number: string;
  location?: string;
  cost: number;
  benefit: number;
  statut: 'En cours' | 'Terminé';
  pdca_step: 'PLAN' | 'DO' | 'CHECK' | 'ACT';
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_in_project: 'Leader' | 'Membre';
  created_at: string;
}

export interface A3Module {
  id: string;
  project_id: string;
  quadrant: 'PLAN' | 'DO' | 'CHECK' | 'ACT';
  tool_type: '5Pourquoi' | 'Image' | '4M' | 'OPL' | '5S' | 'VSM' | 'PlanActions' | 'Croquis' | 'Iframe' | 'Indicateurs' | 'SOP';
  content: any;
  position: number;
  titre?: string;
  date_echeance?: string;
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: 'simple' | 'securisation' | 'poka-yoke';
  start_date: string; 
  due_date: string;
  status: 'À faire' | 'Fait';
  effort: number;
  gain: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ActionAssignee {
  id: string;
  action_id: string;
  user_id: string;
  is_leader: boolean;
  created_at: string;
}

// =======================================================================
// === STRUCTURES DE DONNÉES POUR LE MODULE VSM PROFESSIONNEL ===
// =======================================================================

export type VSMElementType =
  | 'Client'
  | 'Fournisseur'
  | 'Processus'
  | 'Stock'
  | 'ControleProduction'
  | 'Livraison'
  | 'Texte'
  | 'Kaizen';

export type VSMConnectionArrow = 'pousse' | 'retrait' | 'supermarche';
export type VSMInfoFlowType = 'manuel' | 'electronique';

export interface VSMGlobalData {
  demandeClient: number; // pièces par mois
  tempsOuverture: number; // secondes par jour
  uniteTemps: 'secondes' | 'minutes' | 'heures' | 'jours';
}

export interface VSMElement {
  id: string;
  type: VSMElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  data: {
    nom?: string;
    tempsCycle?: number;      // (s) Processus
    tempsChangt?: number;     // (s) Processus
    tauxDispo?: number;       // (%) Processus
    nbOperateurs?: number;    // Processus
    rebut?: number;           // (%) Processus
    quantite?: number;        // Stock (en jours)
    frequence?: string;       // Livraison, Client, Fournisseur
    details?: string;         // ControleProduction, Texte, Kaizen
    contenu?: string;         // Texte
  };
}

export interface VSMConnection {
  id: string;
  from: { elementId: string; anchor: 'top' | 'bottom' | 'left' | 'right' };
  to: { elementId: string; anchor: 'top' | 'bottom' | 'left' | 'right' };
  type: 'matiere' | 'information';
  data?: {
    arrowType?: VSMConnectionArrow;
    infoType?: VSMInfoFlowType;
    details?: string;
  };
}

export interface VSMContent {
  elements: VSMElement[];
  connections: VSMConnection[];
  global: VSMGlobalData;
}

// =======================================================================
// === INTERFACES POUR LE MODULE 5 POURQUOI ===
// =======================================================================

export interface FiveWhyAnalysis {
  id: string;
  module_id: string;
  problem_title: string;
  why_1?: string;
  why_2?: string;
  why_3?: string;
  why_4?: string;
  why_5?: string;
  root_cause?: string;
  intermediate_cause?: string;
  intermediate_cause_level?: number;
  position: number;
  created_at: string;
  updated_at: string;
}

// =======================================================================
// === INTERFACES POUR LE MODULE 4M ISHIKAWA ===
// =======================================================================

export type IshikawaMType = '4M' | '5M' | '6M' | '7M' | '8M' | '9M';

export interface IshikawaDiagram {
  id: string;
  module_id: string;
  name: string;
  problem: string;
  m_type: IshikawaMType;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface IshikawaBranch {
  id: string;
  diagram_id: string;
  branch_key: string; // 'main-oeuvre', 'methode', 'materiel', 'matiere', etc.
  name: string;
  color: string; // Format hex #RRGGBB
  position: number;
  created_at: string;
  updated_at: string;
}

export interface IshikawaCause {
  id: string;
  branch_id: string;
  parent_cause_id?: string;
  text: string;
  level: number; // 0 = cause principale, 1 = sous-cause, 2 = sous-sous-cause
  position: number;
  created_at: string;
  updated_at: string;
}

// Configuration des branches par défaut pour chaque type de M
export interface IshikawaBranchConfig {
  id: string;
  name: string;
  color: string;
  icon?: React.ReactNode;
}

export const ISHIKAWA_BRANCH_CONFIGS: Record<IshikawaMType, IshikawaBranchConfig[]> = {
  '4M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', color: '#10B981' },
    { id: 'materiel', name: 'Matériel', color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', color: '#EF4444' }
  ],
  '5M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', color: '#10B981' },
    { id: 'materiel', name: 'Matériel', color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', color: '#8B5CF6' }
  ],
  '6M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', color: '#10B981' },
    { id: 'materiel', name: 'Matériel', color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', color: '#EC4899' }
  ],
  '7M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', color: '#10B981' },
    { id: 'materiel', name: 'Matériel', color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', color: '#EC4899' },
    { id: 'management', name: 'Management', color: '#F97316' }
  ],
  '8M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', color: '#10B981' },
    { id: 'materiel', name: 'Matériel', color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', color: '#EC4899' },
    { id: 'management', name: 'Management', color: '#F97316' },
    { id: 'moyens-financiers', name: 'Moyens financiers', color: '#06B6D4' }
  ],
  '9M': [
    { id: 'main-oeuvre', name: 'Main d\'œuvre', color: '#3B82F6' },
    { id: 'methode', name: 'Méthode', color: '#10B981' },
    { id: 'materiel', name: 'Matériel', color: '#F59E0B' },
    { id: 'matiere', name: 'Matière', color: '#EF4444' },
    { id: 'milieu', name: 'Milieu', color: '#8B5CF6' },
    { id: 'mesure', name: 'Mesure', color: '#EC4899' },
    { id: 'management', name: 'Management', color: '#F97316' },
    { id: 'moyens-financiers', name: 'Moyens financiers', color: '#06B6D4' },
    { id: 'maintenance', name: 'Maintenance', color: '#84CC16' }
  ]
};