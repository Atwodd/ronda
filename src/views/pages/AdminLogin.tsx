import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../models/context/AdminAuthContext';

export function AdminLogin() {
  const navigate = useNavigate();
  const { loginWithCredentials, ready } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const ok = await loginWithCredentials(email, password);
    if (ok) {
      navigate('/admin');
      return;
    }
    setError('Credenciales inválidas o el usuario no tiene rol admin.');
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    await handleLogin();
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
        <h1 className="text-2xl font-medium mb-2">Login Administrador</h1>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 border rounded-lg"
            disabled={!ready}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Contraseña"
            className="w-full px-3 py-2 border rounded-lg"
            disabled={!ready}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            disabled={!ready}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}