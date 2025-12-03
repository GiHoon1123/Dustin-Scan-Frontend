"use client";

import { getCacheTimestamp, CacheKeys } from "@/lib/cache";

interface CacheIndicatorProps {
  cacheKey: string;
  className?: string;
}

export default function CacheIndicator({ cacheKey, className = "" }: CacheIndicatorProps) {
  const timestamp = getCacheTimestamp(cacheKey);
  
  if (!timestamp) return null;

  const age = Date.now() - timestamp;
  const minutes = Math.floor(age / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let timeText = "";
  if (days > 0) {
    timeText = `${days}일 전`;
  } else if (hours > 0) {
    timeText = `${hours}시간 전`;
  } else if (minutes > 0) {
    timeText = `${minutes}분 전`;
  } else {
    timeText = "방금 전";
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md ${className}`}
      title="캐시된 데이터입니다"
    >
      <span>📦</span>
      <span>마지막 업데이트: {timeText}</span>
    </div>
  );
}

