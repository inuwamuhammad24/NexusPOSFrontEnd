import React, { useEffect, useState, useContext, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Mail,
  Phone,
  MapPin,
  History,
  ShoppingBag,
  CreditCard,
  Trash2,
  Edit3,
  Save,
  Loader2,
  ShieldAlert,
  ChevronRight,
  User,
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

  // --- EDIT MODE STATE ---
  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: 0,
  })

  // Sync formState when modal opens or customer prop changes
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

  // Fetch Activity Ledger with Token Injection
  const fetchActivity = useCallback(
    async cancelToken => {
      const token = appState.user?.token || localStorage.getItem("token")
      if (!token || !customer?._id) return

      try {
        setIsFetching(true)
        const response = await Axios.post(
          `${appState.backendURL}/customer-activity`,
          {
            token, // Required for storeGuard -> req.storeId
            id: customer._id,
            customerId: customer._id,
          },
          { cancelToken },
        )
        setActivity(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        if (!Axios.isCancel(error)) {
          console.error("Ledger activity retrieval error:", error)
        }
      } finally {
        setIsFetching(false)
      }
    },
    [appState.backendURL, appState.user?.token, customer?._id],
  )

  useEffect(() => {
    if (isOpen && customer?._id) {
      const source = Axios.CancelToken.source()
      fetchActivity(source.token)
      return () => source.cancel()
    }
  }, [isOpen, customer?._id, fetchActivity])

  // --- UPDATE HANDLER ---
  const handleUpdate = async () => {
    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Session expired. Please log in again.",
        },
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        token, // Required for storeGuard -> req.storeId
        id: customer._id,
        customerId: customer._id,
        name: formState.fullName.trim(),
        fullName: formState.fullName.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        address: formState.address.trim(),
        creditLimit: Math.max(0, parseFloat(formState.creditLimit) || 0),
      }

      await Axios.post(`${appState.backendURL}/update-customer`, payload)

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: "Customer profile updated successfully!",
        },
      })

      setIsEditing(false)

      // Trigger parent list and telemetry refresh
      if (typeof onUpdate === "function") {
        onUpdate()
      }
      onClose()
    } catch (e) {
      console.error("Update customer error:", e)
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg:
            e.response?.data?.msg ||
            e.response?.data?.error ||
            "Account update failed.",
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !customer) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 z-10"
        >
          {/* Header Section */}
          <div
            className={`px-6 py-4 flex justify-between items-center border-b transition-colors ${
              isEditing
                ? "bg-amber-50/70 border-amber-200"
                : "bg-slate-50/70 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isEditing
                    ? "bg-amber-500 text-white"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {isEditing ? <Edit3 size={18} /> : <User size={18} />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {isEditing
                    ? "Editing Account Profile"
                    : "Customer Account Ledger"}
                </h2>
                <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest mt-0.5">
                  ID: #{customer._id?.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identity & Contact Details */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">
                  Entity Details
                </h3>
                <div className="space-y-3">
                  <EditInput
                    label="Customer / Company Name"
                    value={formState.fullName}
                    isEditing={isEditing}
                    onChange={v => setFormState({ ...formState, fullName: v })}
                  />
                  <EditInput
                    label="Phone Number"
                    value={formState.phone}
                    isEditing={isEditing}
                    onChange={v => setFormState({ ...formState, phone: v })}
                  />
                  <EditInput
                    label="Email Address"
                    value={formState.email}
                    isEditing={isEditing}
                    onChange={v => setFormState({ ...formState, email: v })}
                  />
                  <EditInput
                    label="Contact Address"
                    value={formState.address}
                    isEditing={isEditing}
                    onChange={v => setFormState({ ...formState, address: v })}
                  />
                </div>
              </div>

              {/* Financial Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">
                  Credit & Financial Parameters
                </h3>
                <div className="space-y-3">
                  {/* Current Debt Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">
                        Current Outstanding Debt
                      </p>
                      <span
                        className={`text-base font-black ${
                          customer.creditBalance > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatNaira(customer.creditBalance || 0)}
                      </span>
                    </div>
                    <CreditCard size={20} className="text-gray-300" />
                  </div>

                  {/* Credit Limit Editor */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isEditing
                        ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/10"
                        : "bg-white border-gray-200/80 shadow-sm"
                    }`}
                  >
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                      Authorized Credit Limit
                    </label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-600">
                          ₦
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                          value={formState.creditLimit}
                          onChange={e =>
                            setFormState({
                              ...formState,
                              creditLimit: e.target.value,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-black text-gray-900">
                        {formatNaira(customer.creditLimit || 0)}
                      </p>
                    )}
                  </div>

                  {/* Lifetime Volume */}
                  <div className="p-4 bg-white border border-gray-200/80 rounded-xl flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">
                        Lifetime Purchase Volume
                      </p>
                      <span className="text-sm font-black text-gray-900">
                        {formatNaira(customer.totalSpent || 0)}
                      </span>
                    </div>
                    <ShoppingBag size={20} className="text-gray-300" />
                  </div>
                </div>
              </div>

              {/* TRANSACTION LEDGER */}
              {!isEditing && (
                <div className="md:col-span-2 space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} /> Settlement & Sales Ledger
                    </h3>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                      Audit Records
                    </span>
                  </div>

                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/70 text-[9px] font-bold text-gray-400 uppercase border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-4">Event Type</th>
                          <th className="py-3 px-4">Memo / Reference</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Value</th>
                          <th className="py-3 px-4 text-right">
                            Running Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[11px]">
                        {isFetching ? (
                          <tr>
                            <td colSpan="5" className="p-10 text-center">
                              <Loader2
                                className="animate-spin mx-auto text-indigo-600"
                                size={22}
                              />
                            </td>
                          </tr>
                        ) : activity.length > 0 ? (
                          activity.map(item => {
                            const isPayment =
                              (item.type || "").toUpperCase() === "PAYMENT" ||
                              (item.type || "").toUpperCase() === "SETTLEMENT"

                            return (
                              <tr
                                key={item._id}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      isPayment
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}
                                  >
                                    {item.type ||
                                      (item.invoiceId
                                        ? "Credit Sale"
                                        : "Transaction")}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-700 font-semibold max-w-[150px] truncate">
                                  {item.note ||
                                    item.invoiceId ||
                                    "POS Settlement"}
                                </td>
                                <td className="py-3 px-4 text-gray-400">
                                  {new Date(
                                    item.timestamp || item.createdAt,
                                  ).toLocaleDateString([], {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </td>
                                <td
                                  className={`py-3 px-4 font-bold text-right ${
                                    isPayment
                                      ? "text-emerald-600"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {isPayment ? "-" : "+"}
                                  {formatNaira(
                                    item.paid || item.total || item.amount || 0,
                                  )}
                                </td>
                                <td className="py-3 px-4 font-bold text-right text-gray-900 bg-slate-50/30">
                                  {formatNaira(
                                    item.runningCreditBalance ??
                                      item.runningBalance ??
                                      0,
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="p-8 text-center text-gray-400 text-xs italic"
                            >
                              No financial ledger transactions logged for this
                              account.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50/70 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              {customer.phone || "No direct phone verified"}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (isEditing ? setIsEditing(false) : onClose())}
                className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-gray-800 uppercase tracking-widest transition"
              >
                {isEditing ? "Discard" : "Close"}
              </button>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-[10px] shadow-sm hover:bg-emerald-700 transition active:scale-95 uppercase tracking-widest disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>Save Changes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[10px] shadow-sm hover:bg-indigo-700 transition active:scale-95 uppercase tracking-widest"
                >
                  <Edit3 size={13} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function EditInput({ label, value, isEditing, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-0.5">
        {label}
      </label>
      {isEditing ? (
        <input
          className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <p className="text-xs font-semibold text-gray-800 pl-0.5">
          {value || "---"}
        </p>
      )}
    </div>
  )
}
