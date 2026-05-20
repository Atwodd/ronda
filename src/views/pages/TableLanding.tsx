import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { getSupabase } from '../../models/lib/supabaseClient';

export function TableLanding() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const checkTable = async () => {
      if (!qrCode) {
        navigate('/');
        return;
      }

      const supabase = getSupabase();
      if (!supabase) {
        console.error("Supabase no configurado");
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('qr_code', qrCode.trim().toUpperCase())
        .single();

      console.log("TABLE:", data);
      console.log("ERROR:", error);

      if (data) {
        navigate(`/onboarding/${qrCode}`);
      } else {
        navigate('/'); // Si no se encuentra la mesa, redirige al home o a una página de error
      }
    };

    // Simula pequeño loading
    setTimeout(() => {
      checkTable();
    }, 800);
  }, [qrCode, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl mb-2">Bienvenido a Ronda</h1>
        <p className="text-orange-100">Cargando tu mesa...</p>
      </div>
    </div>
  );
}