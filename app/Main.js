// Main.js
import React, { useEffect, Suspense, lazy } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom"
import { useImmerReducer } from "use-immer"
import ReactDOM from "react-dom/client"
import Axios from "axios"
import StateContext from "./StateContext"
import DispatchContext from "./DispatchContext"
import "./style.css"
import { Loader2 } from "lucide-react"

// Immediate Loading (Public Marketing & Auth)
import HomePage from "./components/Reusables/Home"
import Login from "./components/Pages/Auth/Login"
import RegisterPage from "./components/Pages/Auth/RegisterPage"
import MainLayout from "./components/MainInterface"
import StockHistoryTable from "./components/Pages/Inventory/StockHistoryTable"
import AdminDashboardPage from "./components/Pages/Dashboard/AdminDashboardPage"
import BillingPage from "./components/Pages/Billings/BillingPage"

// Lazy Loading (Dashboard & Sub-pages loaded on-demand)
const Dashboard = lazy(() => import("./components/Pages/Dashboard/Dashboard"))
const SalesTable = lazy(() => import("./components/Pages/Sales/SalesTable"))
const Inventory = lazy(() => import("./components/Pages/Inventory/Inventory"))
const CustomerPage = lazy(() => import("./components/Pages/Customers/Customer"))
const StaffPage = lazy(() => import("./components/Pages/Staff/Staff"))
const StockTable = lazy(() => import("./components/Pages/Inventory/StockTable"))

// Clean Loading Fallback
function PageLoader() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  )
}

