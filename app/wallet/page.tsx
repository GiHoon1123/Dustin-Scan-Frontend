"use client";

import { useState, useEffect } from "react";
import { createWallet } from "@/lib/api";
import Link from "next/link";

interface WalletInfo {
  privateKey: string;
  publicKey: string;
  address: string;
  balance: string;
  nonce: number;
}

export default function WalletPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    setIsCreating(true);
    setError(null);
    setShowNotification(false);

    try {
      const response = await createWallet();
      setWallet(response.data);
      setShowNotification(true);
      
      // 5초 후 알림 자동 닫기
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || "지갑 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        Wallet
      </h1>

      {/* 알림 */}
      {showNotification && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                지갑이 성공적으로 생성되었습니다!
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                서비스 사용을 위해 지갑 생성 시 100 DSTN이 지급되었습니다.
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-auto flex-shrink-0 text-green-400 hover:text-green-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        {!wallet && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              새 지갑 생성
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              새로운 지갑을 생성하여 블록체인 서비스를 이용하세요.
            </p>
            <button
              onClick={handleCreateWallet}
              disabled={isCreating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold disabled:cursor-not-allowed"
            >
              {isCreating ? "생성 중..." : "지갑 생성"}
            </button>
          </div>
        )}

        {/* 생성된 지갑 정보 */}
        {wallet && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              생성된 지갑 정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  주소 (Address)
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded text-sm font-mono break-all text-gray-900 dark:text-white">
                    {wallet.address}
                  </code>
                  <button
                    onClick={() => handleCopy(wallet.address, "address")}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition flex items-center gap-1"
                    title="복사"
                  >
                    {copiedField === "address" ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        복사됨
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        복사
                      </>
                    )}
                  </button>
                  <Link
                    href={`/address/${wallet.address}`}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                  >
                    보기
                  </Link>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  잔액 (Balance)
                </label>
                <div className="flex items-center gap-2">
                  <p className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-white">
                    {wallet.balance} DSTN
                  </p>
                  <button
                    onClick={() => handleCopy(wallet.balance, "balance")}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition flex items-center gap-1"
                    title="복사"
                  >
                    {copiedField === "balance" ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        복사됨
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  공개키 (Public Key)
                </label>
                <div className="flex items-start gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded text-sm font-mono break-all text-gray-900 dark:text-white">
                    {wallet.publicKey}
                  </code>
                  <button
                    onClick={() => handleCopy(wallet.publicKey, "publicKey")}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition flex items-center gap-1 flex-shrink-0"
                    title="복사"
                  >
                    {copiedField === "publicKey" ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        복사됨
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  개인키 (Private Key) ⚠️
                </label>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ 개인키는 안전하게 보관하세요. 절대 공유하지 마세요!
                  </p>
                  <div className="flex items-start gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded text-sm font-mono break-all text-gray-900 dark:text-white">
                      {wallet.privateKey}
                    </code>
                    <button
                      onClick={() => handleCopy(wallet.privateKey, "privateKey")}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition flex items-center gap-1 flex-shrink-0"
                      title="복사"
                    >
                      {copiedField === "privateKey" ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          복사됨
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          복사
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

