"use client";

import { useState } from "react";
import DeployContractModal from "./DeployContractModal";

export default function ContractsPageHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📜 All Contracts
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
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

