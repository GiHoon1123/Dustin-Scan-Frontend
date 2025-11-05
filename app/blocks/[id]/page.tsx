import BlockTransactions from "@/components/BlockTransactions";
import TransactionCountButton from "@/components/TransactionCountButton";
import {
  getBlockByHash,
  getBlockByNumber,
  getTransactionByHash,
} from "@/lib/api";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 해시인지 블록 번호인지 구분 (0x로 시작하면 해시)
  const isHash = id.startsWith("0x");

  let block;
  try {
    const blockData = isHash
      ? await getBlockByHash(id)
      : await getBlockByNumber(Number(id));
    block = blockData.data;
  } catch (error) {
    // 블록이 없으면, 해시인 경우 트랜잭션으로 확인
    if (isHash && id.length === 66) {
      // 0x + 64자 = 해시
      try {
        await getTransactionByHash(id);
        // 트랜잭션이 존재하면 리다이렉트
        redirect(`/transactions/${id}`);
      } catch (txError) {
        // 트랜잭션도 없으면 not found
        notFound();
      }
    }
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Block #{block.number}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          <InfoRow label="Block Hash" value={block.hash} mono />
          <InfoRow label="Parent Hash" value={block.parentHash} mono />
          <InfoRow
            label="Proposer"
            value={block.proposer}
            mono
            link={`/address/${block.proposer}`}
          />
          <InfoRow label="Block Number" value={block.number} />
          <InfoRow
            label="Timestamp"
            value={new Date(Number(block.timestamp) * 1000).toLocaleString()}
          />
          <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
              Transactions:
            </div>
            <div className="flex-1">
              <TransactionCountButton count={block.transactionCount} />
            </div>
          </div>
          <InfoRow label="State Root" value={block.stateRoot} mono />
          <InfoRow
            label="Transactions Root"
            value={block.transactionsRoot}
            mono
          />
          <InfoRow label="Receipts Root" value={block.receiptsRoot} mono />
        </div>
      </div>

      {/* 트랜잭션 목록 */}
      {block.transactions && block.transactions.length > 0 && (
        <div id="block-transactions">
          <BlockTransactions transactions={block.transactions} />
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
      <div className="text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
        {label}:
      </div>
      <div
        className={`flex-1 ${
          mono ? "font-mono text-sm" : ""
        } break-all text-gray-900 dark:text-white`}
      >
        {link ? (
          <Link
            href={link}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
