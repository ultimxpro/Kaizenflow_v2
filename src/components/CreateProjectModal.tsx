// src/components/CreateProjectModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { supabase } from '../Lib/supabase';
import { X, Loader2, Lightbulb, Target, MapPin, Calendar, Sparkles, CheckCircle } from 'lucide-react';

interface CreateProjectModalProps {
 onClose: () => void;
 onNavigate: (page: string, projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onNavigate }) => {
 const [titre, setTitre] = useState('');
 const [description, setDescription] = useState('');
 const [location, setLocation] = useState('');
 const [theme, setTheme] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [loadingStep, setLoadingStep] = useState('');
 const { currentUser } = useAuth();
 const { refreshData } = useDatabase();

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!currentUser) {
     setError("Session expirée. Veuillez vous reconnecter.");
     setLoading(false);
     return;
   }
   setLoading(true);
   setError('');

   try {
     setLoadingStep('Génération du numéro Kaizen...');
     await new Promise(resolve => setTimeout(resolve, 800));

     // Génération automatique du numéro Kaizen
     const year = new Date().getFullYear();
     const month = String(new Date().getMonth() + 1).padStart(2, '0');
     const randomId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
     const kaizenNumber = `KZ-${year}-${month}-${randomId}`;

     setLoadingStep('Création de votre projet...');
     await new Promise(resolve => setTimeout(resolve, 600));

     const projectData = {
       titre: titre,
       what: description,
       location: location,
       theme: theme,
       kaizen_number: kaizenNumber,
       pilote: currentUser.id,
       statut: 'En cours',
       pdca_step: 'PLAN',
       cost: 0,
       benefit: 0,
       date_probleme: new Date().toISOString().split('T')[0]
     };

     const { data, error: insertError } = await supabase
       .from('projects')
       .insert([projectData])
       .select()
       .single();

     if (insertError) {
       throw insertError;
     }

     setLoadingStep('Initialisation du cycle PDCA...');
     await new Promise(resolve => setTimeout(resolve, 500));

     if (data && data.id) {
       setLoadingStep('Finalisation...');
       
       // Forcer le rafraîchissement du contexte
       await refreshData();
       await new Promise(resolve => setTimeout(resolve, 400));
       
       // Navigation immédiate après rafraîchissement
       onNavigate('project', data.id);
       onClose();
     } else {
       throw new Error("Le projet créé n'a pas été retrouvé après l'insertion.");
     }

   } catch (err: any) {
     console.error("Erreur détaillée de création du projet:", err);
     setError(err.message || "Une erreur est survenue. Vérifiez la console.");
     setLoading(false);
     setLoadingStep('');
   }
 };

 // Écran de chargement animé
 if (loading) {
   return (
     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="max-w-md w-full bg-white backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
         <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 p-8 text-center relative overflow-hidden">
           {/* Éléments décoratifs animés */}
           <div className="absolute inset-0">
             <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
             <div className="absolute top-8 right-6 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
             <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
             <div className="absolute bottom-4 right-4 w-2.5 h-2.5 bg-white/25 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
           </div>
           
           <div className="relative z-10">
             <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
               <Sparkles className="w-10 h-10 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
             
             <h2 className="text-2xl font-bold text-white mb-2">Création en cours...</h2>
             <p className="text-gray-300 text-sm mb-6">Nous préparons votre espace Kaizen</p>
             
             {/* Barre de progression animée */}
             <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
               <div className="h-full bg-gradient-to-r from-white to-gray-200 rounded-full animate-pulse" 
                    style={{ 
                      width: '100%',
                      animation: 'loading-bar 2.5s ease-in-out infinite'
                    }}>
               </div>
             </div>
             
             {/* Étape actuelle */}
             <div className="flex items-center justify-center space-x-2 text-white/90">
               <Loader2 className="w-4 h-4 animate-spin" />
               <span className="text-sm font-medium">{loadingStep}</span>
             </div>
           </div>
         </div>
         
         {/* Zone des étapes */}
         <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
           <div className="space-y-3">
             <div className="flex items-center space-x-3 text-sm">
               <CheckCircle className="w-4 h-4 text-green-500" />
               <span className="text-gray-600">Validation des informations</span>
             </div>
             <div className={`flex items-center space-x-3 text-sm ${loadingStep.includes('Génération') ? 'text-gray-800' : 'text-gray-400'}`}>
               {loadingStep.includes('Génération') ? (
                 <Loader2 className="w-4 h-4 animate-spin text-gray-800" />
               ) : (
                 <CheckCircle className="w-4 h-4 text-green-500" />
               )}
               <span>Génération du numéro unique</span>
             </div>
             <div className={`flex items-center space-x-3 text-sm ${loadingStep.includes('Création') ? 'text-gray-800' : 'text-gray-400'}`}>
               {loadingStep.includes('Création') ? (
                 <Loader2 className="w-4 h-4 animate-spin text-gray-800" />
               ) : loadingStep.includes('Initialisation') || loadingStep.includes('Finalisation') ? (
                 <CheckCircle className="w-4 h-4 text-green-500" />
               ) : (
                 <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
               )}
               <span>Création du projet</span>
             </div>
             <div className={`flex items-center space-x-3 text-sm ${loadingStep.includes('Initialisation') ? 'text-gray-800' : 'text-gray-400'}`}>
               {loadingStep.includes('Initialisation') ? (
                 <Loader2 className="w-4 h-4 animate-spin text-gray-800" />
               ) : loadingStep.includes('Finalisation') ? (
                 <CheckCircle className="w-4 h-4 text-green-500" />
               ) : (
                 <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
               )}
               <span>Configuration PDCA</span>
             </div>
             <div className={`flex items-center space-x-3 text-sm ${loadingStep.includes('Finalisation') ? 'text-gray-800' : 'text-gray-400'}`}>
               {loadingStep.includes('Finalisation') ? (
                 <Loader2 className="w-4 h-4 animate-spin text-gray-800" />
               ) : (
                 <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
               )}
               <span>Ouverture de l'espace de travail</span>
             </div>
           </div>
         </div>
       </div>
       
       <style jsx>{`
         @keyframes loading-bar {
           0% { width: 20%; }
           50% { width: 80%; }
           100% { width: 100%; }
         }
       `}</style>
     </div>
   );
 }

 return (
   <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
     <div className="max-w-2xl w-full bg-white backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
       {/* Header avec dégradé */}
       <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 p-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
         <div className="flex justify-between items-center relative z-10">
           <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
               <Lightbulb className="w-5 h-5 text-white" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white">Nouveau Projet Kaizen</h2>
               <p className="text-gray-300 text-sm">Créez votre projet d'amélioration continue</p>
             </div>
           </div>
           <button 
             onClick={onClose} 
             className="p-2 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all"
           >
             <X className="w-6 h-6" />
           </button>
         </div>
       </div>

       {/* Contenu du formulaire */}
       <div className="p-8">
         <form onSubmit={handleSubmit} className="space-y-6">
           {/* Titre du projet */}
           <div className="space-y-2">
             <label htmlFor="titre" className="flex items-center text-sm font-semibold text-gray-700">
               <Target className="w-4 h-4 mr-2 text-gray-500" />
               Titre du Kaizen *
             </label>
             <input
               id="titre"
               type="text"
               value={titre}
               onChange={(e) => setTitre(e.target.value)}
               className="w-full bg-gray-50/70 backdrop-blur-sm border border-gray-200/70 rounded-xl py-3 px-4 focus:ring-2 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-all text-gray-900 placeholder-gray-500"
               placeholder="Ex: Réduire les temps d'attente à la machine X"
               required
             />
           </div>

           {/* Description du problème */}
           <div className="space-y-2">
             <label htmlFor="description" className="flex items-center text-sm font-semibold text-gray-700">
               <Lightbulb className="w-4 h-4 mr-2 text-gray-500" />
               Description du problème
             </label>
             <textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               rows={3}
               className="w-full bg-gray-50/70 backdrop-blur-sm border border-gray-200/70 rounded-xl py-3 px-4 focus:ring-2 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-all text-gray-900 placeholder-gray-500"
               placeholder="Décrivez brièvement le problème ou l'opportunité d'amélioration..."
             />
           </div>

           {/* Localisation et thème */}
           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label htmlFor="location" className="flex items-center text-sm font-semibold text-gray-700">
                 <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                 Localisation
               </label>
               <input
                 id="location"
                 type="text"
                 value={location}
                 onChange={(e) => setLocation(e.target.value)}
                 className="w-full bg-gray-50/70 backdrop-blur-sm border border-gray-200/70 rounded-xl py-3 px-4 focus:ring-2 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-all text-gray-900 placeholder-gray-500"
                 placeholder="Atelier, bureau, zone..."
               />
             </div>
             <div className="space-y-2">
               <label htmlFor="theme" className="flex items-center text-sm font-semibold text-gray-700">
                 <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                 Thème
               </label>
               <select
                 id="theme"
                 value={theme}
                 onChange={(e) => setTheme(e.target.value)}
                 className="w-full bg-gray-50/70 backdrop-blur-sm border border-gray-200/70 rounded-xl py-3 px-4 focus:ring-2 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-all text-gray-900"
               >
                 <option value="">Sélectionner un thème</option>
                 <option value="Qualité">Qualité</option>
                 <option value="Productivité">Productivité</option>
                 <option value="Sécurité">Sécurité</option>
                 <option value="Coût">Coût</option>
                 <option value="Délai">Délai</option>
                 <option value="Environnement">Environnement</option>
                 <option value="Maintenance">Maintenance</option>
                 <option value="Organisation">Organisation</option>
               </select>
             </div>
           </div>

           {/* Info auto-génération */}
           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4">
             <div className="flex items-start space-x-3">
               <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                 <Target className="w-4 h-4 text-blue-600" />
               </div>
               <div>
                 <h4 className="text-sm font-semibold text-blue-900 mb-1">Informations automatiques</h4>
                 <p className="text-xs text-blue-700">
                   Un numéro Kaizen unique sera généré automatiquement. 
                   Le projet démarrera en phase PLAN du cycle PDCA.
                 </p>
               </div>
             </div>
           </div>
           
           {error && (
             <div className="bg-red-50 border border-red-200 rounded-xl p-4">
               <p className="text-sm text-red-700 font-medium">{error}</p>
             </div>
           )}

           {/* Boutons d'action */}
           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
             <button 
               type="button" 
               onClick={onClose} 
               className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
             >
               Annuler
             </button>
             <button
               type="submit"
               disabled={loading || !titre.trim()}
               className="flex items-center justify-center bg-gradient-to-r from-gray-800 to-gray-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-gray-900 hover:to-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
             >
               <Lightbulb className="w-5 h-5 mr-2" />
               Créer et Ouvrir
             </button>
           </div>
         </form>
       </div>
     </div>
   </div>
 );
};