import React, { useEffect } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom"
import { useImmerReducer } from "use-immer"
import ReactDOM from "react-dom/client"
import StateContext from "./StateContext"
import DispatchContext from "./DispatchContext"
import "./style.css"

// components
import Login from "./components/Reusables/Login"
import MainLayout from "./components/MainInterface"

export default function App() {
  const navigate = useNavigate()

  const initialState = {
    isSalesModalOpen: false,
    isProductModalOpen: false,
    isArrivalModalOpen: false,
    isTransferModalOpen: false,
    // Initialize from localStorage so user stays logged in on refresh
    isLogin: Boolean(localStorage.getItem("token")),
    isReceiptOpen: false,
    backendURL: "http://10.170.170.246:8000",
    sales: [],
    inventory: [],
    customers: [],
    staff: [],
    receitData: {},
    tempReceiptId: "",
    isLocationModalOpen: false,
    flashMessage: {
      isFlashMessageOpen: false,
      msgs: [],
    },
  }

  function reducer(draft, action) {
    switch (action.type) {
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
      case "openArrivalModal":
        draft.isArrivalModalOpen = true
        break
      case "closeArrivalModal":
        draft.isArrivalModalOpen = false
        break
      case "openTransferModal":
        draft.isTransferModalOpen = true
        break
      case "closeTransferModal":
        draft.isTransferModalOpen = false
        break
      case "openReceipt":
        draft.tempReceiptId = action.id
        draft.receitData = action.data
        draft.isReceiptOpen = true
        break
      case "closeReceipt":
        draft.isReceiptOpen = false
        draft.tempReceiptId = ""
        draft.receitData = {}
        break
      case "setCustomers":
        draft.customers = action.payload
        break
      case "setStaff":
        draft.staff = action.payload
        break
      case "setInventory":
        draft.inventory = action.payload
        break
      case "setSales":
        draft.sales = action.payload
        break
      case "addNewCustomer":
        draft.customers.push(action.payload)
        break
      case "closeLocationModal":
        draft.isLocationModalOpen = false
        break
      case "openLocationModal":
        draft.isLocationModalOpen = true
        break
      case "clearFlash":
        draft.flashMessage.msgs = []
        draft.flashMessage.isFlashMessageOpen = false
        break
      case "addFlashMessage":
        draft.flashMessage.msgs.push({
          type: action.payload.type,
          msg: action.payload.msg,
          id: new Date().getTime(),
        })
        draft.flashMessage.isFlashMessageOpen = true
        break
      case "login":
        localStorage.setItem("token", action.data.token)
        localStorage.setItem("fullName", action.data.fullName)
        localStorage.setItem("role", action.data.role)
        localStorage.setItem("locationId", action.data.locationId)
        localStorage.setItem("email", action.data.email)
        // Fixed: Use assignment for Immer draft, not a function call
        draft.isLogin = true
        break
      case "logout":
        localStorage.clear()
        draft.isLogin = false
        break
    }
  }

  const [state, dispatch] = useImmerReducer(reducer, initialState)

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <Routes>
          {state.isLogin ? (
            // If logged in, they can access any :page (sales, inventory, etc.)
            <>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/:page" element={<MainLayout />} />
            </>
          ) : (
            // If NOT logged in, everything sends them to Login
            <Route path="*" element={<Login />} />
          )}
        </Routes>
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

if (module.hot) {
  module.hot.accept()
}
