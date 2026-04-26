import React, { useEffect, useState, useContext } from "react"
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

export default function CustomerProfile({ isOpen, onClose, customer }) {
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

  // Fetch Activity Ledger
  useEffect(() => {
    if (isOpen && customer?._id) {
      const ourRequest = Axios.CancelToken.source()
      async function fetchActivity() {
        try {
          setIsFetching(true)
          const response = await Axios.post(
            `${appState.backendURL}/customer-activity`,
            { id: customer._id },
            { cancelToken: ourRequest.token },
          )
          console.log(response.data)
          setActivity(response.data)
        } catch (error) {
          if (!Axios.isCancel(error)) console.error(error)
        } finally {
          setIsFetching(false)
        }
      }
      fetchActivity()
      return () => ourRequest.cancel()
    }
  }, [isOpen, customer?._id, appState.backendURL])

  // --- UPDATE HANDLER ---
  const handleUpdate = async () => {
    setIsSaving(true)
    try {
      await Axios.post(`${appState.backendURL}/update-customer`, {
        id: customer._id,
        ...formState,
      })
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: "Account updated successfully!" },
      })
      setIsEditing(false)
      onClose() // Close to refresh the parent list
    } catch (e) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Update failed." },
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !customer) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
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
          className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200"
        >
          {/* Header Section */}
          <div
            className={`px-6 py-4 flex justify-between items-center border-b transition-colors ${isEditing ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isEditing ? "bg-amber-500 text-white" : "bg-indigo-600 text-white"}`}
              >
                {isEditing ? <Edit3 size={18} /> : <User size={18} />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  {isEditing ? "Editing Profile" : "Customer Account"}
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                  ID: #{customer._id?.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identity & Contact Details */}
              <div className="space-y-5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <EditInput
                    label="Full Name"
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
              <div className="space-y-5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">
                  Financial Setup
                </h3>
                <div className="space-y-3">
                  {/* Current Debt Card */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                        Current Outstanding
                      </p>
                      <span
                        className={`text-base font-black ${customer.creditBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {formatNaira(customer.creditBalance || 0)}
                      </span>
                    </div>
                    <CreditCard size={20} className="text-gray-200" />
                  </div>

                  {/* Credit Limit Editor */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${isEditing ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500/5" : "bg-white border-gray-200 shadow-sm"}`}
                  >
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      Authorized Credit Limit
                    </label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-600">
                          ₦
                        </span>
                        <input
                          type="number"
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-black outline-none focus:ring-2 focus:ring-amber-500/20"
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
                      <p className="text-sm font-black text-gray-800">
                        {formatNaira(customer.creditLimit || 0)}
                      </p>
                    )}
                  </div>

                  {/* Total Volume */}
                  <div className="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                        Lifetime Volume
                      </p>
                      <span className="text-sm font-black text-gray-800">
                        {formatNaira(customer.totalSpent || 0)}
                      </span>
                    </div>
                    <ShoppingBag size={20} className="text-gray-100" />
                  </div>
                </div>
              </div>

              {/* TRANSACTION LEDGER - Hidden during editing */}
              {!isEditing && (
                <div className="md:col-span-2 space-y-3 mt-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} /> Transaction Ledger
                    </h3>
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                      Recent Activity
                    </span>
                  </div>

                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase border-b border-gray-100">
                        <tr>
                          <th className="p-4">Type</th>
                          <th className="p-4">Note / Memo</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4 text-right">Running Bal.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {isFetching ? (
                          <tr>
                            <td colSpan="5" className="p-12 text-center">
                              <Loader2
                                className="animate-spin mx-auto text-indigo-500"
                                size={24}
                              />
                            </td>
                          </tr>
                        ) : activity.length > 0 ? (
                          activity.map(item => (
                            <tr
                              key={item._id}
                              className="hover:bg-gray-50 transition-colors group"
                            >
                              <td className="p-4">
                                <span
                                  className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter ${item.type === "PAYMENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              {/* Display Note with smart fallback to Reference ID */}
                              <td className="p-4 text-gray-600 font-bold max-w-[140px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:max-w-none">
                                {item.note ||
                                  `Invoice #${item.referenceId?.slice(-6).toUpperCase() || "N/A"}`}
                              </td>
                              <td className="p-4 text-gray-400 font-medium">
                                {new Date(
                                  item.timestamp || item.createdAt,
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </td>
                              <td
                                className={`p-4 font-black text-right ${item.type === "PAYMENT" ? "text-emerald-600" : "text-gray-900"}`}
                              >
                                {item.type === "PAYMENT" ? "-" : "+"}
                                {formatNaira(item.amount)}
                              </td>
                              <td className="p-4 font-black text-right text-gray-800 bg-gray-50/30">
                                {formatNaira(item.runningBalance)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="p-12 text-center text-gray-400 italic"
                            >
                              No financial movements found.
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
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <button className="flex items-center gap-1.5 text-[10px] font-black text-gray-300 hover:text-rose-600 uppercase tracking-widest transition-colors">
              <ShieldAlert size={16} /> Delete Account
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => (isEditing ? setIsEditing(false) : onClose())}
                className="px-5 py-2 text-[10px] font-black text-gray-400 hover:text-gray-800 uppercase tracking-widest transition-colors"
              >
                {isEditing ? "Discard" : "Close"}
              </button>
              {isEditing ? (
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition active:scale-95 uppercase tracking-widest"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  Save Account
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95 uppercase tracking-widest"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// --- HELPER COMPONENT ---
const EditInput = ({ label, value, isEditing, onChange }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-0.5">
      {label}
    </label>
    {isEditing ? (
      <input
        className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-amber-500 transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    ) : (
      <p className="text-xs font-bold text-gray-700 pl-0.5 border-b border-transparent">
        {value || "---"}
      </p>
    )}
  </div>
)
