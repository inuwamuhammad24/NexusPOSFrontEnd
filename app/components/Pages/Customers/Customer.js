import React, { useContext, useEffect, useState } from "react"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Activity,
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
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false) // NEW: Debt Filter State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalDebt: 0,
    activeThisMonth: 0,
    overLimitCount: 0,
  })

  useEffect(() => {
    async function fetchCustomerStats() {
      try {
        const response = await Axios.get(
          `${appState.backendURL}/get-customer-stats`,
        )
        setSummary(response.data)
      } catch (e) {
        console.error("Failed to fetch customer telemetry")
      }
    }
    fetchCustomerStats()
  }, [appState.backendURL])

  const formatNaira = amt =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0)

  return (
    <div className="space-y-8 pb-10 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Customer Ledger
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 italic">
            Credit Management & Risk Assessment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg active:scale-95"
          >
            <UserPlus size={16} />
            Onboard Account
          </button>
        </div>
      </div>

      {/* KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Accounts"
          value={summary.totalCount.toLocaleString()}
          icon={<Users size={20} />}
          color="indigo"
        />
        <StatCard
          label="Market Debt"
          value={formatNaira(summary.totalDebt)}
          icon={<Wallet size={20} />}
          color="blue"
        />
        <StatCard
          label="Monthly Growth"
          value={`+${summary.activeThisMonth}`}
          icon={<TrendingUp size={20} />}
          color="emerald"
        />
        <StatCard
          label="High Risk"
          value={summary.overLimitCount}
          icon={<AlertTriangle size={20} />}
          color={summary.overLimitCount > 0 ? "red" : "gray"}
          isAlert={summary.overLimitCount > 0}
        />
      </div>

      {/* MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/10">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-4 top-3.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Filter by name or phone..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* DEBT FILTER TOGGLE */}
            <button
              onClick={() => setShowOnlyDebtors(!showOnlyDebtors)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                showOnlyDebtors
                  ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100"
                  : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
              }`}
            >
              <Activity size={14} />
              {showOnlyDebtors ? "Viewing Debtors Only" : "Filter Debtors"}
            </button>
          </div>

          {summary.overLimitCount > 0 && (
            <div
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-pulse cursor-pointer"
              onClick={() => {
                setSearchQuery("")
                setShowOnlyDebtors(true)
              }}
            >
              <AlertTriangle size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {summary.overLimitCount} Critical Violations
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          {/* We pass showOnlyDebtors to the Table */}
          <CustomerTable
            searchQuery={searchQuery}
            showOnlyDebtors={showOnlyDebtors}
          />
        </div>
      </div>

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}

function StatCard({ label, value, icon, color, isAlert }) {
  const themes = {
    indigo: "bg-indigo-600 text-white",
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-600 text-white",
    red: "bg-red-600 text-white shadow-red-200",
    gray: "bg-gray-100 text-gray-400",
  }
  return (
    <div
      className={`bg-white p-6 rounded-[2rem] border transition-all flex items-center gap-5 ${isAlert ? "border-red-200 ring-4 ring-red-50" : "border-gray-100 shadow-sm"}`}
    >
      <div
        className={`p-4 rounded-2xl ${themes[color]} shadow-lg ${isAlert ? "animate-bounce" : ""}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {label}
        </p>
        <p
          className={`text-xl font-black mt-1 ${color === "red" ? "text-red-600" : "text-gray-900"}`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
