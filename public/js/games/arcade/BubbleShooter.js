import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class BubbleShooter extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'bubble-shooter',
            name: '버블 슈터',
            description: '같은 색깔의 버블 3개 이상을 연결해서 터뜨리세요',
            category: 'arcade',
            difficulty: 'easy',
            hasAds: true,
            adPlacements: ['start', 'gameover', 'levelup']
        });
        
        // 게임 설정
        this.canvasWidth = 480;
        this.canvasHeight = 640;
        this.bubbleRadius = 20;
        this.bubbleSpacing = 2;
        this.gridWidth = 12;
        this.gridHeight = 16;
        
        // 색상 설정
        this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        this.activeColors = 4; // 게임 시작시 사용할 색상 수
        
        // 게임 상태
        this.grid = [];
        this.shooter = { x: 240, y: 580, angle: 0 };
        this.currentBubble = null;
        this.nextBubble = null;
        this.projectiles = [];
        this.particles = [];
        this.score = 0;
        this.level = 1;
        this.bubblesCleared = 0;
        this.gameRunning = false;
        this.gameOver = false;
        
        // 물리/애니메이션
        this.bubbleSpeed = 8;
        this.gravity = 0.2;
        this.dropDelay = 0;
        this.maxDropDelay = 300;
        
        // 특수 기능
        this.powerUps = [];
        this.combo = 0;
        this.lastClearTime = 0;
        this.aimHelper = true;
        
        // 사운드 초기화
        this.soundManager = SoundManager;
        this.registerSounds();
    }
    
    registerSounds() {
        // 버블 슈터 전용 사운드 등록
        this.soundManager.createSound('bubble_shoot', {
            frequency: 440,
            type: 'sine',
            duration: 0.15,
            volume: 0.3
        });
        
        this.soundManager.createSound('bubble_pop', {
            frequencies: [523, 659, 784],
            type: 'triangle',
            duration: 0.2,
            volume: 0.3
        });
        
        this.soundManager.createSound('bubble_stick', {
            frequency: 300,
            type: 'square',
            duration: 0.1,
            volume: 0.2
        });
        
        this.soundManager.createSound('combo_sound', {
            frequencies: [523, 659, 784, 1047],
            type: 'sine',
            duration: 0.4,
            volume: 0.3
        });
        
        this.soundManager.createSound('powerup_spawn', {
            frequencies: [440, 880, 1320],
            type: 'triangle',
            duration: 0.3,
            volume: 0.3
        });
        
        this.soundManager.createSound('level_up', {
            frequencies: [262, 330, 392, 523, 659],
            type: 'sine',
            duration: 0.8,
            volume: 0.4
        });
        
        this.soundManager.createSound('game_over_bubble', {
            frequencies: [440, 330, 262, 196],
            type: 'sawtooth',
            duration: 1,
            volume: 0.4
        });
        
        this.soundManager.createSound('wall_bounce', {
            frequency: 600,
            type: 'square',
            duration: 0.08,
            volume: 0.2
        });
    }
    
    async init() {
        super.init();
        
        // 사운드 매니저 초기화
        await this.soundManager.init();
        
        // 게임 상태 초기화
        this.score = 0;
        this.level = 1;
        this.bubblesCleared = 0;
        this.combo = 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.activeColors = Math.min(4 + Math.floor(this.level / 3), this.colors.length);
        
        // 그리드 초기화
        this.initializeGrid();
        
        // 버블 생성
        this.currentBubble = this.createBubble();
        this.nextBubble = this.createBubble();
        
        // 배열 초기화
        this.projectiles = [];
        this.particles = [];
        this.powerUps = [];
        
        // 슈터 위치 리셋
        this.shooter = { x: this.canvasWidth / 2, y: this.canvasHeight - 60, angle: 0 };
    }
    
    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                this.grid[row][col] = null;
            }
        }
        
        // 초기 버블들 배치 (상위 8줄)
        const initialRows = 8;
        for (let row = 0; row < initialRows; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                if (Math.random() < 0.8) { // 80% 확률로 버블 배치
                    this.grid[row][col] = {
                        color: this.getRandomColor(),
                        x: this.getBubbleX(row, col),
                        y: this.getBubbleY(row),
                        row: row,
                        col: col,
                        falling: false,
                        vy: 0
                    };
                }
            }
        }
    }
    
    getColCount(row) {
        // 짝수 행은 12개, 홀수 행은 11개
        return row % 2 === 0 ? this.gridWidth : this.gridWidth - 1;
    }
    
    getBubbleX(row, col) {
        const offset = row % 2 === 0 ? 0 : this.bubbleRadius;
        return col * (this.bubbleRadius * 2 + this.bubbleSpacing) + this.bubbleRadius + offset;
    }
    
    getBubbleY(row) {
        return row * (this.bubbleRadius * 1.8) + this.bubbleRadius + 20;
    }
    
    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.activeColors)];
    }
    
    createBubble() {
        return {
            color: this.getRandomColor(),
            x: 0,
            y: 0,
            radius: this.bubbleRadius
        };
    }
    
    render() {
        this.container.innerHTML = `
            <div class="bubble-shooter-wrapper">
                <div class="game-header">
                    <div class="game-stats">
                        <div class="stat-item">
                            <span class="stat-label">점수</span>
                            <span id="bubble-score" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">레벨</span>
                            <span id="bubble-level" class="stat-value">1</span>
                        </div>
                        <div class="stat-item combo-display" id="combo-display" style="display: none;">
                            <span class="combo-text">COMBO</span>
                            <span id="combo-count" class="combo-count">0</span>
                        </div>
                    </div>
                    <button class="game-btn primary" id="bubble-start-btn">
                        <span class="btn-icon">🎯</span>
                        <span class="btn-text">게임 시작</span>
                    </button>
                </div>
                
                <div class="game-canvas-container">
                    <canvas id="bubble-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
                    <canvas id="bubble-particle-canvas" class="particle-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
                    <div class="next-bubble-preview" id="next-bubble-preview">
                        <span class="preview-label">다음</span>
                        <div class="preview-bubble" id="preview-bubble"></div>
                    </div>
                </div>
                
                <div class="game-controls">
                    <button class="control-btn" id="aim-helper-btn">
                        <span class="btn-icon">🎯</span>
                        <span class="btn-text">조준선</span>
                    </button>
                    <div class="touch-area" id="touch-area"></div>
                    <button class="control-btn" id="swap-bubble-btn">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">교체</span>
                    </button>
                </div>
                
                <div class="sound-notice">
                    🔊 사운드 효과가 활성화되어 있습니다
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('bubble-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particleCanvas = document.getElementById('bubble-particle-canvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        this.scoreElement = document.getElementById('bubble-score');
        this.levelElement = document.getElementById('bubble-level');
        this.comboElement = document.getElementById('combo-count');
        this.comboDisplay = document.getElementById('combo-display');
        this.previewBubble = document.getElementById('preview-bubble');
        
        this.bindEvents();
        this.updateDisplay();
        this.updateNextBubblePreview();
        this.draw();
        this.startParticleAnimation();
    }
    
    bindEvents() {
        // 게임 시작 버튼
        document.getElementById('bubble-start-btn').addEventListener('click', () => {
            this.soundManager.play('click');
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            } else {
                this.init();
                this.render();
            }
        });
        
        // 조준선 토글
        document.getElementById('aim-helper-btn').addEventListener('click', () => {
            this.soundManager.play('click');
            this.aimHelper = !this.aimHelper;
            document.getElementById('aim-helper-btn').classList.toggle('active', this.aimHelper);
        });
        
        // 버블 교체
        document.getElementById('swap-bubble-btn').addEventListener('click', () => {
            this.soundManager.play('click');
            this.swapBubbles();
        });
        
        // 마우스/터치 조준
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameRunning || this.projectiles.length > 0) return;
            this.updateAim(e.clientX, e.clientY);
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameRunning || this.projectiles.length > 0) return;
            e.preventDefault();
            this.shootBubble();
        });
        
        // 터치 이벤트
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.gameRunning || this.projectiles.length > 0) return;
            e.preventDefault();
            const touch = e.touches[0];
            this.updateAim(touch.clientX, touch.clientY);
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.gameRunning || this.projectiles.length > 0) return;
            e.preventDefault();
            this.shootBubble();
        });
        
        // 키보드 컨트롤
        this.keyHandler = (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    if (this.projectiles.length === 0) {
                        this.shootBubble();
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.adjustAim(-0.1);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.adjustAim(0.1);
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    this.swapBubbles();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
    }
    
    updateAim(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (clientX - rect.left) * (this.canvasWidth / rect.width);
        const mouseY = (clientY - rect.top) * (this.canvasHeight / rect.height);
        
        const dx = mouseX - this.shooter.x;
        const dy = mouseY - this.shooter.y;
        this.shooter.angle = Math.atan2(dy, dx);
        
        // 각도 제한 (위쪽으로만)
        this.shooter.angle = Math.max(-Math.PI + 0.1, Math.min(-0.1, this.shooter.angle));
    }
    
    adjustAim(delta) {
        this.shooter.angle += delta;
        this.shooter.angle = Math.max(-Math.PI + 0.1, Math.min(-0.1, this.shooter.angle));
    }
    
    swapBubbles() {
        if (this.projectiles.length > 0) return;
        
        const temp = this.currentBubble;
        this.currentBubble = this.nextBubble;
        this.nextBubble = temp;
        this.updateNextBubblePreview();
    }
    
    updateNextBubblePreview() {
        if (this.previewBubble && this.nextBubble) {
            this.previewBubble.style.backgroundColor = this.nextBubble.color;
            this.previewBubble.style.border = `3px solid ${this.darkenColor(this.nextBubble.color, 0.2)}`;
        }
    }
    
    darkenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.floor((num >> 16) * (1 - factor));
        const g = Math.floor(((num >> 8) & 0x00FF) * (1 - factor));
        const b = Math.floor((num & 0x0000FF) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    startGame() {
        this.gameRunning = true;
        this.onGameStart();
        document.getElementById('bubble-start-btn').querySelector('.btn-text').textContent = '재시작';
        this.gameLoop();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    update() {
        // 투사체 업데이트
        this.updateProjectiles();
        
        // 떨어지는 버블들 업데이트
        this.updateFallingBubbles();
        
        // 파워업 업데이트
        this.updatePowerUps();
        
        // 게임 오버 체크
        this.checkGameOver();
        
        // 레벨 완료 체크
        this.checkLevelComplete();
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            projectile.x += Math.cos(projectile.angle) * this.bubbleSpeed;
            projectile.y += Math.sin(projectile.angle) * this.bubbleSpeed;
            
            // 벽 충돌 체크
            if (projectile.x - projectile.radius <= 0 || projectile.x + projectile.radius >= this.canvasWidth) {
                projectile.angle = Math.PI - projectile.angle;
                projectile.x = Math.max(projectile.radius, Math.min(this.canvasWidth - projectile.radius, projectile.x));
                this.soundManager.play('wall_bounce');
                this.createWallBounceParticles(projectile.x, projectile.y);
            }
            
            // 그리드와의 충돌 체크
            const collision = this.checkBubbleCollision(projectile);
            if (collision) {
                this.handleBubbleCollision(projectile, collision);
                this.projectiles.splice(i, 1);
            }
            
            // 화면 위쪽 도달
            if (projectile.y <= this.bubbleRadius) {
                this.addBubbleToGrid(projectile, 0, Math.round((projectile.x - this.bubbleRadius) / (this.bubbleRadius * 2 + this.bubbleSpacing)));
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkBubbleCollision(projectile) {
        for (let row = 0; row < this.gridHeight; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                const bubble = this.grid[row][col];
                if (!bubble || bubble.falling) continue;
                
                const dx = projectile.x - bubble.x;
                const dy = projectile.y - bubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.bubbleRadius * 2) {
                    return { row, col, bubble };
                }
            }
        }
        return null;
    }
    
    handleBubbleCollision(projectile, collision) {
        // 빈 공간에 버블 추가
        const { row, col } = this.findNearestEmptySpot(collision.row, collision.col);
        this.addBubbleToGrid(projectile, row, col);
        
        // 같은 색깔 연결된 버블들 찾기
        const connectedBubbles = this.findConnectedBubbles(row, col, projectile.color);
        
        if (connectedBubbles.length >= 3) {
            // 버블들 제거
            this.removeBubbles(connectedBubbles);
            this.soundManager.play('bubble_pop');
            
            // 연결이 끊긴 버블들 떨어뜨리기
            this.dropDisconnectedBubbles();
            
            // 콤보 처리
            this.handleCombo(connectedBubbles.length);
            
            // 파워업 생성 (확률적)
            if (connectedBubbles.length >= 5 && Math.random() < 0.3) {
                this.createPowerUp(row, col);
            }
        } else {
            this.soundManager.play('bubble_stick');
        }
        
        // 다음 버블 준비
        this.currentBubble = this.nextBubble;
        this.nextBubble = this.createBubble();
        this.updateNextBubblePreview();
    }
    
    findNearestEmptySpot(targetRow, targetCol) {
        // 충돌 지점 주변에서 빈 공간 찾기
        const directions = [
            [-1, 0], [-1, -1], [-1, 1],  // 위
            [0, -1], [0, 1],              // 양옆
            [1, 0], [1, -1], [1, 1]       // 아래
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = targetRow + dr;
            const newCol = targetCol + dc;
            
            if (this.isValidPosition(newRow, newCol) && !this.grid[newRow][newCol]) {
                return { row: newRow, col: newCol };
            }
        }
        
        // 빈 공간이 없으면 원래 위치 반환
        return { row: targetRow, col: targetCol };
    }
    
    isValidPosition(row, col) {
        if (row < 0 || row >= this.gridHeight) return false;
        const colCount = this.getColCount(row);
        return col >= 0 && col < colCount;
    }
    
    addBubbleToGrid(bubble, row, col) {
        if (this.grid[row][col]) return; // 이미 버블이 있으면 무시
        
        this.grid[row][col] = {
            color: bubble.color,
            x: this.getBubbleX(row, col),
            y: this.getBubbleY(row),
            row: row,
            col: col,
            falling: false,
            vy: 0
        };
    }
    
    findConnectedBubbles(startRow, startCol, color) {
        const visited = new Set();
        const connected = [];
        const stack = [[startRow, startCol]];
        
        while (stack.length > 0) {
            const [row, col] = stack.pop();
            const key = `${row},${col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const bubble = this.grid[row][col];
            if (!bubble || bubble.color !== color || bubble.falling) continue;
            
            connected.push({ row, col, bubble });
            
            // 인접한 위치들 확인
            const neighbors = this.getNeighbors(row, col);
            for (const [nRow, nCol] of neighbors) {
                if (!visited.has(`${nRow},${nCol}`)) {
                    stack.push([nRow, nCol]);
                }
            }
        }
        
        return connected;
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = row % 2 === 0 ? 
            [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] :  // 짝수 행
            [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];     // 홀수 행
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidPosition(newRow, newCol)) {
                neighbors.push([newRow, newCol]);
            }
        }
        
        return neighbors;
    }
    
    removeBubbles(bubbles) {
        for (const { row, col } of bubbles) {
            if (this.grid[row][col]) {
                // 파티클 효과 생성
                this.createBubblePopParticles(
                    this.grid[row][col].x, 
                    this.grid[row][col].y, 
                    this.grid[row][col].color
                );
                
                this.grid[row][col] = null;
                this.bubblesCleared++;
                this.score += 10 * this.combo;
            }
        }
        
        this.updateDisplay();
    }
    
    dropDisconnectedBubbles() {
        const connected = new Set();
        
        // 상단 행에서 연결된 모든 버블 찾기
        for (let col = 0; col < this.getColCount(0); col++) {
            if (this.grid[0][col]) {
                this.markConnectedBubbles(0, col, connected);
            }
        }
        
        // 연결되지 않은 버블들을 떨어뜨리기
        for (let row = 1; row < this.gridHeight; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                const bubble = this.grid[row][col];
                if (bubble && !connected.has(`${row},${col}`)) {
                    bubble.falling = true;
                    bubble.vy = 0;
                    this.score += 20; // 떨어지는 버블 보너스 점수
                }
            }
        }
        
        this.updateDisplay();
    }
    
    markConnectedBubbles(row, col, connected) {
        const key = `${row},${col}`;
        if (connected.has(key)) return;
        
        const bubble = this.grid[row][col];
        if (!bubble || bubble.falling) return;
        
        connected.add(key);
        
        const neighbors = this.getNeighbors(row, col);
        for (const [nRow, nCol] of neighbors) {
            this.markConnectedBubbles(nRow, nCol, connected);
        }
    }
    
    updateFallingBubbles() {
        for (let row = 0; row < this.gridHeight; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                const bubble = this.grid[row][col];
                if (bubble && bubble.falling) {
                    bubble.vy += this.gravity;
                    bubble.y += bubble.vy;
                    
                    // 화면 아래로 떨어지면 제거
                    if (bubble.y > this.canvasHeight) {
                        this.grid[row][col] = null;
                    }
                }
            }
        }
    }
    
    handleCombo(bubblesPopped) {
        const now = Date.now();
        if (now - this.lastClearTime < 3000) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        
        this.lastClearTime = now;
        
        if (this.combo > 1) {
            this.soundManager.play('combo_sound');
            this.showCombo();
            
            // 콤보 보너스 점수
            this.score += (this.combo - 1) * 50;
            this.updateDisplay();
        }
    }
    
    showCombo() {
        this.comboDisplay.style.display = 'block';
        this.comboElement.textContent = `x${this.combo}`;
        this.comboDisplay.classList.add('combo-pop');
        
        setTimeout(() => {
            this.comboDisplay.classList.remove('combo-pop');
        }, 300);
        
        setTimeout(() => {
            if (Date.now() - this.lastClearTime > 3000) {
                this.comboDisplay.style.display = 'none';
            }
        }, 3000);
    }
    
    createPowerUp(row, col) {
        const types = ['bomb', 'rainbow', 'laser'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerUps.push({
            type: type,
            x: this.getBubbleX(row, col),
            y: this.getBubbleY(row),
            collected: false
        });
        
        this.soundManager.play('powerup_spawn');
    }
    
    updatePowerUps() {
        // 파워업 로직 (향후 구현)
    }
    
    checkGameOver() {
        // 버블이 하단 라인에 도달했는지 확인
        const dangerLine = this.canvasHeight - 120;
        
        for (let row = 0; row < this.gridHeight; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                const bubble = this.grid[row][col];
                if (bubble && !bubble.falling && bubble.y > dangerLine) {
                    this.endGame();
                    return;
                }
            }
        }
    }
    
    checkLevelComplete() {
        // 모든 버블이 제거되었는지 확인
        let hasActiveBubbles = false;
        
        for (let row = 0; row < this.gridHeight; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                const bubble = this.grid[row][col];
                if (bubble && !bubble.falling) {
                    hasActiveBubbles = true;
                    break;
                }
            }
            if (hasActiveBubbles) break;
        }
        
        if (!hasActiveBubbles) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.activeColors = Math.min(4 + Math.floor(this.level / 3), this.colors.length);
        this.score += 1000 * this.level;
        
        this.soundManager.play('level_up');
        this.createLevelUpParticles();
        
        // 새 레벨 초기화
        setTimeout(() => {
            this.initializeGrid();
            this.currentBubble = this.createBubble();
            this.nextBubble = this.createBubble();
            this.updateNextBubblePreview();
            this.updateDisplay();
        }, 2000);
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        this.soundManager.play('game_over_bubble');
        this.updateScore(this.score);
        setTimeout(() => this.onGameOver(), 1500);
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score.toLocaleString();
        this.levelElement.textContent = this.level;
    }
    
    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 그라디언트 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 게임 영역 구분선
        this.drawGameArea();
        
        // 그리드의 버블들 그리기
        this.drawBubbles();
        
        // 투사체 그리기
        this.drawProjectiles();
        
        // 슈터 그리기
        this.drawShooter();
        
        // 조준선 그리기
        if (this.aimHelper && this.gameRunning && this.projectiles.length === 0) {
            this.drawAimLine();
        }
        
        // 파워업 그리기
        this.drawPowerUps();
        
        // 게임 오버 메시지
        if (this.gameOver) {
            this.drawGameOverMessage();
        }
    }
    
    drawGameArea() {
        // 위험 구역 표시
        const dangerY = this.canvasHeight - 120;
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        this.ctx.fillRect(0, dangerY, this.canvasWidth, 120);
        
        // 경계선
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, dangerY);
        this.ctx.lineTo(this.canvasWidth, dangerY);
        this.ctx.stroke();
    }
    
    drawBubbles() {
        for (let row = 0; row < this.gridHeight; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                const bubble = this.grid[row][col];
                if (bubble) {
                    this.drawBubble(bubble.x, bubble.y, bubble.color, this.bubbleRadius);
                }
            }
        }
    }
    
    drawProjectiles() {
        for (const projectile of this.projectiles) {
            this.drawBubble(projectile.x, projectile.y, projectile.color, projectile.radius);
        }
    }
    
    drawBubble(x, y, color, radius) {
        // 그림자
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        // 메인 버블
        const gradient = this.ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );
        gradient.addColorStop(0, this.lightenColor(color, 0.4));
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 그림자 초기화
        this.ctx.shadowBlur = 0;
    }
    
    lightenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * factor));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * factor));
        const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    drawShooter() {
        // 슈터 베이스
        this.ctx.fillStyle = '#34495e';
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 현재 버블
        if (this.currentBubble) {
            this.drawBubble(this.shooter.x, this.shooter.y, this.currentBubble.color, this.bubbleRadius);
        }
        
        // 슈터 방향 표시
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.shooter.x, this.shooter.y);
        this.ctx.lineTo(
            this.shooter.x + Math.cos(this.shooter.angle) * 30,
            this.shooter.y + Math.sin(this.shooter.angle) * 30
        );
        this.ctx.stroke();
    }
    
    drawAimLine() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        let x = this.shooter.x;
        let y = this.shooter.y;
        let angle = this.shooter.angle;
        const step = 10;
        const maxDistance = 300;
        let distance = 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        while (distance < maxDistance && y > 0) {
            x += Math.cos(angle) * step;
            y += Math.sin(angle) * step;
            distance += step;
            
            // 벽 반사
            if (x <= this.bubbleRadius || x >= this.canvasWidth - this.bubbleRadius) {
                angle = Math.PI - angle;
                x = Math.max(this.bubbleRadius, Math.min(this.canvasWidth - this.bubbleRadius, x));
            }
            
            // 버블과의 충돌 체크 (간단히)
            if (this.checkAimCollision(x, y)) {
                break;
            }
            
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    checkAimCollision(x, y) {
        for (let row = 0; row < this.gridHeight; row++) {
            const colCount = this.getColCount(row);
            for (let col = 0; col < colCount; col++) {
                const bubble = this.grid[row][col];
                if (!bubble || bubble.falling) continue;
                
                const dx = x - bubble.x;
                const dy = y - bubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.bubbleRadius * 2) {
                    return true;
                }
            }
        }
        return false;
    }
    
    drawPowerUps() {
        for (const powerUp of this.powerUps) {
            if (!powerUp.collected) {
                // 파워업 그리기 (간단한 별 모양)
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x, powerUp.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('★', powerUp.x, powerUp.y + 5);
            }
        }
    }
    
    drawGameOverMessage() {
        // 오버레이
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 메시지 박스
        const boxWidth = 300;
        const boxHeight = 120;
        const boxX = (this.canvasWidth - boxWidth) / 2;
        const boxY = (this.canvasHeight - boxHeight) / 2;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // 테두리
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // 텍스트
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('게임 오버!', this.canvasWidth / 2, this.canvasHeight / 2 - 10);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`최종 점수: ${this.score.toLocaleString()}`, this.canvasWidth / 2, this.canvasHeight / 2 + 20);
        this.ctx.fillText(`레벨: ${this.level}`, this.canvasWidth / 2, this.canvasHeight / 2 + 40);
    }
    
    shootBubble() {
        if (this.projectiles.length > 0 || !this.currentBubble) return;
        
        this.projectiles.push({
            x: this.shooter.x,
            y: this.shooter.y,
            angle: this.shooter.angle,
            color: this.currentBubble.color,
            radius: this.bubbleRadius
        });
        
        this.soundManager.play('bubble_shoot');
        this.createShootParticles();
    }
    
    // 파티클 효과 메서드들
    createBubblePopParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
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
                vy: Math.random() * -3 - 1,
                life: 1,
                color: '#ffffff',
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createShootParticles() {
        const x = this.shooter.x + Math.cos(this.shooter.angle) * 25;
        const y = this.shooter.y + Math.sin(this.shooter.angle) * 25;
        
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(this.shooter.angle + (Math.random() - 0.5) * 0.5) * 2,
                vy: Math.sin(this.shooter.angle + (Math.random() - 0.5) * 0.5) * 2,
                life: 0.5,
                color: this.currentBubble.color,
                size: Math.random() * 2 + 1
            });
        }
    }
    
    createLevelUpParticles() {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                this.particles.push({
                    x: Math.random() * this.canvasWidth,
                    y: this.canvasHeight,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 8 - 4,
                    life: 1,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    size: Math.random() * 6 + 3,
                    gravity: 0.2
                });
            }, i * 50);
        }
    }
    
    startParticleAnimation() {
        const animate = () => {
            if (!this.particleCtx) return;
            
            this.particleCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
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
        
        this.gameRunning = false;
        this.particles = [];
        
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}