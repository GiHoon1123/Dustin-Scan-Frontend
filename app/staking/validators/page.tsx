"use client";

import { useState, useEffect } from "react";
import { getValidators } from "@/lib/api";
import { ValidatorInfo } from "@/lib/types";
import Link from "next/link";

const WEI_PER_DSTN = BigInt("1000000000000000000"); // 10^18

function weiToDstn(wei: string): string {
  try {
    const weiBigInt = BigInt(wei);
    const dstn = Number(weiBigInt) / Number(WEI_PER_DSTN);
    return dstn.toFixed(4);
  } catch {
    return "0";
  }
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp || timestamp === "0") return "-";
  try {
    const ts = parseInt(timestamp);
    if (ts === 0) return "-";
    return new Date(ts * 1000).toLocaleString("ko-KR");
  } catch {
    return timestamp;
  }
}

function getStatusBadge(status: string): { text: string; className: string } {
  if (status.includes("active_ongoing")) {
    return {
      text: "🟢 활성",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
  }
  if (status.includes("pending")) {
    return {
      text: "🟡 대기",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
  }
  if (status.includes("exited")) {
    return {
      text: "⚪ 비활성",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
  }
  return {
    text: status,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
}

export default function ValidatorsPage() {
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"stakedAmount" | "totalRewards" | "status">("stakedAmount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const loadValidators = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getValidators();
        setValidators(data.validators);
      } catch (err: any) {
        setError(err.message || "검증자 목록을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    loadValidators();
  }, []);

  const sortedValidators = [...validators].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case "stakedAmount":
        aValue = parseFloat(a.stakedAmount);
        bValue = parseFloat(b.stakedAmount);
        break;
      case "totalRewards":
        aValue = parseFloat(a.totalRewards);
        bValue = parseFloat(b.totalRewards);
        break;
      case "status":
        // 상태별 정렬: active_ongoing > pending > exited
        const statusOrder: Record<string, number> = {
          active_ongoing: 1,
          pending_initialized: 2,
          pending_queued: 3,
          active_exiting: 4,
          exited_withdrawable: 5,
          exited_withdrawn: 6,
        };
        aValue = statusOrder[a.status] || 999;
        bValue = statusOrder[b.status] || 999;
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const handleSort = (column: "stakedAmount" | "totalRewards" | "status") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          🔍 검증자 목록
        </h1>
        <Link
          href="/staking"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm"
        >
          ← 스테이킹으로 돌아가기
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">검증자 목록을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              총 {validators.length}명의 검증자
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      주소
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort("stakedAmount")}
                    >
                      스테이킹 금액
                      {sortBy === "stakedAmount" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort("status")}
                    >
                      상태
                      {sortBy === "status" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort("totalRewards")}
                    >
                      총 보상
                      {sortBy === "totalRewards" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      활성화 시간
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedValidators.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        검증자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    sortedValidators.map((validator) => {
                      const statusBadge = getStatusBadge(validator.status);
                      return (
                        <tr
                          key={validator.validatorAddress}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900 dark:text-white">
                              {validator.validatorAddress.slice(0, 10)}...
                              {validator.validatorAddress.slice(-8)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {validator.stakedAmount} DSTN
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {validator.stakedAmountWei} Wei
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${statusBadge.className}`}
                            >
                              {statusBadge.text}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {validator.status}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {validator.totalRewards} DSTN
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {validator.totalRewardsWei} Wei
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatTimestamp(validator.activatedAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Link
                              href={`/staking?address=${validator.validatorAddress}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold"
                            >
                              상세 보기
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

