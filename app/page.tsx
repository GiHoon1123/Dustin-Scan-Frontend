"use client";

import BlockCard from "@/components/BlockCard";
import TransactionCard from "@/components/TransactionCard";
import UniversalSearchBar from "@/components/UniversalSearchBar";
import DataLoader from "@/components/DataLoader";
import { getBlocks, getTransactions } from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import Link from "next/link";

export default function HomePage() {

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* 페이지 제목 */}
      <div className="mb-4 md:mb-6 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Dustin Blockchain Explorer
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
          Explore blocks, transactions, and accounts on Dustin Chain
        </p>
      </div>

      {/* 통합 검색창 */}
      <UniversalSearchBar />

      {/* 좌우 분할: 최신 블록 (왼쪽) + 최신 트랜잭션 (오른쪽) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 왼쪽: 최신 블록 */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              📦 Latest Blocks
            </h2>
            <Link
              href="/blocks"
              className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span className="hidden sm:inline">VIEW ALL BLOCKS →</span>
              <span className="sm:hidden">ALL →</span>
            </Link>
          </div>
          <DataLoader
            cacheKey={CacheKeys.blocks(1, 10)}
            loadData={async () => {
              const data = await getBlocks(1, 10);
              return data.data.items;
            }}
            render={(blocks, isLoading, fromCache) => (
              <>
                <div className="space-y-2 md:space-y-3">
                  {isLoading ? (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                      로딩 중...
                    </div>
                  ) : blocks && blocks.length > 0 ? (
                    blocks.map((block: any) => (
                      <BlockCard key={block.hash} block={block} />
                    ))
                  ) : (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                      서버 연결 실패
                    </div>
                  )}
                </div>
                {fromCache && !isLoading && (
                  <div className="mt-2">
                    <CacheIndicator cacheKey={CacheKeys.blocks(1, 10)} />
                  </div>
                )}
              </>
            )}
          />
        </div>

        {/* 오른쪽: 최신 트랜잭션 */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              💸 Latest Transactions
            </h2>
            <Link
              href="/transactions"
              className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span className="hidden sm:inline">VIEW ALL TRANSACTIONS →</span>
              <span className="sm:hidden">ALL →</span>
            </Link>
          </div>
          <DataLoader
            cacheKey={CacheKeys.transactions(1, 10)}
            loadData={async () => {
              const data = await getTransactions(1, 10);
              return data.data.items;
            }}
            render={(transactions, isLoading, fromCache) => (
              <>
                <div className="space-y-2 md:space-y-3">
                  {isLoading ? (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                      로딩 중...
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    transactions.map((tx: any) => (
                      <TransactionCard key={tx.hash} transaction={tx} />
                    ))
                  ) : (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                      서버 연결 실패
                    </div>
                  )}
                </div>
                {fromCache && !isLoading && (
                  <div className="mt-2">
                    <CacheIndicator cacheKey={CacheKeys.transactions(1, 10)} />
                  </div>
                )}
              </>
            )}
          />
        </div>
      </div>
    </div>
  );
}
