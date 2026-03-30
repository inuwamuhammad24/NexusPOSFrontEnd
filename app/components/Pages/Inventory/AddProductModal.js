import React, { useContext, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Package,
  Tag,
  Hash,
  LayoutGrid,
  Warehouse,
  Check,
  ChevronDown,
} from "lucide-react"
import DispatchContext from "../../../DispatchContext"

export default function AddProductModal() {
  const appDispatch = useContext(DispatchContext)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    category: "General",
    shelf: 0,
    store: 0,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      onSave(formData)
      setIsSaving(false)
      appDispatch({ type: "closeProductModal" })
    }, 800)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => appDispatch({ type: "closeProductModal" })}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
                  New Product Entry
                </h2>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Catalog Management
                </p>
              </div>
            </div>
            <button
              onClick={() => appDispatch({ type: "closeProductModal" })}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Product Name */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                Product Name
              </label>
              <div className="relative">
                <Tag
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="text"
                  placeholder="e.g. Fresh Milk 1L"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* SKU */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                  SKU / Barcode
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-4 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    required
                    type="text"
                    placeholder="SKU-001"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    onChange={e =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                  Selling Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-blue-600 font-semibold text-sm">
                    $
                  </span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-blue-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    onChange={e =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Stock Levels (Visual Distinction) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block text-center">
                  Shelf Units
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full bg-white border border-blue-200 p-2.5 rounded-lg text-lg font-semibold text-blue-700 text-center focus:ring-0 focus:border-blue-500 transition-all"
                  onChange={e =>
                    setFormData({ ...formData, shelf: e.target.value })
                  }
                />
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <label className="text-[10px] font-bold text-emerald-600 uppercase mb-2 block text-center">
                  Store Units
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full bg-white border border-emerald-200 p-2.5 rounded-lg text-lg font-semibold text-emerald-700 text-center focus:ring-0 focus:border-emerald-500 transition-all"
                  onChange={e =>
                    setFormData({ ...formData, store: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => appDispatch({ type: "closeProductModal" })}
                className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Add to Catalog
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
