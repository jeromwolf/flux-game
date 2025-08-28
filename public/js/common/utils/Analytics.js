/**
 * 분석 유틸리티 - 게임 이벤트 추적
 */
export class Analytics {
    static sessionId = null;
    static userId = null;
    static events = [];
    static isEnabled = true;
    
    /**
     * 초기화
     */
    static init() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        
        // 세션 시작 이벤트
        this.track('session_start', {
            userId: this.userId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            screen: {
                width: window.screen.width,
                height: window.screen.height
            }
        });
        
        // 페이지 종료 시 세션 종료 이벤트
        window.addEventListener('beforeunload', () => {
            this.track('session_end', {
                duration: Date.now() - this.events[0].timestamp,
                totalEvents: this.events.length
            });
            this.flush();
        });
    }
    
    /**
     * 이벤트 추적
     */
    static track(eventName, params = {}) {
        if (!this.isEnabled) return;
        
        const event = {
            name: eventName,
            params: params,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId
        };
        
        this.events.push(event);
        
        // 개발 모드에서는 콘솔에 출력
        if (this.isDevelopment()) {
            console.log(`📊 Analytics:`, eventName, params);
        }
        
        // 100개 이상 쌓이면 전송
        if (this.events.length >= 100) {
            this.flush();
        }
    }
    
    /**
     * 게임별 이벤트 추적
     */
    static trackGameEvent(gameId, eventName, params = {}) {
        this.track(`game_${eventName}`, {
            gameId: gameId,
            ...params
        });
    }
    
    /**
     * 수익화 이벤트 추적
     */
    static trackMonetizationEvent(type, params = {}) {
        this.track(`monetization_${type}`, {
            revenue: params.revenue || 0,
            currency: params.currency || 'KRW',
            ...params
        });
    }
    
    /**
     * 사용자 행동 추적
     */
    static trackUserAction(action, params = {}) {
        this.track(`user_${action}`, params);
    }
    
    /**
     * 에러 추적
     */
    static trackError(error, context = {}) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            context: context
        });
    }
    
    /**
     * 퍼포먼스 추적
     */
    static trackPerformance(metric, value, unit = 'ms') {
        this.track('performance', {
            metric: metric,
            value: value,
            unit: unit
        });
    }
    
    /**
     * 세션 ID 생성
     */
    static generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 사용자 ID 가져오기/생성
     */
    static getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }
    
    /**
     * 세션 ID 반환
     */
    static getSessionId() {
        return this.sessionId;
    }
    
    /**
     * 이벤트 전송
     */
    static async flush() {
        if (this.events.length === 0) return;
        
        const eventsToSend = [...this.events];
        this.events = [];
        
        try {
            // 실제 환경에서는 분석 서버로 전송
            if (!this.isDevelopment()) {
                await fetch('/api/analytics/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        events: eventsToSend
                    })
                });
            } else {
                // 개발 모드에서는 로컬 스토리지에 저장
                const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
                stored.push(...eventsToSend);
                
                // 최대 1000개까지만 저장
                if (stored.length > 1000) {
                    stored.splice(0, stored.length - 1000);
                }
                
                localStorage.setItem('analytics_events', JSON.stringify(stored));
            }
        } catch (error) {
            console.error('Analytics flush failed:', error);
            // 전송 실패한 이벤트는 다시 큐에 추가
            this.events.unshift(...eventsToSend);
        }
    }
    
    /**
     * 개발 모드 확인
     */
    static isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }
    
    /**
     * 분석 활성화/비활성화
     */
    static setEnabled(enabled) {
        this.isEnabled = enabled;
    }
    
    /**
     * 디버그 정보 출력
     */
    static debug() {
        console.group('📊 Analytics Debug');
        console.log('Session ID:', this.sessionId);
        console.log('User ID:', this.userId);
        console.log('Events in queue:', this.events.length);
        console.log('Total events (localStorage):', 
            JSON.parse(localStorage.getItem('analytics_events') || '[]').length);
        console.groupEnd();
    }
}

// 자동 초기화
Analytics.init();