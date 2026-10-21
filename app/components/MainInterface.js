// MainInterface.js
import React, { useContext, useEffect } from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  LogOut,
  TableProperties,
  User,
  Store,
  History,
  ShieldCheck,
  CreditCard,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import StateContext from "../StateContext"
import DispatchContext from "../DispatchContext"
import FlashMessages from "./Reusables/FlashMessage"
import SalesModal from "./Pages/Sales/SalesModal"
import AddProductModal from "./Pages/Inventory/AddProductModal"
import AddLocationModal from "./Pages/Inventory/AddLocationModal"
import TransferModal from "./Pages/Inventory/TransferModal"
import ArrivalModal from "./Pages/Inventory/ArrivalModal"
import ReceiptContainer from "./Pages/Sales/ThermalReceipt"

export default function MainLayout() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = location.pathname.split("/")[1] || "Dashboard"
  const formattedTitle = currentPath.replace("-", " ")

  // Role resolution
  const userRole = String(
    appState.user?.role || localStorage.getItem("role") || "cashier",
  )
    .toLowerCase()
    .trim()

  const isAdmin = userRole === "admin" || userRole === "owner"
  const isManager = userRole === "manager"

  useEffect(() => {
    if (appState.flashMessage?.msgs?.length > 0) {
      const timer = setTimeout(() => {
        appDispatch({ type: "clearFlash" })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [appState.flashMessage, appDispatch])

  const handleLogout = () => {
    appDispatch({ type: "logout" })
    navigate("/login")
  }

  return (
    <>
      {/* GLOBAL MODALS */}
      {appState.isSalesModalOpen && <SalesModal />}
      {appState.isReceiptOpen && <ReceiptContainer />}
      {appState.flashMessage?.isFlashMessageOpen && <FlashMessages />}
      {appState.isProductModalOpen && <AddProductModal />}

      {appState.isLocationModalOpen && (
        <AddLocationModal
          isOpen={appState.isLocationModalOpen}
          onClose={() => appDispatch({ type: "closeLocationModal" })}
        />
      )}
      {appState.isTransferModalOpen && (
        <TransferModal
          isOpen={appState.isTransferModalOpen}
          onClose={() => appDispatch({ type: "closeTransferModal" })}
          sourceLocation={appState.activeStoreNode || null}
        />
      )}
      {appState.isArrivalModalOpen && (
        <ArrivalModal
          isOpen={appState.isArrivalModalOpen}
          onClose={() => appDispatch({ type: "closeArrivalModal" })}
          targetStore={appState.activeStoreNode || null}
        />
      )}

      <div className="flex h-screen bg-slate-50 text-gray-900 font-sans antialiased overflow-hidden">
        {/* --- PERSISTENT SAAS SIDEBAR --- */}
        <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 z-20">
          <div className="overflow-y-auto">
            {/* Store Branding Header */}
            <div className="p-6 border-b border-gray-100">
              <NavLink to="/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200">
                  N
                </div>
                <span className="font-extrabold text-xl tracking-tight text-gray-900">
                  NEXUS<span className="text-indigo-600">POS</span>
                </span>
              </NavLink>

              {/* Active Tenant / Store Capsule */}
              <div className="mt-4 p-2.5 bg-indigo-50/60 border border-indigo-100/80 rounded-xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Store size={14} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {appState.user?.businessName || "Pilot Store"}
                  </p>
                  <p className="text-[10px] text-indigo-700 font-bold truncate capitalize">
                    {userRole} Account
                  </p>
                </div>
              </div>
            </div>

            {/* Role-Restricted Navigation Links */}
            <nav className="p-4 space-y-1.5">
              {/* 1. Base Operations (Everyone: Admin, Manager, Cashier) */}
              <NavItem
                to="/dashboard"
                icon={<LayoutDashboard size={17} />}
                label="Dashboard"
              />
              <NavItem
                to="/sales"
                icon={<ShoppingCart size={17} />}
                label="Sales & Register"
              />
              <NavItem
                to="/inventory"
                icon={<TableProperties size={17} />}
                label="Inventory"
              />

              {/* 2. Manager & Admin Links */}
              {(isAdmin || isManager) && (
                <>
                  <NavItem
                    to="/stock-history"
                    icon={<History size={17} />}
                    label="Stock Ledger"
                  />
                  <NavItem
                    to="/customers"
                    icon={<Users size={17} />}
                    label="Customers"
                  />
                </>
              )}

              {/* 3. Admin Exclusive Links */}
              {isAdmin && (
                <>
                  <NavItem
                    to="/staff"
                    icon={<ShieldCheck size={17} />}
                    label="Staff & Roles"
                  />
                  <NavItem
                    to="/billing"
                    icon={<CreditCard size={17} />}
                    label="Billing & Plans"
                  />
                  <NavItem
                    to="/admin/control"
                    icon={<ShieldAlert size={17} />}
                    label="Platform Control"
                  />
                </>
              )}
            </nav>
          </div>

          {/* Bottom Area: Subscription Callout (Admin only) + Logout */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            {isAdmin && (
              <NavLink
                to="/billing"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">
                    Manage Tier
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Admin
                </span>
              </NavLink>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-xs font-semibold"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* --- MAIN WORKSPACE HOST --- */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
          <header className="h-16 px-8 border-b border-gray-200/80 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-indigo-600 rounded-full" />
              <h2 className="text-base font-bold text-gray-800 tracking-tight capitalize">
                {formattedTitle}
              </h2>
            </div>

            {/* Operator Lockup */}
            <div className="flex items-center gap-3 px-3.5 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {appState.user?.username || "Operator"}
                </p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider leading-none mt-0.5">
                  {userRole}
                </p>
              </div>

              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm font-bold text-xs uppercase">
                {(appState.user?.username || "U").charAt(0)}
              </div>
            </div>
          </header>

          {/* DYNAMIC CHILD OUTLET */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}

function NavItem({ icon, label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          isActive
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}
