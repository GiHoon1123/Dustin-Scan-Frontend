"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  placeholder: string;
  type: "block" | "transaction" | "contract";
}

export default function SearchBar({ placeholder, type }: SearchBarProps) {
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"number" | "hash">("number");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    if (type === "block") {
      const input = search.trim();
      const isHashInput = input.startsWith("0x");

      // 드롭다운과 입력값이 일치하는지 확인
      if (searchType === "number" && isHashInput) {
        alert(
          "Block Number를 선택했지만 Hash 값을 입력하셨습니다. Block Hash로 변경하거나 블록 번호를 입력해주세요."
        );
        return;
      }
      if (searchType === "hash" && !isHashInput) {
        alert(
          "Block Hash를 선택했지만 번호를 입력하셨습니다. Block Number로 변경하거나 0x로 시작하는 해시를 입력해주세요."
        );
        return;
      }

      router.push(`/blocks/${input}`);
    } else if (type === "transaction") {
      router.push(`/transactions/${search.trim()}`);
    } else if (type === "contract") {
      const input = search.trim();
      if (!input.startsWith("0x")) {
        alert("컨트랙트 주소는 0x로 시작해야 합니다.");
        return;
      }
      router.push(`/contracts/${input}`);
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
              : type === "contract"
              ? "Enter contract address (0x...)..."
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
