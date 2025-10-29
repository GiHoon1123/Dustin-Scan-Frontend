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
}

export interface Account {
  address: string;
  balance: string;
  balanceWei: string;
  nonce: number;
  txCount: number;
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
