"use client";

import { callContract, executeContract } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

interface ABIFunction {
  name: string;
  type: string;
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  stateMutability: string;
}

interface ContractInteractionProps {
  contractAddress: string;
  abi: any[];
}

export default function ContractInteraction({
  contractAddress,
  abi,
}: ContractInteractionProps) {
  const [selectedTab, setSelectedTab] = useState<"read" | "write">("read");

  // ABI에서 함수만 필터링
  const functions: ABIFunction[] = (abi || []).filter(
    (item) => item.type === "function"
  ) as ABIFunction[];

  // 읽기/쓰기 함수 분류
  const readFunctions = functions.filter(
    (f) => f.stateMutability === "view" || f.stateMutability === "pure"
  );
  const writeFunctions = functions.filter(
    (f) =>
      f.stateMutability === "nonpayable" || f.stateMutability === "payable"
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Contract Interaction
      </h2>

      {/* 탭 */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSelectedTab("read")}
          className={`px-4 py-2 font-semibold transition ${
            selectedTab === "read"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Read Contract ({readFunctions.length})
        </button>
        <button
          onClick={() => setSelectedTab("write")}
          className={`px-4 py-2 font-semibold transition ${
            selectedTab === "write"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Write Contract ({writeFunctions.length})
        </button>
      </div>

      {/* 함수 목록 */}
      <div className="space-y-4">
        {selectedTab === "read" ? (
          readFunctions.length > 0 ? (
            readFunctions.map((func, index) => (
              <FunctionCard
                key={`read-${index}`}
                func={func}
                contractAddress={contractAddress}
                isRead={true}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              읽기 함수가 없습니다.
            </div>
          )
        ) : writeFunctions.length > 0 ? (
          writeFunctions.map((func, index) => (
            <FunctionCard
              key={`write-${index}`}
              func={func}
              contractAddress={contractAddress}
              isRead={false}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            쓰기 함수가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

interface FunctionCardProps {
  func: ABIFunction;
  contractAddress: string;
  isRead: boolean;
}

function FunctionCard({ func, contractAddress, isRead }: FunctionCardProps) {
  const [params, setParams] = useState<{ [key: number]: string }>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParamChange = (index: number, value: string) => {
    setParams((prev) => ({ ...prev, [index]: value }));
  };

  const handleCall = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 파라미터 배열 생성 (순서대로)
      const paramsArray = func.inputs.map((input, index) => {
        const value = params[index] || "";
        const trimmed = value.trim();
        
        // 빈 값 처리
        if (!trimmed) {
          // 숫자 타입은 0으로, bool은 false로, 나머지는 빈 문자열
          if (input.type.startsWith("uint") || input.type.startsWith("int")) {
            return "0";
          }
          if (input.type === "bool") {
            return "false";
          }
          return "";
        }
        
        // address 타입은 소문자로 변환 (백엔드에서 처리할 수도 있지만 일관성을 위해)
        if (input.type === "address") {
          return trimmed.toLowerCase();
        }
        
        return trimmed;
      });

      if (isRead) {
        const response = await callContract(
          contractAddress,
          func.name,
          paramsArray
        );
        setResult(response.data);
      } else {
        const response = await executeContract(
          contractAddress,
          func.name,
          paramsArray
        );
        setResult(response.data);
      }
    } catch (err: any) {
      setError(err.message || "호출 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputType = (type: string): string => {
    if (type.startsWith("uint") || type.startsWith("int")) return "number";
    if (type === "bool") return "checkbox";
    if (type === "address") return "text";
    return "text";
  };

  const formatResult = (result: any): string => {
    if (result === null || result === undefined) return "null";
    if (typeof result === "object") {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {func.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {func.inputs.length > 0
              ? func.inputs
                  .map((input) => `${input.name || ""}: ${input.type}`)
                  .join(", ")
              : "No parameters"}
          </p>
        </div>
        <button className="text-gray-500 dark:text-gray-400">
          {isExpanded ? "▲" : "▼"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* 입력 필드 */}
          {func.inputs.length > 0 && (
            <div className="space-y-3">
              {func.inputs.map((input, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {input.name || `param${index}`} ({input.type})
                  </label>
                  {getInputType(input.type) === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={params[index] === "true"}
                      onChange={(e) =>
                        handleParamChange(index, e.target.checked ? "true" : "false")
                      }
                      className="w-5 h-5"
                    />
                  ) : (
                    <input
                      type={getInputType(input.type)}
                      value={params[index] || ""}
                      onChange={(e) => handleParamChange(index, e.target.value)}
                      placeholder={`Enter ${input.type}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 호출 버튼 */}
          <button
            onClick={handleCall}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
              isRead
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isLoading
              ? "처리 중..."
              : isRead
              ? "Call"
              : "Write"}
          </button>

          {/* 결과 표시 */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                {isRead ? "Result:" : "Transaction:"}
              </p>
              {isRead ? (
                <pre className="text-xs text-green-800 dark:text-green-200 overflow-x-auto">
                  {formatResult(result.decodedResult || result.result)}
                </pre>
              ) : (
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
                  <div>
                    <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                      Status:
                    </p>
                    <p className="text-xs text-green-800 dark:text-green-200">
                      {result.status}
                      {result.status === "pending" && (
                        <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                          (트랜잭션이 블록에 포함될 때까지 기다려주세요)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs text-blue-800 dark:text-blue-200">
                    💡 트랜잭션이 블록에 포함되면 상태가 변경됩니다. 
                    트랜잭션 해시를 클릭하여 상세 정보를 확인하세요.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

