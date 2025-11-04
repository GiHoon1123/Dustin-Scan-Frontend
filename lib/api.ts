import {
  Account,
  ApiResponse,
  Block,
  Contract,
  PaginatedResponse,
  Transaction,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// 블록 목록 조회
export async function getBlocks(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Block>> {
  const res = await fetch(
    `${API_BASE_URL}/blocks?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch blocks");
  return res.json();
}

// 블록 상세 조회 (번호)
export async function getBlockByNumber(
  number: number
): Promise<ApiResponse<Block>> {
  const res = await fetch(`${API_BASE_URL}/blocks/number/${number}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch block");
  return res.json();
}

// 블록 상세 조회 (해시)
export async function getBlockByHash(
  hash: string
): Promise<ApiResponse<Block>> {
  const res = await fetch(`${API_BASE_URL}/blocks/hash/${hash}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch block");
  return res.json();
}

// 트랜잭션 목록 조회
export async function getTransactions(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Transaction>> {
  const res = await fetch(
    `${API_BASE_URL}/transactions?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

// 트랜잭션 상세 조회
export async function getTransactionByHash(
  hash: string
): Promise<ApiResponse<Transaction>> {
  const res = await fetch(`${API_BASE_URL}/transactions/${hash}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch transaction");
  return res.json();
}

// 주소별 트랜잭션 조회
export async function getTransactionsByAddress(
  address: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Transaction>> {
  const res = await fetch(
    `${API_BASE_URL}/transactions/address/${address}?page=${page}&limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

// 계정 정보 조회
export async function getAccount(
  address: string
): Promise<ApiResponse<Account>> {
  const res = await fetch(`${API_BASE_URL}/accounts/${address}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch account");
  return res.json();
}

// 컨트랙트 목록 조회
export async function getContracts(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Contract>> {
  const res = await fetch(
    `${API_BASE_URL}/contracts?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch contracts");
  return res.json();
}

// 컨트랙트 상세 조회
export async function getContract(
  address: string
): Promise<ApiResponse<Contract>> {
  const res = await fetch(`${API_BASE_URL}/contracts/${address}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch contract");
  return res.json();
}
