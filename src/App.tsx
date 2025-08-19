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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
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