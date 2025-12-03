import ContractCard from "@/components/ContractCard";
import ContractsPageHeader from "@/components/ContractsPageHeader";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import CacheIndicator from "@/components/CacheIndicator";
import { getContracts } from "@/lib/api";
import { CacheKeys } from "@/lib/cache";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  
  let contracts: any[] = [];
  let pagination = {
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };
  let fromCache = false;

  try {
    const contractsData = await getContracts(page, 20);
    contracts = contractsData.data.items;
    pagination = contractsData.data.pagination;
  } catch (error) {
    fromCache = true;
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <ContractsPageHeader />

      <SearchBar placeholder="Search by Contract Address..." type="contract" />

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex items-center justify-between">
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Total {pagination.totalCount} contracts
          </div>
          {fromCache && <CacheIndicator cacheKey={CacheKeys.contracts(page, 20)} />}
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {contracts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
            서버 연결 실패
          </div>
        ) : (
          contracts.map((contract) => (
            <ContractCard key={contract.address} contract={contract} />
          ))
        )}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        basePath="/contracts"
      />
    </div>
  );
}
