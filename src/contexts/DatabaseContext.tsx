// src/contexts/DatabaseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../Lib/supabase';
import { useAuth } from './AuthContext';
import { Project, A3Module, Action, ActionAssignee, ProjectMember } from '../types/database';

interface DatabaseContextType {
  projects: Project[];
  a3Modules: A3Module[];
  actions: Action[];
  actionAssignees: ActionAssignee[];
  projectMembers: ProjectMember[];
  loading: boolean;
  
  // Project operations
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Project member operations
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
  
  // Action assignee operations
  addActionAssignee: (actionId: string, userId: string, isLeader: boolean) => Promise<void>;
  removeActionAssignee: (actionId: string, userId: string) => Promise<void>;
  
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [a3Modules, setA3Modules] = useState<A3Module[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [actionAssignees, setActionAssignees] = useState<ActionAssignee[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setProjects([]);
      setA3Modules([]);
      setActions([]);
      setActionAssignees([]);
      setProjectMembers([]);
      setLoading(false);
      return;
    }

    try {
      const [
        { data: projectsData, error: projectsError },
        { data: modulesData, error: modulesError },
        { data: actionsData, error: actionsError },
        { data: assigneesData, error: assigneesError },
        { data: membersData, error: membersError }
      ] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('a3_modules').select('*').order('position'),
        supabase.from('actions').select('*').order('created_at', { ascending: false }),
        supabase.from('action_assignees').select('*'),
        supabase.from('project_members').select('*')
      ]);

      if (projectsError) throw projectsError;
      if (modulesError) throw modulesError;
      if (actionsError) throw actionsError;
      if (assigneesError) throw assigneesError;
      if (membersError) throw membersError;

      setProjects(projectsData || []);
      setA3Modules(modulesData || []);
      setActions(actionsData || []);
      setActionAssignees(assigneesData || []);
      setProjectMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Project operations
  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const { data, error } = await supabase.from('projects').insert(project).select().single();
    if (error) throw error;
    await fetchData();
    return data.id;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { error } = await supabase.from('projects').update(updates).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const deleteProject = async (id: string) => {
    try {
      console.log('🗑️ Suppression du projet:', id);

      // 1. Récupérer d'abord les IDs des actions pour supprimer les assignees
      const { data: actionsData } = await supabase
        .from('actions')
        .select('id')
        .eq('project_id', id);

      // 2. Supprimer les assignees des actions du projet
      if (actionsData && actionsData.length > 0) {
        const actionIds = actionsData.map(action => action.id);
        const { error: assigneesError } = await supabase
          .from('action_assignees')
          .delete()
          .in('action_id', actionIds);
        
        if (assigneesError) {
          console.warn('Erreur suppression assignees:', assigneesError);
        }
      }

      // 3. Supprimer les actions du projet
      const { error: actionsError } = await supabase
        .from('actions')
        .delete()
        .eq('project_id', id);
      
      if (actionsError) {
        console.warn('Erreur suppression actions:', actionsError);
      }

      // 4. Supprimer les modules A3
      const { error: modulesError } = await supabase
        .from('a3_modules')
        .delete()
        .eq('project_id', id);
      
      if (modulesError) {
        console.warn('Erreur suppression modules:', modulesError);
      }

      // 5. Supprimer les membres du projet
      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', id);
      
      if (membersError) {
        console.warn('Erreur suppression membres:', membersError);
      }

      // 6. Supprimer le projet lui-même
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (projectError) throw projectError;

      console.log('✅ Projet supprimé avec succès');
      await fetchData();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du projet:', error);
      throw error;
    }
  };

