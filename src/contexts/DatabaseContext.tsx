// src/contexts/DatabaseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, FiveWhyAnalysis } from '../Lib/supabase';
import { useAuth } from './AuthContext';

// Types locaux pour éviter les conflits d'import
interface Project {
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

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_in_project: 'Leader' | 'Membre';
  created_at: string;
}

interface A3Module {
  id: string;
  project_id: string;
  quadrant: 'PLAN' | 'DO' | 'CHECK' | 'ACT';
  tool_type: string;
  content: any;
  position: number;
  titre?: string;
  date_echeance?: string;
  created_at: string;
  updated_at: string;
}

interface Action {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: 'simple' | 'securisation' | 'poka-yoke';
  start_date?: string;
  due_date?: string;
  status: 'À faire' | 'Fait';
  effort: number;
  gain: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ActionAssignee {
  id: string;
  action_id: string;
  user_id: string;
  is_leader: boolean;
  created_at: string;
}

interface Persona {
  id: string;
  nom: string;
  fonction: string;
  photo?: string;
}

interface DatabaseContextType {
  projects: Project[];
  projectMembers: ProjectMember[];
  a3Modules: A3Module[];
  actions: Action[];
  actionAssignees: ActionAssignee[];
  personas: Persona[];
  fiveWhyAnalyses: FiveWhyAnalysis[];
  loading: boolean;
  
  // Project operations
  createProject: (titre: string, what?: string) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Project members operations
  addProjectMember: (projectId: string, userId: string, role: 'Leader' | 'Membre') => Promise<void>;
  updateProjectMember: (id: string, updates: Partial<ProjectMember>) => Promise<void>;
  removeProjectMember: (id: string) => Promise<void>;
  
