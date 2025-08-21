import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class Snake extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'snake',
            name: '스네이크',
            description: '뱀을 조종해서 먹이를 먹고 성장시키세요',
            category: 'action',
            difficulty: 'medium',
            hasAds: true,
            adPlacements: ['start', 'gameover']
        });
        
        this.canvas = null;
        this.ctx = null;
        this.gridSize = 20;
        this.tileCount = 20;
        
        this.snake = [{ x: 10, y: 10 }];
        this.food = { x: 15, y: 15 };
        this.specialFood = null;
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snake-highscore') || 0);
        this.gameRunning = false;
        this.gameLoop = null;
        this.speed = 100;
        this.level = 1;
        this.foodEaten = 0;
        
        // 파티클 효과
        this.particles = [];
        
        // 파워업
        this.powerUps = [];
        this.activePowerUp = null;
        this.powerUpDuration = 0;
    }

    init() {
        super.init();
        
        // 사운드 초기화
        SoundManager.init();
        SoundManager.registerDefaultSounds();
        this.registerGameSounds();
        
        // 게임 초기화
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.specialFood = null;
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.speed = 100;
        this.level = 1;
        this.foodEaten = 0;
        this.particles = [];
        this.powerUps = [];
        this.activePowerUp = null;
        this.powerUpDuration = 0;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.setupUI();
    }
    
    registerGameSounds() {
        // 먹기 사운드
        SoundManager.createSound('eat', {
            frequencies: [600, 800],
            type: 'sine',
            duration: 0.1,
            volume: 0.3
        });
        
        // 특별 음식 먹기
        SoundManager.createSound('special-eat', {
            frequencies: [800, 1000, 1200],
            type: 'sine',
            duration: 0.2,
            volume: 0.4
        });
        
        // 파워업
        SoundManager.createSound('powerup', {
            frequencies: [400, 600, 800, 1000],
            type: 'square',
            duration: 0.3,
            volume: 0.3
        });
        
        // 이동 사운드
        SoundManager.createSound('move', {
            frequency: 200,
            type: 'sine',
            duration: 0.05,
            volume: 0.1
        });
        
        // 충돌 사운드
        SoundManager.createSound('collision', {
            frequency: 150,
            type: 'sawtooth',
            duration: 0.5,
            volume: 0.4
        });
        
        // 레벨업
        SoundManager.createSound('levelup', {
            frequencies: [523, 659, 784, 1047],
            type: 'square',
            duration: 0.5,
            volume: 0.4
        });
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="snake-game">
                <div class="game-header">
                    <div class="game-stats">
                        <div class="stat-item">
                            <span class="stat-label">점수</span>
                            <span class="stat-value" id="score">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">레벨</span>
                            <span class="stat-value" id="level">1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">최고기록</span>
                            <span class="stat-value" id="highscore">${this.highScore}</span>
                        </div>
                    </div>
                    <div class="game-controls">
                        <button id="snake-start" class="btn-primary">게임 시작</button>
                        <button id="snake-pause" class="btn-secondary hidden">일시정지</button>
                    </div>
                </div>
                
                <div class="game-board">
                    <canvas id="snake-canvas" width="400" height="400"></canvas>
                    <div id="powerup-indicator" class="powerup-indicator hidden"></div>
                </div>
                
                <div class="snake-controls">
                    <div class="control-pad">
                        <button class="control-btn up" data-direction="up">↑</button>
                        <button class="control-btn left" data-direction="left">←</button>
                        <button class="control-btn down" data-direction="down">↓</button>
                        <button class="control-btn right" data-direction="right">→</button>
                    </div>
                </div>
                
                <div class="game-info">
                    <p>🎮 방향키 또는 화면 버튼으로 조작</p>
                    <p>🍎 빨간 음식 = 10점 | 🌟 특별 음식 = 50점</p>
                    <p>⚡ 파워업을 먹으면 특별한 능력을 얻습니다!</p>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.bindEvents();
        this.draw();
        this.updateDisplay();
        
        // 버튼 사운드 추가
        setTimeout(() => {
            SoundManager.addButtonSounds(this.container);
        }, 100);
    }

    bindEvents() {
        // 시작 버튼
        document.getElementById('snake-start').addEventListener('click', () => {
            this.startGame();
        });
        
        // 일시정지 버튼
        document.getElementById('snake-pause').addEventListener('click', () => {
            this.togglePause();
        });

        // 방향 버튼들
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeDirection(btn.dataset.direction);
            });
        });

        // 키보드 이벤트
        this.keyHandler = (e) => {
            if (this.isActive && !e.repeat) {
                this.handleKeyPress(e);
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
        
        // 터치 컨트롤 (스와이프)
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.gameRunning) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    this.changeDirection('right');
                } else {
                    this.changeDirection('left');
                }
            } else {
                if (diffY > 0) {
                    this.changeDirection('down');
                } else {
                    this.changeDirection('up');
                }
            }
        });
    }

    startGame() {
        if (this.gameRunning) return;
        
        this.init();
        this.gameRunning = true;
        this.dx = 1;
        this.dy = 0;
        
        document.getElementById('snake-start').classList.add('hidden');
        document.getElementById('snake-pause').classList.remove('hidden');
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, this.speed);
        
        SoundManager.play('click');
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
            document.getElementById('snake-pause').textContent = '계속하기';
            SoundManager.play('click');
        } else {
            this.gameLoop = setInterval(() => {
                this.update();
                this.draw();
            }, this.speed);
            document.getElementById('snake-pause').textContent = '일시정지';
            SoundManager.play('click');
        }
    }

    changeDirection(direction) {
        if (!this.gameRunning || !this.gameLoop) return;
        
        switch (direction) {
            case 'up':
                if (this.dy !== 1) { this.dx = 0; this.dy = -1; }
                break;
            case 'down':
                if (this.dy !== -1) { this.dx = 0; this.dy = 1; }
                break;
            case 'left':
                if (this.dx !== 1) { this.dx = -1; this.dy = 0; }
                break;
            case 'right':
                if (this.dx !== -1) { this.dx = 1; this.dy = 0; }
                break;
        }
    }

    handleKeyPress(e) {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.changeDirection('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.changeDirection('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.changeDirection('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.changeDirection('right');
                break;
            case ' ':
                e.preventDefault();
                if (!this.gameRunning) {
                    this.startGame();
                } else {
                    this.togglePause();
                }
                break;
        }
    }

    update() {
        if (!this.gameRunning) return;

        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // 벽 통과 모드 (파워업)
        if (this.activePowerUp === 'wall-pass') {
            if (head.x < 0) head.x = this.tileCount - 1;
            if (head.x >= this.tileCount) head.x = 0;
            if (head.y < 0) head.y = this.tileCount - 1;
            if (head.y >= this.tileCount) head.y = 0;
        } else {
            // 일반 벽 충돌 체크
            if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
                this.gameOver();
                return;
            }
        }

        // 자신과 충돌 체크
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            if (this.activePowerUp !== 'ghost') {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // 음식 먹었는지 체크
        let ate = false;
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.foodEaten++;
            this.createEatEffect(this.food.x, this.food.y, '#dc3545');
            SoundManager.play('eat');
            this.food = this.generateFood();
            ate = true;
            
            // 특별 음식 생성 확률
            if (Math.random() < 0.2 && !this.specialFood) {
                this.specialFood = this.generateSpecialFood();
            }
            
            // 파워업 생성 확률
            if (Math.random() < 0.1 && this.powerUps.length === 0) {
                this.generatePowerUp();
            }
        }
        
        // 특별 음식 먹었는지 체크
        if (this.specialFood && head.x === this.specialFood.x && head.y === this.specialFood.y) {
            this.score += 50;
            this.createEatEffect(this.specialFood.x, this.specialFood.y, '#ffc107');
            SoundManager.play('special-eat');
            this.specialFood = null;
            ate = true;
        }
        
        // 파워업 먹었는지 체크
        this.powerUps = this.powerUps.filter(powerUp => {
            if (head.x === powerUp.x && head.y === powerUp.y) {
                this.activatePowerUp(powerUp.type);
                this.createEatEffect(powerUp.x, powerUp.y, powerUp.color);
                ate = true;
                return false;
            }
            return true;
        });
        
        if (!ate) {
            this.snake.pop();
        }
        
        // 레벨 체크
        if (this.foodEaten > 0 && this.foodEaten % 10 === 0) {
            this.levelUp();
        }
        
        // 파워업 지속시간 감소
        if (this.activePowerUp && this.powerUpDuration > 0) {
            this.powerUpDuration--;
            if (this.powerUpDuration === 0) {
                this.deactivatePowerUp();
            }
        }
        
        // 파티클 업데이트
        this.updateParticles();
        
        this.updateDisplay();
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        return newFood;
    }
    
    generateSpecialFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                timer: 100 // 10초 동안 유지
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
                 (this.food.x === newFood.x && this.food.y === newFood.y));
        
        return newFood;
    }
    
    generatePowerUp() {
        const types = [
            { type: 'speed', color: '#00bcd4', duration: 100 },
            { type: 'slow', color: '#4caf50', duration: 100 },
            { type: 'wall-pass', color: '#9c27b0', duration: 150 },
            { type: 'ghost', color: '#607d8b', duration: 80 }
        ];
        
        const powerUpType = types[Math.floor(Math.random() * types.length)];
        
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                ...powerUpType,
                timer: 150
            };
        } while (this.snake.some(segment => segment.x === position.x && segment.y === position.y) ||
                 (this.food.x === position.x && this.food.y === position.y));
        
        this.powerUps.push(position);
    }
    
    activatePowerUp(type) {
        this.activePowerUp = type;
        SoundManager.play('powerup');
        
        const indicator = document.getElementById('powerup-indicator');
        indicator.classList.remove('hidden');
        
        switch (type) {
            case 'speed':
                this.powerUpDuration = 100;
                indicator.textContent = '⚡ 스피드 업!';
                indicator.style.color = '#00bcd4';
                if (this.gameLoop) {
                    clearInterval(this.gameLoop);
                    this.gameLoop = setInterval(() => {
                        this.update();
                        this.draw();
                    }, this.speed / 2);
                }
                break;
            case 'slow':
                this.powerUpDuration = 100;
                indicator.textContent = '🐌 슬로우!';
                indicator.style.color = '#4caf50';
                if (this.gameLoop) {
                    clearInterval(this.gameLoop);
                    this.gameLoop = setInterval(() => {
                        this.update();
                        this.draw();
                    }, this.speed * 2);
                }
                break;
            case 'wall-pass':
                this.powerUpDuration = 150;
                indicator.textContent = '🌀 벽 통과!';
                indicator.style.color = '#9c27b0';
                break;
            case 'ghost':
                this.powerUpDuration = 80;
                indicator.textContent = '👻 유령 모드!';
                indicator.style.color = '#607d8b';
                break;
        }
    }
    
    deactivatePowerUp() {
        const wasSpeedPowerUp = this.activePowerUp === 'speed' || this.activePowerUp === 'slow';
        this.activePowerUp = null;
        
        document.getElementById('powerup-indicator').classList.add('hidden');
        
        if (wasSpeedPowerUp && this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => {
                this.update();
                this.draw();
            }, this.speed);
        }
    }
    
    createEatEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
                x: x * this.gridSize + this.gridSize / 2,
                y: y * this.gridSize + this.gridSize / 2,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 1,
                color: color
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.life -= 0.02;
            return particle.life > 0;
        });
    }
    
    levelUp() {
        this.level++;
        this.speed = Math.max(50, this.speed - 5);
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => {
                this.update();
                this.draw();
            }, this.speed);
        }
        
        SoundManager.play('levelup');
        this.showLevelUpNotification();
    }
    
    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.textContent = `레벨 ${this.level}!`;
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    draw() {
        if (!this.ctx) return;
        
        // 배경
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자 그리기
        this.ctx.strokeStyle = '#16213e';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // 파워업
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.color;
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(
                powerUp.x * this.gridSize + 2,
                powerUp.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );
            
            // 파워업 아이콘
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const icon = powerUp.type === 'speed' ? '⚡' : 
                        powerUp.type === 'slow' ? '🐌' :
                        powerUp.type === 'wall-pass' ? '🌀' : '👻';
            this.ctx.fillText(
                icon,
                powerUp.x * this.gridSize + this.gridSize / 2,
                powerUp.y * this.gridSize + this.gridSize / 2
            );
            
            powerUp.timer--;
            if (powerUp.timer <= 0) {
                const index = this.powerUps.indexOf(powerUp);
                this.powerUps.splice(index, 1);
            }
        });
        
        this.ctx.shadowBlur = 0;

        // 뱀 그리기
        this.snake.forEach((segment, index) => {
            const gradient = this.ctx.createRadialGradient(
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                0,
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2
            );
            
            if (index === 0) {
                // 머리
                gradient.addColorStop(0, '#4ade80');
                gradient.addColorStop(1, '#22c55e');
            } else {
                // 몸통
                gradient.addColorStop(0, '#22c55e');
                gradient.addColorStop(1, '#16a34a');
            }
            
            this.ctx.fillStyle = gradient;
            if (this.activePowerUp === 'ghost') {
                this.ctx.globalAlpha = 0.5;
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            this.ctx.globalAlpha = 1;
            
            // 머리에 눈 그리기
            if (index === 0) {
                this.ctx.fillStyle = 'white';
                const eyeSize = 3;
                
                if (this.dx === 1) { // 오른쪽
                    this.ctx.fillRect(segment.x * this.gridSize + 12, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 12, segment.y * this.gridSize + 13, eyeSize, eyeSize);
                } else if (this.dx === -1) { // 왼쪽
                    this.ctx.fillRect(segment.x * this.gridSize + 5, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 5, segment.y * this.gridSize + 13, eyeSize, eyeSize);
                } else if (this.dy === -1) { // 위
                    this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 5, eyeSize, eyeSize);
                } else if (this.dy === 1) { // 아래
                    this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 12, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 12, eyeSize, eyeSize);
                }
            }
        });

        // 음식 그리기
        const foodGradient = this.ctx.createRadialGradient(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            0,
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2
        );
        foodGradient.addColorStop(0, '#ef4444');
        foodGradient.addColorStop(1, '#dc2626');
        
        this.ctx.fillStyle = foodGradient;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 특별 음식 그리기
        if (this.specialFood) {
            this.ctx.fillStyle = '#ffc107';
            this.ctx.shadowColor = '#ffc107';
            this.ctx.shadowBlur = 10 + Math.sin(Date.now() * 0.005) * 5;
            
            this.ctx.beginPath();
            this.ctx.arc(
                this.specialFood.x * this.gridSize + this.gridSize / 2,
                this.specialFood.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2 - 1,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            this.specialFood.timer--;
            if (this.specialFood.timer <= 0) {
                this.specialFood = null;
            }
        }
        
        // 파티클 그리기
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                particle.x - 2,
                particle.y - 2,
                4,
                4
            );
        });
        this.ctx.globalAlpha = 1;
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('highscore').textContent = this.highScore;
    }

    gameOver() {
        this.gameRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake-highscore', this.highScore);
        }
        
        document.getElementById('snake-start').classList.remove('hidden');
        document.getElementById('snake-pause').classList.add('hidden');
        document.getElementById('snake-start').textContent = '다시 시작';
        
        SoundManager.play('collision');
        
        // 게임 오버 화면
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>게임 오버!</h2>
                <p class="final-score">최종 점수: ${this.score}</p>
                <p class="final-level">레벨: ${this.level}</p>
                ${this.score > this.highScore ? '<p class="new-record">🎉 새로운 기록!</p>' : ''}
                <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">확인</button>
            </div>
        `;
        this.container.appendChild(overlay);
    }

    cleanup() {
        super.cleanup();
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}