import React, { useState, useEffect, useContext } from "react"
import {
  X,
  Save,
  Info,
  DollarSign,
  Package,
  Loader2,
  AlertCircle,
} from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import { motion, AnimatePresence } from "framer-motion"

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  onUpdateSuccess,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    costPrice: "",
    sellingPrice: "",
    packaging: "Carton",
    unitsPerPack: "1",
    minStock: "5",
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        costPrice: product.costPrice ?? "",
        sellingPrice: product.sellingPrice ?? "",
        packaging: product.packaging || product.unitType || "Carton",
        unitsPerPack: product.unitsPerPack ?? "1",
        minStock: product.minStock ?? "5",
      })
      setErrorMsg("")
    }
  }, [product])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = e => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = async e => {
    e.preventDefault()
    setErrorMsg("")

    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) {
      setErrorMsg("Session expired. Please sign in again.")
      return
    }

    if (!product?._id) {
      setErrorMsg("Missing product reference ID.")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        token, // Required for storeGuard -> req.storeId
        id: product._id,
        productId: product._id, // Support both naming styles in controllers
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category.trim() || "General",
        costPrice: parseFloat(form.costPrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        packaging: form.packaging,
        unitType: form.packaging, // Normalized for stock records
        unitsPerPack: parseInt(form.unitsPerPack, 10) || 1,
        minStock: parseInt(form.minStock, 10) || 5,
      }

      await Axios.post(`${appState.backendURL}/update-product`, payload)

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `Product "${payload.name}" updated successfully!`,
        },
      })

      if (typeof onUpdateSuccess === "function") {
        onUpdateSuccess()
      }

      onClose()
    } catch (err) {
      console.error("Product update error:", err)
      const msg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Failed to update product details."
      setErrorMsg(msg)
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg },
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !product) return null

  // Margin preview calculation
  const cost = parseFloat(form.costPrice) || 0
  const sell = parseFloat(form.sellingPrice) || 0
  const profit = sell - cost
  const marginPct = sell > 0 ? ((profit / sell) * 100).toFixed(1) : 0

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/60 backdrop-blur-sm antialiased">
      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden border-l border-gray-100 z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">
              Edit Product
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 font-mono">
              SKU: {product.sku || "N/A"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="edit-product-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin"
        >
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Identity Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Info size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">
                Product Identity
              </h3>
            </div>
            <Input
              label="Product Name"
              value={form.name}
              required
              onChange={v => setForm({ ...form, name: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU / Barcode"
                value={form.sku}
                required
                onChange={v => setForm({ ...form, sku: v.toUpperCase() })}
              />
              <Input
                label="Category"
                value={form.category}
                placeholder="e.g. Beverages"
                onChange={v => setForm({ ...form, category: v })}
              />
            </div>
          </section>

          {/* Financials Section */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <DollarSign size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">
                  Financials & Pricing
                </h3>
              </div>
              {sell > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profit >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                >
                  {marginPct}% Margin
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cost Price (Buy)"
                type="number"
                min="0"
                step="any"
                required
                value={form.costPrice}
                onChange={v => setForm({ ...form, costPrice: v })}
              />
              <Input
                label="Selling Price"
                type="number"
                min="0"
                step="any"
                required
                value={form.sellingPrice}
                onChange={v => setForm({ ...form, sellingPrice: v })}
              />
            </div>
          </section>

          {/* Logistics Section */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Package size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">
                Packaging & Logistics
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                  Packaging Unit
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-amber-500 cursor-pointer"
                  value={form.packaging}
                  onChange={e =>
                    setForm({ ...form, packaging: e.target.value })
                  }
                >
                  <option value="Carton">Carton</option>
                  <option value="Pack">Pack</option>
                  <option value="Sack">Sack</option>
                  <option value="Pieces">Pieces</option>
                  <option value="Crate">Crate</option>
                </select>
              </div>
              <Input
                label="Units Per Pack"
                type="number"
                min="1"
                value={form.unitsPerPack}
                onChange={v => setForm({ ...form, unitsPerPack: v })}
              />
            </div>
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              min="0"
              value={form.minStock}
              onChange={v => setForm({ ...form, minStock: v })}
            />
          </section>
        </form>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={isSaving}
            className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  min,
  step,
}) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-sm"
      />
    </div>
  )
}
