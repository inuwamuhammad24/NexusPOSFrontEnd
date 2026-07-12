import React, { useState, useEffect } from "react"
import { X, Calendar, Loader2, BarChart3, TrendingUp } from "lucide-react"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

export default function SalesStatsModal({ isOpen, onClose, backendURL }) {
  const [dates, setDates] = useState({ start: "", end: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])

  // Fetch recent log activity when modal initializes
  useEffect(() => {
    if (isOpen) {
      async function fetchRecentSales() {
        try {
          const response = await Axios.get(`${backendURL}/stats/sales/recent`)
          setRecentLogs(response.data || [])
        } catch (err) {
          console.error("Failed loading baseline recent sales stream:", err)
        }
      }
      fetchRecentSales()
    }
  }, [isOpen, backendURL])

  if (!isOpen) return null

  const handleFetch = async e => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await Axios.post(`${backendURL}/stats/sales`, dates)
      setData(response.data)
    } catch (err) {
      console.error("Sales statistics aggregation matrix error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-600" />
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
              Sales Metrics Hub
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          <form onSubmit={handleFetch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                  Start Date
                </label>
                <input
                  required
                  type="date"
                  value={dates.start}
                  onChange={e => setDates({ ...dates, start: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                  End Date
                </label>
                <input
                  required
                  type="date"
                  value={dates.end}
                  onChange={e => setDates({ ...dates, end: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <BarChart3 size={14} />
              )}{" "}
              Aggregate Custom Date Range
            </button>
          </form>

          {data ? (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Interval Revenue
                </p>
                <p className="text-sm font-black text-indigo-900">
                  {formatNaira(data.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Invoices Liquidated
                </p>
                <p className="text-sm font-black text-indigo-900">
                  {data.invoiceCount} Orders
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Last Live Activities
              </h4>
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 flex justify-between items-center text-xs hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {log.invoiceId}
                        </p>
                        <p className="text-[9px] font-medium text-gray-400">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-black text-gray-900">
                        {formatNaira(log.total)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-400 italic text-xs">
                    No execution trail records verified.
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
