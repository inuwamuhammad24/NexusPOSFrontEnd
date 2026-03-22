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
  }

  function reducer(state, action) {
    switch (action.type) {
      // sales modal
      case "openSalesModal":
        state.isSalesModalOpen = true
        break
      case "closeSalesModal":
        state.isSalesModalOpen = false
        break
      // product modal
      case "openProductModal":
        state.isProductModalOpen = true
        break
      case "closeProductModal":
        state.isProductModalOpen = false
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
