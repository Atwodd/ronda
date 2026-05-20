import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabase } from '../lib/supabaseClient';

interface Waiter {
  id: string;
  nombre_usuario: string;
  usuario: string;
  activo: boolean;
}

interface WaiterAuthContextType {
  currentWaiter: Waiter | null;
  logout: () => void;
  loginWithCredentials?: (usuario: string, password: string) => Promise<boolean>;
}

const WaiterAuthContext = createContext<WaiterAuthContextType | undefined>(undefined);

export function WaiterAuthProvider({ children }: { children: ReactNode }) {
  const [currentWaiter, setCurrentWaiter] = useState<Waiter | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ronda_waiter');
    if (saved) {
      setCurrentWaiter(JSON.parse(saved));
    }
  }, []);

  // Sign in using the existing Supabase table `meseros` via RPC
  const loginWithCredentials = async (usuario: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      const { data, error } = await supabase.rpc('login_mesero', {
        p_usuario: usuario,
        p_contrasena: password,
      });
      if (error || !data || (Array.isArray(data) && data.length === 0)) return false;
      const profile = Array.isArray(data) ? data[0] : data;
      const w: Waiter = {
        id: profile.id,
        nombre_usuario: profile.nombre_usuario ?? usuario,
        usuario: profile.usuario ?? usuario,
        activo: profile.activo ?? true,
      };
      setCurrentWaiter(w);
      localStorage.setItem('ronda_waiter', JSON.stringify(w));
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setCurrentWaiter(null);
    localStorage.removeItem('ronda_waiter');
  };

  return (
    <WaiterAuthContext.Provider value={{ currentWaiter, logout, loginWithCredentials }}>
      {children}
    </WaiterAuthContext.Provider>
  );
}

export function useWaiterAuth() {
  const ctx = useContext(WaiterAuthContext);
  if (!ctx) throw new Error('useWaiterAuth must be used within WaiterAuthProvider');
  return ctx;
}
