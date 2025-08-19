// src/components/Header.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings } from 'lucide-react';
import newLogo from '../assets/Gemini_Generated_Image_6kdy0q6kdy0q6kdy.jpg';

interface HeaderProps {
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onNavigate('login');
  };

  return (
    <header className="bg-gray-800 bg-opacity-30 backdrop-blur-lg p-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <img src={newLogo} alt="KaizenFlow Logo" className="w-10 h-10 rounded-full border-2 border-gray-600" />
        <h1 className="text-xl font-bold text-white tracking-wider">KaizenFlow</h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-300 hidden sm:block">
          Bonjour, <span className="font-semibold">{user?.user_metadata.nom || user?.email}</span>
        </span>
        <div className="relative group">
          <button className="p-2 bg-gray-700 bg-opacity-50 rounded-full hover:bg-opacity-80 transition">
            <Settings className="w-5 h-5 text-white" />
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-95 group-hover:scale-100 origin-top-right z-50">
            <a href="#" onClick={() => onNavigate('profile')} className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition">
              <User className="w-5 h-5 mr-3" />
              Profil
            </a>
            <a href="#" onClick={handleSignOut} className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition">
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};