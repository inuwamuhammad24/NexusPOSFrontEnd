import React, { useEffect, useState, useRef, useContext } from "react"
import {
  FileText,
  Printer,
  Search,
  Calendar,
  Filter,
  ShoppingCart,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Axios from "axios"
import SalesModal from "./SalesModal"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import formatNaira from "../../Reusables/NairaFormatter"

export default function SalesTable() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // --- STATE MANAGEMENT ---
  const [sales, setSales] = useState([])
  const [query, setQuery] = useState("")
  const [lastId, setLastId] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  const sentinelRef = useRef(null)

  // --- LOGIC: FETCH DATA ---
  const fetchSales = async (isNewSearch = false) => {
    if (isFetching || (!hasMore && !isNewSearch)) return
    setIsFetching(true)

    const currentLastId = isNewSearch ? null : lastId

    try {
      const response = await Axios.post(`${appState.backendURL}/all-sales`, {
        params: {
          lastId: currentLastId,
          query: query,
          limit: 15,
        },
      })
      console.log(response.data)
      if (response.data && response.data.length > 0) {
        setSales(prev =>
          isNewSearch ? response.data : [...prev, ...response.data],
        )
        setLastId(response.data[response.data.length - 1]._id)
        setHasMore(response.data.length === 15)
      } else {
        if (isNewSearch) setSales([])
        setHasMore(false)
      }
    } catch (e) {
      console.error("Fetch error:", e)
      setHasMore(false)
    } finally {
      setIsFetching(false)
    }
  }

  // --- LOGIC: SEARCH DEBOUNCE ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSales(true)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [query])

  // --- LOGIC: INFINITE SCROLL OBSERVER ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          fetchSales()
        }
      },
      { threshold: 0.1 },
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [lastId, hasMore, isFetching])

  // --- LOGIC: REPRINT ---
  const handleReprint = sale => {
    appDispatch({ type: "openReceipt", id: sale._id })
  }

  return (
    <div className="space-y-6">
      {/* 1. Filter & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Invoice ID or Customer..."
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

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <Calendar size={16} />
            Today
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={() => appDispatch({ type: "openSalesModal" })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95"
          >
            <ShoppingCart size={16} />
            New Sale
          </button>
        </div>
      </div>

      {/* 2. Professional Sales Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Invoice
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Customer
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Method
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Amount
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((sale, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={sale._id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {sale.invoiceId}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium italic">
                          {new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {sale.customerName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        sale.paymentMethod === "Cash"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {sale.paymentMethod || "Cash"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format(sale.total)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleReprint(sale)}
                        title="Print Receipt"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition border border-transparent hover:border-blue-100"
                      >
                        <Printer size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-800 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-100">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. SEEKER SENTINEL (The "Natural" Pagination) */}
        <div
          ref={sentinelRef}
          className="px-6 py-10 bg-gray-50/30 border-t border-gray-100 flex flex-col items-center justify-center min-h-[80px]"
        >
          {isFetching ? (
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Loading...
              </span>
            </div>
          ) : sales.length > 0 && !hasMore ? (
            <div className="flex items-center gap-4 opacity-30">
              <div className="h-px w-12 bg-gray-300"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                Complete History Loaded
              </p>
              <div className="h-px w-12 bg-gray-300"></div>
            </div>
          ) : sales.length === 0 && !isFetching ? (
            <div className="text-center opacity-40">
              <FileText size={32} className="mx-auto mb-2" />
              <p className="text-xs font-medium italic">
                No transactions match your search
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modals */}
      {appState.isSalesModalOpen && <SalesModal />}
    </div>
  )
}
