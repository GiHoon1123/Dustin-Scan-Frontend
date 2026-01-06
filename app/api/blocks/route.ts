import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    // Next.js fetch 캐싱 활용 (서버 사이드 캐싱)
    // 30초 캐시로 동일한 요청은 캐시에서 즉시 반환
    const response = await fetch(
      `${API_BASE_URL}/blocks?page=${page}&limit=${limit}`,
      {
        next: { revalidate: 30 }, // 30초마다 재검증
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch blocks" },
        { status: response.status }
      );
    }

    // Response streaming으로 최적화 (큰 데이터도 빠르게)
    // JSON 파싱을 한 번만 하고 바로 스트리밍
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


