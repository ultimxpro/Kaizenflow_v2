// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../Lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  nom: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  department?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  signedAvatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  currentUser: Profile | null;
  signedAvatarUrl: string | null;
  users: Profile[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nom: string) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshAvatarUrls: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const generateSignedUrls = async (profiles: Profile[]): Promise<Profile[]> => {
  console.log('🖼️ GÉNÉRATION URLs SIGNÉES - Début');
  console.log('Profils à traiter:', profiles.length);
  
  // Test si le bucket fonctionne maintenant
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('avatars');
    if (bucketError) {
      console.error('🗂️ Bucket toujours inaccessible:', bucketError.message);
      console.log('🌐 Utilisation des URLs publiques en fallback');
    } else {
      console.log('✅ Bucket avatars maintenant accessible !', bucketData?.name);
    }
  } catch (e) {
    console.error('🗂️ Erreur API:', e);
  }
  
  // Dans tous les cas, utiliser les URLs publiques pour l'instant
  return profiles.map(profile => ({
    ...profile,
    signedAvatarUrl: profile.avatar_url ? 
      supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl : 
      undefined
  }));
  
  const profilesWithUrls = await Promise.all(
    profiles.map(async (profile, index) => {
      console.log(`\n👤 Profil ${index + 1}/${profiles.length}:`, profile.nom);
      console.log('Avatar URL original:', profile.avatar_url);
      
      if (profile.avatar_url) {
        try {
          // Nettoyer le chemin de l'avatar
          let avatarPath = profile.avatar_url;
          
          // Si l'URL contient déjà le chemin complet, extraire juste le chemin relatif
          if (avatarPath.includes('/avatars/')) {
            avatarPath = avatarPath.substring(avatarPath.indexOf('/avatars/') + '/avatars/'.length);
          }
          
          console.log('Chemin nettoyé:', avatarPath);
          
          // Test si le fichier existe
          try {
            const { data: fileExists, error: existsError } = await supabase.storage
              .from('avatars')
              .list('', { search: avatarPath });
            console.log('📁 Fichier existe?', fileExists?.length ? 'OUI' : 'NON', existsError);
          } catch (e) {
            console.error('📁 Erreur test existence:', e);
          }
          
          // Générer l'URL signée avec durée plus longue (24h)
          const { data, error } = await supabase.storage
            .from('avatars')
            .createSignedUrl(avatarPath, 86400); // 24 heures au lieu de 1h
          
          if (error) {
            console.error('❌ Erreur génération URL signée:', error);
            console.log('🔄 Tentative avec URL publique...');
            
            // Fallback: tenter avec URL publique
            try {
              const { data: publicData } = supabase.storage
                .from('avatars')
                .getPublicUrl(avatarPath);
              
              if (publicData.publicUrl) {
                console.log('🌐 URL publique générée:', publicData.publicUrl.substring(0, 50) + '...');
                return { ...profile, signedAvatarUrl: publicData.publicUrl };
              }
            } catch (publicError) {
              console.error('❌ Erreur URL publique:', publicError);
            }
            
            return profile; // Retourner le profil sans URL signée
          }
          
          if (data && data.signedUrl) {
            console.log('✅ URL signée générée:', data.signedUrl.substring(0, 50) + '...');
            return { ...profile, signedAvatarUrl: data.signedUrl };
          }
        } catch (err) {
          console.error('❌ Erreur lors du traitement de l\'avatar:', err);
        }
      } else {
        console.log('ℹ️ Pas d\'avatar pour ce profil');
      }
      
      return profile;
    })
  );
  
  console.log('🖼️ GÉNÉRATION URLs SIGNÉES - Fin');
  console.log('Profils avec URLs:', profilesWithUrls.filter(p => p.signedAvatarUrl).length);
  
  return profilesWithUrls;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('🔍 DEBUG: AuthProvider rendering');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  console.log('🔍 DEBUG: AuthProvider initial state - loading:', loading);

  // Régénération automatique des URLs signées toutes les 20 heures
  useEffect(() => {
    if (users.length === 0) return;

    const regenerateUrls = async () => {
      console.log('🔄 Régénération automatique des URLs signées...');
      const refreshedUsers = await generateSignedUrls(users);
      setUsers(refreshedUsers);
      
      if (profile) {
        const [refreshedProfile] = await generateSignedUrls([profile]);
        setProfile(refreshedProfile);
      }
    };

    // Régénérer toutes les 20 heures (en millisecondes)
    const interval = setInterval(regenerateUrls, 20 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [users, profile]);

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event);
    
    // Gestion des tokens expirés ou invalides
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      if (!session) {
        console.log('Session expirée ou token invalide, nettoyage...');
        setUser(null);
        setProfile(null);
        setSignedAvatarUrl(null);
        setUsers([]);
        
        // Nettoyer le localStorage
        try {
          localStorage.removeItem('sb-shnmlscbewdwyuefoqyr-auth-token');
          localStorage.removeItem('supabase.auth.token');
        } catch (e) {
          console.log('Nettoyage localStorage échoué (normal en mode privé)');
        }
        setLoading(false);
        return;
      }
    }

    const authUser = session?.user ?? null;
    setUser(authUser);
    if (authUser) {
      fetchProfileAndUsers(authUser.id);
    } else {
      setProfile(null);
      setSignedAvatarUrl(null);
      setUsers([]);
    }
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
  
  useEffect(() => {
    setSignedAvatarUrl(profile?.signedAvatarUrl || null);
  }, [profile]);

  const fetchProfileAndUsers = async (userId: string) => {
    try {
      // Récupère le profil de l'utilisateur connecté et tous les autres utilisateurs en parallèle
      const [{ data: profileData, error: profileError }, { data: allUsersData, error: usersError }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('profiles').select('*')
      ]);

      if (profileError) console.error("Error fetching profile:", profileError);
      if (usersError) console.error("Error fetching all users:", usersError);

      // Debug: afficher les données brutes
      console.log('🔍 DEBUG Profiles bruts:', { profileData, allUsersData: allUsersData?.slice(0, 3) });
      console.log('🔍 Exemple avatar_url:', allUsersData?.find(u => u.avatar_url)?.avatar_url);

      if (profileData) {
          // Enrichir et définir le profil de l'utilisateur courant
         const [enrichedProfile] = await generateSignedUrls([profileData]);
          setProfile(enrichedProfile);
      }
      if (allUsersData) {
          // Enrichir et définir la liste de tous les utilisateurs
          const enrichedUsers = await generateSignedUrls(allUsersData);
          setUsers(enrichedUsers);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des profils:', error);
    }
  };

  const fetchOrCreateProfile = async (user: User) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ id: user.id, email: user.email!, nom: user.user_metadata?.nom || user.email!.split('@')[0] })
          .select()
          .single();
        if (createError) throw createError;
        data = newProfile;
      } else if (error) {
        throw error;
      }
      // Après la création, on recharge tout
      await fetchProfileAndUsers(data.id);
    } catch (error) {
      console.error('Erreur lors de la récupération/création du profil:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await fetchOrCreateProfile(data.user);
    }
  };

  const signUp = async (email: string, password: string, nom: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom } },
    });
    if (error) throw error;
  };

  // CORRECTION : Gestion robuste des erreurs de logout
  const signOut = async () => {
    try {
      // Tentative de déconnexion côté serveur
      const { error } = await supabase.auth.signOut();
      
      // Si l'erreur est "session_not_found", c'est OK, la session n'existe déjà plus
      if (error && error.message.includes('session_not_found')) {
        console.log('Session déjà expirée côté serveur, nettoyage local seulement');
      } else if (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // On continue quand même le nettoyage local
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la déconnexion:', error);
      // On continue quand même le nettoyage local
    } finally {
      // TOUJOURS nettoyer l'état local, même en cas d'erreur
      setUser(null);
      setProfile(null);
      setSignedAvatarUrl(null);
      setUsers([]);
      
      // Nettoyer le localStorage de Supabase manuellement si nécessaire
      try {
        localStorage.removeItem('sb-shnmlscbewdwyuefoqyr-auth-token');
      } catch (e) {
        console.log('Nettoyage localStorage échoué (normal en mode privé)');
      }
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    // Après mise à jour, on recharge tout pour mettre à jour les URLs
    await fetchProfileAndUsers(data.id);
  };

  const refreshAvatarUrls = async () => {
    console.log('🔄 Régénération manuelle des URLs signées...');
    try {
      if (users.length > 0) {
        const refreshedUsers = await generateSignedUrls(users);
        setUsers(refreshedUsers);
      }
      
      if (profile) {
        const [refreshedProfile] = await generateSignedUrls([profile]);
        setProfile(refreshedProfile);
      }
      
      console.log('✅ URLs signées régénérées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la régénération des URLs:', error);
    }
  };

  const value = {
    user,
    profile,
    currentUser: profile,
    signedAvatarUrl,
    users,
    loading,
    signIn,
    signUp,
    signOut,
    logout: signOut,
    updateProfile,
    refreshAvatarUrls,
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};