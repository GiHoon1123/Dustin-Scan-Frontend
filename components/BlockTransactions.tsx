"use client";

import { Transaction } from "@/lib/types";
import TransactionCard from "./TransactionCard";
import { useState } from "react";

interface BlockTransactionsProps {
  transactions: Transaction[];
}

export default function BlockTransactions({
  transactions,
}: BlockTransactionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!transactions || transactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Transactions ({transactions.length})
        </h2>
        <button className="text-gray-500 dark:text-gray-400 text-2xl">
          {isExpanded ? "▲" : "▼"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {transactions.map((tx) => (
            <TransactionCard key={tx.hash} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

