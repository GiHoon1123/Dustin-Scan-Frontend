import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import TransactionCard from "@/components/TransactionCard";
import { getTransactions } from "@/lib/api";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const txsData = await getTransactions(page, 20);
  const transactions = txsData.data.items;
  const pagination = txsData.data.pagination;

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        💸 All Transactions
      </h1>

      <SearchBar
        placeholder="Search by Transaction Hash..."
        type="transaction"
      />

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Total {pagination.totalCount} transactions
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {transactions.map((tx) => (
          <TransactionCard key={tx.hash} transaction={tx} />
        ))}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        basePath="/transactions"
      />
    </div>
  );
}
