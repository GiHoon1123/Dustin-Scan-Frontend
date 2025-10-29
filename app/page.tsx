import BlockCard from "@/components/BlockCard";
import TransactionCard from "@/components/TransactionCard";
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
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 제목 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dustin Blockchain Explorer
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore blocks, transactions, and accounts on Dustin Chain
        </p>
      </div>

      {/* 좌우 분할: 최신 블록 (왼쪽) + 최신 트랜잭션 (오른쪽) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 최신 블록 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📦 Latest Blocks
            </h2>
            <Link
              href="/blocks"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              VIEW ALL BLOCKS →
            </Link>
          </div>
          <div className="space-y-3">
            {blocks.map((block) => (
              <BlockCard key={block.hash} block={block} />
            ))}
          </div>
        </div>

        {/* 오른쪽: 최신 트랜잭션 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              💸 Latest Transactions
            </h2>
            <Link
              href="/transactions"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              VIEW ALL TRANSACTIONS →
            </Link>
          </div>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <TransactionCard key={tx.hash} transaction={tx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
