import ABIUploadForm from "@/components/ABIUploadForm";
import BytecodeViewer from "@/components/BytecodeViewer";
import ContractInteraction from "@/components/ContractInteraction";
import { getContract } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  let contract;
  try {
    const contractData = await getContract(address);
    contract = contractData.data;
  } catch (error: any) {
    console.error("Contract fetch error:", error);
    console.error("Address:", address);
    notFound();
  }

  const isDeployed = contract.status === 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {contract.name || "Contract"}
      </h1>

      {/* Status Badge */}
      {contract.status !== undefined && (
        <div className="mb-6">
          <span
            className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
              isDeployed
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {isDeployed ? "✓ Deployed" : "✗ Failed"}
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          <InfoRow label="Contract Address" value={contract.address} mono />
          <InfoRow
            label="Deployer"
            value={contract.deployer}
            mono
            link={`/address/${contract.deployer}`}
          />
          <InfoRow
            label="Transaction Hash"
            value={contract.transactionHash}
            mono
            link={`/transactions/${contract.transactionHash}`}
          />
          <InfoRow
            label="Block Number"
            value={contract.blockNumber}
            link={`/blocks/${contract.blockNumber}`}
          />
          <InfoRow label="Block Hash" value={contract.blockHash} mono />
          <InfoRow
            label="Timestamp"
            value={new Date(Number(contract.timestamp) * 1000).toLocaleString()}
          />
          {contract.name && <InfoRow label="Name" value={contract.name} />}
          {contract.compilerVersion && (
            <InfoRow label="Compiler Version" value={contract.compilerVersion} />
          )}
          {contract.optimization !== null && (
            <InfoRow
              label="Optimization"
              value={contract.optimization ? "Enabled" : "Disabled"}
            />
          )}
          {contract.bytecode && (
            <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
                Bytecode:
              </div>
              <div className="flex-1">
                <BytecodeViewer
                  bytecode={contract.bytecode}
                  preview={`${contract.bytecode.slice(0, 66)}... (${contract.bytecode.length} chars)`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ABI Section */}
      {contract.abi && contract.abi.length > 0 ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ABI (Application Binary Interface)
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-gray-800 dark:text-gray-200">
                {JSON.stringify(contract.abi, null, 2)}
              </code>
            </pre>
          </div>

          {/* Contract Interaction */}
          <ContractInteraction
            contractAddress={contract.address}
            abi={contract.abi}
          />
        </>
      ) : (
        <ABIUploadForm contractAddress={contract.address} />
      )}

      {/* Source Code Section */}
      {contract.sourceCode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Source Code
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-gray-800 dark:text-gray-200">
              {contract.sourceCode}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 pb-3">
      <div className="text-gray-500 dark:text-gray-400 w-full sm:w-48 mb-1 sm:mb-0">
        {label}:
      </div>
      <div
        className={`flex-1 ${
          mono ? "font-mono text-sm" : ""
        } break-all text-gray-900 dark:text-white`}
      >
        {link ? (
          <Link
            href={link}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

