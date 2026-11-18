import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth';
import {
  computeAuditRecordHash,
  computeBlockHash,
  computeTransactionHash,
  GENESIS_PREVIOUS_HASH,
} from './blockchain';
import {
  AccountDoc,
  AuditLogDoc,
  BlockchainRecordDoc,
  DatabaseSchema,
  NotificationDoc,
  SavingsHistoryDoc,
  SavingsRuleDoc,
  TransactionDoc,
  TransactionStatus,
  TransactionType,
} from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'blockbank-db.json');

export function maskAccountNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const last4 = digits.slice(-4).padStart(4, '0');
  return `•••• •••• ${last4}`;
}

function daysAgoIso(days: number, hourOffset = 10): string {
  const d = new Date(Date.now() - days * 86400_000);
  d.setHours(hourOffset, 15, 0, 0);
  return d.toISOString();
}

function daysAheadIso(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function createInitialSeedData(): DatabaseSchema {
  const adminEmail =
    process.env.ADMIN_BOOTSTRAP_EMAIL?.trim() || 'admin@blockbank.in';
  const adminPass =
    process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || 'BlockBank@Admin2026';
  const adminPwd = hashPassword(adminPass);

  const demoCustPwd = hashPassword('DemoCustomer@2026');
  const priyaPwd = hashPassword('Priya@2026');
  const rohanPwd = hashPassword('Rohan@2026');
  const ananyaPwd = hashPassword('Ananya@2026');

  const users = [
    {
      id: 'usr_aarav_01',
      fullName: 'Aarav Mehta',
      email: 'aarav.mehta@example.in',
      phone: '+91 98204 51290',
      passwordHash: demoCustPwd.hash,
      salt: demoCustPwd.salt,
      kycStatus: 'Verified' as const,
      accountTier: 'Premium Savings' as const,
      status: 'Active' as const,
      city: 'Mumbai, MH',
      createdAt: daysAgoIso(160),
      lastLoginAt: daysAgoIso(1),
    },
    {
      id: 'usr_priya_02',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.in',
      phone: '+91 98112 73841',
      passwordHash: priyaPwd.hash,
      salt: priyaPwd.salt,
      kycStatus: 'Verified' as const,
      accountTier: 'Institutional Reserve' as const,
      status: 'Active' as const,
      city: 'Bengaluru, KA',
      createdAt: daysAgoIso(125),
      lastLoginAt: daysAgoIso(2),
    },
    {
      id: 'usr_rohan_03',
      fullName: 'Rohan Kulkarni',
      email: 'rohan.kulkarni@example.in',
      phone: '+91 97654 20983',
      passwordHash: rohanPwd.hash,
      salt: rohanPwd.salt,
      kycStatus: 'Verified' as const,
      accountTier: 'Digital Checking' as const,
      status: 'Active' as const,
      city: 'Pune, MH',
      createdAt: daysAgoIso(92),
      lastLoginAt: daysAgoIso(4),
    },
    {
      id: 'usr_ananya_04',
      fullName: 'Ananya Iyer',
      email: 'ananya.iyer@example.in',
      phone: '+91 98401 66712',
      passwordHash: ananyaPwd.hash,
      salt: ananyaPwd.salt,
      kycStatus: 'Verified' as const,
      accountTier: 'Premium Savings' as const,
      status: 'Active' as const,
      city: 'Chennai, TN',
      createdAt: daysAgoIso(48),
      lastLoginAt: daysAgoIso(1),
    },
  ];

  const adminUsers = [
    {
      id: 'adm_root_01',
      fullName: 'Siddharth Verma',
      email: adminEmail,
      passwordHash: adminPwd.hash,
      salt: adminPwd.salt,
      roleTitle: 'Chief Compliance & Treasury Admin',
      permissions: [
        'customers:manage',
        'transactions:review',
        'blockchain:verify',
        'reports:export',
        'settings:update',
      ],
      status: 'Active' as const,
      createdAt: daysAgoIso(200),
      lastLoginAt: daysAgoIso(0, 8),
    },
  ];

  const accounts: AccountDoc[] = [
    {
      id: 'acc_aarav_chk',
      userId: 'usr_aarav_01',
      accountNumberRaw: '501004829104',
      accountNumberMasked: '•••• •••• 9104',
      ifscCode: 'BLKB0001042',
      branchName: 'BKC Financial Hub, Mumbai',
      accountType: 'Checking',
      balance: 184500,
      availableBalance: 184500,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(160),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'acc_aarav_sav',
      userId: 'usr_aarav_01',
      accountNumberRaw: '501004824419',
      accountNumberMasked: '•••• •••• 4419',
      ifscCode: 'BLKB0001042',
      branchName: 'BKC Financial Hub, Mumbai',
      accountType: 'Auto-Savings Vault',
      balance: 68400,
      availableBalance: 68400,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(160),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'acc_priya_chk',
      userId: 'usr_priya_02',
      accountNumberRaw: '501007723310',
      accountNumberMasked: '•••• •••• 3310',
      ifscCode: 'BLKB0002018',
      branchName: 'Indiranagar Tech Corridor, Bengaluru',
      accountType: 'Checking',
      balance: 242800,
      availableBalance: 242800,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(125),
      updatedAt: daysAgoIso(2),
    },
    {
      id: 'acc_priya_sav',
      userId: 'usr_priya_02',
      accountNumberRaw: '501007728825',
      accountNumberMasked: '•••• •••• 8825',
      ifscCode: 'BLKB0002018',
      branchName: 'Indiranagar Tech Corridor, Bengaluru',
      accountType: 'Auto-Savings Vault',
      balance: 115000,
      availableBalance: 115000,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(125),
      updatedAt: daysAgoIso(2),
    },
    {
      id: 'acc_rohan_chk',
      userId: 'usr_rohan_03',
      accountNumberRaw: '501009316044',
      accountNumberMasked: '•••• •••• 6044',
      ifscCode: 'BLKB0003091',
      branchName: 'Shivajinagar Center, Pune',
      accountType: 'Checking',
      balance: 96200,
      availableBalance: 96200,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(92),
      updatedAt: daysAgoIso(4),
    },
    {
      id: 'acc_rohan_sav',
      userId: 'usr_rohan_03',
      accountNumberRaw: '501009311207',
      accountNumberMasked: '•••• •••• 1207',
      ifscCode: 'BLKB0003091',
      branchName: 'Shivajinagar Center, Pune',
      accountType: 'Savings',
      balance: 41500,
      availableBalance: 41500,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(92),
      updatedAt: daysAgoIso(4),
    },
    {
      id: 'acc_ananya_chk',
      userId: 'usr_ananya_04',
      accountNumberRaw: '501005487732',
      accountNumberMasked: '•••• •••• 7732',
      ifscCode: 'BLKB0004055',
      branchName: 'Anna Salai Branch, Chennai',
      accountType: 'Checking',
      balance: 312000,
      availableBalance: 312000,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(48),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'acc_ananya_sav',
      userId: 'usr_ananya_04',
      accountNumberRaw: '501005489901',
      accountNumberMasked: '•••• •••• 9901',
      ifscCode: 'BLKB0004055',
      branchName: 'Anna Salai Branch, Chennai',
      accountType: 'Auto-Savings Vault',
      balance: 190000,
      availableBalance: 190000,
      currency: 'INR',
      status: 'Active',
      createdAt: daysAgoIso(48),
      updatedAt: daysAgoIso(1),
    },
  ];

  // Seed chronologically ordered transactions so hash chain starts cleanly from Block #1
  const rawTxSpecs: Array<{
    id: string;
    userId: string;
    senderRef: string;
    receiverRef: string;
    receiverName: string;
    type: TransactionType;
    amount: number;
    description: string;
    status: TransactionStatus;
    daysAgo: number;
    hour: number;
  }> = [
    {
      id: 'TXN-2026-1001',
      userId: 'usr_aarav_01',
      senderRef: 'EXT-NEFT-RESERVE',
      receiverRef: '•••• •••• 9104',
      receiverName: 'Aarav Mehta',
      type: 'Deposit',
      amount: 145000,
      description: 'Monthly Salary Credit — Horizon Systems Pvt Ltd',
      status: 'Successful',
      daysAgo: 118,
      hour: 9,
    },
    {
      id: 'TXN-2026-1002',
      userId: 'usr_priya_02',
      senderRef: 'EXT-IMPS-TREASURY',
      receiverRef: '•••• •••• 3310',
      receiverName: 'Priya Sharma',
      type: 'Deposit',
      amount: 210000,
      description: 'Advisory Retainer Settlement',
      status: 'Successful',
      daysAgo: 95,
      hour: 11,
    },
    {
      id: 'TXN-2026-1003',
      userId: 'usr_aarav_01',
      senderRef: '•••• •••• 9104',
      receiverRef: '•••• •••• 4419',
      receiverName: 'Emergency Corpus Vault',
      type: 'Auto-Savings',
      amount: 15000,
      description: 'Monthly Scheduled Auto-Savings Rule',
      status: 'Successful',
      daysAgo: 72,
      hour: 8,
    },
    {
      id: 'TXN-2026-1004',
      userId: 'usr_rohan_03',
      senderRef: '•••• •••• 6044',
      receiverRef: '•••• •••• 3310',
      receiverName: 'Priya Sharma',
      type: 'Transfer',
      amount: 18500,
      description: 'Architecture Design Milestone Payment',
      status: 'Successful',
      daysAgo: 54,
      hour: 15,
    },
    {
      id: 'TXN-2026-1005',
      userId: 'usr_ananya_04',
      senderRef: 'EXT-RTGS-CORP',
      receiverRef: '•••• •••• 7732',
      receiverName: 'Ananya Iyer',
      type: 'Deposit',
      amount: 280000,
      description: 'Quarterly Consultancy Disbursement',
      status: 'Successful',
      daysAgo: 42,
      hour: 10,
    },
    {
      id: 'TXN-2026-1006',
      userId: 'usr_aarav_01',
      senderRef: 'EXT-NEFT-RESERVE',
      receiverRef: '•••• •••• 9104',
      receiverName: 'Aarav Mehta',
      type: 'Deposit',
      amount: 145000,
      description: 'Monthly Salary Credit — Horizon Systems Pvt Ltd',
      status: 'Successful',
      daysAgo: 28,
      hour: 9,
    },
    {
      id: 'TXN-2026-1007',
      userId: 'usr_aarav_01',
      senderRef: '•••• •••• 9104',
      receiverRef: 'MERCH-RENT-8841',
      receiverName: 'Bandra Residential Trust',
      type: 'Withdrawal',
      amount: 42000,
      description: 'Monthly Apartment Lease Payment',
      status: 'Successful',
      daysAgo: 24,
      hour: 12,
    },
    {
      id: 'TXN-2026-1008',
      userId: 'usr_aarav_01',
      senderRef: '•••• •••• 9104',
      receiverRef: '•••• •••• 4419',
      receiverName: 'Emergency Corpus Vault',
      type: 'Auto-Savings',
      amount: 5000,
      description: 'Monthly Scheduled Auto-Savings Rule',
      status: 'Successful',
      daysAgo: 18,
      hour: 8,
    },
    {
      id: 'TXN-2026-1009',
      userId: 'usr_priya_02',
      senderRef: '•••• •••• 3310',
      receiverRef: '•••• •••• 8825',
      receiverName: 'Home Downpayment Vault',
      type: 'Auto-Savings',
      amount: 15000,
      description: 'Weekly Automated Vault Sweep',
      status: 'Successful',
      daysAgo: 12,
      hour: 8,
    },
    {
      id: 'TXN-2026-1010',
      userId: 'usr_aarav_01',
      senderRef: '•••• •••• 9104',
      receiverRef: '•••• •••• 6044',
      receiverName: 'Rohan Kulkarni',
      type: 'Transfer',
      amount: 12400,
      description: 'Shared Cloud Infrastructure Reimbursement',
      status: 'Successful',
      daysAgo: 9,
      hour: 16,
    },
    {
      id: 'TXN-2026-1011',
      userId: 'usr_rohan_03',
      senderRef: '•••• •••• 6044',
      receiverRef: 'EXT-INVALID-9921',
      receiverName: 'Unverified External Merchant',
      type: 'Transfer',
      amount: 125000,
      description: 'Vendor Equipment Settlement (Limit Exceeded)',
      status: 'Failed',
      daysAgo: 6,
      hour: 14,
    },
    {
      id: 'TXN-2026-1012',
      userId: 'usr_aarav_01',
      senderRef: '•••• •••• 9104',
      receiverRef: 'MERCH-ELEC-3029',
      receiverName: 'Tata Power Utilities',
      type: 'Withdrawal',
      amount: 3850,
      description: 'Monthly Utility Bill Auto-Pay',
      status: 'Successful',
      daysAgo: 4,
      hour: 11,
    },
    {
      id: 'TXN-2026-1013',
      userId: 'usr_ananya_04',
      senderRef: '•••• •••• 7732',
      receiverRef: '•••• •••• 9901',
      receiverName: 'Tax Reserve Vault',
      type: 'Auto-Savings',
      amount: 10000,
      description: 'Daily Auto-Savings Batch Settlement',
      status: 'Successful',
      daysAgo: 2,
      hour: 9,
    },
    {
      id: 'TXN-2026-1014',
      userId: 'usr_aarav_01',
      senderRef: '•••• •••• 9104',
      receiverRef: '•••• •••• 3310',
      receiverName: 'Priya Sharma',
      type: 'Transfer',
      amount: 24500,
      description: 'Q4 Audit Review Retainer',
      status: 'Pending',
      daysAgo: 1,
      hour: 17,
    },
  ];

  const transactions: TransactionDoc[] = [];
  const blockchainRecords: BlockchainRecordDoc[] = [];
  let prevHash = GENESIS_PREVIOUS_HASH;

  rawTxSpecs.forEach((spec, idx) => {
    const blockNumber = idx + 1;
    const timestamp = daysAgoIso(spec.daysAgo, spec.hour);
    const txHash = computeTransactionHash({
      transactionId: spec.id,
      senderRef: spec.senderRef,
      receiverRef: spec.receiverRef,
      amount: spec.amount,
      status: spec.status,
      timestamp,
    });
    const currentBlockHash = computeBlockHash({
      blockNumber,
      transactionId: spec.id,
      transactionHash: txHash,
      previousBlockHash: prevHash,
      timestamp,
    });

    transactions.push({
      id: spec.id,
      userId: spec.userId,
      senderRef: spec.senderRef,
      receiverRef: spec.receiverRef,
      receiverName: spec.receiverName,
      type: spec.type,
      amount: spec.amount,
      currency: 'INR',
      description: spec.description,
      status: spec.status,
      transactionHash: txHash,
      previousBlockHash: prevHash,
      currentBlockHash,
      blockNumber,
      verificationStatus: spec.status === 'Pending' ? 'Pending' : 'Verified',
      createdAt: timestamp,
    });

    blockchainRecords.push({
      blockNumber,
      transactionId: spec.id,
      senderRef: spec.senderRef,
      receiverRef: spec.receiverRef,
      amount: spec.amount,
      txStatus: spec.status,
      transactionHash: txHash,
      previousBlockHash: prevHash,
      currentBlockHash,
      timestamp,
      networkMode: 'Local Hash-Chain Simulation',
      verified: true,
    });

    prevHash = currentBlockHash;
  });

  const savingsRules: SavingsRuleDoc[] = [
    {
      id: 'sav_rule_01',
      userId: 'usr_aarav_01',
      goalName: 'Emergency Reserve Corpus',
      cadence: 'Daily',
      amount: 250,
      targetAmount: 100000,
      savedAmount: 43400,
      status: 'Active',
      nextScheduledAt: daysAheadIso(1),
      lastExecutedAt: daysAgoIso(1, 8),
      createdAt: daysAgoIso(120),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'sav_rule_02',
      userId: 'usr_aarav_01',
      goalName: 'Tax & Retirement Treasury',
      cadence: 'Monthly',
      amount: 5000,
      targetAmount: 150000,
      savedAmount: 25000,
      status: 'Active',
      nextScheduledAt: daysAheadIso(12),
      lastExecutedAt: daysAgoIso(18, 8),
      createdAt: daysAgoIso(90),
      updatedAt: daysAgoIso(18),
    },
    {
      id: 'sav_rule_03',
      userId: 'usr_priya_02',
      goalName: 'Home Downpayment Fund',
      cadence: 'Weekly',
      amount: 3500,
      targetAmount: 500000,
      savedAmount: 115000,
      status: 'Active',
      nextScheduledAt: daysAheadIso(4),
      lastExecutedAt: daysAgoIso(3, 8),
      createdAt: daysAgoIso(110),
      updatedAt: daysAgoIso(3),
    },
    {
      id: 'sav_rule_04',
      userId: 'usr_rohan_03',
      goalName: 'Equipment Upgrade Fund',
      cadence: 'Monthly',
      amount: 3000,
      targetAmount: 80000,
      savedAmount: 41500,
      status: 'Paused',
      nextScheduledAt: daysAheadIso(20),
      lastExecutedAt: daysAgoIso(34, 8),
      createdAt: daysAgoIso(85),
      updatedAt: daysAgoIso(10),
    },
    {
      id: 'sav_rule_05',
      userId: 'usr_ananya_04',
      goalName: 'Quarterly Tax Vault',
      cadence: 'Daily',
      amount: 500,
      targetAmount: 250000,
      savedAmount: 190000,
      status: 'Active',
      nextScheduledAt: daysAheadIso(1),
      lastExecutedAt: daysAgoIso(1, 9),
      createdAt: daysAgoIso(45),
      updatedAt: daysAgoIso(1),
    },
  ];

  const savingsHistory: SavingsHistoryDoc[] = [
    {
      id: 'sh_01',
      ruleId: 'sav_rule_02',
      userId: 'usr_aarav_01',
      goalName: 'Tax & Retirement Treasury',
      cadence: 'Monthly',
      amount: 15000,
      balanceAfter: 63150,
      transactionId: 'TXN-2026-1003',
      transactionHash: transactions[2].transactionHash,
      executedAt: daysAgoIso(72, 8),
    },
    {
      id: 'sh_02',
      ruleId: 'sav_rule_02',
      userId: 'usr_aarav_01',
      goalName: 'Tax & Retirement Treasury',
      cadence: 'Monthly',
      amount: 5000,
      balanceAfter: 68150,
      transactionId: 'TXN-2026-1008',
      transactionHash: transactions[7].transactionHash,
      executedAt: daysAgoIso(18, 8),
    },
    {
      id: 'sh_03',
      ruleId: 'sav_rule_01',
      userId: 'usr_aarav_01',
      goalName: 'Emergency Reserve Corpus',
      cadence: 'Daily',
      amount: 250,
      balanceAfter: 68400,
      transactionId: 'TXN-2026-1008',
      transactionHash: transactions[7].transactionHash,
      executedAt: daysAgoIso(1, 8),
    },
    {
      id: 'sh_04',
      ruleId: 'sav_rule_03',
      userId: 'usr_priya_02',
      goalName: 'Home Downpayment Fund',
      cadence: 'Weekly',
      amount: 15000,
      balanceAfter: 115000,
      transactionId: 'TXN-2026-1009',
      transactionHash: transactions[8].transactionHash,
      executedAt: daysAgoIso(12, 8),
    },
    {
      id: 'sh_05',
      ruleId: 'sav_rule_05',
      userId: 'usr_ananya_04',
      goalName: 'Quarterly Tax Vault',
      cadence: 'Daily',
      amount: 10000,
      balanceAfter: 190000,
      transactionId: 'TXN-2026-1013',
      transactionHash: transactions[12].transactionHash,
      executedAt: daysAgoIso(2, 9),
    },
  ];

  const rawLogs = [
    {
      id: 'AUD-101',
      actorId: 'system',
      actorRole: 'system' as const,
      actorName: 'BLOCKBANK Ledger Engine',
      action: 'GENESIS_CHAIN_INITIALIZED',
      targetType: 'BlockchainRecord',
      targetId: 'BLOCK-1',
      details: 'Initialized cryptographic Keccak-256 audit chain with genesis anchor.',
      createdAt: daysAgoIso(160),
    },
    {
      id: 'AUD-102',
      actorId: 'usr_aarav_01',
      actorRole: 'customer' as const,
      actorName: 'Aarav Mehta',
      action: 'AUTO_SAVINGS_RULE_CREATED',
      targetType: 'SavingsRule',
      targetId: 'sav_rule_01',
      details: 'Configured Daily automatic savings of ₹250.00 toward Emergency Reserve Corpus.',
      createdAt: daysAgoIso(120),
    },
    {
      id: 'AUD-103',
      actorId: 'adm_root_01',
      actorRole: 'admin' as const,
      actorName: 'Siddharth Verma',
      action: 'FAILED_TRANSACTION_FLAGGED',
      targetType: 'Transaction',
      targetId: 'TXN-2026-1011',
      details: 'Flagged failed external transfer (₹1,25,000.00) for exceeding single-transfer limit.',
      createdAt: daysAgoIso(6, 15),
    },
    {
      id: 'AUD-104',
      actorId: 'adm_root_01',
      actorRole: 'admin' as const,
      actorName: 'Siddharth Verma',
      action: 'FULL_HASH_CHAIN_VERIFIED',
      targetType: 'BlockchainRecord',
      targetId: 'CHAIN-HEAD',
      details: 'Verified all 14 blocks in the transaction hash-chain with zero discrepancies.',
      createdAt: daysAgoIso(1, 18),
    },
  ];

  const auditLogs: AuditLogDoc[] = rawLogs.map((l) => ({
    ...l,
    recordHash: computeAuditRecordHash(l),
  }));

  const notifications: NotificationDoc[] = [
    {
      id: 'ntf_01',
      userId: 'usr_aarav_01',
      category: 'Savings',
      title: 'Daily Auto-Savings Executed',
      message: 'Simulated transfer of ₹250.00 moved from Checking (•••• 9104) to Emergency Reserve Corpus.',
      read: false,
      createdAt: daysAgoIso(1, 8),
    },
    {
      id: 'ntf_02',
      userId: 'usr_aarav_01',
      category: 'Transfer',
      title: 'Transfer Pending Confirmation',
      message: 'Demo transfer TXN-2026-1014 of ₹24,500.00 to Priya Sharma is awaiting compliance review.',
      read: false,
      createdAt: daysAgoIso(1, 17),
    },
    {
      id: 'ntf_03',
      userId: 'usr_aarav_01',
      category: 'Security',
      title: 'Cryptographic Audit Anchored',
      message: 'Your recent utility payment TXN-2026-1012 was sealed in Block #12 with Keccak-256 verification.',
      read: true,
      createdAt: daysAgoIso(4, 11),
    },
    {
      id: 'ntf_04',
      userId: 'ALL_CUSTOMERS',
      category: 'System',
      title: 'Scheduled Hash-Chain Audit Complete',
      message: 'Routine integrity audit verified 100% of ledger blocks across all test accounts.',
      read: false,
      createdAt: daysAgoIso(2, 10),
    },
  ];

  return {
    users,
    adminUsers,
    accounts,
    transactions,
    savingsRules,
    savingsHistory,
    blockchainRecords,
    auditLogs,
    notifications,
    contactInquiries: [],
    settings: {
      simulatedAnnualYieldPct: 6.25,
      maxSingleTransferInr: 100000,
      autoSavingsCycleEnabled: true,
      strictDuplicateCheckWindowSec: 30,
      updatedAt: daysAgoIso(5),
      updatedBy: 'Siddharth Verma',
    },
  };
}

let cachedDb: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      cachedDb = JSON.parse(raw) as DatabaseSchema;
      return cachedDb;
    } catch {
      // If file corrupted, re-seed cleanly
    }
  }

  cachedDb = createInitialSeedData();
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(db: DatabaseSchema): void {
  cachedDb = db;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

/**
 * Helper to append an immutable transaction + blockchain record atomically.
 */
export function appendTransactionWithBlock(
  db: DatabaseSchema,
  params: {
    idempotencyKey?: string;
    userId: string;
    senderRef: string;
    receiverRef: string;
    receiverName: string;
    type: TransactionType;
    amount: number;
    description: string;
    status: TransactionStatus;
  }
): { transaction: TransactionDoc; block: BlockchainRecordDoc } {
  const timestamp = new Date().toISOString();
  const nextSeq = 1001 + db.transactions.length;
  const txId = `TXN-2026-${nextSeq}`;

  const sortedBlocks = [...db.blockchainRecords].sort(
    (a, b) => a.blockNumber - b.blockNumber
  );
  const latestBlock = sortedBlocks[sortedBlocks.length - 1];
  const blockNumber = latestBlock ? latestBlock.blockNumber + 1 : 1;
  const previousBlockHash = latestBlock
    ? latestBlock.currentBlockHash
    : GENESIS_PREVIOUS_HASH;

  const transactionHash = computeTransactionHash({
    transactionId: txId,
    senderRef: params.senderRef,
    receiverRef: params.receiverRef,
    amount: params.amount,
    status: params.status,
    timestamp,
  });

  const currentBlockHash = computeBlockHash({
    blockNumber,
    transactionId: txId,
    transactionHash,
    previousBlockHash,
    timestamp,
  });

  const transaction: TransactionDoc = {
    id: txId,
    idempotencyKey: params.idempotencyKey,
    userId: params.userId,
    senderRef: params.senderRef,
    receiverRef: params.receiverRef,
    receiverName: params.receiverName,
    type: params.type,
    amount: params.amount,
    currency: 'INR',
    description: params.description,
    status: params.status,
    transactionHash,
    previousBlockHash,
    currentBlockHash,
    blockNumber,
    verificationStatus: params.status === 'Pending' ? 'Pending' : 'Verified',
    createdAt: timestamp,
  };

  const block: BlockchainRecordDoc = {
    blockNumber,
    transactionId: txId,
    senderRef: params.senderRef,
    receiverRef: params.receiverRef,
    amount: params.amount,
    txStatus: params.status,
    transactionHash,
    previousBlockHash,
    currentBlockHash,
    timestamp,
    networkMode: 'Local Hash-Chain Simulation',
    verified: true,
  };

  db.transactions.unshift(transaction);
  db.blockchainRecords.push(block);

  return { transaction, block };
}

/**
 * Helper to append an immutable audit log entry.
 */
export function appendAuditLog(
  db: DatabaseSchema,
  params: {
    actorId: string;
    actorRole: 'customer' | 'admin' | 'system';
    actorName: string;
    action: string;
    targetType: string;
    targetId: string;
    details: string;
  }
): AuditLogDoc {
  const id = `AUD-${101 + db.auditLogs.length}`;
  const createdAt = new Date().toISOString();
  const entry: AuditLogDoc = {
    id,
    ...params,
    createdAt,
    recordHash: computeAuditRecordHash({
      id,
      actorId: params.actorId,
      action: params.action,
      targetId: params.targetId,
      createdAt,
    }),
  };
  db.auditLogs.unshift(entry);
  return entry;
}

/**
 * Helper to add a notification for a customer or all customers.
 */
export function addNotification(
  db: DatabaseSchema,
  params: {
    userId: string;
    category: 'Savings' | 'Transfer' | 'Security' | 'System';
    title: string;
    message: string;
  }
): NotificationDoc {
  const ntf: NotificationDoc = {
    id: `ntf_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...params,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(ntf);
  return ntf;
}
