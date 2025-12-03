import ContractCard from "@/components/ContractCard";
import TransactionCard from "@/components/TransactionCard";
import CacheIndicator from "@/components/CacheIndicator";
import {
  getAccount,
  getContractsByDeployer,
  getTokenBalancesByAddress,
  getTransactionsByAddress,
} from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import { Contract, TokenBalance } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AddressPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  let account: any = null;
  let transactions: any[] = [];
  let pagination = {
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };
  let contractPreview: Contract[] = [];
  let contractPreviewPagination = {
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };
  let tokenPreview: TokenBalance[] = [];
  let tokenPreviewPagination = {
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };
  let accountFromCache = false;
  let txsFromCache = false;

  try {
    const accountData = await getAccount(address);
    account = accountData.data;
  } catch (error) {
    // 캐시 확인은 API 함수 내부에서 처리됨
    accountFromCache = true;
    // account가 없으면 notFound
    if (!account) {
      notFound();
    }
  }

  try {
    const txsData = await getTransactionsByAddress(address, 1, 50);
    transactions = txsData.data.items;
    pagination = txsData.data.pagination;
  } catch (error) {
    txsFromCache = true;
  }

  try {
    const contractsData = await getContractsByDeployer(address, 1, 10);
    contractPreview = contractsData.data.items;
    contractPreviewPagination = contractsData.data.pagination;
  } catch (error) {
    console.error("Contract preview fetch error:", error);
  }

  try {
    const tokensData = await getTokenBalancesByAddress(address, 1, 10);
    tokenPreview = tokensData.data.items;
    tokenPreviewPagination =
      tokensData.data.pagination ?? {
        ...tokenPreviewPagination,
        totalCount: tokenPreview.length,
      };
  } catch (error) {
    console.error("Token preview fetch error:", error);
  }

  const totalContracts = contractPreviewPagination.totalCount ?? 0;
  const totalTokens = tokenPreviewPagination.totalCount ?? tokenPreview.length;
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
        <div className="space-y-4">
          <InfoRow label="Address" value={account.address} mono />
          <InfoRow label="Balance" value={`${account.balance} DSTN`} />
          <InfoRow label="Balance (Wei)" value={account.balanceWei} />
          <InfoRow label="Nonce" value={account.nonce.toString()} />
          <InfoRow
            label="Total Transactions"
            value={account.txCount.toString()}
          />
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
