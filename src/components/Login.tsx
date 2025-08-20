import React, { useState } from 'react';
import { User, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // Simulation de connexion
        console.log('Connexion avec:', email, password);
        onNavigate('dashboard');
      } else {
        // Simulation d'inscription
        console.log('Inscription:', email, password, nom);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fond animé avec particules flottantes en nuances de gris */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Particules animées en gris, noir et couleurs du logo */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-gray-800 rounded-full animate-float-1 opacity-20"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-blue-600 rounded-full animate-float-2 opacity-30"></div>
        <div className="absolute bottom-32 left-40 w-3 h-3 bg-orange-500 rounded-full animate-float-3 opacity-25"></div>
        <div className="absolute top-60 left-1/3 w-2 h-2 bg-gray-700 rounded-full animate-float-4 opacity-30"></div>
        <div className="absolute bottom-40 right-20 w-1 h-1 bg-green-600 rounded-full animate-float-5 opacity-35"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-600 rounded-full animate-float-6 opacity-25"></div>
        <div className="absolute top-80 left-60 w-1 h-1 bg-red-500 rounded-full animate-float-1 opacity-30"></div>
        <div className="absolute bottom-60 right-40 w-2 h-2 bg-yellow-500 rounded-full animate-float-3 opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-indigo-600 rounded-full animate-float-5 opacity-25"></div>
        <div className="absolute bottom-1/4 left-2/3 w-3 h-3 bg-teal-600 rounded-full animate-float-2 opacity-20"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-pink-500 rounded-full animate-float-4 opacity-30"></div>
        <div className="absolute bottom-1/3 left-1/5 w-1 h-1 bg-cyan-500 rounded-full animate-float-6 opacity-25"></div>
        
        {/* Formes géométriques animées avec touches de couleur */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-300/15 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-200/15 to-teal-300/20 rounded-full blur-3xl animate-blob-reverse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-orange-100/20 to-yellow-200/15 rounded-full blur-2xl animate-pulse-slow"></div>
        
        {/* Lignes animées avec couleurs subtiles */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4">
                <animate attributeName="stop-opacity" values="0.4;0.7;0.4" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.3">
                <animate attributeName="stop-opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2">
                <animate attributeName="stop-opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <path d="M0,100 Q250,50 500,100 T1000,100" stroke="url(#lineGradient)" strokeWidth="2" fill="none">
            <animate attributeName="d" 
              values="M0,100 Q250,50 500,100 T1000,100;M0,120 Q250,70 500,120 T1000,120;M0,100 Q250,50 500,100 T1000,100" 
              dur="8s" repeatCount="indefinite" />
          </path>
          <path d="M0,200 Q400,150 800,200 T1600,200" stroke="url(#lineGradient)" strokeWidth="1" fill="none" opacity="0.5">
            <animate attributeName="d" 
              values="M0,200 Q400,150 800,200 T1600,200;M0,180 Q400,130 800,180 T1600,180;M0,200 Q400,150 800,200 T1600,200" 
              dur="10s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          25% { transform: translate(20px, -30px) scale(1.2); opacity: 1; }
          50% { transform: translate(-15px, -20px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(10px, 15px) scale(1.1); opacity: 0.8; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          33% { transform: translate(-25px, 20px) scale(1.3); opacity: 0.9; }
          66% { transform: translate(30px, -10px) scale(0.7); opacity: 0.6; }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          40% { transform: translate(15px, -25px) scale(1.1); opacity: 1; }
          80% { transform: translate(-20px, 10px) scale(0.9); opacity: 0.4; }
        }
        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          30% { transform: translate(-30px, -15px) scale(1.2); opacity: 0.5; }
          70% { transform: translate(25px, 20px) scale(0.8); opacity: 1; }
        }
        @keyframes float-5 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(-10px, -30px) scale(1.4); opacity: 0.9; }
        }
        @keyframes float-6 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          25% { transform: translate(35px, 15px) scale(0.9); opacity: 0.3; }
          75% { transform: translate(-20px, -25px) scale(1.3); opacity: 1; }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(30px, -50px) scale(1.1) rotate(120deg); }
          66% { transform: translate(-20px, 20px) scale(0.9) rotate(240deg); }
        }
        @keyframes blob-reverse {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(-40px, 30px) scale(1.2) rotate(-120deg); }
          66% { transform: translate(25px, -15px) scale(0.8) rotate(-240deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.1; }
        }
        .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 8s ease-in-out infinite 1s; }
        .animate-float-3 { animation: float-3 7s ease-in-out infinite 2s; }
        .animate-float-4 { animation: float-4 9s ease-in-out infinite 0.5s; }
        .animate-float-5 { animation: float-5 5s ease-in-out infinite 3s; }
        .animate-float-6 { animation: float-6 10s ease-in-out infinite 1.5s; }
        .animate-blob { animation: blob 20s ease-in-out infinite; }
        .animate-blob-reverse { animation: blob-reverse 25s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          background-size: 300% 300%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>

      <div className="max-w-md w-full relative z-10">
        {/* Card principale avec glassmorphism blanc */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/60 overflow-hidden">
          <div className="p-8">
            {/* Header avec logo agrandi */}
            <div className="text-center mb-8">
              <div className="relative mb-8">
                {/* Logo encore plus énorme */}
                <div className="w-48 h-48 mx-auto flex items-center justify-center mb-6 transform transition-all duration-500 hover:scale-105">
                  <img 
                    src="/leandeck-symbol.png" 
                    alt="Leandeck Logo" 
                    className="w-44 h-44 object-contain"
                  />
                </div>
                {/* Pas de titre Leandeck */}
              </div>
            </div>

            {/* Tabs moderne */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8 border border-gray-200">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  isLogin 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0"></div>
                <p className="text-green-700 text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Formulaire */}
            <div className="space-y-6">
              {!isLogin && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Nom complet"
                    required={!isLogin}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-300"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-blue-600 hover:via-purple-600 hover:to-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 group relative overflow-hidden"
              >
                {/* Effet de dégradé animé au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 via-orange-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-gradient-shift"></div>
                <div className="relative z-10 flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? 'Se connecter' : "S'inscrire"}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </div>

            {isLogin && (
              <div className="mt-6 text-center">
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Leandeck. Plateforme d'amélioration continue.
          </p>
        </div>
      </div>
    </div>
  );
};