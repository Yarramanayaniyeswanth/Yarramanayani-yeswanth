import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';

export function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-[#0A1628] text-white py-14 sm:py-20 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-emerald-400 mb-3">
            About BLOCKBANK
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-bold tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Bringing cryptographic auditability to everyday savings and banking.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            BLOCKBANK was engineered as an end-to-end banking portal demonstrating how automated personal wealth rules and append-only blockchain hash chains operate together in a unified institutional architecture.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-xs font-semibold text-emerald-700 mb-2">
              01. Transparent Ledgers
            </div>
            <h2 className="font-display text-lg font-bold text-[#0A1628]">
              Every rupee accounted for
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Instead of opaque database rows that can be silently edited, every transaction generates a deterministic Keccak-256 digest chained to its predecessor.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-700 mb-2">
              02. Automated Discipline
            </div>
            <h2 className="font-display text-lg font-bold text-[#0A1628]">
              Habit-driven savings vaults
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Customers define daily, weekly, or monthly savings rules toward specific goals and track completion percentages in real time.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-700 mb-2">
              03. Role Separation
            </div>
            <h2 className="font-display text-lg font-bold text-[#0A1628]">
              Independent compliance oversight
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Administrators authenticate through an isolated console to inspect anomalies, review flagged transactions, and verify hash-chain integrity.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#F4F6F9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white border border-slate-200 rounded-xl p-8">
          <div>
            <h3 className="font-display text-xl font-bold text-[#0A1628]">
              Ready to explore the BLOCKBANK portal?
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Sign in with a demo customer profile or register a fresh test account in seconds.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
