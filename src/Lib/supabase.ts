// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types de la base de données
export interface Profile {
  id: string
  email: string
  nom: string
  avatar_url?: string
  role: 'user' | 'admin'
  department?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  pilote: string
  titre: string
  what?: string
  theme?: string
  date_creation: string
  date_probleme?: string
  kaizen_number: string
  location?: string
  cost: number
  benefit: number
  statut: 'En cours' | 'Terminé'
  pdca_step: 'PLAN' | 'DO' | 'CHECK' | 'ACT'
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role_in_project: 'Leader' | 'Membre'
  created_at: string
}

export interface A3Module {
  id: string
  project_id: string
  quadrant: 'PLAN' | 'DO' | 'CHECK' | 'ACT'
  tool_type: string
  content: any
  position: number
  titre?: string
  date_echeance?: string
  created_at: string
  updated_at: string
}

export interface Action {
  id: string
  project_id: string
  title: string
  description?: string
  type: 'simple' | 'securisation' | 'poka-yoke'
  start_date?: string
  due_date?: string
  status: 'À faire' | 'Fait'
  effort: number
  gain: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ActionAssignee {
  id: string
  action_id: string
  user_id: string
  is_leader: boolean
  created_at: string
}

export interface FiveWhyAnalysis {
  id: string
  module_id: string
  problem_title: string
  why_1?: string
  why_2?: string
  why_3?: string
  why_4?: string
  why_5?: string
  root_cause?: string
  intermediate_cause?: string
  intermediate_cause_level?: number
  position: number
  created_at: string
  updated_at: string
}