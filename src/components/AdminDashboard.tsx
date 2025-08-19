import React, { useState, useEffect } from 'react';
import { supabase } from '../Lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Users, FolderOpen, Activity, TrendingUp, Settings,
  ChevronLeft, Search, Filter, MoreVertical, Mail, Phone,
  Calendar, Clock, CheckCircle, XCircle, AlertTriangle,
  Download, Upload, Trash2, Edit, Eye, BarChart, PieChart, Plus, Save
} from 'lucide-react';

// --- INTERFACES ---
interface Stats {
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalActions: number;
  completedActions: number;
}

interface UserData {
  id: string;
  email: string;
  nom: string;
  role: 'user' | 'admin';
  department?: string;
  created_at: string;
  projects_count: number;
  actions_count: number;
}

interface ProjectData {
  id: string;
  titre: string;
  kaizen_number: string;
  statut: string;
  pdca_step: string;
  pilote_nom: string;
  created_at: string;
  members_count: number;
  actions_count: number;
  cost: number;
  benefit: number;
}

// --- DÉFINITION DE LA MODALE DE CRÉATION D'UTILISATEUR ---
// Ce composant est défini ici, en dehors et avant le composant principal.
const CreateUserModal: React.FC<{ onClose: () => void; onUserCreated: () => void; }> = ({ onClose, onUserCreated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (password.length < 6) {
    setError("Le mot de passe doit contenir au moins 6 caractères.");
    return;
  }
  setError('');
  setLoading(true);

  try {
    // ON APPELLE LA EDGE FUNCTION au lieu de supabase.auth.admin
    const { data, error: invokeError } = await supabase.functions.invoke('create-user', {
      body: { email, password, nom, role },
    });

    if (invokeError) throw invokeError;

    // Gérer les erreurs spécifiques retournées par la fonction elle-même
    if (data.error) {
      // Si l'erreur vient d'un manque de permission, on l'affiche
      if (data.error.includes("droits d'administrateur requis")) {
        setError("Votre session a peut-être expiré. Veuillez vous reconnecter.");
      } else {
        setError(data.error);
      }
      setLoading(false);
      return;
    }

    onUserCreated();
    onClose();
  } catch (err: any) {
    setError(err.message || "Une erreur est survenue lors de l'appel de la fonction.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Créer un nouvel utilisateur</h3>
          </div>
          <div className="p-6 space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet" required className="w-full p-2 border rounded" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full p-2 border rounded" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required className="w-full p-2 border rounded" />
            <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'admin')} className="w-full p-2 border rounded">
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
export const AdminDashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalActions: 0,
    completedActions: 0,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false); 


  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const [
        { count: usersCount },
        { count: projectsCount },
        { count: activeProjectsCount },
        { count: completedProjectsCount },
        { count: actionsCount },
        { count: completedActionsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('statut', 'En cours'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('statut', 'Terminé'),
        supabase.from('actions').select('*', { count: 'exact', head: true }),
        supabase.from('actions').select('*', { count: 'exact', head: true }).eq('status', 'Fait'),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalProjects: projectsCount || 0,
        activeProjects: activeProjectsCount || 0,
        completedProjects: completedProjectsCount || 0,
        totalActions: actionsCount || 0,
        completedActions: completedActionsCount || 0,
      });

      // Fetch users with their project and action counts
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          *,
          projects:projects!pilote(count),
          actions:actions!created_by(count)
        `);

      if (usersData) {
        setUsers(usersData.map(user => ({
          ...user,
          projects_count: user.projects?.[0]?.count || 0,
          actions_count: user.actions?.[0]?.count || 0,
        })));
      }

      // Fetch projects with details
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          *,
          pilote:profiles!pilote(nom),
          members:project_members(count),
          actions:actions(count)
        `);

      if (projectsData) {
        setProjects(projectsData.map(project => ({
          ...project,
          pilote_nom: project.pilote?.nom || 'Non assigné',
          members_count: project.members?.[0]?.count || 0,
          actions_count: project.actions?.[0]?.count || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = () => {
    fetchData(); // Rafraîchir la liste des utilisateurs
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const exportData = async (type: 'users' | 'projects') => {
    const data = type === 'users' ? users : projects;
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-4">Vous n'avez pas les permissions pour accéder à cette page</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Retour
              </button>
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-purple-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">Administration</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'users'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'projects'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projets
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'settings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Paramètres
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Utilisateurs</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                      </div>
                      <Users className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Projets actifs</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
                        <p className="text-xs text-gray-500">
                          {stats.completedProjects} terminés
                        </p>
                      </div>
                      <FolderOpen className="w-10 h-10 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Actions</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalActions}</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progression</span>
                            <span>{stats.totalActions > 0 ? Math.round((stats.completedActions / stats.totalActions) * 100) : 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${stats.totalActions > 0 ? (stats.completedActions / stats.totalActions) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <Activity className="w-10 h-10 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Activité récente</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {projects.slice(0, 5).map(project => (
                        <div key={project.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              project.statut === 'En cours' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <p className="font-medium">{project.titre}</p>
                              <p className="text-sm text-gray-500">
                                {project.kaizen_number} • Pilote: {project.pilote_nom}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.pdca_step === 'PLAN' ? 'bg-blue-100 text-blue-700' :
                            project.pdca_step === 'DO' ? 'bg-green-100 text-green-700' :
                            project.pdca_step === 'CHECK' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {project.pdca_step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Gestion des utilisateurs</h2>
                    <div className="flex space-x-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Rechercher..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <button
                        onClick={() => exportData('users')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </button>
                       <button
                        onClick={() => setShowCreateUserModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvel utilisateur
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projets</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users
                        .filter(user => 
                          user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.nom}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={user.role}
                                onChange={(e) => updateUserRole(user.id, e.target.value as 'user' | 'admin')}
                                className="text-sm border-gray-300 rounded-lg"
                              >
                                <option value="user">Utilisateur</option>
                                <option value="admin">Administrateur</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.department || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.projects_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.actions_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Tous les projets</h2>
                    <button
                      onClick={() => exportData('projects')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Projet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pilote
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PDCA
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Membres
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          B/C
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Créé le
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map(project => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{project.titre}</p>
                              <p className="text-sm text-gray-500">{project.kaizen_number}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.pilote_nom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              project.statut === 'En cours'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {project.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              project.pdca_step === 'PLAN' ? 'bg-blue-100 text-blue-700' :
                              project.pdca_step === 'DO' ? 'bg-green-100 text-green-700' :
                              project.pdca_step === 'CHECK' ? 'bg-orange-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {project.pdca_step}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.members_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.actions_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              (project.benefit - project.cost) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(project.benefit - project.cost).toLocaleString('fr-FR')} €
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(project.created_at).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">Paramètres système</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-4">Configuration générale</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom de l'organisation
                          </label>
                          <input
                            type="text"
                            defaultValue="KaizenFlow"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email de contact
                          </label>
                          <input
                            type="email"
                            defaultValue="admin@kaizenflow.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Limites et quotas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Max projets par utilisateur
                          </label>
                          <input
                            type="number"
                            defaultValue="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Max membres par projet
                          </label>
                          <input
                            type="number"
                            defaultValue="20"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Maintenance</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Mode maintenance</p>
                            <p className="text-sm text-gray-500">
                              Empêche les utilisateurs non-admin d'accéder à l'application
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        
                        <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Nettoyer les données anciennes
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Enregistrer les paramètres
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Détails de l'utilisateur</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{selectedUser.nom}</h4>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                        selectedUser.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Département</p>
                      <p className="font-medium">{selectedUser.department || 'Non défini'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Membre depuis</p>
                      <p className="font-medium">
                        {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Projets</p>
                      <p className="font-medium">{selectedUser.projects_count}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Actions créées</p>
                      <p className="font-medium">{selectedUser.actions_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODALE DE CRÉATION */}
        {showCreateUserModal && (
          <CreateUserModal
            onClose={() => setShowCreateUserModal(false)}
            onUserCreated={handleUserCreated}
          />
        )}
      </div>
    </div>
  );
};