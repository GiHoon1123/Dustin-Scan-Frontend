import { getContract } from "./api";
import { Contract, DeployedContractSummary } from "./types";

export async function fetchContractDetailMap(addresses: string[]) {
  const uniquePairs: Array<[string, string]> = [];
  const seen = new Set<string>();

  addresses.forEach((address) => {
    const lower = address.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    uniquePairs.push([lower, address]);
  });

  const results = await Promise.all(
    uniquePairs.map(async ([lowerAddress, originalAddress]) => {
      try {
        const { data } = await getContract(originalAddress);
        return [lowerAddress, data as Contract | null] as const;
      } catch (error) {
        console.error("fetchContractDetailMap error:", lowerAddress, error);
        return [lowerAddress, null] as const;
      }
    })
  );

  return new Map(results);
}

export function buildFallbackContract(
  summary: DeployedContractSummary,
  fallbackDeployer: string
): Contract {
  const status: 0 | 1 = summary.status === 0 ? 0 : 1;

  return {
    address: summary.contractAddress,
    deployer: summary.deployerAddress || fallbackDeployer,
    transactionHash: summary.transactionHash,
    blockNumber: summary.blockNumber,
    blockHash: summary.blockHash || "",
    bytecode: null,
    status,
    abi: null,
    name: null,
    sourceCode: null,
    compilerVersion: null,
    optimization: null,
    timestamp: summary.timestamp,
    createdAt: summary.timestamp,
  };
}
