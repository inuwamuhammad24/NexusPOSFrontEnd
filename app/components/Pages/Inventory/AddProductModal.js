import React, { useContext, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Package, Tag, Hash, Check, Layers, Banknote } from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"

export default function AddProductModal() {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unitType: "Sack",
    sellingPrice: "",
    costPrice: "",
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await Axios.post(
        `${appState.backendURL}/create-product`,
        formData,
      )
      if (response) {
        console.log(response.data)
        appDispatch({ type: "closeProductModal" })
        appDispatch({
          type: "addFlashMessage",
          payload: { type: "success", msg: "Product registered successfully!" },
        })
      }
    } catch (error) {
      console.error("Error saving product:", error)
      setIsSaving(false)
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Failed to register product." },
      })
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => appDispatch({ type: "closeProductModal" })}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                  Define Master Product
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Identity Management
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Product Name
              </label>
              <div className="relative">
                <Tag
                  className="absolute left-4 top-2.5 text-gray-300"
                  size={16}
                />
                <input
                  required
                  type="text"
                  placeholder="e.g. Dangote Sugar (50kg)"
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* SKU */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  SKU / Barcode
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-4 top-2.5 text-gray-300"
                    size={16}
                  />
                  <input
                    required
                    type="text"
                    placeholder="SKU-001"
                    className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    onChange={e =>
                      setFormData({
                        ...formData,
                        sku: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>

              {/* Unit Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Unit Type
                </label>
                <div className="relative">
                  <Layers
                    className="absolute left-4 top-2.5 text-gray-300"
                    size={16}
                  />
                  <select
                    className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    onChange={e =>
                      setFormData({ ...formData, unitType: e.target.value })
                    }
                  >
                    <option value="Sack">Sack</option>
                    <option value="Carton">Carton</option>
                    <option value="Crate">Crate</option>
                    <option value="Pack">Pack</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Cost Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Cost Price (₦)
                </label>
                <div className="relative">
                  <Banknote
                    className="absolute left-4 top-2.5 text-gray-300"
                    size={16}
                  />
                  <input
                    required
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={e =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Selling Price (₦)
                </label>
                <div className="relative">
                  <Banknote
                    className="absolute left-4 top-2.5 text-blue-300"
                    size={16}
                  />
                  <input
                    required
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={e =>
                      setFormData({ ...formData, sellingPrice: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => appDispatch({ type: "closeProductModal" })}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} strokeWidth={3} />
                    Register Product
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
