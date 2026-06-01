# Unysol → Blockchain Integration Roadmap

> **Goal:** Make Unysol fully operable through blockchain — zero investment, free tiers + testnets first, mainnet pennies/month later.
> **Current tech:** Go/chi backend, React PWA, PostgreSQL, Redis, Docker
> **Target market:** 100,000+ small logistics companies, starting Turkey

---

## 1. Document Integrity & Verification (Quickest Win)

**Hash e-Fatura, irsaliye, contracts → store hash on-chain for tamper-proof verification.**

| What | Choice | Cost |
|------|--------|------|
| Chain | Polygon PoS | ~$0.001/tx |
| Testnet (free) | Polygon Amoy | $0 |
| Alternative | Base L2 | ~$0.01/tx |
| Testnet (free) | Base Sepolia | $0 |

### Implementation Plan
- Add `blockchain_hash` and `blockchain_txid` columns to `invoices`, `cek_senet` tables
- After PDF/XML generation, SHA-256 hash the document
- Write hash to Polygon via a simple Go smart contract call
- Add "Blockchain Verify" button in invoice UI — user uploads PDF, frontend hashes and compares to on-chain record
- **Go library needed:** `go-ethereum` (Ethereum/Polygon client)
- **Smart contract:** Simple `storeHash(bytes32)` + `verifyHash(bytes32, bytes32)` contract
- **Effort:** ~2-3 days

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentRegistry {
    mapping(bytes32 => bool) public documents;  // hash → exists
    mapping(bytes32 => uint256) public timestamps;  // hash → block time

    event DocumentStored(bytes32 indexed hash, uint256 timestamp);

    function storeHash(bytes32 hash) external {
        require(!documents[hash], "Already stored");
        documents[hash] = true;
        timestamps[hash] = block.timestamp;
        emit DocumentStored(hash, block.timestamp);
    }

    function verifyHash(bytes32 hash) external view returns (bool, uint256) {
        return (documents[hash], timestamps[hash]);
    }
}
```

---

## 2. Decentralized Storage (IPFS)

**Replace/backup S3/MinIO with IPFS for immutable document storage.**

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| web3.storage | 5 GB | Quick start, Filecoin-backed |
| Pinata | 1 GB + dedicated gateway | Production, API-first |
| Lighthouse | 1 GB free | Filecoin + encryption |
| Storj | 25 GB free | S3-compatible, decentralized |

### Implementation Plan
- Add IPFS upload to existing file handling in Go backend (after S3/MinIO write)
- Store `ipfs_cid` alongside file metadata in PostgreSQL
- Hash CID on-chain for extra integrity (CID + document hash together)
- **Go library:** `github.com/ipfs/go-ipfs-api` or REST calls to Pinata/web3.storage
- **Effort:** ~1 week

### Dual-Write Pattern
```
File Upload → 1. Write to S3/MinIO (existing, fast read)
              2. Write to IPFS via Pinata/web3.storage (immutable, verifiable)
              3. Store CID in DB
              4. Optionally: hash CID → Polygon
