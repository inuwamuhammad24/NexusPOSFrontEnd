// src/components/Billing/BillingPage.jsx
import React, { useEffect, useState, useContext } from "react"
import Axios from "axios"
import {
  CreditCard,
  Calendar,
  Sparkles,
  Share2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  Package,
  RotateCcw,
  Receipt,
  Check,
  XCircle,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import formatNaira from "../../Reusables/NairaFormatter"
import BillingModal from "./Billing"

export default function BillingPage() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [billingData, setBillingData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchStatus = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const token = appState.user?.token || localStorage.getItem("token")
      const res = await Axios.post(
        `${appState.backendURL}/get-billing-status`,
        { token },
      )
      setBillingData(res.data)
    } catch (err) {
      console.error("Failed to load billing status:", err)
      setLoadError(
        err.response?.data?.msg ||
          "Could not retrieve your subscription records. Please check your connection.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [appState.backendURL])

  const copyReferralLink = async () => {
    if (!billingData?.referralLink) return
    try {
      await navigator.clipboard.writeText(billingData.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "success", msg: "Referral link copied to clipboard!" },
      })
    } catch (err) {
      console.error("Clipboard write error:", err)
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Failed to copy link. Please copy it manually.",
        },
      })
    }
  }

  // --- 1. LOADING SKELETON ---
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-100 rounded w-72" />
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  // --- 2. ERROR BOUNDARY ---
  if (loadError) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto font-sans">
        <div className="p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Failed to Load Billing Information
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {loadError}
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
          >
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    )
  }

  const isTrial = billingData?.status === "trial"
  const isExpired = billingData?.isExpired
  const currentPlan = billingData?.plan || {
    name: "Starter",
    price: 5000,
    slug: "starter",
    billingInterval: "month",
    limits: { locations: 1, users: 2, products: 500 },
  }

  const daysRemaining = Number(billingData?.daysLeft ?? 0)
  const daysLabel =
    daysRemaining === 1 ? "1 day remaining" : `${daysRemaining} days remaining`
  const paymentsList = billingData?.payments || []

  // Safe limit string formatter
  const renderLimit = (value, unit) => {
    if (value === undefined || value === null) return "Not configured"
    if (value >= 999) return `Unlimited ${unit}`
    return `${value.toLocaleString()} ${unit}`
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
          Subscription & Billing
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your subscription tier, billing period, and verified payment
          history.
        </p>
      </div>

      {/* 2. Expiration Banners */}
      {isExpired ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-600 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-rose-800">
                Your subscription has expired
              </p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Renew your plan to maintain access to multi-counter checkouts
                and catalog modifications.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
          >
            Renew Subscription
          </button>
        </div>
      ) : isTrial && daysRemaining <= 5 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-amber-800">
                Trial ends in{" "}
                {daysRemaining === 0
                  ? "less than 24 hours"
                  : `${daysRemaining} days`}
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Upgrade today to guarantee seamless sales sessions for your
                cashiers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition"
          >
            Upgrade Plan
          </button>
        </div>
      ) : null}

      {/* 3. Redesigned Subscription Summary Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isExpired
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : isTrial
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isExpired
                ? "Expired"
                : isTrial
                  ? "Free Trial"
                  : "Active Subscription"}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {billingData?.autoRenew ? "Auto-renew enabled" : "Manual renewal"}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
              {currentPlan.name} Plan
              <span className="text-sm font-semibold text-slate-500">
                {formatNaira(currentPlan.price)} /{" "}
                {currentPlan.billingInterval || "month"}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={14} className="text-slate-400" />
            <span>
              {isTrial ? "Trial concludes on" : "Current period ends on"}{" "}
              <strong className="text-slate-700 font-bold">
                {billingData?.currentPeriodEnd
                  ? new Date(billingData.currentPeriodEnd).toLocaleDateString(
                      [],
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )
                  : "N/A"}
              </strong>{" "}
              {!isExpired && `(${daysLabel})`}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition active:scale-95"
        >
          <Sparkles size={15} />
          <span>
            {isTrial ? "Upgrade to Paid Plan" : "Change / Renew Plan"}
          </span>
        </button>
      </div>

      {/* 4. Plan Limits & Capacity Allocation */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Plan Entitlements & Allocation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl w-fit">
              <Building2 size={18} />
            </div>
            <h4 className="text-xs font-bold text-slate-700">Store Branches</h4>
            <p className="text-sm font-black text-slate-900">
              {renderLimit(currentPlan.limits?.locations, "Branch Location(s)")}
            </p>
            <p className="text-[11px] text-slate-400">
              Physical retail outlets & warehouses
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl w-fit">
              <Users size={18} />
            </div>
            <h4 className="text-xs font-bold text-slate-700">Staff Accounts</h4>
            <p className="text-sm font-black text-slate-900">
              {renderLimit(currentPlan.limits?.users, "Staff Account(s)")}
            </p>
            <p className="text-[11px] text-slate-400">
              Cashiers, managers, and administrators
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl w-fit">
              <Package size={18} />
            </div>
            <h4 className="text-xs font-bold text-slate-700">
              Product Catalog
            </h4>
            <p className="text-sm font-black text-slate-900">
              {renderLimit(currentPlan.limits?.products, "Catalog Item(s)")}
            </p>
            <p className="text-[11px] text-slate-400">
              Individual SKUs with inventory tracking
            </p>
          </div>
        </div>
      </div>

      {/* 5. Payment History Ledger */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              Payment History
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Transactions verified via Paystack
          </span>
        </div>

        {paymentsList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CreditCard size={28} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              No payment records yet
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Invoices and payment receipts will appear here automatically when
              you complete a subscription transaction.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {paymentsList.map(tx => (
                  <tr
                    key={tx._id || tx.reference}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-900 font-bold">
                      {new Date(tx.date).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {tx.description}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[10px] text-slate-400">
                      {tx.reference}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900">
                      {formatNaira(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      {tx.status === "successful" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Check size={10} />
                          <span>Successful</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          <XCircle size={10} />
                          <span>{tx.status || "Failed"}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Referral Rewards Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center gap-2">
            <Share2 className="text-indigo-400" size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Refer & Earn Free Months
            </span>
          </div>
          <h3 className="text-base font-bold">
            Introduce another merchant, get 1 month added to your subscription.
          </h3>
          <p className="text-xs text-slate-300">
            When another business registers with your link and activates any
            plan, your expiration date is extended by +30 days at ₦0.
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Your Personal Referral Link:
          </span>
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 p-1.5 rounded-xl">
            <input
              type="text"
              readOnly
              value={billingData?.referralLink || ""}
              className="bg-transparent text-xs px-2 text-indigo-200 outline-none w-52 select-all font-mono"
            />
            <button
              onClick={copyReferralLink}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Billing Modal */}
      <BillingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPlanSlug={billingData?.plan?.slug || "starter"}
        availablePlans={billingData?.availablePlans || []}
        onSubscriptionUpdated={() => fetchStatus()}
      />
    </div>
  )
}
