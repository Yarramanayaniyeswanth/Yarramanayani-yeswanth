import { CheckCircle2, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';

export function SecurityPage() {
  return (
    <PublicLayout>
      <section className="bg-[#0A1628] text-white py-14 sm:py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium text-emerald-400 mb-3">
              Security & Audit Architecture
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
              Cryptographic integrity from login to block finality.
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-2xl">
              BLOCKBANK combines salted scrypt credential verification, role-isolated HMAC sessions, masked customer identifiers, and an append-only Keccak-256 hash chain backed by a Solidity audit contract.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="h-full min-h-[240px] rounded-xl overflow-hidden border border-white/15 bg-[#11223D]">
              <img
                src="/src/assets/images/security_ledger_hardware_1795022669262.jpg"
                alt="Cryptographic hardware security ledger module"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-200 rounded-xl p-6">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mb-4" />
            <h2 className="font-display text-lg font-bold text-[#0A1628]">
              Hash-Chain Tamper Detection
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Each block computes its digest over block number, transaction ID, transaction Keccak-256 hash, parent block hash, and timestamp. Any mutation breaks downstream verification.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6">
            <KeyRound className="w-6 h-6 text-emerald-600 mb-4" />
            <h2 className="font-display text-lg font-bold text-[#0A1628]">
              Credential & Session Hardening
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Passwords are never stored in plain text—every account uses per-user random salts with Node scrypt derivation and HTTP-only HMAC-SHA256 signed cookies.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6">
            <Lock className="w-6 h-6 text-emerald-600 mb-4" />
            <h2 className="font-display text-lg font-bold text-[#0A1628]">
              Append-Only Governance
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Administrative actions—including account activation, transaction reviews, and configuration updates—create immutable audit log entries that cannot be silently erased.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-[#F4F6F9] border border-slate-200 rounded-xl p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-[#0A1628] mb-3">
              Smart Contract & Local Simulation Transparency
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              BLOCKBANK ships with <span className="font-mono text-xs bg-white px-1.5 py-0.5 border border-slate-200 rounded">contracts/BlockBankAudit.sol</span> and Hardhat configuration for Ethereum-compatible testnets (Sepolia/Holesky). When testnet RPC credentials are not configured in the server environment, the system operates in a clearly labeled Local Hash-Chain Simulation mode using Ethers.js Keccak-256 hashing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Duplicate transfer prevention via idempotency keys</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sensitive account numbers masked across UI & APIs</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
