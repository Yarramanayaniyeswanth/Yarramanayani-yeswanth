export type UserRole = 'customer' | 'admin';

export interface UserDoc {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  salt: string;
  kycStatus: 'Verified' | 'Pending';
  accountTier: 'Premium Savings' | 'Digital Checking' | 'Institutional Reserve';
  status: 'Active' | 'Deactivated';
  city: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminUserDoc {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  salt: string;
  roleTitle: string;
  permissions: string[];
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLoginAt: string;
}

export interface AccountDoc {
  id: string;
  userId: string;
  accountNumberMasked: string;
  accountNumberRaw: string; // Stored server-side only; never exposed in full to UI
  ifscCode: string;
  branchName: string;
  accountType: 'Checking' | 'Savings' | 'Auto-Savings Vault';
  balance: number;
  availableBalance: number;
  currency: 'INR';
  status: 'Active' | 'Deactivated';
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'Transfer'
  | 'Auto-Savings'
  | 'Deposit'
  | 'Withdrawal'
  | 'Fee Refund';

export type TransactionStatus =
  | 'Pending'
  | 'Successful'
  | 'Failed'
  | 'Cancelled';

export interface TransactionDoc {
  id: string;
  idempotencyKey?: string;
  userId: string;
  senderRef: string;
  receiverRef: string;
  receiverName: string;
  type: TransactionType;
  amount: number;
  currency: 'INR';
  description: string;
  status: TransactionStatus;
  transactionHash: string;
  previousBlockHash: string;
  currentBlockHash: string;
  blockNumber: number;
  verificationStatus: 'Verified' | 'Pending' | 'Tampered';
  createdAt: string;
}

export type SavingsCadence = 'Daily' | 'Weekly' | 'Monthly';

export interface SavingsRuleDoc {
  id: string;
  userId: string;
  goalName: string;
  cadence: SavingsCadence;
  amount: number;
  targetAmount: number;
  savedAmount: number;
  status: 'Active' | 'Paused';
  nextScheduledAt: string;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsHistoryDoc {
  id: string;
  ruleId: string;
  userId: string;
  goalName: string;
  cadence: SavingsCadence;
  amount: number;
  balanceAfter: number;
  transactionId: string;
  transactionHash: string;
  executedAt: string;
}

export interface BlockchainRecordDoc {
  blockNumber: number;
  transactionId: string;
  senderRef: string;
  receiverRef: string;
  amount: number;
  txStatus: TransactionStatus;
  transactionHash: string;
  previousBlockHash: string;
  currentBlockHash: string;
  timestamp: string;
  networkMode: 'Local Hash-Chain Simulation' | 'Ethereum Testnet Anchored';
  testnetTxHash?: string;
  verified: boolean;
}

export interface AuditLogDoc {
  id: string;
  actorId: string;
  actorRole: 'customer' | 'admin' | 'system';
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  recordHash: string;
  createdAt: string;
}

export interface NotificationDoc {
  id: string;
  userId: string; // 'ALL_CUSTOMERS' or specific userId
  category: 'Savings' | 'Transfer' | 'Security' | 'System';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ContactInquiryDoc {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface PlatformSettingsDoc {
  simulatedAnnualYieldPct: number;
  maxSingleTransferInr: number;
  autoSavingsCycleEnabled: boolean;
  strictDuplicateCheckWindowSec: number;
  updatedAt: string;
  updatedBy: string;
}

export interface DatabaseSchema {
  users: UserDoc[];
  adminUsers: AdminUserDoc[];
  accounts: AccountDoc[];
  transactions: TransactionDoc[];
  savingsRules: SavingsRuleDoc[];
  savingsHistory: SavingsHistoryDoc[];
  blockchainRecords: BlockchainRecordDoc[];
  auditLogs: AuditLogDoc[];
  notifications: NotificationDoc[];
  contactInquiries: ContactInquiryDoc[];
  settings: PlatformSettingsDoc;
}
