import React, { useState, useContext } from "react"
import { motion } from "framer-motion"
import { X, Warehouse, Store, MapPin, User, Hash, Info } from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"

export default function AddLocationModal() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)
  const [formData, setFormData] = useState({
    name: "",
    type: "Warehouse",
    code: "",
    manager: "",
    address: "",
  })

  const handleSubmit = async e => {
    e.preventDefault()
    // Axios.post logic here
    try {
      const response = await Axios.post(
        `${appState.backendURL}/create-location`,
        formData,
      )
      if (response.data) {
        appDispatch({ type: "closeLocationModal" })
        appDispatch({
          type: "addFlashMessage",
          payload: { type: "success", msg: "Location created successfully!" },
        })
      }
    } catch (error) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Failed to create location." },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Header - Scaled Down */}
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">
              New Storage Node
            </h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Register Warehouse or Store
            </p>
          </div>
          <button
            onClick={() => appDispatch({ type: "closeLocationModal" })}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. COMPACT TYPE SELECTOR */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "Warehouse" })}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                formData.type === "Warehouse"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              <Warehouse size={14} /> Warehouse
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "Frontend" })}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                formData.type === "Frontend"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              <Store size={14} /> Storefront
            </button>
          </div>

          <div className="space-y-3">
            {/* 2. NAME & CODE (Small Labels) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Node Name
                </label>
                <input
                  required
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="e.g. Kano Hub"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Ref Code
                </label>
                <input
                  required
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="WH-01"
                  value={formData.code}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>

            {/* 3. MANAGER */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Manager In-Charge
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-2.5 text-gray-300"
                  size={14}
                />
                <input
                  required
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="Full name"
                  value={formData.manager}
                  onChange={e =>
                    setFormData({ ...formData, manager: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 4. ADDRESS */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Address / Location
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3.5 top-2.5 text-gray-300"
                  size={14}
                />
                <textarea
                  required
                  rows="2"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                  placeholder="Physical street address"
                  value={formData.address}
                  onChange={e =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 5. ACTION BUTTONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => appDispatch({ type: "closeLocationModal" })}
              className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-[2] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${
                formData.type === "Warehouse"
                  ? "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700"
                  : "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700"
              }`}
            >
              Initialize Node
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
