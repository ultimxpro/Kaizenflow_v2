// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { CreateProjectModal } from './CreateProjectModal';
import { Plus, Folder, ArrowRight, LogOut } from 'lucide-react';

// Définition du type pour un projet/kaizen
interface KaizenProject {
  id: string;
  nom: string;
  description: string;
}

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { getProjectsForUser } = useDatabase();
  const { user, signOut } = useAuth();
  const [kaizenProjects, setKaizenProjects] = useState<KaizenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchKaizenProjects = async () => {
      if (user) {
        try {
          // On utilise la fonction existante mais on stocke le résultat dans kaizenProjects
          const projects = await getProjectsForUser(user.id);
          setKaizenProjects(projects || []);
        } catch (error) {
          console.error("Erreur lors de la récupération des projets Kaizen:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchKaizenProjects();
  }, [user, getProjectsForUser]);

  const handleKaizenCreated = (newKaizen: KaizenProject) => {
    setKaizenProjects(prevProjects => [...prevProjects, newKaizen]);
  };
  
  const handleSignOut = async () => {
    await signOut();
    onNavigate('login');
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white" style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #9333ea 100%)'
    }}>
      {/* ===== HEADER RE-INTÉGRÉ ET STYLISÉ ===== */}
      <header className="bg-gray-800 bg-opacity-30 backdrop-blur-lg p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-4">
            <img src="/leandeck-symbol.png" alt="KaizenFlow Logo" className="w-10 h-10 rounded-full" />
            <h1 className="text-xl font-bold text-white tracking-wider">KaizenFlow</h1>
        </div>
        <div className="flex items-center space-x-4">
            <span className="text-gray-300 hidden sm:block">
            Bonjour, <span className="font-semibold">{user?.user_metadata.nom || user?.email}</span>
            </span>
            <button
                onClick={handleSignOut}
                className="flex items-center p-2 bg-gray-700 bg-opacity-50 rounded-full hover:bg-red-500/50 transition-colors"
                title="Déconnexion"
            >
                <LogOut className="w-5 h-5 text-white" />
            </button>
        </div>
      </header>

      {/* ===== CORPS DU DASHBOARD STYLISÉ ===== */}
      <main className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Vos Kaizen</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Kaizen
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-300">Chargement de vos projets Kaizen...</p>
        ) : kaizenProjects.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 bg-opacity-40 rounded-lg">
            <Folder className="w-12 h-12 mx-auto text-gray-500" />
            <h3 className="text-xl font-semibold mt-4">Aucun projet Kaizen pour le moment.</h3>
            <p className="text-gray-400 mt-2">Cliquez sur "Nouveau Kaizen" pour commencer votre premier projet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {kaizenProjects.map((kaizen) => (
              <div
                key={kaizen.id}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl shadow-lg p-6 flex flex-col justify-between cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => onNavigate('kaizen', { kaizenId: kaizen.id })}
              >
                <div>
                  <h3 className="text-xl font-bold text-white truncate">{kaizen.nom}</h3>
                  <p className="text-gray-300 text-sm line-clamp-2 mt-2 h-10">
                    {kaizen.description || "Aucune description pour ce projet."}
                  </p>
                </div>
                <div className="mt-6 flex justify-end items-center">
                   <div className="flex items-center text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ouvrir le Kaizen
                      <ArrowRight className="w-4 h-4 ml-2" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Le nom de la prop onProjectCreated correspond à l'ancien code */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleKaizenCreated}
      />
    </div>
  );
};