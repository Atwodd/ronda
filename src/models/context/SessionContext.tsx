import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  nombre: string;
  estado_pago: 'pendiente' | 'en_proceso' | 'abonado' | 'pagado';
  total_personal: number;
  total_compartido: number;
  total_propina: number;
  total_abonado: number;
}

interface SessionContextType {
  sessionToken: string | null;
  currentUser: User | null;
  qrCode: string | null;
  tableNumber: string | null;
  tableId: string | null;
  restaurantName: string;
  setSession: (token: string, user: User, qrCode: string, tableNumber: string, tableId: string) => void;
  updateUserTotals: (totals: Partial<User>) => void;
  clearSession: () => void;
}


const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ronda_session_token');
    const savedUser = localStorage.getItem('ronda_user');
    const savedQr = localStorage.getItem('ronda_qr_code');
    const savedTable = localStorage.getItem('ronda_table_number');
    const savedTableId = localStorage.getItem('ronda_table_id');

    if (savedToken && savedUser && savedQr && savedTable && savedTableId) {
      setSessionToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setQrCode(savedQr);
      setTableNumber(savedTable);
      setTableId(savedTableId);
    }
  }, []);

  const setSession = (token: string, user: User, qr: string, table: string, tableId: string) => {
    setSessionToken(token);
    setCurrentUser(user);
    setQrCode(qr);
    setTableNumber(table);
    setTableId(tableId);

    localStorage.setItem('ronda_session_token', token);
    localStorage.setItem('ronda_user', JSON.stringify(user));
    localStorage.setItem('ronda_qr_code', qr);
    localStorage.setItem('ronda_table_number', table);
    localStorage.setItem('ronda_table_id', tableId);
  };

  const updateUserTotals = (totals: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...totals };
      setCurrentUser(updatedUser);
      localStorage.setItem('ronda_user', JSON.stringify(updatedUser));
    }
  };

  const clearSession = () => {
    setSessionToken(null);
    setCurrentUser(null);
    setQrCode(null);
    setTableNumber(null);
    setTableId(null);

    localStorage.removeItem('ronda_session_token');
    localStorage.removeItem('ronda_user');
    localStorage.removeItem('ronda_qr_code');
    localStorage.removeItem('ronda_table_number');
    localStorage.removeItem('ronda_table_id');
  };

  return (
    <SessionContext.Provider
      value={{
        sessionToken,
        currentUser,
        qrCode,
        tableNumber,
        tableId,
        restaurantName: 'La Mesa Redonda',
        setSession,
        updateUserTotals,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
