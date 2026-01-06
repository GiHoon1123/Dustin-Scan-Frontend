"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { RateLimitToast } from "./RateLimitToast";
import { rateLimiter } from "@/lib/rate-limiter";

interface RateLimitContextType {
  showRateLimitError: (timeUntilNext?: number) => void;
}

const RateLimitContext = createContext<RateLimitContextType | null>(null);

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (!context) {
    return {
      showRateLimitError: () => {
        // 서버 사이드에서는 아무것도 하지 않음
      },
    };
  }
  return context;
}

export function RateLimitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showToast, setShowToast] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);

  const showRateLimitError = useCallback((timeUntil?: number) => {
    const timeUntilValue = timeUntil ?? rateLimiter.getTimeUntilNextRequest();
    setTimeUntilNext(timeUntilValue);
    setShowToast(true);
  }, []);

  useEffect(() => {
    // 전역 이벤트 리스너 등록
    const handleRateLimitExceeded = (event: Event) => {
      const customEvent = event as CustomEvent<{ timeUntilNext: number }>;
      showRateLimitError(customEvent.detail.timeUntilNext);
    };

    window.addEventListener("rate-limit-exceeded", handleRateLimitExceeded);

    return () => {
      window.removeEventListener("rate-limit-exceeded", handleRateLimitExceeded);
    };
  }, [showRateLimitError]);

  return (
    <RateLimitContext.Provider value={{ showRateLimitError }}>
      {children}
      {showToast && (
        <RateLimitToast
          message="요청이 너무 많습니다. 1분에 최대 100개 요청만 가능합니다. 잠시 후 다시 시도해주세요."
          timeUntilNext={timeUntilNext}
          onClose={() => setShowToast(false)}
        />
      )}
    </RateLimitContext.Provider>
  );
}

