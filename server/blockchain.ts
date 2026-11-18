import { ethers } from 'ethers';
import { BlockchainRecordDoc, TransactionStatus } from './types';

export const GENESIS_PREVIOUS_HASH = ethers.keccak256(
  ethers.toUtf8Bytes('BLOCKBANK_GENESIS_BLOCK_V1')
);

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

export interface VerificationResult {
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

/**
 * Computes a deterministic Keccak-256 hash of a transaction payload using Ethers.js.
 */
export function computeTransactionHash(params: {
  transactionId: string;
  senderRef: string;
  receiverRef: string;
  amount: number;
  status: TransactionStatus;
  timestamp: string;
}): string {
  const canonical = [
    params.transactionId,
    params.senderRef,
    params.receiverRef,
    params.amount.toFixed(2),
    params.status,
    params.timestamp,
  ].join('|');

  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

/**
 * Computes a deterministic block hash chaining blockNumber, transactionHash,
 * previousBlockHash, and timestamp.
 */
export function computeBlockHash(params: {
  blockNumber: number;
  transactionId: string;
  transactionHash: string;
  previousBlockHash: string;
  timestamp: string;
}): string {
  const payload = ethers.solidityPacked(
    ['uint256', 'string', 'bytes32', 'bytes32', 'string'],
    [
      params.blockNumber,
      params.transactionId,
      params.transactionHash,
      params.previousBlockHash,
      params.timestamp,
    ]
  );
  return ethers.keccak256(payload);
}

/**
 * Computes an append-only audit log hash for administrative & system actions.
 */
export function computeAuditRecordHash(params: {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  createdAt: string;
}): string {
  return ethers.keccak256(
    ethers.toUtf8Bytes(
      `${params.id}|${params.actorId}|${params.action}|${params.targetId}|${params.createdAt}`
    )
  );
}

/**
 * Verifies the entire append-only blockchain hash chain from Block #1 to latest.
 */
export function verifyFullHashChain(
  records: BlockchainRecordDoc[]
): VerificationResult {
  const sorted = [...records].sort((a, b) => a.blockNumber - b.blockNumber);
  const tamperedBlocks: VerificationResult['tamperedBlocks'] = [];
  let verifiedBlocks = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const expectedPrevHash =
      i === 0 ? GENESIS_PREVIOUS_HASH : sorted[i - 1].currentBlockHash;

    const expectedTxHash = computeTransactionHash({
      transactionId: current.transactionId,
      senderRef: current.senderRef,
      receiverRef: current.receiverRef,
      amount: current.amount,
      status: current.txStatus,
      timestamp: current.timestamp,
    });

    const expectedBlockHash = computeBlockHash({
      blockNumber: current.blockNumber,
      transactionId: current.transactionId,
      transactionHash: expectedTxHash,
      previousBlockHash: expectedPrevHash,
      timestamp: current.timestamp,
    });

    const reasons: string[] = [];
    if (current.previousBlockHash !== expectedPrevHash) {
      reasons.push('Previous block hash link mismatch');
    }
    if (current.transactionHash !== expectedTxHash) {
      reasons.push('Transaction payload hash mismatch');
    }
    if (current.currentBlockHash !== expectedBlockHash) {
      reasons.push('Block digest mismatch');
    }
    if (current.blockNumber !== i + 1) {
      reasons.push(`Non-sequential block index (expected ${i + 1})`);
    }

    if (reasons.length > 0) {
      tamperedBlocks.push({
        blockNumber: current.blockNumber,
        transactionId: current.transactionId,
        reason: reasons.join('; '),
      });
    } else {
      verifiedBlocks += 1;
    }
  }

  return {
    valid: tamperedBlocks.length === 0,
    totalBlocks: sorted.length,
    verifiedBlocks,
    tamperedBlocks,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Verifies a single block record against its predecessor and canonical payload.
 */
export function verifySingleBlockRecord(
  record: BlockchainRecordDoc,
  previousRecord: BlockchainRecordDoc | undefined
): {
  valid: boolean;
  recomputedTxHash: string;
  recomputedBlockHash: string;
  expectedPreviousHash: string;
  reason: string;
} {
  const expectedPreviousHash = previousRecord
    ? previousRecord.currentBlockHash
    : GENESIS_PREVIOUS_HASH;

  const recomputedTxHash = computeTransactionHash({
    transactionId: record.transactionId,
    senderRef: record.senderRef,
    receiverRef: record.receiverRef,
    amount: record.amount,
    status: record.txStatus,
    timestamp: record.timestamp,
  });

  const recomputedBlockHash = computeBlockHash({
    blockNumber: record.blockNumber,
    transactionId: record.transactionId,
    transactionHash: recomputedTxHash,
    previousBlockHash: expectedPreviousHash,
    timestamp: record.timestamp,
  });

  const valid =
    record.transactionHash === recomputedTxHash &&
    record.previousBlockHash === expectedPreviousHash &&
    record.currentBlockHash === recomputedBlockHash;

  return {
    valid,
    recomputedTxHash,
    recomputedBlockHash,
    expectedPreviousHash,
    reason: valid
      ? 'Cryptographic Keccak-256 payload digest and predecessor link verified.'
      : 'Hash mismatch detected against canonical transaction payload or parent block.',
  };
}

/**
 * Checks optional Ethereum-compatible testnet RPC connectivity via Ethers.js.
 * Never claims simulated records are on a live testnet if RPC/contract are unconfigured.
 */
export async function getChainStatusInfo(
  records: BlockchainRecordDoc[]
): Promise<ChainStatusInfo> {
  const sorted = [...records].sort((a, b) => a.blockNumber - b.blockNumber);
  const latest = sorted[sorted.length - 1];
  const rpcUrl = process.env.ETH_RPC_URL?.trim();
  const contractAddress = process.env.AUDIT_CONTRACT_ADDRESS?.trim() || null;

  if (rpcUrl && contractAddress) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const network = await Promise.race([
        provider.getNetwork(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RPC timeout')), 2500)
        ),
      ]);
      return {
        mode: 'Ethereum Testnet Anchored',
        testnetConfigured: true,
        rpcReachable: true,
        networkName: `${network.name} (Chain ID ${network.chainId.toString()})`,
        contractAddress,
        latestBlockNumber: latest ? latest.blockNumber : 0,
        latestBlockHash: latest ? latest.currentBlockHash : GENESIS_PREVIOUS_HASH,
        disclosure:
          'Connected to configured Ethereum-compatible testnet RPC for BlockBankAudit contract verification.',
      };
    } catch {
      return {
        mode: 'Local Hash-Chain Simulation',
        testnetConfigured: true,
        rpcReachable: false,
        networkName: 'Fallback Local Keccak-256 Chain',
        contractAddress,
        latestBlockNumber: latest ? latest.blockNumber : 0,
        latestBlockHash: latest ? latest.currentBlockHash : GENESIS_PREVIOUS_HASH,
        disclosure:
          'ETH_RPC_URL configured but unreachable. Operating in clearly labeled Local Cryptographic Hash-Chain Simulation mode.',
      };
    }
  }

  return {
    mode: 'Local Hash-Chain Simulation',
    testnetConfigured: false,
    rpcReachable: false,
    networkName: 'Local Keccak-256 Hash Chain',
    contractAddress: null,
    latestBlockNumber: latest ? latest.blockNumber : 0,
    latestBlockHash: latest ? latest.currentBlockHash : GENESIS_PREVIOUS_HASH,
    disclosure:
      'Simulated mode: audit digests are computed locally using Ethers.js Keccak-256 hash chaining. Configure ETH_RPC_URL and AUDIT_CONTRACT_ADDRESS in .env for Ethereum testnet anchoring.',
  };
}
