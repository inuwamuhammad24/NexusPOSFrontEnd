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

export default function AddStaffModal({ isOpen, onClose, onSave }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Cashier",
    password: "",
    locationId: "", // New field
  })

  const [locations, setLocations] = useState([])
  const [isLoadingLocs, setIsLoadingLocs] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const roles = [
    { id: "Admin", desc: "Full system access & reports" },
    { id: "Manager", desc: "Inventory & sales management" },
    { id: "Cashier", desc: "POS & customer operations" },
    { id: "Storekeeper", desc: "Warehouse & bulk stock" },
  ]

  // --- FETCH LOCATIONS ---
  useEffect(() => {
    if (isOpen) {
      async function fetchLocs() {
        setIsLoadingLocs(true)
        try {
          const response = await Axios.get(
            `${appState.backendURL}/get-all-locations`,
          )
          setLocations(response.data)
        } catch (e) {
          appDispatch({
            type: "addFlashMessage",
            payload: {
              type: "error",
              msg: "Fail to load locations, try again later",
            },
          })
        } finally {
          setIsLoadingLocs(false)
        }
      }
      fetchLocs()
    }
  }, [isOpen, appState.backendURL])

  if (!isOpen) return null

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSaving(true)
    // Pass formData back to the parent component for the actual API call
    try {
      const response = await Axios.post(
        `${appState.backendURL}/add-staff`,
        formData,
      )
      if (response.data) {
        onClose()
        appDispatch({
          type: "addFlashMessage",
          payload: {
            type: "sucess",
            msg: "New Staff created successfully",
          },
        })
      }
    } catch (error) {
      console.log(error)
      const serverMessage =
        error.response?.data?.msg || "An unexpected error occurred."
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: serverMessage,
        },
      })
    }
    setIsSaving(false)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
                  Add Team Member
                </h2>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  Access & Permissions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar"
          >
            {/* Name & Email Group */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    required
                    type="email"
                    placeholder="john@store.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* --- LOCATION ASSIGNMENT --- */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                Primary Assignment
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <select
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                  value={formData.locationId}
                  onChange={e =>
                    setFormData({ ...formData, locationId: e.target.value })
                  }
                >
                  <option value="">
                    {isLoadingLocs
                      ? "Loading Nodes..."
                      : "Select Storage Node / Store"}
                  </option>
                  <option value="global">Global (Full Access)</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                </select>
                {isLoadingLocs && (
                  <Loader2
                    className="absolute right-4 top-3 animate-spin text-gray-300"
                    size={16}
                  />
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3 block ml-1">
                Assign Role
              </label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map(role => (
                  <label
                    key={role.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      formData.role === role.id
                        ? "border-indigo-500 bg-indigo-50/30"
                        : "border-gray-100 bg-white hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${formData.role === role.id ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400"}`}
                      >
                        <Shield size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {role.id}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
                          {role.desc}
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      className="hidden"
                      onChange={() =>
                        setFormData({ ...formData, role: role.id })
                      }
                    />
                    {formData.role === role.id && (
                      <Check size={16} className="text-indigo-600 mr-2" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                Initial Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-3 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isLoadingLocs}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-indigo-700 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-gray-200"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} /> Create Account
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