```

---

## 3. Crypto Payments & Escrow

**Replace Stripe with stablecoin payments and smart contract escrow between shippers and carriers.**

| Chain | TX Cost | Speed | Stablecoins |
|-------|---------|-------|-------------|
| Solana | ~$0.00025 | 400ms | USDC, USDT |
| Polygon | ~$0.001 | 2s | USDC, USDT, DAI |
| Celo | ~$0.001 | 5s | cUSD, cEUR |
| Base | ~$0.01 | 2s | USDC |

### Implementation Plan
- **Freight Invoice Flow:** Shipper deposits USDC into escrow smart contract → Carrier delivers → GPS/trip status triggers release → Payment auto-sent
- **Go library:** Solana: `gagliardetto/solana-go`. EVM chains: `go-ethereum`
- **Wallet:** Self-custodial generated per tenant, or connect MetaMask/Phantom
- **Effort:** ~2-3 weeks

### Escrow Contract (Solidity — Polygon/Base)
```solidity
contract FreightEscrow {
    struct Shipment {
        address shipper;
        address carrier;
        uint256 amount;
        bool delivered;
        bool paid;
    }
    mapping(uint256 => Shipment) public shipments;

    function createShipment(uint256 id, address carrier) external payable {
        shipments[id] = Shipment(msg.sender, carrier, msg.value, false, false);
    }

    function confirmDelivery(uint256 id) external {
        // Oracle or authorized verifier confirms (GPS, signature)
        shipments[id].delivered = true;
    }

    function releasePayment(uint256 id) external {
        require(shipments[id].delivered, "Not delivered");
        require(!shipments[id].paid, "Already paid");
        shipments[id].paid = true;
        payable(shipments[id].carrier).transfer(shipments[id].amount);
    }
}
```

---

## 4. Supply Chain Tracking (Trip Ledger)

**Write trip milestones to a feeless/high-throughput ledger.**

| Chain | TX Cost | Best For |
|-------|---------|----------|
| IOTA Shimmer | Free (feeless DAG) | IoT, GPS, supply chain |
| VeChain | ~$0.001 | Enterprise supply chain |
| Hedera | ~$0.0001 | High throughput, governed |

### Implementation Plan
- Integrate with existing `trip_mgmt` module
- Write milestones: `CREATED → LOADED → DEPARTED → IN_TRANSIT → ARRIVED → DELIVERED` as on-chain events
- Each trip gets a unique on-chain ID
- **IOTA recommended** — feeless, designed for IoT/GPS data, perfect for truck tracking
- **Go library:** `iotaledger/iota.go` (IOTA), `hashgraph/hedera-sdk-go` (Hedera)
- **Effort:** ~2 weeks

---

## 5. Decentralized Identity (DID)

**Self-sovereign identity for drivers and companies — cross-border verification without centralized auth.**

| Platform | Cost | Best For |
|----------|------|----------|
| Ceramic Network | Free | Decentralized data streams, profiles |
| cheqd | Minimal | DID documents, verifiable credentials |
| ION (Bitcoin) | Free (anchors on BTC) | Maximum security, slower |

### Implementation Plan
- Drivers get a DID stored on Ceramic (profile, license, SRC certification)
- Companies get a DID (tax ID, registration, fleet)
- During trip assignment, carrier can verify driver credentials on-chain
- **Effort:** ~2-3 weeks

---

## 6. Tokenized Load Board (Freight NFT Marketplace)

**Your existing `load_board` (YUK_VAR/YUK_ARA) becomes an on-chain marketplace.**

| Feature | Implementation |
|---------|---------------|
| Load as NFT | ERC-721 on Polygon (pennies to mint) |
| Load details | Metadata on IPFS (origin, destination, weight, price, deadline) |
| Bid/accept | Smart contract handles offer → acceptance → escrow |
| Transfer | NFT transfers from shipper to carrier upon acceptance |
| Settlement | Escrow auto-releases upon delivery confirmation |

### Why NFT?
- Each load is unique (origin, destination, cargo type, date, price)
- Traceable — full history of who bid, who carried, when delivered
- Tradeable — carrier can re-assign load with shipper approval
- Verifiable — load exists on-chain, not double-booked

### Implementation Plan
- **ERC-721** for load representation
- **ERC-1155** if batch loads (same route, multi-truck)
- Frontend: load board shows on-chain + off-chain loads
- **Effort:** ~3 weeks

---

## 7. Recommended Phased Rollout

```
PHASE 1: Document Hashing (2-3 days)
├── Deploy DocumentRegistry.sol to Polygon Amoy (testnet)
├── Add hash columns to DB
├── Go backend: hash → contract call
├── Frontend: verify button
└── Test → deploy to Polygon Mainnet

PHASE 2: IPFS Storage (1 week)
├── Pinata account + API key
├── Go: dual-write to IPFS on document upload
├── Store CID in DB
├── Add IPFS gateway links in UI
└── Optionally hash CID on-chain

PHASE 3: Stablecoin Payments (2-3 weeks)
├── Deploy FreightEscrow.sol to Polygon
├── Wallet generation per tenant (or WalletConnect)
├── USDC on-ramp: use free tier fiat on-ramp APIs
├── Integrate with invoice_mgmt module
└── Auto-release on delivery confirmation

PHASE 4: Trip Ledger (2 weeks)
├── IOTA Shimmer integration
├── Write trip milestones on-chain
├── GPS events → IOTA messages
└── Public trip audit trail

PHASE 5: Load Board NFTs (3 weeks)
├── ERC-721 contract for loads
├── IPFS metadata for load details
├── Smart contract bidding system
├── Frontend: on-chain load board UI
└── Escrow integration from Phase 3

PHASE 6: Decentralized Identity (2-3 weeks)
├── Ceramic Network for driver profiles
├── DID → driver verification
├── Integration with employee_mgmt module
└── Cross-border driver credential sharing
```

---

## 8. Technology Stack Summary

| Component | Choice | Why | Monthly Cost |
|-----------|--------|-----|:---:|
| Smart contracts | Polygon PoS | EVM, cheap, wide ecosystem | <$1 |
| Document hashing | Same contract | Simple hash store | <$1 |
| Storage | IPFS via Pinata | 1GB free, dedicated gateway | $0 |
| Payments | USDC on Polygon | Stable, cheap, widely used | <$1 |
| Supply chain ledger | IOTA Shimmer | Feeless, IoT-native | $0 |
| Identity | Ceramic | Free, composable data streams | $0 |
| Load board | Polygon ERC-721 | Pennies per mint | <$5 |
| RPC access | Infura / Alchemy free tier | Reliable node access | $0 |

**Total estimated monthly blockchain cost: <$10 (mostly zero)**

---

## 9. Go Dependencies to Add

```go
// EVM Chains (Polygon, Base, Celo)
go get github.com/ethereum/go-ethereum

