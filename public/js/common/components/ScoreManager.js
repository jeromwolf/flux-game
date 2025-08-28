/**
 * 점수 관리 컴포넌트
 */
export class ScoreManager {
    constructor(gameId) {
        this.gameId = gameId;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.scoreElement = null;
        this.highScoreElement = null;
        this.comboMultiplier = 1;
        this.lastScoreTime = Date.now();
    }
    
    /**
     * 점수 표시 UI 생성
     */
    createScoreDisplay(container) {
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score-display';
        scoreDisplay.innerHTML = `
            <div class="score-item">
                <span class="score-label">점수</span>
                <span class="score-value" id="${this.gameId}-score">0</span>
            </div>
            <div class="score-item">
                <span class="score-label">최고</span>
                <span class="score-value" id="${this.gameId}-highscore">${this.highScore}</span>
            </div>
        `;
        
        container.appendChild(scoreDisplay);
        
        this.scoreElement = document.getElementById(`${this.gameId}-score`);
        this.highScoreElement = document.getElementById(`${this.gameId}-highscore`);
    }
    
    /**
     * 점수 업데이트
     */
    updateScore(newScore) {
        const oldScore = this.score;
        this.score = newScore;
        
        // 점수 애니메이션
        if (this.scoreElement) {
            this.animateScore(oldScore, newScore);
        }
        
        // 최고 점수 갱신
        if (newScore > this.highScore) {
            this.setHighScore(newScore);
            this.showNewHighScore();
        }
        
        // 콤보 체크
        const now = Date.now();
        if (now - this.lastScoreTime < 1000) {
            this.comboMultiplier = Math.min(this.comboMultiplier + 0.1, 3);
        } else {
            this.comboMultiplier = 1;
        }
        this.lastScoreTime = now;
    }
    
    /**
     * 점수 추가 (콤보 적용)
     */
    addScore(points) {
        const bonusPoints = Math.floor(points * this.comboMultiplier);
        this.updateScore(this.score + bonusPoints);
        
        // 점수 획득 효과
        if (bonusPoints > points) {
            this.showComboEffect(this.comboMultiplier);
        }
        
        return bonusPoints;
    }
    
    /**
     * 점수 애니메이션
     */
    animateScore(from, to) {
        const duration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 이징 함수
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(from + (to - from) * easeOutCubic);
            
            this.scoreElement.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 점수 증가 시 펄스 효과
                this.scoreElement.classList.add('score-pulse');
                setTimeout(() => {
                    this.scoreElement.classList.remove('score-pulse');
                }, 300);
            }
        };
        
        animate();
    }
    
    /**
     * 최고 점수 설정
     */
    setHighScore(score) {
        this.highScore = score;
        this.saveHighScore();
        
        if (this.highScoreElement) {
            this.highScoreElement.textContent = score.toLocaleString();
            this.highScoreElement.classList.add('new-highscore');
        }
    }
    
    /**
     * 최고 점수 로드
     */
    loadHighScore() {
        return parseInt(localStorage.getItem(`${this.gameId}_highscore`) || '0');
    }
    
    /**
     * 최고 점수 저장
     */
    saveHighScore() {
        localStorage.setItem(`${this.gameId}_highscore`, this.highScore.toString());
    }
    
    /**
     * 최고 점수 갱신 효과
     */
    showNewHighScore() {
        const effect = document.createElement('div');
        effect.className = 'new-highscore-effect';
        effect.innerHTML = '🎉 신기록! 🎉';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            effect.remove();
        }, 3000);
    }
    
    /**
     * 콤보 효과 표시
     */
    showComboEffect(multiplier) {
        const effect = document.createElement('div');
        effect.className = 'combo-effect';
        effect.innerHTML = `콤보 x${multiplier.toFixed(1)}`;
        
        if (this.scoreElement) {
            const rect = this.scoreElement.getBoundingClientRect();
            effect.style.left = `${rect.left + rect.width / 2}px`;
            effect.style.top = `${rect.top}px`;
        }
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            effect.remove();
        }, 1500);
    }
    
    /**
     * 점수 초기화
     */
    reset() {
        this.score = 0;
        this.comboMultiplier = 1;
        
        if (this.scoreElement) {
            this.scoreElement.textContent = '0';
        }
    }
    
    /**
     * 현재 점수 반환
     */
    getScore() {
        return this.score;
    }
    
    /**
     * 최고 점수 반환
     */
    getHighScore() {
        return this.highScore;
    }
    
    /**
     * 정리
     */
    cleanup() {
        // 이벤트 리스너 제거 등
    }
}