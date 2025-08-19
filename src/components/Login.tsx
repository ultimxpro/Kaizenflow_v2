// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

// ON N'IMPORTE PLUS LE LOGO, ON UTILISE LE CHEMIN DIRECT
// import newLogo from '../assets/Gemini_Generated_Image_6kdy0q6kdy0q6kdy.jpg'; 

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        onNavigate('dashboard');
      } else {
        await signUp(email, password, nom);
        setMessage('Inscription réussie ! Un email de confirmation vous a été envoyé.');
        setIsLogin(true);
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #9333ea 100%)'
    }}>
      <div className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            {/* ON UTILISE LE CHEMIN DIRECT VERS L'IMAGE DANS PUBLIC */}
            <img src="/leandeck-symbol.png" alt="KaizenFlow Logo" className="w-24 h-24 mx-auto rounded-full mb-4 border-4 border-gray-700 shadow-lg"/>
            <h1 className="text-3xl font-bold tracking-tight">KaizenFlow</h1>
            <p className="text-gray-300 mt-2">Votre flux vers l'amélioration continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Le reste du formulaire ne change pas */}
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="pl-10 w-full bg-gray-900 bg-opacity-70 border border-gray-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Nom complet"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full bg-gray-900 bg-opacity-70 border border-gray-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full bg-gray-900 bg-opacity-70 border border-gray-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
             {!isLogin && (
                <p className="text-xs text-gray-400 -mt-3 text-center">
                  6 caractères minimum
                </p>
              )}

            {error && (
              <div className="flex items-center p-3 bg-red-500 bg-opacity-20 rounded-lg text-red-300">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center p-3 bg-green-500 bg-opacity-20 rounded-lg text-green-300">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Se connecter' : 'Créer un compte'}</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-900 bg-opacity-30 p-4 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setMessage('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
      </div>
    </div>
  );
};