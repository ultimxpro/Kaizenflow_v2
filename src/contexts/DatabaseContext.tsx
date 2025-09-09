// src/contexts/DatabaseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../Lib/supabase';
import { useAuth } from './AuthContext';
import {
  Project,
  A3Module,
  Action,
  ActionAssignee,
  ProjectMember,
  FiveWhyAnalysis,
  IshikawaDiagram,
  IshikawaBranch,
  IshikawaCause,
  IshikawaMType,
  VSMMap,
  VSMElement,
  VSMConnection,
  VSMSnapshot,
  VSMComment,
  FiveSChecklist,
  FiveSItem,
  FiveSAssignment,
  FiveSPhoto,
  FiveSPhotoComment,
  FiveSHistory,
  FiveSProgressStats,
  FiveSChecklistStats,
  FiveSCategory
} from '../types/database';

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

  // VSM operations
  getVSMMap: (moduleId: string) => VSMMap | null;
  createVSMMap: (moduleId: string, title?: string) => Promise<string>;
  updateVSMMap: (id: string, updates: Partial<VSMMap>) => Promise<void>;
  deleteVSMMap: (id: string) => Promise<void>;

  getVSMElements: (mapId: string) => VSMElement[];
  createVSMElement: (mapId: string, element: Omit<VSMElement, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateVSMElement: (id: string, updates: Partial<VSMElement>) => Promise<void>;
  deleteVSMElement: (id: string) => Promise<void>;

  getVSMConnections: (mapId: string) => VSMConnection[];
  createVSMConnection: (mapId: string, connection: Omit<VSMConnection, 'id' | 'created_at'>) => Promise<string>;
  updateVSMConnection: (id: string, updates: Partial<VSMConnection>) => Promise<void>;
  deleteVSMConnection: (id: string) => Promise<void>;

  getVSMSnapshots: (mapId: string) => VSMSnapshot[];
  createVSMSnapshot: (mapId: string, name: string, description?: string, data?: any) => Promise<string>;
  deleteVSMSnapshot: (id: string) => Promise<void>;

  getVSMComments: (mapId: string) => VSMComment[];
  createVSMComment: (mapId: string, content: string, elementId?: string, x?: number, y?: number) => Promise<string>;
  updateVSMComment: (id: string, updates: Partial<VSMComment>) => Promise<void>;
  deleteVSMComment: (id: string) => Promise<void>;

  // 5S operations
  getFiveSChecklists: (moduleId: string) => FiveSChecklist[];
  createFiveSChecklist: (moduleId: string, title: string, description?: string, area?: string) => Promise<string>;
  updateFiveSChecklist: (id: string, updates: Partial<FiveSChecklist>) => Promise<void>;
  deleteFiveSChecklist: (id: string) => Promise<void>;

  getFiveSItems: (checklistId: string) => FiveSItem[];
  createFiveSItem: (checklistId: string, category: FiveSCategory, title: string, description?: string) => Promise<string>;
  updateFiveSItem: (id: string, updates: Partial<FiveSItem>) => Promise<void>;
  deleteFiveSItem: (id: string) => Promise<void>;

  getFiveSAssignments: (itemId: string) => FiveSAssignment[];
  createFiveSAssignment: (itemId: string, userId: string, role: 'responsible' | 'collaborator' | 'reviewer') => Promise<string>;
  updateFiveSAssignment: (id: string, updates: Partial<FiveSAssignment>) => Promise<void>;
  removeFiveSAssignment: (itemId: string, userId: string) => Promise<void>;

  getFiveSPhotos: (itemId?: string, checklistId?: string) => FiveSPhoto[];
  createFiveSPhoto: (photo: Omit<FiveSPhoto, 'id' | 'uploaded_at'>) => Promise<string>;
  updateFiveSPhoto: (id: string, updates: Partial<FiveSPhoto>) => Promise<void>;
  deleteFiveSPhoto: (id: string) => Promise<void>;

  getFiveSPhotoComments: (photoId: string) => FiveSPhotoComment[];
  createFiveSPhotoComment: (photoId: string, comment: string) => Promise<string>;
  updateFiveSPhotoComment: (id: string, updates: Partial<FiveSPhotoComment>) => Promise<void>;
  deleteFiveSPhotoComment: (id: string) => Promise<void>;

  getFiveSHistory: (checklistId?: string, itemId?: string) => FiveSHistory[];
  createFiveSHistory: (history: Omit<FiveSHistory, 'id' | 'created_at'>) => Promise<string>;

  getFiveSProgressStats: (checklistId: string) => FiveSProgressStats[];
  calculateFiveSProgress: (checklistId: string) => Promise<FiveSChecklistStats>;

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
  console.log('🔍 DEBUG: DatabaseProvider rendering');
  const { user } = useAuth();
  console.log('🔍 DEBUG: DatabaseProvider - user:', user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [a3Modules, setA3Modules] = useState<A3Module[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [actionAssignees, setActionAssignees] = useState<ActionAssignee[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [fiveWhyAnalyses, setFiveWhyAnalyses] = useState<FiveWhyAnalysis[]>([]);
  const [ishikawaDiagrams, setIshikawaDiagrams] = useState<IshikawaDiagram[]>([]);
  const [ishikawaBranches, setIshikawaBranches] = useState<IshikawaBranch[]>([]);
  const [ishikawaCauses, setIshikawaCauses] = useState<IshikawaCause[]>([]);
  const [vsmMaps, setVsmMaps] = useState<VSMMap[]>([]);
  const [vsmElements, setVsmElements] = useState<VSMElement[]>([]);
  const [vsmConnections, setVsmConnections] = useState<VSMConnection[]>([]);
  const [vsmSnapshots, setVsmSnapshots] = useState<VSMSnapshot[]>([]);
  const [vsmComments, setVsmComments] = useState<VSMComment[]>([]);

  // États pour le module 5S
  const [fiveSChecklists, setFiveSChecklists] = useState<FiveSChecklist[]>([]);
  const [fiveSItems, setFiveSItems] = useState<FiveSItem[]>([]);
  const [fiveSAssignments, setFiveSAssignments] = useState<FiveSAssignment[]>([]);
  const [fiveSPhotos, setFiveSPhotos] = useState<FiveSPhoto[]>([]);
  const [fiveSPhotoComments, setFiveSPhotoComments] = useState<FiveSPhotoComment[]>([]);
  const [fiveSHistory, setFiveSHistory] = useState<FiveSHistory[]>([]);
  const [fiveSProgressStats, setFiveSProgressStats] = useState<FiveSProgressStats[]>([]);

  const [loading, setLoading] = useState(false);
  console.log('🔍 DEBUG: DatabaseProvider initial state - loading:', loading);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [
        { data: projectsData, error: projectsError },
        { data: modulesData, error: modulesError },
        { data: actionsData, error: actionsError },
        { data: assigneesData, error: assigneesError },
        { data: membersData, error: membersError },
        { data: fiveWhyData, error: fiveWhyError },
        { data: ishikawaDiagramsData, error: ishikawaDiagramsError },
        { data: ishikawaBranchesData, error: ishikawaBranchesError },
        { data: ishikawaCausesData, error: ishikawaCausesError },
        { data: vsmMapsData, error: vsmMapsError },
        { data: vsmElementsData, error: vsmElementsError },
        { data: vsmConnectionsData, error: vsmConnectionsError },
        { data: vsmSnapshotsData, error: vsmSnapshotsError },
        { data: vsmCommentsData, error: vsmCommentsError },
        { data: fiveSChecklistsData, error: fiveSChecklistsError },
        { data: fiveSItemsData, error: fiveSItemsError },
        { data: fiveSAssignmentsData, error: fiveSAssignmentsError },
        { data: fiveSPhotosData, error: fiveSPhotosError },
        { data: fiveSPhotoCommentsData, error: fiveSPhotoCommentsError },
        { data: fiveSHistoryData, error: fiveSHistoryError },
        { data: fiveSProgressStatsData, error: fiveSProgressStatsError }
      ] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('a3_modules').select('*').order('position'),
        supabase.from('actions').select('*').order('created_at', { ascending: false }),
        supabase.from('action_assignees').select('*'),
        supabase.from('project_members').select('*'),
        supabase.from('five_why_analyses').select('*').order('position'),
        supabase.from('ishikawa_diagrams').select('*').order('position'),
        supabase.from('ishikawa_branches').select('*').order('position'),
        supabase.from('ishikawa_causes').select('*').order('position'),
        supabase.from('vsm_maps').select('*').order('created_at', { ascending: false }),
        supabase.from('vsm_elements').select('*').order('created_at'),
        supabase.from('vsm_connections').select('*').order('created_at'),
        supabase.from('vsm_snapshots').select('*').order('created_at', { ascending: false }),
        supabase.from('vsm_comments').select('*').order('created_at'),
        supabase.from('five_s_checklists').select('*').order('created_at'),
        supabase.from('five_s_items').select('*').order('position'),
        supabase.from('five_s_assignments').select('*'),
        supabase.from('five_s_photos').select('*').order('uploaded_at'),
        supabase.from('five_s_photo_comments').select('*').order('created_at'),
        supabase.from('five_s_history').select('*').order('created_at', { ascending: false }),
        supabase.from('five_s_progress_stats').select('*').order('date', { ascending: false })
      ]);

      if (projectsError) throw projectsError;
      if (modulesError) throw modulesError;
      if (actionsError) throw actionsError;
      if (assigneesError) throw assigneesError;
      if (membersError) throw membersError;
      if (fiveWhyError) throw fiveWhyError;
      if (ishikawaDiagramsError) throw ishikawaDiagramsError;
      if (ishikawaBranchesError) throw ishikawaBranchesError;
      if (ishikawaCausesError) throw ishikawaCausesError;
      if (vsmMapsError) throw vsmMapsError;
      if (vsmElementsError) throw vsmElementsError;
      if (vsmConnectionsError) throw vsmConnectionsError;
      if (vsmSnapshotsError) throw vsmSnapshotsError;
      if (vsmCommentsError) throw vsmCommentsError;
      if (fiveSChecklistsError) throw fiveSChecklistsError;
      if (fiveSItemsError) throw fiveSItemsError;
      if (fiveSAssignmentsError) throw fiveSAssignmentsError;
      if (fiveSPhotosError) throw fiveSPhotosError;
      if (fiveSPhotoCommentsError) throw fiveSPhotoCommentsError;
      if (fiveSHistoryError) throw fiveSHistoryError;
      if (fiveSProgressStatsError) throw fiveSProgressStatsError;

      setProjects(projectsData || []);
      setA3Modules(modulesData || []);
      setActions(actionsData || []);
      setActionAssignees(assigneesData || []);
      setProjectMembers(membersData || []);
      setFiveWhyAnalyses(fiveWhyData || []);
      setIshikawaDiagrams(ishikawaDiagramsData || []);
      setIshikawaBranches(ishikawaBranchesData || []);
      setIshikawaCauses(ishikawaCausesData || []);
      setVsmMaps(vsmMapsData || []);
      setVsmElements(vsmElementsData || []);
      setVsmConnections(vsmConnectionsData || []);
      setVsmSnapshots(vsmSnapshotsData || []);
      setVsmComments(vsmCommentsData || []);

      // Assignation des données 5S
      setFiveSChecklists(fiveSChecklistsData || []);
      setFiveSItems(fiveSItemsData || []);
      setFiveSAssignments(fiveSAssignmentsData || []);
      setFiveSPhotos(fiveSPhotosData || []);
      setFiveSPhotoComments(fiveSPhotoCommentsData || []);
      setFiveSHistory(fiveSHistoryData || []);
      setFiveSProgressStats(fiveSProgressStatsData || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setProjects([]);
      setA3Modules([]);
      setActions([]);
      setActionAssignees([]);
      setProjectMembers([]);
      setFiveWhyAnalyses([]);
      setIshikawaDiagrams([]);
      setIshikawaBranches([]);
      setIshikawaCauses([]);
      setVsmMaps([]);
      setVsmElements([]);
      setVsmConnections([]);
      setVsmSnapshots([]);
      setVsmComments([]);

      // Réinitialisation des états 5S
      setFiveSChecklists([]);
      setFiveSItems([]);
      setFiveSAssignments([]);
      setFiveSPhotos([]);
      setFiveSPhotoComments([]);
      setFiveSHistory([]);
      setFiveSProgressStats([]);
    }
  }, [user]);

  // PROJECT OPERATIONS
  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;

    setProjects(prev => [data, ...prev]);
    return data.id;
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setProjects(prev =>
      prev.map(project =>
        project.id === id ? { ...project, ...updates } : project
      )
    );
  };

  const deleteProject = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setProjects(prev => prev.filter(project => project.id !== id));
  };

  // PROJECT MEMBER OPERATIONS
  const addProjectMember = async (projectId: string, userId: string, role: 'Leader' | 'Membre'): Promise<void> => {
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role_in_project: role
      })
      .select()
      .single();

    if (error) throw error;

    setProjectMembers(prev => [...prev, data]);
  };

  const updateProjectMember = async (id: string, updates: Partial<ProjectMember>): Promise<void> => {
    const { error } = await supabase
      .from('project_members')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setProjectMembers(prev =>
      prev.map(member =>
        member.id === id ? { ...member, ...updates } : member
      )
    );
  };

  const removeProjectMember = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setProjectMembers(prev => prev.filter(member => member.id !== id));
  };

  // A3 MODULE OPERATIONS
  const createA3Module = async (module: Omit<A3Module, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const { data, error } = await supabase
      .from('a3_modules')
      .insert(module)
      .select()
      .single();

    if (error) throw error;

    setA3Modules(prev => [...prev, data]);
    return data.id;
  };

  const updateA3Module = async (id: string, updates: Partial<A3Module>): Promise<void> => {
    const { error } = await supabase
      .from('a3_modules')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setA3Modules(prev =>
      prev.map(module =>
        module.id === id ? { ...module, ...updates } : module
      )
    );
  };

  const deleteA3Module = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('a3_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setA3Modules(prev => prev.filter(module => module.id !== id));
  };

  // ACTION OPERATIONS
  const createAction = async (action: Omit<Action, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('actions')
      .insert({
        ...action,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    setActions(prev => [data, ...prev]);
    return data.id;
  };

  const updateAction = async (id: string, updates: Partial<Action>): Promise<void> => {
    const { error } = await supabase
      .from('actions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setActions(prev =>
      prev.map(action =>
        action.id === id ? { ...action, ...updates } : action
      )
    );
  };

  const deleteAction = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setActions(prev => prev.filter(action => action.id !== id));
  };

  // ACTION ASSIGNEE OPERATIONS
  const addActionAssignee = async (actionId: string, userId: string, isLeader: boolean): Promise<void> => {
    const { data, error } = await supabase
      .from('action_assignees')
      .insert({
        action_id: actionId,
        user_id: userId,
        is_leader: isLeader
      })
      .select()
      .single();

    if (error) throw error;

    setActionAssignees(prev => [...prev, data]);
  };

  const removeActionAssignee = async (actionId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('action_assignees')
      .delete()
      .match({ action_id: actionId, user_id: userId });

    if (error) throw error;

    setActionAssignees(prev =>
      prev.filter(assignee =>
        !(assignee.action_id === actionId && assignee.user_id === userId)
      )
    );
  };

  // FIVE WHY ANALYSIS OPERATIONS
  const getFiveWhyAnalyses = (moduleId: string): FiveWhyAnalysis[] => {
    return fiveWhyAnalyses.filter(analysis => analysis.module_id === moduleId);
  };

  const createFiveWhyAnalysis = async (moduleId: string, problemTitle: string): Promise<string> => {
    const { data, error } = await supabase
      .from('five_why_analyses')
      .insert({
        module_id: moduleId,
        problem_title: problemTitle,
        position: fiveWhyAnalyses.filter(a => a.module_id === moduleId).length
      })
      .select()
      .single();

    if (error) throw error;

    setFiveWhyAnalyses(prev => [...prev, data]);
    return data.id;
  };

  const updateFiveWhyAnalysis = async (id: string, updates: Partial<FiveWhyAnalysis>): Promise<void> => {
    const { error } = await supabase
      .from('five_why_analyses')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setFiveWhyAnalyses(prev =>
      prev.map(analysis =>
        analysis.id === id ? { ...analysis, ...updates } : analysis
      )
    );
  };

  const deleteFiveWhyAnalysis = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('five_why_analyses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setFiveWhyAnalyses(prev => prev.filter(analysis => analysis.id !== id));
  };

  // ISHIKAWA OPERATIONS
  
  const getIshikawaDiagrams = (moduleId: string): IshikawaDiagram[] => {
    return ishikawaDiagrams.filter(diagram => diagram.module_id === moduleId);
  };

  const createIshikawaDiagram = async (moduleId: string, name: string, mType: IshikawaMType): Promise<string> => {
    try {
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

      const { error: branchesError } = await supabase.rpc('create_default_branches', {
        diagram_id_param: diagram.id,
        m_type_param: mType
      });

      if (branchesError) throw branchesError;

      await fetchData();
      
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

      setIshikawaBranches(prev => prev.filter(branch => branch.id !== id));
      setIshikawaCauses(prev => prev.filter(cause => cause.branch_id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la branche:', error);
      throw error;
    }
  };

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

      setIshikawaCauses(prev => {
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

  // VSM OPERATIONS

  // VSM Map operations
  const getVSMMap = (moduleId: string): VSMMap | null => {
    return vsmMaps.find(map => map.module_id === moduleId) || null;
  };

  const createVSMMap = async (moduleId: string, title?: string): Promise<string> => {
    const { data, error } = await supabase
      .from('vsm_maps')
      .insert({
        module_id: moduleId,
        title: title || 'Carte VSM',
        customer_demand: 1000,
        opening_time: 480,
        time_unit: 'minutes'
      })
      .select()
      .single();

    if (error) throw error;

    setVsmMaps(prev => [data, ...prev]);
    return data.id;
  };

  const updateVSMMap = async (id: string, updates: Partial<VSMMap>): Promise<void> => {
    const { error } = await supabase
      .from('vsm_maps')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setVsmMaps(prev =>
      prev.map(map =>
        map.id === id ? { ...map, ...updates } : map
      )
    );
  };

  const deleteVSMMap = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vsm_maps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setVsmMaps(prev => prev.filter(map => map.id !== id));
    // Note: VSM elements and connections don't have map_id in their interface
    // They are filtered by their relationships in the database queries
    setVsmElements(prev => prev.filter(element => {
      // Filter logic will be handled by the database query
      return true; // Temporary fix - will be properly implemented
    }));
    setVsmConnections(prev => prev.filter(connection => {
      // Filter logic will be handled by the database query
      return true; // Temporary fix - will be properly implemented
    }));
    setVsmSnapshots(prev => prev.filter(snapshot => snapshot.map_id !== id));
    setVsmComments(prev => prev.filter(comment => comment.map_id !== id));
  };

  // VSM Element operations
  const getVSMElements = (mapId: string): VSMElement[] => {
    // Note: VSM elements are filtered by map_id in the database query
    // For now, return all elements (will be filtered by the calling component)
    return vsmElements;
  };

  const createVSMElement = async (mapId: string, element: Omit<VSMElement, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
    const { data, error } = await supabase
      .from('vsm_elements')
      .insert({
        map_id: mapId,
        element_type: element.type,
        name: element.data?.nom,
        x_position: element.x,
        y_position: element.y,
        width: element.width,
        height: element.height,
        cycle_time: element.data?.tempsCycle,
        setup_time: element.data?.tempsChangt,
        availability_rate: element.data?.tauxDispo,
        operator_count: element.data?.nbOperateurs,
        scrap_rate: element.data?.rebut,
        stock_quantity: element.data?.quantite,
        frequency: element.data?.frequence,
        details: element.data?.details,
        content: element.data?.contenu
      })
      .select()
      .single();

    if (error) throw error;

    setVsmElements(prev => [...prev, data]);
    return data.id;
  };

  const updateVSMElement = async (id: string, updates: Partial<VSMElement>): Promise<void> => {
    const { error } = await supabase
      .from('vsm_elements')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setVsmElements(prev =>
      prev.map(element =>
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const deleteVSMElement = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vsm_elements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setVsmElements(prev => prev.filter(element => element.id !== id));
    setVsmConnections(prev => prev.filter(connection =>
      connection.from.elementId !== id && connection.to.elementId !== id
    ));
  };

  // VSM Connection operations
  const getVSMConnections = (mapId: string): VSMConnection[] => {
    // Note: VSM connections are filtered by map_id in the database query
    // For now, return all connections (will be filtered by the calling component)
    return vsmConnections;
  };

  const createVSMConnection = async (mapId: string, connection: Omit<VSMConnection, 'id' | 'created_at'>): Promise<string> => {
    const { data, error } = await supabase
      .from('vsm_connections')
      .insert({
        map_id: mapId,
        ...connection
      })
      .select()
      .single();

    if (error) throw error;

    setVsmConnections(prev => [...prev, data]);
    return data.id;
  };

  const updateVSMConnection = async (id: string, updates: Partial<VSMConnection>): Promise<void> => {
    const { error } = await supabase
      .from('vsm_connections')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setVsmConnections(prev =>
      prev.map(connection =>
        connection.id === id ? { ...connection, ...updates } : connection
      )
    );
  };

  const deleteVSMConnection = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vsm_connections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setVsmConnections(prev => prev.filter(connection => connection.id !== id));
  };

  // VSM Snapshot operations
  const getVSMSnapshots = (mapId: string): VSMSnapshot[] => {
    return vsmSnapshots.filter(snapshot => snapshot.map_id === mapId);
  };

  const createVSMSnapshot = async (mapId: string, name: string, description?: string, data?: any): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data: snapshot, error } = await supabase
      .from('vsm_snapshots')
      .insert({
        map_id: mapId,
        name,
        description,
        snapshot_data: data || {},
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    setVsmSnapshots(prev => [snapshot, ...prev]);
    return snapshot.id;
  };

  const deleteVSMSnapshot = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vsm_snapshots')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setVsmSnapshots(prev => prev.filter(snapshot => snapshot.id !== id));
  };

  // VSM Comment operations
  const getVSMComments = (mapId: string): VSMComment[] => {
    return vsmComments.filter(comment => comment.map_id === mapId);
  };

  const createVSMComment = async (mapId: string, content: string, elementId?: string, x?: number, y?: number): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('vsm_comments')
      .insert({
        map_id: mapId,
        element_id: elementId || null,
        user_id: user.id,
        content,
        x_position: x,
        y_position: y
      })
      .select()
      .single();

    if (error) throw error;

    setVsmComments(prev => [...prev, data]);
    return data.id;
  };

  const updateVSMComment = async (id: string, updates: Partial<VSMComment>): Promise<void> => {
    const { error } = await supabase
      .from('vsm_comments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setVsmComments(prev =>
      prev.map(comment =>
        comment.id === id ? { ...comment, ...updates } : comment
      )
    );
  };

  const deleteVSMComment = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vsm_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setVsmComments(prev => prev.filter(comment => comment.id !== id));
  };

  const refreshData = async (): Promise<void> => {
    await fetchData();
  };

  const contextValue: DatabaseContextType = {
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

    getFiveWhyAnalyses,
    createFiveWhyAnalysis,
    updateFiveWhyAnalysis,
    deleteFiveWhyAnalysis,

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
    deleteIshikawaCause,

    getVSMMap,
    createVSMMap,
    updateVSMMap,
    deleteVSMMap,

    getVSMElements,
    createVSMElement,
    updateVSMElement,
    deleteVSMElement,

    getVSMConnections,
    createVSMConnection,
    updateVSMConnection,
    deleteVSMConnection,

    getVSMSnapshots,
    createVSMSnapshot,
    deleteVSMSnapshot,

    getVSMComments,
    createVSMComment,
    updateVSMComment,
    deleteVSMComment,

    // 5S operations (to be implemented)
    getFiveSChecklists: (moduleId: string) => fiveSChecklists.filter(c => c.module_id === moduleId),
    createFiveSChecklist: async (moduleId: string, title: string, description?: string, area?: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('five_s_checklists')
        .insert({
          module_id: moduleId,
          title,
          description,
          area,
          created_by: user.id
        })
        .select()
        .single();
      if (error) throw error;
      setFiveSChecklists(prev => [...prev, data]);
      return data.id;
    },
    updateFiveSChecklist: async (id: string, updates: Partial<FiveSChecklist>) => {
      const { error } = await supabase
        .from('five_s_checklists')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setFiveSChecklists(prev =>
        prev.map(c => c.id === id ? { ...c, ...updates } : c)
      );
    },
    deleteFiveSChecklist: async (id: string) => {
      const { error } = await supabase
        .from('five_s_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFiveSChecklists(prev => prev.filter(c => c.id !== id));
      setFiveSItems(prev => prev.filter(i => i.checklist_id !== id));
      setFiveSPhotos(prev => prev.filter(p => p.checklist_id !== id));
    },

    getFiveSItems: (checklistId: string) => fiveSItems.filter(i => i.checklist_id === checklistId),
    createFiveSItem: async (checklistId: string, category: FiveSCategory, title: string, description?: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('five_s_items')
        .insert({
          checklist_id: checklistId,
          category,
          title,
          description,
          created_by: user.id
        })
        .select()
        .single();
      if (error) throw error;
      setFiveSItems(prev => [...prev, data]);
      return data.id;
    },
    updateFiveSItem: async (id: string, updates: Partial<FiveSItem>) => {
      const { error } = await supabase
        .from('five_s_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setFiveSItems(prev =>
        prev.map(i => i.id === id ? { ...i, ...updates } : i)
      );
    },
    deleteFiveSItem: async (id: string) => {
      const { error } = await supabase
        .from('five_s_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFiveSItems(prev => prev.filter(i => i.id !== id));
      setFiveSAssignments(prev => prev.filter(a => a.item_id !== id));
      setFiveSPhotos(prev => prev.filter(p => p.item_id !== id));
    },

    getFiveSAssignments: (itemId: string) => fiveSAssignments.filter(a => a.item_id === itemId),
    createFiveSAssignment: async (itemId: string, userId: string, role: 'responsible' | 'collaborator' | 'reviewer') => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('five_s_assignments')
        .insert({
          item_id: itemId,
          user_id: userId,
          role,
          assigned_by: user.id
        })
        .select()
        .single();
      if (error) throw error;
      setFiveSAssignments(prev => [...prev, data]);
      return data.id;
    },
    updateFiveSAssignment: async (id: string, updates: Partial<FiveSAssignment>) => {
      const { error } = await supabase
        .from('five_s_assignments')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setFiveSAssignments(prev =>
        prev.map(a => a.id === id ? { ...a, ...updates } : a)
      );
    },
    removeFiveSAssignment: async (itemId: string, userId: string) => {
      const { error } = await supabase
        .from('five_s_assignments')
        .delete()
        .match({ item_id: itemId, user_id: userId });
      if (error) throw error;
      setFiveSAssignments(prev =>
        prev.filter(a => !(a.item_id === itemId && a.user_id === userId))
      );
    },

    getFiveSPhotos: (itemId?: string, checklistId?: string) =>
      fiveSPhotos.filter(p =>
        (itemId && p.item_id === itemId) ||
        (checklistId && p.checklist_id === checklistId)
      ),
    createFiveSPhoto: async (photo: Omit<FiveSPhoto, 'id' | 'uploaded_at'>) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('five_s_photos')
        .insert({
          ...photo,
          uploaded_by: user.id
        })
        .select()
        .single();
      if (error) throw error;
      setFiveSPhotos(prev => [...prev, data]);
      return data.id;
    },
    updateFiveSPhoto: async (id: string, updates: Partial<FiveSPhoto>) => {
      const { error } = await supabase
        .from('five_s_photos')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setFiveSPhotos(prev =>
        prev.map(p => p.id === id ? { ...p, ...updates } : p)
      );
    },
    deleteFiveSPhoto: async (id: string) => {
      const { error } = await supabase
        .from('five_s_photos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFiveSPhotos(prev => prev.filter(p => p.id !== id));
      setFiveSPhotoComments(prev => prev.filter(c => c.photo_id !== id));
    },

    getFiveSPhotoComments: (photoId: string) => fiveSPhotoComments.filter(c => c.photo_id === photoId),
    createFiveSPhotoComment: async (photoId: string, comment: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('five_s_photo_comments')
        .insert({
          photo_id: photoId,
          user_id: user.id,
          comment
        })
        .select()
        .single();
      if (error) throw error;
      setFiveSPhotoComments(prev => [...prev, data]);
      return data.id;
    },
    updateFiveSPhotoComment: async (id: string, updates: Partial<FiveSPhotoComment>) => {
      const { error } = await supabase
        .from('five_s_photo_comments')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setFiveSPhotoComments(prev =>
        prev.map(c => c.id === id ? { ...c, ...updates } : c)
      );
    },
    deleteFiveSPhotoComment: async (id: string) => {
      const { error } = await supabase
        .from('five_s_photo_comments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFiveSPhotoComments(prev => prev.filter(c => c.id !== id));
    },

    getFiveSHistory: (checklistId?: string, itemId?: string) =>
      fiveSHistory.filter(h =>
        (checklistId && h.checklist_id === checklistId) ||
        (itemId && h.item_id === itemId)
      ),
    createFiveSHistory: async (history: Omit<FiveSHistory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('five_s_history')
        .insert(history)
        .select()
        .single();
      if (error) throw error;
      setFiveSHistory(prev => [...prev, data]);
      return data.id;
    },

    getFiveSProgressStats: (checklistId: string) =>
      fiveSProgressStats.filter(s => s.checklist_id === checklistId),
    calculateFiveSProgress: async (checklistId: string) => {
      // Implementation will calculate progress statistics
      const items = fiveSItems.filter(i => i.checklist_id === checklistId);
      const total = items.length;
      const completed = items.filter(i => i.status === 'completed').length;
      const inProgress = items.filter(i => i.status === 'in_progress').length;
      const pending = items.filter(i => i.status === 'pending').length;

      return {
        checklist_id: checklistId,
        total_items: total,
        completed_items: completed,
        completion_percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        categories_stats: [], // Will be implemented
        overdue_items: 0, // Will be implemented
        assigned_items: items.filter(i => i.assigned_to).length,
        photos_count: fiveSPhotos.filter(p => p.checklist_id === checklistId).length
      };
    },

    refreshData
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};