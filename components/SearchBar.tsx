"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  placeholder: string;
  type: "block" | "transaction";
}

export default function SearchBar({ placeholder, type }: SearchBarProps) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    if (type === "block") {
      // 숫자면 블록 번호, 아니면 해시
      if (/^\d+$/.test(search.trim())) {
        router.push(`/blocks/${search.trim()}`);
      } else {
        router.push(`/blocks/${search.trim()}`);
      }
    } else {
      // 트랜잭션 해시
      router.push(`/transactions/${search.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
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
