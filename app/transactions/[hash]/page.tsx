import TransactionLogs from "@/components/TransactionLogs";
import CacheIndicator from "@/components/CacheIndicator";
import { getTransactionByHash } from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import Link from "next/link";

import type { Transaction } from "@/lib/types";

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ hash: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { hash } = await params;
  const search = await searchParams;
  const view = search.view === "logs" ? "logs" : "overview";

  let tx: Transaction;
  let fromCache = false;
  try {
    const txData = await getTransactionByHash(hash);
    tx = txData.data as Transaction;
  } catch (error) {
    // 캐시 확인
    if (typeof window !== 'undefined') {
      const cached = require("@/lib/cache").getCache(CacheKeys.transactionByHash(hash));
      if (cached) {
        tx = cached.data.data as Transaction;
        fromCache = true;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  const isSuccess = tx.status === 1;

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Transaction Details
        </h1>
        {fromCache && <CacheIndicator cacheKey={CacheKeys.transactionByHash(hash)} />}
      </div>

      <div className="mb-4 md:mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <Link
            href={`/transactions/${hash}`}
            className={`pb-2 text-xs md:text-sm font-semibold border-b-2 transition-colors ${
              view === "overview"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Overview
          </Link>
          <Link
            href={`/transactions/${hash}?view=logs`}
            className={`pb-2 text-xs md:text-sm font-semibold border-b-2 transition-colors ${
              view === "logs"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Logs
          </Link>
        </div>
      </div>

      {view === "overview" ? (
        <>
          {/* Status Badge */}
          {tx.status !== undefined && (
            <div className="mb-4 md:mb-6">
              <span
                className={`inline-block px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold ${
                  isSuccess
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {isSuccess ? "✓ Success" : "✗ Failed"}
              </span>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <div className="space-y-4">
              <InfoRow label="Transaction Hash" value={tx.hash} mono />
              <InfoRow
                label="Block Number"
                value={tx.blockNumber}
                link={`/blocks/${tx.blockNumber}`}
              />
              <InfoRow label="Block Hash" value={tx.blockHash} mono />
              <InfoRow
                label="From"
                value={tx.from}
                mono
                link={`/address/${tx.from}`}
              />
              <InfoRow
                label="To"
                value={tx.to}
                mono
                link={`/address/${tx.to}`}
              />
              <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
                  Value:
                </div>
                <div className="flex-1">
                  <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                    {tx.value} DSTN
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                    {tx.valueWei} Wei
                  </div>
                </div>
              </div>
              <InfoRow label="Nonce" value={tx.nonce.toString()} />
              <InfoRow
                label="Timestamp"
                value={new Date(Number(tx.timestamp) * 1000).toLocaleString()}
              />
              {tx.gasUsed && <InfoRow label="Gas Used" value={tx.gasUsed} />}
              {tx.cumulativeGasUsed && (
                <InfoRow
                  label="Cumulative Gas Used"
                  value={tx.cumulativeGasUsed}
                />
              )}
              {tx.contractAddress && (
                <InfoRow
                  label="Contract Address"
                  value={tx.contractAddress}
                  mono
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <TransactionLogs logs={tx.logs ?? []} />
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
