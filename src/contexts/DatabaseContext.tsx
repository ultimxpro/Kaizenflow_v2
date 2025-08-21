// src/contexts/DatabaseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../Lib/supabase';
import { useAuth } from './AuthContext';
import { Project, A3Module, Action, ActionAssignee, ProjectMember } from '../types/database';
import { IshikawaDiagram, IshikawaBranch, IshikawaCause, IshikawaMType } from '../types/database';

// Interface pour les analyses 5Pourquoi
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
  
  // FiveWhy Analysis operations
  getFiveWhyAnalyses: (moduleId: string) => FiveWhyAnalysis[];
  createFiveWhyAnalysis: (moduleId: string, problemTitle: string) => Promise<string>;
  updateFiveWhyAnalysis: (id: string, updates: Partial<FiveWhyAnalysis>) => Promise<void>;
  deleteFiveWhyAnalysis: (id: string) => Promise<void>;

  // Ishikawa operations
  getIshikawaDiagrams: (moduleId: string) => IshikawaDiagram[];
  createIshikawaDiagram: (moduleId: string, name: string, mType: IshikawaMType) => Promise<string>;
  updateIshikawaDiagram: (id: string, updates: Partial<IshikawaDiagram>) => Promise<void>;
  deleteIshikawaDiagram: (id: string) => Promise<void>;
  
  getIshikawaBranches: (diagramId: string) => IshikawaBranch[];
  createIshikawaBranch: (diagramId: string, branchKey: string, name: string, color: string, position: number) => Promise<string>;
  updateIshikawaBranch: (id: string, updates: Partial<IshikawaBranch>) => Promise<void>;
  deleteIshikawaBranch: (id: string) => Promise<void>;
  
  getIshikawaCauses: (branchId: string) => IshikawaCause[];
  createIshikawaCause: (branchId: string, text: string, level: number, parentCauseId?: string, position?: number) => Promise<string>;
  updateIshikawaCause: (id: string, updates: Partial<IshikawaCause>) => Promise<void>;
  deleteIshikawaCause: (id: string) => Promise<void>;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

// FONCTIONS POUR LES DIAGRAMMES ISHIKAWA
const getIshikawaDiagrams = (moduleId: string): IshikawaDiagram[] => {
  return ishikawaDiagrams.filter(diagram => diagram.module_id === moduleId);
};

const createIshikawaDiagram = async (moduleId: string, name: string, mType: IshikawaMType): Promise<string> => {
  try {
    // Créer le diagramme
    const { data: diagram, error: diagramError } = await supabase
      .from('ishikawa_diagrams')
      .insert({
        module_id: moduleId,
        name,
        m_type: mType,
        problem: '',
        position: ishikawaDiagrams.filter(d => d.module_id === moduleId).length
      })
      .select()
      .single();

    if (diagramError) throw diagramError;

    // Créer les branches par défaut via la fonction SQL
    const { error: branchesError } = await supabase.rpc('create_default_branches', {
      diagram_id_param: diagram.id,
      m_type_param: mType
    });

    if (branchesError) throw branchesError;

    // Recharger les données
    await loadIshikawaData();
    
    return diagram.id;
  } catch (error) {
    console.error('Erreur lors de la création du diagramme Ishikawa:', error);
    throw error;
  }
};

const updateIshikawaDiagram = async (id: string, updates: Partial<IshikawaDiagram>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ishikawa_diagrams')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaDiagrams(prev => 
      prev.map(diagram => 
        diagram.id === id ? { ...diagram, ...updates } : diagram
      )
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du diagramme:', error);
    throw error;
  }
};

const deleteIshikawaDiagram = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ishikawa_diagrams')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaDiagrams(prev => prev.filter(diagram => diagram.id !== id));
    setIshikawaBranches(prev => prev.filter(branch => branch.diagram_id !== id));
    setIshikawaCauses(prev => {
      const branchesToDelete = ishikawaBranches.filter(b => b.diagram_id === id).map(b => b.id);
      return prev.filter(cause => !branchesToDelete.includes(cause.branch_id));
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du diagramme:', error);
    throw error;
  }
};

// FONCTIONS POUR LES BRANCHES ISHIKAWA
const getIshikawaBranches = (diagramId: string): IshikawaBranch[] => {
  return ishikawaBranches.filter(branch => branch.diagram_id === diagramId);
};

