"use client";

import ContractCard from "@/components/ContractCard";
import Pagination from "@/components/Pagination";
import DataLoader from "@/components/DataLoader";
import { getContractsByDeployer } from "@/lib/api";
import { CacheKeys } from "@/lib/cache";
import type { Contract } from "@/lib/types";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

const CONTRACTS_PER_PAGE = 20;

function AddressContractsPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const address = params.address as string;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            📜 Deployed Contracts
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

      <DataLoader
        cacheKey={CacheKeys.contractsByDeployer(address, page, CONTRACTS_PER_PAGE)}
        loadData={async () => {
          const contractsData = await getContractsByDeployer(
            address,
            page,
            CONTRACTS_PER_PAGE
          );
          return contractsData.data;
        }}
        render={(data, isLoading, fromCache) => (
          <>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {isLoading
                  ? "로딩 중..."
                  : `Showing ${data?.items.length || 0} of ${data?.pagination.totalCount || 0} deployed contracts`}
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                로딩 중...
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div className="space-y-3 md:space-y-4">
                  {data.items.map((contract: Contract) => (
                    <ContractCard key={contract.address} contract={contract} />
                  ))}
                </div>
                {data.pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={data.pagination.currentPage}
                    totalPages={data.pagination.totalPages}
                    basePath={`/address/${address}/contracts`}
                  />
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
                이 주소가 배포한 컨트랙트가 없습니다.
              </div>
            )}
          </>
        )}
      />
    </div>
  );
}

export default function AddressContractsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          로딩 중...
        </div>
      </div>
    }>
      <AddressContractsPageContent />
    </Suspense>
  );
}
