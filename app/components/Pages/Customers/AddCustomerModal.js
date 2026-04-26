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
} from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function AddCustomerModal({ isOpen, onClose }) {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    creditLimit: 0, // New: To match backend structure
    status: "active",
    visitCount: 1,
    totalSpent: 0,
    creditBalance: 0,
    registeredBy: "Admin",
    lastPurchaceDate: new Date(),
    registeredAt: new Date(),
  })

  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSaving(true)

    // This will now send the full object including creditLimit and address
    const response = await Axios.post(
      `${appState.backendURL}/create-new-customer`,
      formData,
    )
    if (response.data) {
      // pass the new customer data back to parent so it can be added to the list without refetching
      // appDispatch({ type: "addNewCustomer", payload: response.data })
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: "Customer registered successfully!" },
      })
    }
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
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
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
                  Register Customer
                </h2>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Loyalty & Credit Setup
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-4 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    required
                    type="tel"
                    placeholder="0810..."
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    onChange={e =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">
                  Credit Limit
                </label>
                <div className="relative">
                  <CreditCard
                    className="absolute left-4 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    onChange={e =>
                      setFormData({
                        ...formData,
                        creditLimit: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <input
                  type="email"
                  placeholder="alex@mail.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Physical Address */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">
                Residential Address
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <textarea
                  rows="2"
                  placeholder="Street, City, State"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                  onChange={e =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Subtle Info Note */}
            <div className="flex gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <Info className="text-blue-400 shrink-0" size={14} />
              <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                Setting a <b>Credit Limit</b> allows this customer to make
                purchases on debt up to the specified amount.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-2 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Register Customer
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
