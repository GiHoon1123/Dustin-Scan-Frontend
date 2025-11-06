import BlockCard from "@/components/BlockCard";
import TransactionCard from "@/components/TransactionCard";
import UniversalSearchBar from "@/components/UniversalSearchBar";
import { getBlocks, getTransactions } from "@/lib/api";
import Link from "next/link";

export default async function HomePage() {
  // 최신 블록 10개
  const blocksData = await getBlocks(1, 10);
  const blocks = blocksData.data.items;

  // 최신 트랜잭션 10개
  const txsData = await getTransactions(1, 10);
  const transactions = txsData.data.items;

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
          <div className="space-y-2 md:space-y-3">
            {blocks.map((block) => (
              <BlockCard key={block.hash} block={block} />
            ))}
          </div>
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
          <div className="space-y-2 md:space-y-3">
            {transactions.map((tx) => (
              <TransactionCard key={tx.hash} transaction={tx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
