import React, { useState, useContext, useEffect } from "react"
import {
  X,
  Banknote,
  Smartphone,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

export default function PosPaymentModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("Cash")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Reset form whenever modal opens with a new customer
  useEffect(() => {
    if (isOpen && customer) {
      setAmount("")
      setMethod("Cash")
      setNote("")
      setError("")
      setLoading(false)
    }
  }, [isOpen, customer])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = e => {
      if (e.key === "Escape" && !loading && typeof onClose === "function") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen || !customer) return null

  const currentDebt = Number(customer.creditBalance || 0)
  const numericAmount = parseFloat(amount) || 0
  const remainingDebt = Math.max(0, currentDebt - numericAmount)

  const handleClose = () => {
    if (loading) return
    if (typeof onClose === "function") {
      onClose()
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError("")

    if (numericAmount <= 0) {
      return setError("Please enter a valid payment amount greater than zero.")
    }

    if (numericAmount > currentDebt) {
      return setError(
        `Payment cannot exceed total owed balance (${formatNaira(currentDebt)}).`,
      )
    }

    setLoading(true)

    try {
      await Axios.post(`${appState.backendURL}/post-customer-payment`, {
        token: appState.user.token,
        customerId: customer._id,
        amount: numericAmount,
        method,
        note: note.trim() || `Debt settlement via ${method}`,
      })

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `Recorded ${formatNaira(numericAmount)} payment for ${
            customer.fullName || customer.name
          }.`,
        },
      })

      setLoading(false)

      // Close modal immediately, then trigger parent refresh
      if (typeof onClose === "function") onClose()
      if (typeof onSuccess === "function") onSuccess()
    } catch (err) {
      console.error("Payment submission error:", err)
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Transaction failed. Check network or permissions.",
      )
      setLoading(false)
    }
  }

  const paymentMethods = [
    { id: "Cash", label: "Cash", icon: Banknote },
    { id: "Transfer", label: "Bank Transfer", icon: Smartphone },
    { id: "POS", label: "POS Card", icon: CreditCard },
  ]

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">
              Record Debt Payment
            </h3>
            <p className="text-[11px] text-gray-500 font-semibold">
              Account:{" "}
              <span className="text-indigo-600 font-bold">
                {customer.fullName || customer.name}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* CURRENT DEBT SUMMARY BANNER */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                Total Owed Balance
              </p>
              <p className="text-xl font-black text-rose-600">
                {formatNaira(currentDebt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAmount(String(currentDebt))}
              className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-[11px] font-bold transition shadow-xs"
            >
              Pay Full Balance
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PAYMENT AMOUNT INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              Amount Received (₦) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-black text-gray-900 focus:bg-white focus:border-emerald-500 outline-none transition"
            />
            {numericAmount > 0 && numericAmount <= currentDebt && (
              <p className="text-[11px] font-semibold text-gray-500">
                Remaining Balance After Payment:{" "}
                <span className="font-bold text-gray-900">
                  {formatNaira(remainingDebt)}
                </span>
              </p>
            )}
          </div>

          {/* PAYMENT METHOD SELECTOR */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(item => {
                const Icon = item.icon
                const active = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition ${
                      active
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-xs"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* REFERENCE / NOTE */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">
              Reference / Receipt Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., GTBank transfer ref or teller no."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || numericAmount <= 0}
              className="flex-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirm Settlement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
