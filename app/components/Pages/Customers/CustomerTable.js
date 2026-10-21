import React, { useContext, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Phone,
  User,
  Banknote,
  ArrowRight,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react"
import CustomerProfile from "./CustomerProfile"
import PostPaymentModal from "./PosPaymentModal"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"
import Axios from "axios"

export default function CustomerTable({
  searchQuery = "",
  showOnlyDebtors = false,
  refreshSignal = 0,
  onDataChange,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [localCustomers, setLocalCustomers] = useState([])

  const fetchCustomers = useCallback(async () => {
    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) return

    setIsFetching(true)
    try {
      // POST with token to satisfy storeGuard
      const response = await Axios.post(
        `${appState.backendURL}/get-all-customers`,
        { token },
      )

      const customerList = Array.isArray(response.data) ? response.data : []
      setLocalCustomers(customerList)
      appDispatch({ type: "setCustomers", payload: customerList })
    } catch (err) {
      console.error("Failed to load customer records:", err)
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Failed to sync customer ledger data." },
      })
    } finally {
      setIsFetching(false)
    }
  }, [appState.backendURL, appState.user?.token, appDispatch])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers, refreshSignal])

  const sourceData =
    localCustomers.length > 0 ? localCustomers : appState.customers || []

  // Robust field normalization across both name and credit fields
  const filteredCustomers = sourceData.filter(customer => {
    const customerName = (
      customer.name ||
      customer.fullName ||
      ""
    ).toLowerCase()
    const customerPhone = customer.phone || ""
    const query = searchQuery.trim().toLowerCase()

    const matchesSearch =
      !query || customerName.includes(query) || customerPhone.includes(query)
    const currentDebt = parseFloat(customer.creditBalance ?? customer.debt ?? 0)
    const matchesDebtFilter = showOnlyDebtors ? currentDebt > 0 : true

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

  const handlePostPaymentSuccess = () => {
    fetchCustomers()
    if (typeof onDataChange === "function") {
      onDataChange()
    }
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
          <tbody className="divide-y divide-gray-50 text-xs">
            <AnimatePresence mode="popLayout">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => {
                  const debt = parseFloat(
                    customer.creditBalance ?? customer.debt ?? 0,
                  )
                  const limit = parseFloat(customer.creditLimit || 50000)
                  const usagePercent = Math.min(
                    (debt / (limit || 1)) * 100,
                    100,
                  )
                  const isOverLimit = limit > 0 && debt > limit
                  const displayName =
                    customer.name || customer.fullName || "Account Client"

                  return (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: index * 0.015 }}
                      key={customer._id}
                      onClick={() => openProfile(customer)}
                      className="group hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      {/* 1. Identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">
                              {displayName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-gray-400 text-[10px] font-medium">
                              <Calendar size={11} />
                              <span>
                                {customer.createdAt || customer.registeredAt
                                  ? new Date(
                                      customer.createdAt ||
                                        customer.registeredAt,
                                    ).toLocaleDateString([], {
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Verified"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Details */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                            <Phone size={11} className="text-indigo-500" />
                            <span>{customer.phone || "No phone"}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate max-w-[170px]">
                            {customer.address || "No address assigned"}
                          </p>
                        </div>
                      </td>

                      {/* 3. Credit Meter */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center max-w-[120px] mx-auto">
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${usagePercent}%` }}
                              className={`h-full ${
                                isOverLimit
                                  ? "bg-rose-500 animate-pulse"
                                  : "bg-indigo-600"
                              }`}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                            Limit: {formatNaira(limit)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Lifetime Volume */}
                      <td className="px-6 py-4 text-center">
                        <p className="text-xs font-bold text-gray-900">
                          {formatNaira(customer.totalSpent || 0)}
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">
                          {customer.visitCount || 0} Orders
                        </p>
                      </td>

                      {/* 5. Balance Owed & Action Buttons */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`text-xs font-black ${
                                debt > 0 ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {formatNaira(debt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {debt > 0 && (
                              <button
                                type="button"
                                onClick={e => openPayment(e, customer)}
                                title="Record Debt Settlement"
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition shadow-sm"
                              >
                                <Banknote size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openProfile(customer)}
                              className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg transition shadow-sm"
                              title="View Account Profile"
                            >
                              <ArrowRight size={15} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              ) : isFetching ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-indigo-600">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Synchronizing Accounts...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="py-20 text-center text-gray-400 text-xs font-semibold uppercase tracking-wider"
                  >
                    No customer accounts matched your criteria
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
        onUpdate={fetchCustomers}
      />

      {isPaymentOpen && (
        <PostPaymentModal
          customer={selectedCustomer}
          onClose={() => setIsPaymentOpen(false)}
          onRefresh={handlePostPaymentSuccess}
        />
      )}
    </div>
  )
}
