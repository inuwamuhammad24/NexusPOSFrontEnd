import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react"
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react"
import StaffTable from "./StaffTable"
import AddStaffModal from "./AddStaffModal"
import Axios from "axios"
import StateContext from "../../../StateContext"

export default function StaffPage() {
  const appState = useContext(StateContext)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFetchingPulse, setIsFetchingPulse] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [pulseData, setPulseData] = useState({
    totalStaff: 0,
    activeToday: 0,
    adminCount: 0,
    limitedCount: 0,
  })

  // Fetch real-time staff pulse scoped to the merchant's storeId
  const fetchPulse = useCallback(async () => {
    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) {
      setIsFetchingPulse(false)
      return
    }

    setIsFetchingPulse(true)
    try {
      // POST with token to pass storeGuard
      const response = await Axios.post(
        `${appState.backendURL}/get-staff-pulse`,
        { token },
      )

      if (response.data) {
        const raw = response.data
        // Supports either { totalStaff, ... } object or [{ staffCount }] array legacy responses
        const total =
          typeof raw.totalStaff === "number"
            ? raw.totalStaff
            : Array.isArray(raw)
              ? raw[0]?.staffCount || 0
              : 0

        setPulseData(prev => ({
          ...prev,
          totalStaff: total,
          activeToday: raw.activeToday || 0,
        }))
      }
    } catch (error) {
      console.error("Failed to retrieve staff pulse metrics:", error)
    } finally {
      setIsFetchingPulse(false)
    }
  }, [appState.backendURL, appState.user?.token])

  useEffect(() => {
    fetchPulse()
  }, [fetchPulse, refreshKey])

  // Derive dynamic role distributions directly from loaded staff in appState
  const { calculatedAdmins, calculatedLimited, totalFromState } =
    useMemo(() => {
      const list = Array.isArray(appState.staff) ? appState.staff : []
      let admins = 0
      let limited = 0

      list.forEach(m => {
        const r = (m.role || "").toLowerCase()
        if (r === "admin" || r === "superadmin" || r === "manager") {
          admins++
        } else {
          limited++
        }
      })

      return {
        calculatedAdmins: admins,
        calculatedLimited: limited,
        totalFromState: list.length,
      }
    }, [appState.staff])

  // Preferred count: use pulse if loaded, fallback to active state length
  const displayTotalStaff =
    pulseData.totalStaff > 0 ? pulseData.totalStaff : totalFromState

  const handleStaffAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              Staff Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Access Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision cashier logins, adjust security roles, and monitor team
            presence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPulse}
            disabled={isFetchingPulse}
            title="Refresh Pulse Metrics"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={isFetchingPulse ? "animate-spin text-indigo-600" : ""}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/20 active:scale-95"
          >
            <UserPlus size={16} />
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Team Roster
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              {isFetchingPulse && displayTotalStaff === 0 ? (
                <Loader2 className="animate-spin text-indigo-600" size={20} />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {displayTotalStaff}
                </p>
              )}
              {pulseData.activeToday > 0 && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {pulseData.activeToday} active today
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Admins & Managers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Admins & Managers
            </p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {calculatedAdmins}
            </p>
          </div>
        </div>

        {/* Limited Operators */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Cashiers & Clerks
            </p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {calculatedLimited}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Directory Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[460px]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-3.5 top-3 text-slate-400 pointer-events-none"
              size={15}
            />
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Staff Table Component */}
        <div className="flex-1">
          <StaffTable searchQuery={searchQuery} />
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleStaffAdded}
      />
    </div>
  )
}
