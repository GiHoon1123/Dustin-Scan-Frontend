import Pagination from "@/components/Pagination";
import TransactionCard from "@/components/TransactionCard";
import { getAccount, getTransactionsByAddress } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";

const TRANSACTIONS_PER_PAGE = 20;

export default async function AddressTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { address } = await params;
  const searchParamsData = await searchParams;
  const page = Math.max(1, Number(searchParamsData.page) || 1);

  try {
    await getAccount(address);
  } catch (error) {
    console.error("Address transactions fetch error:", error);
    notFound();
  }

  let transactions;
  let pagination;

  try {
    const txsData = await getTransactionsByAddress(address, page, TRANSACTIONS_PER_PAGE);
    transactions = txsData.data.items;
    pagination = txsData.data.pagination;
  } catch (error) {
    console.error("Transactions fetch error:", error);
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            💸 Transactions
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Address: <span className="font-mono text-xs md:text-sm break-all">{address}</span>
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
          Showing {transactions.length} of {pagination.totalCount} transactions
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          이 주소와 관련된 트랜잭션이 없습니다.
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {transactions.map((tx) => (
            <TransactionCard key={tx.hash} transaction={tx} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          basePath={`/address/${address}/transactions`}
        />
      )}
    </div>
  );
}
