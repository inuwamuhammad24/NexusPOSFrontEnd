import React, { useState, useEffect } from "react"
import { X, ShieldAlert, Loader2, Eye } from "lucide-react"
import Axios from "axios"

export default function OperationalStatsModal({ isOpen, onClose, backendURL }) {
  const [dates, setDates] = useState({ start: "", end: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])

  useEffect(() => {
    if (isOpen) {
      async function fetchRecentOverrides() {
        try {
          const response = await Axios.get(
            `${backendURL}/stats/operational/recent`,
          )
          setRecentLogs(response.data || [])
        } catch (err) {
          console.error(
            "Failed loading baseline privilege overrides log stream:",
            err,
          )
        }
      }
      fetchRecentOverrides()
    }
  }, [isOpen, backendURL])

  if (!isOpen) return null

  const handleFetch = async e => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await Axios.post(
        `${backendURL}/stats/operational`,
        dates,
      )
      setData(response.data)
    } catch (err) {
      console.error("Operational logging analytics failed to parse:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-600" />
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
              System Security Audit
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
                  Window Open
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
                  Window Close
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
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Eye size={14} />
              )}{" "}
              Pull Security Exceptions
            </button>
          </form>

          {data ? (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Rate Multipliers Altered
                </p>
                <p className="text-sm font-black text-red-600">
                  {data.priceOverridesCount} Exceptions
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Wiped Invoice Ledgers
                </p>
                <p className="text-sm font-black text-gray-900">
                  {data.deletedInvoicesCount} Events
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Critical Privilege Overrides Logs
              </h4>
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 text-xs hover:bg-gray-50 transition-colors space-y-0.5"
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-gray-900 uppercase tracking-tight">
                          {log.action || "CRITICAL OVERRIDE"}
                        </span>
                        <span className="text-[9px] font-black text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded">
                          {log.operator}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                        <span>{log.description}</span>
                        <span>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-400 italic text-xs">
                    No critical structural overrides detected.
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
