import React, { useState, useContext } from "react"
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

import SalesModal from "../Sales/SalesModal"
import AddProductModal from "../Inventory/AddProductModal"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import ThermalReceipt from "../Sales/ThermalReceipt"

export default function Dashboard() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  return (
    <>
      {/* Modals */}
      {appState.isSalesModalOpen && <SalesModal />}
      {appState.isReceiptOpen && <ThermalReceipt />}
      <div className="space-y-8">
        {/* 1. Page Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome Back, Admin
            </h1>
            <p className="text-gray-500 text-sm">
              Here is what's happening with your store today.
            </p>
          </div>
          <button
            onClick={() => appDispatch({ type: "openSalesModal" })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:cursor-pointer transition"
          >
            <ShoppingCart size={16} />
            New Sale
          </button>
        </div>

        {/* 2. Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value="N12,840.50"
            change="+12.5%"
            isUp={true}
            icon={<TrendingUp className="text-blue-600" />}
          />
          <StatCard
            title="Products Sold"
            value="432"
            change="+3.2%"
            isUp={true}
            icon={<ShoppingCart className="text-emerald-600" />}
          />
          <StatCard
            title="Shelf Stock"
            value="1,205"
            change="-2.1%"
            isUp={false}
            icon={<Package className="text-purple-600" />}
          />
          <StatCard
            title="Low Stock Alerts"
            value="8 Items"
            change="Critical"
            isUp={false}
            icon={<AlertTriangle className="text-red-500" />}
            isAlert
          />
        </div>

        {/* 3. Main Dashboard Content (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sales Table - Spans 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">
                Recent Transactions
              </h3>
              <button className="text-blue-600 text-sm font-semibold hover:underline">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <TransactionRow
                    name="Alex Rivera"
                    items="3 items"
                    total="$45.00"
                    status="Completed"
                  />
                  <TransactionRow
                    name="Sarah Chen"
                    items="1 item"
                    total="$12.50"
                    status="Completed"
                  />
                  <TransactionRow
                    name="Mike Johnson"
                    items="5 items"
                    total="$102.00"
                    status="Pending"
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stock Actions - Spans 1 column */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-6">
              Stock Quick-Actions
            </h3>
            <div className="space-y-4">
              <StockAction
                label="Restock Milk 1L"
                location="Aisle 4"
                current="2 left"
              />
              <StockAction
                label="Move Bread to Shelf"
                location="Storage B"
                current="15 avail"
              />
              <StockAction
                label="Price Update: Eggs"
                location="Dairy"
                current="$3.50 -> $3.75"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// --- Helper Components ---

function StatCard({ title, value, change, isUp, icon, isAlert }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
            isAlert
              ? "bg-red-50 text-red-600"
              : isUp
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
          }`}
        >
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </span>
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3>
    </div>
  )
}

function TransactionRow({ name, items, total, status }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-4 font-semibold text-gray-800">{name}</td>
      <td className="py-4 text-gray-500 text-sm">{items}</td>
      <td className="py-4 font-bold text-gray-800">{total}</td>
      <td className="py-4 text-xs font-bold uppercase">
        <span
          className={
            status === "Completed" ? "text-emerald-500" : "text-orange-400"
          }
        >
          {status}
        </span>
      </td>
    </tr>
  )
}

function StockAction({ label, location, current }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition">
      <p className="text-sm font-bold text-gray-800">{label}</p>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{location}</span>
        <span className="text-xs font-bold text-blue-600">{current}</span>
      </div>
    </div>
  )
}
