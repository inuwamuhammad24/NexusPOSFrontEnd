import React, { useState } from "react"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  TrendingUp,
} from "lucide-react"
import CustomerTable from "./CustomerTable"
import AddCustomerModal from "./AddCustomerModal"

export default function CustomerPage() {
  // 1. State Management
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // 2. Mock Stats (In production, these would be calculated from your DB)
  const stats = [
    {
      label: "Total Customers",
      value: "1,204",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "New This Month",
      value: "+48",
      icon: UserPlus,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Avg. LTV",
      value: "$420.50",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
    },
  ]

  // 3. Handler for saving new customer
  const handleSaveCustomer = newCustomer => {
    console.log("Saving to MongoDB...", newCustomer)
    // Here you would typically trigger a re-fetch of your customer list
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
            Customer Management
          </h1>
          <p className="text-sm text-gray-500 font-medium italic">
            Manage relationships and track purchasing behavior.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <UserPlus size={18} />
            Add New Customer
          </button>
        </div>
      </div>

      {/* QUICK STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-2xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-xl font-black text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-white border border-gray-100 text-gray-400 rounded-xl hover:text-blue-600 transition">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* The Actual Table Component */}
        <div className="flex-1">
          <CustomerTable searchQuery={searchQuery} />
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  )
}
