"use client";

export default function ServerMaintenanceBanner() {
  const message = "⚠️ 서버 점검: 매일 23:00 (KST) 재시작 및 데이터 초기화";

  return (
    <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white py-2 overflow-hidden relative z-50 shadow-lg">
      <div className="flex animate-scroll whitespace-nowrap">
        {/* 충분히 많이 반복하여 화면을 가득 채움 - 2세트로 구성하여 끊김 없이 */}
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="inline-block px-12 text-sm font-semibold">
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}

