import React, { useContext, useState, useEffect, useCallback } from "react"
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
  RotateCcw,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import Axios from "axios"
import ProductTable from "./ProductTable"
import TransferModal from "./TransferModal"
import ArrivalModal from "./ArrivalModal"
import AddProductModal from "./AddProductModal"
import AddLocationModal from "./AddLocationModal"
import EditProductModal from "./EditProductModal"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // --- FETCH STORAGE NODES (SCOPED BY STOREID VIA POST) ---
  const fetchLocations = useCallback(async () => {
    if (!appState.user?.token) return
    setIsLoadingLocs(true)
    try {
      const response = await Axios.post(
        `${appState.backendURL}/get-all-locations`,
        {
          token: appState.user.token, // Extracted by storeGuard -> req.storeId
        },
      )
      setLocations(Array.isArray(response.data) ? response.data : [])
    } catch (e) {
      console.error("Error fetching store locations:", e)
      setLocations([])
    } finally {
      setIsLoadingLocs(false)
    }
  }, [appState.backendURL, appState.user?.token])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const activeLoc = locations.find(l => l._id === selectedStore)

  // --- ACTION HANDLERS ---
  const handleQuickArrival = (e, locId) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedStore(locId)
    appDispatch({ type: "openArrivalModal" })
  }

  const handleQuickTransfer = (e, locId) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedStore(locId)
    appDispatch({ type: "openTransferModal" })
  }

  const handleEditClick = product => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const triggerInventoryRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-8 pb-10 font-sans antialiased text-gray-900">
      {/* Modals Layer */}
      {appState.isProductModalOpen && (
        <AddProductModal
          isOpen={appState.isProductModalOpen}
          onClose={() => appDispatch({ type: "closeProductModal" })}
        />
      )}
      <AnimatePresence>
        {appState.isTransferModalOpen && (
          <TransferModal
            sourceLocation={selectedStore}
            onSuccess={triggerInventoryRefresh}
          />
        )}
        {appState.isArrivalModalOpen && (
          <ArrivalModal
            targetStore={selectedStore}
            onSuccess={triggerInventoryRefresh}
          />
        )}
        {appState.isProductModalOpen && (
          <AddProductModal onSuccess={triggerInventoryRefresh} />
        )}
        {appState.isLocationModalOpen && (
          <AddLocationModal
            onSuccess={() => {
              fetchLocations()
              triggerInventoryRefresh()
            }}
          />
        )}
        {isEditModalOpen && (
          <EditProductModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            product={selectedProduct}
            onUpdateSuccess={() => {
              setIsEditModalOpen(false)
              triggerInventoryRefresh()
            }}
          />
        )}
      </AnimatePresence>

      {/* --- 1. ACTION HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">
            Inventory & Stock Engine
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1.5">
            {appState.user.businessName || "Store"} • Partitioned Multi-Node
            Ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => appDispatch({ type: "openProductModal" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition active:scale-[0.98]"
          >
            <Plus size={15} /> Add Product
          </button>

          <button
            onClick={() => appDispatch({ type: "openTransferModal" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 hover:text-indigo-600 transition shadow-sm active:scale-[0.98]"
          >
            <ArrowRightLeft size={14} className="text-indigo-600" /> Transfer
          </button>

          <button
            onClick={() => appDispatch({ type: "openLocationModal" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition shadow-sm active:scale-[0.98]"
          >
            <PlusCircle size={14} className="text-indigo-600" /> Add Node
          </button>
        </div>
      </div>

      {/* --- 2. STORAGE NODES GRID --- */}
      <section className="space-y-3.5">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Settings2 size={15} className="text-indigo-600" />
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Storage Branches & Nodes
            </h2>
          </div>
          <button
            onClick={() => setSelectedStore(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              !selectedStore
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <Globe size={13} /> Global View
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingLocs ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
              <span className="text-xs text-gray-400 font-medium">
                Loading store nodes...
              </span>
            </div>
          ) : (
            <>
              {locations.map(loc => (
                <div
                  key={loc._id}
                  onClick={() => setSelectedStore(loc._id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all relative group ${
                    selectedStore === loc._id
                      ? "border-indigo-600 bg-white shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-600/20"
                      : "border-gray-200/80 bg-white hover:border-indigo-200 shadow-sm"
                  }`}
                >
                  {/* Floating Node Actions */}
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button
                      type="button"
                      onClick={e => handleQuickTransfer(e, loc._id)}
                      className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                      title="Transfer from this location"
                    >
                      <ArrowRightLeft size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={e => handleQuickArrival(e, loc._id)}
                      className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                      title="Receive stock here"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        selectedStore === loc._id
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {loc.type === "Warehouse" ? (
                        <Warehouse size={18} />
                      ) : (
                        <Store size={18} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        loc.type === "Warehouse"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      }`}
                    >
                      {loc.code || "Branch"}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                    {loc.name}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>Terminal Mode</span>
                    <span className="font-semibold text-gray-700">
                      {loc.type || "Retail"}
                    </span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => appDispatch({ type: "openLocationModal" })}
                className="p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/20 transition flex flex-col items-center justify-center gap-2 group min-h-[130px]"
              >
                <div className="p-2.5 bg-white rounded-xl text-gray-400 group-hover:text-indigo-600 group-hover:scale-110 transition shadow-sm border border-gray-100">
                  <PlusCircle size={18} />
                </div>
                <p className="text-xs font-semibold text-gray-600 group-hover:text-indigo-600">
                  Register New Node
                </p>
              </button>
            </>
          )}
        </div>
      </section>

      {/* --- 3. PRODUCT TABLE WORKSPACE --- */}
      <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                selectedStore
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Package size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-none">
                {activeLoc ? activeLoc.name : "Consolidated Stock Master"}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {activeLoc
                  ? `Filtered view for node code ${activeLoc.code}`
                  : "Displaying all inventoried assets across all branches"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                size={15}
              />
              <input
                type="text"
                placeholder="Search stock by SKU or name..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={triggerInventoryRefresh}
              className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition"
              title="Refresh ledger"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        <ProductTable
          locationId={selectedStore}
          searchQuery={searchQuery}
          onEdit={handleEditClick}
          refreshSignal={refreshTrigger}
        />
      </section>
    </div>
  )
}
