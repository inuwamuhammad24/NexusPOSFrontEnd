// components/MainInterface.js
import React, { useContext, useEffect, useState } from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  LogOut,
  TableProperties,
  Store,
  History,
  ShieldCheck,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Menu,
  X,
  Plus,
} from "lucide-react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentPath = location.pathname.split("/")[1] || "Dashboard"
  const formattedTitle = currentPath.replace("-", " ")

  const userRole = String(
    appState.user?.role || localStorage.getItem("role") || "cashier",
  )
    .toLowerCase()
    .trim()

  const isAdmin = userRole === "admin" || userRole === "owner"
  const isManager = userRole === "manager"

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

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

      <div className="flex h-[100dvh] bg-slate-50 text-gray-900 font-sans antialiased overflow-hidden">
        {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200/80 flex-col justify-between shrink-0 z-20">
          <div className="overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <NavLink to="/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200">
                  N
                </div>
                <span className="font-extrabold text-xl tracking-tight text-gray-900">
                  NEXUS<span className="text-indigo-600">POS</span>
                </span>
              </NavLink>

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

            <nav className="p-4 space-y-1.5">
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
              type="button"
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
          {/* Header Bar */}
          <header className="h-14 sm:h-16 px-4 sm:px-8 border-b border-gray-200/80 bg-white flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm md:hidden">
                N
              </div>
              <h2 className="text-sm sm:text-base font-bold text-gray-800 tracking-tight capitalize truncate">
                {formattedTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick POS Trigger on Mobile */}
              <button
                type="button"
                onClick={() => appDispatch({ type: "openSalesModal" })}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus size={14} />
                <span>Sale</span>
              </button>

              {/* Operator Pill */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {appState.user?.username || "Operator"}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider leading-none mt-0.5">
                    {userRole}
                  </p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 font-bold text-xs uppercase">
                  {(appState.user?.username || "U").charAt(0)}
                </div>
              </div>

              {/* Mobile Drawer Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open mobile navigation drawer"
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>
            </div>
          </header>

          {/* DYNAMIC SCROLL CONTAINER */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 pb-24 md:pb-6">
            <Outlet />
          </main>

          {/* --- MOBILE FIXED BOTTOM BAR (< md) --- */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200/90 px-3 flex items-center justify-around z-30 shadow-lg">
            <BottomNavItem
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
              label="Home"
            />
            <BottomNavItem
              to="/sales"
              icon={<ShoppingCart size={18} />}
              label="Sales"
            />

            {/* Raised Center POS Action */}
            <button
              type="button"
              onClick={() => appDispatch({ type: "openSalesModal" })}
              className="-mt-5 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition"
              aria-label="Open New Sale Checkout"
            >
              <Plus size={22} />
            </button>

            <BottomNavItem
              to="/inventory"
              icon={<TableProperties size={18} />}
              label="Stock"
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-indigo-600 text-[10px] font-semibold py-1 px-2"
            >
              <Menu size={18} />
              <span>More</span>
            </button>
          </nav>
        </div>
      </div>

      {/* --- MOBILE SLIDE-OUT DRAWER --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              className="w-4/5 max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                      N
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-gray-900">
                        NEXUS<span className="text-indigo-600">POS</span>
                      </p>
                      <p className="text-[10px] text-gray-400 capitalize">
                        {appState.user?.businessName || "Store"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="py-4 space-y-1">
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
                    label="Inventory Master"
                  />

                  {(isAdmin || isManager) && (
                    <>
                      <div className="pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3">
                        Ledgers & Clients
                      </div>
                      <NavItem
                        to="/stock-history"
                        icon={<History size={17} />}
                        label="Stock Activity"
                      />
                      <NavItem
                        to="/customers"
                        icon={<Users size={17} />}
                        label="Customer Ledgers"
                      />
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <div className="pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3">
                        Administration
                      </div>
                      <NavItem
                        to="/staff"
                        icon={<ShieldCheck size={17} />}
                        label="Staff Accounts"
                      />
                      <NavItem
                        to="/billing"
                        icon={<CreditCard size={17} />}
                        label="Billing & Tier"
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

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition text-xs font-bold"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

function BottomNavItem({ icon, label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 text-[10px] font-bold py-1 px-3 transition-colors ${
          isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}
