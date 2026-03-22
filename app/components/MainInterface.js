import React, { useContext, useEffect } from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  TableProperties,
} from "lucide-react"
import Dashboard from "./Pages/Dashboard/Dashboard"
import SalesTable from "./Pages/Sales/SalesTable"
import { useParams, Link } from "react-router-dom"
import ProductTable from "./Pages/Inventory/ProductTable"
import AddProductModal from "./Pages/Inventory/AddProductModal"
import SalesModal from "./Pages/Sales/SalesModal"
import StateContext from "../StateContext"

export default function MainLayout({ children }) {
  const { page } = useParams()
  const appState = useContext(StateContext)

  useEffect(() => {
    console.log("Current page:", page)
  }, [])
  return (
    <>
      {appState.isSalesModalOpen && <SalesModal />}
      {appState.isProductModalOpen && <AddProductModal />}
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md flex flex-col">
          <div className="p-6 flex flex-col items-center border-b">
            <img src="logo.jpg" alt="Logo" className="w-10 h-10 mb-2" />
            <h2 className="font-bold text-gray-800">My Store POS</h2>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavItem
              to="/dashboard"
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              active={page === "dashboard"}
            />
            <NavItem
              to="/sales"
              icon={<ShoppingCart size={20} />}
              label="Sales"
              active={page === "sales"}
            />
            <NavItem
              to="/products"
              icon={<Package size={20} />}
              label="Products"
              active={page === "products"}
            />
            <NavItem
              to="/inventory"
              icon={<TableProperties size={20} />}
              label="Inventory"
              active={page === "inventory"}
            />
            <NavItem
              to="/customers"
              icon={<Users size={20} />}
              label="Customers"
              active={page === "customers"}
            />
          </nav>

          <div className="p-4 border-t">
            <button className="flex items-center gap-3 w-full px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header with Stats */}
          <header className="bg-white p-6 shadow-sm flex gap-6 overflow-x-auto">
            <HeaderStat
              label="Daily Sales"
              value="$1,200"
              color="text-blue-600"
            />
            <HeaderStat
              label="Items on Shelf"
              value="150"
              color="text-green-600"
            />
            <HeaderStat
              label="Items in Store"
              value="1,400"
              color="text-orange-600"
            />
          </header>

          {/* Render the approriate page based on the URL param */}
          <main className="p-8 overflow-y-auto">
            {page == "dashboard" ? (
              <Dashboard />
            ) : page == "sales" ? (
              <SalesTable />
            ) : page == "products" ? (
              <ProductTable />
            ) : (
              "Page Not Found"
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
        className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
          active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  )
}

function HeaderStat({ label, value, color }) {
  return (
    <div className="bg-gray-50 px-4 py-3 rounded-lg min-w-[150px]">
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className={`text-xl font-bold ${color}`}>{value}</h3>
    </div>
  )
}
