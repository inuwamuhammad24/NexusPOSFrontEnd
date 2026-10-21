import React, { useContext, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  X,
  Package,
  Tag,
  Hash,
  Layers,
  Banknote,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import formatNaira from "../../Reusables/NairaFormatter"

export default function AddProductModal({ isOpen = true, onClose, onSuccess }) {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unitType: "Pieces",
    costPrice: "",
    sellingPrice: "",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [errorBanner, setErrorBanner] = useState("")
  const nameInputRef = useRef(null)

  // --- DERIVED METRICS ---
  const cost = parseFloat(formData.costPrice) || 0
  const selling = parseFloat(formData.sellingPrice) || 0
  const profit = selling - cost
  const margin = selling > 0 ? ((profit / selling) * 100).toFixed(1) : "0.0"
  const isLossMaking = selling > 0 && cost > 0 && profit < 0

  // --- KEYBOARD & FOCUS ACCESSIBILITY ---
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = e => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    const timer = setTimeout(() => nameInputRef.current?.focus(), 50)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose()
    } else {
      appDispatch({ type: "closeProductModal" })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setErrorBanner("")

    // Validation guardrails
    if (!formData.name.trim()) {
      setErrorBanner("Please enter a product name.")
      return
    }

    if (!formData.sellingPrice || selling <= 0) {
      setErrorBanner("Selling price must be greater than ₦0.")
      return
    }

    if (cost < 0) {
      setErrorBanner("Buying price cannot be negative.")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        token: appState.user?.token,
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        unitType: formData.unitType,
        costPrice: cost,
        sellingPrice: selling,
      }

      const response = await Axios.post(
        `${appState.backendURL}/products/create`,
        payload,
      )

      if (response.data) {
        appDispatch({
          type: "addFlashMessage",
          payload: {
            type: "success",
            msg: `${formData.name} added to your inventory!`,
          },
        })

        if (typeof onSuccess === "function") {
          onSuccess(response.data)
        }

        handleClose()
      }
    } catch (error) {
      console.error("Error adding product:", error)
      const errorMsg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Could not add product. Please confirm this SKU isn't already used."

      setErrorBanner(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm antialiased"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-product-title"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 z-10 max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Package size={18} />
            </div>
            <div>
              <h2
                id="modal-add-product-title"
                className="text-sm font-bold text-gray-900 tracking-tight"
              >
                Add New Product
              </h2>
              <p className="text-xs text-gray-500">
                Add a product to your store inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100 uppercase tracking-wide">
              Inventory
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Error Banner */}
          {errorBanner && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{errorBanner}</span>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Product name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag
                className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                ref={nameInputRef}
                required
                type="text"
                placeholder="e.g. Dangote Sugar (50kg)"
                value={formData.name}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>

          {/* SKU & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                SKU / Barcode
              </label>
              <div className="relative">
                <Hash
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="e.g. SKU-001"
                  value={formData.sku}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 uppercase placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none font-mono"
                  onChange={e =>
                    setFormData({
                      ...formData,
                      sku: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Unit
              </label>
              <div className="relative">
                <Layers
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={16}
                />
                <select
                  value={formData.unitType}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer"
                  onChange={e =>
                    setFormData({ ...formData, unitType: e.target.value })
                  }
                >
                  <option value="Pieces">Pieces</option>
                  <option value="Sack">Sack</option>
                  <option value="Carton">Carton</option>
                  <option value="Crate">Crate</option>
                  <option value="Pack">Pack</option>
                  <option value="Roll">Roll</option>
                  <option value="Bottle">Bottle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Buying price
              </label>
              <div className="relative">
                <Banknote
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={16}
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={formData.costPrice}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  onChange={e =>
                    setFormData({ ...formData, costPrice: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Selling price <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Banknote
                  className="absolute left-3.5 top-3 text-indigo-500 pointer-events-none"
                  size={16}
                />
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={formData.sellingPrice}
                  className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  onChange={e =>
                    setFormData({ ...formData, sellingPrice: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Profit & Margin Calculator Card */}
          {(selling > 0 || cost > 0) && (
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isLossMaking
                  ? "bg-rose-50/60 border-rose-200"
                  : "bg-indigo-50/50 border-indigo-100"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                  <TrendingUp
                    size={14}
                    className={
                      isLossMaking ? "text-rose-500" : "text-indigo-600"
                    }
                  />
                  Expected profit
                </span>
                <span
                  className={`font-black ${
                    isLossMaking ? "text-rose-600" : "text-indigo-900"
                  }`}
                >
                  {formatNaira(profit)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/40">
                <span className="font-medium text-gray-500">Profit margin</span>
                <span
                  className={`font-bold ${
                    isLossMaking ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {margin}%
                </span>
              </div>

              {isLossMaking && (
                <p className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Selling price is currently lower
                  than buying price.
                </p>
              )}
            </div>
          )}

          {/* Real-time Catalog Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-gray-200/80 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Product preview
            </p>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-gray-900 truncate">
                  {formData.name.trim() || "Item Name"}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {formData.sku.trim() || "SKU-AUTO"} • {formData.unitType}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-indigo-700">
                  {selling > 0 ? formatNaira(selling) : "₦0.00"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Adding product...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
