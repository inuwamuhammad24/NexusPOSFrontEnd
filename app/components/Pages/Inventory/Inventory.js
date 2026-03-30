import React, { useContext, useState } from "react"
import {
  Plus,
  Truck,
  Warehouse,
  Search,
  Filter,
  Package,
  ArrowRightLeft, // Added for the transfer icon
} from "lucide-react"
import ProductTable from "./ProductTable"
import ArrivalModal from "./ArrivalModal"
import TransferModal from "./TransferModal"
import AddProductModal from "./AddProductModal"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function InventoryPage() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)
  const [selectedStore, setSelectedStore] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const warehouses = [
    {
      id: "WH-01",
      name: "Main Warehouse",
      location: "North Wing",
      capacity: "85%",
    },
    {
      id: "WH-02",
      name: "Cold Storage",
      location: "Basement",
      capacity: "40%",
    },
    {
      id: "STR-01",
      name: "Retail Shelf",
      location: "Front Floor",
      capacity: "65%",
    },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Modals */}
      {appState.isTransferModalOpen && <TransferModal />}
      {appState.isArrivalModalOpen && (
        <ArrivalModal targetStore={selectedStore} />
      )}
      {appState.isProductModalOpen && <AddProductModal />}
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight uppercase">
            Inventory Control
          </h1>
          <p className="text-sm text-gray-500 font-medium italic">
            Manage stock movements and bulk receptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 🔄 THE NEW TRANSFER BUTTON */}
          <button
            onClick={() => appDispatch({ type: "openTransferModal" })}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 hover:text-indigo-600 transition shadow-sm"
          >
            <ArrowRightLeft size={16} />
            Transfer Stock
          </button>

          <button
            onClick={() => appDispatch({ type: "openArrivalModal" })}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            <Truck size={16} />
            Stock Arrival
          </button>

          <button
            onClick={() => appDispatch({ type: "openProductModal" })}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={16} />
            New Product
          </button>
        </div>
      </div>

      {/* --- WAREHOUSE LOCATIONS GRID --- */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">
            Storage Locations
          </h2>
          {selectedStore && (
            <button
              onClick={() => setSelectedStore(null)}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Global Stock
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouses.map(wh => (
            <div
              key={wh.id}
              onClick={() => setSelectedStore(wh.id)}
              className={`p-6 rounded-2xl border transition-all duration-300 ${
                selectedStore === wh.id
                  ? "border-indigo-500 bg-indigo-50/30 shadow-sm"
                  : "border-gray-100 bg-white hover:border-indigo-200 group cursor-pointer"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2.5 rounded-xl ${selectedStore === wh.id ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}
                >
                  <Warehouse size={20} />
                </div>

                {/* QUICK ACTION GROUP */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setSelectedStore(wh.id)
                      appDispatch({ type: "openTransferModal" })
                    }}
                    className="p-2 bg-white border border-gray-100 text-gray-500 rounded-lg hover:text-indigo-600 hover:border-indigo-200 shadow-sm"
                    title="Transfer from this store"
                  >
                    <ArrowRightLeft size={14} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setSelectedStore(wh.id)
                      appDispatch({ type: "openArrivalModal" })
                    }}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors shadow-sm"
                    title="Receive to this store"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{wh.name}</h3>
              <div className="mt-4 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: wh.capacity }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- MASTER PRODUCT LIST --- */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Package size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-sm text-gray-800">
              {selectedStore
                ? `Products in ${warehouses.find(w => w.id === selectedStore).name}`
                : "Master Product List"}
            </h3>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search SKU or name..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <ProductTable filterByStore={selectedStore} searchQuery={searchQuery} />
      </section>
    </div>
  )
}
