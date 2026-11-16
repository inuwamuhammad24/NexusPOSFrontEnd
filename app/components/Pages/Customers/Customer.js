import React, { useState, useEffect, useContext, useCallback } from "react"
import {
  Users,
  UserPlus,
  RefreshCw,
  CreditCard,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

// Child Components
import CustomerTable from "./CustomerTable"
import AddCustomerModal from "./AddCustomerModal"

export default function CustomerPage() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState({
    totalCount: 0,
    totalDebt: 0,
    overLimitCount: 0,
    activeThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Fetch Customer List and Credit Metrics
  const fetchCustomerHub = useCallback(async () => {
    setLoading(true)
    try {
      const [custRes, statsRes] = await Promise.all([
        Axios.post(`${appState.backendURL}/get-all-customers`, {
          token: appState.user.token,
        }),
        Axios.post(`${appState.backendURL}/get-customer-stats`, {
          token: appState.user.token,
        }),
      ])

      const listData = Array.isArray(custRes.data) ? custRes.data : []
      setCustomers(listData)
      setStats(statsRes.data || {})
      appDispatch({ type: "setCustomers", payload: listData })
    } catch (error) {
      console.error("Failed to fetch customer registry:", error)
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Unable to synchronize customer data." },
      })
    } finally {
      setLoading(false)
    }
  }, [appState.backendURL, appState.user.token, appDispatch])

  useEffect(() => {
    fetchCustomerHub()
  }, [fetchCustomerHub])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* 1. HEADER & ACTION CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            Customer Ledger
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Credit management & risk assessment
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCustomerHub}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition shadow-sm"
            title="Sync Registry"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <UserPlus size={16} />
            <span>Onboard Account</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Accounts
            </p>
            <h3 className="text-xl font-black text-gray-900">
              {stats.totalCount || customers.length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Market Debt
            </p>
            <h3 className="text-xl font-black text-gray-900">
              {formatNaira(stats.totalDebt || 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Active Accounts
            </p>
            <h3 className="text-xl font-black text-gray-900">
              {customers.filter(c => c.status !== "suspended").length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              stats.overLimitCount > 0
                ? "bg-rose-50 text-rose-600"
                : "bg-gray-50 text-gray-400"
            }`}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Credit Over-Limit
            </p>
            <h3 className="text-xl font-black text-gray-900">
              {stats.overLimitCount || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. CUSTOMER LEDGER TABLE */}
      <CustomerTable
        customers={customers}
        data={customers}
        loading={loading}
        onDataChange={fetchCustomerHub}
      />

      {/* 4. ONBOARDING MODAL */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCustomerHub}
      />
    </div>
  )
}
