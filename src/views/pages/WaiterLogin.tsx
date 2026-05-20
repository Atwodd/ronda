import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWaiterAuth } from '../../models/context/WaiterAuthContext';

export function WaiterLogin() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useWaiterAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginUsuario = async () => {
    if (!loginWithCredentials) {
      alert('Autenticación de meseros no configurada');
      return;
    }
    const ok = await loginWithCredentials(usuario, password);
    if (ok) navigate('/waiter');
    else alert('Credenciales inválidas');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-sm text-gray-500 hover:text-gray-900"
        >
          ← Volver al inicio
        </button>
        <h2 className="text-xl font-medium mb-4">Login Mesero</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Iniciar sesión con usuario y contraseña</p>
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Usuario" className="w-full px-3 py-2 border rounded mb-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" className="w-full px-3 py-2 border rounded mb-2" />
          <button onClick={handleLoginUsuario} className="w-full px-4 py-2 bg-blue-600 text-white rounded">Iniciar sesión</button>
        </div>

        <p className="mt-4 text-sm text-gray-500">Si no tienes acceso, pide al administrador que te cree en la tabla meseros.</p>
      </div>
    </div>
  );
}
