import { AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl mb-2">Página no encontrada</h1>
        <p className="text-gray-600">El QR escaneado no es válido</p>
      </div>
    </div>
  );
}
