import BlockCard from "@/components/BlockCard";
import TransactionCard from "@/components/TransactionCard";
import UniversalSearchBar from "@/components/UniversalSearchBar";
import CacheIndicator from "@/components/CacheIndicator";
import { getBlocks, getTransactions } from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import Link from "next/link";

export default async function HomePage() {
  let blocks: any[] = [];
  let transactions: any[] = [];
  let blocksFromCache = false;
  let txsFromCache = false;

  // 최신 블록 10개
  try {
    const blocksData = await getBlocks(1, 10);
    blocks = blocksData.data.items;
  } catch (error) {
    // 에러 발생 시 빈 배열 (캐시는 API 함수 내부에서 처리됨)
    blocks = [];
    blocksFromCache = true;
  }

  // 최신 트랜잭션 10개
  try {
    const txsData = await getTransactions(1, 10);
    transactions = txsData.data.items;
  } catch (error) {
    // 에러 발생 시 빈 배열 (캐시는 API 함수 내부에서 처리됨)
    transactions = [];
    txsFromCache = true;
  }

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
            <div className="flex items-center gap-2">
              {blocksFromCache && (
                <CacheIndicator cacheKey={CacheKeys.blocks(1, 10)} />
              )}
              <Link
                href="/blocks"
                className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span className="hidden sm:inline">VIEW ALL BLOCKS →</span>
                <span className="sm:hidden">ALL →</span>
              </Link>
            </div>
          </div>
          <div className="space-y-2 md:space-y-3">
            {blocks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                서버 연결 실패
              </div>
            ) : (
              blocks.map((block) => (
                <BlockCard key={block.hash} block={block} />
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 최신 트랜잭션 */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              💸 Latest Transactions
            </h2>
            <div className="flex items-center gap-2">
              {txsFromCache && (
                <CacheIndicator cacheKey={CacheKeys.transactions(1, 10)} />
              )}
              <Link
                href="/transactions"
                className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span className="hidden sm:inline">VIEW ALL TRANSACTIONS →</span>
                <span className="sm:hidden">ALL →</span>
              </Link>
            </div>
          </div>
          <div className="space-y-2 md:space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                서버 연결 실패
              </div>
            ) : (
              transactions.map((tx) => (
                <TransactionCard key={tx.hash} transaction={tx} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
