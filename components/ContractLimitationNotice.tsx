"use client";

import { useState } from "react";

export default function ContractLimitationNotice() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600 dark:text-yellow-400 text-xl">
            ⚠️
          </span>
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            현재 컨트랙트 기능은 제한적입니다
          </h3>
        </div>
        <button className="text-yellow-600 dark:text-yellow-400">
          {isExpanded ? "▲" : "▼"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
          <p>
            • <strong>배포 및 메서드 호출</strong>은 체인 내부 임의의 계정으로
            실행됩니다.
          </p>
          <p>
            • <strong>권한 체크가 있는 메서드</strong> (예: onlyOwner, 특정
            주소만 호출 가능 등)는 실패할 수 있습니다.
          </p>
          <p>• 메타마스크 연동 후 정상적으로 작동할 예정입니다.</p>
        </div>
      )}
    </div>
  );
}
