// components/Pages/Sales/SalesTable.js
import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react"
import {
  Search,
  Loader2,
  Receipt,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Banknote,
  RotateCcw,
  Eye,
  AlertTriangle,
  Filter,
  X,
  Package,
  CheckCircle2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"

const LIMIT = 15

export default function SalesTable() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // Remote Data State
  const [salesRecords, setSalesRecords] = useState([])
  const [summaries, setSummaries] = useState({
    totalRevenue: 0,
    totalCount: 0,
    averageTicket: 0,
    cashRevenue: 0,
    digitalRevenue: 0,
  })
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedRange, setSelectedRange] = useState("today")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all")

  // Detail Drawer
  const [inspectedSale, setInspectedSale] = useState(null)
  const observerTarget = useRef(null)

  // Debounce Search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch initial batch (re-triggered on filter changes)
  const fetchInitialSales = useCallback(async () => {
    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) return

    try {
      setIsLoading(true)
      setFetchError(null)

      const res = await Axios.post(`${appState.backendURL}/all-sales`, {
        token,
        range: selectedRange,
        paymentMethod: selectedPaymentMethod,
        search: debouncedSearch,
        skip: 0,
        limit: LIMIT,
      })

      setSalesRecords(res.data.records || [])
      setSummaries(res.data.summaries || {})
      setHasMore(Boolean(res.data.hasMore))
    } catch (err) {
      console.error("Sales query error:", err)
      setFetchError("Unable to load sales records from server.")
    } finally {
      setIsLoading(false)
    }
  }, [
    appState.backendURL,
    appState.user?.token,
    selectedRange,
    selectedPaymentMethod,
    debouncedSearch,
  ])

  useEffect(() => {
    fetchInitialSales()
  }, [fetchInitialSales])

  // Fetch next batch when bottom sentinel is reached
  const fetchNextBatch = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) return

    try {
      setIsLoadingMore(true)
      const res = await Axios.post(`${appState.backendURL}/all-sales`, {
        token,
        range: selectedRange,
        paymentMethod: selectedPaymentMethod,
        search: debouncedSearch,
        skip: salesRecords.length,
        limit: LIMIT,
      })

      setSalesRecords(prev => [...prev, ...(res.data.records || [])])
      setHasMore(Boolean(res.data.hasMore))
    } catch (err) {
      console.error("Next batch fetch failure:", err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    isLoadingMore,
    hasMore,
    appState.backendURL,
    appState.user?.token,
    selectedRange,
    selectedPaymentMethod,
    debouncedSearch,
    salesRecords.length,
  ])

  // Intersection Observer Sentinel Trigger
  useEffect(() => {
    const target = observerTarget.current
    if (!target) return

    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          fetchNextBatch()
        }
      },
      { threshold: 0.1, rootMargin: "150px" },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingMore, fetchNextBatch])

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedRange("today")
    setSelectedPaymentMethod("all")
  }

  const getBadgeClass = method => {
    const m = String(method || "").toLowerCase()
    if (m.includes("cash"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (m.includes("transfer"))
      return "bg-blue-50 text-blue-700 border-blue-200"
    if (m.includes("pos") || m.includes("card"))
      return "bg-purple-50 text-purple-700 border-purple-200"
    return "bg-slate-50 text-slate-700 border-slate-200"
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans antialiased text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Sales & Invoices
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server-side paginated transaction stream with automatic loading on
            scroll.
          </p>
        </div>

        <button
          type="button"
          onClick={() => appDispatch({ type: "openSalesModal" })}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95"
        >
          <ShoppingCart size={15} />
          <span>New Sale / Checkout</span>
        </button>
      </div>

      {/* 2. Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Sales Revenue"
          value={formatNaira(summaries.totalRevenue)}
          subtitle={`Window: ${getRangeLabel(selectedRange)}`}
          icon={<TrendingUp size={16} className="text-indigo-600" />}
        />
        <SummaryCard
          title="Settled Invoices"
          value={summaries.totalCount.toLocaleString()}
          subtitle="Processed orders"
          icon={<Receipt size={16} className="text-emerald-600" />}
        />
        <SummaryCard
          title="Average Basket Size"
          value={formatNaira(summaries.averageTicket)}
          subtitle="Mean transaction value"
          icon={<CreditCard size={16} className="text-blue-600" />}
        />
        <SummaryCard
          title="Cash vs. Digital Mix"
          value={formatNaira(summaries.cashRevenue)}
          subtitle={`Digital: ${formatNaira(summaries.digitalRevenue)}`}
          icon={<Banknote size={16} className="text-amber-600" />}
        />
      </div>

      {/* 3. Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-3 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, buyer name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {["today", "7d", "30d", "all"].map(rangeKey => (
              <button
                key={rangeKey}
                type="button"
                onClick={() => setSelectedRange(rangeKey)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  selectedRange === rangeKey
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {rangeKey === "today"
                  ? "Today"
                  : rangeKey === "7d"
                    ? "7 Days"
                    : rangeKey === "30d"
                      ? "30 Days"
                      : "All"}
              </button>
            ))}
          </div>

          <select
            value={selectedPaymentMethod}
            onChange={e => setSelectedPaymentMethod(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="pos">POS / Card</option>
          </select>

          {(searchQuery ||
            selectedRange !== "today" ||
            selectedPaymentMethod !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Table Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-5">Invoice Reference</th>
                <th className="py-3 px-5">Customer Profile</th>
                <th className="py-3 px-5">Total Paid</th>
                <th className="py-3 px-5">Settlement Method</th>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-indigo-600">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Querying database...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-rose-600">
                      <AlertTriangle size={28} />
                      <p className="text-xs font-bold text-slate-800">
                        {fetchError}
                      </p>
                      <button
                        type="button"
                        onClick={fetchInitialSales}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition"
                      >
                        Retry Query
                      </button>
                    </div>
                  </td>
                </tr>
              ) : salesRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Receipt size={30} className="opacity-40" />
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        No transactions found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {debouncedSearch
                          ? "No records match your active query."
                          : "No counter sales logged for this date window."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                salesRecords.map(sale => {
                  const dateObj = new Date(sale.createdAt || Date.now())
                  return (
                    <tr
                      key={sale._id || sale.invoiceId}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-100">
                          {sale.invoiceId || "INV"}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <p className="text-slate-900 font-bold">
                          {sale.customerName || "Walk-in Buyer"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {sale.items?.length || 1} line item(s)
                        </p>
                      </td>

                      <td className="py-3.5 px-5 font-black text-slate-900 text-sm">
                        {formatNaira(sale.total)}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeClass(
                            sale.paymentMethod,
                          )}`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <p className="text-slate-700 text-xs font-semibold">
                          {dateObj.toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {dateObj.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedSale(sale)}
                            title="Inspect Invoice Details"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              appDispatch({
                                type: "setReceiptData",
                                payload: sale,
                              })
                            }
                            title="Print Thermal Receipt"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-xs font-semibold transition"
                          >
                            <Receipt size={13} />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Infinite Scroll Sentinel & Footer */}
        {!isLoading && salesRecords.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col items-center justify-center gap-2">
            {/* Target observer for next batch */}
            <div ref={observerTarget} className="h-2 w-full" />

            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold py-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Fetching next batch from database...</span>
              </div>
            ) : hasMore ? (
              <button
                type="button"
                onClick={fetchNextBatch}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 px-4 py-1.5 rounded-full transition"
              >
                Load More Records
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 py-2">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>End of records ({salesRecords.length} loaded)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Invoice Line-Item Detail Slide-Over */}
      <AnimatePresence>
        {inspectedSale && (
          <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="text-indigo-600" size={18} />
                    <h3 className="font-bold text-sm text-slate-900">
                      Invoice Specification
                    </h3>
                  </div>
                  <button
                    onClick={() => setInspectedSale(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {inspectedSale.invoiceId}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    {formatNaira(inspectedSale.total)}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Buyer: {inspectedSale.customerName || "Walk-in Buyer"}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settlement Mode:</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {inspectedSale.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(
                        inspectedSale.createdAt || Date.now(),
                      ).toLocaleString()}
                    </span>
                  </div>
                  {inspectedSale.staffName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Operating Cashier:</span>
                      <span className="font-bold text-slate-800">
                        {inspectedSale.staffName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Items Checked Out
                  </h4>

                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                    {Array.isArray(inspectedSale.items) &&
                    inspectedSale.items.length > 0 ? (
                      inspectedSale.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <Package size={13} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">
                                {item.name || item.productName || "Stock Item"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {item.quantity || item.qty || 1} x{" "}
                                {formatNaira(
                                  item.price || item.sellingPrice || 0,
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">
                            {formatNaira(
                              (item.quantity || item.qty || 1) *
                                (item.price || item.sellingPrice || 0),
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        No product breakdown attached to this invoice.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    appDispatch({
                      type: "setReceiptData",
                      payload: inspectedSale,
                    })
                    setInspectedSale(null)
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Receipt size={14} />
                  <span>Thermal Print Receipt</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryCard({ title, value, subtitle, icon }) {
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

function getRangeLabel(key) {
  switch (key) {
    case "today":
      return "Today"
    case "7d":
      return "Last 7 Days"
    case "30d":
      return "Last 30 Days"
    default:
      return "All Historical"
  }
}
