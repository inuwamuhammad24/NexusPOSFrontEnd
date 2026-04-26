import React, { useContext, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Truck,
  Box,
  Save,
  Package,
  Hash,
  Archive,
  Loader2,
  Search,
  AlertCircle,
  Milk,
  Package2,
} from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"

export default function ArrivalModal({ targetStore }) {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [receivingType, setReceivingType] = useState("Carton") // Default
  const [qty, setQty] = useState("")
  const [reference, setReference] = useState("")

  // --- REAL-TIME DEBOUNCED SEARCH ---
  useEffect(() => {
    if (searchTerm.length < 2 || selectedProduct) {
      setSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await Axios.post(
          `${appState.backendURL}/products/search`,
          {
            query: searchTerm,
          },
        )
        setSearchResults(response.data)
      } catch (e) {
        console.error("Search failed", e)
      } finally {
        setIsSearching(false)
      }
    }, 450)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, selectedProduct, appState.backendURL])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!selectedProduct || !qty) return

    setIsSaving(true)
    try {
      await Axios.post(`${appState.backendURL}/record-stock`, {
        productId: selectedProduct._id,
        locationId: targetStore,
        bulkQuantity: qty,
        unitType: receivingType, // Sending whether it's Sack, Carton, or Bottle
        reference: reference,
      })
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `Successfully added ${qty} ${receivingType}s`,
        },
      })
      appDispatch({ type: "closeArrivalModal" })
    } catch (e) {
      console.error("Stock-in error:", e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        onClick={() => appDispatch({ type: "closeArrivalModal" })}
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-emerald-600 text-white flex justify-between items-center shadow-lg shadow-emerald-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight leading-none">
                Stock Reception
              </h2>
              <p className="text-emerald-100 text-[9px] font-bold uppercase tracking-widest mt-1 opacity-80 italic leading-none">
                Target: {targetStore}
              </p>
            </div>
          </div>
          <button
            onClick={() => appDispatch({ type: "closeArrivalModal" })}
            className="p-2 hover:bg-black/10 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. PRODUCT IDENTIFICATION */}
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Identify Product
            </label>
            <div className="relative">
              <Package
                className={`absolute left-4 top-3 transition-colors ${selectedProduct ? "text-emerald-500" : "text-gray-300"}`}
                size={16}
              />
              <input
                type="text"
                placeholder="Start typing SKU or Name..."
                className={`w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all ${selectedProduct ? "bg-emerald-50/50 border-emerald-200 text-emerald-800 ring-1 ring-emerald-500" : ""}`}
                value={selectedProduct ? selectedProduct.name : searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  if (selectedProduct) setSelectedProduct(null)
                }}
              />
              {isSearching && (
                <div className="absolute right-4 top-3">
                  <Loader2
                    className="animate-spin text-emerald-500"
                    size={16}
                  />
                </div>
              )}
            </div>

            <AnimatePresence>
              {searchResults.length > 0 && !selectedProduct && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
                >
                  {searchResults.map(p => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(p)
                        setSearchResults([])
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-emerald-50 border-b border-gray-50 last:border-none transition-colors group"
                    >
                      <p className="text-xs font-black text-gray-700 group-hover:text-emerald-700">
                        {p.name}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        {p.sku} • {p.unitType}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. THREE-WAY CONTAINER SELECTION (Natural Bulk Units) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Bulk Container Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setReceivingType("Sack")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${receivingType === "Sack" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Archive size={14} /> Sack
              </button>
              <button
                type="button"
                onClick={() => setReceivingType("Carton")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${receivingType === "Carton" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Box size={14} /> Carton
              </button>
              <button
                type="button"
                onClick={() => setReceivingType("Pack")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${receivingType === "Bottle" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Package2 size={14} /> Pack
              </button>
            </div>
          </div>

          {/* 3. DYNAMIC QUANTITY AREA */}
          <div className="bg-emerald-50/20 p-5 rounded-[2rem] border border-emerald-100/50 text-center">
            <label className="text-[10px] font-black text-emerald-600 uppercase mb-3 block tracking-widest leading-none">
              Total {receivingType}s Received
            </label>
            <input
              required
              type="number"
              placeholder="0"
              className="w-full bg-white border border-emerald-200 p-4 rounded-2xl text-4xl font-black text-emerald-700 text-center focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-inner"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>

          {/* 4. REFERENCE (Waybill) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Waybill / Doc Reference
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-3 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="e.g. WB-9042"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !selectedProduct || qty <= 0}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:bg-gray-200 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Updating Stock..." : "Confirm Arrival"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