const createIshikawaBranch = async (
  diagramId: string, 
  branchKey: string, 
  name: string, 
  color: string, 
  position: number
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('ishikawa_branches')
      .insert({
        diagram_id: diagramId,
        branch_key: branchKey,
        name,
        color,
        position
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaBranches(prev => [...prev, data]);
    
    return data.id;
  } catch (error) {
    console.error('Erreur lors de la création de la branche:', error);
    throw error;
  }
};

const updateIshikawaBranch = async (id: string, updates: Partial<IshikawaBranch>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ishikawa_branches')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaBranches(prev => 
      prev.map(branch => 
        branch.id === id ? { ...branch, ...updates } : branch
      )
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la branche:', error);
    throw error;
  }
};

const deleteIshikawaBranch = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ishikawa_branches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaBranches(prev => prev.filter(branch => branch.id !== id));
    setIshikawaCauses(prev => prev.filter(cause => cause.branch_id !== id));
  } catch (error) {
    console.error('Erreur lors de la suppression de la branche:', error);
    throw error;
  }
};

// FONCTIONS POUR LES CAUSES ISHIKAWA
const getIshikawaCauses = (branchId: string): IshikawaCause[] => {
  return ishikawaCauses.filter(cause => cause.branch_id === branchId);
};

const createIshikawaCause = async (
  branchId: string, 
  text: string, 
  level: number, 
  parentCauseId?: string, 
  position: number = 0
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('ishikawa_causes')
      .insert({
        branch_id: branchId,
        parent_cause_id: parentCauseId || null,
        text,
        level,
        position
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaCauses(prev => [...prev, data]);
    
    return data.id;
  } catch (error) {
    console.error('Erreur lors de la création de la cause:', error);
    throw error;
  }
};

const updateIshikawaCause = async (id: string, updates: Partial<IshikawaCause>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ishikawa_causes')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaCauses(prev => 
      prev.map(cause => 
        cause.id === id ? { ...cause, ...updates } : cause
      )
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la cause:', error);
    throw error;
  }
};

