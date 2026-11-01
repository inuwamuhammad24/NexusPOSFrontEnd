// components/Pages/Customers/PosPaymentModal.js
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
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  if (!customer) return null

  const handleSubmit = async e => {
    e.preventDefault()

    const token =
      appState.user?.token ||
      localStorage.getItem("token") ||
      localStorage.getItem("nexusposToken")

    if (!token) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Session missing. Please re-login." },
      })
      return
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Please enter a valid payment amount." },
      })
      return
    }

    setIsSaving(true)
    try {
      await Axios.post(`${appState.backendURL}/post-customer-payment`, {
        token, // <-- REQUIRED: Satisfies storeGuard
        customerId: customer._id,
        amount: numericAmount,
        paymentMethod: method,
        note: note.trim(),
        operatorName:
          appState.user?.username ||
          localStorage.getItem("username") ||
          "Staff",
      })

      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: "Payment posted successfully!" },
      })

      if (typeof onRefresh === "function") onRefresh()
      if (typeof onClose === "function") onClose()
    } catch (err) {
      console.error("Payment submission error:", err)
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Payment posting failed. Please check ledger balance."

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: typeof errorMsg === "string" ? errorMsg : "Payment failed",
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  const outstandingDebt = Number(customer.creditBalance ?? customer.debt ?? 0)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Banknote size={20} />
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider">
                Post Debt Settlement
              </h2>
              <p className="text-[11px] font-bold opacity-90 truncate max-w-[200px]">
                {customer.fullName || customer.name || "Customer Account"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Debt Summary */}
          <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-0.5">
              Current Outstanding Debt
            </p>
            <h3 className="text-xl font-black text-emerald-700">
              ₦{outstandingDebt.toLocaleString()}
            </h3>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Payment Amount
              </label>
              {outstandingDebt > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(outstandingDebt))}
                  className="text-[10px] font-bold text-emerald-600 hover:underline"
                >
                  Pay Full Balance
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-black text-emerald-600 text-base">
                ₦
              </span>
              <input
                required
                autoFocus
                type="number"
                step="any"
                min="1"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Cash", "POS", "Transfer"].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    method === m
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Reference Section */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare size={11} /> Note / Reference
            </label>
            <textarea
              rows="2"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 outline-none transition resize-none"
              placeholder="e.g. Bank transfer ref or receipt number..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSaving || !amount}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Updating Ledger...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Confirm & Post Payment</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
