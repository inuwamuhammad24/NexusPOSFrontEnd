// components/Pages/Customers/CustomerProfile.js
import React, { useEffect, useState, useContext, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  CreditCard,
  Edit3,
  Save,
  Loader2,
  History,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileText,
  DollarSign,
} from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"

export default function CustomerProfile({
  isOpen,
  onClose,
  customer,
  onUpdate,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [isFetching, setIsFetching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activity, setActivity] = useState([])
  const [activeTab, setActiveTab] = useState("all") // 'all' | 'payments' | 'sales'

  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: 0,
  })

  useEffect(() => {
    if (customer) {
      setFormState({
        fullName: customer.fullName || customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        creditLimit: customer.creditLimit || 0,
      })
    }
  }, [customer, isEditing])

  const fetchActivity = useCallback(async () => {
    const token = appState.user?.token || localStorage.getItem("token")
    if (!token || !customer?._id) return

    try {
      setIsFetching(true)
      const response = await Axios.post(
        `${appState.backendURL}/customer-activity`,
        {
          token,
          id: customer._id,
          customerId: customer._id,
        },
      )
      setActivity(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Ledger retrieval error:", error)
    } finally {
      setIsFetching(false)
    }
  }, [appState.backendURL, appState.user?.token, customer?._id])

  useEffect(() => {
    if (isOpen && customer?._id) {
      fetchActivity()
    }
  }, [isOpen, customer?._id, fetchActivity])

  const handleUpdate = async () => {
    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) return

    setIsSaving(true)
    try {
      await Axios.post(`${appState.backendURL}/update-customer`, {
        token,
        id: customer._id,
        fullName: formState.fullName.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        address: formState.address.trim(),
        creditLimit: Math.max(0, parseFloat(formState.creditLimit) || 0),
      })

      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: "Customer details updated!" },
      })

      setIsEditing(false)
      if (typeof onUpdate === "function") onUpdate()
      onClose()
    } catch (e) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Account update failed." },
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredActivity = activity.filter(item => {
    if (activeTab === "payments") return item.type === "PAYMENT"
    if (activeTab === "sales")
      return item.type === "SALE" || item.type === "CREDIT_SALE"
    return true
  })

  if (!isOpen || !customer) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-slate-100"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  {customer.fullName || customer.name || "Customer Account"}
                </h2>
                <p className="text-[10px] text-slate-400 font-mono">
                  Phone: {customer.phone || "N/A"} • ID: #
                  {String(customer._id).slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
            {/* Balance Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Outstanding Debt
                </span>
                <span
                  className={`text-base sm:text-lg font-black tracking-tight ${
                    customer.creditBalance > 0
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {formatNaira(customer.creditBalance || 0)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Credit Limit
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {formatNaira(customer.creditLimit || 0)}
                </span>
              </div>
            </div>

            {/* Quick Profile Editor */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contact Information
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    Full Name
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formState.fullName}
                      onChange={e =>
                        setFormState({ ...formState, fullName: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="font-bold text-slate-800">
                      {formState.fullName || "---"}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    Phone Number
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formState.phone}
                      onChange={e =>
                        setFormState({ ...formState, phone: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="font-bold text-slate-800">
                      {formState.phone || "---"}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {/* Complete Activity Feed Header & Filters */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <History size={15} className="text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Customer Ledger Activity ({filteredActivity.length})
                  </h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  {["all", "payments", "sales"].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                        activeTab === tab
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
                {isFetching ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-indigo-600">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Fetching Transactions...
                    </span>
                  </div>
                ) : filteredActivity.length > 0 ? (
                  filteredActivity.map(item => {
                    const isPayment = item.type === "PAYMENT"
                    const isCreditSale = item.type === "CREDIT_SALE"

                    return (
                      <div
                        key={item._id}
                        className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              isPayment
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : isCreditSale
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            }`}
                          >
                            {isPayment ? (
                              <ArrowDownLeft size={16} />
                            ) : (
                              <ShoppingBag size={16} />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {item.reference}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isPayment
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isCreditSale
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                }`}
                              >
                                {isPayment
                                  ? "Payment / Settlement"
                                  : isCreditSale
                                    ? "Credit Sale"
                                    : "Completed Sale"}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                              {item.note || `Paid via ${item.method}`}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(item.timestamp).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              • Operator: <strong>{item.performedBy}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Values & Running Balance Section */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 text-right shrink-0">
                          <div>
                            <span
                              className={`text-sm font-black ${
                                isPayment
                                  ? "text-emerald-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {isPayment ? "-" : "+"}
                              {formatNaira(item.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              via {item.method}
                            </span>
                          </div>

                          {/* Display running balance if present in document */}
                          {item.runningBalance !== null &&
                            item.runningBalance !== undefined && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1">
                                Bal: {formatNaira(item.runningBalance)}
                              </span>
                            )}

                          {item.isSale && (
                            <button
                              type="button"
                              onClick={() =>
                                appDispatch({
                                  type: "setReceiptData",
                                  payload: {
                                    invoiceId: item.reference,
                                    total: item.amount,
                                    createdAt: item.timestamp,
                                    customerName:
                                      customer.fullName || customer.name,
                                    paymentMethod: item.method,
                                  },
                                })
                              }
                              className="mt-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 active:scale-95"
                            >
                              <Receipt size={12} />
                              <span>View Receipt</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-1">
                    <FileText size={26} className="mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">
                      No activities recorded yet
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Payments, sales tickets, and credit records will appear
                      here automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">
              Audit Trail Verified
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
