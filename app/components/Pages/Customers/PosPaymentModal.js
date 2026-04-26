import React, { useState, useContext } from "react"
import { motion } from "framer-motion"
import { X, Save, Loader2, Banknote, MessageSquare } from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function PostPaymentModal({ customer, onClose, onRefresh }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("Cash")
  const [note, setNote] = useState("") // New state for notes
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await Axios.post(`${appState.backendURL}/post-customer-payment`, {
        customerId: customer._id,
        amount: parseFloat(amount),
        paymentMethod: method,
        note: note, // Sending the note to the backend ledger logic
        operatorName: localStorage.getItem("fullName") || "Admin",
      })
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: "Payment Posted Successfully" },
      })
      onRefresh()
      onClose()
    } catch (e) {
      const errorMsg = e.response?.data || "Payment failed. Please try again."
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: errorMsg },
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* Header - Standardized Padding/Roundness */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Banknote size={20} />
            <div>
              <h2 className="text-xs font-black uppercase tracking-tight">
                Post Payment
              </h2>
              <p className="text-[10px] font-bold opacity-80">
                {customer.fullName || customer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Debt Summary */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg text-center">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">
              Current Outstanding Debt
            </p>
            <h3 className="text-xl font-black text-emerald-700">
              ₦{(customer.creditBalance || 0).toLocaleString()}
            </h3>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 font-black text-emerald-600 text-lg">
                ₦
              </span>
              <input
                required
                autoFocus
                type="number"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-xl font-black text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            {["Cash", "POS", "Transfer"].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${method === m ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* NEW: Note / Reference Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <MessageSquare size={10} /> Note / Reference
            </label>
            <textarea
              rows="2"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-emerald-500 outline-none transition-all resize-none"
              placeholder="e.g. Bank transfer ref, partial payment for oct..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSaving || !amount}
            className="w-full py-4 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:shadow-none"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Updating Ledger..." : "Confirm & Post Payment"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
