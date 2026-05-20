import { createBrowserRouter } from "react-router";
import { Home } from "../views/pages/Home";
import { TableLanding } from "../views/pages/TableLanding";
import { Onboarding } from "../views/pages/Onboarding";
import { VirtualTable } from "../views/pages/VirtualTable";
import { Menu } from "../views/pages/Menu";
import { Account } from "../views/pages/Account";
import { Payment } from "../views/pages/Payment";
import { PaymentSuccess } from "../views/pages/PaymentSuccess";
import { AdminDashboard } from "../views/pages/AdminDashboard";
import { AdminLogin } from "../views/pages/AdminLogin";
import { WaiterDashboard } from "../views/pages/WaiterDashboard";
import { WaiterLogin } from "../views/pages/WaiterLogin";
import { NotFound } from "../views/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, Component: Home },
      { path: "m/:qrCode", Component: TableLanding },
      { path: "onboarding/:qrCode", Component: Onboarding },
      { path: "table/:qrCode", Component: VirtualTable },
      { path: "menu/:qrCode", Component: Menu },
      { path: "account/:qrCode", Component: Account },
      { path: "payment/:qrCode", Component: Payment },
      { path: "success/:qrCode", Component: PaymentSuccess },
      { path: "admin", Component: AdminDashboard },
      { path: "admin/login", Component: AdminLogin },
      { path: "waiter", Component: WaiterDashboard },
      { path: "waiter/login", Component: WaiterLogin },
      { path: "*", Component: NotFound },
    ],
  },
]);
