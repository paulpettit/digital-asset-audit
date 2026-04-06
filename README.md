# ChainAudit - Digital Asset Audit Platform

A modern, automated pre-audit platform for verifying the existence and control of digital assets (Bitcoin-family) held by audited entities. Built to streamline the labor-intensive manual processes involved in digital asset audit engagements.

## Product Walkthrough

![ChainAudit app walkthrough](public/gifs/chainaudit-walkthrough.gif)

## Wallet Tracing Demo

![Wallet tracing flow with node renaming](public/gifs/chainaudit-tracing-rename.gif)

## Problem Statement

Audit teams performing existence and control testing over digital assets face significant manual effort:
- Verifying hundreds of blockchain transactions individually
- Reconciling year-end wallet balances against blockchain state
- Tracing transaction flows across multiple wallets and seed phrases
- Mapping risk/control matrices to blockchain-specific threats
- Tracking dozens of audit procedures across multiple team members

**ChainAudit automates these workflows**, reducing hours of manual spreadsheet work to minutes of automated verification.

## Features

### Transaction Verification
- Bulk verification of blockchain transactions against reported records
- Real-time blockchain API integration for transaction confirmation
- Search, filter, and batch-verify transaction populations
- Automated block confirmation tracking

### Year-End Balance Testing
- Automated wallet balance reconciliation at reporting date
- Variance detection with configurable materiality thresholds
- Batch balance checking across all entity-controlled addresses
- UTXO-based balance derivation

### Wallet & Transaction Tracing
- Visual transaction flow mapping between entity wallets
- Multi-depth trace visualization (seed-to-seed transfers)
- Change address identification and mapping
- Interactive trace exploration

### Risk & Controls Matrix
- Pre-built blockchain risk taxonomy (aligned with audit standards)
- 8 key controls mapped to 5 identified blockchain risks
- Expandable risk-control-procedure hierarchy
- Control effectiveness tracking and testing status

### Audit Procedures Tracking
- Categorized procedure checklist (Blockchain Verification, Transaction Testing, Balance Testing, etc.)
- Progress tracking with completion percentages
- Evidence attachment and note management
- Status workflow: Not Started -> In Progress -> Complete/Blocked

### Data Import
- CSV/Excel import for bulk transaction and balance data
- Supports standard audit workpaper formats

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Import**: SheetJS (xlsx), PapaParse

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/yourusername/digital-asset-audit.git
cd digital-asset-audit
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start
```

## Architecture

```
src/
  app/                    # Next.js App Router pages
    page.tsx              # Dashboard with engagement overview
    transactions/         # Transaction verification module
    balances/             # Year-end balance testing
    tracing/              # Wallet & transaction tracing
    risks/                # Risk & controls matrix
    procedures/           # Audit procedures tracking
  components/             # Reusable UI components
    Sidebar.tsx           # Navigation sidebar
    Card.tsx              # Card and MetricCard components
    StatusBadge.tsx       # Status indicator badges
  lib/                    # Shared utilities and types
    types.ts              # TypeScript interfaces
    mock-data.ts          # Sample audit engagement data
```

## Blockchain Integration

The platform is designed to integrate with public blockchain APIs for real-time verification:

- **Transaction lookup**: Verify transaction existence and confirmation count
- **Balance queries**: Check address balances at specific block heights
- **UTXO verification**: Confirm unspent transaction outputs for balance derivation

Currently uses mock data for demonstration. Production deployment would integrate with:
- Bitcoin Core RPC / Blockstream API
- Public block explorers (Blockchain.com, Blockchair)
- Entity-operated full nodes

## Audit Methodology

This tool implements the pre-audit workflow for digital asset existence testing as defined in professional audit standards:

1. **Initiation**: Transaction is signed and broadcast to the network
2. **Recording**: Nodes validate transactions against consensus rules
3. **Processing**: Validated transactions are relayed across the network
4. **Reporting**: Transactions are included in blocks and appended to the ledger

Key risks addressed:
| Risk | Control |
|------|---------|
| Private key exposure during signing | ECC cryptography prevents key revelation |
| Unauthorized/invalid transactions recorded | Digital signature + balance validation |
| Previously validated data modified | Proof-of-work + block chaining (SHA-256) |
| Ledger disagreement across network | Automatic recording + peer reconciliation |
| Digital signature verification failure | Protocol-level signature management |

## License

MIT

## Author

Built as an automation initiative to demonstrate how SGRC (Security, Governance, Risk & Compliance) processes can be modernized through purpose-built tooling.
