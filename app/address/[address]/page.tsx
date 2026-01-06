"use client";

import ContractCard from "@/components/ContractCard";
import TransactionCard from "@/components/TransactionCard";
import CacheIndicator from "@/components/CacheIndicator";
import DataLoader from "@/components/DataLoader";
import {
  getAccount,
  getContractsByDeployer,
  getTokenBalancesByAddress,
  getTransactionsByAddress,
} from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import { Account, Contract, TokenBalance } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function AddressPage() {
  const params = useParams();
  const address = params.address as string;
  
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  const [contractPreview, setContractPreview] = useState<Contract[]>([]);
  const [tokenPreview, setTokenPreview] = useState<TokenBalance[]>([]);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [accountFromCache, setAccountFromCache] = useState(false);
  const [txsFromCache, setTxsFromCache] = useState(false);

  // 계정 정보 로드
  useEffect(() => {
    const loadAccount = async () => {
      setIsLoadingAccount(true);
      try {
        const accountData = await getAccount(address);
        setAccount(accountData.data);
        setAccountFromCache(false);
      } catch (error) {
        // 캐시 확인은 API 함수 내부에서 처리됨
        setAccountFromCache(true);
        // account가 없으면 기본 정보로 표시 (새로 생성된 지갑일 수 있음)
        setAccount({
          address: address,
          balance: "0",
          balanceWei: "0",
          nonce: 0,
          txCount: 0,
        });
      } finally {
        setIsLoadingAccount(false);
      }
    };
    loadAccount();
  }, [address]);

  // 트랜잭션 로드
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoadingTxs(true);
      try {
        const txsData = await getTransactionsByAddress(address, 1, 50);
        setTransactions(txsData.data.items);
        setPagination(txsData.data.pagination);
        setTxsFromCache(false);
      } catch (error) {
        setTxsFromCache(true);
        setTransactions([]);
      } finally {
        setIsLoadingTxs(false);
      }
    };
    loadTransactions();
  }, [address]);

  // 컨트랙트 로드
  useEffect(() => {
    const loadContracts = async () => {
      setIsLoadingContracts(true);
      try {
        const contractsData = await getContractsByDeployer(address, 1, 10);
        setContractPreview(contractsData.data.items);
      } catch (error) {
        console.error("Contract preview fetch error:", error);
        setContractPreview([]);
      } finally {
        setIsLoadingContracts(false);
      }
    };
    loadContracts();
  }, [address]);

  // 토큰 로드
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      try {
        const tokensData = await getTokenBalancesByAddress(address, 1, 10);
        setTokenPreview(tokensData.data.items);
      } catch (error) {
        console.error("Token preview fetch error:", error);
        setTokenPreview([]);
      } finally {
        setIsLoadingTokens(false);
      }
    };
    loadTokens();
  }, [address]);

  const totalContracts = contractPreview.length;
  const totalTokens = tokenPreview.length;
  const transactionsToDisplay = transactions.slice(0, 10);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Address Details
        </h1>
        {(accountFromCache || txsFromCache) && (
          <CacheIndicator cacheKey={CacheKeys.account(address)} />
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-8">
        {isLoadingAccount ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            로딩 중...
          </div>
        ) : account ? (
          <div className="space-y-4">
            <InfoRow label="Address" value={account.address} mono />
            <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
                Balance:
              </div>
              <div className="flex-1">
                <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                  {account.balance || "0"} DSTN
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                  {account.balanceWei || "0"} Wei
                </div>
              </div>
            </div>
            {account.nonce !== undefined && account.nonce !== null && (
              <InfoRow label="Nonce" value={account.nonce.toString()} />
            )}
            {account.txCount !== undefined && account.txCount !== null && (
              <InfoRow
                label="Total Transactions"
                value={account.txCount.toString()}
              />
            )}
          <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
              Token Holdings:
            </div>
            <div className="flex-1 text-sm md:text-base text-gray-900 dark:text-white">
              {totalTokens > 0 ? (
                <Link
                  href={`/address/${address}/tokens`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {totalTokens.toString()}
                </Link>
              ) : (
                "0"
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            계정 정보를 불러올 수 없습니다.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Deployed Contracts
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Total {totalContracts}
              </div>
              <Link
                href={`/address/${address}/contracts`}
                className={`text-xs md:text-sm hover:underline ${
                  totalContracts > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                }`}
                aria-disabled={totalContracts === 0}
              >
                VIEW ALL →
              </Link>
            </div>
          </div>

          {contractPreview.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
              이 주소가 배포한 컨트랙트가 없습니다.
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {contractPreview.map((contract) => (
                <ContractCard key={contract.address} contract={contract} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Transactions
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Total {pagination.totalCount}
              </div>
              <Link
                href={`/address/${address}/transactions`}
                className={`text-xs md:text-sm hover:underline ${
                  pagination.totalCount > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                }`}
                aria-disabled={pagination.totalCount === 0}
              >
                VIEW ALL →
              </Link>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {transactionsToDisplay.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
                이 주소와 관련된 트랜잭션이 없습니다.
              </div>
            ) : (
              transactionsToDisplay.map((tx) => (
                <TransactionCard key={tx.hash} transaction={tx} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
        {label}:
      </div>
      <div
        className={`flex-1 ${
          mono ? "font-mono text-xs md:text-sm" : "text-sm md:text-base"
        } break-all text-gray-900 dark:text-white`}
      >
        {value}
      </div>
    </div>
  );
}
