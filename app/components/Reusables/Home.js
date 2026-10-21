import React, { useState, useEffect, useRef, useContext } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Axios from "axios"
import {
  TrendingUp,
  Package,
  Store,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Receipt,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  Pill,
  ShoppingBag,
  Layers,
  Check,
  Menu,
  X,
  Star,
  ChevronDown,
  Loader2,
} from "lucide-react"
import StateContext from "../../StateContext"
import formatNaira from "../Reusables/NairaFormatter"

// Typing words rotation target
const ROTATING_WORDS = ["Sales", "Inventory", "Branches", "Staff", "Profits"]

// Floating notification ticker stream
const FLOATING_ACTIVITIES = [
  {
    icon: CheckCircle2,
    title: "Sale Completed",
    desc: "₦45,500 via Transfer",
    time: "Just now",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Package,
    title: "Stock Updated",
    desc: "Carton Milk (+12)",
    time: "2m ago",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: Receipt,
    title: "Invoice Printed",
    desc: "INV-8492 · 58mm Thermal",
    time: "4m ago",
    color: "text-blue-600 bg-blue-50",
  },
]

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#solutions", label: "Solutions" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
]

const TESTIMONIALS = [
  {
    quote:
      "We used to close registers late just to reconcile cash. Now it's done before the last customer leaves.",
    name: "Amaka Obi",
    role: "Owner, Obi Family Supermarket",
  },
  {
    quote:
      "Stock counts across our three branches used to take a full day each month. Now it's one screen.",
    name: "Ibrahim Yusuf",
    role: "Operations Manager, Yusuf Wholesale",
  },
  {
    quote:
      "Price override alerts caught a cashier issue in the first week. It paid for itself immediately.",
    name: "Grace Adeyemi",
    role: "Pharmacist, Adeyemi Chemists",
  },
]

const FAQS = [
  {
    q: "Does NexusPOS work without internet?",
    a: "Yes. Sales and inventory updates are recorded locally at the counter and sync automatically once your connection is back, so a network drop never stops checkout.",
  },
  {
    q: "Can I add more branches later?",
    a: "Yes, you can upgrade your plan at any time and new branches are added immediately. There is no need to migrate data or start a new account.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export your full sales history, inventory records, and customer debt books at any time, including after cancellation, for up to 90 days.",
  },
  {
    q: "Do you support printed and digital receipts?",
    a: "Both. NexusPOS prints to 58mm thermal and A4 printers out of the box, and can send digital copies by SMS or WhatsApp on request.",
  },
]

// Fallback plans if database connection is cold or offline
const DEFAULT_PLANS = [
  {
    name: "Starter",
    slug: "starter",
    price: 5000,
    limits: { locations: 1, users: 2, products: 500 },
    features: { customerCredit: false, multiLocation: false },
    tagline:
      "Best for single-counter retail shops and neighborhood pharmacies.",
  },
  {
    name: "Business",
    slug: "business",
    price: 10000,
    limits: { locations: 3, users: 5, products: 2500 },
    features: { customerCredit: true, multiLocation: true },
    tagline:
      "Best for supermarkets, wholesale stores, and growing multi-counter teams.",
    isPopular: true,
  },
  {
    name: "Pro",
    slug: "pro",
    price: 20000,
    limits: { locations: 999, users: 999, products: 999999 },
    features: {
      customerCredit: true,
      multiLocation: true,
      reports: "advanced",
    },
    tagline:
      "Best for multi-branch wholesale chains requiring unlimited operations.",
  },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const handler = e => setReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduced
}

