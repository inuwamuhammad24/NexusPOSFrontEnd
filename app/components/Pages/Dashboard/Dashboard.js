// app/components/Pages/Dashboard/Dashboard.js
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react"
import { useNavigate } from "react-router-dom"
import {
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  Receipt,
  Users,
  Clock,
  Shield,
} from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"

// --- RANGE CONFIGURATION DICTIONARY ---
const RANGES = {
  today: {
    label: "Today",
    title: "Today's",
    compare: "vs yesterday",
  },
  "7d": {
    label: "7 Days",
    title: "Last 7 Days",
    compare: "vs prior 7d",
  },
  "30d": {
    label: "30 Days",
    title: "Last 30 Days",
    compare: "vs prior 30d",
  },
}

const DEFAULT_METRICS = {
  revenue: 0,
  prevRevenue: 0,
  profit: 0,
  orderCount: 0,
  averageSale: 0,
  totalUnits: 0,
  stockRetailValuation: 0,
  totalCustomerDebt: 0,
  lowStockCount: 0,
  lowStockItems: [],
  topProducts: [],
  recentSales: [],
  chartData: [],
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)
  const navigate = useNavigate()

  const [timeRange, setTimeRange] = useState("today")
  const [metrics, setMetrics] = useState(DEFAULT_METRICS)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const userRole = String(
    appState.user?.role ||
      localStorage.getItem("nexusposRole") ||
      localStorage.getItem("role") ||
      "cashier",
  )
    .toLowerCase()
    .trim()
  const isPrivileged =
    userRole === "admin" || userRole === "owner" || userRole === "manager"

  const fetchDashboardData = useCallback(
    async (signal = null) => {
      const token = appState.user?.token || localStorage.getItem("token")
      if (!token) {
        setFetchError("Authentication token missing. Please sign in.")
        setIsLoading(false)
        return
      }

      setIsRefreshing(true)

      try {
        const response = await Axios.post(
          `${appState.backendURL}/dashboard-overview`,
          { token, range: timeRange },
          { signal },
        )

        if (response.data) {
          setMetrics(prev => ({
            ...prev,
            ...response.data,
            revenue: Number(
              response.data.revenue ?? response.data.todayRevenue ?? 0,
            ),
            prevRevenue: Number(response.data.prevRevenue ?? 0),
            profit: Number(
              response.data.profit ?? response.data.todayProfit ?? 0,
            ),
            orderCount: Number(
              response.data.orderCount ?? response.data.salesCount ?? 0,
            ),
            averageSale: Number(response.data.averageSale ?? 0),
            totalUnits: Number(
              response.data.totalUnits ?? response.data.units ?? 0,
            ),
            stockRetailValuation: Number(
              response.data.stockRetailValuation ??
                response.data.valuation ??
                0,
            ),
            totalCustomerDebt: Number(response.data.totalCustomerDebt ?? 0),
            lowStockCount: Number(
              response.data.lowStockCount ??
                response.data.lowStockItems?.length ??
                0,
            ),
            lowStockItems: Array.isArray(response.data.lowStockItems)
              ? response.data.lowStockItems
              : [],
            topProducts: Array.isArray(response.data.topProducts)
              ? response.data.topProducts
              : [],
            recentSales: Array.isArray(response.data.recentSales)
              ? response.data.recentSales
              : [],
            chartData: Array.isArray(response.data.chartData)
              ? response.data.chartData
              : [],
          }))
          setLastUpdated(new Date())
          setFetchError(null)
          setHasLoadedInitial(true)
        }
      } catch (err) {
        if (Axios.isCancel(err)) return
        console.error("Dashboard fetch error:", err)
        setFetchError(
          err.response?.data?.msg ||
            "Unable to synchronize store telemetry. Displaying cached metrics.",
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [appState.backendURL, appState.user?.token, timeRange],
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchDashboardData(controller.signal)
    return () => controller.abort()
  }, [fetchDashboardData])

  const growthInsight = useMemo(() => {
    const current = metrics.revenue
    const prev = metrics.prevRevenue

    if (prev === 0 && current === 0) {
      return { text: "No activity", type: "neutral" }
    }
    if (prev === 0 && current > 0) {
      return { text: "New period sales", type: "positive" }
    }
    if (current === 0 && prev > 0) {
      return { text: "No sales yet", type: "negative" }
    }

    const diff = ((current - prev) / prev) * 100
    return {
      text: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`,
      type: diff >= 0 ? "positive" : "negative",
    }
  }, [metrics.revenue, metrics.prevRevenue])

  const grossMarginRatio = useMemo(() => {
    if (metrics.revenue === 0) return "0.0"
    return ((metrics.profit / metrics.revenue) * 100).toFixed(1)
  }, [metrics.revenue, metrics.profit])

  const greetingText = useMemo(() => {
    const timeGreeting = getTimeOfDayGreeting()
    const name =
      appState.user?.username || appState.user?.businessName || "Merchant"
    return `${timeGreeting}, ${name}`
  }, [appState.user?.username, appState.user?.businessName])

  const quickActions = useMemo(
    () => [
      {
        label: "+ New Sale (POS)",
        icon: ShoppingBag,
        primary: true,
        handler: () => appDispatch({ type: "openSalesModal" }),
      },
      {
        label: "+ Product",
        icon: PlusCircle,
        handler: () => appDispatch({ type: "openProductModal" }),
        privileged: true,
      },
      {
        label: "Receive Stock",
        icon: ArrowDownLeft,
        iconColor: "text-emerald-600",
        handler: () => appDispatch({ type: "openArrivalModal" }),
        privileged: true,
      },
      {
        label: "Transfer Stock",
        icon: ArrowRightLeft,
        iconColor: "text-indigo-600",
        handler: () => appDispatch({ type: "openTransferModal" }),
        privileged: true,
      },
      {
        label: "Customers",
        icon: Users,
        handler: () => navigate("/customers"),
        privileged: true,
      },
    ],
    [appDispatch, navigate],
  )

  if (!hasLoadedInitial && fetchError && !isLoading) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 p-6 text-center max-w-lg mx-auto shadow-sm my-6 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-800">
          Operational Sync Failure
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">{fetchError}</p>
        <button
          type="button"
          onClick={() => fetchDashboardData()}
          className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  const currentRangeMeta = RANGES[timeRange] || RANGES.today

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-12 font-sans text-slate-900 antialiased max-w-7xl mx-auto px-1 sm:px-0">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {greetingText}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              {userRole}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
              Live Terminal
            </span>
            {lastUpdated && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock size={11} />{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Range Selector & Manual Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div
            className="flex items-center bg-slate-100 p-1 rounded-xl flex-1 sm:flex-initial justify-between"
            role="group"
            aria-label="Dashboard Date Scope"
          >
            {Object.entries(RANGES).map(([key, meta]) => {
              const isActive = timeRange === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setTimeRange(key)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {meta.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData()}
            disabled={isRefreshing}
            aria-label="Refresh operational telemetry"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              size={14}
              className={
                isRefreshing
                  ? "animate-spin text-indigo-600 motion-reduce:animate-none"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* 2. Non-Destructive Error Banner */}
      {fetchError && (
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span className="line-clamp-1">{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="font-bold underline hover:text-amber-950 ml-2 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Action Center: Carousel on Mobile, Grid on Desktop */}
      <ActionCenter
        metrics={metrics}
        isPrivileged={isPrivileged}
        onRestockProduct={item =>
          appDispatch({ type: "openArrivalModal", payload: { product: item } })
        }
        onOpenRestock={() => appDispatch({ type: "openArrivalModal" })}
        onNavigateCustomers={() => navigate("/customers")}
      />

      {/* 4. Executive Metric Cards */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-opacity duration-200 ${
          isRefreshing ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
      >
        <MetricCard
          title={`${currentRangeMeta.title} Revenue`}
          value={formatNaira(metrics.revenue)}
          insightText={growthInsight.text}
          insightType={growthInsight.type}
          compareLabel={currentRangeMeta.compare}
          icon={<TrendingUp size={15} className="text-indigo-600" />}
        />

        {isPrivileged ? (
          <MetricCard
            title={`${currentRangeMeta.title} Margin`}
            value={formatNaira(metrics.profit)}
            subtitle={`${grossMarginRatio}% realized margin`}
            icon={<Wallet size={15} className="text-emerald-600" />}
          />
        ) : (
          <MetricCard
            title="Terminal Status"
            value="Active Cashier"
            subtitle="Session verified"
            icon={<Shield size={15} className="text-slate-400" />}
          />
        )}

        <MetricCard
          title="Checkout Volume"
          value={`${metrics.orderCount.toLocaleString()} Orders`}
          subtitle={`Avg: ${formatNaira(metrics.averageSale)}`}
          icon={<Receipt size={15} className="text-blue-600" />}
        />

        <MetricCard
          title="Stock Units"
          value={`${metrics.totalUnits.toLocaleString()} Units`}
          subtitle={
            isPrivileged
              ? `Val: ${formatNaira(metrics.stockRetailValuation)}`
              : `${metrics.lowStockCount} items low`
          }
          statusTag={
            metrics.lowStockCount > 0
              ? { text: `● ${metrics.lowStockCount} low`, type: "danger" }
              : { text: "● Stable", type: "success" }
          }
          icon={<Package size={15} className="text-amber-600" />}
        />
      </div>

      {/* 5. Quick Actions Command Bar (Horizontal Swipe Track on Mobile) */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
        {quickActions
          .filter(action => !action.privileged || isPrivileged)
          .map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                type="button"
                onClick={action.handler}
                className={
                  action.primary
                    ? "flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95 shrink-0"
                    : "flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95 shrink-0"
                }
              >
                <Icon
                  size={14}
                  className={
                    action.iconColor ||
                    (action.primary ? "text-white" : "text-slate-500")
                  }
                />
                <span className="whitespace-nowrap">{action.label}</span>
              </button>
            )
          })}
      </div>

      {/* 6. Interactive Chart & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Sales Velocity Trajectory
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Touch data nodes to inspect interval receipts.
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 shrink-0">
              Curve
            </span>
          </div>

          <div className="h-44 sm:h-52 w-full pt-2">
            <InteractiveTelemetryChart
              data={metrics.chartData}
              rangeKey={timeRange}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium pt-3 border-t border-slate-100">
            <span>
              {metrics.chartData.length > 0
                ? metrics.chartData[0].label
                : "Open"}
            </span>
            <span>Intra-Window Velocity</span>
            <span>
              {metrics.chartData.length > 0
                ? metrics.chartData[metrics.chartData.length - 1].label
                : "Close"}
            </span>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900">
                Top Selling Products
              </h2>
              <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                By Units
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              SKUs driving highest volume during{" "}
              {currentRangeMeta.title.toLowerCase()} window
            </p>

            <div className="divide-y divide-slate-100">
              {metrics.topProducts && metrics.topProducts.length > 0 ? (
                metrics.topProducts.slice(0, 4).map((item, idx) => (
                  <div
                    key={item._id || item.sku || `prod-${idx}`}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors px-1 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 leading-tight truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.unitsSold} units
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      {formatNaira(item.totalRevenue)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">
                  No sales logged for this specific interval.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="w-full mt-3 py-2 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition flex items-center justify-center gap-1 active:scale-95"
          >
            <span>Open Product Catalog</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 7. Operational Ledger Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Low Stock Watchlist
              </h2>
              {metrics.lowStockItems?.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse motion-reduce:animate-none" />
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Inventory ({metrics.lowStockCount}) →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.lowStockItems?.length > 0 ? (
              metrics.lowStockItems.slice(0, 4).map(item => (
                <div
                  key={item._id || item.sku}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      SKU: {item.sku} • Alert: {item.minStock ?? 10}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {item.quantity ?? 0} left
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        appDispatch({
                          type: "openArrivalModal",
                          payload: { product: item },
                        })
                      }
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold transition active:scale-95"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                <CheckCircle2
                  size={22}
                  className="text-emerald-500 opacity-80"
                />
                <p className="font-semibold text-slate-600">
                  Inventory levels stable
                </p>
                <p className="text-[11px]">
                  No items require emergency re-ordering.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Checkout Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Recent Checkout Sales
            </h2>
            <button
              type="button"
              onClick={() => navigate("/sales")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              All Invoices →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.recentSales && metrics.recentSales.length > 0 ? (
              metrics.recentSales.slice(0, 4).map(sale => {
                const saleDate = sale.createdAt
                  ? new Date(sale.createdAt)
                  : null
                return (
                  <div
                    key={sale._id || sale.invoiceId}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-indigo-600 truncate">
                          {sale.invoiceId || "INV"}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {saleDate
                            ? timeRange === "today"
                              ? saleDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : saleDate.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })
                            : ""}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {sale.customerName || "Walk-in Buyer"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatNaira(sale.total)}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          {sale.paymentMethod || "Cash"}
                        </span>
                      </div>

                      <button
                        type="button"
                        aria-label={`Preview thermal receipt for ${sale.invoiceId || "ticket"}`}
                        onClick={() =>
                          appDispatch({ type: "setReceiptData", payload: sale })
                        }
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition active:scale-95"
                      >
                        <Receipt size={15} />
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                No recent transactions recorded on this store.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- SUBCOMPONENTS ---

function ActionCenter({
  metrics,
  isPrivileged,
  onOpenRestock,
  onNavigateCustomers,
}) {
  const hasLowStock = metrics.lowStockCount > 0
  const hasDebt = isPrivileged && metrics.totalCustomerDebt > 0

  if (!hasLowStock && !hasDebt) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Safe inventory buffers and clean debtor balances.</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest hidden sm:inline">
          Nominal
        </span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-amber-50/95 to-amber-50/60 border border-amber-200/90 rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping motion-reduce:animate-none" />
          <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-950">
            Action Center: Immediate Decisions
          </h2>
        </div>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
          {(hasLowStock ? 1 : 0) + (hasDebt ? 1 : 0)} Priorities
        </span>
      </div>

      <div className="flex sm:grid sm:grid-cols-2 gap-2.5 overflow-x-auto pb-1 sm:pb-0 snap-x snap-mandatory scrollbar-none">
        {hasLowStock && (
          <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-amber-200/70 flex items-center justify-between gap-2 shadow-sm shrink-0">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                Restock Thresholds
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                <b>{metrics.lowStockCount} item(s)</b> below safety levels.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenRestock}
              className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 active:scale-95"
            >
              <span>Restock</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}

        {hasDebt && (
          <div className="min-w-[260px] sm:min-w-0 snap-start bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-amber-200/70 flex items-center justify-between gap-2 shadow-sm shrink-0">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                Debtor Exposure
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                <b>{formatNaira(metrics.totalCustomerDebt)}</b> outstanding
                credit.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateCustomers}
              className="shrink-0 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 active:scale-95"
            >
              <span>Reconcile</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  insightText,
  insightType,
  compareLabel,
  statusTag,
  icon,
}) {
  return (
    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span className="truncate pr-1">{title}</span>
        {icon}
      </div>

      <div className="my-2 sm:my-3">
        <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
          {value}
        </p>
      </div>

      <div>
        {insightText ? (
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold flex-wrap">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                insightType === "positive"
                  ? "bg-emerald-50 text-emerald-700"
                  : insightType === "negative"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {insightText}
            </span>
            {compareLabel && (
              <span className="text-slate-400 font-medium truncate">
                {compareLabel}
              </span>
            )}
          </div>
        ) : statusTag ? (
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-slate-400 truncate">{subtitle}</span>
            <span
              className={`font-bold shrink-0 ${statusTag.type === "danger" ? "text-rose-600" : "text-emerald-600"}`}
            >
              {statusTag.text}
            </span>
          </div>
        ) : (
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

function InteractiveTelemetryChart({ data = [], rangeKey }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const containerRef = useRef(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-300">
        No transaction curve points registered for this interval.
      </div>
    )
  }

  const values = data.map(d => Number(d.amount) || 0)
  const max = Math.max(...values, 100)
  const min = Math.min(...values, 0)
  const width = 600
  const height = 160

  const points = data.map((d, idx) => {
    const val = Number(d.amount) || 0
    const x = (idx / (data.length - 1 || 1)) * (width - 40) + 20
    const y = height - ((val - min) / (max - min || 1)) * (height - 40) - 20
    return {
      x,
      y,
      label: d.label,
      amount: val,
      orders: d.orders || 0,
      index: idx,
    }
  })

  const pathD = `M ${points[0].x},${height} L ${points.map(p => `${p.x},${p.y}`).join(" L ")} L ${points[points.length - 1].x},${height} Z`
  const strokeD = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`

  const activePoint = activeIndex !== null ? points[activeIndex] : null

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col justify-end"
      onPointerLeave={() => setActiveIndex(null)}
    >
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none -top-2 bg-slate-900 text-white rounded-xl px-2.5 py-1 text-xs shadow-xl transition-all border border-slate-700"
          style={{
            left: `${Math.min(Math.max((activePoint.x / width) * 100, 15), 85)}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[9px] text-slate-400 font-bold uppercase">
            Time: {activePoint.label}
          </p>
          <p className="font-bold text-white text-[11px] leading-tight">
            {formatNaira(activePoint.amount)}
          </p>
          <p className="text-[9px] text-indigo-300">
            {activePoint.orders} order(s)
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label={`Sales volume curve for ${rangeKey}`}
      >
        <defs>
          <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
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

        <path d={pathD} fill="url(#velocityGrad)" />
        <path
          d={strokeD}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((pt, idx) => {
          const isSelected = activeIndex === idx
          return (
            <g
              key={idx}
              tabIndex={0}
              role="button"
              aria-label={`Interval ${pt.label}: ${formatNaira(pt.amount)}`}
              onPointerDown={() => setActiveIndex(idx)}
              onPointerEnter={() => setActiveIndex(idx)}
              onFocus={() => setActiveIndex(idx)}
              onBlur={() => setActiveIndex(null)}
              className="cursor-pointer outline-none"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 5 : 3}
                className={`transition-all ${
                  isSelected
                    ? "fill-white stroke-indigo-600 stroke-[3px]"
                    : "fill-indigo-600 hover:fill-indigo-700"
                }`}
              />
              <circle cx={pt.x} cy={pt.y} r="20" fill="transparent" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
