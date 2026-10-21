import React, { useState, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  Mail,
  Shield,
  Lock,
  Check,
  UserPlus,
  MapPin,
  Loader2,
} from "lucide-react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

const INITIAL_FORM = {
  name: "",
  email: "",
  role: "Cashier",
  password: "",
  locationId: "",
}

export default function AddStaffModal({ isOpen, onClose, onSave, onSuccess }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [locations, setLocations] = useState([])
  const [isLoadingLocs, setIsLoadingLocs] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const roles = [
    { id: "Admin", desc: "Full administrative & platform controls" },
    { id: "Manager", desc: "Inventory & operational supervisor" },
    { id: "Cashier", desc: "POS checkout & sales terminals" },
    { id: "Storekeeper", desc: "Warehouse stock inflow & transfers" },
  ]

  // Reset form and close
  const resetAndClose = () => {
    setFormData(INITIAL_FORM)
    setIsSaving(false)
    onClose()
  }

  // --- FETCH LOCATIONS (TOKEN GUARDED) ---
  useEffect(() => {
    if (!isOpen) return

    const source = Axios.CancelToken.source()

    async function fetchLocs() {
      const token = appState.user?.token || localStorage.getItem("token")
      if (!token) return

      setIsLoadingLocs(true)
      try {
        const response = await Axios.post(
          `${appState.backendURL}/get-all-locations`,
          { token },
          { cancelToken: source.token },
        )
        setLocations(Array.isArray(response.data) ? response.data : [])
      } catch (e) {
        if (!Axios.isCancel(e)) {
          console.error("Failed to load store locations:", e)
          appDispatch({
            type: "addFlashMessage",
            payload: {
              type: "error",
              msg: "Failed to load branch storage nodes.",
            },
          })
        }
      } finally {
        setIsLoadingLocs(false)
      }
    }

    fetchLocs()
    return () => source.cancel()
  }, [isOpen, appState.backendURL, appState.user?.token, appDispatch])

  if (!isOpen) return null

  const handleSubmit = async e => {
    e.preventDefault()

    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Session expired. Please sign in again.",
        },
      })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        token, // Required for storeGuard -> req.storeId
        name: formData.name.trim(),
        username: formData.name.trim(),
        fullName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        password: formData.password,
        locationId: formData.locationId || "global",
      }

      const response = await Axios.post(
        `${appState.backendURL}/add-staff`,
        payload,
      )

      if (response.data) {
        appDispatch({
          type: "addFlashMessage",
          payload: {
            type: "success",
            msg: `Team member "${formData.name}" added successfully!`,
          },
        })

        // Notify parent StaffPage / Table to refresh roster & pulse
        if (typeof onSuccess === "function") {
          onSuccess(response.data)
        } else if (typeof onSave === "function") {
          onSave(response.data)
        }

        resetAndClose()
      }
    } catch (error) {
      console.error("Staff creation error:", error)
      const serverMessage =
        error.response?.data?.msg ||
        error.response?.data?.error ||
        "An unexpected error occurred while adding staff."

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: serverMessage,
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm antialiased">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={resetAndClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight uppercase">
                  Add Team Member
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Access Provisioning & Role Privileges
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={16} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin"
          >
            {/* Name & Email Group */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                    size={15}
                  />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Maryam Bello"
                    value={formData.name}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                    size={15}
                  />
                  <input
                    required
                    type="email"
                    placeholder="staff@store.com"
                    value={formData.email}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Location Assignment */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                Primary Branch Assignment
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={15}
                />
                <select
                  required
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                  value={formData.locationId}
                  onChange={e =>
                    setFormData({ ...formData, locationId: e.target.value })
                  }
                >
                  <option value="">
                    {isLoadingLocs
                      ? "Loading Branch Nodes..."
                      : "Select Assigned Branch / Node"}
                  </option>
                  <option value="global">All Branches (Global Access)</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.type || "Store"})
                    </option>
                  ))}
                </select>
                {isLoadingLocs && (
                  <Loader2
                    className="absolute right-3.5 top-3 animate-spin text-gray-400"
                    size={15}
                  />
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                Assign Security Role
              </label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map(role => {
                  const isSelected = formData.role === role.id

                  return (
                    <label
                      key={role.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Shield size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">
                            {role.id}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            {role.desc}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        checked={isSelected}
                        className="hidden"
                        onChange={() =>
                          setFormData({ ...formData, role: role.id })
                        }
                      />
                      {isSelected && (
                        <Check size={16} className="text-indigo-600 mr-1" />
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
                Temporary Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
                  size={15}
                />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={resetAndClose}
                className="flex-1 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isLoadingLocs}
                className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-indigo-700 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
