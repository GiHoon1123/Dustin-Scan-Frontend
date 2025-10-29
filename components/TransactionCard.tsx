"use client";

import { Transaction } from "@/lib/types";
import Link from "next/link";

interface TransactionCardProps {
  transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const timeAgo = getTimeAgo(Number(transaction.timestamp));
  const isSuccess = transaction.status === 1;

  return (
    <Link
      href={`/transactions/${transaction.hash}`}
      className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-mono text-blue-600 dark:text-blue-400 truncate">
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
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo}
          </div>
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 w-16">From:</span>
          <Link
            href={`/address/${transaction.from}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono truncate hover:text-blue-600 dark:hover:text-blue-400"
          >
            {transaction.from}
          </Link>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 w-16">To:</span>
          <Link
            href={`/address/${transaction.to}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono truncate hover:text-blue-600 dark:hover:text-blue-400"
          >
            {transaction.to}
          </Link>
        </div>
        <div className="flex items-center">
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
  const seconds = Math.floor(Date.now() - timestamp);
  if (seconds < 60) return `${Math.floor(seconds / 1000)} secs ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60000)} mins ago`;
  return `${Math.floor(seconds / 3600000)} hours ago`;
}
