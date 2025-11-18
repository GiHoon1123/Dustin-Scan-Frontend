"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function UniversalSearchBar() {
  const [search, setSearch] = useState("");
  const [hint, setHint] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // 컴포넌트 내부에서 런타임에 환경 변수 읽기 (빌드 타임 주입 문제 해결)
  const API_BASE_URL = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const detectInputType = (input: string) => {
    if (!input.trim()) {
      setHint("");
      return null;
    }

    const trimmed = input.trim();

    // 숫자만 입력
    if (/^\d+$/.test(trimmed)) {
      setHint("⛓️ Block Number detected");
      return "blockNumber";
    }

    // 0x로 시작하는 해시
    if (trimmed.startsWith("0x")) {
      const hexPart = trimmed.slice(2);

      // 40자 = 주소 (컨트랙트 또는 계정)
      if (hexPart.length === 40 && /^[0-9a-fA-F]{40}$/.test(hexPart)) {
        setHint("👤 Address / Contract detected");
        return "address";
      }

      // 64자 = 블록 해시 or 트랜잭션 해시
      if (hexPart.length === 64 && /^[0-9a-fA-F]{64}$/.test(hexPart)) {
        setHint("🔍 Block/Transaction Hash detected");
        return "hash";
      }

      // 진행 중
      if (hexPart.length < 64 && /^[0-9a-fA-F]*$/.test(hexPart)) {
        setHint("⌨️ Keep typing...");
        return null;
      }
    }

    setHint("❌ Invalid format");
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    detectInputType(value);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim() || isSearching) return;

    const trimmed = search.trim();
    const type = detectInputType(trimmed);
    const normalized =
      type === "address" || type === "hash" ? trimmed.toLowerCase() : trimmed;

    if (!type) {
      router.push("/not-found");
      return;
    }

    setIsSearching(true);

    try {
      switch (type) {
        case "blockNumber":
          router.push(`/blocks/${trimmed}`);
          break;
        case "address":
          // 먼저 컨트랙트인지 확인
          const contractRes = await fetch(
            `${API_BASE_URL}/contracts/${normalized}`,
            {
              cache: "no-store",
            }
          );

          if (contractRes.ok) {
            router.push(`/contracts/${normalized}`);
          } else {
            const accountRes = await fetch(
              `${API_BASE_URL}/accounts/${normalized}`,
              {
                cache: "no-store",
              }
            );

            if (accountRes.ok) {
              router.push(`/address/${normalized}`);
            } else {
              router.push("/not-found");
            }
          }
          break;
        case "hash":
          // 클라이언트에서 순차 조회: 블록 해시 → 트랜잭션 해시
          const blockRes = await fetch(
            `${API_BASE_URL}/blocks/hash/${normalized}`,
            {
              cache: "no-store",
            }
          );

          if (blockRes.ok) {
            router.push(`/blocks/${normalized}`);
          } else {
            // 블록이 아니면 트랜잭션 확인
            const txRes = await fetch(
              `${API_BASE_URL}/transactions/${normalized}`,
              {
                cache: "no-store",
              }
            );

            if (txRes.ok) {
              router.push(`/transactions/${normalized}`);
            } else {
              router.push("/not-found");
            }
          }
          break;
        default:
          router.push("/not-found");
      }
    } catch (error) {
      console.error("Search error:", error);
      router.push("/not-found");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="mb-6 md:mb-8">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={handleInputChange}
            placeholder="Search by Block Number / Hash / Transaction Hash / Address / Contract"
            className="w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-24 md:pr-32"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 md:px-6 py-2 text-sm md:text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-semibold min-h-[44px]"
          >
            <span className="hidden md:inline">
              {isSearching ? "⏳" : "🔍"} Search
            </span>
            <span className="md:hidden">{isSearching ? "⏳" : "🔍"}</span>
          </button>
        </div>
        {/* 힌트를 고정 높이로 만들어서 레이아웃 shift 방지 */}
        <div className="h-6 mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
          {hint}
        </div>
      </div>
    </form>
  );
}
