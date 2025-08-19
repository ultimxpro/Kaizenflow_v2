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
  signOut: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
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
          
          // Générer l'URL signée
          const { data, error } = await supabase.storage
            .from('avatars')
            .createSignedUrl(avatarPath, 3600);
          
          if (error) {
            console.error('❌ Erreur génération URL signée:', error);
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        fetchProfileAndUsers(authUser.id); // MODIFICATION: Appeler la nouvelle fonction unifiée
      } else {
        setProfile(null);
        setSignedAvatarUrl(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // MODIFICATION: Logique de mise à jour de l'URL signée de l'utilisateur principal
  useEffect(() => {
    setSignedAvatarUrl(profile?.signedAvatarUrl || null);
  }, [profile]);

  const fetchProfileAndUsers = async (userId: string) => {
    // Récupère le profil de l'utilisateur connecté et tous les autres utilisateurs en parallèle
    const [{ data: profileData, error: profileError }, { data: allUsersData, error: usersError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('profiles').select('*')
    ]);

    if (profileError) console.error("Error fetching profile:", profileError);
    if (usersError) console.error("Error fetching all users:", usersError);

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
  };

  const fetchOrCreateProfile = async (user: User) => {
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSignedAvatarUrl(null);
    setUsers([]);
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
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};