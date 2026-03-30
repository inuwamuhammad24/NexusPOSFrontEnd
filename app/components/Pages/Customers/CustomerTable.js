import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Phone,
  Mail,
  ExternalLink,
  MoreHorizontal,
  User,
  TrendingUp,
  Search,
} from "lucide-react"
import CustomerProfile from "./CustomerProfile"

export default function CustomerTable({ searchQuery = "" }) {
  // 1. State Management
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // 2. Mock Data - This will be fetched from your MongoDB 'Customers' collection
  const customers = [
    {
      id: "CUST-001",
      name: "Alex Rivera",
      email: "alex.rivera@gmail.com",
      phone: "+234 803 123 4567",
      spent: 1450.0,
      visits: 24,
      lastVisit: "2 hours ago",
      joinDate: "Jan 12, 2026",
    },
    {
      id: "CUST-002",
      name: "Sarah Chen",
      email: "sarah.c@outlook.com",
      phone: "+234 810 987 6543",
      spent: 890.5,
      visits: 12,
      lastVisit: "Yesterday",
      joinDate: "Feb 05, 2026",
    },
    {
      id: "CUST-003",
      name: "Michael Obi",
      email: "m.obi@yahoo.com",
      phone: "+234 706 456 7890",
      spent: 3200.75,
      visits: 56,
      lastVisit: "5 mins ago",
      joinDate: "Nov 20, 2025",
    },
  ]

  // 3. Filtering Logic
  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // 4. Action Handlers
  const openProfile = customer => {
    setSelectedCustomer(customer)
    setIsProfileOpen(true)
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Customer Name
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Contact Info
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Orders
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                LTV (Total Spent)
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <AnimatePresence mode="popLayout">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    key={customer.id}
                    onClick={() => openProfile(customer)}
                    className="group hover:bg-blue-50/40 cursor-pointer transition-all duration-200"
                  >
                    {/* Identity Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-none">
                            {customer.name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1.5 font-medium italic">
                            Active: {customer.lastVisit}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Mail size={12} className="text-blue-400" />{" "}
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Phone size={12} className="text-blue-400" />{" "}
                          {customer.phone}
                        </div>
                      </div>
                    </td>

                    {/* Order Count Column */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black">
                        {customer.visits}
                      </span>
                    </td>

                    {/* Spent (LTV) Column */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-blue-600">
                          <TrendingUp size={14} strokeWidth={3} />
                          <p className="text-sm font-black">
                            ${customer.spent.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold text-gray-300 uppercase mt-0.5 tracking-tighter">
                          Lifetime Value
                        </span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition shadow-sm opacity-0 group-hover:opacity-100"
                          onClick={e => {
                            e.stopPropagation() // Prevent row click from triggering twice
                            openProfile(customer)
                          }}
                        >
                          <ExternalLink size={18} />
                        </button>
                        <div className="group-hover:hidden">
                          <MoreHorizontal size={18} className="text-gray-300" />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <p className="text-gray-400 italic text-sm">
                      No customers found matching your search.
                    </p>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* --- RENDER THE PROFILE MODAL --- */}
      <CustomerProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  )
}
