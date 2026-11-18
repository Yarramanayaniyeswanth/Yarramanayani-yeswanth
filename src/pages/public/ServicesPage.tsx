import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Blocks, FileText, PiggyBank, Send } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';

export function ServicesPage() {
  const services = [
    {
      num: '01',
      title: 'Customer Banking Portal',
      description:
        'Real-time INR account balances, masked account numbers, income vs. expense summaries, and instant notifications.',
      icon: BarChart3,
    },
    {
      num: '02',
      title: 'Automatic Savings System',
      description:
        'Configure daily, weekly, or monthly savings rules with target milestones, pause/resume controls, and scheduled simulation.',
      icon: PiggyBank,
    },
    {
      num: '03',
      title: 'Validated Demo Transfers',
      description:
        'Execute test transfers with balance checks, idempotency-based duplicate prevention, status tracking, and instant receipts.',
      icon: Send,
    },
    {
      num: '04',
      title: 'Blockchain Audit Explorer',
      description:
        'Inspect block numbers, previous and current Keccak-256 hashes, and verify individual records or the full ledger chain.',
      icon: Blocks,
    },
    {
      num: '05',
      title: 'PDF Statements & Analytics',
      description:
        'Filter transaction history by date, status, or type and export formatted PDF statements and administrative compliance reports.',
      icon: FileText,
    },
  ];

  return (
    <PublicLayout>
      <section className="bg-[#0A1628] text-white py-14 sm:py-20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-emerald-400 mb-3">
            Banking Services
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight max-w-3xl">
            Complete banking workflows designed for verification and speed.
          </h1>
          <p className="mt-4 text-base text-slate-300 max-w-2xl">
            Every module in BLOCKBANK operates on a unified ledger—linking customer actions directly to cryptographic audit proofs.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-[#F4F6F9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.num}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 rounded-lg bg-[#0A1628] text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-500 mb-1">
                      {svc.num}. Service Module
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#0A1628]">
                      {svc.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
                      {svc.description}
                    </p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-600 whitespace-nowrap shrink-0"
                >
                  <span>Try in Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}
