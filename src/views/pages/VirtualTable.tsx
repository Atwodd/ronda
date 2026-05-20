import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSession } from '../../models/context/SessionContext';
import { getInitials, Table } from '../../models/data/mockData';
import { Utensils, Loader2 } from 'lucide-react';
import { getSupabase } from '../../models/lib/supabaseClient';

export function VirtualTable() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTable = async () => {
      if (!qrCode) {
        navigate('/');
        return;
      }
      
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('qr_code', qrCode)
        .maybeSingle();

      if (error || !data) {
        navigate('/');
      } else {
        setTable(data as Table);
      }
      setLoading(false);
    };

    void fetchTable();
  }, [qrCode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!table) return null;

  // Add current user to diners if not already there
  const allDiners = [...(table.comensales || [])];
  if (currentUser && !allDiners.find(d => d.nombre === currentUser.nombre)) {
    // Generate a color for the new user
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#A8E6CF', '#FFD3B6', '#FFAAA5'];
    const usedColors = allDiners.map(d => d.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0];
    
    allDiners.push({
      nombre: currentUser.nombre,
      color: availableColor
    });
  }

  const handleGoToMenu = () => {
    navigate(`/menu/${qrCode}`);
  };

  // Calculate avatar positions around the table
  const getAvatarPosition = (index: number, total: number) => {
    const positions: { [key: number]: { [key: number]: string } } = {
      1: {
        0: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      2: {
        0: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
        1: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
      },
      3: {
        0: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
        1: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
        2: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      4: {
        0: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
        1: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
        2: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
        3: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      5: {
        0: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
        1: 'top-8 right-4 translate-x-1/2 -translate-y-1/2',
        2: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
        3: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
        4: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      6: {
        0: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
        1: 'top-8 right-4 translate-x-1/2 -translate-y-1/2',
        2: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
        3: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
        4: 'bottom-8 left-4 -translate-x-1/2 translate-y-1/2',
        5: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
      },
    };

    // For more than 6 people, distribute evenly
    if (total > 6) {
      const angle = (index * 360) / total;
      const radians = (angle - 90) * (Math.PI / 180); // -90 to start from top
      const x = 50 + 55 * Math.cos(radians); // 55% radius for better distribution
      const y = 50 + 45 * Math.sin(radians);
      
      return {
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      };
    }

    return positions[total]?.[index] || 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
  };

  const currentUserName = currentUser?.nombre;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-2">Ronda</h1>
          <div className="inline-block bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm">
            Mesa {table.numero}
          </div>
        </div>

        {/* Virtual Table */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-[3/2]">
            {/* Table Surface */}
            <div className="absolute inset-0 m-16">
              <div className="w-full h-full bg-gradient-to-br from-amber-800 to-amber-900 rounded-3xl shadow-2xl border-8 border-amber-950 relative overflow-hidden">
                {/* Wood texture effect */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.1) 2px, rgba(0,0,0,.1) 4px)',
                  }}></div>
                </div>

                {/* Menu Button in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handleGoToMenu}
                    className="bg-white hover:bg-orange-50 text-orange-600 px-8 py-4 rounded-2xl shadow-xl transition-all transform hover:scale-105 flex items-center gap-3"
                  >
                    <Utensils className="w-6 h-6" />
                    <span className="text-xl font-medium">Ver Menú</span>
                  </button>
                </div>
              </div>

              {/* Diners Avatars */}
              {allDiners.map((diner, index) => {
                const isCurrentUser = diner.nombre === currentUserName;
                const position = getAvatarPosition(index, allDiners.length);
                const isPositionObject = typeof position === 'object';

                return (
                  <div
                    key={index}
                    className={`absolute group ${!isPositionObject ? position : ''}`}
                    style={isPositionObject ? position : undefined}
                  >
                    <div
                      className={`relative ${isCurrentUser ? 'ring-4 ring-white ring-offset-2 ring-offset-transparent' : ''}`}
                      style={{ borderRadius: '50%' }}
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-2xl"
                        style={{ backgroundColor: diner.color }}
                      >
                        {getInitials(diner.nombre)}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {diner.nombre}
                        {isCurrentUser && ' (tú)'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-white text-sm mt-8">
          {allDiners.length} {allDiners.length === 1 ? 'comensal' : 'comensales'} en la mesa
        </p>
      </div>
    </div>
  );
}
