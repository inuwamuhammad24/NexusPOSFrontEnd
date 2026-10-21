import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Search,
  Calendar,
  Loader2,
  Package,
  Building2,
  RefreshCw,
  X,
  History,
  FileSpreadsheet,
} from "lucide-react"
import { motion } from "framer-motion"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function StockHistoryTable({ refreshSignal = 0 }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [activities, setActivities] = useState([])
  const [query, setQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [lastId, setLastId] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const sentinelRef = useRef(null)

  const fetchHistory = useCallback(
    async (isNewSearch = false) => {
      if (isFetching || (!hasMore && !isNewSearch)) return

      const token = appState.user?.token || localStorage.getItem("token")
      if (!token) return

      setIsFetching(true)
      if (isNewSearch) setIsInitialLoading(true)

      const currentLastId = isNewSearch ? null : lastId

      try {
        const payload = {
          token,
          lastId: currentLastId,
          query: query.trim(),
          date: dateFilter,
          limit: 20,
          params: {
            lastId: currentLastId,
            query: query.trim(),
            date: dateFilter,
            limit: 20,
          },
        }

        const response = await Axios.post(
          `${appState.backendURL}/stock-history`,
          payload,
        )

        const incoming = Array.isArray(response.data) ? response.data : []

        if (incoming.length > 0) {
          setActivities(prev => {
            if (isNewSearch) return incoming
            const existingIds = new Set(prev.map(i => i._id))
            const uniqueIncoming = incoming.filter(i => !existingIds.has(i._id))
            return [...prev, ...uniqueIncoming]
          })
          setLastId(incoming[incoming.length - 1]._id)
          setHasMore(incoming.length === 20)
        } else {
          if (isNewSearch) setActivities([])
          setHasMore(false)
        }
      } catch (err) {
        console.error("Stock history fetch error:", err)
        setHasMore(false)
      } finally {
        setIsFetching(false)
        setIsInitialLoading(false)
      }
    },
    [
      appState.backendURL,
      appState.user?.token,
      query,
      dateFilter,
      lastId,
      hasMore,
      isFetching,
    ],
  )

  // Reload when query, date filter, or external refresh triggers change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setLastId(null)
      setHasMore(true)
      fetchHistory(true)
    }, 280)

    return () => clearTimeout(delayDebounce)
  }, [query, dateFilter, refreshSignal])

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetching &&
          !isInitialLoading
        ) {
          fetchHistory(false)
        }
      },
      { threshold: 0.1 },
    )

    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, isFetching, isInitialLoading, fetchHistory])

  const renderTypeBadge = type => {
    const t = (type || "").toUpperCase()

    if (t === "ARRIVAL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <ArrowDownLeft size={12} className="text-emerald-600" /> Stock Inflow
        </span>
      )
    }

    if (t === "TRANSFER") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
          <ArrowRightLeft size={12} className="text-indigo-600" /> Transfer
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
        <ArrowUpRight size={12} className="text-rose-600" /> POS Sale
      </span>
    )
  }

  return (
    <div className="space-y-4 text-gray-900 font-sans antialiased">
      {/* 1. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
            size={16}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search product, invoice, or staff..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Calendar
              size={14}
              className="absolute left-3 text-gray-400 pointer-events-none"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none hover:bg-gray-100 focus:bg-white focus:border-indigo-500 transition cursor-pointer"
            />
          </div>

          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
              title="Reset date"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col min-h-[460px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-gray-200/80 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-6">Timestamp / Event</th>
                <th className="py-3.5 px-6">Product Item</th>
                <th className="py-3.5 px-6">Branch / Storage</th>
                <th className="py-3.5 px-6 text-center">Movement Qty</th>
                <th className="py-3.5 px-6">Reference / Supplier</th>
                <th className="py-3.5 px-6 text-right">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {activities.map(item => {
                const isPositive = Number(item.quantity) > 0

                return (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Timestamp & Type Badge */}
                    <td className="py-3.5 px-6">
                      <div className="space-y-1">
                        <div>{renderTypeBadge(item.type)}</div>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {new Date(item.timestamp).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          •{" "}
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                          <Package size={14} />
                        </div>
                        <span className="font-bold text-gray-900 truncate max-w-[200px]">
                          {item.productName || "Direct Stock Line"}
                        </span>
                      </div>
                    </td>

                    {/* Store / Location */}
                    <td className="py-3.5 px-6 text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-gray-400" />
                        <span>{item.storeName || "Main Counter"}</span>
                      </div>
                    </td>

                    {/* Quantity Change */}
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`font-black text-sm px-2.5 py-0.5 rounded-lg ${
                          isPositive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {isPositive ? `+${item.quantity}` : item.quantity}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium ml-1">
                        {item.unitType || "Units"}
                      </span>
                    </td>

                    {/* Reference / Supplier */}
                    <td className="py-3.5 px-6">
                      <p className="font-mono text-[11px] font-bold text-gray-800">
                        {item.reference || "N/A"}
                      </p>
                      {item.supplierName && (
                        <p className="text-[10px] text-gray-400">
                          {item.supplierName}
                        </p>
                      )}
                    </td>

                    {/* Operator */}
                    <td className="py-3.5 px-6 text-right font-semibold text-gray-700">
                      {item.performedBy || "System"}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 3. Sentinel & Empty / Loading States */}
        <div
          ref={sentinelRef}
          className="px-6 py-8 bg-slate-50/50 border-t border-gray-100 flex flex-col items-center justify-center min-h-[70px]"
        >
          {isFetching ? (
            <div className="flex items-center gap-2.5 text-indigo-600">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Loading stock ledger...
              </span>
            </div>
          ) : activities.length > 0 && !hasMore ? (
            <div className="flex items-center gap-3 opacity-40">
              <div className="h-px w-10 bg-gray-300" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Ledger End
              </p>
              <div className="h-px w-10 bg-gray-300" />
            </div>
          ) : activities.length === 0 && !isFetching ? (
            <div className="text-center py-8 text-gray-400">
              <History size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold text-gray-700">
                No stock records yet
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Arrivals, transfers, and checkout deductions will log here
                automatically.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
