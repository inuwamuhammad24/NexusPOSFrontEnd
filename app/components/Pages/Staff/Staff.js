import React, { useState } from "react"
import { Users, UserPlus, ShieldCheck, ShieldAlert, Search } from "lucide-react"
import StaffTable from "./StaffTable"
import AddStaffModal from "./AddStaffModal"

export default function StaffPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
            Staff Management
          </h1>
          <p className="text-sm text-gray-500 font-medium italic">
            Control access levels and manage your team.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} />
          Add New Staff
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Total Team
            </p>
            <p className="text-xl font-black text-gray-800">12 Members</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Admins
            </p>
            <p className="text-xl font-black text-gray-800">2</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-orange-400">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Limited Access
            </p>
            <p className="text-xl font-black text-gray-800">10</p>
          </div>
        </div>
      </div>

      {/* SEARCH & TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search staff by name or role..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <StaffTable searchQuery={searchQuery} />
      </div>

      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}
