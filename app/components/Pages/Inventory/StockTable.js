import React, { useEffect, useState, useRef, useContext } from "react"
import {
  FileText,
  Search,
  Calendar,
  Filter,
  PackagePlus,
  Loader2,
  X,
  ArrowRightLeft,
  PlusCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function StockTable() {
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
  const fetchStockHistory = async (isNewSearch = false) => {
    // Prevent overlapping network queries
    if (isFetching && !isNewSearch) return
    setIsFetching(true)

    const currentLastId = isNewSearch ? null : lastId

    try {
      const response = await Axios.post(
        `${appState.backendURL}/all-stock-activity`,
        {
          params: {
            lastId: currentLastId,
            query: query,
            date: filterDate,
            limit: 15,
          },
        },
      )

      if (response.data && response.data.length > 0) {
        setActivities(prev =>
          isNewSearch ? response.data : [...prev, ...response.data],
        )
        setLastId(response.data[response.data.length - 1]._id)
        setHasMore(response.data.length === 15)
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
  }

  // --- LOGIC: SEARCH DEBOUNCE (500MS) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStockHistory(true)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [query])

  // --- CRITICAL FIX: INSTANT LOADER FOR DATE FILTER ---
  useEffect(() => {
    // 1. Instantly trip the loader thread to true before async execution hits the engine
    setIsFetching(true)

    // 2. Wipe the previous collection view states so old logs don't hang around
    setActivities([])
    setLastId(null)
    setHasMore(true)

    // 3. Ignite the new ledger tracking run
    fetchStockHistory(true)
  }, [filterDate])

  // --- LOGIC: INFINITE SCROLL OBSERVER ---
  useEffect(() => {
    if (!hasMore || isFetching || !sentinelRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          fetchStockHistory()
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [lastId, hasMore, isFetching, activities.length])

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
            placeholder="Search Product name, Operator..."
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
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
          {/* CALENDAR FILTER FIELD */}
          <div className="relative flex items-center bg-gray-50 border border-transparent rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:border-blue-500 transition-all shadow-sm">
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

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={() => appDispatch({ type: "openReceiveStockModal" })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95"
          >
            <PackagePlus size={16} />
            Receive Stock
          </button>
        </div>
      </div>

      {/* 2. Professional Stock Ledger Table Frame */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px] relative">
        {/* --- EXPLICIT SYSTEM LEVEL SCREEN LOADER BLANKET --- */}
        {/* Shows an elegant loading overlay if fetching and there are no current activities to display */}
        {isFetching && activities.length === 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 animate-fade-in">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
              {activities.map(act => (
                <motion.tr
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={act._id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-all shadow-sm ${act.type === "TRANSFER" ? "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"}`}
                      >
                        {act.type === "TRANSFER" ? (
                          <ArrowRightLeft size={16} />
                        ) : (
                          <PlusCircle size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                          {act.productName || "Unknown Asset"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium italic">
                          {new Date(act.timestamp).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        act.type === "TRANSFER"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {act.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium max-w-xs truncate">
                    {act.storeName || "Main Node Warehouse"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 font-mono">
                      {act.quantity > 0 ? `+${act.quantity}` : act.quantity}
                      <span className="text-[9px] text-gray-400 ml-1 font-sans normal-case font-bold">
                        {act.unitType}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-black uppercase tracking-tight text-gray-500">
                    {act.performedBy || "System_Core"}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. SEEKER SENTINEL PAGINATION WRAPPER */}
        {hasMore ? (
          <div
            ref={sentinelRef}
            className="px-6 py-10 bg-gray-50/30 border-t border-gray-100 flex flex-col items-center justify-center min-h-[80px]"
          >
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Aggregating Inventory Logs...
              </span>
            </div>
          </div>
        ) : activities.length > 0 ? (
          <div className="px-6 py-10 bg-gray-50/30 border-t border-gray-100 flex items-center justify-center gap-4 opacity-30 select-none">
            <div className="h-px w-12 bg-gray-300"></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Complete Inventory Audit Trail Loaded
            </p>
            <div className="h-px w-12 bg-gray-300"></div>
          </div>
        ) : (
          /* Show this cleanly once filtering completely resolves with zero records found */
          !isFetching && (
            <div className="text-center opacity-40 py-12 border-t border-gray-100">
              <FileText size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-xs font-medium italic text-gray-500">
                No ledger alterations match criteria
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
