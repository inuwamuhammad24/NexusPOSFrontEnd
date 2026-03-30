import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useImmerReducer } from "use-immer"
import ReactDOM from "react-dom/client"
import StateContext from "./StateContext"
import DispatchContext from "./DispatchContext"
import "./style.css"

// components
import Login from "./components/Login"
import MainLayout from "./components/MainInterface"

export default function App() {
  const initialState = {
    isSalesModalOpen: false,
    isProductModalOpen: false,
    isArrivalModalOpen: false,
    isTransferModalOpen: false,
    isReceiptOpen: false,
    backendURL: "http://192.168.127.246:8000",
  }

  function reducer(draft, action) {
    switch (action.type) {
      // sales modal
      case "openSalesModal":
        draft.isSalesModalOpen = true
        break
      case "closeSalesModal":
        draft.isSalesModalOpen = false
        break
      // product modal
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
        draft.isReceiptOpen = true
        break
      case "closeReceipt":
        draft.isReceiptOpen = false
        break
    }
  }

  const [state, dispatch] = useImmerReducer(reducer, initialState)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/:page" element={<MainLayout />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

const root = ReactDOM.createRoot(document.querySelector("#root")).render(
  <App />,
)

if (module.hot) {
  module.hot.accept()
}
