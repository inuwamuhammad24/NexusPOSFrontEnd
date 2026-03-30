import React from "react"
import { motion } from "framer-motion"
import { MoreVertical, Shield, Mail, Key } from "lucide-react"

export default function StaffTable({ searchQuery }) {
  const staffMembers = [
    {
      id: 1,
      name: "John Doe",
      email: "john@store.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@store.com",
      role: "Cashier",
      status: "Active",
    },
    {
      id: 3,
      name: "Robert Fox",
      email: "fox@store.com",
      role: "Storekeeper",
      status: "Away",
    },
  ]

  const getRoleColor = role => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-600 border-purple-200"
      case "Cashier":
        return "bg-blue-100 text-blue-600 border-blue-200"
      case "Storekeeper":
        return "bg-orange-100 text-orange-600 border-orange-200"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-50">
          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Employee
          </th>
          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Access Role
          </th>
          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Account Status
          </th>
          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {staffMembers.map((member, idx) => (
          <motion.tr
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="hover:bg-gray-50/50 transition-colors group"
          >
            <td className="px-8 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {member.name}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Mail size={10} /> {member.email}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-8 py-4">
              <span
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getRoleColor(member.role)}`}
              >
                {member.role}
              </span>
            </td>
            <td className="px-8 py-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${member.status === "Active" ? "bg-emerald-500" : "bg-gray-300"}`}
                />
                <span className="text-xs font-medium text-gray-600">
                  {member.status}
                </span>
              </div>
            </td>
            <td className="px-8 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button
                  title="Reset Password"
                  className="p-2 text-gray-400 hover:text-blue-600 transition"
                >
                  <Key size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-800 transition">
                  <MoreVertical size={18} />
                </button>
              </div>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  )
}
