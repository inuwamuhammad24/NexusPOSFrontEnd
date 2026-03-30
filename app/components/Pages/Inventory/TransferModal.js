import React, { useContext, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  ArrowRightLeft,
  ArrowRight,
  Box,
  LayoutGrid,
  Info,
  Check,
  Warehouse,
} from "lucide-react"
import DispatchContext from "../../../DispatchContext"

export default function TransferModal({ sourceStore }) {
  const appDispatch = useContext(DispatchContext)
  const [transferQty, setTransferQty] = useState("")
  const [targetStore, setTargetStore] = useState("")

  const handleSubmit = e => {
    e.preventDefault()
    console.log(
      `Transferring ${transferQty} from ${sourceStore || "Main"} to ${targetStore}`,
    )
    appDispatch({ type: "closeTransferModal" })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={() => appDispatch({ type: "closeTransferModal" })}
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
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
                  Transfer Stock
                </h2>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Internal Movement
                </p>
              </div>
            </div>
            <button
              onClick={() => appDispatch({ type: "closeTransferModal" })}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Product Selection */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                Select Product
              </label>
              <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none">
                <option>Fresh Milk 1L</option>
                <option>Sugar 50kg</option>
                <option>Whole Bread</option>
              </select>
            </div>

            {/* Transfer Visualizer */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                <span className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
                  Source
                </span>
                <p className="text-xs font-semibold text-gray-700 truncate w-full text-center">
                  {sourceStore || "Main Warehouse"}
                </p>
              </div>

              <ArrowRight className="text-indigo-400 shrink-0" size={20} />

              <div className="flex-1 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col items-center">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase mb-1">
                  Destination
                </span>
                <select
                  required
                  className="w-full bg-transparent text-xs font-semibold text-indigo-700 text-center outline-none cursor-pointer"
                  onChange={e => setTargetStore(e.target.value)}
                >
                  <option value="">Select Target</option>
                  <option value="Shelf">Retail Shelf</option>
                  <option value="Cold">Cold Storage</option>
                </select>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="text-[11px] font-semibold text-gray-500 uppercase mb-3 block text-center italic">
                Enter quantity to move
              </label>
              <div className="flex items-center justify-center gap-3">
                <input
                  required
                  type="number"
                  placeholder="0"
                  className="w-32 bg-white border border-gray-200 p-3 rounded-xl text-2xl font-semibold text-center text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={transferQty}
                  onChange={e => setTransferQty(e.target.value)}
                />
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-600">
                    Cartons / Sacks
                  </p>
                  <p className="text-[10px] text-gray-400">Full Units Only</p>
                </div>
              </div>
            </div>

            {/* Information Note */}
            <div className="flex gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <Info className="text-indigo-400 shrink-0" size={14} />
              <p className="text-[10px] text-indigo-600 font-medium leading-relaxed">
                Stock moved to the <b>Retail Shelf</b> will be automatically
                broken into individual units for sale.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => appDispatch({ type: "closeTransferModal" })}
                className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-indigo-700 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Execute Transfer
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
