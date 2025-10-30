"use client";

import { Block } from "@/lib/types";
import Link from "next/link";

interface BlockCardProps {
  block: Block;
}

export default function BlockCard({ block }: BlockCardProps) {
  const timeAgo = getTimeAgo(Number(block.timestamp));

  return (
    <Link
      href={`/blocks/${block.number}`}
      className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
          Block #{block.number}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {timeAgo}
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 w-24">
            Proposer:
          </span>
          <Link
            href={`/address/${block.proposer}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono truncate hover:text-blue-600 dark:hover:text-blue-400"
          >
            {block.proposer.slice(0, 12)}...
          </Link>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 w-24">Txs:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {block.transactionCount}
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
