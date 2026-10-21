import React, { useContext, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Check,
  UserPlus,
  CreditCard,
  Info,
  Loader2,
} from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  creditLimit: "",
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess }) {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const resetAndClose = () => {
    setFormData(INITIAL_FORM)
    setIsSaving(false)
    onClose()
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Session expired. Please sign in again.",
        },
      })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        token, // Required for storeGuard -> req.storeId
        name: formData.name.trim(),
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        creditLimit: Math.max(0, parseFloat(formData.creditLimit) || 0),
        status: "active",
        visitCount: 0,
        totalSpent: 0,
        creditBalance: 0,
        registeredBy: appState.user?.username || "Staff",
      }

      const response = await Axios.post(
        `${appState.backendURL}/create-new-customer`,
        payload,
      )

      if (response.data) {
        appDispatch({
          type: "addFlashMessage",
          payload: {
            type: "success",
            msg: `Customer "${formData.name.trim()}" onboarded successfully!`,
          },
        })

        // Notify parent CustomerPage to refresh telemetry & customer table
        if (typeof onSuccess === "function") {
          onSuccess(response.data)
        }

        resetAndClose()
      }
    } catch (error) {
      console.error("Customer onboarding error:", error)
      const errorMsg =
        error.response?.data?.msg ||
        error.response?.data?.error ||
        "Failed to register customer account."

      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: errorMsg },
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm antialiased">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={resetAndClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                <UserPlus size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight uppercase">
                  Register Customer
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Account Onboarding & Credit Setup
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={15}
                />
                <input
                  required
                  type="text"
                  placeholder="e.g. Al-Madina Provisions"
                  value={formData.name}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Phone & Credit Limit Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                    size={15}
                  />
                  <input
                    required
                    type="tel"
                    placeholder="0803 000 0000"
                    value={formData.phone}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    onChange={e =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                  Credit Limit (₦)
                </label>
                <div className="relative">
                  <CreditCard
                    className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                    size={15}
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="50,000"
                    value={formData.creditLimit}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-indigo-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    onChange={e =>
                      setFormData({
                        ...formData,
                        creditLimit: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={15}
                />
                <input
                  type="email"
                  placeholder="contact@customer.com"
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Physical Address */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                Storefront / Residential Address
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={15}
                />
                <textarea
                  rows="2"
                  placeholder="Street name, landmark, market section..."
                  value={formData.address}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition resize-none"
                  onChange={e =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Credit Note */}
            <div className="flex gap-2.5 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <Info className="text-indigo-600 shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                The <b>Authorized Credit Limit</b> defines the maximum
                outstanding debt balance permitted for credit sales during
                checkout.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={resetAndClose}
                className="flex-1 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-indigo-700 transition active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Customer</span>
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
