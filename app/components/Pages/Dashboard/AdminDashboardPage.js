// components/Pages/Dashboard/AdminDashboardPage.js
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react"
import {
  DollarSign,
  TrendingUp,
  Activity,
  CreditCard,
  Building,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Calendar,
  X,
  Loader2,
  Check,
  Server,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"

// --- SANITIZATION & METRIC HELPERS ---

// Safe CSV cell encoder against formula injection and character breaks
const escapeCsvCell = val => {
  let str = String(val ?? "")
  // Neutralize spreadsheet formula execution
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`
  }
  return `"${str.replace(/"/g, '""')}"`
}

// Single source of truth for account standing
export const getTenantStatus = tenant => {
  if (!tenant) return "inactive"
  const rawStatus = String(tenant.subscription?.status || "")
    .toLowerCase()
    .trim()
  const daysLeft = tenant.daysLeft

  // If subscription end date has passed
  if (daysLeft !== null && daysLeft !== undefined && Number(daysLeft) <= 0) {
    return "expired"
  }
  if (rawStatus === "trial") return "trial"
  if (rawStatus === "active") return "active"
  if (rawStatus === "cancelled" || rawStatus === "past_due") return "cancelled"
  return "active"
}

// Status Badging metadata
const STATUS_STYLES = {
  active: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  trial: {
    label: "Trial",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  expired: {
    label: "Expired",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
}

const DEFAULT_METRICS = {
  saasKpis: {
    mrr: { value: 0 },
    gmv: { value: 0 },
    conversionRate: 0,
    activeSubscriptions: 0,
    trialAccounts: 0,
    churnRate: 0,
    totalOrders: 0,
  },
  planDistribution: { starter: 0, business: 0, pro: 0 },
  revenueTrends: [],
  recentPayments: [],
  atRiskTenants: [],
  tenants: [],
  systemHealth: {
    api: "Operational",
    database: "Operational",
    paystack: "Connected",
    uptime: "99.9%",
  },
}

export default function AdminDashboardPage() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // State Management
  const [data, setData] = useState(DEFAULT_METRICS)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [range, setRange] = useState("30d") // '7d' | '30d' | '90d'

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // 'all' | 'active' | 'trial' | 'expired'
  const [tierFilter, setTierFilter] = useState("all") // 'all' | 'starter' | 'business' | 'pro'

  // Drawer & Action Modals
  const [inspectedTenant, setInspectedTenant] = useState(null)
  const [isExtending, setIsExtending] = useState(false)
  const [confirmExtensionFor, setConfirmExtensionFor] = useState(null)

  // Fetch Venture Telemetry with AbortController
  const fetchDashboard = useCallback(
    async (signal = null) => {
      const token =
        appState.user?.token ||
        localStorage.getItem("nexusposToken") ||
        localStorage.getItem("token")
      if (!token) {
        setFetchError("Master session unverified. Please log in.")
        setIsLoading(false)
        return
      }

      setIsRefreshing(true)
      setFetchError(null)

      try {
        const res = await Axios.post(
          `${appState.backendURL}/admin/venture-overview`,
          { token, range },
          { signal },
        )

        if (res.data) {
          // Merge defensively with defaults
          setData(prev => ({
            ...prev,
            ...res.data,
            saasKpis: {
              ...DEFAULT_METRICS.saasKpis,
              ...(res.data.saasKpis || {}),
            },
            planDistribution: {
              ...DEFAULT_METRICS.planDistribution,
              ...(res.data.planDistribution || {}),
            },
            tenants: Array.isArray(res.data.tenants) ? res.data.tenants : [],
            revenueTrends: Array.isArray(res.data.revenueTrends)
              ? res.data.revenueTrends
              : [],
            recentPayments: Array.isArray(res.data.recentPayments)
              ? res.data.recentPayments
              : [],
            atRiskTenants: Array.isArray(res.data.atRiskTenants)
              ? res.data.atRiskTenants
              : [],
            systemHealth: {
              ...DEFAULT_METRICS.systemHealth,
              ...(res.data.systemHealth || {}),
            },
          }))
        }
      } catch (err) {
        if (Axios.isCancel(err)) return
        console.error("Venture Telemetry Failure:", err)
        setFetchError(
          err.response?.data?.msg ||
            "Unable to synchronize platform metrics. Please check network or master credentials.",
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [appState.backendURL, appState.user?.token, range],
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchDashboard(controller.signal)
    return () => controller.abort()
  }, [fetchDashboard])

  // Close Drawer on Escape Key
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === "Escape") {
        setInspectedTenant(null)
        setConfirmExtensionFor(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Execute Trial / Account Extension
  const handleGrantTrialExtension = async storeId => {
    const token =
      appState.user?.token ||
      localStorage.getItem("nexusposToken") ||
      localStorage.getItem("token")
    if (!token || !storeId) return

    try {
      setIsExtending(true)
      await Axios.post(`${appState.backendURL}/admin/grant-trial-extension`, {
        token,
        storeId,
        days: 7,
      })

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: "Granted +7 days extension. Tenant ledger updated.",
        },
      })

      setConfirmExtensionFor(null)
      fetchDashboard()
      // Refresh local drawer view if open
      if (inspectedTenant && inspectedTenant._id === storeId) {
        setInspectedTenant(prev => ({
          ...prev,
          daysLeft: (prev.daysLeft || 0) + 7,
          subscription: { ...prev.subscription, status: "active" },
        }))
      }
    } catch (err) {
      console.error("Extension override error:", err)
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: err.response?.data?.msg || "Failed to grant override extension.",
        },
      })
    } finally {
      setIsExtending(false)
    }
  }

  // Filtered Tenant Pipeline
  const filteredTenants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return data.tenants.filter(t => {
      const status = getTenantStatus(t)
      const tier = String(t.subscription?.plan || "starter").toLowerCase()

      const matchesSearch =
        !q ||
        (t.businessName || "").toLowerCase().includes(q) ||
        (t.ownerEmail || "").toLowerCase().includes(q) ||
        (t.referralCode || "").toLowerCase().includes(q)

      const matchesStatus = statusFilter === "all" || status === statusFilter
      const matchesTier = tierFilter === "all" || tier === tierFilter

      return matchesSearch && matchesStatus && matchesTier
    })
  }, [data.tenants, searchQuery, statusFilter, tierFilter])

  // Count strictly active subscription accounts
  const strictlyActiveTenantsCount = useMemo(() => {
    return data.tenants.filter(t => getTenantStatus(t) === "active").length
  }, [data.tenants])

  // Resilient CSV Exporter
  const handleExportCSV = () => {
    if (!data.tenants || data.tenants.length === 0) return

    const headers = [
      "Tenant ID",
      "Business Name",
      "Owner Email",
      "Plan Tier",
      "Status",
      "Days Remaining",
      "Branches Provisioned",
      "Staff Accounts",
      "Registered Date",
    ]

    const rows = filteredTenants.map(t => [
      t._id,
      t.businessName || "Unnamed Business",
      t.ownerEmail || "No Email",
      t.subscription?.plan || "starter",
      getTenantStatus(t),
      t.daysLeft ?? "N/A",
      t.locationCount ?? 1,
      t.staffCount ?? 1,
      t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-NG") : "N/A",
    ])

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map(row => row.map(escapeCsvCell).join(","))
        .join("\r\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `nexuspos-tenants-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-[550px] flex flex-col items-center justify-center gap-3 text-indigo-600 font-sans">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Compiling Venture Telemetry...
        </p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto shadow-sm my-10">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-800">
          Platform Command Unavailable
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">{fetchError}</p>
        <button
          type="button"
          onClick={() => fetchDashboard()}
          className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
        >
          Retry Master Connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans text-slate-900 antialiased">
      {/* 1. Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Venture Intelligence & Command
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Master Executive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-tenant MRR telemetry, platform churn prevention, and tenant
            provisioning.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Scope Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {["7d", "30d", "90d"].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                  range === k
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? "animate-spin text-indigo-600" : ""}
            />
            <span>{isRefreshing ? "Auditing..." : "Audit"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Platform Financial & Tenant Health Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiSummaryCard
          title="Monthly Recurring Revenue"
          value={formatNaira(data.saasKpis.mrr?.value || 0)}
          subtitle="Contracted Run-Rate"
          icon={<DollarSign size={16} className="text-emerald-600" />}
        />
        <KpiSummaryCard
          title="Platform Gross Merchandise"
          value={formatNaira(data.saasKpis.gmv?.value || 0)}
          subtitle={`${data.saasKpis.totalOrders?.toLocaleString() || 0} counter invoices`}
          icon={<CreditCard size={16} className="text-indigo-600" />}
        />
        <KpiSummaryCard
          title="Active Paid Tenants"
          value={strictlyActiveTenantsCount.toLocaleString()}
          subtitle={`${data.saasKpis.trialAccounts || 0} currently in 14-day trial`}
          icon={<Building size={16} className="text-purple-600" />}
        />
        <KpiSummaryCard
          title="Trial Conversion Velocity"
          value={`${data.saasKpis.conversionRate || 0}%`}
          subtitle={`Platform churn: ${data.saasKpis.churnRate || 0}%`}
          icon={<Activity size={16} className="text-blue-600" />}
        />
      </div>

      {/* 3. Priority At-Risk Churn Queue */}
      {data.atRiskTenants && data.atRiskTenants.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50/90 to-amber-50/60 border border-rose-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-xs font-black uppercase tracking-wider text-rose-950">
                At-Risk Retention Radar: Trial Expirations (&lt;= 48 Hours)
              </h2>
            </div>
            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
              {data.atRiskTenants.length} Tenants Critical
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.atRiskTenants.slice(0, 3).map(tenant => (
              <div
                key={tenant._id}
                className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-rose-200/70 shadow-sm flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {tenant.businessName}
                    </p>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {tenant.daysLeft <= 0
                        ? "Expired"
                        : `${tenant.daysLeft}d left`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {tenant.ownerEmail}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInspectedTenant(tenant)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmExtensionFor(tenant)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95"
                  >
                    Grant +7 Days
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Telemetry Graph & Plan Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Interactive Subscription Revenue Graph */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Subscription Revenue Inflow
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aggregated Paystack settlements across the selected {range}{" "}
                scope.
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              Settled Curves
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <InteractiveVentureChart data={data.revenueTrends} />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-3 border-t border-slate-100">
            <span>Period Inception</span>
            <span>Rolling Momentum</span>
            <span>Current Velocity</span>
          </div>
        </div>

        {/* Commercial Tier Share */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900">
                Plan Tier Distribution
              </h2>
              <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                Active Mix
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Subscription distribution across operational merchants
            </p>

            <div className="space-y-3.5">
              <TierProgressRow
                name="Starter Tier"
                count={data.planDistribution.starter || 0}
                total={strictlyActiveTenantsCount || 1}
                color="bg-slate-600"
              />
              <TierProgressRow
                name="Business Tier"
                count={data.planDistribution.business || 0}
                total={strictlyActiveTenantsCount || 1}
                color="bg-indigo-600"
              />
              <TierProgressRow
                name="Pro / Enterprise"
                count={data.planDistribution.pro || 0}
                total={strictlyActiveTenantsCount || 1}
                color="bg-purple-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <Server size={14} className="text-emerald-500" />
                <span>Paystack Gateway</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">
                {data.systemHealth.paystack || "Operational"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete Merchant Fleet Directory */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-3 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by business name, email, or referral code..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="trial">Trial Accounts</option>
              <option value="expired">Expired Accounts</option>
            </select>

            {/* Plan Tier Filter */}
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-5">Merchant Entity</th>
                <th className="py-3 px-5">Tier Plan</th>
                <th className="py-3 px-5">Subscription State</th>
                <th className="py-3 px-5">Capacity Handled</th>
                <th className="py-3 px-5">Registered</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTenants.length > 0 ? (
                filteredTenants.map(tenant => {
                  const status = getTenantStatus(tenant)
                  const badge = STATUS_STYLES[status] || STATUS_STYLES.active

                  return (
                    <tr
                      key={tenant._id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">
                          {tenant.businessName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {tenant.ownerEmail}
                        </p>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                          {tenant.subscription?.plan || "Starter"}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          {tenant.daysLeft !== null &&
                          tenant.daysLeft !== undefined
                            ? tenant.daysLeft <= 0
                              ? "Expired"
                              : `${tenant.daysLeft}d left`
                            : ""}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-slate-600">
                        <span>{tenant.locationCount || 1} branch(es)</span>
                        <span className="text-slate-300 mx-1.5">•</span>
                        <span>{tenant.staffCount || 1} staff</span>
                      </td>

                      <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                        {tenant.createdAt
                          ? new Date(tenant.createdAt).toLocaleDateString(
                              "en-NG",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "Prior System"}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedTenant(tenant)}
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmExtensionFor(tenant)}
                            title="Grant +7 days free override"
                            className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-xs font-bold transition"
                          >
                            +7 Days
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No merchant tenants match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Accessible Slide-Over Tenant Inspection Drawer */}
      <AnimatePresence>
        {inspectedTenant && (
          <div
            className="fixed inset-0 z-[200] flex justify-end bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setInspectedTenant(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Tenant Operational Profile"
              className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="text-indigo-600" size={18} />
                    <h3 className="font-bold text-sm text-slate-900">
                      Tenant Operational Ledger
                    </h3>
                  </div>
                  <button
                    onClick={() => setInspectedTenant(null)}
                    aria-label="Close tenant drawer"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {inspectedTenant.businessName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Owner: {inspectedTenant.ownerEmail}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan Tier:</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {inspectedTenant.subscription?.plan || "Starter"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscription Status:</span>
                    <span className="font-bold capitalize text-slate-800">
                      {getTenantStatus(inspectedTenant)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Days Remaining:</span>
                    <span className="font-bold text-indigo-600">
                      {inspectedTenant.daysLeft ?? "N/A"} Days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Branches Deployed:</span>
                    <span className="font-bold text-slate-800">
                      {inspectedTenant.locationCount || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Staff Accounts:</span>
                    <span className="font-bold text-slate-800">
                      {inspectedTenant.staffCount || 1}
                    </span>
                  </div>
                  {inspectedTenant.referralCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Referral Code:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {inspectedTenant.referralCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmExtensionFor(inspectedTenant)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} />
                  <span>Grant +7 Days Goodwill</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Confirmation Modal for Trial Overrides */}
      <AnimatePresence>
        {confirmExtensionFor && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              role="alertdialog"
              aria-modal="true"
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle size={24} />
                <h3 className="font-bold text-slate-900 text-sm">
                  Confirm Trial Extension
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to grant <strong>+7 days</strong> of full
                operational access to{" "}
                <strong>{confirmExtensionFor.businessName}</strong>? This
                modifies database subscription periods directly.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isExtending}
                  onClick={() => setConfirmExtensionFor(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isExtending}
                  onClick={() =>
                    handleGrantTrialExtension(confirmExtensionFor._id)
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isExtending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : null}
                  <span>Confirm +7 Days</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Subcomponent: Executive Summary Card
function KpiSummaryCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{title}</span>
        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
          {icon}
        </div>
      </div>
      <div className="my-2">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {value}
        </h3>
      </div>
      <p className="text-[11px] text-slate-400 font-medium truncate">
        {subtitle}
      </p>
    </div>
  )
}

// Subcomponent: Tier Breakdown Row
function TierProgressRow({ name, count, total, color }) {
  const percentage = Math.round((count / (total || 1)) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span>{name}</span>
        <span>
          {count}{" "}
          <span className="text-slate-400 font-normal">({percentage}%)</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Subcomponent: Interactive Venture Chart
function InteractiveVentureChart({ data = [] }) {
  const [activePoint, setActivePoint] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-300">
        No settled Paystack subscriptions registered for this interval.
      </div>
    )
  }

  const values = data.map(d => Number(d.amount) || 0)
  const max = Math.max(...values, 1000)
  const min = 0
  const width = 600
  const height = 180

  const points = data.map((d, idx) => {
    const val = Number(d.amount) || 0
    const x = (idx / (data.length - 1 || 1)) * (width - 40) + 20
    const y = height - ((val - min) / (max - min || 1)) * (height - 40) - 20
    return { x, y, label: d.label, amount: val }
  })

  const pathD = `M ${points[0].x},${height} L ${points.map(p => `${p.x},${p.y}`).join(" L ")} L ${points[points.length - 1].x},${height} Z`
  const strokeD = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`

  return (
    <div className="relative w-full h-full flex flex-col justify-end">
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none -top-2 bg-slate-900 text-white rounded-xl px-3 py-1.5 text-xs shadow-xl transition-all border border-slate-700"
          style={{
            left: `${Math.min(Math.max((activePoint.x / width) * 100, 10), 85)}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[10px] text-slate-400 font-bold uppercase">
            Date: {activePoint.label}
          </p>
          <p className="font-bold text-white text-xs">
            {formatNaira(activePoint.amount)}
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => setActivePoint(null)}
      >
        <defs>
          <linearGradient id="ventureGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <line
          x1="20"
          y1={height - 20}
          x2={width - 20}
          y2={height - 20}
          stroke="#f1f5f9"
          strokeWidth="1"
        />
        <line
          x1="20"
          y1={height / 2}
          x2={width - 20}
          y2={height / 2}
          stroke="#f8fafc"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        <path d={pathD} fill="url(#ventureGrad)" />
        <path
          d={strokeD}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((pt, idx) => (
          <g
            key={idx}
            className="cursor-pointer"
            onMouseEnter={() => setActivePoint(pt)}
          >
            <circle
              cx={pt.x}
              cy={pt.y}
              r={activePoint?.label === pt.label ? 5 : 3}
              className={`transition-all ${
                activePoint?.label === pt.label
                  ? "fill-white stroke-indigo-600 stroke-[3px]"
                  : "fill-indigo-600 hover:fill-indigo-700"
              }`}
            />
            <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
          </g>
        ))}
      </svg>
    </div>
  )
}
