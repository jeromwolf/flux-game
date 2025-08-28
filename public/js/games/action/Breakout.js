import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class Breakout extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'breakout',
            name: '브레이크아웃',
            description: '패들로 공을 튕겨 모든 벽돌을 깨세요',
            category: 'action',
            difficulty: 'medium',
            hasAds: true,
            adPlacements: ['start', 'gameover']
        });
        
        this.canvas = null;
        this.ctx = null;
        
        // 게임 설정
        this.canvasWidth = 480;
        this.canvasHeight = 320;
        
        // 패들
        this.paddleHeight = 10;
        this.paddleWidth = 75;
        this.paddleX = 0;
        
        // 공
        this.ballRadius = 8;
        this.x = 0;
        this.y = 0;
        this.dx = 2;
        this.dy = -2;
        
        // 벽돌
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 50;
        this.brickHeight = 20;
        this.brickPadding = 5;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 35;
        this.bricks = [];
        
        // 게임 상태
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gameOver = false;
        this.gameWon = false;
        this.animationId = null;
        
        // 컨트롤
        this.rightPressed = false;
        this.leftPressed = false;
        
        // 파워업
        this.powerUps = [];
        this.activePowerUps = {};
        this.powerUpTypes = {
            expand: { color: '#3498db', symbol: '🔷', duration: 10000 },
            multi: { color: '#e74c3c', symbol: '🔴', duration: 0 },
            slow: { color: '#2ecc71', symbol: '🟢', duration: 8000 },
            laser: { color: '#f39c12', symbol: '⚡', duration: 10000 },
            magnet: { color: '#9b59b6', symbol: '🟣', duration: 12000 }
        };
        
        // 파티클 시스템
        this.particles = [];
        this.particleCanvas = null;
        this.particleCtx = null;
        
        // 콤보 시스템
        this.combo = 0;
        this.lastHitTime = 0;
        this.comboTimeout = null;
        
        // 특수 벽돌
        this.specialBricks = new Set();
        
        // 사운드 초기화
        this.soundManager = SoundManager;
        this.registerSounds();
    }
    
    registerSounds() {
        // 브레이크아웃 전용 사운드 등록
        this.soundManager.createSound('paddle_hit', {
            frequency: 440,
            type: 'sine',
            duration: 0.1,
            volume: 0.3
        });
        
        this.soundManager.createSound('brick_hit', {
            frequencies: [523, 659],
            type: 'square',
            duration: 0.15,
            volume: 0.2
        });
        
        this.soundManager.createSound('brick_destroy', {
            frequency: 880,
            type: 'triangle',
            duration: 0.2,
            volume: 0.3
        });
        
        this.soundManager.createSound('powerup_collect', {
            frequencies: [400, 600, 800, 1000],
            type: 'sine',
            duration: 0.4,
            volume: 0.3
        });
        
        this.soundManager.createSound('wall_bounce', {
            frequency: 300,
            type: 'sawtooth',
            duration: 0.08,
            volume: 0.2
        });
        
        this.soundManager.createSound('game_over', {
            frequencies: [400, 300, 200, 100],
            type: 'sawtooth',
            duration: 0.8,
            volume: 0.4
        });
        
        this.soundManager.createSound('level_complete', {
            frequencies: [523, 659, 784, 1047],
            type: 'sine',
            duration: 1,
            volume: 0.4
        });
        
        this.soundManager.createSound('combo', {
            frequency: 700,
            type: 'sine',
            duration: 0.1,
            volume: 0.2,
            vibrato: true
        });
    }

    async init() {
        super.init();
        
        // 사운드 매니저 초기화
        await this.soundManager.init();
        
        this.paddleX = (this.canvasWidth - this.paddleWidth) / 2;
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight - 30;
        this.dx = 3;
        this.dy = -3;
        
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gameOver = false;
        this.gameWon = false;
        
        this.powerUps = [];
        this.activePowerUps = {};
        this.particles = [];
        this.combo = 0;
        this.lastHitTime = 0;
        
        // 벽돌 초기화
        this.bricks = [];
        this.specialBricks.clear();
        
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                const isSpecial = Math.random() < 0.15; // 15% 확률로 특수 벽돌
                const type = isSpecial ? this.getRandomPowerUpType() : null;
                
                this.bricks[c][r] = { 
                    x: 0, 
                    y: 0, 
                    status: 1,
                    color: this.getBrickColor(r),
                    type: type,
                    hits: type === 'multi' ? 2 : 1,
                    maxHits: type === 'multi' ? 2 : 1
                };
                
                if (type) {
                    this.specialBricks.add(`${c},${r}`);
                }
            }
        }
    }
    
    getRandomPowerUpType() {
        const types = Object.keys(this.powerUpTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    render() {
        this.container.innerHTML = `
            <div class="breakout-wrapper">
                <div class="breakout-header">
                    <div class="game-stats">
                        <div class="stat-item">
                            <span class="stat-label">점수</span>
                            <span id="breakout-score" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">생명</span>
                            <span id="breakout-lives" class="stat-value">❤️❤️❤️</span>
                        </div>
                        <div class="stat-item combo-display" id="combo-display" style="display: none;">
                            <span class="combo-text">COMBO</span>
                            <span id="combo-count" class="combo-count">0</span>
                        </div>
                    </div>
                    <button class="game-btn primary" id="breakout-start-btn">
                        <span class="btn-icon">🎮</span>
                        <span class="btn-text">게임 시작</span>
                    </button>
                    <div class="power-ups-display" id="power-ups-display"></div>
                </div>
                
                <div class="game-canvas-container">
                    <canvas id="breakout-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
                    <canvas id="particle-canvas" class="particle-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
                </div>
                
                <div class="breakout-controls">
                    <button class="control-btn left" id="left-btn">
                        <span class="btn-arrow">◀</span>
                        <span class="btn-label">왼쪽</span>
                    </button>
                    <div class="touch-area" id="touch-area"></div>
                    <button class="control-btn right" id="right-btn">
                        <span class="btn-label">오른쪽</span>
                        <span class="btn-arrow">▶</span>
                    </button>
                </div>
                
                <div class="sound-notice">
                    🔊 사운드 효과가 활성화되어 있습니다
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('breakout-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particleCanvas = document.getElementById('particle-canvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.scoreElement = document.getElementById('breakout-score');
        this.livesElement = document.getElementById('breakout-lives');
        this.comboElement = document.getElementById('combo-count');
        this.comboDisplay = document.getElementById('combo-display');
        this.powerUpsDisplay = document.getElementById('power-ups-display');
        
        this.bindEvents();
        this.draw();
        this.startParticleAnimation();
    }

    bindEvents() {
        // 시작 버튼
        document.getElementById('breakout-start-btn').addEventListener('click', () => {
            this.soundManager.play('click');
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            } else {
                this.init();
                this.updateDisplay();
                this.draw();
            }
        });
        
        // 키보드 컨트롤
        this.keyDownHandler = (e) => {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                this.rightPressed = true;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                this.leftPressed = true;
            }
        };
        
        this.keyUpHandler = (e) => {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                this.rightPressed = false;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                this.leftPressed = false;
            }
        };
        
        // 마우스 컨트롤
        this.mouseMoveHandler = (e) => {
            const relativeX = e.clientX - this.canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < this.canvasWidth) {
                this.paddleX = relativeX - this.paddleWidth / 2;
            }
        };
        
        // 터치 컨트롤 (모바일)
        this.touchMoveHandler = (e) => {
            const touch = e.touches[0];
            const relativeX = touch.clientX - this.canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < this.canvasWidth) {
                this.paddleX = relativeX - this.paddleWidth / 2;
            }
        };
        
        // 버튼 컨트롤
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        
        leftBtn.addEventListener('touchstart', () => this.leftPressed = true);
        leftBtn.addEventListener('touchend', () => this.leftPressed = false);
        leftBtn.addEventListener('mousedown', () => this.leftPressed = true);
        leftBtn.addEventListener('mouseup', () => this.leftPressed = false);
        
        rightBtn.addEventListener('touchstart', () => this.rightPressed = true);
        rightBtn.addEventListener('touchend', () => this.rightPressed = false);
        rightBtn.addEventListener('mousedown', () => this.rightPressed = true);
        rightBtn.addEventListener('mouseup', () => this.rightPressed = false);
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        document.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('touchmove', this.touchMoveHandler);
    }

    getBrickColor(row) {
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
        return colors[row % colors.length];
    }
    
    getSpecialBrickColor(type) {
        return this.powerUpTypes[type]?.color || '#ffffff';
    }

    startGame() {
        this.gameRunning = true;
        const btn = document.getElementById('breakout-start-btn');
        btn.querySelector('.btn-text').textContent = '재시작';
        this.onGameStart();
        this.gameLoop();
    }

    gameLoop() {
        this.draw();
        
        if (!this.gameOver && this.gameRunning) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 그라디언트 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 격자 패턴
        this.drawGrid();
        
        this.drawBricks();
        this.drawPowerUps();
        this.drawBall();
        this.drawPaddle();
        
        if (this.gameRunning) {
            this.collisionDetection();
            this.updateBallPosition();
            this.updatePaddlePosition();
            this.updatePowerUps();
            this.updatePowerUpEffects();
        }
        
        if (this.gameWon) {
            this.showMessage('🎉 승리! 모든 벽돌을 깼습니다!');
        } else if (this.gameOver) {
            this.showMessage('💔 게임 오버!');
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvasWidth; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvasHeight; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                if (brick.status > 0) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    
                    brick.x = brickX;
                    brick.y = brickY;
                    
                    // 특수 벽돌 효과
                    if (brick.type) {
                        // 글로우 효과
                        this.ctx.shadowBlur = 10;
                        this.ctx.shadowColor = this.getSpecialBrickColor(brick.type);
                    }
                    
                    // 벽돌 그라디언트
                    const gradient = this.ctx.createLinearGradient(brickX, brickY, brickX, brickY + this.brickHeight);
                    if (brick.type === 'multi' && brick.hits < brick.maxHits) {
                        // 멀티히트 벽돌 (손상된 상태)
                        gradient.addColorStop(0, 'rgba(150, 150, 150, 0.8)');
                        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.8)');
                    } else {
                        gradient.addColorStop(0, brick.color);
                        gradient.addColorStop(1, this.darkenColor(brick.color, 0.3));
                    }
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);
                    
                    // 특수 벽돌 심볼
                    if (brick.type) {
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.font = '14px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(
                            this.powerUpTypes[brick.type].symbol,
                            brickX + this.brickWidth / 2,
                            brickY + this.brickHeight / 2
                        );
                    }
                    
                    // 하이라이트
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, 3);
                    
                    // 그림자 초기화
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }
    
    darkenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.floor((num >> 16) * (1 - factor));
        const g = Math.floor(((num >> 8) & 0x00FF) * (1 - factor));
        const b = Math.floor((num & 0x0000FF) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawBall() {
        // 공 트레일 효과
        this.ctx.globalAlpha = 0.3;
        for (let i = 1; i <= 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                this.x - this.dx * i * 2,
                this.y - this.dy * i * 2,
                this.ballRadius * (1 - i * 0.2),
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        
        // 메인 공
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ffff';
        
        const gradient = this.ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.ballRadius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#00ffff');
        gradient.addColorStop(1, '#0088cc');
        
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.closePath();
        
        this.ctx.shadowBlur = 0;
    }

    drawPaddle() {
        const paddleY = this.canvasHeight - this.paddleHeight - 10;
        const actualPaddleWidth = this.activePowerUps.expand ? this.paddleWidth * 1.5 : this.paddleWidth;
        
        // 패들 그라디언트
        const gradient = this.ctx.createLinearGradient(
            this.paddleX, paddleY,
            this.paddleX, paddleY + this.paddleHeight
        );
        
        if (this.activePowerUps.magnet) {
            // 자석 효과
            gradient.addColorStop(0, '#9b59b6');
            gradient.addColorStop(0.5, '#8e44ad');
            gradient.addColorStop(1, '#663399');
            
            // 자기장 효과
            this.ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
            this.ctx.lineWidth = 2;
            for (let i = 1; i <= 3; i++) {
                this.ctx.beginPath();
                this.ctx.arc(
                    this.paddleX + actualPaddleWidth / 2,
                    paddleY + this.paddleHeight / 2,
                    20 * i,
                    0,
                    Math.PI * 2
                );
                this.ctx.stroke();
            }
        } else {
            gradient.addColorStop(0, '#3498db');
            gradient.addColorStop(0.5, '#2980b9');
            gradient.addColorStop(1, '#21618c');
        }
        
        // 패들 본체
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddleX, paddleY, actualPaddleWidth, this.paddleHeight);
        
        // 레이저 파워업 효과
        if (this.activePowerUps.laser) {
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fillRect(this.paddleX + 10, paddleY - 5, 5, 5);
            this.ctx.fillRect(this.paddleX + actualPaddleWidth - 15, paddleY - 5, 5, 5);
        }
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(this.paddleX, paddleY, actualPaddleWidth, 3);
        
        // 사이드 글로우
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        this.ctx.fillRect(this.paddleX - 2, paddleY, 2, this.paddleHeight);
        this.ctx.fillRect(this.paddleX + actualPaddleWidth, paddleY, 2, this.paddleHeight);
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            // 회전 효과
            this.ctx.save();
            this.ctx.translate(powerUp.x, powerUp.y);
            this.ctx.rotate(powerUp.rotation);
            
            // 글로우 효과
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = powerUp.color;
            
            // 파워업 원
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fill();
            
            // 심볼
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.symbol, 0, 0);
            
            this.ctx.restore();
        });
    }

    collisionDetection() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status > 0) {
                    if (this.x + this.ballRadius > b.x && 
                        this.x - this.ballRadius < b.x + this.brickWidth && 
                        this.y + this.ballRadius > b.y && 
                        this.y - this.ballRadius < b.y + this.brickHeight) {
                        
                        // 충돌 방향 계산
                        const ballCenterX = this.x;
                        const ballCenterY = this.y;
                        const brickCenterX = b.x + this.brickWidth / 2;
                        const brickCenterY = b.y + this.brickHeight / 2;
                        
                        const dx = ballCenterX - brickCenterX;
                        const dy = ballCenterY - brickCenterY;
                        
                        if (Math.abs(dx) > Math.abs(dy)) {
                            this.dx = -this.dx;
                        } else {
                            this.dy = -this.dy;
                        }
                        
                        // 벽돌 히트 처리
                        b.hits--;
                        
                        if (b.hits <= 0) {
                            b.status = 0;
                            
                            // 특수 벽돌 파워업 생성
                            if (b.type) {
                                this.createPowerUp(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2, b.type);
                            }
                            
                            // 파티클 효과
                            this.createBrickParticles(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2, b.color);
                            
                            this.soundManager.play('brick_destroy');
                        } else {
                            this.soundManager.play('brick_hit');
                        }
                        
                        // 콤보 처리
                        this.updateCombo();
                        
                        // 점수 계산
                        const comboMultiplier = Math.min(this.combo, 10);
                        const baseScore = b.type ? 20 : 10;
                        this.score += baseScore * comboMultiplier;
                        
                        this.updateDisplay();
                        
                        // 모든 벽돌을 깼는지 확인
                        if (this.checkWin()) {
                            this.gameWon = true;
                            this.gameRunning = false;
                            this.soundManager.play('level_complete');
                            this.createWinParticles();
                            this.updateScore(this.score + 1000);
                            setTimeout(() => this.onGameOver(), 2000);
                        }
                    }
                }
            }
        }
    }
    
    createPowerUp(x, y, type) {
        const powerUp = {
            x: x,
            y: y,
            type: type,
            dy: 2,
            color: this.powerUpTypes[type].color,
            symbol: this.powerUpTypes[type].symbol,
            rotation: 0
        };
        
        this.powerUps.push(powerUp);
        this.soundManager.play('powerup_spawn');
    }
    
    updateCombo() {
        const now = Date.now();
        if (now - this.lastHitTime < 2000) {
            this.combo++;
            if (this.combo > 1) {
                this.soundManager.play('combo');
                this.showCombo();
            }
        } else {
            this.combo = 1;
        }
        this.lastHitTime = now;
        
        // 콤보 타임아웃 리셋
        if (this.comboTimeout) clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            this.combo = 0;
            this.hideCombo();
        }, 2000);
    }
    
    showCombo() {
        this.comboDisplay.style.display = 'block';
        this.comboElement.textContent = `x${this.combo}`;
        this.comboDisplay.classList.add('combo-pop');
        setTimeout(() => {
            this.comboDisplay.classList.remove('combo-pop');
        }, 300);
    }
    
    hideCombo() {
        this.comboDisplay.style.display = 'none';
    }

    updateBallPosition() {
        // 슬로우 파워업 효과
        const speedMultiplier = this.activePowerUps.slow ? 0.5 : 1;
        const actualDx = this.dx * speedMultiplier;
        const actualDy = this.dy * speedMultiplier;
        
        // 좌우 벽 충돌
        if (this.x + actualDx > this.canvasWidth - this.ballRadius || this.x + actualDx < this.ballRadius) {
            this.dx = -this.dx;
            this.soundManager.play('wall_bounce');
            this.createWallBounceParticles(this.x, this.y);
        }
        
        // 상단 벽 충돌
        if (this.y + actualDy < this.ballRadius) {
            this.dy = -this.dy;
            this.soundManager.play('wall_bounce');
            this.createWallBounceParticles(this.x, this.y);
        } else if (this.y + actualDy > this.canvasHeight - this.ballRadius - 10) {
            // 패들 충돌 체크
            const actualPaddleWidth = this.activePowerUps.expand ? this.paddleWidth * 1.5 : this.paddleWidth;
            
            if (this.x > this.paddleX && this.x < this.paddleX + actualPaddleWidth) {
                // 자석 효과
                if (this.activePowerUps.magnet) {
                    const paddleCenter = this.paddleX + actualPaddleWidth / 2;
                    const distFromCenter = this.x - paddleCenter;
                    this.x -= distFromCenter * 0.1; // 중앙으로 끌어당김
                }
                
                // 패들의 어느 부분에 맞았는지에 따라 각도 조정
                const hitPos = (this.x - this.paddleX) / actualPaddleWidth;
                this.dx = 8 * (hitPos - 0.5);
                this.dy = -Math.abs(this.dy);
                
                this.soundManager.play('paddle_hit');
                this.createPaddleHitParticles(this.x, this.y);
            } else {
                // 공을 놓침
                this.lives--;
                this.updateDisplay();
                this.soundManager.play('lose_life');
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                    this.gameRunning = false;
                    this.soundManager.play('game_over');
                    setTimeout(() => this.onGameOver(), 1000);
                } else {
                    // 리스폰
                    this.x = this.canvasWidth / 2;
                    this.y = this.canvasHeight - 30;
                    this.dx = 3;
                    this.dy = -3;
                    this.paddleX = (this.canvasWidth - this.paddleWidth) / 2;
                }
            }
        }
        
        this.x += actualDx;
        this.y += actualDy;
    }

    updatePaddlePosition() {
        const actualPaddleWidth = this.activePowerUps.expand ? this.paddleWidth * 1.5 : this.paddleWidth;
        const speed = 7;
        
        if (this.rightPressed) {
            this.paddleX += speed;
            if (this.paddleX + actualPaddleWidth > this.canvasWidth) {
                this.paddleX = this.canvasWidth - actualPaddleWidth;
            }
        } else if (this.leftPressed) {
            this.paddleX -= speed;
            if (this.paddleX < 0) {
                this.paddleX = 0;
            }
        }
        
        // 레이저 발사
        if (this.activePowerUps.laser && Math.random() < 0.02) {
            this.fireLaser();
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.dy;
            powerUp.rotation += 0.05;
            
            // 패들과 충돌 체크
            const actualPaddleWidth = this.activePowerUps.expand ? this.paddleWidth * 1.5 : this.paddleWidth;
            if (powerUp.y + 15 > this.canvasHeight - this.paddleHeight - 10 &&
                powerUp.x > this.paddleX &&
                powerUp.x < this.paddleX + actualPaddleWidth) {
                
                // 파워업 수집
                this.collectPowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
                this.soundManager.play('powerup_collect');
                this.createPowerUpCollectParticles(powerUp.x, powerUp.y, powerUp.color);
            }
            
            // 화면 밖으로 나가면 제거
            if (powerUp.y > this.canvasHeight) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    collectPowerUp(type) {
        const duration = this.powerUpTypes[type].duration;
        
        if (type === 'multi') {
            // 멀티볼 효과 (추가 구현 필요)
            this.score += 50;
        } else {
            // 지속 시간이 있는 파워업
            if (this.activePowerUps[type]) {
                clearTimeout(this.activePowerUps[type]);
            }
            
            this.activePowerUps[type] = setTimeout(() => {
                delete this.activePowerUps[type];
                this.updatePowerUpDisplay();
            }, duration);
        }
        
        this.updatePowerUpDisplay();
    }
    
    updatePowerUpDisplay() {
        const activePowers = Object.keys(this.activePowerUps)
            .filter(key => this.activePowerUps[key])
            .map(key => this.powerUpTypes[key].symbol)
            .join(' ');
        
        this.powerUpsDisplay.innerHTML = activePowers;
    }
    
    updatePowerUpEffects() {
        // 파워업 타이머 업데이트 등
    }
    
    fireLaser() {
        // 레이저 효과 (간단한 시각 효과만)
        this.createLaserParticles();
    }

    checkWin() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    return false;
                }
            }
        }
        return true;
    }

    showMessage(text) {
        // 배경 오버레이
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 메시지 배경
        const boxWidth = 300;
        const boxHeight = 100;
        const boxX = (this.canvasWidth - boxWidth) / 2;
        const boxY = (this.canvasHeight - boxHeight) / 2;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // 메시지 테두리
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // 메시지 텍스트
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, this.canvasWidth / 2, this.canvasHeight / 2);
        
        // 점수 표시
        if (this.gameWon || this.gameOver) {
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`최종 점수: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 + 30);
        }
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score.toLocaleString();
        
        // 생명 표시 애니메이션
        const hearts = [];
        for (let i = 0; i < 3; i++) {
            if (i < this.lives) {
                hearts.push('❤️');
            } else {
                hearts.push('🖤');
            }
        }
        this.livesElement.textContent = hearts.join('');
    }
    
    // 파티클 효과 메서드들
    createBrickParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = Math.random() * 3 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createWallBounceParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: '#00ffff',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createPaddleHitParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;
            const speed = Math.random() * 4 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: '#3498db',
                size: Math.random() * 3 + 2
            });
        }
    }
    
    createPowerUpCollectParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = Math.random() * 5 + 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: Math.random() * 5 + 3,
                gravity: 0.2
            });
        }
    }
    
    createWinParticles() {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.particles.push({
                    x: Math.random() * this.canvasWidth,
                    y: this.canvasHeight,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 8 - 4,
                    life: 1,
                    color: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 5)],
                    size: Math.random() * 4 + 2,
                    gravity: 0.2
                });
            }, i * 50);
        }
    }
    
    createLaserParticles() {
        const actualPaddleWidth = this.activePowerUps.expand ? this.paddleWidth * 1.5 : this.paddleWidth;
        const laserX1 = this.paddleX + 10;
        const laserX2 = this.paddleX + actualPaddleWidth - 10;
        const laserY = this.canvasHeight - this.paddleHeight - 15;
        
        for (let y = laserY; y > 0; y -= 20) {
            setTimeout(() => {
                this.particles.push({
                    x: laserX1,
                    y: y,
                    vx: 0,
                    vy: -2,
                    life: 0.5,
                    color: '#f39c12',
                    size: 3
                });
                this.particles.push({
                    x: laserX2,
                    y: y,
                    vx: 0,
                    vy: -2,
                    life: 0.5,
                    color: '#f39c12',
                    size: 3
                });
            }, (laserY - y) / 20 * 10);
        }
    }
    
    startParticleAnimation() {
        const animate = () => {
            if (!this.particleCtx) return;
            
            this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
            
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                
                if (p.gravity) {
                    p.vy += p.gravity;
                }
                
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
                
                this.particleCtx.save();
                this.particleCtx.globalAlpha = p.life;
                this.particleCtx.fillStyle = p.color;
                this.particleCtx.beginPath();
                this.particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.particleCtx.fill();
                this.particleCtx.restore();
            }
            
            if (this.container.contains(this.particleCanvas)) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    cleanup() {
        super.cleanup();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        
        // 파워업 타이머 정리
        Object.values(this.activePowerUps).forEach(timer => {
            if (timer) clearTimeout(timer);
        });
        
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        if (this.canvas) {
            this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        }
        
        this.particles = [];
    }
}