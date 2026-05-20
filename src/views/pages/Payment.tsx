import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Copy, Check, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useSession } from '../../models/context/SessionContext';
import { formatCOP, restaurant, generateReferenceCode } from '../../models/data/mockData';
import { toast } from 'sonner';
import { copyToClipboard } from '../../controllers/utils/clipboard';
import { getSupabase } from '../../models/lib/supabaseClient';

type PaymentStep = 'tip' | 'method' | 'instructions' | 'upload' | 'waiting';

export function Payment() {
  const navigate = useNavigate();
  const { qrCode } = useParams<{ qrCode: string }>();
  const { currentUser, tableNumber, tableId, updateUserTotals } = useSession();

  // Para persistir pagos y cargar referencias desde Supabase, usamos la referencia del QR (qrCode) como mesa.

  const [step, setStep] = useState<PaymentStep>('tip');
  const [propina, setPropina] = useState(0);
  const [propinaPersonalizada, setPropinaPersonalizada] = useState('');
  const [metodo, setMetodo] = useState<'nequi' | 'daviplata' | 'efectivo' | 'tarjeta' | null>(
    null
  );
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabase();

  if (!currentUser || !qrCode) {
    navigate(`/onboarding/${qrCode}`);
    return null;
  }

  const subtotal =
    currentUser.total_personal + currentUser.total_compartido - currentUser.total_abonado;
  const total = subtotal + propina;

  const handleTipSelect = (percentage: number) => {
    if (percentage === -1) {
      // Custom tip
      setPropina(0);
      setPropinaPersonalizada('');
    } else {
      setPropina(Math.floor(subtotal * percentage));
      setPropinaPersonalizada('');
    }
  };

  const handleCustomTipChange = (value: string) => {
    setPropinaPersonalizada(value);
    const amount = parseInt(value) || 0;
    setPropina(amount * 10000); // Convert to centavos
  };

  const handleContinueFromTip = () => {
    updateUserTotals({ total_propina: propina });
    setStep('method');
  };

  const handleMethodSelect = (method: typeof metodo) => {
    setMetodo(method);
    if (method === 'nequi' || method === 'daviplata') {
      setStep('instructions');
    } else {
      // For efectivo/tarjeta, show waiting screen first
      setStep('waiting');
      // Then simulate presencial payment
      simulatePresencialPayment();
    }
  };

  const simulatePresencialPayment = async () => {
    setStep('waiting');

    try {
      const supabase = getSupabase();

      if (!supabase) {
        throw new Error('Supabase no configurado');
      }

      const referencia = generateReferenceCode(
        tableNumber || '',
        currentUser.nombre
      );

      setPaymentReference(referencia);



      const monto = total;

      const metodoFinal = metodo;

      const { error } = await supabase
        .from('payments')
        .insert({
          table_id: tableId || undefined,
          comensal: currentUser.nombre,
          monto,
          metodo: metodoFinal,
          estado: 'pendiente',
          referencia,
          fecha: new Date().toISOString().slice(0, 10),
          hora: new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
          })
        });

      if (error) {
        throw error;
      }



    } catch (e) {
      console.error(e);

      toast.error(
        'No se pudo registrar el pago'
      );

      setStep('method');
    }
  };

  const handleCopyNumber = () => {
    const number =
      metodo === 'nequi' ? restaurant.metodos_pago.nequi.numero : restaurant.metodos_pago.daviplata.numero;
    copyToClipboard(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Número copiado');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprobante(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {

    if (!comprobante) {
      toast.error('Selecciona una imagen');
      return;
    }

    try {

      setUploading(true);

      const supabase = getSupabase();

      if (!supabase) {
        toast.error('Error de conexión');
        return;
      }

      // nombre único
      const fileName = `${Date.now()}-${comprobante.name}`;

      // subir archivo
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, comprobante);

      if (uploadError) {
        throw uploadError;
      }

      // obtener URL pública
      const { data } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      const comprobanteUrl = data.publicUrl;

      const referencia = generateReferenceCode(
        tableNumber || '',
        currentUser.nombre
      );

      setPaymentReference(referencia);

      // guardar pago
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          table_id: tableId || undefined,
          comensal: currentUser.nombre,
          monto: total,
          metodo,
          estado: 'pendiente',
          referencia,
          comprobante_url: comprobanteUrl,
          fecha: new Date().toISOString().slice(0, 10),
          hora: new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
          })
        });

      if (paymentError) {
        throw paymentError;
      }

      toast.success('Comprobante enviado correctamente');

      setStep('waiting');

    } catch (error) {

      console.error(error);

      toast.error(
        'Error subiendo comprobante'
      );

    } finally {

      setUploading(false);

    }

  };

  useEffect(() => {

    if (!paymentReference || !supabase) return;

    const interval = setInterval(async () => {

      const { data, error } = await supabase
        .from('payments')
        .select('estado')
        .eq('referencia', paymentReference)
        .single();

      if (error || !data) return;

      setPaymentStatus(data.estado);

      if (data.estado === 'aprobado') {

        updateUserTotals({
          total_abonado: currentUser.total_abonado + total,
          estado_pago: 'pagado'
        });

        clearInterval(interval);

        toast.success('Pago aprobado');

        navigate(`/success/${qrCode}`);
      }

      if (data.estado === 'rechazado') {

        clearInterval(interval);

        toast.error('Pago rechazado');

        setStep('method');
      }

    }, 3000);

    return () => clearInterval(interval);

  }, [
    paymentReference,
    supabase,
    currentUser,
    total,
    navigate,
    qrCode,
    updateUserTotals
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step === 'tip') {
                  navigate(`/account/${qrCode}`);
                } else if (step === 'method') {
                  setStep('tip');
                } else if (step === 'instructions') {
                  setStep('method');
                } else if (step === 'upload') {
                  setStep('instructions');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl">Pagar Cuenta</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Tip Selection */}
        {step === 'tip' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg mb-4">¿Deseas dejar propina?</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => handleTipSelect(0)}
                  className={`p-4 border-2 rounded-lg transition-colors ${propina === 0 && !propinaPersonalizada
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  Sin propina
                </button>
                <button
                  onClick={() => handleTipSelect(0.05)}
                  className={`p-4 border-2 rounded-lg transition-colors ${propina === Math.floor(subtotal * 0.05)
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div>5%</div>
                  <div className="text-sm text-gray-600">{formatCOP(Math.floor(subtotal * 0.05))}</div>
                </button>
                <button
                  onClick={() => handleTipSelect(0.1)}
                  className={`p-4 border-2 rounded-lg transition-colors ${propina === Math.floor(subtotal * 0.1)
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>10%</span>
                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                      Popular
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{formatCOP(Math.floor(subtotal * 0.1))}</div>
                </button>
                <button
                  onClick={() => handleTipSelect(0.15)}
                  className={`p-4 border-2 rounded-lg transition-colors ${propina === Math.floor(subtotal * 0.15)
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div>15%</div>
                  <div className="text-sm text-gray-600">{formatCOP(Math.floor(subtotal * 0.15))}</div>
                </button>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Monto personalizado</label>
                <input
                  type="number"
                  value={propinaPersonalizada}
                  onChange={(e) => handleCustomTipChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between text-gray-700 mb-2">
                <span>Subtotal</span>
                <span>{formatCOP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700 mb-3">
                <span>Propina</span>
                <span>{formatCOP(propina)}</span>
              </div>
              <div className="border-t-2 border-orange-500 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Total</span>
                  <span className="text-2xl text-orange-600">{formatCOP(total)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinueFromTip}
              className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition-colors"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Method Selection */}
        {step === 'method' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg mb-4">Selecciona el método de pago</h2>
              <div className="space-y-3">
                {restaurant.metodos_pago.nequi.activo && (
                  <button
                    onClick={() => handleMethodSelect('nequi')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                        N
                      </div>
                      <div>
                        <div>Nequi</div>
                        <div className="text-sm text-gray-600">Transferencia digital</div>
                      </div>
                    </div>
                  </button>
                )}
                {restaurant.metodos_pago.daviplata.activo && (
                  <button
                    onClick={() => handleMethodSelect('daviplata')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white">
                        D
                      </div>
                      <div>
                        <div>Daviplata</div>
                        <div className="text-sm text-gray-600">Transferencia digital</div>
                      </div>
                    </div>
                  </button>
                )}
                {restaurant.metodos_pago.efectivo.activo && (
                  <button
                    onClick={() => handleMethodSelect('efectivo')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white">
                        💵
                      </div>
                      <div>
                        <div>Efectivo</div>
                        <div className="text-sm text-gray-600">El mesero se acercará</div>
                      </div>
                    </div>
                  </button>
                )}
                {restaurant.metodos_pago.tarjeta.activo && (
                  <button
                    onClick={() => handleMethodSelect('tarjeta')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                        💳
                      </div>
                      <div>
                        <div>Tarjeta / Datáfono</div>
                        <div className="text-sm text-gray-600">El mesero se acercará</div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions (Digital Payment) */}
        {step === 'instructions' && metodo && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg mb-4">Instrucciones de pago</h2>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-orange-800 mb-2">Total a pagar:</div>
                <div className="text-2xl text-orange-600">{formatCOP(total)}</div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Número de {metodo === 'nequi' ? 'Nequi' : 'Daviplata'}:
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg">
                    {metodo === 'nequi'
                      ? restaurant.metodos_pago.nequi.numero
                      : restaurant.metodos_pago.daviplata.numero}
                  </div>
                  <button
                    onClick={handleCopyNumber}
                    className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="mb-2">Pasos:</h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Abre tu app de {metodo === 'nequi' ? 'Nequi' : 'Daviplata'}</li>
                  <li>Envía el monto exacto al número copiado</li>
                  <li>Toma captura del comprobante</li>
                  <li>Regresa aquí y sube la imagen</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setStep('upload')}
              className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition-colors"
            >
              Ya transferí - Subir comprobante
            </button>
          </div>
        )}

        {/* Upload Comprobante */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-lg mb-4">Sube tu comprobante</h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!previewUrl ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-orange-500 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <div className="text-gray-600">Toca para seleccionar imagen</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Cámara o galería
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Comprobante"
                    className="w-full rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setComprobante(null);
                      setPreviewUrl(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cambiar imagen
                  </button>
                </div>
              )}
            </div>

            {previewUrl && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-orange-500 text-white py-4 rounded-xl hover:bg-orange-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar comprobante</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Waiting */}
        {step === 'waiting' && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl mb-2">
              {metodo === 'efectivo' || metodo === 'tarjeta'
                ? 'El mesero se acercará a tu mesa'
                : 'Revisando tu comprobante'}
            </h2>
            <p className="text-gray-600">
              {metodo === 'efectivo' || metodo === 'tarjeta'
                ? 'En unos momentos atenderemos tu solicitud de pago'
                : 'Tu comprobante está siendo verificado por nuestro personal'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}