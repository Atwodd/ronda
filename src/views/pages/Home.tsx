import { QrCode, ArrowRight, ChefHat, Users } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Home() {
  const navigate = useNavigate();

  const mesas = [
    { qr: 'qr-mesa-4', numero: '4', estado: 'Disponible' },
    { qr: 'qr-mesa-7', numero: '7', estado: 'Disponible' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-red-600">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center text-white mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
              <QrCode className="w-10 h-10" />
            </div>
            <h1 className="text-5xl mb-4">RONDA</h1>
            <p className="text-xl text-orange-100 mb-2">Sistema de Pedidos para Restaurantes</p>
            <p className="text-orange-200">v.1.0.1</p>
          </div>

          {/* Staff Access */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="bg-white rounded-xl shadow-2xl p-6 hover:shadow-xl transition-all hover:scale-105 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-4 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <ChefHat className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-medium mb-1">Panel Administrador</h3>
                  <p className="text-sm text-gray-600">Gestionar menú, pagos y mesas</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => navigate('/waiter')}
              className="bg-white rounded-xl shadow-2xl p-6 hover:shadow-xl transition-all hover:scale-105 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-medium mb-1">Panel Camarero</h3>
                  <p className="text-sm text-gray-600">Ver comandas y cobrar</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          
        </div>
      </div>
    </div>
  );
}