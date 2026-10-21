import React, { useState, useEffect, useContext } from "react"
import {
  X,
  Calendar,
  Loader2,
  BarChart3,
  TrendingUp,
  RotateCcw,
  ArrowRight,
} from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import formatNaira from "../../Reusables/NairaFormatter"

export default function SalesStatsModal({ isOpen, onClose, backendURL }) {
  const appState = useContext(StateContext)

  const [dates, setDates] = useState({ start: "", end: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [isFetchingRecent, setIsFetchingRecent] = useState(false)

  // Fetch recent scoped sales activity on open
  useEffect(() => {
    if (isOpen && appState.user?.token) {
      async function fetchRecentSales() {
        setIsFetchingRecent(true)
        try {
          const response = await Axios.post(
            `${backendURL}/stats/sales/recent`,
            {
              token: appState.user.token, // Required by storeGuard
            },
          )
          setRecentLogs(Array.isArray(response.data) ? response.data : [])
        } catch (err) {
          console.error("Failed loading baseline recent sales:", err)
        } finally {
          setIsFetchingRecent(false)
        }
      }
      fetchRecentSales()
    }
  }, [isOpen, backendURL, appState.user?.token])

  if (!isOpen) return null

  const handleFetch = async e => {
    e.preventDefault()
    if (!dates.start || !dates.end) return

    setIsLoading(true)
    try {
      const response = await Axios.post(`${backendURL}/stats/sales`, {
        token: appState.user.token, // Injected for storeGuard -> req.storeId
        start: dates.start,
        end: dates.end,
      })
      setData(response.data)
    } catch (err) {
      console.error("Sales interval evaluation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetInterval = () => {
    setData(null)
    setDates({ start: "", end: "" })
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm antialiased">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Sales Interval Audit
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                Tenant-scoped revenue analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* DATE RANGE FILTER FORM */}
          <form onSubmit={handleFetch} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-1">
                  Start Interval
                </label>
                <input
                  required
                  type="date"
                  value={dates.start}
                  onChange={e => setDates({ ...dates, start: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-1">
                  End Interval
                </label>
                <input
                  required
                  type="date"
                  value={dates.end}
                  onChange={e => setDates({ ...dates, end: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:bg-gray-200 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Computing Metrics...</span>
                </>
              ) : (
                <>
                  <BarChart3 size={14} />
                  <span>Aggregate Custom Date Range</span>
                </>
              )}
            </button>
          </form>

          {/* AGGREGATED METRICS OR RECENT LOGS */}
          {data ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Interval Computed Output
                </span>
                <button
                  type="button"
                  onClick={handleResetInterval}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Show Live Recent
                </button>
              </div>

              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-900/60 uppercase tracking-wider mb-1">
                    Gross Revenue
                  </p>
                  <p className="text-xl font-black text-indigo-950 tracking-tight">
                    {formatNaira(data.totalRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-indigo-900/60 uppercase tracking-wider mb-1">
                    Invoices Settled
                  </p>
                  <p className="text-xl font-black text-indigo-950 tracking-tight">
                    {data.invoiceCount.toLocaleString()} Invoices
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Last Live Receipts
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Realtime Stream
                </span>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden bg-white">
                {isFetchingRecent ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-indigo-600 text-xs font-semibold">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading recent logs...</span>
                  </div>
                ) : recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <div
                      key={log._id || index}
                      className="p-3.5 flex justify-between items-center text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">
                          {log.invoiceId}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                          {log.customerName || "Walk-in"} •{" "}
                          {new Date(log.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 block">
                          {formatNaira(log.total)}
                        </span>
                        <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                          {log.paymentMethod || "Cash"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-8 text-center text-gray-400 italic text-xs">
                    No transactions recorded for this store yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
