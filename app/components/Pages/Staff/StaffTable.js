import React, { useContext, useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MoreVertical, Mail, Key, Loader2, UserX, Shield } from "lucide-react"
import DispatchContext from "../../../DispatchContext"
import Axios from "axios"
import StateContext from "../../../StateContext"

export default function StaffTable({ searchQuery = "" }) {
  const [isFetching, setIsFetching] = useState(true)
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  // Fetch staff data scoped to this merchant tenant
  useEffect(() => {
    let isMounted = true

    async function fetchStaff() {
      const token = appState.user?.token || localStorage.getItem("token")
      if (!token) {
        setIsFetching(false)
        return
      }

      setIsFetching(true)
      try {
        // Send token via POST so storeGuard extracts req.storeId
        const response = await Axios.post(
          `${appState.backendURL}/get-all-staff`,
          {
            token,
          },
        )

        if (isMounted) {
          appDispatch({
            type: "setStaff",
            payload: Array.isArray(response.data) ? response.data : [],
          })
        }
      } catch (err) {
        console.error("Staff fetch error:", err)
        if (isMounted) {
          appDispatch({
            type: "addFlashMessage",
            payload: {
              type: "error",
              msg:
                err.response?.data?.msg ||
                "There was a problem fetching staff records. Try again later.",
            },
          })
        }
      } finally {
        if (isMounted) {
          setIsFetching(false)
        }
      }
    }

    fetchStaff()
    return () => {
      isMounted = false
    }
  }, [appState.backendURL, appState.user?.token, appDispatch])

  // Filter staff based on searchQuery
  const staffList = useMemo(() => {
    const list = Array.isArray(appState.staff) ? appState.staff : []
    const q = (searchQuery || "").trim().toLowerCase()
    if (!q) return list

    return list.filter(member => {
      const name = (
        member.fullName ||
        member.name ||
        member.username ||
        ""
      ).toLowerCase()
      const email = (member.email || "").toLowerCase()
      const role = (member.role || "").toLowerCase()
      return name.includes(q) || email.includes(q) || role.includes(q)
    })
  }, [appState.staff, searchQuery])

  const getRoleBadge = role => {
    const r = (role || "").toLowerCase()
    switch (r) {
      case "admin":
      case "superadmin":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "manager":
        return "bg-indigo-50 text-indigo-700 border-indigo-200"
      case "cashier":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "storekeeper":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Employee
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Access Role
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Account Status
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs">
          {isFetching ? (
            <tr>
              <td colSpan="4" className="py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-indigo-600">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Loading staff directory...
                  </span>
                </div>
              </td>
            </tr>
          ) : staffList.length > 0 ? (
            <AnimatePresence>
              {staffList.map((member, idx) => {
                const displayName =
                  member.fullName ||
                  member.name ||
                  member.username ||
                  "Staff Member"
                const avatarInitial = displayName.charAt(0).toUpperCase()
                const isActive =
                  (member.status || "active").toLowerCase() === "active"

                return (
                  <motion.tr
                    key={member._id || idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Employee Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 font-bold flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                          {avatarInitial}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-tight">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                            <Mail
                              size={11}
                              className="text-gray-400 shrink-0"
                            />
                            <span>{member.email || "No email linked"}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Access Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getRoleBadge(
                          member.role,
                        )}`}
                      >
                        {member.role || "Staff"}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-xs font-semibold text-gray-700 capitalize">
                          {member.status || "Active"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Reset Security Password"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Key size={15} />
                        </button>
                        <button
                          type="button"
                          title="Account Options"
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          ) : (
            <tr>
              <td colSpan="4" className="py-14 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                  <UserX size={28} className="opacity-50 text-gray-400" />
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    No staff records found
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {searchQuery
                      ? "Try refining your search keyword."
                      : "New staff members will appear here once registered."}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
