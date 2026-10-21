import React, { useContext, useEffect, useState, useCallback } from "react"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Activity,
  RefreshCw,
} from "lucide-react"
import Axios from "axios"
import CustomerTable from "./CustomerTable"
import AddCustomerModal from "./AddCustomerModal"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function CustomerPage() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [searchQuery, setSearchQuery] = useState("")
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [refreshSignal, setRefreshSignal] = useState(0)

  const [summary, setSummary] = useState({
    totalCount: 0,
    totalDebt: 0,
    activeThisMonth: 0,
    overLimitCount: 0,
  })

  const fetchCustomerStats = useCallback(async () => {
    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) return

    try {
      // POST with token to pass storeGuard
      const response = await Axios.post(
        `${appState.backendURL}/get-customer-stats`,
        { token },
      )
      if (response.data) {
        setSummary({
          totalCount: Number(response.data.totalCount) || 0,
          totalDebt: Number(response.data.totalDebt) || 0,
          activeThisMonth: Number(response.data.activeThisMonth) || 0,
          overLimitCount: Number(response.data.overLimitCount) || 0,
        })
      }
    } catch (e) {
      console.error("Failed to fetch customer telemetry:", e)
    }
  }, [appState.backendURL, appState.user?.token])

  useEffect(() => {
    fetchCustomerStats()
  }, [fetchCustomerStats, refreshSignal])

  const handleRefresh = () => {
    setRefreshSignal(prev => prev + 1)
  }

  const formatNaira = amt =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0)

  return (
    <div className="space-y-8 pb-10 font-sans text-gray-900">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Customer Ledger
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
            Credit Management & Risk Assessment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-xl transition shadow-sm"
            title="Refresh Ledger"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <UserPlus size={15} />
            Onboard Account
          </button>
        </div>
      </div>

      {/* KPI RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Accounts"
          value={summary.totalCount.toLocaleString()}
          icon={<Users size={18} />}
          color="indigo"
        />
        <StatCard
          label="Total Market Debt"
          value={formatNaira(summary.totalDebt)}
          icon={<Wallet size={18} />}
          color="blue"
        />
        <StatCard
          label="Active Accounts"
          value={summary.activeThisMonth.toLocaleString()}
          icon={<TrendingUp size={18} />}
          color="emerald"
        />
        <StatCard
          label="Credit Over-Limit"
          value={summary.overLimitCount}
          icon={<AlertTriangle size={18} />}
          color={summary.overLimitCount > 0 ? "red" : "gray"}
          isAlert={summary.overLimitCount > 0}
        />
      </div>

      {/* MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                type="text"
                placeholder="Filter by name, phone, or code..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-indigo-500 outline-none transition shadow-sm placeholder:text-gray-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* DEBT FILTER TOGGLE */}
            <button
              type="button"
              onClick={() => setShowOnlyDebtors(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition border ${
                showOnlyDebtors
                  ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Activity size={13} />
              {showOnlyDebtors ? "Viewing Debtors Only" : "Filter Debtors"}
            </button>
          </div>

          {summary.overLimitCount > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-[10px] font-bold uppercase tracking-wider cursor-pointer self-start md:self-auto"
              onClick={() => {
                setSearchQuery("")
                setShowOnlyDebtors(true)
              }}
            >
              <AlertTriangle size={14} className="text-rose-600" />
              <span>{summary.overLimitCount} Over Credit Limit</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <CustomerTable
            searchQuery={searchQuery}
            showOnlyDebtors={showOnlyDebtors}
            refreshSignal={refreshSignal}
            onDataChange={handleRefresh}
          />
        </div>
      </div>

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  )
}

function StatCard({ label, value, icon, color, isAlert }) {
  const themes = {
    indigo: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    blue: "bg-blue-50 text-blue-600 border border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    red: "bg-rose-50 text-rose-600 border border-rose-100",
    gray: "bg-gray-100 text-gray-400 border border-gray-200",
  }

  return (
    <div
      className={`bg-white p-5 rounded-2xl border transition-all flex items-center gap-4 ${
        isAlert
          ? "border-rose-300 ring-2 ring-rose-100"
          : "border-gray-200/80 shadow-sm"
      }`}
    >
      <div className={`p-3 rounded-xl shrink-0 ${themes[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {label}
        </p>
        <p
          className={`text-lg font-black mt-0.5 ${
            color === "red" ? "text-rose-600" : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
