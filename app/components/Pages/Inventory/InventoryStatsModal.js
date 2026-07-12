import React, { useState, useEffect } from "react"
import { X, Package, Loader2, RefreshCw } from "lucide-react"
import Axios from "axios"

export default function InventoryStatsModal({ isOpen, onClose, backendURL }) {
  const [dates, setDates] = useState({ start: "", end: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])

  useEffect(() => {
    if (isOpen) {
      async function fetchRecentMovements() {
        try {
          const response = await Axios.get(
            `${backendURL}/stats/inventory/recent`,
          )
          setRecentLogs(response.data || [])
        } catch (err) {
          console.error("Failed loading baseline inventory stream:", err)
        }
      }
      fetchRecentMovements()
    }
  }, [isOpen, backendURL])

  if (!isOpen) return null

  const handleFetch = async e => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await Axios.post(`${backendURL}/stats/inventory`, dates)
      setData(response.data)
    } catch (err) {
      console.error("Inventory statistics engine fail:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-blue-600" />
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
              Stock Movement Audit
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
                  Audit Start
                </label>
                <input
                  required
                  type="date"
                  value={dates.start}
                  onChange={e => setDates({ ...dates, start: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                  Audit End
                </label>
                <input
                  required
                  type="date"
                  value={dates.end}
                  onChange={e => setDates({ ...dates, end: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <RefreshCw size={14} />
              )}{" "}
              Process Stock Interval
            </button>
          </form>

          {data ? (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Arrival Units
                </p>
                <p className="text-sm font-black text-blue-900">
                  {data.totalArrivals.toLocaleString()} Total
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Store Relocations
                </p>
                <p className="text-sm font-black text-blue-900">
                  {data.totalTransfers} Operations
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Recent Inventory Operations
              </h4>
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 flex justify-between items-center text-xs hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-gray-800 uppercase tracking-tight">
                          {log.productName || "Product Asset"}
                        </p>
                        <p className="text-[9px] font-medium text-gray-400">
                          Node Destination: {log.storeName || "Main Warehouse"}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${log.type === "TRANSFER" ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}
                      >
                        {log.quantity} {log.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-400 italic text-xs">
                    No systemic stock adjustments found.
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
