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
  tool_type: '5Pourquoi' | 'Image' | '4M' | 'OPL' | '5S' | 'VSM' | 'PlanActions' | 'Croquis' | 'Iframe' | 'Kamishibai' | 'SOP';
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

// =======================================================================
// === INTERFACES POUR LE MODULE VSM PROFESSIONNEL ===
// =======================================================================

export interface VSMMap {
  id: string;
  module_id: string;
  title?: string;
  description?: string;
  customer_demand: number; // pièces par mois
  opening_time: number; // secondes par jour
  time_unit: 'secondes' | 'minutes' | 'heures' | 'jours';
  company?: string;
  product?: string;
  author?: string;
  version?: string;
  created_at: string;
  updated_at: string;
}

export interface VSMSnapshot {
  id: string;
  map_id: string;
  name: string;
  description?: string;
  snapshot_data: any; // JSONB data
  created_by: string;
  created_at: string;
}

export interface VSMComment {
  id: string;
  map_id: string;
  element_id?: string; // NULL si commentaire global
  user_id: string;
  content: string;
  x_position?: number; // Position sur le canvas
  y_position?: number;
  created_at: string;
  updated_at: string;
}

// =======================================================================
// === INTERFACES POUR LE MODULE 5S AMÉLIORÉ ===
// =======================================================================

export type FiveSCategory = 'seiri' | 'seiton' | 'seiso' | 'seiketsu' | 'shitsuke';
export type FiveSItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type FiveSChecklistStatus = 'draft' | 'active' | 'completed' | 'archived';
export type FiveSItemPriority = 'low' | 'medium' | 'high' | 'critical';
export type FiveSPhotoType = 'before' | 'after' | 'progress' | 'reference';

export interface FiveSChecklist {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  area?: string; // Zone/poste de travail
  responsible_user_id?: string;
  status: FiveSChecklistStatus;
  target_completion_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FiveSItem {
  id: string;
  checklist_id: string;
  category: FiveSCategory;
  title: string;
  description?: string;
  status: FiveSItemStatus;
  priority: FiveSItemPriority;
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FiveSAssignment {
  id: string;
  item_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  role: 'responsible' | 'collaborator' | 'reviewer';
}

export interface FiveSPhoto {
  id: string;
  item_id?: string; // NULL si photo globale à la checklist
  checklist_id?: string; // NULL si photo liée à un item spécifique
  filename: string;
  original_filename: string;
  file_path: string; // Chemin dans Supabase Storage
  file_size?: number;
  mime_type?: string;
  photo_type: FiveSPhotoType;
  description?: string;
  taken_at?: string;
  taken_by?: string;
  location_lat?: number;
  location_lng?: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface FiveSPhotoComment {
  id: string;
  photo_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface FiveSHistory {
  id: string;
  checklist_id?: string;
  item_id?: string;
  user_id: string;
  action: string; // 'created', 'updated', 'completed', 'assigned', etc.
  old_values?: any;
  new_values?: any;
  description?: string;
  created_at: string;
}

export interface FiveSProgressStats {
  id: string;
  checklist_id: string;
  date: string;
  total_items: number;
  completed_items: number;
  in_progress_items: number;
  pending_items: number;
  completion_percentage: number;
  created_at: string;
}

// Interfaces pour les calculs et statistiques
export interface FiveSCategoryStats {
  category: FiveSCategory;
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  completion_percentage: number;
}

export interface FiveSChecklistStats {
  checklist_id: string;
  total_items: number;
  completed_items: number;
  completion_percentage: number;
  categories_stats: FiveSCategoryStats[];
  overdue_items: number;
  assigned_items: number;
  photos_count: number;
}

// Interfaces pour l'interface utilisateur
export interface FiveSChecklistWithStats extends FiveSChecklist {
  stats: FiveSChecklistStats;
  items: FiveSItem[];
  photos: FiveSPhoto[];
}

export interface FiveSItemWithDetails extends FiveSItem {
  assignments: FiveSAssignment[];
  photos: FiveSPhoto[];
  comments: FiveSPhotoComment[];
  assigned_user?: {
    id: string;
    nom: string;
    avatar_url?: string;
  };
}

// Configuration pour l'affichage des catégories 5S
export const FIVE_S_CATEGORIES_CONFIG = {
  seiri: {
    name: 'Seiri - Trier',
    description: 'Éliminer l\'inutile',
    color: '#EF4444', // red-500
    bgColor: '#FEF2F2', // red-50
    icon: '🗂️'
  },
  seiton: {
    name: 'Seiton - Ranger',
    description: 'Une place pour chaque chose',
    color: '#3B82F6', // blue-500
    bgColor: '#EFF6FF', // blue-50
    icon: '📍'
  },
  seiso: {
    name: 'Seiso - Nettoyer',
    description: 'Nettoyer et inspecter',
    color: '#10B981', // emerald-500
    bgColor: '#ECFDF5', // emerald-50
    icon: '🧽'
  },
  seiketsu: {
    name: 'Seiketsu - Standardiser',
    description: 'Maintenir la propreté',
    color: '#F59E0B', // amber-500
    bgColor: '#FFFBEB', // amber-50
    icon: '📋'
  },
  shitsuke: {
    name: 'Shitsuke - Maintenir',
    description: 'Respecter les règles',
    color: '#8B5CF6', // violet-500
    bgColor: '#F3E8FF', // violet-50
    icon: '🔄'
  }
} as const;

// Configuration pour les statuts
export const FIVE_S_STATUS_CONFIG = {
  pending: {
    name: 'À faire',
    color: '#6B7280', // gray-500
    bgColor: '#F9FAFB', // gray-50
    icon: '⏳'
  },
  in_progress: {
    name: 'En cours',
    color: '#F59E0B', // amber-500
    bgColor: '#FFFBEB', // amber-50
    icon: '🔄'
  },
  completed: {
    name: 'Terminé',
    color: '#10B981', // emerald-500
    bgColor: '#ECFDF5', // emerald-50
    icon: '✅'
  },
  cancelled: {
    name: 'Annulé',
    color: '#EF4444', // red-500
    bgColor: '#FEF2F2', // red-50
    icon: '❌'
  }
} as const;

// Configuration pour les priorités
export const FIVE_S_PRIORITY_CONFIG = {
  low: {
    name: 'Faible',
    color: '#10B981', // emerald-500
    bgColor: '#ECFDF5', // emerald-50
    icon: '🟢'
  },
  medium: {
    name: 'Moyenne',
    color: '#F59E0B', // amber-500
    bgColor: '#FFFBEB', // amber-50
    icon: '🟡'
  },
  high: {
    name: 'Élevée',
    color: '#F97316', // orange-500
    bgColor: '#FFF7ED', // orange-50
    icon: '🟠'
  },
  critical: {
    name: 'Critique',
    color: '#EF4444', // red-500
    bgColor: '#FEF2F2', // red-50
    icon: '🔴'
  }
} as const;