import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Award,
  History,
} from "lucide-react"

export default function CustomerProfile({ isOpen, onClose, customer }) {
  if (!isOpen || !customer) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-gray-50 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header / Banner Area */}
          <div className="h-32 bg-blue-600 w-full relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Content */}
          <div className="px-8 pb-8 -mt-12 relative flex-1 overflow-y-auto custom-scrollbar">
            {/* Avatar & Name */}
            <div className="flex items-end gap-6 mb-8">
              <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl">
                <div className="w-full h-full rounded-[1.5rem] bg-gray-100 flex items-center justify-center text-blue-600 font-black text-4xl">
                  {customer.name.charAt(0)}
                </div>
              </div>
              <div className="mb-2">
                <h2 className="text-3xl font-black text-gray-800">
                  {customer.name}
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest">
                  Gold Member
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Stats */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Account Summary
                </h3>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Total Revenue
                    </p>
                    <p className="text-lg font-black text-gray-800">
                      ${customer.spent.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Total Visits
                    </p>
                    <p className="text-lg font-black text-gray-800">
                      {customer.visits} Orders
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact Info */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Contact Details
                </h3>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Mail size={16} className="text-blue-500" />{" "}
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Phone size={16} className="text-blue-500" />{" "}
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <Calendar size={16} className="text-blue-500" /> Joined{" "}
                    {customer.lastVisit}
                  </div>
                </div>
              </div>

              {/* Purchase History Preview */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <History size={14} /> Recent Transactions
                </h3>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex justify-between text-xs font-bold text-gray-400">
                    <span>Invoice #</span>
                    <span>Date</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-4 text-center py-10 text-gray-300 italic text-sm">
                    Customer Purchase History logic goes here...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 bg-white border-t border-gray-50 flex justify-end gap-3">
            <button className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-red-500 transition">
              Delete Account
            </button>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
              Edit Profile
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
