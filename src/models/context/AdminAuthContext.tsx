import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabase } from '../lib/supabaseClient';

interface AdminProfile {
  id: string;
  nombre: string;
  email?: string;
  rol: 'admin';
}

interface AdminAuthContextType {
  currentAdmin: AdminProfile | null;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  ready: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setReady(true);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user ?? null;
      if (!user) {
        setReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id,nombre,email,rol')
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .maybeSingle();

      if (profile) {
        setCurrentAdmin({
          id: profile.id,
          nombre: profile.nombre,
          email: profile.email ?? user.email ?? undefined,
          rol: 'admin',
        });
      }

      setReady(true);
    };

    void bootstrap();
  }, []);

  const loginWithCredentials = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id,nombre,email,rol')
      .eq('auth_user_id', data.user.id)
      .eq('rol', 'admin')
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      return false;
    }

    setCurrentAdmin({
      id: profile.id,
      nombre: profile.nombre,
      email: profile.email ?? data.user.email ?? undefined,
      rol: 'admin',
    });
    return true;
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setCurrentAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ currentAdmin, loginWithCredentials, logout, ready }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
}
