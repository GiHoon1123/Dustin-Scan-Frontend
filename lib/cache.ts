/**
 * 오프라인 우선 캐시 유틸리티
 * 
 * 목적: 서버 장애 시에도 데이터를 보여주기 위한 가용성 확보
 * - 캐시는 업데이트 시에만 덮어쓰기 (삭제하지 않음)
 * - TTL 없음 (영구 저장)
 * 
 * 서버: 메모리 캐시 (Map)
 * 클라이언트: localStorage
 */

const CACHE_PREFIX = 'dustin_cache_';
const CACHE_VERSION = '1.0';

interface CacheEntry<T> {
  data: T;
  timestamp: number; // 캐시된 시간 (표시용)
}

// 서버용 메모리 캐시 (Map)
const serverCache = new Map<string, CacheEntry<any>>();

/**
 * 캐시 키 생성
 */
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${key}`;
}

/**
 * 데이터를 캐시에 저장
 * 기존 데이터가 있어도 덮어쓰기 (업데이트)
 * 서버: 메모리 캐시, 클라이언트: localStorage
 */
export function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  if (typeof window === 'undefined') {
    // 서버 사이드: 메모리 캐시 사용
    serverCache.set(getCacheKey(key), entry);
  } else {
    // 클라이언트 사이드: localStorage 사용
    try {
      localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
    } catch (error) {
      // localStorage 용량 초과 등의 에러 무시
      console.warn('Failed to set cache:', error);
    }
  }
}

/**
 * 캐시에서 데이터 조회
 * 항상 반환 (TTL 체크 없음)
 * 서버: 메모리 캐시, 클라이언트: localStorage
 */
export function getCache<T>(key: string): CacheEntry<T> | null {
  const cacheKey = getCacheKey(key);

  if (typeof window === 'undefined') {
    // 서버 사이드: 메모리 캐시 사용
    const cached = serverCache.get(cacheKey);
    return cached || null;
  } else {
    // 클라이언트 사이드: localStorage 사용
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      return entry;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }
}

/**
 * 캐시된 데이터의 타임스탬프 조회 (표시용)
 * 클라이언트에서만 사용 (서버에서는 사용 안 함)
 */
export function getCacheTimestamp(key: string): number | null {
  if (typeof window === 'undefined') return null; // 서버에서는 사용 안 함
  
  const entry = getCache(key);
  return entry ? entry.timestamp : null;
}

/**
 * 특정 키의 캐시 삭제 (사용 안함, 업데이트만 함)
 */
export function removeCache(key: string): void {
  const cacheKey = getCacheKey(key);
  
  if (typeof window === 'undefined') {
    // 서버 사이드: 메모리 캐시에서 삭제
    serverCache.delete(cacheKey);
  } else {
    // 클라이언트 사이드: localStorage에서 삭제
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }
}

/**
 * 모든 캐시 삭제 (디버깅용)
 */
export function clearCache(): void {
  if (typeof window === 'undefined') {
    // 서버 사이드: 메모리 캐시 삭제
    serverCache.clear();
  } else {
    // 클라이언트 사이드: localStorage 삭제
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

/**
 * 캐시 키 생성 헬퍼 함수들
 */
export const CacheKeys = {
  blocks: (page: number, limit: number) => `blocks_${page}_${limit}`,
  blockByNumber: (number: number) => `block_number_${number}`,
  blockByHash: (hash: string) => `block_hash_${hash}`,
  transactions: (page: number, limit: number) => `transactions_${page}_${limit}`,
  transactionByHash: (hash: string) => `transaction_${hash}`,
  transactionsByAddress: (address: string, page: number, limit: number) =>
    `transactions_address_${address}_${page}_${limit}`,
  account: (address: string) => `account_${address}`,
  tokenBalances: (address: string, page: number, limit: number) =>
    `token_balances_${address}_${page}_${limit}`,
  contracts: (page: number, limit: number) => `contracts_${page}_${limit}`,
  contract: (address: string) => `contract_${address}`,
  contractsByDeployer: (address: string, page: number, limit: number) =>
    `contracts_deployer_${address}_${page}_${limit}`,
};

