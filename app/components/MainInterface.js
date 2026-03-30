import React, { useContext } from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  TableProperties,
  User,
} from "lucide-react"
import Dashboard from "./Pages/Dashboard/Dashboard"
import SalesTable from "./Pages/Sales/SalesTable"
import { useParams, Link } from "react-router-dom"
import Inventory from "./Pages/Inventory/Inventory"
import StateContext from "../StateContext"
import CustomerPage from "./Pages/Customers/Customer"
import StaffPage from "./Pages/Staff/Staff"

export default function MainLayout() {
  const { page } = useParams()
  const appState = useContext(StateContext)

  return (
    <>
      <div className="flex h-screen bg-white text-gray-900 font-sans">
        {/* --- SIDEBAR --- */}
        <aside className="w-64 bg-white border-r border-gray-200/50 flex flex-col z-20">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Package size={18} />
            </div>
            <h2 className="font-semibold text-gray-800 tracking-tight">
              My Store POS
            </h2>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <NavItem
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={page === "dashboard"}
            />
            <NavItem
              to="/sales"
              icon={<ShoppingCart size={18} />}
              label="Sales"
              active={page === "sales"}
            />
            <NavItem
              to="/inventory"
              icon={<TableProperties size={18} />}
              label="Inventory"
              active={page === "inventory"}
            />
            <NavItem
              to="/customers"
              icon={<Users size={18} />}
              label="Customers"
              active={page === "customers"}
            />
            <NavItem
              to="/staff"
              icon={<Users size={18} />}
              label="Staff"
              active={page === "staff"}
            />
          </nav>

          <div className="p-4 border-t border-gray-100/50">
            <button className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* --- MINIMALIST NATURAL HEADER --- */}
          <header className="h-20 px-8 bg-white flex items-center justify-between flex-shrink-0">
            {/* Left: Page Context */}
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800 tracking-tight capitalize">
                {page || "Dashboard"}
              </h2>
            </div>

            {/* Right: Identity Info (Name & Email) */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl">
              <div className="text-right">
                <p className="text-xs text-gray-800 leading-none">
                  {appState.user?.username || "Admin"}
                </p>
              </div>

              <div className="w-7 h-7 bg-indigo-10 text-gray-800 rounded-full flex items-center justify-center border border-gray-800">
                <User size={15} />
              </div>
            </div>
          </header>

          {/* --- PAGE CONTENT --- */}
          <main className="flex-1 px-8 pb-8 overflow-y-auto">
            {page === "dashboard" ? (
              <Dashboard />
            ) : page === "sales" ? (
              <SalesTable />
            ) : page === "inventory" ? (
              <Inventory />
            ) : page === "customers" ? (
              <CustomerPage />
            ) : page === "staff" ? (
              <StaffPage />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 font-medium italic font-sans">
                Select a module to begin
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

function NavItem({ icon, label, active, to }) {
  return (
    <Link to={to}>
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
          active
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-indigo-600"
        }`}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  )
}