const deleteIshikawaCause = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ishikawa_causes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Mettre à jour l'état local
    setIshikawaCauses(prev => {
      // Supprimer aussi toutes les sous-causes
      const deleteRecursive = (causeId: string): string[] => {
        const childCauses = prev.filter(c => c.parent_cause_id === causeId);
        let toDelete = [causeId];
        childCauses.forEach(child => {
          toDelete = [...toDelete, ...deleteRecursive(child.id)];
        });
        return toDelete;
      };
      
      const causesToDelete = deleteRecursive(id);
      return prev.filter(cause => !causesToDelete.includes(cause.id));
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la cause:', error);
    throw error;
  }
};



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
  const [a3Modules, setA3Modules] = useState<A3Module[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [actionAssignees, setActionAssignees] = useState<ActionAssignee[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [fiveWhyAnalyses, setFiveWhyAnalyses] = useState<FiveWhyAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
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

      // Charger les analyses 5Pourquoi
      try {
        const { data: fiveWhyData, error: fiveWhyError } = await supabase
          .from('five_why_analyses')
          .select('*')
          .order('position');
        
        if (fiveWhyError) throw fiveWhyError;
        setFiveWhyAnalyses(fiveWhyData || []);
      } catch (fiveWhyError) {
        console.log('Erreur chargement 5Pourquoi, utilisation stockage temporaire:', fiveWhyError);
        setFiveWhyAnalyses([]);
      }

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

      // 1. Récupérer d'abord les IDs des modules pour supprimer les analyses 5Pourquoi
      const { data: modulesData } = await supabase
        .from('a3_modules')
        .select('id')
        .eq('project_id', id);

      // 2. Supprimer les analyses 5Pourquoi des modules du projet
      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map(module => module.id);
        const { error: fiveWhyError } = await supabase
          .from('five_why_analyses')
          .delete()
          .in('module_id', moduleIds);
        
        if (fiveWhyError) {
          console.warn('Erreur suppression analyses 5Pourquoi:', fiveWhyError);
        }
      }

      // 3. Récupérer les IDs des actions pour supprimer les assignees
      const { data: actionsData } = await supabase
        .from('actions')
        .select('id')
        .eq('project_id', id);

      // 4. Supprimer les assignees des actions du projet
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

      // 5. Supprimer les actions du projet
      const { error: actionsError } = await supabase
        .from('actions')
        .delete()
        .eq('project_id', id);
      
      if (actionsError) {
        console.warn('Erreur suppression actions:', actionsError);
      }

      // 6. Supprimer les modules A3
      const { error: modulesError } = await supabase
        .from('a3_modules')
        .delete()
        .eq('project_id', id);
      
      if (modulesError) {
        console.warn('Erreur suppression modules:', modulesError);
      }

      // 7. Supprimer les membres du projet
      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', id);
      
      if (membersError) {
        console.warn('Erreur suppression membres:', membersError);
      }

      // 8. Supprimer le projet lui-même
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
    try {
      // 1. Supprimer d'abord les analyses 5Pourquoi liées à ce module
      const { error: fiveWhyError } = await supabase
        .from('five_why_analyses')
        .delete()
        .eq('module_id', id);
      
      if (fiveWhyError) {
        console.warn('Erreur suppression analyses 5Pourquoi:', fiveWhyError);
      }

      // 2. Supprimer le module
      const { error } = await supabase.from('a3_modules').delete().eq('id', id);
      if (error) throw error;
      
      await fetchData();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du module:', error);
      throw error;
    }
  };

  // Action operations
  const createAction = async (action: Omit<Action, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<string> => {
    const { data, error } = await supabase.from('actions').insert({
      ...action,
      created_by: user?.id
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
    const { error: assigneesError } = await supabase.from('action_assignees').delete().eq('action_id', id);
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
    const { error } = await supabase.from('action_assignees').delete()
      .eq('action_id', actionId)
      .eq('user_id', userId);
    if (error) throw error;
    await fetchData();
  };

  // FiveWhy Analysis operations - MAINTENANT AVEC SUPABASE !
  const getFiveWhyAnalyses = (moduleId: string): FiveWhyAnalysis[] => {
    return fiveWhyAnalyses.filter(analysis => analysis.module_id === moduleId);
  };

  const createFiveWhyAnalysis = async (moduleId: string, problemTitle: string): Promise<string> => {
    try {
      const { data, error } = await supabase.from('five_why_analyses').insert({
        module_id: moduleId,
        problem_title: problemTitle,
        position: fiveWhyAnalyses.filter(a => a.module_id === moduleId).length
      }).select().single();
      
      if (error) throw error;
      await fetchData();
      return data.id;
    } catch (error) {
      console.error('Error creating FiveWhy analysis:', error);
      throw error;
    }
  };

  const updateFiveWhyAnalysis = async (id: string, updates: Partial<FiveWhyAnalysis>): Promise<void> => {
    try {
      const { error } = await supabase.from('five_why_analyses').update(updates).eq('id', id);
      if (error) throw error;
      // Ne pas recharger toutes les données, juste mettre à jour localement pour de meilleures performances
      setFiveWhyAnalyses(prev => 
        prev.map(analysis => 
          analysis.id === id 
            ? { ...analysis, ...updates, updated_at: new Date().toISOString() }
            : analysis
        )
      );
    } catch (error) {
      console.error('Error updating FiveWhy analysis:', error);
      throw error;
    }
  };

  const deleteFiveWhyAnalysis = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('five_why_analyses').delete().eq('id', id);
      if (error) throw error;
      // Mettre à jour localement
      setFiveWhyAnalyses(prev => prev.filter(analysis => analysis.id !== id));
    } catch (error) {
      console.error('Error deleting FiveWhy analysis:', error);
      throw error;
    }
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
    // Fonctions FiveWhy
    getFiveWhyAnalyses,
    createFiveWhyAnalysis,
    updateFiveWhyAnalysis,
    deleteFiveWhyAnalysis,

    // Nouvelles fonctions Ishikawa
    getIshikawaDiagrams,
    createIshikawaDiagram,
    updateIshikawaDiagram,
    deleteIshikawaDiagram,
  
    getIshikawaBranches,
    createIshikawaBranch,
    updateIshikawaBranch,
    deleteIshikawaBranch,
  
    getIshikawaCauses,
    createIshikawaCause,
    updateIshikawaCause,
    deleteIshikawaCause
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};