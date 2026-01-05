/**
 * Rate Limiter
 * 
 * 1분에 최대 30개 요청만 허용
 */

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private requests: RequestRecord[] = [];
  private readonly maxRequests = 30;
  private readonly timeWindow = 60 * 1000; // 1분 (밀리초)

  /**
   * 요청 가능 여부 확인
   * @returns {boolean} 요청 가능 여부
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // 1분 이전의 요청 기록 제거
    this.requests = this.requests.filter(
      (record) => now - record.timestamp < this.timeWindow
    );

    // 현재 시간대의 요청 수 확인
    const currentWindowRequests = this.requests.reduce(
      (sum, record) => sum + record.count,
      0
    );

    return currentWindowRequests < this.maxRequests;
  }

  /**
   * 요청 기록
   */
  recordRequest(): void {
    const now = Date.now();
    
    // 1분 이전의 요청 기록 제거
    this.requests = this.requests.filter(
      (record) => now - record.timestamp < this.timeWindow
    );

    // 현재 시간대의 마지막 기록 확인
    const lastRecord = this.requests[this.requests.length - 1];
    
    if (lastRecord && now - lastRecord.timestamp < 1000) {
      // 같은 초 내 요청이면 카운트 증가
      lastRecord.count += 1;
    } else {
      // 새로운 시간대면 새 기록 추가
      this.requests.push({
        timestamp: now,
        count: 1,
      });
    }
  }

  /**
   * 남은 요청 수 반환
   */
  getRemainingRequests(): number {
    const now = Date.now();
    
    // 1분 이전의 요청 기록 제거
    this.requests = this.requests.filter(
      (record) => now - record.timestamp < this.timeWindow
    );

    const currentWindowRequests = this.requests.reduce(
      (sum, record) => sum + record.count,
      0
    );

    return Math.max(0, this.maxRequests - currentWindowRequests);
  }

  /**
   * 다음 요청 가능 시간까지 남은 시간 (초)
   */
  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) {
      return 0;
    }

    const now = Date.now();
    const oldestRequest = this.requests[0];
    
    if (!oldestRequest) {
      return 0;
    }

    const timeUntilOldestExpires = this.timeWindow - (now - oldestRequest.timestamp);
    return Math.ceil(timeUntilOldestExpires / 1000);
  }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimiter();

