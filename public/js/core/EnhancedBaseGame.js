import { BaseGame } from './BaseGame.js';
import AdManager from '../common/monetization/AdManager.js';
import { ScoreManager } from '../common/components/ScoreManager.js';
import { Analytics } from '../common/utils/Analytics.js';

/**
 * 향상된 기본 게임 클래스 - 모든 게임이 상속받는 확장 클래스
 */
export class EnhancedBaseGame extends BaseGame {
    constructor(config) {
        super(config.id, config.name, config.description);
        
        // 게임 설정
        this.category = config.category || 'casual';
        this.difficulty = config.difficulty || 'easy';
        this.hasAds = config.hasAds !== false; // 기본값 true
        this.adPlacements = config.adPlacements || ['start', 'gameover'];
        
        // 게임 상태
        this.score = 0;
        this.highScore = 0;
        this.gameState = 'menu'; // menu, playing, paused, gameover
        this.startTime = null;
        this.playTime = 0;
        
        // 컴포넌트
        this.scoreManager = null;
        this.adManager = AdManager;
        
        // 게임 통계
        this.stats = {
            gamesPlayed: 0,
            totalScore: 0,
            totalPlayTime: 0,
            achievements: []
        };
    }
    
    /**
     * 게임 초기화 (오버라이드 필요)
     */
    init() {
        // super.init() 제거 - BaseGame의 init은 추상 메서드
        this.loadStats();
        this.setupScoreManager();
        this.trackEvent('game_init', { game: this.id });
    }
    
    /**
     * 점수 매니저 설정
     */
    setupScoreManager() {
        if (this.container) {
            this.scoreManager = new ScoreManager(this.id);
            this.highScore = this.scoreManager.getHighScore();
        }
    }
    
    /**
     * 게임 시작
     */
    async start() {
        super.start();
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.score = 0;
        
        // 게임 시작 광고 표시
        if (this.hasAds && this.adPlacements.includes('start')) {
            try {
                await this.showAd('interstitial');
            } catch (err) {
                console.log('Ad skipped or failed:', err);
            }
        }
        
        this.trackEvent('game_start', { 
            game: this.id,
            category: this.category,
            difficulty: this.difficulty
        });
        
        this.onGameStart();
    }
    
    /**
     * 게임 시작 후 호출 (오버라이드용)
     */
    onGameStart() {
        // 하위 클래스에서 구현
    }
    
    /**
     * 게임 일시정지
     */
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.onGamePause();
            this.trackEvent('game_pause', { game: this.id });
        }
    }
    
    /**
     * 게임 재개
     */
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.onGameResume();
            this.trackEvent('game_resume', { game: this.id });
        }
    }
    
    /**
     * 점수 업데이트
     */
    updateScore(points) {
        this.score += points;
        if (this.scoreManager) {
            this.scoreManager.updateScore(this.score);
        }
        this.onScoreUpdate(this.score);
    }
    
    /**
     * 점수 업데이트 후 호출 (오버라이드용)
     */
    onScoreUpdate(score) {
        // 하위 클래스에서 구현
    }
    
    /**
     * 게임 오버
     */
    async gameOver() {
        if (this.gameState === 'gameover') return;
        
        this.gameState = 'gameover';
        this.playTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // 통계 업데이트
        this.stats.gamesPlayed++;
        this.stats.totalScore += this.score;
        this.stats.totalPlayTime += this.playTime;
        this.saveStats();
        
        // 최고 점수 업데이트
        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (this.scoreManager) {
                this.scoreManager.setHighScore(this.score);
            }
        }
        
        // 게임 오버 처리
        this.onGameOver();
        
        // 분석 이벤트
        this.trackEvent('game_over', {
            game: this.id,
            score: this.score,
            highScore: this.highScore,
            playTime: this.playTime,
            isNewHighScore: this.score === this.highScore
        });
        
        // 게임 오버 광고 표시
        if (this.hasAds && this.adPlacements.includes('gameover')) {
            setTimeout(async () => {
                try {
                    await this.showAd('interstitial');
                } catch (err) {
                    console.log('Ad skipped or failed:', err);
                }
            }, 1000);
        }
    }
    
    /**
     * 게임 오버 후 호출 (오버라이드용)
     */
    onGameOver() {
        // 하위 클래스에서 구현
    }
    
    /**
     * 광고 표시
     */
    async showAd(type, options = {}) {
        if (!this.hasAds || this.adManager.isAdFree()) {
            return Promise.resolve();
        }
        
        return this.adManager.show(type, options);
    }
    
    /**
     * 보상형 광고 표시
     */
    async showRewardAd(reward) {
        try {
            const result = await this.showAd('reward', { reward });
            if (result.watched) {
                this.onRewardEarned(result.reward);
                return true;
            }
        } catch (err) {
            console.log('Reward ad failed:', err);
        }
        return false;
    }
    
    /**
     * 보상 획득 후 호출 (오버라이드용)
     */
    onRewardEarned(reward) {
        // 하위 클래스에서 구현
    }
    
    /**
     * 분석 이벤트 추적
     */
    trackEvent(eventName, params = {}) {
        Analytics.track(eventName, {
            ...params,
            timestamp: Date.now(),
            sessionId: Analytics.getSessionId()
        });
    }
    
    /**
     * 게임 통계 저장
     */
    saveStats() {
        localStorage.setItem(`${this.id}_stats`, JSON.stringify(this.stats));
    }
    
    /**
     * 게임 통계 로드
     */
    loadStats() {
        const saved = localStorage.getItem(`${this.id}_stats`);
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }
    
    /**
     * 게임 일시정지 후 호출 (오버라이드용)
     */
    onGamePause() {
        // 하위 클래스에서 구현
    }
    
    /**
     * 게임 재개 후 호출 (오버라이드용)
     */
    onGameResume() {
        // 하위 클래스에서 구현
    }
    
    /**
     * 게임 정리
     */
    cleanup() {
        super.cleanup();
        this.saveStats();
        
        if (this.scoreManager) {
            this.scoreManager.cleanup();
        }
        
        this.trackEvent('game_cleanup', { 
            game: this.id,
            totalPlayTime: this.stats.totalPlayTime
        });
    }
}