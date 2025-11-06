import ContractCard from "@/components/ContractCard";
import ContractsPageHeader from "@/components/ContractsPageHeader";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
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
    <div className="container mx-auto px-4 py-4 md:py-8">
      <ContractsPageHeader />

      <SearchBar placeholder="Search by Contract Address..." type="contract" />

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Total {pagination.totalCount} contracts
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
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