function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (reducedMotion) {
      setDisplay(value)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            const startTime = performance.now()
            const step = now => {
              const progress = Math.min((now - startTime) / duration, 1)
              const eased = 1 - Math.pow(1 - progress, 3)
              setDisplay(Math.round(value * eased))
              if (progress < 1) requestAnimationFrame(step)
            }
            requestAnimationFrame(step)
          }
        })
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [value, duration, reducedMotion])

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function HomePage() {
  const appState = useContext(StateContext)

  // --- TYPEWRITER STATE ENGINE ---
  const [wordIndex, setWordIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // --- FLOATING POPUP STATE ENGINE ---
  const [activityIndex, setActivityIndex] = useState(0)

  // --- MOBILE NAV STATE ---
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // --- FAQ ACCORDION STATE ---
  const [openFaq, setOpenFaq] = useState(0)

  // --- DYNAMIC DATABASE PLANS STATE ---
  const [dbPlans, setDbPlans] = useState([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

  const reducedMotion = useReducedMotion()
  const pauseTimeoutRef = useRef(null)

  // Fetch dynamic plans directly from MongoDB
  useEffect(() => {
    let isMounted = true
    async function loadPlans() {
      try {
        setIsLoadingPlans(true)
        const endpoint = appState?.backendURL
          ? `${appState.backendURL}/get-plans`
          : "/get-plans"
        const res = await Axios.get(endpoint)
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setDbPlans(res.data)
        } else if (isMounted) {
          setDbPlans(DEFAULT_PLANS)
        }
      } catch (err) {
        console.error("Failed to fetch database plans for homepage:", err)
        if (isMounted) setDbPlans(DEFAULT_PLANS)
      } finally {
        if (isMounted) setIsLoadingPlans(false)
      }
    }
    loadPlans()
    return () => {
      isMounted = false
    }
  }, [appState?.backendURL])

  // Helper to format plan features dynamically
  const formatDynamicPlanFeatures = plan => {
    const items = []
    const limits = plan.limits || {}
    const feats = plan.features || {}

    // Locations limit
    if (limits.locations >= 999) {
      items.push("Unlimited Branch Outlets")
    } else {
      items.push(
        `${limits.locations || 1} Store ${
          limits.locations === 1 ? "Counter / Branch" : "Branch Locations"
        }`,
      )
    }

    // Staff accounts limit
    if (limits.users >= 999) {
      items.push("Unlimited Staff & Cashiers")
    } else {
      items.push(`Up to ${limits.users || 2} Staff Accounts`)
    }

    // Product SKUs limit
    if (limits.products >= 999999) {
      items.push("Unlimited Catalog Products")
    } else {
      items.push(
        `${(limits.products || 500).toLocaleString()} Catalog Products`,
      )
    }

    // Feature toggles
    if (feats.multiLocation) items.push("Multi-Branch Inventory Transfers")
    if (feats.customerCredit) items.push("Customer Debt Recovery Ledger")
    items.push("58mm Thermal & A4 Print Receipts")

    return items
  }

  // Typewriter loop
  useEffect(() => {
    if (reducedMotion) {
      setDisplayedText(ROTATING_WORDS[wordIndex])
      return
    }

    const currentWord = ROTATING_WORDS[wordIndex]
    const speed = isDeleting ? 40 : 80

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(currentWord.substring(0, displayedText.length + 1))
        if (displayedText === currentWord) {
          pauseTimeoutRef.current = setTimeout(() => setIsDeleting(true), 1800)
        }
      } else {
        setDisplayedText(currentWord.substring(0, displayedText.length - 1))
        if (displayedText === "") {
          setIsDeleting(false)
          setWordIndex(prev => (prev + 1) % ROTATING_WORDS.length)
        }
      }
    }, speed)

    return () => {
      clearTimeout(timeout)
      clearTimeout(pauseTimeoutRef.current)
    }
  }, [displayedText, isDeleting, wordIndex, reducedMotion])

  // Floating notification cycle
  useEffect(() => {
    if (reducedMotion) return
    const interval = setInterval(() => {
      setActivityIndex(prev => (prev + 1) % FLOATING_ACTIVITIES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [reducedMotion])

  // Body scroll lock during mobile menu
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileNavOpen])

  const currentActivity = FLOATING_ACTIVITIES[activityIndex]
  const ActivityIcon = currentActivity.icon
  const closeNav = () => setMobileNavOpen(false)

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <nav
          className="max-w-7xl mx-auto flex items-center justify-between"
          aria-label="Main"
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200">
              N
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              NEXUS<span className="text-indigo-600">POS</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-indigo-600 transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Start Free Trial
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen(prev => !prev)}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile nav panel */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              id="mobile-nav-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
              className="md:hidden overflow-hidden border-t border-gray-100 mt-4"
            >
              <div className="flex flex-col gap-1 pt-4 pb-2">
                {NAV_LINKS.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeNav}
                    className="px-2 py-3 text-sm font-semibold text-gray-700 hover:text-indigo-600 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-gray-100">
                  <Link
                    to="/login"
                    onClick={closeNav}
                    className="px-2 py-3 text-sm font-semibold text-gray-700 text-center rounded-lg hover:bg-gray-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeNav}
                    className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold text-center shadow-md shadow-indigo-600/20 transition"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* 2. Hero Section with Typing Effect */}
        <section className="pt-36 pb-16 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6"
          >
            <Sparkles
              size={14}
              className="text-indigo-600"
              aria-hidden="true"
            />{" "}
            Simple tools. Better business.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl text-gray-900 leading-[1.15]"
          >
            Run your business smarter. <br />
            <span>Manage your </span>
            <span className="text-indigo-600 inline-block min-w-[200px] text-left">
              {displayedText}
              {!reducedMotion && (
                <span
                  className="animate-pulse ml-0.5 text-indigo-400 font-normal"
                  aria-hidden="true"
                >
                  |
                </span>
              )}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl font-normal leading-relaxed"
          >
            Everything you need to handle checkout, real-time inventory, staff
            price controls, and multiple store locations from one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Start 14-Day Free Trial{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                See How It Works
              </a>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              No setup fees · No contracts · 14-day free access to all features
            </p>
          </motion.div>

          {/* 3. Floating Live-Activity Pill + Dashboard Visual */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 w-full max-w-5xl relative"
          >
            {!reducedMotion && (
              <div
                className="absolute -top-6 -right-2 sm:-right-6 z-20 hidden sm:block"
                aria-hidden="true"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activityIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-gray-100 flex items-center gap-3 w-60 text-left pointer-events-none"
                  >
                    <div className={`p-2 rounded-xl ${currentActivity.color}`}>
                      <ActivityIcon size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {currentActivity.title}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {currentActivity.desc}
                      </p>
                    </div>
                    <span className="text-[9px] font-medium text-gray-400 ml-auto shrink-0">
                      {currentActivity.time}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            <div className="rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-gray-200 to-gray-100 shadow-2xl border border-gray-200 text-left">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 space-y-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                      <Building2 size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        Apex Supermarket & Wholesale
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">
                        Main Branch Counter • Live System Sync
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full bg-emerald-500 ${
                        reducedMotion ? "" : "animate-pulse"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-gray-600">
                      Register Online
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/60">
                    <p className="text-xs font-medium text-gray-500">
                      Today's Revenue
                    </p>
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                      <AnimatedNumber value={2450000} prefix="₦" />
                    </h4>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                      <ArrowUpRight size={12} aria-hidden="true" /> +14.2% vs
                      yesterday
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                    <p className="text-xs font-medium text-gray-500">
                      Net Margin
                    </p>
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                      <AnimatedNumber value={840000} prefix="₦" />
                    </h4>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      34.2% profit ratio
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/60">
                    <p className="text-xs font-medium text-gray-500">
                      Invoices Handled
                    </p>
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                      <AnimatedNumber value={1284} />
                    </h4>
                    <p className="text-[11px] text-blue-600 font-semibold mt-1">
                      0 cashier override alerts
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <TrendingUp
                        size={14}
                        className="text-indigo-600"
                        aria-hidden="true"
                      />
                      Real-time Transaction Pace
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">
                      Diurnal Distribution
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 500 70"
                    className="w-full h-16 overflow-visible"
                    role="img"
                    aria-label="Transaction pace rising through the day"
                  >
                    <path
                      d="M0 55 Q 80 15, 140 40 T 260 15 T 380 45 T 500 20"
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4. Built For Your Business */}
        <section
          id="solutions"
          className="py-20 bg-gray-50/70 border-y border-gray-100 px-6"
        >
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                Tailored Solutions
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                Built specifically for your business model
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <ShoppingBag size={20} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Retail & Boutiques
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  Barcode scanning, instant customer receipts, and accurate
                  stock ledgers for walk-in transactions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Store size={20} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Supermarkets & Marts
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  High-speed checkout for thousands of products, multi-cashier
                  registers, and anti-fraud price checks.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Pill size={20} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Pharmacies & Chemists
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  Strict unit tracking (cartons, cards, individual pieces) and
                  sales log compliance tracking.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Layers size={20} aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Wholesale Depots
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  Customer debt books, partial payment recovery logs, and
                  internal warehouse-to-store stock transfers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Core Features */}
        <section
          id="features"
          className="py-24 px-6 max-w-7xl mx-auto space-y-12"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Core Platform Strengths
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Stop inventory shrinkage and control daily revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck size={22} aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Know Where Your Money Goes
              </h3>
              <p className="text-sm text-gray-600 font-normal leading-relaxed">
                Track sales, card receipts, and bank transfers. Get immediate
                managerial audit visibility whenever an item price is altered.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package size={22} aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Track Stock With Precision
              </h3>
              <p className="text-sm text-gray-600 font-normal leading-relaxed">
                Know when products run low. Audit arrivals, internal movements,
                and count variances without closing store operations.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={22} aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Manage Multiple Outlets
              </h3>
              <p className="text-sm text-gray-600 font-normal leading-relaxed">
                Access your accounts, staff performance, and revenue statements
                across every physical branch through a single login.
              </p>
            </div>
          </div>
        </section>

        {/* 6. How It Works */}
        <section
          id="how-it-works"
          className="py-20 bg-gray-50/70 border-y border-gray-100 px-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                Fast Deployment
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                Up and running in 3 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Step 01
                </span>
                <h3 className="text-base font-bold text-gray-900 pt-1">
                  Create your store account
                </h3>
                <p className="text-sm text-gray-600 font-normal leading-relaxed">
                  Add your business name, set up user logins for your cashiers,
                  and define basic currency parameters.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Step 02
                </span>
                <h3 className="text-base font-bold text-gray-900 pt-1">
                  Add your product inventory
                </h3>
                <p className="text-sm text-gray-600 font-normal leading-relaxed">
                  Quickly add stock items, set your selling prices, carton
                  ratios, and register initial counts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Step 03
                </span>
                <h3 className="text-base font-bold text-gray-900 pt-1">
                  Start processing sales
                </h3>
                <p className="text-sm text-gray-600 font-normal leading-relaxed">
                  Collect payments, issue print receipts via thermal paper, and
                  monitor profits from anywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Social Proof */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Trusted Nationwide
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Businesses running on NexusPOS today
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-14 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                <AnimatedNumber value={2400} suffix="+" />
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Active Businesses
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                <AnimatedNumber value={36} />
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">
                States Covered
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                <AnimatedNumber value={98} suffix="%" />
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Uptime Last Year
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                <AnimatedNumber value={1200000} prefix="₦" />
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Avg. Monthly Sales Tracked
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4"
              >
                <div className="flex gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed font-normal">
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. DYNAMIC DATABASE PRICING SECTION */}
        <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Predictable Pricing
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Simple plans for every stage
            </p>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Every plan includes a 14-day free trial. No card required upfront.
            </p>
          </div>

          {isLoadingPlans ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-xs font-semibold text-gray-500">
                Syncing live plan structures from database...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {dbPlans.map((plan, index) => {
                const isPopular =
                  plan.isPopular ||
                  plan.slug === "business" ||
                  (dbPlans.length === 3 && index === 1)
                const featureList = formatDynamicPlanFeatures(plan)

                if (isPopular) {
                  return (
                    <div
                      key={plan.slug || index}
                      className="p-8 bg-indigo-900 text-white rounded-2xl shadow-xl shadow-indigo-950/20 flex flex-col justify-between relative border border-indigo-800"
                    >
                      <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest bg-indigo-700 text-indigo-100 px-3 py-1 rounded-full">
                        Most Popular
                      </div>

                      <div className="space-y-4">
                        <span className="text-xs font-bold text-indigo-300 uppercase">
                          {plan.name}
                        </span>
                        <h3 className="text-xl font-bold text-white">
                          Growing Outlets
                        </h3>
                        <div className="text-3xl font-black text-white">
                          {formatNaira(plan.price)}{" "}
                          <span className="text-xs font-medium text-indigo-300">
                            / 30 days
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200 leading-relaxed">
                          {plan.tagline ||
                            "Best for growing supermarkets, wholesale stores, and teams with multiple cashiers."}
                        </p>

                        <ul className="space-y-2.5 pt-4 text-xs font-medium text-indigo-100 border-t border-indigo-800/80">
                          {featureList.map((feature, fIndex) => (
                            <li
                              key={fIndex}
                              className="flex items-center gap-2"
                            >
                              <Check
                                size={15}
                                className="text-emerald-400 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link
                        to={`/register?plan=${plan.slug}`}
                        className="mt-8 block text-center py-3 rounded-xl bg-white hover:bg-gray-50 text-indigo-900 text-sm font-semibold shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900"
                      >
                        Start 14-Day Trial
                      </Link>
                    </div>
                  )
                }

                return (
                  <div
                    key={plan.slug || index}
                    className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {plan.name}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">
                        {index === 0 ? "Single Outlet" : "Multi-Branch Chains"}
                      </h3>
                      <div className="text-3xl font-black text-gray-900">
                        {formatNaira(plan.price)}{" "}
                        <span className="text-xs font-medium text-gray-400">
                          / 30 days
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {plan.tagline ||
                          (index === 0
                            ? "Best for single-counter retail shops and neighborhood pharmacies."
                            : "Enterprise-grade multi-location sync with maximum staff accounts.")}
                      </p>

                      <ul className="space-y-2.5 pt-4 text-xs font-medium text-gray-700 border-t border-gray-100">
                        {featureList.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-2">
                            <Check
                              size={15}
                              className="text-emerald-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to={`/register?plan=${plan.slug}`}
                      className="mt-8 block text-center py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      Start 14-Day Trial
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 9. FAQ */}
        <section className="py-20 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Common Questions
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Answers before you get started
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={item.q}
                  className="border border-gray-100 rounded-2xl bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
                  >
                    <span className="text-sm font-bold text-gray-900">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>

        {/* 10. Bottom Conversion Call to Action */}
        <section className="py-20 px-6 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Ready to run your store with confidence?
          </h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Start your 14-day free trial today. No setup fees, no contracts, and
            no credit card required.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Start Your Free Trial <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-xs text-gray-500 font-medium">
        NexusPOS • Developed by Nexus Point Innovation
      </footer>
    </div>
  )
}
