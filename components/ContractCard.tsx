"use client";

import { Contract } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ContractCardProps {
  contract: Contract;
}

export default function ContractCard({ contract }: ContractCardProps) {
  const timeAgo = getTimeAgo(Number(contract.timestamp));
  const isDeployed = contract.status === 1;
  const router = useRouter();

  const handleDeployerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/address/${contract.deployer}`);
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/blocks/${contract.blockNumber}`);
  };

  return (
    <Link
      href={`/contracts/${contract.address}`}
      className="block p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
        <div className="text-base md:text-lg font-semibold text-blue-600 dark:text-blue-400">
          {contract.name || "Contract"}
        </div>
        <div className="flex items-center space-x-2">
          {contract.status !== undefined && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                isDeployed
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {isDeployed ? "Deployed" : "Failed"}
            </span>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {timeAgo}
          </div>
        </div>
      </div>
      <div className="space-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-300">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24">
            Address:
          </span>
          <span className="font-mono break-all sm:truncate">
            {contract.address.slice(0, 12)}...
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24">
            Deployer:
          </span>
          <span
            onClick={handleDeployerClick}
            className="font-mono break-all sm:truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          >
            {contract.deployer.slice(0, 12)}...
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500 dark:text-gray-400 w-20 sm:w-24">
            Block:
          </span>
          <span
            onClick={handleBlockClick}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            #{contract.blockNumber}
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