  // Project member operations
  const addProjectMember = async (projectId: string, userId: string, role: 'Leader' | 'Membre') => {
    const { error } = await supabase.from('project_members').insert({ 
      project_id: projectId, 
      user_id: userId, 
      role_in_project: role 
    });

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
    const { data, error } = await supabase.from('actions').insert({
      ...action,
      created_by: user.id
    }).select().single();
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
    // Supprimer d'abord les assignees
    await supabase.from('action_assignees').delete().eq('action_id', id);
    
    // Puis supprimer l'action
    const { error } = await supabase.from('actions').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // Action assignee operations
  const addActionAssignee = async (actionId: string, userId: string, isLeader: boolean) => {
    const { error } = await supabase.from('action_assignees').insert({
      action_id: actionId,
      user_id: userId,
      is_leader: isLeader
    });
    if (error) throw error;
    await fetchData();
  };

  const removeActionAssignee = async (actionId: string, userId: string) => {
    const { error } = await supabase.from('action_assignees')
      .delete()
      .eq('action_id', actionId)
      .eq('user_id', userId);
    if (error) throw error;
    await fetchData();
  };

  const value = {
    projects,
    a3Modules,
    actions,
    actionAssignees,
    projectMembers,
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
    refreshData,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

// À ajouter dans votre src/contexts/DatabaseContext.tsx

// 1. Ajoutez ces interfaces au début du fichier après les imports existants
interface FiveWhyAnalysis {
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

// 2. Ajoutez ces méthodes dans l'interface DatabaseContextType
interface DatabaseContextType {
  // ... vos méthodes existantes ...
  
  // FiveWhy Analysis operations
  getFiveWhyAnalyses: (moduleId: string) => FiveWhyAnalysis[];
  createFiveWhyAnalysis: (moduleId: string, problemTitle: string) => Promise<string>;
  updateFiveWhyAnalysis: (id: string, updates: Partial<FiveWhyAnalysis>) => Promise<void>;
  deleteFiveWhyAnalysis: (id: string) => Promise<void>;
}

// 3. Dans le composant DatabaseProvider, ajoutez ces états
export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ... vos états existants ...
  const [fiveWhyAnalyses, setFiveWhyAnalyses] = useState<FiveWhyAnalysis[]>([]);

  // 4. Modifiez fetchData pour inclure les analyses 5Pourquoi
  const fetchData = async () => {
    if (!user) {
      setProjects([]);
      setA3Modules([]);
      setActions([]);
      setActionAssignees([]);
      setProjectMembers([]);
      setFiveWhyAnalyses([]);
      setLoading(false);
      return;
    }

    try {
      const [
        { data: projectsData, error: projectsError },
        { data: modulesData, error: modulesError },
        { data: actionsData, error: actionsError },
        { data: assigneesData, error: assigneesError },
        { data: membersData, error: membersError },
        { data: fiveWhyData, error: fiveWhyError }
      ] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('a3_modules').select('*').order('position'),
        supabase.from('actions').select('*').order('created_at', { ascending: false }),
        supabase.from('action_assignees').select('*'),
        supabase.from('project_members').select('*'),
        supabase.from('five_why_analyses').select('*').order('position')
      ]);

      if (projectsError) throw projectsError;
      if (modulesError) throw modulesError;
      if (actionsError) throw actionsError;
      if (assigneesError) throw assigneesError;
      if (membersError) throw membersError;
      if (fiveWhyError) console.warn('FiveWhy table not found:', fiveWhyError);

      setProjects(projectsData || []);
      setA3Modules(modulesData || []);
      setActions(actionsData || []);
      setActionAssignees(assigneesData || []);
      setProjectMembers(membersData || []);
      setFiveWhyAnalyses(fiveWhyData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 5. Ajoutez ces nouvelles fonctions avant le return du value
  
  // FiveWhy Analysis operations
  const getFiveWhyAnalyses = (moduleId: string): FiveWhyAnalysis[] => {
    return fiveWhyAnalyses.filter(analysis => analysis.module_id === moduleId);
  };

  const createFiveWhyAnalysis = async (moduleId: string, problemTitle: string): Promise<string> => {
    try {
      // Générer un ID temporaire
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Créer l'analyse temporairement en mémoire
      const newAnalysis: FiveWhyAnalysis = {
        id: tempId,
        module_id: moduleId,
        problem_title: problemTitle,
        position: fiveWhyAnalyses.filter(a => a.module_id === moduleId).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setFiveWhyAnalyses(prev => [...prev, newAnalysis]);
      
      // TODO: Remplacer par un vrai appel Supabase quand la table existe
      // const { data, error } = await supabase.from('five_why_analyses').insert({
      //   module_id: moduleId,
      //   problem_title: problemTitle,
      //   position: newAnalysis.position
      // }).select().single();
      // if (error) throw error;
      // await fetchData();
      // return data.id;
      
      return tempId;
    } catch (error) {
      console.error('Error creating FiveWhy analysis:', error);
      throw error;
    }
  };

  const updateFiveWhyAnalysis = async (id: string, updates: Partial<FiveWhyAnalysis>): Promise<void> => {
    try {
      // Mettre à jour en mémoire
      setFiveWhyAnalyses(prev => 
        prev.map(analysis => 
          analysis.id === id 
            ? { ...analysis, ...updates, updated_at: new Date().toISOString() }
            : analysis
        )
      );
      
      // TODO: Remplacer par un vrai appel Supabase quand la table existe
      // const { error } = await supabase.from('five_why_analyses').update(updates).eq('id', id);
      // if (error) throw error;
      // await fetchData();
    } catch (error) {
      console.error('Error updating FiveWhy analysis:', error);
      throw error;
    }
  };

  const deleteFiveWhyAnalysis = async (id: string): Promise<void> => {
    try {
      // Supprimer en mémoire
      setFiveWhyAnalyses(prev => prev.filter(analysis => analysis.id !== id));
      
      // TODO: Remplacer par un vrai appel Supabase quand la table existe
      // const { error } = await supabase.from('five_why_analyses').delete().eq('id', id);
      // if (error) throw error;
      // await fetchData();
    } catch (error) {
      console.error('Error deleting FiveWhy analysis:', error);
      throw error;
    }
  };

  // 6. Ajoutez les nouvelles fonctions dans le value
  const value = {
    projects,
    a3Modules,
    actions,
    actionAssignees,
    projectMembers,
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
    refreshData,
    // Nouvelles fonctions FiveWhy
    getFiveWhyAnalyses,
    createFiveWhyAnalysis,
    updateFiveWhyAnalysis,
    deleteFiveWhyAnalysis,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};