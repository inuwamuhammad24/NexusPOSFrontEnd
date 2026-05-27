import React, { useContext, useState, useEffect } from "react"
import {
  Plus,
  Warehouse,
  Search,
  Package,
  ArrowRightLeft,
  Store,
  Globe,
  Settings2,
  PlusCircle,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Axios from "axios"
import ProductTable from "./ProductTable"
import TransferModal from "./TransferModal"
import ArrivalModal from "./ArrivalModal"
import AddProductModal from "./AddProductModal"
import AddLocationModal from "./AddLocationModal"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import EditProductModal from "./EditProductModal"

export default function InventoryPage() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // --- STATE ---
  const [locations, setLocations] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingLocs, setIsLoadingLocs] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // --- FETCH NODES ---
  useEffect(() => {
    let fetched = true
    async function getLocations() {
      try {
        const response = await Axios.get(
          `${appState.backendURL}/get-all-locations`,
        )
        if (fetched) setLocations(response.data)
      } catch (e) {
        console.error("Error fetching locations", e)
      } finally {
        if (fetched) setIsLoadingLocs(false)
      }
    }
    getLocations()
    return () => {
      fetched = false
    }
  }, [appState.backendURL])

  const activeLoc = locations.find(l => l._id === selectedStore)

  // --- ACTION HANDLERS ---
  const handleQuickArrival = (e, locId) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedStore(locId)
    setTimeout(() => {
      appDispatch({ type: "openArrivalModal" })
    }, 0)
  }

  const handleQuickTransfer = (e, locId) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedStore(locId)
    setTimeout(() => {
      appDispatch({ type: "openTransferModal" })
    }, 0)
  }

  // Function to open the modal
  const handleEditClick = product => {
    setSelectedProduct(product) // 1. Defines what data to use
    setIsEditModalOpen(true) // 2. Defines what action to take
  }

  // Function to refresh list after update
  const handleUpdateSuccess = () => {
    fetchInventory() // Re-run your inventory fetch function to show updated data
  }

  return (
    <div className="space-y-8 pb-10 font-sans">
      {/* Modals Layer */}
      <AnimatePresence>
        {appState.isTransferModalOpen && (
          <TransferModal sourceLocation={selectedStore} />
        )}
        {appState.isArrivalModalOpen && (
          <ArrivalModal targetStore={selectedStore} />
        )}
        {appState.isProductModalOpen && <AddProductModal />}
        {appState.isLocationModalOpen && <AddLocationModal />}
        {isEditModalOpen && (
          <EditProductModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            product={selectedProduct}
            onUpdateSuccess={() => setIsEditModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- 1. ACTION HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="select-none">
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">
            Inventory Control
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 italic">
            Logic-Based Stock Routing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ADD PRODUCT */}
          <button
            onClick={() => appDispatch({ type: "openProductModal" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-md active:scale-95"
          >
            <Plus size={14} strokeWidth={3} /> Add Product
          </button>

          {/* TRANSFER BUTTON (Placed next to Add Product) */}
          <button
            onClick={() => appDispatch({ type: "openTransferModal" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition shadow-sm active:scale-95"
          >
            <ArrowRightLeft size={14} strokeWidth={2.5} /> Transfer
          </button>

          {/* NEW NODE */}
          <button
            onClick={() => appDispatch({ type: "openLocationModal" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition shadow-sm"
          >
            <PlusCircle size={14} /> New Node
          </button>
        </div>
      </div>

      {/* --- 2. STORAGE NODES GRID --- */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-indigo-600" />
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Storage Nodes
            </h2>
          </div>
          <button
            onClick={() => setSelectedStore(null)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2 ${!selectedStore ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
          >
            <Globe size={12} /> Global View
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingLocs ? (
            <div className="col-span-full py-20 flex justify-center">
              <Loader2 className="animate-spin text-gray-200" size={32} />
            </div>
          ) : (
            <>
              {locations.map(loc => (
                <motion.div
                  layout
                  whileHover={{ y: -4 }}
                  key={loc._id}
                  onClick={() => setSelectedStore(loc._id)}
                  className={`p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 relative group ${
                    selectedStore === loc._id
                      ? "border-indigo-500 bg-white shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500"
                      : "border-gray-100 bg-white hover:border-indigo-200 shadow-sm"
                  }`}
                >
                  {/* FLOATING QUICK ACTIONS */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-[30]">
                    <button
                      type="button"
                      onClick={e => handleQuickTransfer(e, loc._id)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white shadow-sm transition-colors"
                      title="Transfer Stock"
                    >
                      <ArrowRightLeft size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={e => handleQuickArrival(e, loc._id)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white shadow-sm transition-colors"
                      title="Quick Arrival"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`p-3 rounded-2xl transition-colors ${selectedStore === loc._id ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}
                    >
                      {loc.type === "Warehouse" ? (
                        <Warehouse size={20} />
                      ) : (
                        <Store size={20} />
                      )}
                    </div>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-1 rounded-md mr-16 ${loc.type === "Warehouse" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {loc.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-800 text-sm leading-tight mb-4">
                    {loc.name}
                  </h3>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-gray-400">Load Factor</span>
                      <span className="text-gray-700">
                        {loc.capacity || "0%"}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: loc.capacity || "0%" }}
                        className={`h-full ${parseInt(loc.capacity) > 80 ? "bg-red-500" : "bg-indigo-500"}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => appDispatch({ type: "openLocationModal" })}
                className="p-5 rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-white hover:border-indigo-400 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="p-3 bg-white rounded-full text-gray-300 group-hover:text-indigo-600 transition-colors shadow-sm">
                  <PlusCircle size={24} strokeWidth={2.5} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Add New Node
                </p>
              </button>
            </>
          )}
        </div>
      </section>

      {/* --- 3. DYNAMIC PRODUCT TABLE --- */}
      <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-gray-50 bg-gray-50/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl ${selectedStore ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-indigo-600 border border-gray-100"}`}
            >
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-800 uppercase tracking-tight leading-none">
                {activeLoc ? activeLoc.name : "Consolidated Inventory"}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-2">
                {activeLoc
                  ? `Live data for ${activeLoc.code}`
                  : "Viewing all items across nodes"}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-4 top-3.5 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Filter current view..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ProductTable
          locationId={selectedStore}
          searchQuery={searchQuery}
          onEdit={handleEditClick}
        />
      </section>
    </div>
  )
}
