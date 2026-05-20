import { CheckCircle, Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useSession } from '../../models/context/SessionContext';
import { formatCOP, generateReferenceCode } from '../../models/data/mockData';
import jsPDF from 'jspdf';

export function PaymentSuccess() {
  const navigate = useNavigate();
  const { qrCode } = useParams<{ qrCode: string }>();
  const { currentUser, tableNumber, restaurantName } = useSession();

  if (!currentUser || !qrCode) {
    navigate(`/onboarding/${qrCode}`);
    return null;
  }

  const referenceCode = generateReferenceCode(tableNumber || '', currentUser.nombre);
  const total =
    currentUser.total_personal + currentUser.total_compartido + currentUser.total_propina;

  const handleDownloadReceipt = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text(restaurantName, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text('Comprobante de Consumo', pageWidth / 2, 30, { align: 'center' });

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 35, pageWidth - 20, 35);

    // Info
    doc.setFontSize(10);
    const leftMargin = 20;
    let yPos = 45;

    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-CO')}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Mesa: ${tableNumber}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Cliente: ${currentUser.nombre}`, leftMargin, yPos);
    yPos += 6;
    doc.text(`Código de referencia: ${referenceCode}`, leftMargin, yPos);

    // Divider
    yPos += 10;
    doc.line(20, yPos, pageWidth - 20, yPos);

    // Desglose
    yPos += 10;
    doc.setFontSize(12);
    doc.text('Desglose de Consumo', leftMargin, yPos);

    doc.setFontSize(10);
    yPos += 8;
    doc.text('Consumo personal:', leftMargin, yPos);
    doc.text(formatCOP(currentUser.total_personal), pageWidth - 20, yPos, { align: 'right' });

    yPos += 6;
    doc.text('Consumo compartido:', leftMargin, yPos);
    doc.text(formatCOP(currentUser.total_compartido), pageWidth - 20, yPos, { align: 'right' });

    if (currentUser.total_propina > 0) {
      yPos += 6;
      doc.text('Propina:', leftMargin, yPos);
      doc.text(formatCOP(currentUser.total_propina), pageWidth - 20, yPos, { align: 'right' });
    }

    // Divider
    yPos += 8;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);

    // Total
    yPos += 8;
    doc.setFontSize(14);
    doc.text('TOTAL PAGADO:', leftMargin, yPos);
    doc.text(formatCOP(total), pageWidth - 20, yPos, { align: 'right' });

    // Footer
    yPos += 20;
    doc.setFontSize(8);
    doc.text('Gracias por tu visita', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(restaurantName, pageWidth / 2, yPos, { align: 'center' });

    // Save
    doc.save(`comprobante-${referenceCode}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-green-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl mb-2">¡Pago Exitoso!</h1>
            <p className="text-gray-600">Tu cuenta ha sido pagada completamente</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-600 mb-1">Código de referencia</div>
              <div className="text-lg tracking-wider">{referenceCode}</div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mesa</span>
                <span>{tableNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cliente</span>
                <span>{currentUser.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha</span>
                <span>{new Date().toLocaleDateString('es-CO')}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Pagado</span>
                <span className="text-2xl text-green-600">{formatCOP(total)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadReceipt}
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <Download className="w-5 h-5" />
            <span>Descargar Comprobante</span>
          </button>

          <button
            onClick={() => navigate(`/menu/${qrCode}`)}
            className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Menú</span>
          </button>
        </div>

        <p className="text-center text-white text-sm mt-4">
          ¡Gracias por tu visita a {restaurantName}!
        </p>
      </div>
    </div>
  );
}
