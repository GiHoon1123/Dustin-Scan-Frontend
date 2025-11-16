import Pagination from "@/components/Pagination";
import { getAccount, getTokenBalancesByAddress } from "@/lib/api";
import type { TokenBalance } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

const TOKENS_PER_PAGE = 20;

export default async function AddressTokensPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { address } = await params;
  const search = await searchParams;
  const page = Math.max(1, Number(search.page) || 1);

  try {
    await getAccount(address);
  } catch (error) {
    console.error("Address tokens fetch error:", error);
    notFound();
  }

  let tokens: TokenBalance[] = [];
  let pagination = {
    currentPage: page,
    pageSize: TOKENS_PER_PAGE,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  try {
    const tokensData = await getTokenBalancesByAddress(
      address,
      page,
      TOKENS_PER_PAGE
    );
    tokens = tokensData.data.items;
    pagination =
      tokensData.data.pagination ?? {
        ...pagination,
        totalCount: tokens.length,
      };
  } catch (error) {
    console.error("Tokens fetch error:", error);
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            🪙 Token Holdings
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Address:{" "}
            <span className="font-mono text-xs md:text-sm break-all">
              {address}
            </span>
          </p>
        </div>
        <Link
          href={`/address/${address}`}
          className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Address Overview
        </Link>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Total {pagination.totalCount} tokens
        </div>
      </div>

      {tokens.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          이 주소가 보유한 토큰 자산이 없습니다.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
          {tokens.map((token) => (
            <div
              key={token.tokenAddress}
              className="flex flex-col border-b last:border-b-0 border-gray-200 dark:border-gray-700 pb-3 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div>
                  <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                    {token.name || "Unknown Token"}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    {(token.symbol || "-") + " · Decimals: " + (token.decimals ?? "-")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                    {token.balance}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Raw
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                Contract:{" "}
                <Link
                  href={`/contracts/${token.tokenAddress}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                >
                  {token.tokenAddress}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          basePath={`/address/${address}/tokens`}
        />
      )}
    </div>
  );
}


