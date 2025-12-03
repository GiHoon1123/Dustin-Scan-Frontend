"use client";

import { useEffect, useState } from "react";
import CacheIndicator from "./CacheIndicator";
import { CacheKeys, getCache } from "@/lib/cache";

interface DataLoaderProps<T> {
  cacheKey: string;
  loadData: () => Promise<T>;
  render: (data: T | null, isLoading: boolean, fromCache: boolean) => React.ReactNode;
}

export default function DataLoader<T>({
  cacheKey,
  loadData,
  render,
}: DataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      // 먼저 캐시 확인
      const cached = getCache<T>(cacheKey);
      if (cached) {
        if (mounted) {
          setData(cached.data);
          setFromCache(true);
          setIsLoading(false);
        }
      }

      // API 호출 시도 (백그라운드 업데이트)
      try {
        const result = await loadData();
        if (mounted) {
          setData(result);
          setFromCache(false);
          setIsLoading(false);
        }
      } catch (error) {
        // API 실패 시 캐시 확인 (다시 한번)
        const cached = getCache<T>(cacheKey);
        if (mounted) {
          if (cached) {
            setData(cached.data);
            setFromCache(true);
          }
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [cacheKey, loadData]);

  return render(data, isLoading, fromCache);
}

