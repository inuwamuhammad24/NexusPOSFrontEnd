import React, { useState, useEffect, useContext } from "react"
import { X, Save, Info, DollarSign, Package, Loader2 } from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import { motion } from "framer-motion"

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  onUpdateSuccess,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    costPrice: 0,
    sellingPrice: 0,
    packaging: "Carton",
    unitsPerPack: 1,
    minStock: 5,
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
        packaging: product.packaging || "Carton",
        unitsPerPack: product.unitsPerPack || 1,
        minStock: product.minStock || 5,
      })
    }
  }, [product])

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await Axios.post(`${appState.backendURL}/update-product`, {
        id: product._id,
        ...form,
      })
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: "Product updated!" },
      })
      onUpdateSuccess()
      onClose()
    } catch (err) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Update failed." },
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-end bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        className="bg-white w-full max-w-md h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">
              Edit Product
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              SKU: {product.sku}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin"
        >
          {/* Identity Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Info size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">
                Product Identity
              </h3>
            </div>
            <Input
              label="Product Name"
              value={form.name}
              onChange={v => setForm({ ...form, name: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU / Barcode"
                value={form.sku}
                onChange={v => setForm({ ...form, sku: v })}
              />
              <Input
                label="Category"
                value={form.category}
                onChange={v => setForm({ ...form, category: v })}
              />
            </div>
          </section>

          {/* Financials Section */}
          <section className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <DollarSign size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">
                Financials & Pricing
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Buy Price (Cost)"
                type="number"
                value={form.costPrice}
                onChange={v => setForm({ ...form, costPrice: v })}
              />
              <Input
                label="Sell Price (Default)"
                type="number"
                value={form.sellingPrice}
                onChange={v => setForm({ ...form, sellingPrice: v })}
              />
            </div>
          </section>

          {/* Logistics Section */}
          <section className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Package size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">
                Packaging & Logistics
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">
                  Packaging Type
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                  value={form.packaging}
                  onChange={e =>
                    setForm({ ...form, packaging: e.target.value })
                  }
                >
                  <option>Carton</option>
                  <option>Pack</option>
                  <option>Sack</option>
                  <option>Unit</option>
                </select>
              </div>
              <Input
                label="Units Per Pack"
                type="number"
                value={form.unitsPerPack}
                onChange={v => setForm({ ...form, unitsPerPack: v })}
              />
            </div>
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              value={form.minStock}
              onChange={v => setForm({ ...form, minStock: v })}
            />
          </section>
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-3 bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}{" "}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-sm"
      />
    </div>
  )
}
