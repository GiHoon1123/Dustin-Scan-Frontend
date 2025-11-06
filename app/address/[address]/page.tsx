import Pagination from "@/components/Pagination";
import TransactionCard from "@/components/TransactionCard";
import { getAccount, getTransactionsByAddress } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function AddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { address } = await params;
  const searchParamsData = await searchParams;
  const page = Number(searchParamsData.page) || 1;

  let account;
  let transactions;
  let pagination;

  try {
    const accountData = await getAccount(address);
    account = accountData.data;

    const txsData = await getTransactionsByAddress(address, page, 20);
    transactions = txsData.data.items;
    pagination = txsData.data.pagination;
  } catch (error) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        Address Details
      </h1>

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
        </div>
      </div>

      {/* Transactions List */}
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
        Transactions
      </h2>

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
        basePath={`/address/${address}`}
      />
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
