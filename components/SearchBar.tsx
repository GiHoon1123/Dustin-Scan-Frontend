"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  placeholder: string;
  type: "block" | "transaction";
}

export default function SearchBar({ placeholder, type }: SearchBarProps) {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"number" | "hash">("number");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    if (type === "block") {
      router.push(`/blocks/${search.trim()}`);
    } else {
      router.push(`/transactions/${search.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="mb-6">
      <div className="flex gap-2">
        {type === "block" && (
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "number" | "hash")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="number">Block Number</option>
            <option value="hash">Block Hash</option>
          </select>
        )}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            type === "block"
              ? searchType === "number"
                ? "Enter block number..."
                : "Enter block hash (0x...)..."
              : placeholder
          }
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
        >
          Search
        </button>
      </div>
    </form>
  );
}
