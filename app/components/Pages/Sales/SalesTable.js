import React, { useContext, useState } from "react"
import {
  FileText,
  MoreVertical,
  ExternalLink,
  Printer,
  Search,
  Calendar,
  Filter,
  ShoppingCart,
} from "lucide-react"
import { motion } from "framer-motion"
import SmallLoading from "../../Reusables/SmallLoading"
import DispatchContext from "../../../DispatchContext"

export default function SalesTable() {
  // Mock data representing what will come from your MongoDB 'Sales' collection
  const appDispatch = useContext(DispatchContext)
  const [salesHistory] = useState([
    {
      id: "INV-8432",
      customer: "Walk-in",
      items: 4,
      total: 120.5,
      method: "Cash",
      time: "10:45 AM",
    },
    {
      id: "INV-8431",
      customer: "John Smith",
      items: 1,
      total: 15.0,
      method: "Card",
      time: "09:30 AM",
    },
    {
      id: "INV-8430",
      customer: "Walk-in",
      items: 12,
      total: 450.25,
      method: "Card",
      time: "08:15 AM",
    },
  ])

  // return <SmallLoading position={"relative"} border={"2px solid #155dfc"} />

  return (
    <div className="space-y-6">
      {/* 1. Filter & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search Invoice ID or Customer..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          />
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:cursor-pointer transition"
          >
            <ShoppingCart size={16} />
            New Sale
          </button>
        </div>
      </div>

      {/* 2. Professional Sales Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Invoice
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Customer
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Items
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Method
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Amount
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {salesHistory.map((sale, index) => (
              <motion.tr
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={sale.id}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {sale.id}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {sale.time}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  {sale.customer}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-center font-bold">
                  {sale.items}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      sale.method === "Cash"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {sale.method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-black text-gray-800">
                    ${sale.total.toFixed(2)}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      title="Print Receipt"
                      className="p-2 text-gray-400 hover:text-blue-600 transition hover:bg-white rounded-lg"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      title="View Details"
                      className="p-2 text-gray-400 hover:text-blue-600 transition hover:bg-white rounded-lg"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-800 transition hover:bg-white rounded-lg">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs font-medium text-gray-400">
            Showing 3 of 128 transactions
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              Prev
            </button>
            <button className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
