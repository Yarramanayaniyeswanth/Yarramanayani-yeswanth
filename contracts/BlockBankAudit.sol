// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title BlockBankAudit
 * @notice Append-only cryptographic audit ledger for anchoring banking transaction
 *         hashes and hash-chain blocks onto an Ethereum-compatible test network.
 */
contract BlockBankAudit {
    struct AuditRecord {
        string transactionId;
        bytes32 transactionHash;
        bytes32 previousBlockHash;
        bytes32 currentBlockHash;
        uint256 blockIndex;
        uint256 timestamp;
        address submittedBy;
    }

    address public immutable owner;
    uint256 public latestBlockIndex;
    bytes32 public latestBlockHash;

    mapping(string => AuditRecord) private recordsByTxId;
    mapping(bytes32 => bool) public knownBlockHashes;
    string[] private recordedTxIds;

    event AuditRecordAnchored(
        string indexed transactionId,
        bytes32 indexed transactionHash,
        bytes32 previousBlockHash,
        bytes32 currentBlockHash,
        uint256 blockIndex,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "BLOCKBANK: caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        latestBlockIndex = 0;
        latestBlockHash = keccak256(abi.encodePacked("BLOCKBANK_GENESIS_V1"));
        knownBlockHashes[latestBlockHash] = true;
    }

    /**
     * @notice Anchors an append-only audit entry linked to the previous block hash.
     */
    function anchorAuditRecord(
        string calldata transactionId,
        bytes32 transactionHash,
        bytes32 previousBlockHash
    ) external onlyOwner returns (bytes32 currentBlockHash, uint256 newBlockIndex) {
        require(bytes(transactionId).length > 0, "BLOCKBANK: empty transactionId");
        require(recordsByTxId[transactionId].timestamp == 0, "BLOCKBANK: duplicate transactionId");
        require(previousBlockHash == latestBlockHash, "BLOCKBANK: hash-chain mismatch");

        newBlockIndex = latestBlockIndex + 1;
        currentBlockHash = keccak256(
            abi.encodePacked(
                newBlockIndex,
                transactionId,
                transactionHash,
                previousBlockHash,
                block.timestamp
            )
        );

        recordsByTxId[transactionId] = AuditRecord({
            transactionId: transactionId,
            transactionHash: transactionHash,
            previousBlockHash: previousBlockHash,
            currentBlockHash: currentBlockHash,
            blockIndex: newBlockIndex,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        latestBlockIndex = newBlockIndex;
        latestBlockHash = currentBlockHash;
        knownBlockHashes[currentBlockHash] = true;
        recordedTxIds.push(transactionId);

        emit AuditRecordAnchored(
            transactionId,
            transactionHash,
            previousBlockHash,
            currentBlockHash,
            newBlockIndex,
            block.timestamp
        );
    }

    function getAuditRecord(string calldata transactionId)
        external
        view
        returns (AuditRecord memory)
    {
        require(recordsByTxId[transactionId].timestamp != 0, "BLOCKBANK: record not found");
        return recordsByTxId[transactionId];
    }

    function verifyTransactionHash(
        string calldata transactionId,
        bytes32 expectedTxHash
    ) external view returns (bool) {
        AuditRecord memory rec = recordsByTxId[transactionId];
        if (rec.timestamp == 0) return false;
        return rec.transactionHash == expectedTxHash;
    }

    function totalAnchoredRecords() external view returns (uint256) {
        return recordedTxIds.length;
    }
}
