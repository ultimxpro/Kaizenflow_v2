// src/App.tsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ProjectView } from './components/ProjectView';
import { ProfileSettings } from './components/ProfileSettings';
import { AdminDashboard } from './components/AdminDashboard';

type Page = 'login' | 'dashboard' | 'project' | 'profile' | 'admin';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('login');
    }
  }, [user, loading]);

  const navigate = (page: Page, projectId?: string) => {
    setCurrentPage(page);
    if (projectId) {
      setCurrentProjectId(projectId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-600 rounded-2xl shadow-lg flex items-center justify-center mb-6 mx-auto animate-pulse">
            <img src="/leandeck-symbol.png" alt="Leandeck Logo" className="w-10 h-10 filter brightness-0 invert" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de Leandeck...</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={navigate} />;
      case 'dashboard':
        return user ? <Dashboard onNavigate={navigate} /> : <Login onNavigate={navigate} />;
      case 'project':
        return user && currentProjectId ? (
          <ProjectView projectId={currentProjectId} onNavigate={navigate} />
        ) : (
          <Login onNavigate={navigate} />
        );
      case 'profile':
        return user ? <ProfileSettings onNavigate={navigate} /> : <Login onNavigate={navigate} />;
      case 'admin':
        return user ? <AdminDashboard onNavigate={navigate} /> : <Login onNavigate={navigate} />;
      default:
        return <Login onNavigate={navigate} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </AuthProvider>
  );
}

export default App;