// Solana
go get github.com/gagliardetto/solana-go

// IOTA
go get github.com/iotaledger/iota.go/v4

// IPFS (or use REST API directly)
go get github.com/ipfs/go-ipfs-api

// Hedera
go get github.com/hashgraph/hedera-sdk-go/v2
```

---

## 10. New Database Tables

```sql
-- Blockchain transaction log (all on-chain writes)
CREATE TABLE blockchain_transactions (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    tx_hash         VARCHAR(66),  -- 0x + 64 hex
    chain           VARCHAR(20),  -- polygon, iota, solana, hedera
    contract        VARCHAR(42),  -- contract address
    method          VARCHAR(50),  -- storeHash, createShipment, etc.
    payload_hash    VARCHAR(66),  -- SHA-256 of what was stored
    block_number    BIGINT,
    status          VARCHAR(20) DEFAULT 'pending',  -- pending, confirmed, failed
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Document → Blockchain mapping
ALTER TABLE invoices ADD COLUMN blockchain_hash VARCHAR(66);
ALTER TABLE invoices ADD COLUMN blockchain_txid VARCHAR(66);
ALTER TABLE cek_senet ADD COLUMN blockchain_hash VARCHAR(66);
ALTER TABLE cek_senet ADD COLUMN blockchain_txid VARCHAR(66);

-- IPFS file mapping
CREATE TABLE ipfs_files (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    original_name   VARCHAR(255),
    cid             VARCHAR(100) NOT NULL,    -- IPFS Content ID
    mime_type       VARCHAR(100),
    size_bytes      BIGINT,
    document_type   VARCHAR(50),              -- invoice, irsaliye, contract
    document_id     INTEGER,                 -- FK to source record
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Trip milestones on-chain
ALTER TABLE trips ADD COLUMN chain_trip_id VARCHAR(100);  -- on-chain trip reference
CREATE TABLE trip_chain_events (
    id              BIGSERIAL PRIMARY KEY,
    trip_id         INTEGER NOT NULL REFERENCES trips(id),
    milestone       VARCHAR(30),  -- CREATED, LOADED, DEPARTED, ARRIVED, DELIVERED
    chain_tx_hash   VARCHAR(66),
    block_number    BIGINT,
    block_time      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 11. Environment Variables to Add

```bash
# .env additions
# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com              # or Infura/Alchemy free tier
POLYGON_CONTRACT_ADDRESS=0x...                        # deployed contract
POLYGON_PRIVATE_KEY=                                  # deployer/backend wallet
CHAIN_ID=137                                          # Polygon mainnet

# IPFS
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
PINATA_GATEWAY=https://gateway.pinata.cloud

# IOTA
IOTA_NODE_URL=https://api.shimmer.network             # Shimmer mainnet
IOTA_FAUCET_URL=https://faucet.testnet.shimmer.network  # testnet

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com    # or Helius free tier
SOLANA_PROGRAM_ID=
```

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Gas price spikes | Use L2s (Polygon, Base) — even at 10x, still <$0.01/tx |
| Private key management | Use KMS/vault, never in code. Environment variable with restricted access |
| IPFS pinning reliability | Dual-pin: Pinata + web3.storage. Both free tiers |
| Regulatory (Turkey crypto rules) | Document hashing and IPFS storage are not payments — no crypto regulation applies. Payments: partner with licensed crypto exchange for on/off ramp |
| User adoption | Optional features — users can verify on-chain without understanding blockchain. "Verified by Blockchain" badge builds trust |
| Contract bugs | Use OpenZeppelin audited contracts. Start with testnet. Get community audit |

---

## Next Action

```bash
# 1. Install Go Ethereum client
cd /home/ugur/unysol/backend
go get github.com/ethereum/go-ethereum

# 2. Create smart contract directory
mkdir -p /home/ugur/unysol/blockchain/contracts
mkdir -p /home/ugur/unysol/blockchain/scripts

# 3. Write the DocumentRegistry.sol contract
# 4. Deploy to Polygon Amoy testnet (free faucet)
# 5. Integrate into Go backend invoice handler
# 6. Add verify button to React frontend invoice view
```
