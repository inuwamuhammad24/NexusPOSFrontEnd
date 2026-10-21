import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react"
import {
  FileText,
  Search,
  Calendar,
  PackagePlus,
  Loader2,
  X,
  ArrowRightLeft,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"
import { motion } from "framer-motion"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function StockTable({ refreshSignal = 0 }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // --- STATE MANAGEMENT ---
  const [activities, setActivities] = useState([])
  const [query, setQuery] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [lastId, setLastId] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  const sentinelRef = useRef(null)

  // --- LOGIC: FETCH INVENTORY AGGREGATIONS ---
  const fetchStockHistory = useCallback(
    async (isNewSearch = false) => {
      if (isFetching || (!hasMore && !isNewSearch)) return

      const token = appState.user?.token || localStorage.getItem("token")
      if (!token) {
        setIsFetching(false)
        return
      }

      setIsFetching(true)
      const currentLastId = isNewSearch ? null : lastId

      try {
        const payload = {
          token, // Required for storeGuard -> req.storeId
          lastId: currentLastId,
          query: query.trim(),
          date: filterDate,
          limit: 15,
          params: {
            lastId: currentLastId,
            query: query.trim(),
            date: filterDate,
            limit: 15,
          },
        }

        const response = await Axios.post(
          `${appState.backendURL}/all-stock-activity`,
          payload,
        )

        const incoming = Array.isArray(response.data) ? response.data : []

        if (incoming.length > 0) {
          setActivities(prev => {
            if (isNewSearch) return incoming
            const existingIds = new Set(prev.map(a => a._id))
            const unique = incoming.filter(a => !existingIds.has(a._id))
            return [...prev, ...unique]
          })
          setLastId(incoming[incoming.length - 1]._id)
          setHasMore(incoming.length === 15)
        } else {
          if (isNewSearch) setActivities([])
          setHasMore(false)
        }
      } catch (e) {
        console.error("Stock matrix fetch network error:", e)
        setHasMore(false)
      } finally {
        setIsFetching(false)
      }
    },
    [
      appState.backendURL,
      appState.user?.token,
      query,
      filterDate,
      lastId,
      hasMore,
      isFetching,
    ],
  )

  // Search Debounce (350ms) & Filter Watcher
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActivities([])
      setLastId(null)
      setHasMore(true)
      fetchStockHistory(true)
    }, 350)
    return () => clearTimeout(delayDebounceFn)
  }, [query, filterDate, refreshSignal])

  // Infinite Scroll Observer
  useEffect(() => {
    if (!hasMore || isFetching || !sentinelRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          fetchStockHistory(false)
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [lastId, hasMore, isFetching, fetchStockHistory])

  // Operation Type Visual Mapper
  const renderBadge = type => {
    const t = (type || "").toUpperCase()

    if (t === "ARRIVAL" || t === "RESTOCK") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowDownLeft size={11} /> Inflow
        </span>
      )
    }

    if (t === "TRANSFER") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          <ArrowRightLeft size={11} /> Transfer
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
        <ArrowUpRight size={11} /> Sale Outflow
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Filter, Search & Date Picker Header Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Product name, Operator, Invoice..."
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          {/* Calendar Filter Field */}
          <div className="relative flex items-center bg-gray-50 border border-transparent rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:border-indigo-500 transition-all shadow-sm">
            <Calendar size={14} className="text-gray-400 mr-2" />
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="ml-2 text-gray-400 hover:text-gray-600 transition"
                title="Clear date filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              appDispatch({ type: "openArrivalModal" })
              appDispatch({ type: "openReceiveStockModal" })
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md active:scale-95"
          >
            <PackagePlus size={16} />
            Receive Stock
          </button>
        </div>
      </div>

      {/* 2. Stock Ledger Table Frame */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px] relative">
        {/* Loading Overlay */}
        {isFetching && activities.length === 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Filtering Interval Log Node...
            </p>
          </div>
        )}

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Product Ledger Name
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Operation Type
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Location Context
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">
                  Volume Altered
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right">
                  Operator
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activities.map(act => {
                const vol = act.quantity ?? act.bulkQuantity ?? act.change ?? 0
                const isPositive = Number(vol) > 0

                return (
                  <motion.tr
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={act._id}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg transition-all shadow-sm ${
                            act.type === "TRANSFER"
                              ? "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white"
                              : isPositive
                                ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                                : "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
                          }`}
                        >
                          {act.type === "TRANSFER" ? (
                            <ArrowRightLeft size={16} />
                          ) : (
                            <PlusCircle size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                            {act.productName ||
                              act.productDetails?.name ||
                              "Stock Asset Line"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(
                              act.timestamp || act.createdAt || Date.now(),
                            ).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">{renderBadge(act.type)}</td>

                    <td className="px-6 py-4 text-sm text-gray-600 font-medium max-w-xs truncate">
                      {act.storeName ||
                        act.locationName ||
                        "Main Counter / Warehouse"}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 font-mono">
                        {isPositive ? `+${vol}` : vol}
                        <span className="text-[9px] text-gray-400 ml-1 font-sans normal-case font-bold">
                          {act.unitType || "Units"}
                        </span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-xs font-black uppercase tracking-tight text-gray-500">
                      {act.performedBy || act.staffName || "Staff"}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 3. Infinite Scroll Sentinel */}
        {hasMore ? (
          <div
            ref={sentinelRef}
            className="px-6 py-10 bg-gray-50/30 border-t border-gray-100 flex flex-col items-center justify-center min-h-[80px]"
          >
            <div className="flex items-center gap-3 text-indigo-600">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Aggregating Inventory Logs...
              </span>
            </div>
          </div>
        ) : activities.length > 0 ? (
          <div className="px-6 py-10 bg-gray-50/30 border-t border-gray-100 flex items-center justify-center gap-4 opacity-40 select-none">
            <div className="h-px w-12 bg-gray-300" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Complete Inventory Audit Trail Loaded
            </p>
            <div className="h-px w-12 bg-gray-300" />
          </div>
        ) : !isFetching ? (
          <div className="text-center opacity-40 py-12 border-t border-gray-100">
            <FileText size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-xs font-medium italic text-gray-500">
              No ledger alterations match criteria
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
