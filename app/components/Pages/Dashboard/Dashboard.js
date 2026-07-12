import React, { useEffect, useState, useContext } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
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
  Building2,
  Calendar,
  LineChart,
  Cpu,
  Users,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react"
import StateContext from "../../../StateContext"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

// Import Modals Layout Matrix
import SalesStatsModal from "../Sales/SalesStatsModal"
import InventoryStatsModal from "../Inventory/InventoryStatsModal"
import CustomerStatsModal from "../Customers/CustomersStatsModal"
import OperationalStatsModal from "./OperaationalStatsModal"

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
  const [company, setCompany] = useState({
    companyName: "Enterprise Terminal",
    tin: "N/A",
    address: "Loading Global Configuration Node...",
  })
  const [isLoading, setIsLoading] = useState(true)

  // --- MODALS TOGGLE STATE ENGINE ---
  const [activeModal, setActiveModal] = useState(null) // "sales" | "inventory" | "customers" | "operational"

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [pulseRes, configRes] = await Promise.all([
          Axios.get(`${appState.backendURL}/dashboard/pulse`),
          Axios.get(`${appState.backendURL}/get-company-config`).catch(() => ({
            data: null,
          })),
        ])

        setPulse(pulseRes.data)
        if (configRes?.data) setCompany(configRes.data)
        setIsLoading(false)
      } catch (e) {
        console.error("Dashboard synchronization error:", e)
      }
    }
    fetchDashboardData()
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

  const chartSalesData = [...pulse.sales].reverse()
  const maxSale = Math.max(...chartSalesData.map(s => s.total || 1), 1)
  const minSale = Math.min(...chartSalesData.map(s => s.total || 0), 0)

  const svgWidth = 500
  const svgHeight = 120
  const padding = 15

  const coordinatePoints = chartSalesData.map((sale, idx) => {
    const totalItems = chartSalesData.length
    const x =
      totalItems > 1
        ? padding + (idx * (svgWidth - padding * 2)) / (totalItems - 1)
        : svgWidth / 2
    const yRange = maxSale - minSale
    const y =
      yRange > 0
        ? svgHeight -
          padding -
          ((sale.total - minSale) * (svgHeight - padding * 2)) / yRange
        : svgHeight / 2
    return { x, y, sale }
  })

  const linePathDefinition = coordinatePoints.reduce((path, point, idx) => {
    return idx === 0
      ? `M ${point.x} ${point.y}`
      : `${path} L ${point.x} ${point.y}`
  }, "")

  const areaPathDefinition =
    coordinatePoints.length > 0
      ? `${linePathDefinition} L ${coordinatePoints[coordinatePoints.length - 1].x} ${svgHeight} L ${coordinatePoints[0].x} ${svgHeight} Z`
      : ""

  const activeRole = localStorage.getItem("role")

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen flex flex-col justify-between space-y-6 font-sans">
      {/* Dynamic Modal Components Injection Layer */}
      <SalesStatsModal
        isOpen={activeModal === "sales"}
        onClose={() => setActiveModal(null)}
        backendURL={appState.backendURL}
      />
      <InventoryStatsModal
        isOpen={activeModal === "inventory"}
        onClose={() => setActiveModal(null)}
        backendURL={appState.backendURL}
      />
      <CustomerStatsModal
        isOpen={activeModal === "customers"}
        onClose={() => setActiveModal(null)}
        backendURL={appState.backendURL}
      />
      <OperationalStatsModal
        isOpen={activeModal === "operational"}
        onClose={() => setActiveModal(null)}
        backendURL={appState.backendURL}
      />

      <div className="space-y-6 flex-1">
        {/* --- CORPORATE METADATA BANNER --- */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">
                {company.companyName}
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                TIN: {company.tin} •{" "}
                <span className="italic font-medium text-gray-300">
                  {company.address}
                </span>
              </p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2 self-stretch md:self-auto justify-center">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>

        {/* --- 1. KEY PERFORMANCE INDICATORS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Today's Revenue"
            value={formatNaira(pulse.revenue)}
            subValue={`${pulse.salesCount} Completed Invoices`}
            icon={<ShoppingCart size={20} />}
            color="indigo"
          />
          {(activeRole === "Admin" || activeRole === "Manager") && (
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
          )}
          <StatCard
            label="Top Velocity"
            value={pulse.topProducts[0]?.name || "None"}
            subValue={`${pulse.topProducts[0]?.totalQty || 0} units moved`}
            icon={<Activity size={20} />}
            color="amber"
          />
        </div>

        {/* --- 2. EXECUTIVE REPORT CONTROL HUB PANEL --- */}
        {(activeRole === "Admin" || activeRole === "Manager") && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-gray-400" />
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Executive Interval Audits
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveModal("sales")}
                className="p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 rounded-2xl flex flex-col items-start gap-2 text-left transition-all active:scale-[0.98]"
              >
                <TrendingUp size={18} className="text-indigo-600" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">
                  Sales Analytics
                </span>
              </button>
              <button
                onClick={() => setActiveModal("inventory")}
                className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 rounded-2xl flex flex-col items-start gap-2 text-left transition-all active:scale-[0.98]"
              >
                <Package size={18} className="text-blue-600" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">
                  Stock Valuations
                </span>
              </button>
              <button
                onClick={() => setActiveModal("customers")}
                className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/50 rounded-2xl flex flex-col items-start gap-2 text-left transition-all active:scale-[0.98]"
              >
                <Users size={18} className="text-emerald-600" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">
                  Customer Credit
                </span>
              </button>
              <button
                onClick={() => setActiveModal("operational")}
                className="p-4 bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 rounded-2xl flex flex-col items-start gap-2 text-left transition-all active:scale-[0.98]"
              >
                <ShieldAlert size={18} className="text-amber-600" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">
                  System Logs
                </span>
              </button>
            </div>
          </div>
        )}

        {/* --- 3. SVG VECTOR LINE CHART --- */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <LineChart size={14} className="text-indigo-500" /> Real-time
              Invoicing Velocity
            </h3>
            <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Dynamic Vector Path
            </span>
          </div>

          {chartSalesData.length > 0 ? (
            <div className="w-full relative pt-2">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-32 overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="rgb(79, 70, 229)"
                      stopOpacity="0.15"
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(79, 70, 229)"
                      stopOpacity="0.00"
                    />
                  </linearGradient>
                </defs>
                <line
                  x1="0"
                  y1={padding}
                  x2={svgWidth}
                  y2={padding}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1={svgHeight / 2}
                  x2={svgWidth}
                  y2={svgHeight / 2}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1={svgHeight - padding}
                  x2={svgWidth}
                  y2={svgHeight - padding}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {areaPathDefinition && (
                  <path d={areaPathDefinition} fill="url(#chartGradient)" />
                )}
                {linePathDefinition && (
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    d={linePathDefinition}
                    fill="none"
                    stroke="rgb(79, 70, 229)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {coordinatePoints.map((pt, index) => (
                  <circle
                    key={index}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    className="fill-white stroke-indigo-600 cursor-pointer"
                    strokeWidth="2"
                  />
                ))}
              </svg>

              <div className="flex justify-between text-[8px] font-black text-gray-400 mt-2 tracking-widest border-t border-gray-50 pt-2 px-1">
                <span>
                  {chartSalesData[0]?.invoiceId?.slice(-6) || "START"}
                </span>
                <span>MIDPOINT TRANSFERS</span>
                <span>
                  {chartSalesData[chartSalesData.length - 1]?.invoiceId?.slice(
                    -6,
                  ) || "LIVE"}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 flex items-center justify-center text-xs text-gray-400 italic">
              No live system invoicing data stream registered for this fiscal
              date node.
            </div>
          )}
        </div>

        {/* --- 4. DETAILS SECTION: RECENT ACTIVITY & SALES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* OPTIMIZED STOCK HISTORY BLOCK: CONVERTED TO FLEX-COL FOR BUTTON STANDARDIZATION */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
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
                            {act.packaging || "Units"}
                          </span>
                        </p>
                        <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">
                          {new Date(act.timestamp).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
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

            {/* AUDIT STOCK LEDGER FOOTER LINK */}
            <Link
              to="/stock-history"
              className="p-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-gray-50 hover:bg-indigo-100 transition-all w-full text-center border-t border-gray-100"
            >
              Audit Stock Ledger
            </Link>
          </div>

          {/* RECENT SALES FEED BLOCK */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-gray-50 bg-white">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-500" /> Recent
                  Sales
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
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
            </div>
            <Link
              to="/sales"
              className="p-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-gray-50 hover:bg-indigo-100 transition-all w-full text-center border-t border-gray-100"
            >
              Audit Full Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* --- BRAND SOFTWARE ATTRIBUTION FOOTER --- */}
      <footer className="pt-8 pb-2 flex items-center justify-center gap-1.5 select-none opacity-40 hover:opacity-75 transition-opacity duration-300 border-t border-gray-100/50">
        <Cpu size={11} className="text-indigo-600 animate-pulse" />
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
          Engineered by{" "}
          <span className="text-gray-700 font-extrabold font-mono">
            Nexus Point Innovation
          </span>
        </p>
      </footer>
    </div>
  )
}

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
    <div
      className={`absolute -right-4 -bottom-4 w-16 h-16 bg-${color}-50/40 rounded-full blur-2xl group-hover:bg-${color}-50/60 transition-all`}
    />
  </div>
)
