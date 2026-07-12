import React, { useState, useEffect } from "react"
import { X, Users, Loader2, Search } from "lucide-react"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

export default function CustomerStatsModal({ isOpen, onClose, backendURL }) {
  const [dates, setDates] = useState({ start: "", end: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])

  useEffect(() => {
    if (isOpen) {
      async function fetchRecentAccounts() {
        try {
          const response = await Axios.get(
            `${backendURL}/stats/customers/recent`,
          )
          setRecentLogs(response.data || [])
        } catch (err) {
          console.error("Failed loading baseline ledger allocations:", err)
        }
      }
      fetchRecentAccounts()
    }
  }, [isOpen, backendURL])

  if (!isOpen) return null

  const handleFetch = async e => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await Axios.post(`${backendURL}/stats/customers`, dates)
      setData(response.data)
    } catch (err) {
      console.error("Customer profiling analytics breakdown fail:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-600" />
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
              Client Ledger Analytics
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
                  Start Interval
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
                  End Interval
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Search size={14} />
              )}{" "}
              Analyze Account Metrics
            </button>
          </form>

          {data ? (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  New Registrations
                </p>
                <p className="text-sm font-black text-emerald-900">
                  {data.newAccounts} Accounts
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Credit Balances Extended
                </p>
                <p className="text-sm font-black text-emerald-900">
                  {formatNaira(data.totalCreditIssued)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Recent Customer Actions
              </h4>
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 flex justify-between items-center text-xs hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-gray-800 uppercase">
                          {log.fullName}
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium">
                          {log.phone || "No Contact Link"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-gray-500">
                        Credit Bal: {formatNaira(log.creditBalance)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-400 italic text-xs">
                    No retail ledger activities recorded.
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
