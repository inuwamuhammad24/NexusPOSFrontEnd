import React, { useContext, useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Package,
  Building2,
  Search,
  Check,
  Plus,
  Minus,
  Loader2,
  Hash,
  Truck,
  Archive,
  Box,
  Package2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"

export default function ArrivalModal({
  targetStore,
  isOpen = true,
  onClose,
  onSuccess,
}) {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  // --- RECEPTION CONTEXT ---
  const [locations, setLocations] = useState([])
  const [destinationStoreId, setDestinationStoreId] = useState(
    targetStore || "",
  )

  // --- PRODUCT SEARCH & SELECTION ---
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchAttempted, setSearchAttempted] = useState(false)

  // --- QUANTITY & METADATA ---
  const [receivingType, setReceivingType] = useState("Carton")
  const [qty, setQty] = useState("1")
  const [reference, setReference] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const searchInputRef = useRef(null)

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose()
    } else {
      appDispatch({ type: "closeArrivalModal" })
    }
  }

  // Auto-focus and keyboard shortcut bindings
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = e => {
      if (e.key === "Escape") {
        handleClose()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    const timer = setTimeout(() => searchInputRef.current?.focus(), 60)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      clearTimeout(timer)
    }
  }, [isOpen])

  // Load branch nodes for receiving branch selector
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await Axios.post(
          `${appState.backendURL}/get-all-locations`,
          {
            token: appState.user?.token,
          },
        )
        if (Array.isArray(res.data) && res.data.length > 0) {
          setLocations(res.data)
          if (!destinationStoreId) {
            setDestinationStoreId(targetStore || res.data[0]._id)
          }
        }
      } catch (err) {
        console.error("Failed loading branch nodes for reception:", err)
      }
    }

    if (appState.user?.token) {
      loadLocations()
    }
  }, [
    appState.backendURL,
    appState.user?.token,
    targetStore,
    destinationStoreId,
  ])

  // Real-time product search
  useEffect(() => {
    if (searchTerm.trim().length < 2 || selectedProduct) {
      setSearchResults([])
      setSelectedIndex(-1)
      setSearchAttempted(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      setSearchAttempted(true)
      try {
        const response = await Axios.post(
          `${appState.backendURL}/products/search`,
          {
            token: appState.user?.token,
            query: searchTerm.trim(),
          },
        )
        const results = Array.isArray(response.data) ? response.data : []
        setSearchResults(results)
        setSelectedIndex(results.length > 0 ? 0 : -1)
      } catch (e) {
        console.error("Search failed:", e)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 280)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, selectedProduct, appState.backendURL, appState.user?.token])

  // Keyboard navigation through search results
  const handleSearchKeyDown = e => {
    if (searchResults.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev,
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelectProduct(searchResults[selectedIndex])
      }
    }
  }

  const handleSelectProduct = product => {
    setSelectedProduct(product)
    setSearchResults([])
    setSearchTerm("")
    setSelectedIndex(-1)
    if (product.unitType) {
      setReceivingType(product.unitType)
    }
  }

  const handleQuantityStep = delta => {
    const current = parseFloat(qty) || 0
    const next = Math.max(1, current + delta)
    setQty(next.toString())
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const numericQty = parseFloat(qty)

    if (
      !selectedProduct ||
      !destinationStoreId ||
      isNaN(numericQty) ||
      numericQty <= 0
    ) {
      return
    }

    setIsSaving(true)
    try {
      await Axios.post(`${appState.backendURL}/record-stock`, {
        token: appState.user?.token,
        productId: selectedProduct._id,
        locationId: destinationStoreId,
        bulkQuantity: numericQty,
        unitType: receivingType,
        reference: reference.trim(),
        supplierName: supplierName.trim() || "Supplier Delivery",
      })

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `Received ${numericQty} ${receivingType}(s) of ${selectedProduct.name} successfully!`,
        },
      })

      if (typeof onSuccess === "function") {
        onSuccess()
      }

      handleClose()
    } catch (err) {
      console.error("Stock reception error:", err)
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg:
            err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to log stock reception.",
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  const activeBranch = locations.find(l => l._id === destinationStoreId)
  const isFormReady =
    selectedProduct && parseFloat(qty) > 0 && destinationStoreId

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm antialiased selection:bg-emerald-500 selection:text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-receive-stock-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={handleClose}
      />

      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Package size={18} />
            </div>
            <div>
              <h2
                id="modal-receive-stock-title"
                className="text-sm font-bold text-gray-900 tracking-tight"
              >
                Receive Stock
              </h2>
              <p className="text-xs text-gray-500">
                Add incoming inventory to your branch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100 uppercase tracking-wide">
              Inward
            </span>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Receiving Branch Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Building2 size={14} className="text-emerald-600" />
              Receiving Branch <span className="text-rose-500">*</span>
            </label>
            <select
              value={destinationStoreId}
              onChange={e => setDestinationStoreId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc._id} value={loc._id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          {/* Product Lookup & Active Selection Card */}
          <div className="space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">
                Product <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-medium">
                Ctrl + K to search
              </span>
            </div>

            {!selectedProduct ? (
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={16}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search product or scan barcode..."
                  value={searchTerm}
                  onKeyDown={handleSearchKeyDown}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-3">
                    <Loader2
                      className="animate-spin text-emerald-600"
                      size={16}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Selected Product Summary Card */
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Package size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {selectedProduct.name}
                    </p>
                    <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                      {selectedProduct.sku || "NO-SKU"} •{" "}
                      {selectedProduct.unitType || "General"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Choose another product"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Dropdown Suggestions */}
            <AnimatePresence>
              {searchResults.length > 0 && !selectedProduct && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-100"
                >
                  {searchResults.map((p, idx) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className={`w-full text-left px-4 py-2.5 transition-colors flex justify-between items-center ${
                        idx === selectedIndex
                          ? "bg-emerald-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {p.sku || "NO-SKU"} • {p.unitType || "Pieces"}
                        </p>
                      </div>
                      <CheckCircle2
                        size={15}
                        className={
                          idx === selectedIndex
                            ? "text-emerald-600"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty Search Feedback */}
            {searchAttempted &&
              searchResults.length === 0 &&
              !isSearching &&
              !selectedProduct && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle size={15} className="text-gray-400 shrink-0" />
                  <span>
                    No products found. Try searching by another keyword or SKU.
                  </span>
                </div>
              )}
          </div>

          {/* Packaging Unit Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Packaging unit
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Sack", label: "Sack", icon: Archive },
                { id: "Carton", label: "Carton", icon: Box },
                { id: "Pack", label: "Pack", icon: Package2 },
              ].map(unit => {
                const Icon = unit.icon
                const isSelected = receivingType === unit.id
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setReceivingType(unit.id)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={
                        isSelected ? "text-emerald-600" : "text-gray-400"
                      }
                    />
                    <span>{unit.label}</span>
                    {isSelected && (
                      <Check size={12} className="text-emerald-600 ml-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visual Focus: Quantity Stepper */}
          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-center space-y-2">
            <span className="text-[10px] font-bold text-emerald-900/70 uppercase tracking-wider block">
              Quantity Received
            </span>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleQuantityStep(-1)}
                className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-sm hover:bg-emerald-50 active:scale-95 transition"
                title="Decrease by 1"
              >
                <Minus size={16} />
              </button>

              <input
                required
                type="number"
                min="1"
                step="any"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-28 text-center text-3xl font-black text-emerald-900 bg-white border border-emerald-200 rounded-xl py-1.5 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-inner"
              />

              <button
                type="button"
                onClick={() => handleQuantityStep(1)}
                className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-sm hover:bg-emerald-50 active:scale-95 transition"
                title="Increase by 1"
              >
                <Plus size={16} />
              </button>
            </div>

            <span className="text-xs font-semibold text-emerald-700 block">
              {receivingType}s
            </span>
          </div>

          {/* Invoice / Reference & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Invoice / Reference #
              </label>
              <div className="relative">
                <Hash
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={15}
                />
                <input
                  type="text"
                  placeholder="e.g. INV-00241"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Supplier
              </label>
              <div className="relative">
                <Truck
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={15}
                />
                <input
                  type="text"
                  placeholder="e.g. ABC Distributors"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Receiving Sanity Summary Card */}
          {selectedProduct && (
            <div className="p-3.5 bg-slate-50 border border-gray-200/80 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Receiving Summary
              </span>
              <div className="grid grid-cols-2 gap-y-1 text-gray-600">
                <span>Product:</span>
                <span className="font-bold text-gray-900 text-right truncate">
                  {selectedProduct.name}
                </span>

                <span>Branch:</span>
                <span className="font-bold text-gray-900 text-right truncate">
                  {activeBranch?.name || "Target Branch"}
                </span>

                <span>Quantity:</span>
                <span className="font-bold text-emerald-700 text-right">
                  {qty || 0} {receivingType}s
                </span>

                {supplierName && (
                  <>
                    <span>Supplier:</span>
                    <span className="font-medium text-gray-800 text-right truncate">
                      {supplierName}
                    </span>
                  </>
                )}

                {reference && (
                  <>
                    <span>Reference:</span>
                    <span className="font-mono text-gray-700 text-right truncate">
                      {reference}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !isFormReady}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Receiving stock...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Receive Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
