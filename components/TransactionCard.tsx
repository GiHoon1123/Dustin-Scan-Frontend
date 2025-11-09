"use client";

import { Transaction } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TransactionCardProps {
  transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const timeAgo = getTimeAgo(Number(transaction.timestamp));
  const isSuccess = transaction.status === 1;
  const router = useRouter();

  const handleAddressClick = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/address/${address}`);
  };

  return (
    <Link
      href={`/transactions/${transaction.hash}`}
      className="block p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
        <div className="text-xs md:text-sm font-mono text-blue-600 dark:text-blue-400 break-all sm:truncate">
          {transaction.hash.slice(0, 20)}...
        </div>
        <div className="flex items-center space-x-2">
          {transaction.status !== undefined && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                isSuccess
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {isSuccess ? "Success" : "Failed"}
            </span>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {timeAgo}
          </div>
        </div>
      </div>
      <div className="space-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-300">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 w-16">From:</span>
          <span
            onClick={(e) => handleAddressClick(e, transaction.from)}
            className="font-mono break-all sm:truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          >
            {transaction.from}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 w-16">To:</span>
          <span
            onClick={(e) => handleAddressClick(e, transaction.to)}
            className="font-mono break-all sm:truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          >
            {transaction.to}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 w-16">Value:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {transaction.value} DSTN
          </span>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const timestampMs = timestamp * 1000; // 유닉스 타임스탬프(초)를 밀리초로 변환
  const diff = now - timestampMs;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (seconds < 60) return `${seconds} secs ago`;
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}
