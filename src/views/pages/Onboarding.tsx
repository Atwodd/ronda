import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSession } from '../../models/context/SessionContext';
import { Copy, Check, Loader2 } from 'lucide-react';
import { copyToClipboard } from '../../controllers/utils/clipboard';
import { getSupabase } from '../../models/lib/supabaseClient';

export function Onboarding() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const { setSession } = useSession();

  const [nombre, setNombre] = useState('');
  const [showRecoveryUrl, setShowRecoveryUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  const [table, setTable] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTable = async () => {
      console.log("QR recibido:", qrCode);

      if (!qrCode) {
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      if (!supabase) {
        console.error("Supabase no configurado");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('qr_code', qrCode.trim().toUpperCase())
        .single(); //mejor que maybeSingle para debug

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        console.error("Error buscando mesa:", error);
      }

      if (data) {
        setTable(data);
      }

      setLoading(false);
    };

    fetchTable();
  }, [qrCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !qrCode || !table) return;

    const supabase = getSupabase();
    if (!supabase) {
      alert("Supabase no configurado");
      return;
    }

    try {
      //Crear comensal REAL
      const { data: comensal, error } = await supabase
        .from('table_comensales')
        .insert({
          table_id: table.id,
          nombre: nombre.trim(),
        })
        .select()
        .single();

      if (error || !comensal) {
        console.error(error);
        alert("Error creando comensal");
        return;
      }

      //Guardar sesión en localStorage
      localStorage.setItem("comensal_id", comensal.id);
      localStorage.setItem("ronda_table_id", table.id);
      localStorage.setItem("table_id", table.id);
      localStorage.setItem("qr_code", qrCode);

      //Mantener tu SessionContext
      const sessionUser = {
        id: comensal.id,
        nombre: comensal.nombre,
        estado_pago: 'pendiente' as const,
        total_personal: 0,
        total_compartido: 0,
        total_propina: 0,
        total_abonado: 0,
      };

      setSession("session_real", sessionUser, qrCode, table.numero, table.id);
      setShowRecoveryUrl(true);

    } catch (err) {
      console.error(err);
      alert("Error inesperado");
    }
  };

  const recoveryUrl = `${window.location.origin}/m/${qrCode}`;

  const handleCopy = () => {
    copyToClipboard(recoveryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    navigate(`/table/${qrCode}`);
  };

  // UI 

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl mb-2">Mesa no encontrada</h1>
          <p className="text-gray-600">El código QR no es válido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl mb-2">La Mesa Redonda</h1>
            <div className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full">
              Mesa {table.numero}
            </div>
          </div>

          {!showRecoveryUrl ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  ¿Cuál es tu nombre?
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: Juan"
                  required
                />
              </div>

              <button className="w-full bg-orange-500 text-white py-3 rounded-lg">
                Continuar
              </button>
            </form>
          ) : (
            <div className="space-y-4">

              <div className="bg-blue-50 border p-4 rounded-lg">
                <p className="text-sm mb-2">
                  Guarda este enlace:
                </p>

                <div className="flex gap-2">
                  <input
                    value={recoveryUrl}
                    readOnly
                    className="flex-1 px-2 py-1 border"
                  />
                  <button onClick={handleCopy}>
                    {copied ? <Check /> : <Copy />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full bg-orange-500 text-white py-3 rounded-lg"
              >
                Ir al Menú
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}