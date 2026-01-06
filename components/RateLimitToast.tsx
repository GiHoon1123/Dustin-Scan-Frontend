"use client";

import { useEffect, useState } from "react";

interface RateLimitToastProps {
  message: string;
  onClose: () => void;
  timeUntilNext?: number;
}

export function RateLimitToast({
  message,
  onClose,
  timeUntilNext,
}: RateLimitToastProps) {
  const [countdown, setCountdown] = useState(timeUntilNext || 0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-semibold mb-1">요청 한도 초과</div>
            <div className="text-sm">{message}</div>
            {countdown > 0 && (
              <div className="text-xs mt-2 opacity-90">
                {countdown}초 후 다시 시도 가능합니다.
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


