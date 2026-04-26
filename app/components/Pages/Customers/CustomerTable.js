import React, { useContext, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, Mail, User, Banknote, ArrowRight, Calendar } from "lucide-react"
import CustomerProfile from "./CustomerProfile"
import PostPaymentModal from "./PosPaymentModal"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"
import Axios from "axios"

export default function CustomerTable({
  searchQuery = "",
  showOnlyDebtors = false,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const fetchCustomers = async () => {
    setIsFetching(true)
    try {
      const response = await Axios.get(
        `${appState.backendURL}/get-all-customers`,
      )
      console.log(response.data)
      appDispatch({ type: "setCustomers", payload: response.data })
    } catch (err) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Failed to sync ledger data" },
      })
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = (appState.customers || [])?.filter(customer => {
    const matchesSearch =
      (customer.fullName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (customer.phone || "").includes(searchQuery)

    const matchesDebtFilter = showOnlyDebtors ? customer.debt > 0 : true

    return matchesSearch && matchesDebtFilter
  })

  const openProfile = customer => {
    setSelectedCustomer(customer)
    setIsProfileOpen(true)
  }

  const openPayment = (e, customer) => {
    e.stopPropagation()
    setSelectedCustomer(customer)
    setIsPaymentOpen(true)
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Customer Identity
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Contact Details
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Credit Utilization
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Lifetime Volume
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Balance Owed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <AnimatePresence mode="popLayout">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    key={customer._id}
                    onClick={() => openProfile(customer)}
                    className="group hover:bg-indigo-50/40 cursor-pointer transition-all duration-200"
                  >
                    {/* 1. IDENTITY COLUMN - Names focus */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 flex items-center justify-center border border-gray-100">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800 leading-none">
                            {customer.name}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-gray-400">
                            <Calendar size={10} />
                            <p className="text-[9px] font-bold uppercase tracking-tighter italic">
                              Member since{" "}
                              {customer.registeredAt
                                ? new Date(
                                    customer.registeredAt,
                                  ).toLocaleDateString("en-GB", {
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Recent"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. CONTACT */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <Phone size={12} className="text-indigo-400" />{" "}
                          {customer.phone}
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium truncate max-w-[150px]">
                          {customer.address || "Address not provided"}
                        </p>
                      </div>
                    </td>

                    {/* 3. CREDIT METER */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center max-w-[100px] mx-auto">
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                ((customer.creditBalance || 0) /
                                  (customer.creditLimit || 50000)) *
                                  100,
                                100,
                              )}%`,
                            }}
                            className={`h-full ${
                              customer.creditBalance >
                              (customer.creditLimit || 50000)
                                ? "bg-red-500 animate-pulse"
                                : "bg-indigo-500"
                            }`}
                          />
                        </div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Limit: {formatNaira(customer.creditLimit || 0)}
                        </span>
                      </div>
                    </td>

                    {/* 4. TOTAL SPENT */}
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-black text-gray-900">
                        {formatNaira(customer.totalSpent || 0)}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                        LTV Volume
                      </p>
                    </td>

                    {/* 5. DEBT & ACTION */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`text-sm font-black ${
                              customer.creditBalance > 0
                                ? "text-rose-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {formatNaira(customer.creditBalance || 0)}
                          </p>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          {customer.creditBalance > 0 && (
                            <button
                              onClick={e => openPayment(e, customer)}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white shadow-sm transition-all"
                            >
                              <Banknote size={16} />
                            </button>
                          )}
                          <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white shadow-sm transition-all">
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : isFetching ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="py-20 text-center text-gray-400 italic text-sm font-bold uppercase tracking-widest"
                  >
                    No Ledger entries found
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <CustomerProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        customer={selectedCustomer}
      />

      {isPaymentOpen && (
        <PostPaymentModal
          customer={selectedCustomer}
          onClose={() => setIsPaymentOpen(false)}
          onRefresh={fetchCustomers}
        />
      )}
    </div>
  )
}
