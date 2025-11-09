import ContractCard from "@/components/ContractCard";
import Pagination from "@/components/Pagination";
import { getAccount, getTransactionsByAddress } from "@/lib/api";
import { DeployedContractSummary } from "@/lib/types";
import {
  buildFallbackContract,
  fetchContractDetailMap,
} from "@/lib/contractHelpers";
import Link from "next/link";
import { notFound } from "next/navigation";

const CONTRACTS_PER_PAGE = 20;
const TRANSACTIONS_FETCH_LIMIT = 100;

export default async function AddressContractsPage({
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
    console.error("Address contracts fetch error:", error);
    notFound();
  }

  const deployedContracts = await fetchDeployedContracts(address);
  const totalCount = deployedContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / CONTRACTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * CONTRACTS_PER_PAGE;
  const items = deployedContracts.slice(start, start + CONTRACTS_PER_PAGE);
  const contractsDetailMap = await fetchContractDetailMap(
    items.map((summary) => summary.contractAddress)
  );
  const contractsToRender = items.map((summary) => {
    const detail = contractsDetailMap.get(summary.contractAddress.toLowerCase());
    return detail || buildFallbackContract(summary, address);
  });

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            📄 Deployed Contracts
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
          Showing {items.length} of {totalCount} deployed contracts
        </div>
      </div>

      {contractsToRender.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          이 주소가 배포한 컨트랙트가 없습니다.
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {contractsToRender.map((contract) => (
            <ContractCard key={contract.address} contract={contract} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/address/${address}/contracts`}
        />
      )}
    </div>
  );
}

async function fetchDeployedContracts(
  address: string
): Promise<DeployedContractSummary[]> {
  const normalizedAddress = address.toLowerCase();
  const contractsMap = new Map<string, DeployedContractSummary>();

  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 50) {
    let txsData;
    try {
      txsData = await getTransactionsByAddress(
        address,
        page,
        TRANSACTIONS_FETCH_LIMIT
      );
    } catch (error) {
      console.error("fetchDeployedContracts error:", error);
      break;
    }

    const { items, pagination } = txsData.data;

    items.forEach((tx) => {
      if (!tx.contractAddress) return;
      if (tx.from.toLowerCase() !== normalizedAddress) return;

      const key = tx.contractAddress.toLowerCase();
      if (contractsMap.has(key)) return;

      contractsMap.set(key, {
        contractAddress: tx.contractAddress,
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        timestamp: tx.timestamp,
        status: tx.status,
        deployerAddress: address,
      });
    });

    hasNext = pagination.hasNext;
    page += 1;
  }

  return Array.from(contractsMap.values()).sort(
    (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
  );
}
