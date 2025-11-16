"use client";

import { useState } from "react";

import type { TransactionLog } from "@/lib/types";

type DisplayMode = "hex" | "dec";

interface TransactionLogsProps {
  logs: TransactionLog[];
}

export default function TransactionLogs({ logs }: TransactionLogsProps) {
  if (!logs.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
          Transaction Receipt Event Logs
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
          이 트랜잭션과 관련된 이벤트 로그가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
        Transaction Receipt Event Logs ({logs.length})
      </h2>

      <div className="space-y-4 md:space-y-6">
        {logs.map((log, index) => (
          <div
            key={`${log.logIndex ?? index}-${log.address}-${index}`}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 text-xs md:text-sm text-gray-700 dark:text-gray-200"
          >
            <div className="mb-2 font-semibold text-gray-900 dark:text-white">
              Log #{log.logIndex ?? index}
            </div>
            <div className="mb-2">
              <span className="text-gray-500 dark:text-gray-400 mr-2">
                Address:
              </span>
              <span className="font-mono break-all">{log.address}</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-500 dark:text-gray-400 block mb-1">
                Topics:
              </span>
              <div className="space-y-1">
                {log.topics?.length ? (
                  log.topics.map((topic, topicIndex) => {
                    const isEventSignature = topicIndex === 0;
                    const looksLikePaddedAddress =
                      topic.length === 66 &&
                      topic.startsWith("0x000000000000000000000000");

                    return (
                      <div key={topicIndex} className="flex flex-col gap-0.5">
                        <div className="flex gap-2">
                          <span className="text-gray-500 dark:text-gray-400 min-w-[32px]">
                            {topicIndex}:
                          </span>
                          {isEventSignature ? (
                            <span className="font-mono break-all">{topic}</span>
                          ) : (
                            <ValueWithToggle
                              hex={topic}
                              treatAsAddress={looksLikePaddedAddress}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    (no topics)
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1">
                Data:
              </span>
              <ValueWithToggle hex={log.data} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValueWithToggle({
  hex,
  treatAsAddress = false,
}: {
  hex: string;
  treatAsAddress?: boolean;
}) {
  const [mode, setMode] = useState<DisplayMode>("hex");
  const value = formatValue(hex, mode, treatAsAddress);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <span className="font-mono break-all">{value}</span>
        <div className="flex gap-1 text-[10px] md:text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode("hex")}
            className={`px-1.5 py-0.5 rounded border ${
              mode === "hex"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
            }`}
          >
            Hex
          </button>
          <button
            type="button"
            onClick={() => setMode("dec")}
            className={`px-1.5 py-0.5 rounded border ${
              mode === "dec"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
            }`}
          >
            Dec
          </button>
        </div>
      </div>
    </div>
  );
}

function formatValue(
  value: string,
  mode: DisplayMode,
  treatAsAddress: boolean
): string {
  if (!value) return "";

  // 주소 후보 + Dec 모드면 패딩 제거한 지갑주소로 표시
  if (
    treatAsAddress &&
    mode === "dec" &&
    value.length === 66 &&
    value.startsWith("0x000000000000000000000000")
  ) {
    return `0x${value.slice(-40)}`;
  }

  if (mode === "hex") return value;

  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (!hex) return "";

  try {
    const bigint = BigInt("0x" + hex);
    return bigint.toString(10);
  } catch {
    return value;
  }
}
