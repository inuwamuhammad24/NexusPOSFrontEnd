// components/Billing/BillingModal.jsx
import React, { useState, useEffect, useContext, useRef } from "react"
import PaystackPop from "@paystack/inline-js"
import Axios from "axios"
import {
  Check,
  Loader2,
  Sparkles,
  X,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CreditCard,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"

export default function BillingModal({
  isOpen,
  onClose,
  currentPlanSlug = "starter",
  availablePlans = [],
  onSubscriptionUpdated,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // --- STATE ---
  const [plans, setPlans] = useState(availablePlans)
  const [selectedPlanSlug, setSelectedPlanSlug] = useState(currentPlanSlug)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [loadError, setLoadError] = useState(null)

  // Payment states: 'idle' | 'opening_gateway' | 'verifying_backend'
  const [paymentPhase, setPaymentPhase] = useState("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const hasFetchedRef = useRef(false)

  // 1. STABLE PLAN RETRIEVAL WITH VISIBLE ERROR HANDLING
  const fetchPlansFromBackend = async () => {
    try {
      setIsLoadingPlans(true)
      setLoadError(null)
      const res = await Axios.get(`${appState.backendURL}/get-plans`)
      if (Array.isArray(res.data) && res.data.length > 0) {
        setPlans(res.data)
      } else {
        setLoadError("No active subscription plans found in the system.")
      }
    } catch (err) {
      console.error("Failed to fetch subscription plans:", err)
      setLoadError(
        err.response?.data?.msg ||
          "Unable to load subscription plans. Please verify your connection.",
      )
    } finally {
      setIsLoadingPlans(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false
      setErrorMessage("")
      setPaymentPhase("idle")
      return
    }

    if (availablePlans && availablePlans.length > 0) {
      setPlans(availablePlans)
      setIsLoadingPlans(false)
      setLoadError(null)
      return
    }

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchPlansFromBackend()
    }
  }, [isOpen, availablePlans.length, appState.backendURL])

  // Synchronize selection
  useEffect(() => {
    if (isOpen) {
      setSelectedPlanSlug(currentPlanSlug || "business")
    }
  }, [isOpen, currentPlanSlug])

  if (!isOpen) return null

  // Helper: Format Entitlements
  const formatPlanFeatures = plan => {
    const items = []
    const limits = plan.limits || {}
    const feats = plan.features || {}

    // Locations
    if (limits.locations >= 999) {
      items.push("Unlimited Branch Locations")
    } else {
      items.push(
        `${limits.locations || 1} Store ${
          limits.locations === 1 ? "Location" : "Locations"
        }`,
      )
    }

    // Staff accounts
    if (limits.users >= 999) {
      items.push("Unlimited Staff & Cashiers")
    } else {
      items.push(`Up to ${limits.users || 2} Staff Accounts`)
    }

    // Catalog items
    if (limits.products >= 999999) {
      items.push("Unlimited Catalog Products")
    } else {
      items.push(
        `${(limits.products || 500).toLocaleString()} Catalog Products`,
      )
    }

    // Capabilities
    if (feats.multiLocation) items.push("Multi-Branch Stock Synchronization")
    if (feats.customerCredit) items.push("Customer Credit & Debt Ledger")
    if (feats.reports === "advanced")
      items.push("Advanced Analytics & Tax Summaries")

    return items
  }

  const selectedPlanObj =
    plans.find(p => p.slug === selectedPlanSlug) || plans[0]

  // 2. RIGOROUS CHECKOUT & VERIFICATION HANDLER
  const handlePaystackCheckout = () => {
    setErrorMessage("")

    // Rule 1: Validate account email strictly
    const rawEmail =
      appState.user?.email ||
      appState.user?.ownerEmail ||
      localStorage.getItem("email") ||
      ""
    const trimmedEmail = String(rawEmail).trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage(
        "A valid store account email is required to process billing. Please update your profile email in settings.",
      )
      return
    }

    // Rule 2: Ensure valid plan
    if (!selectedPlanObj) {
      setErrorMessage("Please select a subscription plan to continue.")
      return
    }

    const publicKey = process.env.PAYSTACK_PUBLIC_KEY
    if (!publicKey) {
      setErrorMessage(
        "Paystack public gateway key is unconfigured (REACT_APP_PAYSTACK_PUBLIC_KEY).",
      )
      return
    }

    const token = appState.user?.token || localStorage.getItem("token")
    if (!token) {
      setErrorMessage("Authentication token not found. Please log in again.")
      return
    }

    setPaymentPhase("opening_gateway")

    try {
      const paystack = new PaystackPop()

      paystack.newTransaction({
        key: publicKey,
        email: trimmedEmail,
        amount: Math.round(selectedPlanObj.price * 100), // Kobo conversion
        currency: selectedPlanObj.currency || "NGN",
        metadata: {
          storeId: appState.user?.storeId,
          planSlug: selectedPlanObj.slug,
          planName: selectedPlanObj.name,
        },
        onSuccess: async transaction => {
          // Transition state: transaction succeeded on gateway, backend verification starting
          setPaymentPhase("verifying_backend")

          try {
            const response = await Axios.post(
              `${appState.backendURL}/verify-subscription`,
              {
                token,
                reference: transaction.reference,
                planSlug: selectedPlanObj.slug,
              },
            )

            // Authoritative confirmation from backend
            appDispatch({
              type: "addFlashMessage",
              payload: {
                type: "success",
                msg: `${selectedPlanObj.name} plan activated successfully for 30 days!`,
              },
            })

            if (typeof onSubscriptionUpdated === "function") {
              onSubscriptionUpdated(response.data?.data)
            }

            onClose()
          } catch (err) {
            console.error("Backend activation failed:", err)
            setErrorMessage(
              err.response?.data?.msg ||
                `Payment was received by Paystack, but backend verification encountered an issue. Save reference: ${transaction.reference} and contact support.`,
            )
          } finally {
            setPaymentPhase("idle")
          }
        },
        onCancel: () => {
          setPaymentPhase("idle")
          setErrorMessage(
            "Payment transaction was cancelled. No charges were made.",
          )
        },
      })
    } catch (err) {
      console.error("Failed to launch Paystack gateway:", err)
      setPaymentPhase("idle")
      setErrorMessage("Could not launch the payment gateway window.")
    }
  }

  const isBusy = paymentPhase !== "idle"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles size={16} />
              </span>
              <h2
                id="modal-headline"
                className="text-sm md:text-base font-bold text-slate-900"
              >
                Choose NexusPOS Subscription
              </h2>
            </div>
            <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
              Select an operational tier. Pricing covers a full 30-day billing
              cycle.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Top Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2.5"
            >
              <AlertTriangle
                size={16}
                className="text-rose-600 shrink-0 mt-0.5"
              />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Loading Plans State */}
          {isLoadingPlans && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
              <p className="text-xs font-semibold text-slate-600">
                Loading available tiers...
              </p>
            </div>
          )}

          {/* Plan Fetch Failure State */}
          {!isLoadingPlans && loadError && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <AlertTriangle className="text-amber-500 mx-auto" size={24} />
              <p className="text-xs font-semibold text-slate-700">
                {loadError}
              </p>
              <button
                type="button"
                onClick={fetchPlansFromBackend}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
              >
                <RotateCcw size={13} />
                <span>Retry Loading Plans</span>
              </button>
            </div>
          )}

          {/* Accessible Plan Selection Grid */}
          {!isLoadingPlans && !loadError && (
            <div
              role="radiogroup"
              aria-label="NexusPOS Plans"
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {plans.map(plan => {
                const isSelected = selectedPlanSlug === plan.slug
                const isPopular = plan.slug === "business"
                const featureList = formatPlanFeatures(plan)

                return (
                  <button
                    type="button"
                    key={plan.slug}
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isBusy}
                    onClick={() => setSelectedPlanSlug(plan.slug)}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/30 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    } ${isBusy ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs uppercase tracking-tight text-slate-800">
                          {plan.name}
                        </h3>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </span>
                      </div>

                      <p className="text-base font-black text-slate-900 mt-1">
                        {formatNaira(plan.price)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          / 30 days
                        </span>
                      </p>

                      <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                        {featureList.map((feat, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-[11px] text-slate-600"
                          >
                            <Check
                              size={12}
                              className="text-emerald-600 shrink-0 mt-0.5"
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-2">
                      <div
                        className={`w-full py-1.5 rounded-lg text-center text-[11px] font-bold transition ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select Tier"}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Payment Trust & Security Notice */}
          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>
              Transactions are verified in real time via Paystack (Card, USSD,
              Bank Transfer). Manual monthly renewals.
            </span>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs">
            {selectedPlanObj && (
              <span className="text-slate-500 font-medium">
                Total due:{" "}
                <strong className="text-slate-900 font-bold">
                  {formatNaira(selectedPlanObj.price)}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePaystackCheckout}
              disabled={isBusy || isLoadingPlans || Boolean(loadError)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {paymentPhase === "opening_gateway" ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Connecting Gateway...</span>
                </>
              ) : paymentPhase === "verifying_backend" ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Verifying Activation...</span>
                </>
              ) : (
                <>
                  <CreditCard size={14} />
                  <span>Proceed to Pay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
