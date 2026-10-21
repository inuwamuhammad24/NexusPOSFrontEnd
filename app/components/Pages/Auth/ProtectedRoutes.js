// src/components/Auth/ProtectedRoute.jsx
import React, { useContext } from "react"
import { Navigate, Outlet } from "react-router-dom"
import StateContext from "../../StateContext"

export default function ProtectedRoute({ allowedRoles = [] }) {
  const appState = useContext(StateContext)
  const currentRole = (
    appState.user?.role ||
    localStorage.getItem("role") ||
    ""
  )
    .toLowerCase()
    .trim()

  // Admins & owners have access everywhere
  if (currentRole === "admin" || currentRole === "owner") {
    return <Outlet />
  }

  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase().trim())

  if (
    normalizedAllowed.length > 0 &&
    !normalizedAllowed.includes(currentRole)
  ) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
