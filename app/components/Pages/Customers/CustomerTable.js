import React, { useState, useContext, useMemo } from "react"
import {
  Search,
  User,
  Phone,
  MapPin,
  Banknote,
  ArrowRight,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"
import PosPaymentModal from "./PosPaymentModal"
import CustomerProfile from "./CustomerProfile"

export default function CustomerTable({
  customers,
  data,
  loading = false,
  onDataChange,
}) {
  const appDispatch = useContext(DispatchContext)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // 'all' | 'debtors' | 'overdue' | 'clear'
  const [dateFilter, setDateFilter] = useState("all") // 'all' | 'today' | '7d' | '30d'

  // Modal Triggers
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Support both `customers` and `data` props safely
  const customerList = useMemo(() => {
    if (Array.isArray(customers)) return customers
    if (Array.isArray(data)) return data
    return []
  }, [customers, data])

  const getLastActivityTime = customer => {
    const raw =
      customer.lastTransactionDate ||
      customer.lastPurchaseDate ||
      customer.lastCreditDate ||
      customer.updatedAt ||
      customer.createdAt
    return raw ? new Date(raw).getTime() : 0
  }

  const checkOverdue = customer => {
    if (customer.isOverdueOneWeek !== undefined)
      return customer.isOverdueOneWeek
    const debt = Number(customer.creditBalance || 0)
    if (debt <= 0) return false
    const debtOrigin =
      customer.lastCreditDate ||
      customer.lastTransactionDate ||
      customer.updatedAt ||
      customer.createdAt
    if (!debtOrigin) return false
    const diffDays = Math.floor(
      (Date.now() - new Date(debtOrigin).getTime()) / (1000 * 60 * 60 * 24),
    )
    return diffDays >= 7
  }

  const getDaysOverdue = customer => {
    if (customer.daysOverdue !== undefined) return customer.daysOverdue
    const debtOrigin =
      customer.lastCreditDate ||
      customer.lastTransactionDate ||
      customer.updatedAt ||
      customer.createdAt
    if (!debtOrigin) return 0
    return Math.floor(
      (Date.now() - new Date(debtOrigin).getTime()) / (1000 * 60 * 60 * 24),
    )
  }

  const formatLastActivity = timestamp => {
    if (!timestamp) return "No activity"
    const d = new Date(timestamp)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return `Today, ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    }
    return d.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const overdueCount = useMemo(
    () => customerList.filter(c => checkOverdue(c)).length,
    [customerList],
  )

  // Filter & Sort: Recent Transactions First
  const filteredCustomers = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000

    return customerList
      .filter(customer => {
        const customerName = (
          customer.fullName ||
          customer.name ||
          ""
        ).toLowerCase()
        const matchesSearch =
          customerName.includes(searchTerm.toLowerCase()) ||
          (customer.phone && customer.phone.includes(searchTerm))

        if (!matchesSearch) return false

        const debt = Number(customer.creditBalance || 0)
        const isOverdue = checkOverdue(customer)

        if (statusFilter === "debtors" && debt <= 0) return false
        if (statusFilter === "overdue" && !isOverdue) return false
        if (statusFilter === "clear" && debt > 0) return false

        const lastTxTime = getLastActivityTime(customer)
        if (dateFilter === "today" && lastTxTime < startOfToday) return false
        if (dateFilter === "7d" && lastTxTime < sevenDaysAgo) return false
        if (dateFilter === "30d" && lastTxTime < thirtyDaysAgo) return false

        return true
      })
      .sort((a, b) => getLastActivityTime(b) - getLastActivityTime(a))
  }, [customerList, searchTerm, statusFilter, dateFilter])

  const handleOpenPayment = customer => {
    setIsProfileOpen(false)
    setSelectedCustomer(customer)
    setIsPaymentOpen(true)
  }

  const handleOpenProfile = customer => {
    setIsPaymentOpen(false)
    setSelectedCustomer(customer)
    setIsProfileOpen(true)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* TABLE FILTER TOOLBAR */}
      <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-gray-50/40">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3.5 top-2.5 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search name or phone number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition shadow-sm"
            />
          </div>

          {/* Last Activity Date Window */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm shrink-0">
            <Calendar size={14} className="text-indigo-600 shrink-0" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Last Activity: All Time</option>
              <option value="today">Active Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "debtors", label: "Debtors" },
            {
              id: "overdue",
              label: `Overdue > 1 Wk (${overdueCount})`,
              isAlert: true,
            },
            { id: "clear", label: "Clear" },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                statusFilter === tab.id
                  ? tab.isAlert
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-indigo-600 text-white shadow-sm"
                  : tab.isAlert && overdueCount > 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.isAlert && <AlertTriangle size={12} />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/30">
              <th className="py-3.5 px-6">Customer</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Credit Utilization</th>
              <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
              <th className="py-3.5 px-4 text-right">Balance Owed</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => {
                const limit = customer.creditLimit || 50000
                const debt = customer.creditBalance || 0
                const usagePercent = Math.min((debt / limit) * 100, 100)
                const isOverdue = checkOverdue(customer)
                const daysOverdue = getDaysOverdue(customer)
                const lastTx = getLastActivityTime(customer)

                return (
                  <tr
                    key={customer._id}
                    onClick={() => handleOpenProfile(customer)}
                    className={`transition-colors group cursor-pointer ${
                      isOverdue
                        ? "bg-rose-50/30 hover:bg-rose-50/60"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border ${
                            isOverdue
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : "bg-gray-100 text-gray-600 border-gray-200/60"
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle size={16} />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">
                              {customer.fullName ||
                                customer.name ||
                                "Account Client"}
                            </p>
                            {isOverdue && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                                Overdue ({daysOverdue}d)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={11} />
                            Last tx:{" "}
                            <span className="font-semibold text-gray-600">
                              {formatLastActivity(lastTx)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                          <Phone size={12} className="text-indigo-500" />{" "}
                          {customer.phone || "No Phone"}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <MapPin size={11} />{" "}
                          {customer.address || "Walk-in / No address"}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="w-32 space-y-1.5">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              usagePercent > 85
                                ? "bg-rose-500"
                                : usagePercent > 50
                                  ? "bg-amber-500"
                                  : "bg-indigo-600"
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">
                          LIMIT: {formatNaira(limit)}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <p className="font-bold text-gray-900">
                        {formatNaira(customer.totalSpent || 0)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold">
                        {customer.visitCount || 0} ORDERS
                      </p>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-black text-sm ${
                          debt > 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {formatNaira(debt)}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {debt > 0 && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              handleOpenPayment(customer)
                            }}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition flex items-center gap-1 font-bold text-[11px]"
                            title="Record Debt Payment"
                          >
                            <Banknote size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            handleOpenProfile(customer)
                          }}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition"
                          title="Inspect Ledger Profile"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-400">
                  {loading
                    ? "Loading customer accounts..."
                    : "No customer accounts found matching your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD STACK VIEW */}
      <div className="md:hidden divide-y divide-gray-100">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => {
            const debt = customer.creditBalance || 0
            const isOverdue = checkOverdue(customer)
            const daysOverdue = getDaysOverdue(customer)
            const lastTx = getLastActivityTime(customer)

            return (
              <div
                key={customer._id}
                onClick={() => handleOpenProfile(customer)}
                className={`p-4 space-y-3 cursor-pointer ${
                  isOverdue ? "bg-rose-50/40" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">
                        {customer.fullName || customer.name || "Account Client"}
                      </p>
                      {isOverdue && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                          <AlertTriangle size={10} />
                          Overdue ({daysOverdue}d)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {customer.phone || "No phone"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Last tx:{" "}
                      <span className="font-semibold text-gray-600">
                        {formatLastActivity(lastTx)}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`font-black text-sm shrink-0 ${
                      debt > 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {formatNaira(debt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {debt > 0 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        handleOpenPayment(customer)
                      }}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <Banknote size={14} /> Post Payment
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      handleOpenProfile(customer)
                    }}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    View Account <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-gray-400 text-xs">
            {loading
              ? "Loading customer accounts..."
              : "No customers match your filters."}
          </div>
        )}
      </div>

      {/* PAYMENT POSTING MODAL */}
      <PosPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        customer={selectedCustomer}
        onSuccess={onDataChange}
      />

      {/* PROFILE & LEDGER INSPECTOR MODAL */}
      <CustomerProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        customer={selectedCustomer}
        onUpdate={onDataChange}
      />
    </div>
  )
}
