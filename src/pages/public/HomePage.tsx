import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, PiggyBank, ShieldCheck, Wallet } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';

export function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-[#0A1628] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-emerald-400 tracking-wide mb-3">
                Indian Rupee Digital Banking · Cryptographic Audit Ledger
              </p>
              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.12]"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  textWrap: 'balance',
                }}
              >
                Banking clarity backed by automated savings and verifiable audit trails.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                BLOCKBANK pairs everyday Rupee account management and scheduled goal-based savings with an append-only Keccak-256 hash chain that verifies every transaction record.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors whitespace-nowrap"
                >
                  <span>Open Demo Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  <span>Sign In to Portal</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] sm:min-h-[340px] rounded-xl overflow-hidden border border-white/15 bg-[#11223D] relative">
                <img
                  src="/src/assets/images/hero_vault_architecture_1795022668291.jpg"
                  alt="BLOCKBANK institutional architectural atrium"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060E1A]/85 via-[#060E1A]/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-200">
                  <span>Keccak-256 Hash-Chain Ledger</span>
                  <span className="font-mono tabular-nums text-emerald-300">
                    INR (₹) Sandbox Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Quantitative Proof Strip */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                ₹100+
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Configurable daily, weekly, or monthly savings rules
              </div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-emerald-400">
                256-bit
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Keccak cryptographic transaction & block digest linking
              </div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                100%
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Append-only audit trail coverage across transfers & admin actions
              </div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                6.25% p.a.
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Simulated reference yield for goal-based savings vaults
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Bento Grid */}
      <section className="py-16 lg:py-20 bg-[#F4F6F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-emerald-700 mb-2">
              Core Banking Architecture
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold text-[#0A1628] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Built for transparent personal banking and institutional oversight.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-xs font-medium text-slate-500">
                    01. Automatic Savings Engine
                  </span>
                  <PiggyBank className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#0A1628]">
                  Scheduled Rupee transfers toward dedicated goals
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
                  Configure daily, weekly, or monthly savings rules—such as ₹100 daily into an Emergency Reserve—and pause, resume, or simulate cycles at any time with full ledger receipts.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-[#0A1628] block">
                    Goal Tracking
                  </span>
                  Progress bars & target forecasts
                </div>
                <div>
                  <span className="font-semibold text-[#0A1628] block">
                    Instant Pause & Resume
                  </span>
                  Full customer control per rule
                </div>
                <div>
                  <span className="font-semibold text-[#0A1628] block">
                    Ledger Sync
                  </span>
                  Every sweep generates a block hash
                </div>
              </div>
            </div>

            <div className="bg-[#0A1628] text-white border border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-xs font-medium text-emerald-400">
                    02. Hash-Chain Audit
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Tamper-evident block verification
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Every deposit, transfer, and savings sweep links to the previous block hash via Ethers.js Keccak-256 digests, with optional Ethereum testnet anchoring.
                </p>
              </div>
              <Link
                to="/security"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <span>Inspect security model</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-medium text-slate-500">
                  03. Demo Money Transfers
                </span>
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#0A1628]">
                Validated transfers & PDF statements
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Send test INR balances with duplicate-request protection, review receipts, filter history, and download formatted PDF statements.
              </p>
            </div>

            <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-xs font-medium text-slate-500">
                    04. Separate Governance Console
                  </span>
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#0A1628]">
                  Role-isolated Admin Dashboard & Compliance Reports
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Dedicated administrator portal for customer account status controls, pending/failed transaction reviews, full hash-chain integrity verification, and downloadable audit reports.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#0A1628] hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <span>Admin Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Feature Spotlight */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-5">
              <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src="/src/assets/images/savings_card_editorial_1795022668659.jpg"
                  alt="Matte navy banking card and silver timepiece"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-semibold text-emerald-700 mb-2">
                Designed for Disciplined Wealth Building
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0A1628] tracking-tight">
                Consistent micro-savings meet verifiable ledger accountability.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                Every customer profile comes equipped with a masked primary Checking account and an isolated Auto-Savings Vault. Explore live analytics, simulate daily transfers, and inspect cryptographic block proofs in real time.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Masked account numbers protect sensitive identifiers across views</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant verification of any transaction against its parent block hash</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exportable PDF statements and compliance audit summaries</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-600"
                >
                  <span>View all banking capabilities</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
