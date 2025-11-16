import {
  Account,
  ApiResponse,
  Block,
  Contract,
  PaginatedResponse,
  TokenBalance,
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

// 주소별 토큰 잔액 목록 조회
export async function getTokenBalancesByAddress(
  address: string,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<TokenBalance>> {
  const res = await fetch(
    `${API_BASE_URL}/accounts/${address}/tokens?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch token balances");
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

export async function getContractsByDeployer(
  address: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Contract>> {
  const res = await fetch(
    `${API_BASE_URL}/contracts/deployer/${address}?page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch contracts by deployer");
  return res.json();
}

// 컨트랙트 읽기 메서드 호출 (view, pure)
export async function callContract(
  address: string,
  methodName: string,
  params: unknown[]
): Promise<
  ApiResponse<{ result: string; gasUsed: string; decodedResult?: unknown }>
> {
  // Next.js API Route 프록시 사용 (Mixed Content 문제 해결)
  const url = `/api/contracts/${address}/call`;
  const body = JSON.stringify({ methodName, params });

  console.log("[callContract] Request:", {
    url,
    method: "POST",
    body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  console.log("[callContract] Response:", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("[callContract] Error:", errorData);
    throw new Error(errorData.message || "Failed to call contract");
  }
  return res.json();
}

// 컨트랙트 쓰기 메서드 실행 (nonpayable, payable)
export async function executeContract(
  address: string,
  methodName: string,
  params: unknown[]
): Promise<ApiResponse<{ transactionHash: string; status: string }>> {
  // Next.js API Route 프록시 사용 (Mixed Content 문제 해결)
  const url = `/api/contracts/${address}/execute`;
  const body = JSON.stringify({ methodName, params });

  console.log("[executeContract] Request:", {
    url,
    method: "POST",
    body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  console.log("[executeContract] Response:", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("[executeContract] Error:", errorData);
    throw new Error(errorData.message || "Failed to execute contract");
  }
  return res.json();
}

// 컨트랙트 배포
export async function deployContract(bytecode: string): Promise<
  ApiResponse<{
    transactionHash: string;
    status: string;
    contractAddress: string | null;
  }>
> {
  // Next.js API Route 프록시 사용 (Mixed Content 문제 해결)
  const url = `/api/contracts/deploy`;
  const body = JSON.stringify({ bytecode });

  console.log("[deployContract] Request:", {
    url,
    method: "POST",
    bodyLength: body.length,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  console.log("[deployContract] Response:", {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("[deployContract] Error:", errorData);
    throw new Error(errorData.message || "Failed to deploy contract");
  }
  return res.json();
}
