"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ABIUploadFormProps {
  contractAddress: string;
}

export default function ABIUploadForm({ contractAddress }: ABIUploadFormProps) {
  const [abiText, setAbiText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const formatJSON = (text: string): string => {
    try {
      const parsed = JSON.parse(text.trim());
      return JSON.stringify(parsed, null, 2);
    } catch {
      return text;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const formatted = formatJSON(pastedText);
    setAbiText(formatted);
    setError(null);
  };

  const handleFormat = () => {
    if (!abiText.trim()) return;
    const formatted = formatJSON(abiText);
    setAbiText(formatted);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!abiText.trim()) {
      setError("ABI를 입력해주세요.");
      return;
    }

    let abi;
    try {
      abi = JSON.parse(abiText.trim());
    } catch (parseError) {
      setError("유효하지 않은 JSON 형식입니다. JSON을 확인해주세요.");
      return;
    }

    if (!Array.isArray(abi)) {
      setError("ABI는 배열 형식이어야 합니다.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractAddress}/abi`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ abi }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `업로드 실패: ${response.statusText}`
        );
      }

      setSuccess(true);
      // 페이지 새로고침하여 업데이트된 ABI 표시
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "ABI 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        ABI 업로드
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        컨트랙트 ABI를 JSON 형식으로 붙여넣어 업로드하세요.
      </p>

      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg">
          <p className="text-green-800 dark:text-green-200">
            ✓ ABI가 성공적으로 업로드되었습니다!
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={abiText}
          onChange={(e) => setAbiText(e.target.value)}
          onPaste={handlePaste}
          placeholder={`예시:
[
  {
    "type": "function",
    "name": "getOwner",
    "inputs": [],
    "outputs": [{ "type": "address" }],
    "stateMutability": "view"
  }
]`}
          className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUploading}
        />
        <div className="mt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={handleFormat}
            disabled={isUploading || !abiText.trim()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 rounded-lg transition text-sm"
          >
            포맷팅
          </button>
          <button
            type="submit"
            disabled={isUploading || !abiText.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition font-semibold"
          >
            {isUploading ? "업로드 중..." : "ABI 업로드"}
          </button>
        </div>
      </form>
    </div>
  );
}

