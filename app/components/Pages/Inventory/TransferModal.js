import React, { useContext, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ArrowRightLeft,
  Save,
  Loader2,
  Search,
  CheckCircle2,
  User,
  ArrowRight,
  Box,
} from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"

export default function TransferModal() {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  // Auth Context - Pulling directly from storage for persistence
  const operatorName = localStorage.getItem("fullName") || "System Operator"

  // Form State
  const [sourceLocation, setSourceLocation] = useState("")
  const [targetLocation, setTargetLocation] = useState("")
  const [qty, setQty] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Search & Async State
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [locations, setLocations] = useState([])

  // 1. Fetch All Locations
  useEffect(() => {
    async function getLocs() {
      try {
        const res = await Axios.get(`${appState.backendURL}/get-all-locations`)
        setLocations(res.data)
      } catch (e) {
        appDispatch({
          type: "addFlashMessage",
          payload: { type: "error", msg: "Network Error: Nodes unreachable" },
        })
      }
    }
    getLocs()
  }, [appState.backendURL])

  // 2. Real-time Product Fetching (Debounced)
  useEffect(() => {
    if (searchTerm.length < 2 || selectedProduct) {
      setSearchResults([])
      return
    }

    const delay = setTimeout(async () => {
      setIsSearching(true) // Indicate system is fetching
      try {
        const res = await Axios.post(`${appState.backendURL}/products/search`, {
          query: searchTerm,
        })
        setSearchResults(res.data)
      } catch (e) {
        console.error("Search failed")
      } finally {
        setIsSearching(false) // Remove fetching indicator
      }
    }, 350) // 350ms delay to prevent server spam

    return () => clearTimeout(delay)
  }, [searchTerm, selectedProduct, appState.backendURL])

  const handleTransfer = async e => {
    e.preventDefault()
    if (!selectedProduct || !sourceLocation || !targetLocation || !qty) return

    setIsSaving(true)
    try {
      const response = await Axios.post(`${appState.backendURL}/move-stock`, {
        productId: selectedProduct._id,
        sourceLocationId: sourceLocation,
        destinationLocationId: targetLocation,
        qty: qty,
        productName: selectedProduct.name,
        operatorName: operatorName,
      })

      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: response.data.msg },
      })
      appDispatch({ type: "closeTransferModal" })
    } catch (e) {
      console.log(e.responseloc)
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: e.response?.data?.msg || "Movement Rejected",
        },
      })
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
        onClick={() => appDispatch({ type: "closeTransferModal" })}
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* HEADER */}
        <div className="px-5 py-4 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft size={18} strokeWidth={2.5} />
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-tight leading-none">
                Stock Transfer
              </h2>
              <p className="text-[9px] text-indigo-100 font-bold uppercase tracking-widest mt-1 opacity-60">
                Authorize Internal Route
              </p>
            </div>
          </div>
          <button
            onClick={() => appDispatch({ type: "closeTransferModal" })}
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-5 space-y-4">
          {/* DUAL SELECTORS */}
          <div className="grid grid-cols-7 items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <div className="col-span-3">
              <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">
                From Node
              </label>
              <select
                required
                className="w-full text-[10px] font-bold text-gray-700 bg-white border border-gray-100 rounded-lg p-1.5 outline-none"
                value={sourceLocation}
                onChange={e => setSourceLocation(e.target.value)}
              >
                <option value="">Origin...</option>
                {locations.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1 flex justify-center pt-3 text-indigo-300">
              <ArrowRight size={14} strokeWidth={3} />
            </div>
            <div className="col-span-3">
              <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">
                To Node
              </label>
              <select
                required
                className="w-full text-[10px] font-bold text-gray-700 bg-white border border-gray-100 rounded-lg p-1.5 outline-none"
                value={targetLocation}
                onChange={e => setTargetLocation(e.target.value)}
              >
                <option value="">Target...</option>
                {locations.map(l => (
                  <option
                    key={l._id}
                    value={l._id}
                    disabled={l._id === sourceLocation}
                  >
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ASYNC PRODUCT SEARCH */}
          <div className="space-y-1.5 relative">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
              Select Item
              {isSearching && (
                <span className="flex items-center gap-1 text-indigo-500 lowercase normal-case italic font-medium">
                  <Loader2 size={10} className="animate-spin" /> fetching...
                </span>
              )}
            </label>
            <div className="relative">
              <Box
                className={`absolute left-3 top-2.5 ${selectedProduct ? "text-indigo-500" : "text-gray-300"}`}
                size={14}
              />
              <input
                type="text"
                placeholder="Search SKU or Name..."
                className={`w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none transition-all ${selectedProduct ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "focus:bg-white focus:border-indigo-400"}`}
                value={selectedProduct ? selectedProduct.name : searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  if (selectedProduct) setSelectedProduct(null)
                }}
              />
              {selectedProduct && (
                <CheckCircle2
                  className="absolute right-3 top-2.5 text-indigo-500"
                  size={14}
                />
              )}
            </div>

            {/* RESULTS DROPDOWN */}
            <AnimatePresence>
              {searchResults.length > 0 && !selectedProduct && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-40 overflow-y-auto custom-scrollbar"
                >
                  {searchResults.map(p => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(p)
                        setSearchResults([])
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 border-b border-gray-50 last:border-none transition-colors"
                    >
                      <p className="text-[10px] font-black text-gray-800">
                        {p.name}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                        SKU: {p.sku} • {p.unitType}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* QUANTITY SECTION */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block text-center tracking-widest">
              Quantity to Transfer
            </label>
            <input
              required
              type="number"
              placeholder="0"
              className="w-full bg-white border border-gray-200 p-2 rounded-xl text-3xl font-black text-indigo-700 text-center focus:border-indigo-500 outline-none transition-all shadow-sm"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>

          {/* IDENTITY FOOTER */}
          <div className="flex items-center gap-2 px-1 pt-2 opacity-50 border-t border-gray-50">
            <User size={10} className="text-gray-400" />
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
              Authorized: <span className="text-gray-900">{operatorName}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={
              isSaving ||
              !selectedProduct ||
              !targetLocation ||
              !sourceLocation ||
              !qty
            }
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.97] disabled:bg-gray-200 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Finalizing Transaction..." : "Complete Movement"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
