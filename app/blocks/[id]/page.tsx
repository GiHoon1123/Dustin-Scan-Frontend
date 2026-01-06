"use client";

import BlockTransactions from "@/components/BlockTransactions";
import TransactionCountButton from "@/components/TransactionCountButton";
import CacheIndicator from "@/components/CacheIndicator";
import DataLoader from "@/components/DataLoader";
import {
  getBlockByHash,
  getBlockByNumber,
  getTransactionByHash,
} from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function BlockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 해시인지 블록 번호인지 구분 (0x로 시작하면 해시)
  const isHash = id.startsWith("0x");

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <DataLoader
        cacheKey={isHash ? CacheKeys.blockByHash(id) : CacheKeys.blockByNumber(Number(id))}
        loadData={async () => {
          try {
            const blockData = isHash
              ? await getBlockByHash(id)
              : await getBlockByNumber(Number(id));
            return blockData.data;
          } catch (error) {
            // 블록이 없으면, 해시인 경우 트랜잭션으로 확인
            if (isHash && id.length === 66) {
              try {
                await getTransactionByHash(id);
                router.push(`/transactions/${id}`);
                // 리다이렉트되므로 여기서는 null 반환
                return null;
              } catch (txError) {
                // 트랜잭션도 없으면 에러 다시 던지기
                throw error;
              }
            }
            throw error;
          }
        }}
        render={(block, isLoading, fromCache) => {
          if (isLoading) {
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                로딩 중...
              </div>
            );
          }

          if (!block) {
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                블록을 찾을 수 없습니다.
              </div>
            );
          }

          return (
            <>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Block #{block.number}
                </h1>
                {fromCache && (
                  <CacheIndicator
                    cacheKey={isHash ? CacheKeys.blockByHash(id) : CacheKeys.blockByNumber(Number(id))}
                  />
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
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
            </>
          );
        }}
      />
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
      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
        {label}:
      </div>
      <div
        className={`flex-1 ${
          mono ? "font-mono text-xs md:text-sm" : "text-sm md:text-base"
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

