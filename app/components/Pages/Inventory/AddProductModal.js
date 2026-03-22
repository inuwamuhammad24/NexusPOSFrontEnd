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
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function AddProductModal() {
  const appState = useContext(StateContext)
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

  //   const handleSubmit = async e => {
  //     e.preventDefault()
  //     setIsSaving(true)

  //     // Simulate API call
  //     setTimeout(() => {
  //       console.log("Saving Product:", formData)
  //       setIsSaving(false)
  //       onSave(formData) // Callback to refresh the table
  //     }, 1000)
  //   }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => appDispatch({ type: "closeProductModal" })}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Add New Product
                </h2>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Inventory Entry
                </p>
              </div>
            </div>
            <button
              onClick={() => appDispatch({ type: "closeProductModal" })}
              className="p-2 hover:bg-white hover:shadow-sm rounded-full transition text-gray-400"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  <Tag size={14} /> Product Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Fresh Milk 1L"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* SKU & Price */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  <Hash size={14} /> SKU / Barcode
                </label>
                <input
                  required
                  type="text"
                  placeholder="SKU-001"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  onChange={e =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  $ Selling Price
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-blue-600 font-bold"
                  onChange={e =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              {/* Stock Management */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  <LayoutGrid size={14} /> Initial Shelf Stock
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  onChange={e =>
                    setFormData({ ...formData, shelf: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                  <Warehouse size={14} /> Initial Store Stock
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-orange-600 font-bold"
                  onChange={e =>
                    setFormData({ ...formData, store: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => appDispatch({ type: "closeProductModal" })}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2 disabled:bg-blue-300"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={20} />
                    Save Product
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
