export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  kycStatus: 'Verified' | 'Pending';
  accountTier: 'Premium Savings' | 'Digital Checking' | 'Institutional Reserve';
  status: 'Active' | 'Deactivated';
  city: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  roleTitle: string;
  permissions: string[];
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLoginAt: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountNumberMasked: string;
  ifscCode: string;
  branchName: string;
  accountType: 'Checking' | 'Savings' | 'Auto-Savings Vault';
  balance: number;
  availableBalance: number;
  currency: 'INR';
  status: 'Active' | 'Deactivated';
  createdAt: string;
  updatedAt: string;
  ownerName?: string;
  ownerEmail?: string;
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

export interface BankTransaction {
  id: string;
  userId: string;
  customerName?: string;
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

export interface SavingsRule {
  id: string;
  userId: string;
  customerName?: string;
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

export interface SavingsHistoryEntry {
  id: string;
  ruleId: string;
  userId: string;
  customerName?: string;
  goalName: string;
  cadence: SavingsCadence;
  amount: number;
  balanceAfter: number;
  transactionId: string;
  transactionHash: string;
  executedAt: string;
}

export interface BlockchainRecord {
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
  isOwnTransaction?: boolean;
}

export interface ChainStatusInfo {
  mode: 'Local Hash-Chain Simulation' | 'Ethereum Testnet Anchored';
  testnetConfigured: boolean;
  rpcReachable: boolean;
  networkName: string;
  contractAddress: string | null;
  latestBlockNumber: number;
  latestBlockHash: string;
  disclosure: string;
}

export interface ChainVerificationResult {
  valid: boolean;
  totalBlocks: number;
  verifiedBlocks: number;
  tamperedBlocks: {
    blockNumber: number;
    transactionId: string;
    reason: string;
  }[];
  checkedAt: string;
}

export interface AuditLogEntry {
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

export interface BankNotification {
  id: string;
  userId: string;
  category: 'Savings' | 'Transfer' | 'Security' | 'System';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PlatformSettings {
  simulatedAnnualYieldPct: number;
  maxSingleTransferInr: number;
  autoSavingsCycleEnabled: boolean;
  strictDuplicateCheckWindowSec: number;
  updatedAt: string;
  updatedBy: string;
}
