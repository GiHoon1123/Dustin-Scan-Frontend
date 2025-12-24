"use client";

import { useState, useEffect } from "react";
import {
  depositStaking,
  getAccount,
  getStakingStats,
  getValidator,
  requestWithdrawal,
  setWithdrawalAddress as setWithdrawalAddressAPI,
} from "@/lib/api";
import { StakingStats, ValidatorInfo } from "@/lib/types";
import Link from "next/link";

const WEI_PER_DSTN = BigInt("1000000000000000000"); // 10^18
const MIN_STAKE_DSTN = 32; // 최소 스테이킹 금액
const WITHDRAWAL_COOLDOWN_MS = 3 * 60 * 1000; // 3분 (밀리초)
const WITHDRAWAL_CLEANUP_MS = 5 * 60 * 1000; // 5분 (밀리초)
const WITHDRAWAL_STORAGE_KEY = "staking_withdrawal_requests"; // localStorage 키

function weiToDstn(wei: string): string {
  try {
    const weiBigInt = BigInt(wei);
    const dstn = Number(weiBigInt) / Number(WEI_PER_DSTN);
    return dstn.toFixed(4);
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

function getStatusColor(status: string): string {
  if (status.includes("active_ongoing")) return "text-green-600 dark:text-green-400";
  if (status.includes("pending")) return "text-yellow-600 dark:text-yellow-400";
  if (status.includes("exited")) return "text-gray-600 dark:text-gray-400";
  return "text-gray-600 dark:text-gray-400";
}

function getStatusBadge(status: string): string {
  if (status.includes("active_ongoing")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (status.includes("pending")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  if (status.includes("exited")) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
}

// 출금 요청 메모리 관리 함수들
function getWithdrawalRequests(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(WITHDRAWAL_STORAGE_KEY);
    if (!data) return {};
    const requests: Record<string, number> = JSON.parse(data);
    const now = Date.now();
    // 5분이 지난 항목 자동 삭제
    const cleaned: Record<string, number> = {};
    for (const [address, timestamp] of Object.entries(requests)) {
      if (now - timestamp < WITHDRAWAL_CLEANUP_MS) {
        cleaned[address.toLowerCase()] = timestamp;
      }
    }
    // 변경사항이 있으면 저장
    if (Object.keys(cleaned).length !== Object.keys(requests).length) {
      localStorage.setItem(WITHDRAWAL_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return {};
  }
}

function addWithdrawalRequest(address: string): void {
  if (typeof window === "undefined") return;
  try {
    const requests = getWithdrawalRequests();
    requests[address.toLowerCase()] = Date.now();
    localStorage.setItem(WITHDRAWAL_STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // localStorage 실패해도 계속 진행
  }
}

function isWithdrawalCooldownActive(address: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const requests = getWithdrawalRequests();
    const timestamp = requests[address.toLowerCase()];
    if (!timestamp) return false;
    const elapsed = Date.now() - timestamp;
    return elapsed < WITHDRAWAL_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function getRemainingCooldownTime(address: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const requests = getWithdrawalRequests();
    const timestamp = requests[address.toLowerCase()];
    if (!timestamp) return 0;
    const elapsed = Date.now() - timestamp;
    const remaining = WITHDRAWAL_COOLDOWN_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000)); // 초 단위로 반환
  } catch {
    return 0;
  }
}

export default function StakingPage() {
  const [activeTab, setActiveTab] = useState<"deposit" | "setWithdrawal" | "requestWithdrawal">("deposit");
  const [validatorAddress, setValidatorAddress] = useState("");
  const [validator, setValidator] = useState<ValidatorInfo | null>(null);
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingValidator, setIsLoadingValidator] = useState(false);
  const [validatorError, setValidatorError] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 작업 폼 상태
  const [userAddress, setUserAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [amount, setAmount] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [withdrawalCooldown, setWithdrawalCooldown] = useState<number>(0); // 남은 쿨다운 시간 (초)

  // 통계 로드
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const statsData = await getStakingStats();
        setStats(statsData);
      } catch (err: any) {
        console.error("Failed to load stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };
    loadStats();
  }, []);

  const handleLoadValidator = async () => {
    if (!validatorAddress.trim()) {
      setValidatorError("주소를 입력해주세요.");
      return;
    }

    if (!isValidAddress(validatorAddress)) {
      setValidatorError("올바른 주소 형식이 아닙니다. (0x로 시작하는 40자 hex)");
      return;
    }

    setIsLoadingValidator(true);
    setValidatorError(null);

    try {
      const [validatorRes, accountRes] = await Promise.all([
        getValidator(validatorAddress).catch(() => null),
        getAccount(validatorAddress),
      ]);

      if (!validatorRes) {
        setValidatorError("Validator를 찾을 수 없습니다.");
        setValidator(null);
        setBalance(null);
        return;
      }

      setValidator(validatorRes);
      const accountData = accountRes.data || accountRes;
      setBalance(accountData.balanceWei || accountData.balance || "0");
      setUserAddress(validatorAddress);
    } catch (err: any) {
      setValidatorError(err.message || "Validator 조회에 실패했습니다.");
      setValidator(null);
      setBalance(null);
    } finally {
      setIsLoadingValidator(false);
    }
  };

  const handleSubmit = async () => {
    // Validator 조회 확인
    if (!validator || !balance || validatorAddress.toLowerCase() !== userAddress.toLowerCase()) {
      setSubmitError("먼저 Validator를 조회해주세요. (위의 Validator 조회 섹션에서 주소를 입력하고 조회 버튼을 클릭하세요)");
      return;
    }

    // 필수 필드 검증
    if (!userAddress.trim() || !privateKey.trim()) {
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

    setIsSubmitting(true);
    setSubmitError(null);
    setTxHash(null);

    try {
      let response;

      switch (activeTab) {
        case "deposit": {
          // 금액 검증
          if (!amount.trim()) {
            setSubmitError("DSTN 양을 입력해주세요.");
            setIsSubmitting(false);
            return;
          }

          const amountNum = parseFloat(amount);
          if (isNaN(amountNum) || amountNum <= 0) {
            setSubmitError("올바른 금액을 입력해주세요.");
            setIsSubmitting(false);
            return;
          }

          // 최소 금액 검증
          if (amountNum < MIN_STAKE_DSTN) {
            setSubmitError(`최소 스테이킹 금액은 ${MIN_STAKE_DSTN} DSTN입니다.`);
            setIsSubmitting(false);
            return;
          }

          // 최대 인원 확인
          if (stats && stats.totalValidators >= stats.maxValidators) {
            setSubmitError(`현재 검증자 수가 최대치(${stats.maxValidators}명)에 도달했습니다. 예치가 불가능합니다.`);
            setIsSubmitting(false);
            return;
          }

          // 재등록 불가 확인
          if (validator.status === "exited_withdrawn") {
            setSubmitError("이 주소는 이미 탈퇴한 검증자입니다. 재등록할 수 없습니다.");
            setIsSubmitting(false);
            return;
          }

          // 잔고 확인
          const userBalanceDstn = parseFloat(weiToDstn(balance));
          if (userBalanceDstn < amountNum) {
            setSubmitError(`보유 DSTN 잔고가 부족합니다. (보유: ${userBalanceDstn.toFixed(4)} DSTN, 요청: ${amount} DSTN)`);
            setIsSubmitting(false);
            return;
          }

          response = await depositStaking(privateKey, amount);
          break;
        }
        case "setWithdrawal": {
          if (!withdrawalAddress.trim()) {
            setSubmitError("출금 주소를 입력해주세요.");
            setIsSubmitting(false);
            return;
          }

          if (!isValidAddress(withdrawalAddress)) {
            setSubmitError("올바른 출금 주소 형식이 아닙니다.");
            setIsSubmitting(false);
            return;
          }

          response = await setWithdrawalAddressAPI(privateKey, withdrawalAddress);
          break;
        }
        case "requestWithdrawal": {
          // 스테이킹 금액 확인
          const stakedAmountDstn = parseFloat(validator.stakedAmount);
          if (stakedAmountDstn === 0) {
            setSubmitError("스테이킹된 금액이 없습니다.");
            setIsSubmitting(false);
            return;
          }

          // 출금 주소 확인
          if (!validator.withdrawalAddress || validator.withdrawalAddress === "0x0000000000000000000000000000000000000000") {
            setSubmitError("출금 주소가 설정되지 않았습니다. 먼저 출금 주소를 설정해주세요.");
            setIsSubmitting(false);
            return;
          }

          // 출금 요청 쿨다운 확인
          if (isWithdrawalCooldownActive(userAddress)) {
            const remaining = getRemainingCooldownTime(userAddress);
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            setSubmitError(`출금 요청 후 3분이 지나지 않았습니다. 남은 시간: ${minutes}분 ${seconds}초`);
            setIsSubmitting(false);
            return;
          }

          response = await requestWithdrawal(privateKey);
          
          // 출금 요청 성공 시 메모리에 저장
          if (response.hash) {
            addWithdrawalRequest(userAddress);
          }
          break;
        }
      }

      setTxHash(response.hash);
      // 성공 시 폼 초기화 및 Validator 재조회
      setAmount("");
      setWithdrawalAddress("");
      
      // 스테이킹 작업 후 내 상태 자동 조회
      // userAddress로 Validator 조회 (스테이킹을 진행한 주소)
      try {
        const [validatorRes, accountRes] = await Promise.all([
          getValidator(userAddress).catch(() => null),
          getAccount(userAddress),
        ]);

        if (validatorRes) {
          setValidator(validatorRes);
          setValidatorAddress(userAddress); // 조회 주소도 업데이트
          const accountData = accountRes.data || accountRes;
          setBalance(accountData.balanceWei || accountData.balance || "0");
        }
      } catch (err) {
        // Validator 조회 실패해도 계속 진행 (새로 등록한 경우 아직 조회 안 될 수 있음)
        console.log("Validator 조회 실패 (정상일 수 있음):", err);
      }
      
      // 통계도 재조회
      const statsData = await getStakingStats();
      setStats(statsData);
    } catch (err: any) {
      setSubmitError(err.message || "작업 실행에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 출금 요청 쿨다운 타이머
  useEffect(() => {
    if (activeTab !== "requestWithdrawal" || !userAddress) {
      setWithdrawalCooldown(0);
      return;
    }

    const updateCooldown = () => {
      if (isWithdrawalCooldownActive(userAddress)) {
        const remaining = getRemainingCooldownTime(userAddress);
        setWithdrawalCooldown(remaining);
      } else {
        setWithdrawalCooldown(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, [activeTab, userAddress]);

  // 실시간 유효성 검사
  useEffect(() => {
    if (!validator || !balance || !stats || validatorAddress.toLowerCase() !== userAddress.toLowerCase()) {
      setAmountError(null);
      setMaxAmount(null);
      return;
    }

    if (activeTab !== "deposit") {
      setAmountError(null);
      setMaxAmount(null);
      return;
    }

    const userBalanceDstn = parseFloat(weiToDstn(balance));
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setAmountError(null);
      return;
    }

    // 최소 금액 검증
    if (amountNum < MIN_STAKE_DSTN) {
      setAmountError(`최소 스테이킹 금액은 ${MIN_STAKE_DSTN} DSTN입니다.`);
      setMaxAmount(userBalanceDstn);
      return;
    }

    // 최대 인원 확인
    if (stats.totalValidators >= stats.maxValidators) {
      setAmountError(`현재 검증자 수가 최대치(${stats.maxValidators}명)에 도달했습니다. 예치가 불가능합니다.`);
      setMaxAmount(0);
      return;
    }

    // 재등록 불가 확인
    if (validator.status === "exited_withdrawn") {
      setAmountError("이 주소는 이미 탈퇴한 검증자입니다. 재등록할 수 없습니다.");
      setMaxAmount(0);
      return;
    }

    // 잔고 확인
    setMaxAmount(userBalanceDstn);
    const epsilon = 0.0001;
    if (amountNum > userBalanceDstn + epsilon) {
      setAmountError(`보유 잔고를 초과했습니다. (최대: ${userBalanceDstn.toFixed(4)} DSTN)`);
    } else {
      setAmountError(null);
    }
  }, [amount, activeTab, validator, balance, stats, validatorAddress, userAddress]);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        Staking
      </h1>

      {/* 중요 안내 */}
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
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              📌 중요 안내
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• 최소 스테이킹 금액: {MIN_STAKE_DSTN} DSTN</li>
              <li>
                • 최대 검증자 수: {stats ? `${stats.totalValidators}/${stats.maxValidators}명` : "로딩 중..."} (활성: {stats ? `${stats.activeValidators}명` : "-"})
              </li>
              <li>• 한 번 탈퇴한 검증자는 재등록할 수 없습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 통계 섹션 */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📊 스테이킹 통계
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                전체 스테이킹 금액
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalStaked} DSTN
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                {stats.totalStakedWei} Wei
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                검증자 수
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalValidators}/{stats.maxValidators}명
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                활성: {stats.activeValidators}명
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                전체 보상
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalRewards} DSTN
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                {stats.totalRewardsWei} Wei
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                출금 대기 시간
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.withdrawalDelay}초
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validator 조회 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔍 Validator 조회
        </h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={validatorAddress}
            onChange={(e) => setValidatorAddress(e.target.value)}
            placeholder="Validator 주소 입력 (0x...)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleLoadValidator}
            disabled={isLoadingValidator}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold disabled:cursor-not-allowed"
          >
            {isLoadingValidator ? "조회 중..." : "조회"}
          </button>
        </div>

        {validatorError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{validatorError}</p>
          </div>
        )}

        {validator && (
          <div className="space-y-4">
            {/* 재등록 불가 경고 */}
            {validator.status === "exited_withdrawn" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                  ⚠️ 이 검증자는 탈퇴 완료 상태입니다. 재등록할 수 없습니다.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  스테이킹 금액
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {validator.stakedAmount} DSTN
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                  {validator.stakedAmountWei} Wei
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Validator 상태
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold ${getStatusColor(validator.status)}`}>
                    {validator.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(validator.status)}`}>
                    {validator.status.includes("active_ongoing") ? "🟢 활성" : 
                     validator.status.includes("pending") ? "🟡 대기" : "⚪ 비활성"}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  총 보상
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {validator.totalRewards} DSTN
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                  {validator.totalRewardsWei} Wei
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  출금 주소
                </div>
                <div className="text-sm font-mono text-gray-900 dark:text-white break-all">
                  {validator.withdrawalAddress || "-"}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  활성화 시간
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatTimestamp(validator.activatedAt)}
                </div>
              </div>
              {validator.exitRequestedAt && validator.exitRequestedAt !== "0" && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    출금 요청 시간
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatTimestamp(validator.exitRequestedAt)}
                  </div>
                </div>
              )}
              {parseFloat(validator.slashedAmount) > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    슬래싱된 금액
                  </div>
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {validator.slashedAmount} DSTN
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                    {validator.slashedAmountWei} Wei
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 작업 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          💰 작업
        </h2>

        {(!validator || !balance || validatorAddress.toLowerCase() !== userAddress.toLowerCase()) && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 작업을 수행하려면 먼저 위의 <strong>Validator 조회</strong> 섹션에서 주소를 입력하고 조회해주세요.
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
            onClick={() => setActiveTab("setWithdrawal")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "setWithdrawal"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Set Withdrawal Address
          </button>
          <button
            onClick={() => setActiveTab("requestWithdrawal")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "requestWithdrawal"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Request Withdrawal
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
              placeholder={validatorAddress || "0x..."}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              disabled={!!validatorAddress}
            />
            {validatorAddress && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Validator 조회에서 입력한 주소가 자동으로 설정됩니다.
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

          {activeTab === "deposit" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    DSTN 양
                  </label>
                  {maxAmount !== null && maxAmount > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      최대: {maxAmount.toFixed(4)} DSTN
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
                    가능한 금액: {maxAmount.toFixed(4)} DSTN
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  최소 스테이킹 금액: {MIN_STAKE_DSTN} DSTN
                </p>
              </div>
            </>
          )}

          {activeTab === "setWithdrawal" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                출금 주소
              </label>
              <input
                type="text"
                value={withdrawalAddress}
                onChange={(e) => setWithdrawalAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          )}

          {activeTab === "requestWithdrawal" && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ 출금 요청 안내
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• 출금 요청 후 3분 안에 반영됩니다.</li>
                <li>• 탈퇴 후 재등록이 불가능합니다. 신중히 결정해주세요.</li>
                {withdrawalCooldown > 0 && (
                  <li className="text-red-600 dark:text-red-400 font-semibold">
                    • 출금 요청 쿨다운: {Math.floor(withdrawalCooldown / 60)}분 {withdrawalCooldown % 60}초 남음
                  </li>
                )}
              </ul>
            </div>
          )}

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
            disabled={
              isSubmitting ||
              (activeTab === "requestWithdrawal" && withdrawalCooldown > 0)
            }
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "처리 중..."
              : activeTab === "deposit"
                ? "예치하기"
                : activeTab === "setWithdrawal"
                  ? "출금 주소 설정하기"
                  : withdrawalCooldown > 0
                    ? `출금 요청 쿨다운 (${Math.floor(withdrawalCooldown / 60)}분 ${withdrawalCooldown % 60}초)`
                    : "출금 요청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
