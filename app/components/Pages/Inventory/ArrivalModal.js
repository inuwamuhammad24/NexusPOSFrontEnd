import React, { useContext, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Truck, Box, Save, Package, Hash, Archive } from "lucide-react"
import DispatchContext from "../../../DispatchContext"

export default function ArrivalModal({ targetStore }) {
  const appDispatch = useContext(DispatchContext)
  const [receivingType, setReceivingType] = useState("carton")
  const [bulkQty, setBulkQty] = useState("")
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={() => appDispatch({ type: "closeArrivalModal" })}
        />

        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header - Using more natural weights */}
          <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Bulk Reception
                </h2>
                <p className="text-emerald-100 text-xs font-medium">
                  Store: {targetStore?.name || "Main Warehouse"}
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

          <form className="p-6 space-y-5">
            {/* Product Selection */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Product to Receive
              </label>
              <div className="relative">
                <Package
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <select className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none outline-none">
                  <option>Fresh Milk 1L (Carton)</option>
                  <option>Sugar 50kg (Sack)</option>
                  <option>Basmati Rice 25kg (Sack)</option>
                </select>
              </div>
            </div>

            {/* Packaging Type Toggle */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Container Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReceivingType("carton")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${receivingType === "carton" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}
                >
                  <Box size={14} /> Carton
                </button>
                <button
                  type="button"
                  onClick={() => setReceivingType("sack")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${receivingType === "sack" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}
                >
                  <Archive size={14} /> Sack
                </button>
              </div>
            </div>

            {/* Bulk Quantity Input */}
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
              <label className="text-[11px] font-semibold text-emerald-600 uppercase mb-3 block text-center">
                Total {receivingType}s Received
              </label>
              <input
                autoFocus
                required
                type="number"
                placeholder="0"
                className="w-full bg-white border border-emerald-200 p-4 rounded-xl text-3xl font-semibold text-emerald-700 text-center focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                value={bulkQty}
                onChange={e => setBulkQty(e.target.value)}
              />
            </div>

            {/* Batch Info */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Waybill / Reference
              </label>
              <div className="relative">
                <Hash
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="e.g. WB-9042"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Confirm Arrival
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
