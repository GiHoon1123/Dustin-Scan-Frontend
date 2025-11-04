import ContractCard from "@/components/ContractCard";
import Pagination from "@/components/Pagination";
import { getContracts } from "@/lib/api";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const contractsData = await getContracts(page, 20);
  const contracts = contractsData.data.items;
  const pagination = contractsData.data.pagination;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        📜 All Contracts
      </h1>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total {pagination.totalCount} contracts
        </div>
      </div>

      <div className="space-y-4">
        {contracts.map((contract) => (
          <ContractCard key={contract.address} contract={contract} />
        ))}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        basePath="/contracts"
      />
    </div>
  );
}

