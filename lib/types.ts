// TypeScript 타입 정의

export interface Block {
  hash: string;
  number: string;
  timestamp: string;
  parentHash: string;
  proposer: string;
  transactionCount: number;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  createdAt: string;
  transactions?: Transaction[]; // 블록 상세 조회 시 포함
}

export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
}

export interface Transaction {
  hash: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string;
  value: string;
  valueWei: string;
  nonce: number;
  timestamp: string;
  status?: number;
  gasUsed?: string;
  cumulativeGasUsed?: string;
  contractAddress?: string | null;
  createdAt: string;
  logs?: TransactionLog[];
}

export interface Account {
  address: string;
  balance: string;
  balanceWei: string;
  nonce: number;
  txCount: number;
}

export interface TokenBalance {
  tokenAddress: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  balance: string;
}

export interface Contract {
  address: string;
  deployer: string;
  transactionHash: string;
  blockNumber: string;
  blockHash: string;
  bytecode: string | null;
  status: 0 | 1;
  abi: unknown[] | null;
  name: string | null;
  sourceCode: string | null;
  compilerVersion: string | null;
  optimization: boolean | null;
  timestamp: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    items: T[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
}

export interface StablecoinPosition {
  collateralAmount: string;
  debtAmount: string;
  collateralRatio: string;
}

export interface StablecoinHealth {
  isHealthy: boolean;
}

export interface StablecoinTransaction {
  hash: string;
  status: string;
}
