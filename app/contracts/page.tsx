"use client";

import ContractCard from "@/components/ContractCard";
import ContractsPageHeader from "@/components/ContractsPageHeader";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import CacheIndicator from "@/components/CacheIndicator";
import DataLoader from "@/components/DataLoader";
import { getContracts } from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ContractsPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <ContractsPageHeader />

      <SearchBar placeholder="Search by Contract Address..." type="contract" />

      <DataLoader
        cacheKey={CacheKeys.contracts(page, 20)}
        loadData={async () => {
          const data = await getContracts(page, 20);
          return data.data;
        }}
        render={(data, isLoading, fromCache) => (
          <>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex items-center justify-between">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {isLoading
                    ? "로딩 중..."
                    : `Total ${data?.pagination.totalCount || 0} contracts`}
                </div>
                {fromCache && !isLoading && (
                  <CacheIndicator cacheKey={CacheKeys.contracts(page, 20)} />
                )}
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {isLoading ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                  로딩 중...
                </div>
              ) : data && data.items.length > 0 ? (
                data.items.map((contract: any) => (
                  <ContractCard key={contract.address} contract={contract} />
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                  서버 연결 실패
                </div>
              )}
            </div>

            {data && (
              <Pagination
                currentPage={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                basePath="/contracts"
              />
            )}
          </>
        )}
      />
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          로딩 중...
        </div>
      </div>
    }>
      <ContractsPageContent />
    </Suspense>
  );
}