// Role Protection Component
function RoleRoute({ userRole, allowedRoles, children }) {
  const normalizedUserRole = String(userRole || "cashier")
    .toLowerCase()
    .trim()

  if (normalizedUserRole === "admin" || normalizedUserRole === "owner") {
    return children
  }

  const isAllowed = allowedRoles
    .map(r => r.toLowerCase())
    .includes(normalizedUserRole)

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  const initialState = {
    isSalesModalOpen: false,
    isProductModalOpen: false,
    isArrivalModalOpen: false,
    isTransferModalOpen: false,
    isLogin: Boolean(localStorage.getItem("token")),
    isReceiptOpen: false,
    backendURL: "https://mtappbackend.onrender.com",
    // backendURL: "http://localhost:8000",
    sales: [],
    inventory: [],
    customers: [],
    staff: [],
    receitData: {},
    tempReceiptData: null,
    tempReceiptId: "",
    isLocationModalOpen: false,
    flashMessage: {
      isFlashMessageOpen: false,
      msgs: [],
    },
    user: {
      token: localStorage.getItem("token") || "",
      username: localStorage.getItem("username") || "",
      role: localStorage.getItem("role") || "",
      storeId: localStorage.getItem("storeId") || "",
      businessName: localStorage.getItem("businessName") || "",
      email: localStorage.getItem("email") || "",
    },
  }

  function reducer(draft, action) {
    switch (action.type) {
      case "login":
        localStorage.setItem("token", action.data.token)
        localStorage.setItem("nexusposToken", action.data.token)
        localStorage.setItem("email", action.data.email || "")
        localStorage.setItem("username", action.data.username || "Operator")
        localStorage.setItem("role", action.data.role || "cashier")
        localStorage.setItem("nexusposRole", action.data.role || "cashier")
        localStorage.setItem("storeId", action.data.storeId || "")
        localStorage.setItem("businessName", action.data.businessName || "")

        draft.isLogin = true
        draft.user = {
          token: action.data.token,
          username: action.data.username || "Operator",
          role: action.data.role || "cashier",
          storeId: action.data.storeId || "",
          businessName: action.data.businessName || "",
          email: action.data.email || "",
        }
        break

      case "logout":
        localStorage.clear()
        draft.isLogin = false
        draft.user = {
          token: "",
          username: "",
          role: "",
          storeId: "",
          businessName: "",
          email: "",
        }
        break

      case "clearFlash":
        draft.flashMessage.msgs = []
        draft.flashMessage.isFlashMessageOpen = false
        break

      case "addFlashMessage":
        draft.flashMessage.msgs.push({
          type: action.payload.type || "info",
          msg: action.payload.msg,
          id: new Date().getTime(),
        })
        draft.flashMessage.isFlashMessageOpen = true
        break

      case "setStaff":
        draft.staff = Array.isArray(action.payload) ? action.payload : []
        break

      case "setCustomers":
        draft.customers = Array.isArray(action.payload) ? action.payload : []
        break

      // Modal Triggers
      case "openSalesModal":
        draft.isSalesModalOpen = true
        break
      case "closeSalesModal":
        draft.isSalesModalOpen = false
        break

      case "openProductModal":
        draft.isProductModalOpen = true
        break
      case "closeProductModal":
        draft.isProductModalOpen = false
        break

      case "openLocationModal":
        draft.isLocationModalOpen = true
        break
      case "closeLocationModal":
        draft.isLocationModalOpen = false
        break

      case "openTransferModal":
        draft.isTransferModalOpen = true
        break
      case "closeTransferModal":
        draft.isTransferModalOpen = false
        break

      case "openArrivalModal":
        draft.isArrivalModalOpen = true
        break
      case "closeArrivalModal":
        draft.isArrivalModalOpen = false
        break

      // Receipt Handlers
      case "setReceiptData":
        draft.tempReceiptData = action.payload
        draft.receitData = action.payload
        draft.isReceiptOpen = true
        break
      case "openReceipt":
        draft.isReceiptOpen = true
        break
      case "closeReceipt":
        draft.isReceiptOpen = false
        draft.tempReceiptData = null
        break

      default:
        break
    }
  }

  const [state, dispatch] = useImmerReducer(reducer, initialState)
  const userRole = state.user?.role || localStorage.getItem("role") || "cashier"

  // Global Session Expiration & Token Interceptor
  useEffect(() => {
    const interceptor = Axios.interceptors.response.use(
      response => response,
      error => {
        const status = error.response?.status
        const data = error.response?.data || {}
        const errorMsg = String(
          data.msg || data.message || data.error || "",
        ).toLowerCase()

        const isAuthExpired =
          status === 401 ||
          data.code === "TOKEN_EXPIRED" ||
          data.code === "TOKEN_INVALID" ||
          errorMsg.includes("jwt expired") ||
          errorMsg.includes("token expired") ||
          errorMsg.includes("expired store session")

        if (isAuthExpired) {
          localStorage.clear()
          dispatch({ type: "logout" })
          dispatch({
            type: "addFlashMessage",
            payload: {
              type: "error",
              msg: "Your security session has expired. Please sign in again.",
            },
          })

          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login"
          }
        }

        return Promise.reject(error)
      },
    )

    return () => Axios.interceptors.response.eject(interceptor)
  }, [dispatch])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* PUBLIC MARKETING & ONBOARDING ROUTES */}
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={
                state.isLogin ? <Navigate to="/dashboard" replace /> : <Login />
              }
            />
            <Route
              path="/register"
              element={
                state.isLogin ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <RegisterPage />
                )
              }
            />

            {/* AUTHENTICATED SAAS INTERFACE */}
            {state.isLogin ? (
              <Route element={<MainLayout />}>
                {/* 1. All Staff Roles (Admin, Manager, Cashier) */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sales" element={<SalesTable />} />
                <Route path="/inventory" element={<Inventory />} />

                {/* 2. Admin & Manager Only */}
                <Route
                  path="/stock-history"
                  element={
                    <RoleRoute
                      userRole={userRole}
                      allowedRoles={["admin", "manager"]}
                    >
                      <StockTable />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <RoleRoute
                      userRole={userRole}
                      allowedRoles={["admin", "manager"]}
                    >
                      <CustomerPage />
                    </RoleRoute>
                  }
                />

                {/* 3. Strictly Admin Only */}
                <Route
                  path="/staff"
                  element={
                    <RoleRoute userRole={userRole} allowedRoles={["admin"]}>
                      <StaffPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <RoleRoute userRole={userRole} allowedRoles={["admin"]}>
                      <BillingPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/control"
                  element={
                    <RoleRoute userRole={userRole} allowedRoles={["admin"]}>
                      <AdminDashboardPage />
                    </RoleRoute>
                  }
                />

                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Suspense>
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

const root = ReactDOM.createRoot(document.querySelector("#root"))
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
