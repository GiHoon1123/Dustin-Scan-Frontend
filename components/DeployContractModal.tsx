"use client";

import { deployContract } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

interface DeployContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeployContractModal({
  isOpen,
  onClose,
}: DeployContractModalProps) {
  const [bytecode, setBytecode] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    transactionHash: string;
    status: string;
  } | null>(null);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!bytecode.trim()) {
      setError("바이트코드를 입력해주세요.");
      return;
    }

    const trimmed = bytecode.trim();

    // 바이트코드 검증
    if (!trimmed.startsWith("0x")) {
      setError("바이트코드는 0x로 시작해야 합니다.");
      return;
    }

    if (!/^0x[a-fA-F0-9]*$/.test(trimmed)) {
      setError("유효하지 않은 바이트코드 형식입니다. (hex string만 허용)");
      return;
    }

    setIsDeploying(true);

    try {
      const response = await deployContract(trimmed);
      setResult(response.data);
    } catch (err: any) {
      setError(err.message || "배포 중 오류가 발생했습니다.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    setBytecode("");
    setError(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-0 md:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-none md:rounded-lg shadow-xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
            Deploy Contract
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition p-2 min-h-[44px] min-w-[44px]"
            aria-label="닫기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-auto flex-1">
          {/* 경고 배너 */}
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>주의:</strong> 현재는 체인 내부 임의의 계정으로
              배포됩니다. 메타마스크 연동 전까지 제한이 있습니다.
            </p>
          </div>

          <form onSubmit={handleDeploy}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bytecode
              </label>
              <textarea
                value={bytecode}
                onChange={(e) => setBytecode(e.target.value)}
                placeholder="0x608060405234801561000f575f5ffd5b..."
                className="w-full h-48 md:h-64 p-3 md:p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isDeploying || !!result}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                컴파일된 컨트랙트 바이트코드를 입력하세요. (0x로 시작하는 hex
                string)
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {result && (
              <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✓ 배포 트랜잭션이 제출되었습니다!
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                      Transaction Hash:
                    </p>
                    <Link
                      href={`/transactions/${result.transactionHash}`}
                      className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {result.transactionHash}
                    </Link>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    Status: {result.status}
                  </p>
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs text-blue-800 dark:text-blue-200">
                    💡 트랜잭션이 블록에 포함되면 컨트랙트 주소가 생성됩니다. 몇
                    초 후 컨트랙트 목록에서 확인할 수 있습니다.
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeploying}
                className="px-4 md:px-6 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 min-h-[44px]"
              >
                {result ? "닫기" : "취소"}
              </button>
              {!result && (
                <button
                  type="submit"
                  disabled={isDeploying || !bytecode.trim()}
                  className="px-4 md:px-6 py-2 text-sm md:text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition font-semibold min-h-[44px]"
                >
                  {isDeploying ? "배포 중..." : "Deploy"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
