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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fond animé avec particules flottantes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Particules animées */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/20 rounded-full animate-float-1"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-300/30 rounded-full animate-float-2"></div>
        <div className="absolute bottom-32 left-40 w-3 h-3 bg-blue-300/20 rounded-full animate-float-3"></div>
        <div className="absolute top-60 left-1/3 w-2 h-2 bg-white/15 rounded-full animate-float-4"></div>
        <div className="absolute bottom-40 right-20 w-1 h-1 bg-purple-200/25 rounded-full animate-float-5"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-blue-200/20 rounded-full animate-float-6"></div>
        
        {/* Formes géométriques animées */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/15 to-purple-600/15 rounded-full blur-3xl animate-blob-reverse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-white/5 to-purple-300/10 rounded-full blur-2xl animate-pulse-slow"></div>
        
        {/* Lignes animées */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3">
                <animate attributeName="stop-opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1">
                <animate attributeName="stop-opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite" />
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
      `}</style>

      <div className="max-w-md w-full relative z-10">
        {/* Card principale avec glassmorphism amélioré */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            {/* Header avec logo agrandi */}
            <div className="text-center mb-8">
              <div className="relative mb-8">
                {/* Logo très grand sans contour */}
                <div className="w-32 h-32 mx-auto flex items-center justify-center mb-6 transform transition-all duration-500 hover:scale-105">
                  <img 
                    src="/leandeck-symbol.png" 
                    alt="Leandeck Logo" 
                    className="w-28 h-28 object-contain drop-shadow-2xl"
                  />
                </div>
                {/* Pas de titre Leandeck */}
              </div>
            </div>

            {/* Tabs moderne */}
            <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 mb-8 border border-white/20">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  isLogin 
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center space-x-3 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                <p className="text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center space-x-3 backdrop-blur-sm">
                <div className="w-5 h-5 bg-green-400 rounded-full flex-shrink-0"></div>
                <p className="text-green-200 text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Formulaire */}
            <div className="space-y-6">
              {!isLogin && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Nom complet"
                    required={!isLogin}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 group backdrop-blur-sm"
              >
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
              </button>
            </div>

            {isLogin && (
              <div className="mt-6 text-center">
                <a href="#" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            © 2025 Leandeck. Plateforme d'amélioration continue.
          </p>
        </div>
      </div>
    </div>
  );
};