  // A3 Module operations
  createA3Module: (module: Omit<A3Module, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateA3Module: (id: string, updates: Partial<A3Module>) => Promise<void>;
  deleteA3Module: (id: string) => Promise<void>;
  
  // Action operations
  createAction: (action: Omit<Action, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<string>;
  updateAction: (id: string, updates: Partial<Action>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  
  // Action assignees operations
  addActionAssignee: (actionId: string, userId: string, isLeader?: boolean) => Promise<void>;
  removeActionAssignee: (actionId: string, userId: string) => Promise<void>;
  
  // Five Why operations
  getFiveWhyAnalyses: (moduleId: string) => FiveWhyAnalysis[];
  createFiveWhyAnalysis: (moduleId: string, problemTitle: string) => Promise<string>;
  updateFiveWhyAnalysis: (id: string, updates: Partial<FiveWhyAnalysis>) => Promise<void>;
  deleteFiveWhyAnalysis: (id: string) => Promise<void>;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [a3Modules, setA3Modules] = useState<A3Module[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [actionAssignees, setActionAssignees] = useState<ActionAssignee[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [fiveWhyAnalyses, setFiveWhyAnalyses] = useState<FiveWhyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: membersData, error: membersError } = await supabase.from('project_members').select('*');
      if (membersError) throw membersError;
      setProjectMembers(membersData || []);

      const { data: modulesData, error: modulesError } = await supabase.from('a3_modules').select('*').order('position', { ascending: true });
      if (modulesError) throw modulesError;
      setA3Modules(modulesData || []);

      const { data: actionsData, error: actionsError } = await supabase.from('actions').select('*').order('created_at', { ascending: false });
      if (actionsError) throw actionsError;
      setActions(actionsData || []);

      const { data: assigneesData, error: assigneesError } = await supabase.from('action_assignees').select('*');
      if (assigneesError) throw assigneesError;
      setActionAssignees(assigneesData || []);

      const { data: fiveWhyData, error: fiveWhyError } = await supabase
        .from('five_why_analyses')
        .select('*')
        .order('position', { ascending: true });
      if (fiveWhyError) throw fiveWhyError;
      setFiveWhyAnalyses(fiveWhyData || []);

      setPersonas([]);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Project operations
  const createProject = async (titre: string, what?: string): Promise<string> => {
    if (!user) throw new Error('Utilisateur non authentifié');

    const currentYear = new Date().getFullYear();
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true }).ilike('kaizen_number', `KZN-${currentYear}-%`);
    const nextNumber = (count || 0) + 1;
    const kaizenNumber = `KZN-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

    const projectData = {
      titre,
      what,
      kaizen_number: kaizenNumber,
      pilote: user.id,
      statut: 'En cours' as const,
      pdca_step: 'PLAN' as const,
      cost: 0,
      benefit: 0,
      date_creation: new Date().toISOString()
    };

    const { data, error } = await supabase.from('projects').insert(projectData).select().single();
    if (error) throw error;
    
    await addProjectMember(data.id, user.id, 'Leader');
    return data.id;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { error } = await supabase.from('projects').update(updates).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // Project members operations
  const addProjectMember = async (projectId: string, userId: string, role: 'Leader' | 'Membre') => {
    const { error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role_in_project: role });

    if (error && error.code !== '23505') {
      console.error("Erreur lors de l'ajout du membre:", error);
      throw error;
    }
    
    await fetchData();
  };

  const updateProjectMember = async (id: string, updates: Partial<ProjectMember>) => {
    const { error } = await supabase.from('project_members').update(updates).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const removeProjectMember = async (id: string) => {
    const { error } = await supabase.from('project_members').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // A3 Module operations
  const createA3Module = async (module: Omit<A3Module, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const { data, error } = await supabase.from('a3_modules').insert(module).select().single();
    if (error) throw error;
    await fetchData();
    return data.id;
  };

  const updateA3Module = async (id: string, updates: Partial<A3Module>) => {
    const { error } = await supabase.from('a3_modules').update(updates).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const deleteA3Module = async (id: string) => {
    const { error } = await supabase.from('a3_modules').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // Action operations
  const createAction = async (action: Omit<Action, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase.from('actions').insert({ ...action, created_by: user.id }).select().single();
    if (error) throw error;
    await fetchData();
    return data.id;
  };

  const updateAction = async (id: string, updates: Partial<Action>) => {
    const { error } = await supabase.from('actions').update(updates).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const deleteAction = async (id: string) => {
    const { error } = await supabase.from('actions').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // Action assignees operations
  const addActionAssignee = async (actionId: string, userId: string, isLeader: boolean = false) => {
    const { error } = await supabase.from('action_assignees').insert({ action_id: actionId, user_id: userId, is_leader: isLeader });
    if (error && error.code !== '23505') throw error;
    await fetchData();
  };

  const removeActionAssignee = async (actionId: string, userId: string) => {
    const { error } = await supabase.from('action_assignees').delete().eq('action_id', actionId).eq('user_id', userId);
    if (error) throw error;
    await fetchData();
  };

  // Five Why operations
  const getFiveWhyAnalyses = (moduleId: string): FiveWhyAnalysis[] => {
    return fiveWhyAnalyses.filter(analysis => analysis.module_id === moduleId);
  };

  const createFiveWhyAnalysis = async (moduleId: string, problemTitle: string): Promise<string> => {
    const existingAnalyses = fiveWhyAnalyses.filter(a => a.module_id === moduleId);
    const position = existingAnalyses.length;
    
    const { data, error } = await supabase
      .from('five_why_analyses')
      .insert({
        module_id: moduleId,
        problem_title: problemTitle,
        position
      })
      .select()
      .single();
      
    if (error) throw error;
    await fetchData();
    return data.id;
  };

  const updateFiveWhyAnalysis = async (id: string, updates: Partial<FiveWhyAnalysis>): Promise<void> => {
    const { error } = await supabase
      .from('five_why_analyses')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
    await fetchData();
  };

  const deleteFiveWhyAnalysis = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('five_why_analyses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    await fetchData();
  };

  const refreshData = async () => {
    await fetchData();
  };

  const value = {
    projects,
    projectMembers,
    a3Modules,
    actions,
    actionAssignees,
    personas,
    fiveWhyAnalyses,
    loading,
    createProject,
    updateProject,
    deleteProject,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    createA3Module,
    updateA3Module,
    deleteA3Module,
    createAction,
    updateAction,
    deleteAction,
    addActionAssignee,
    removeActionAssignee,
    getFiveWhyAnalyses,
    createFiveWhyAnalysis,
    updateFiveWhyAnalysis,
    deleteFiveWhyAnalysis,
    refreshData
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};