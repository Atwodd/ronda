import { RouterProvider } from 'react-router';
import { router } from './controllers/routes';
import { CartProvider } from './models/context/CartContext';
import { SessionProvider } from './models/context/SessionContext';
import { Toaster } from 'sonner';
import { WaiterAuthProvider } from './models/context/WaiterAuthContext';
import { AdminAuthProvider } from './models/context/AdminAuthContext';

function App() {
  return (
    <SessionProvider>
      <AdminAuthProvider>
        <WaiterAuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
            <Toaster position="top-center" richColors />
          </CartProvider>
        </WaiterAuthProvider>
      </AdminAuthProvider>
    </SessionProvider>
  );
}

export default App;