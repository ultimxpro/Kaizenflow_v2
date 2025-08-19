// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { CreateProjectModal } from './CreateProjectModal';
import { Plus, Folder, Users, ArrowRight } from 'lucide-react';
import { Header } from './Header'; // Importation du nouveau Header

interface Project {
  id: string;
  nom: string;
  description: string;
}

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { getProjectsForUser } = useDatabase();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        try {
          const userProjects = await getProjectsForUser(user.id);
          setProjects(userProjects || []);
        } catch (error) {
          console.error("Erreur lors de la récupération des projets:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProjects();
  }, [user, getProjectsForUser]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [...prevProjects, newProject]);
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white" style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #9333ea 100%)'
    }}>
      <Header onNavigate={onNavigate} />

      <main className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Vos Projets</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Projet
          </button>
        </div>

        {loading ? (
          <p className="text-center">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 bg-opacity-40 rounded-lg">
            <h3 className="text-xl font-semibold">Aucun projet pour le moment.</h3>
            <p className="text-gray-400 mt-2">Cliquez sur "Nouveau Projet" pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl shadow-lg p-6 flex flex-col justify-between cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => onNavigate('project', { projectId: project.id })}
              >
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gray-700 bg-opacity-60 rounded-lg">
                      <Folder className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{project.nom}</h3>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {project.description || "Aucune description pour ce projet."}
                  </p>
                </div>
                <div className="mt-6 flex justify-end items-center">
                   <div className="flex items-center text-sm text-gray-400 group-hover:text-blue-400 transition-colors">
                      Ouvrir le projet
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};