"use client";

import { useState, useEffect } from "react";
import { createWallet, getAccount, transferNative, transferStablecoin, getStablecoinBalance } from "@/lib/api";
import Link from "next/link";

interface WalletInfo {
  privateKey: string;
  publicKey: string;
  address: string;
  balance: string;
  balanceWei: string;
  nonce: number;
}

export default function WalletPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // 네이티브 코인 전송 상태
  const [nativeAddress, setNativeAddress] = useState("");
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [nativeTo, setNativeTo] = useState("");
  const [nativeAmount, setNativeAmount] = useState("");
  const [nativePrivateKey, setNativePrivateKey] = useState("");
  const [isLoadingNativeBalance, setIsLoadingNativeBalance] = useState(false);
  const [isSendingNative, setIsSendingNative] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [nativeTxHash, setNativeTxHash] = useState<string | null>(null);
  
  // 스테이블코인 전송 상태
  const [stablecoinAddress, setStablecoinAddress] = useState("");
  const [stablecoinBalance, setStablecoinBalance] = useState<string | null>(null);
  const [stablecoinTo, setStablecoinTo] = useState("");
  const [stablecoinAmount, setStablecoinAmount] = useState("");
  const [stablecoinPrivateKey, setStablecoinPrivateKey] = useState("");
  const [isLoadingStablecoinBalance, setIsLoadingStablecoinBalance] = useState(false);
  const [isSendingStablecoin, setIsSendingStablecoin] = useState(false);
  const [stablecoinError, setStablecoinError] = useState<string | null>(null);
  const [stablecoinTxHash, setStablecoinTxHash] = useState<string | null>(null);

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

  // 네이티브 코인 잔액 조회
  const handleLoadNativeBalance = async () => {
    if (!nativeAddress.trim()) {
      setNativeError("주소를 입력해주세요.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(nativeAddress)) {
      setNativeError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    setIsLoadingNativeBalance(true);
    setNativeError(null);

    try {
      const accountRes = await getAccount(nativeAddress);
      const account = accountRes.data;
      setNativeBalance(account.balance);
    } catch (err: any) {
      setNativeError(err.message || "잔액 조회에 실패했습니다.");
      setNativeBalance(null);
    } finally {
      setIsLoadingNativeBalance(false);
    }
  };

  // 스테이블코인 잔액 조회
  const handleLoadStablecoinBalance = async () => {
    if (!stablecoinAddress.trim()) {
      setStablecoinError("주소를 입력해주세요.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(stablecoinAddress)) {
      setStablecoinError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    setIsLoadingStablecoinBalance(true);
    setStablecoinError(null);

    try {
      // 스테이블코인 잔액 조회
      const balanceRes = await getStablecoinBalance(stablecoinAddress);
      setStablecoinBalance(balanceRes.balance);
    } catch (err: any) {
      setStablecoinError(err.message || "잔액 조회에 실패했습니다.");
      setStablecoinBalance(null);
    } finally {
      setIsLoadingStablecoinBalance(false);
    }
  };

  // 네이티브 코인 전송
  const handleSendNative = async () => {
    if (!nativeBalance) {
      setNativeError("먼저 잔액을 조회해주세요.");
      return;
    }

    if (!nativeTo.trim() || !nativeAmount.trim() || !nativePrivateKey.trim()) {
      setNativeError("모든 필드를 입력해주세요.");
      return;
    }

    // 주소 형식 검증
    if (!/^0x[a-fA-F0-9]{40}$/.test(nativeTo)) {
      setNativeError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    // 개인키 형식 검증
    if (!/^0x[a-fA-F0-9]{64}$/.test(nativePrivateKey)) {
      setNativeError("올바른 개인키 형식이 아닙니다. (0x로 시작하는 64자 hex)");
      return;
    }

    // 금액 검증
    const amountNum = parseFloat(nativeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setNativeError("올바른 금액을 입력해주세요.");
      return;
    }

    const balanceNum = parseFloat(nativeBalance);
    if (amountNum > balanceNum) {
      setNativeError(`잔액이 부족합니다. (보유: ${nativeBalance} DSTN, 요청: ${nativeAmount} DSTN)`);
      return;
    }

    setIsSendingNative(true);
    setNativeError(null);
    setNativeTxHash(null);

    try {
      const response = await transferNative(nativePrivateKey, nativeTo, nativeAmount);
      setNativeTxHash(response.hash);
      setNativeTo("");
      setNativeAmount("");
      // 잔액 재조회
      await handleLoadNativeBalance();
    } catch (err: any) {
      setNativeError(err.message || "전송에 실패했습니다.");
    } finally {
      setIsSendingNative(false);
    }
  };

  // 스테이블코인 전송
  const handleSendStablecoin = async () => {
    if (stablecoinBalance === null) {
      setStablecoinError("먼저 잔액을 조회해주세요.");
      return;
    }

    if (!stablecoinTo.trim() || !stablecoinAmount.trim() || !stablecoinPrivateKey.trim()) {
      setStablecoinError("모든 필드를 입력해주세요.");
      return;
    }

    // 주소 형식 검증
    if (!/^0x[a-fA-F0-9]{40}$/.test(stablecoinTo)) {
      setStablecoinError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    // 개인키 형식 검증
    if (!/^0x[a-fA-F0-9]{64}$/.test(stablecoinPrivateKey)) {
      setStablecoinError("올바른 개인키 형식이 아닙니다. (0x로 시작하는 64자 hex)");
      return;
    }

    // 금액 검증
    const amountNum = parseFloat(stablecoinAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setStablecoinError("올바른 금액을 입력해주세요.");
      return;
    }

    const balanceNum = parseFloat(stablecoinBalance);
    if (amountNum > balanceNum) {
      setStablecoinError(`잔액이 부족합니다. (보유: ${stablecoinBalance} 스테이블코인, 요청: ${stablecoinAmount} 스테이블코인)`);
      return;
    }

    setIsSendingStablecoin(true);
    setStablecoinError(null);
    setStablecoinTxHash(null);

    try {
      const response = await transferStablecoin(stablecoinPrivateKey, stablecoinTo, stablecoinAmount);
      setStablecoinTxHash(response.hash);
      setStablecoinTo("");
      setStablecoinAmount("");
      // 잔액 재조회
      await handleLoadStablecoinBalance();
    } catch (err: any) {
      setStablecoinError(err.message || "전송에 실패했습니다.");
    } finally {
      setIsSendingStablecoin(false);
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded text-sm text-gray-900 dark:text-white font-semibold">
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
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                      {wallet.balanceWei} Wei
                    </code>
                    <button
                      onClick={() => handleCopy(wallet.balanceWei, "balanceWei")}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition flex items-center gap-1"
                      title="복사"
                    >
                      {copiedField === "balanceWei" ? (
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

      {/* 잔액 조회 및 전송 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        {/* 네이티브 코인 전송 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💰 코인 전송 (네이티브 코인)
          </h2>
          
          {/* 잔액 조회 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              지갑 주소
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nativeAddress}
                onChange={(e) => setNativeAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
              <button
                onClick={handleLoadNativeBalance}
                disabled={isLoadingNativeBalance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm transition font-semibold disabled:cursor-not-allowed"
              >
                {isLoadingNativeBalance ? "조회 중..." : "잔액 조회"}
              </button>
            </div>
          </div>

          {nativeError && nativeBalance === null && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{nativeError}</p>
            </div>
          )}

          {nativeBalance !== null && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                현재 잔액: <span className="font-semibold">{nativeBalance} DSTN</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                수신자 주소
              </label>
              <input
                type="text"
                value={nativeTo}
                onChange={(e) => setNativeTo(e.target.value)}
                placeholder="0x..."
                disabled={nativeBalance === null}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                전송 금액 (DSTN)
              </label>
              <input
                type="number"
                step="0.0001"
                value={nativeAmount}
                onChange={(e) => setNativeAmount(e.target.value)}
                placeholder="0.0"
                disabled={nativeBalance === null}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              />
              {nativeBalance !== null && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  최대: {nativeBalance} DSTN
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                개인키
              </label>
              <input
                type="password"
                value={nativePrivateKey}
                onChange={(e) => setNativePrivateKey(e.target.value)}
                placeholder="0x..."
                disabled={nativeBalance === null}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              />
            </div>

            {nativeError && nativeBalance !== null && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{nativeError}</p>
              </div>
            )}

            {nativeTxHash && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  전송 성공!
                </p>
                <Link
                  href={`/transactions/${nativeTxHash}`}
                  className="text-sm text-green-600 dark:text-green-400 hover:underline font-mono break-all"
                >
                  {nativeTxHash}
                </Link>
              </div>
            )}

            <button
              onClick={handleSendNative}
              disabled={isSendingNative || nativeBalance === null}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold disabled:cursor-not-allowed"
            >
              {isSendingNative ? "전송 중..." : "전송하기"}
            </button>
          </div>
        </div>

        {/* 스테이블코인 전송 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💵 스테이블코인 전송
          </h2>
          
          {/* 잔액 조회 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              지갑 주소
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={stablecoinAddress}
                onChange={(e) => setStablecoinAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
              <button
                onClick={handleLoadStablecoinBalance}
                disabled={isLoadingStablecoinBalance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm transition font-semibold disabled:cursor-not-allowed"
              >
                {isLoadingStablecoinBalance ? "조회 중..." : "잔액 조회"}
              </button>
            </div>
          </div>

          {stablecoinError && stablecoinBalance === null && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{stablecoinError}</p>
            </div>
          )}

          {stablecoinBalance !== null && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                현재 잔액: <span className="font-semibold">{stablecoinBalance} 스테이블코인</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                수신자 주소
              </label>
              <input
                type="text"
                value={stablecoinTo}
                onChange={(e) => setStablecoinTo(e.target.value)}
                placeholder="0x..."
                disabled={stablecoinBalance === null}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                전송 금액 (스테이블코인)
              </label>
              <input
                type="number"
                step="0.0001"
                value={stablecoinAmount}
                onChange={(e) => setStablecoinAmount(e.target.value)}
                placeholder="0.0"
                disabled={stablecoinBalance === null}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              />
              {stablecoinBalance !== null && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  최대: {stablecoinBalance} 스테이블코인
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                개인키
              </label>
              <input
                type="password"
                value={stablecoinPrivateKey}
                onChange={(e) => setStablecoinPrivateKey(e.target.value)}
                placeholder="0x..."
                disabled={stablecoinBalance === null}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              />
            </div>

            {stablecoinError && stablecoinBalance !== null && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{stablecoinError}</p>
              </div>
            )}

            {stablecoinTxHash && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  전송 성공!
                </p>
                <Link
                  href={`/transactions/${stablecoinTxHash}`}
                  className="text-sm text-green-600 dark:text-green-400 hover:underline font-mono break-all"
                >
                  {stablecoinTxHash}
                </Link>
              </div>
            )}

            <button
              onClick={handleSendStablecoin}
              disabled={isSendingStablecoin || stablecoinBalance === null}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold disabled:cursor-not-allowed"
            >
              {isSendingStablecoin ? "전송 중..." : "전송하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

