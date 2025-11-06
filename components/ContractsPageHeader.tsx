"use client";

import { useState } from "react";
import DeployContractModal from "./DeployContractModal";

export default function ContractsPageHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          📜 All Contracts
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 md:px-6 py-2 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold min-h-[44px] w-full sm:w-auto"
        >
          Deploy Contract
        </button>
      </div>
      <DeployContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
