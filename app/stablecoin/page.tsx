"use client";

import { useState, useEffect, useMemo } from "react";
import {
  depositCollateral,
  getAccount,
  getStablecoinHealth,
  getStablecoinPosition,
  liquidateStablecoin,
  mintStablecoin,
  redeemStablecoin,
  withdrawCollateral,
} from "@/lib/api";
import { StablecoinPosition } from "@/lib/types";
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

function dstnToWei(dstn: string): string {
  try {
    const dstnNum = parseFloat(dstn);
    if (isNaN(dstnNum) || dstnNum < 0) {
      throw new Error("Invalid amount");
    }
    const wei = BigInt(Math.floor(dstnNum * Number(WEI_PER_DSTN)));
    return wei.toString();
  } catch {
    return "0";
  }
}

// 유효성 검사 함수들
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidPrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}

function isValidAmount(amount: string): boolean {
  if (!amount.trim()) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

export default function StablecoinPage() {
  const [activeTab, setActiveTab] = useState<"deposit" | "mint" | "redeem" | "withdraw">("deposit");
  const [positionAddress, setPositionAddress] = useState("");
  const [position, setPosition] = useState<StablecoinPosition | null>(null);
  const [health, setHealth] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);

  // 작업 폼 상태
  const [userAddress, setUserAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);

  // 청산 폼 상태
  const [liquidateAddress, setLiquidateAddress] = useState("");
  const [liquidatePrivateKey, setLiquidatePrivateKey] = useState("");
  const [isLiquidating, setIsLiquidating] = useState(false);
  const [liquidateError, setLiquidateError] = useState<string | null>(null);
  const [liquidateTxHash, setLiquidateTxHash] = useState<string | null>(null);

  const handleLoadPosition = async () => {
    if (!positionAddress.trim()) {
      setPositionError("주소를 입력해주세요.");
      return;
    }

    if (!isValidAddress(positionAddress)) {
      setPositionError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    setIsLoadingPosition(true);
    setPositionError(null);

    try {
      const [positionRes, healthRes, accountRes] = await Promise.all([
        getStablecoinPosition(positionAddress),
        getStablecoinHealth(positionAddress),
        getAccount(positionAddress),
      ]);
      setPosition(positionRes);
      setHealth(healthRes.isHealthy);
      // 계정 잔고 설정 (CommonResponseDto로 감싸져 있음)
      const accountData = accountRes.data || accountRes;
      // balanceWei를 사용 (Wei 단위)
      setBalance(accountData.balanceWei || accountData.balance || "0");
      // 작업 폼의 주소도 자동으로 설정
      setUserAddress(positionAddress);
    } catch (err: any) {
      setPositionError(err.message || "포지션 조회에 실패했습니다.");
      setPosition(null);
      setHealth(null);
      setBalance(null);
    } finally {
      setIsLoadingPosition(false);
    }
  };

  const handleSubmit = async () => {
    // 포지션 조회 확인
    if (!position || !balance || positionAddress.toLowerCase() !== userAddress.toLowerCase()) {
      setSubmitError("먼저 포지션을 조회해주세요. (위의 포지션 조회 섹션에서 주소를 입력하고 조회 버튼을 클릭하세요)");
      return;
    }

    // 필수 필드 검증
    if (!userAddress.trim() || !privateKey.trim() || !amount.trim()) {
      setSubmitError("모든 필드를 입력해주세요.");
      return;
    }

    // 주소 형식 검증
    if (!isValidAddress(userAddress)) {
      setSubmitError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    // 개인키 형식 검증
    if (!isValidPrivateKey(privateKey)) {
      setSubmitError("올바른 개인키 형식이 아닙니다. (0x로 시작하는 64자 hex)");
      return;
    }

    // 금액 검증
    if (!isValidAmount(amount)) {
      setSubmitError("올바른 금액을 입력해주세요. (0보다 큰 숫자)");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setTxHash(null);

    try {
      let response;
      
      // 금액 검증 (DSTN 단위)
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setSubmitError("올바른 금액을 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      // 조회된 정보로 유효성 검사
      const userBalanceDstn = parseFloat(weiToDstn(balance));
      // 백엔드에서 이미 DSTN 단위로 변환된 값을 받음
      const collateralAmountDstn = parseFloat(position.collateralAmount);
      const debtAmountDstn = parseFloat(position.debtAmount);

      switch (activeTab) {
        case "deposit": {
          // 예치: 보유 DSTN 잔고 >= 예치 금액
          if (userBalanceDstn < amountNum) {
            setSubmitError(`보유 DSTN 잔고가 부족합니다. (보유: ${userBalanceDstn.toFixed(4)} DSTN, 요청: ${amount} DSTN)`);
            setIsSubmitting(false);
            return;
          }
          response = await depositCollateral(privateKey, amount);
          break;
        }
        case "mint": {
          // 발행: 담보가 있어야 함
          if (collateralAmountDstn === 0) {
            setSubmitError("담보를 먼저 예치해주세요.");
            setIsSubmitting(false);
            return;
          }
          response = await mintStablecoin(privateKey, amount);
          break;
        }
        case "redeem": {
          // 상환: 부채 >= 상환 금액
          if (debtAmountDstn < amountNum) {
            setSubmitError(`상환 가능한 스테이블코인이 부족합니다. (부채: ${debtAmountDstn.toFixed(4)} 스테이블코인, 요청: ${amount} 스테이블코인)`);
            setIsSubmitting(false);
            return;
          }
          response = await redeemStablecoin(privateKey, amount);
          break;
        }
        case "withdraw": {
          // 인출: 예치한 담보 >= 인출 금액
          if (collateralAmountDstn < amountNum) {
            setSubmitError(`인출 가능한 담보가 부족합니다. (예치: ${collateralAmountDstn.toFixed(4)} DSTN, 요청: ${amount} DSTN)`);
            setIsSubmitting(false);
            return;
          }
          
          // 담보비율 150% 미만으로 떨어지지 않도록 검증
          // 1 DSTN = 1,000 USD (담보 가치)
          // 1 스테이블코인 = 1 USD
          const debtValueUSD = debtAmountDstn; // 스테이블코인 = USD
          const minRequiredCollateralUSD = debtValueUSD * 1.5; // 최소 담보비율 150%
          const minRequiredCollateralDstn = minRequiredCollateralUSD / 1000; // USD -> DSTN
          const remainingCollateralDstn = collateralAmountDstn - amountNum;
          
          if (remainingCollateralDstn < minRequiredCollateralDstn) {
            const maxWithdrawableDstn = Math.max(0, collateralAmountDstn - minRequiredCollateralDstn);
            setSubmitError(`담보비율이 150% 미만으로 떨어집니다. 최대 출금 가능량: ${maxWithdrawableDstn.toFixed(4)} DSTN`);
            setIsSubmitting(false);
            return;
          }
          
          response = await withdrawCollateral(privateKey, amount);
          break;
        }
      }

      setTxHash(response.hash);
      // 성공 시 폼 초기화 및 포지션 재조회
      setAmount("");
      // 포지션 정보 갱신
      await handleLoadPosition();
    } catch (err: any) {
      setSubmitError(err.message || "작업 실행에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiquidate = async () => {
    // 필수 필드 검증
    if (!liquidateAddress.trim() || !liquidatePrivateKey.trim()) {
      setLiquidateError("주소와 개인키를 입력해주세요.");
      return;
    }

    // 주소 형식 검증
    if (!isValidAddress(liquidateAddress)) {
      setLiquidateError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    // 개인키 형식 검증
    if (!isValidPrivateKey(liquidatePrivateKey)) {
      setLiquidateError("올바른 개인키 형식이 아닙니다. (0x로 시작하는 64자 hex)");
      return;
    }

    setIsLiquidating(true);
    setLiquidateError(null);
    setLiquidateTxHash(null);

    try {
      const response = await liquidateStablecoin(liquidatePrivateKey, liquidateAddress);
      setLiquidateTxHash(response.hash);
      setLiquidateAddress("");
    } catch (err: any) {
      setLiquidateError(err.message || "청산 실행에 실패했습니다.");
    } finally {
      setIsLiquidating(false);
    }
  };

  // 담보비율 계산 및 표시
  const collateralRatio = position
    ? (() => {
        const collateralAmountDstn = parseFloat(position.collateralAmount);
        const debtAmountDstn = parseFloat(position.debtAmount);
        
        // 담보가 0이면 담보비율은 0% 또는 N/A
        if (collateralAmountDstn === 0) {
          return debtAmountDstn === 0 ? 0 : null; // 부채도 없으면 0%, 부채가 있으면 N/A
        }
        
        // 부채가 0이면 담보비율은 무한대이므로 특별 처리
        if (debtAmountDstn === 0) {
          return Infinity; // 무한대 표시
        }
        
        const ratio = parseFloat(position.collateralRatio);
        
        // 무한대나 비정상적인 값 처리
        if (!isFinite(ratio) || ratio < 0) {
          return null;
        }
        
        return ratio;
      })()
    : null;

  // 실시간 유효성 검사
  useEffect(() => {
    if (!position || !balance || positionAddress.toLowerCase() !== userAddress.toLowerCase()) {
      setAmountError(null);
      setMaxAmount(null);
      return;
    }

    const userBalanceDstn = parseFloat(weiToDstn(balance));
    // 백엔드에서 이미 DSTN 단위로 변환된 값을 받음
    const collateralAmountDstn = parseFloat(position.collateralAmount);
    const debtAmountDstn = parseFloat(position.debtAmount);
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setAmountError(null);
      return;
    }

    switch (activeTab) {
      case "deposit": {
        setMaxAmount(userBalanceDstn);
        // 부동소수점 정밀도 문제 해결: 작은 오차 허용 (0.0001)
        const epsilon = 0.0001;
        if (amountNum > userBalanceDstn + epsilon) {
          setAmountError(`보유 잔고를 초과했습니다. (최대: ${userBalanceDstn.toFixed(4)} DSTN)`);
        } else {
          setAmountError(null);
        }
        break;
      }
      case "mint": {
        // 발행 가능한 최대 스테이블코인 계산
        // 1 DSTN = 1,000 USD (담보 가치)
        // 1 스테이블코인 = 1 USD
        // 최소 담보비율: 150% (1.5)
        // 최대 부채(USD) = 담보 가치(USD) / 1.5
        // 최대 부채(스테이블코인) = 최대 부채(USD) / 1 (스테이블코인 = USD)
        // 추가 발행 가능 = 최대 부채 - 현재 부채
        
        if (collateralAmountDstn === 0) {
          setAmountError("담보를 먼저 예치해주세요.");
          setMaxAmount(0);
        } else {
          const collateralValueUSD = collateralAmountDstn * 1000; // DSTN -> USD (담보 가치)
          const maxDebtUSD = collateralValueUSD / 1.5; // 최소 담보비율 150%
          const maxDebtStablecoin = maxDebtUSD; // 스테이블코인 = USD (1:1)
          const currentDebtStablecoin = debtAmountDstn; // 현재 부채는 이미 스테이블코인 단위
          const maxMintableStablecoin = maxDebtStablecoin - currentDebtStablecoin;
          
          // 최대 발행 가능량 설정 (입력값이 없어도 표시하기 위해)
          setMaxAmount(Math.max(0, maxMintableStablecoin));
          
          // 입력값이 있을 때만 에러 체크
          if (amountNum > 0) {
            if (maxMintableStablecoin <= 0) {
              setAmountError("담보비율이 이미 최소치입니다. 더 이상 발행할 수 없습니다.");
            } else {
              // 부동소수점 정밀도 문제 해결: 작은 오차 허용 (0.0001)
              const epsilon = 0.0001;
              if (amountNum > maxMintableStablecoin + epsilon) {
                setAmountError(`최대 발행 가능량을 초과했습니다. (최대: ${maxMintableStablecoin.toFixed(4)} 스테이블코인)`);
              } else {
                setAmountError(null);
              }
            }
          } else {
            // 입력값이 없으면 에러 없음
            setAmountError(null);
          }
        }
        break;
      }
      case "redeem": {
        setMaxAmount(debtAmountDstn);
        // 부동소수점 정밀도 문제 해결: 작은 오차 허용 (0.0001)
        const epsilon = 0.0001;
        if (amountNum > debtAmountDstn + epsilon) {
          setAmountError(`부채를 초과했습니다. (최대: ${debtAmountDstn.toFixed(4)} 스테이블코인)`);
        } else {
          setAmountError(null);
        }
        break;
      }
      case "withdraw": {
        // 담보 출금 시 최소 담보비율(150%) 유지 필요
        // 1 DSTN = 1,000 USD (담보 가치)
        // 1 스테이블코인 = 1 USD
        // 최소 담보비율: 150% (1.5)
        // 최소 필요 담보(USD) = 부채(USD) * 1.5
        // 최소 필요 담보(DSTN) = 최소 필요 담보(USD) / 1000
        // 최대 출금 가능량(DSTN) = 현재 담보(DSTN) - 최소 필요 담보(DSTN)
        
        const debtValueUSD = debtAmountDstn; // 스테이블코인 = USD
        const minRequiredCollateralUSD = debtValueUSD * 1.5; // 최소 담보비율 150%
        const minRequiredCollateralDstn = minRequiredCollateralUSD / 1000; // USD -> DSTN
        const maxWithdrawableDstn = Math.max(0, collateralAmountDstn - minRequiredCollateralDstn);
        
        setMaxAmount(maxWithdrawableDstn);
        
        // 부동소수점 정밀도 문제 해결: 작은 오차 허용 (0.0001)
        const epsilon = 0.0001;
        if (amountNum > collateralAmountDstn + epsilon) {
          setAmountError(`예치한 담보를 초과했습니다. (최대: ${collateralAmountDstn.toFixed(4)} DSTN)`);
        } else if (amountNum > maxWithdrawableDstn + epsilon) {
          setAmountError(`담보비율이 150% 미만으로 떨어집니다. (최대 출금 가능: ${maxWithdrawableDstn.toFixed(4)} DSTN)`);
        } else {
          setAmountError(null);
        }
        break;
      }
    }
  }, [amount, activeTab, position, balance, positionAddress, userAddress]);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        Stablecoin
      </h1>

      {/* 환율 안내 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              환율 정보
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              테스트를 위해 <strong>1 DSTN = 1,000 USD</strong>로 고정되어 있습니다.
              스테이블코인은 이 환율을 기준으로 발행됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 포지션 조회 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📊 포지션 조회
        </h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={positionAddress}
            onChange={(e) => setPositionAddress(e.target.value)}
            placeholder="지갑 주소 입력 (0x...)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleLoadPosition}
            disabled={isLoadingPosition}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold disabled:cursor-not-allowed"
          >
            {isLoadingPosition ? "조회 중..." : "조회"}
          </button>
        </div>

        {positionError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{positionError}</p>
          </div>
        )}

        {position && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                현재 DSTN 잔고
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {balance !== null ? weiToDstn(balance) : "-"} DSTN
              </div>
              {balance !== null && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                  {balance} Wei
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                담보 양
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {position.collateralAmount} DSTN
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                {position.collateralAmountWei} Wei
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                부채 양
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {position.debtAmount} 스테이블코인
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                {position.debtAmountWei} Wei
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                담보비율
              </div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {collateralRatio === null
                    ? "N/A"
                    : collateralRatio === Infinity
                      ? "∞"
                      : `${collateralRatio.toFixed(2)}%`}
                </div>
                {health !== null && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      health
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {health ? "🟢 건강" : "🔴 위험"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 작업 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          💰 작업
        </h2>
        
        {(!position || !balance || positionAddress.toLowerCase() !== userAddress.toLowerCase()) && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 작업을 수행하려면 먼저 위의 <strong>포지션 조회</strong> 섹션에서 지갑 주소를 입력하고 조회해주세요.
            </p>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "deposit"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab("mint")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "mint"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Mint
          </button>
          <button
            onClick={() => setActiveTab("redeem")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "redeem"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Redeem
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "withdraw"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* 폼 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              지갑 주소
            </label>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder={positionAddress || "0x..."}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              disabled={!!positionAddress}
            />
            {positionAddress && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                포지션 조회에서 입력한 주소가 자동으로 설정됩니다.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              개인키
            </label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {activeTab === "deposit" || activeTab === "withdraw"
                  ? "DSTN 양"
                  : "스테이블코인 양"}
              </label>
              {maxAmount !== null && maxAmount > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  최대: {maxAmount.toFixed(4)} {activeTab === "deposit" || activeTab === "withdraw" ? "DSTN" : "스테이블코인"}
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                amountError
                  ? "border-red-500 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {amountError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{amountError}</p>
            )}
            {maxAmount !== null && maxAmount > 0 && !amountError && amount && parseFloat(amount) > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                가능한 금액: {maxAmount.toFixed(4)} {activeTab === "deposit" || activeTab === "withdraw" ? "DSTN" : "스테이블코인"}
              </p>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{submitError}</p>
            </div>
          )}

          {txHash && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                트랜잭션 성공!
              </p>
              <Link
                href={`/transactions/${txHash}`}
                className="text-sm text-green-600 dark:text-green-400 hover:underline font-mono break-all"
              >
                {txHash}
              </Link>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "처리 중..."
              : activeTab === "deposit"
                ? "예치하기"
                : activeTab === "mint"
                  ? "발행하기"
                  : activeTab === "redeem"
                    ? "상환하기"
                    : "인출하기"}
          </button>
        </div>
      </div>

      {/* 청산 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ⚠️ 청산
        </h2>
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
            ⚠️ 청산 기능 일시 중단
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            현재 고정 환율 시스템으로 운영 중이므로 청산 기능을 제공하지 않습니다.
            담보비율이 150% 미만으로 떨어지면 자동으로 소각됩니다.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              청산 대상 주소
            </label>
            <input
              type="text"
              value={liquidateAddress}
              onChange={(e) => setLiquidateAddress(e.target.value)}
              placeholder="0x..."
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500 font-mono text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              청산 실행자 개인키
            </label>
            <input
              type="password"
              value={liquidatePrivateKey}
              onChange={(e) => setLiquidatePrivateKey(e.target.value)}
              placeholder="0x..."
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500 font-mono text-sm cursor-not-allowed"
            />
          </div>

          {liquidateError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{liquidateError}</p>
            </div>
          )}

          {liquidateTxHash && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                청산 성공!
              </p>
              <Link
                href={`/transactions/${liquidateTxHash}`}
                className="text-sm text-green-600 dark:text-green-400 hover:underline font-mono break-all"
              >
                {liquidateTxHash}
              </Link>
            </div>
          )}

          <button
            onClick={handleLiquidate}
            disabled={true}
            className="w-full px-6 py-3 bg-gray-400 text-white rounded-lg transition font-semibold cursor-not-allowed"
          >
            청산 기능 일시 중단
          </button>
        </div>
      </div>
    </div>
  );
}
