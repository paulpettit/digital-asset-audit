export interface Transaction {
  id: string;
  txid: string;
  fromAddress: string;
  toAddress: string;
  valueBTC: number;
  date: string;
  walletSource: string;
  transactionType: string;
  status: "verified" | "pending" | "failed" | "unverified";
  blockConfirmations?: number;
  blockHeight?: number;
}

export interface WalletBalance {
  id: string;
  address: string;
  seedLabel: string;
  expectedBalance: number;
  actualBalance: number | null;
  currency: string;
  asOfDate: string;
  status: "matched" | "mismatched" | "pending" | "error";
  variance: number | null;
}

export interface WalletTrace {
  id: string;
  fromWallet: string;
  toWallet: string;
  txid: string;
  amount: number;
  date: string;
  traceDepth: number;
  changeAddress?: string;
}

export interface RiskControl {
  id: string;
  riskId: string;
  riskDescription: string;
  controlId: string;
  controlDescription: string;
  procedureDescription: string;
  status: "effective" | "ineffective" | "not_tested" | "in_progress";
  lastTested?: string;
  notes?: string;
}

export interface ExistenceProcedure {
  id: string;
  category: string;
  procedure: string;
  description: string;
  status: "complete" | "in_progress" | "not_started" | "blocked";
  assignee?: string;
  completedDate?: string;
  evidence?: string;
  notes?: string;
}

export interface AuditEngagement {
  id: string;
  clientName: string;
  engagementDate: string;
  reportingPeriodEnd: string;
  assets: string[];
  status: "active" | "completed" | "draft";
}
