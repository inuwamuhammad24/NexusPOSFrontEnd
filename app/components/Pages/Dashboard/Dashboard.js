import React, { useEffect, useState, useContext } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  PlusCircle,
  ChevronRight,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import StateContext from "../../../StateContext"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

export default function Dashboard() {
  const appState = useContext(StateContext)
  const [pulse, setPulse] = useState({
    valuation: 0,
    units: 0,
    revenue: 0,
    salesCount: 0,
    activity: [],
    sales: [],
    topProducts: [],
    profit: 0,
    marginPercent: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPulse() {
      try {
        const response = await Axios.get(
          `${appState.backendURL}/dashboard/pulse`,
        )
        setPulse(response.data)
        setIsLoading(false)
      } catch (e) {
        console.error("Dashboard fetch error:", e)
      }
    }
    fetchPulse()
  }, [appState.backendURL])

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Synchronizing Pulse...
          </p>
        </div>
      </div>
    )

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen space-y-8">
      {/* 1. KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatNaira(pulse.revenue)}
          subValue={`${pulse.salesCount} Completed Invoices`}
          icon={<ShoppingCart size={20} />}
          color="indigo"
        />
        {localStorage.getItem("role") === "Admin" ||
        localStorage.getItem("role") === "Manager" ? (
          <>
            <StatCard
              label="Capital in Stock"
              value={formatNaira(pulse.valuation)}
              subValue={`${pulse.units.toLocaleString()} Total Units`}
              icon={<Package size={20} />}
              color="blue"
            />
            <StatCard
              label="Net Profit"
              value={formatNaira(pulse.profit)}
              subValue={`${pulse.marginPercent.toFixed(1)}% Daily Margin`}
              icon={<TrendingUp size={20} />}
              color="emerald"
              trend={pulse.profit > 0 ? "up" : "down"}
            />
          </>
        ) : (
          ""
        )}
        <StatCard
          label="Top Velocity"
          value={pulse.topProducts[0]?.name || "None"}
          subValue={`${pulse.topProducts[0]?.totalQty || 0} units moved`}
          icon={<Activity size={20} />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. RECENT INVENTORY ACTIVITY (Arrivals & Transfers) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-indigo-500" /> Stock
              Movement History
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pulse.activity.length > 0 ? (
              pulse.activity.map((act, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    <div
                      className={`p-2.5 rounded-xl ${act.type === "TRANSFER" ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}
                    >
                      {act.type === "TRANSFER" ? (
                        <ArrowRightLeft size={16} />
                      ) : (
                        <PlusCircle size={16} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800 uppercase tracking-tight">
                        {act.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${act.type === "TRANSFER" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}
                        >
                          {act.type}
                        </span>
                        <div className="flex items-center text-[10px] text-gray-500 font-bold">
                          {act.type === "TRANSFER" ? (
                            <>
                              <span className="text-gray-400 font-medium">
                                from
                              </span>
                              <span className="mx-1 text-gray-700">
                                {act.originStore?.name || "Main"}
                              </span>
                              <ChevronRight
                                size={10}
                                className="mx-0.5 text-gray-300"
                              />
                              <span className="text-indigo-600">
                                {act.destinationStore?.name}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-400 font-medium mr-1">
                                received at
                              </span>
                              <span className="text-indigo-600">
                                {act.destinationStore?.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900 leading-none">
                      {act.quantity}{" "}
                      <span className="text-[9px] text-gray-400 uppercase ml-0.5">
                        {`${act.packaging} ${act.unitType}${act.packaging > 2 ? "s" : ""}` ||
                          "Units"}
                      </span>
                    </p>
                    <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">
                      {new Date(act.timestamp).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400 italic text-xs">
                No stock movements found.
              </div>
            )}
          </div>
        </div>

        {/* 3. RECENT SALES FEED */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-50 bg-white">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-500" /> Recent Sales
            </h3>
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {pulse.sales.map((sale, index) => (
              <div
                key={index}
                className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-default"
              >
                <div>
                  <p className="text-xs font-bold text-gray-800 tracking-tight">
                    {sale.invoiceId}
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                    {sale.customerName || "Walk-in Customer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-gray-900">
                    {formatNaira(sale.total)}
                  </p>
                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {sale.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="p-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-gray-50 hover:bg-indigo-100 transition-all w-full text-center border-t border-gray-100">
            Audit Full Ledger
          </button>
        </div>
      </div>
    </div>
  )
}

/* REUSABLE UI COMPONENTS */
const StatCard = ({ label, value, subValue, icon, color, trend }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
    <div
      className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 w-fit transition-all group-hover:scale-110 duration-300`}
    >
      {icon}
    </div>
    <div className="z-10">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <h2 className="text-xl font-black text-gray-900 tracking-tight">
        {value}
      </h2>
      <div className="flex items-center gap-1 mt-1">
        {trend &&
          (trend === "up" ? (
            <ArrowUpRight size={12} className="text-emerald-500" />
          ) : (
            <ArrowDownRight size={12} className="text-rose-500" />
          ))}
        <p className="text-[10px] font-bold text-gray-400">{subValue}</p>
      </div>
    </div>
    {/* Decorative Visual Background */}
    <div
      className={`absolute -right-4 -bottom-4 w-16 h-16 bg-${color}-50/40 rounded-full blur-2xl group-hover:bg-${color}-50/60 transition-all`}
    />
  </div>
)
