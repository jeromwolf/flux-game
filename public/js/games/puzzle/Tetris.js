import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class Tetris extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'tetris',
            name: '테트리스',
            description: '떨어지는 블록을 회전시켜 줄을 없애세요',
            category: 'puzzle',
            difficulty: 'medium',
            hasAds: true,
            adPlacements: ['start', 'gameover']
        });
        
        this.canvas = null;
        this.ctx = null;
        this.nextCanvas = null;
        this.nextCtx = null;
        this.holdCanvas = null;
        this.holdCtx = null;
        
        this.blockSize = 20;
        this.cols = 10;
        this.rows = 20;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.currentX = 0;
        this.currentY = 0;
        
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;
        this.dropTime = 1000;
        this.lastDrop = 0;
        this.softDropping = false;
        
        this.particles = [];
        this.animations = [];
        
        this.pieces = {
            I: {
                shape: [[1,1,1,1]],
                color: '#00f0f0',
                gradient: ['#00f0f0', '#00c0c0']
            },
            O: {
                shape: [[1,1],[1,1]],
                color: '#f0f000',
                gradient: ['#f0f000', '#c0c000']
            },
            T: {
                shape: [[0,1,0],[1,1,1]],
                color: '#a000f0',
                gradient: ['#a000f0', '#8000c0']
            },
            S: {
                shape: [[0,1,1],[1,1,0]],
                color: '#00f000',
                gradient: ['#00f000', '#00c000']
            },
            Z: {
                shape: [[1,1,0],[0,1,1]],
                color: '#f00000',
                gradient: ['#f00000', '#c00000']
            },
            L: {
                shape: [[1,0,0],[1,1,1]],
                color: '#f0a000',
                gradient: ['#f0a000', '#c08000']
            },
            J: {
                shape: [[0,0,1],[1,1,1]],
                color: '#0000f0',
                gradient: ['#0000f0', '#0000c0']
            }
        };
        
        // 사운드 등록
        this.registerSounds();
    }

    registerSounds() {
        // 테트리스 전용 사운드 등록
        SoundManager.createSound('tetris_move', {
            frequency: 200,
            type: 'square',
            duration: 0.05,
            volume: 0.2
        });
        
        SoundManager.createSound('tetris_rotate', {
            frequency: 400,
            type: 'sine',
            duration: 0.1,
            volume: 0.3
        });
        
        SoundManager.createSound('tetris_drop', {
            frequency: 100,
            type: 'sawtooth',
            duration: 0.1,
            volume: 0.3
        });
        
        SoundManager.createSound('tetris_lock', {
            frequency: 150,
            type: 'triangle',
            duration: 0.15,
            volume: 0.3
        });
        
        SoundManager.createSound('tetris_line', {
            frequencies: [523, 659, 784, 1047],
            type: 'sine',
            duration: 0.4,
            volume: 0.4
        });
        
        SoundManager.createSound('tetris_tetris', {
            frequencies: [523, 587, 659, 698, 784, 880, 988, 1047],
            type: 'sine',
            duration: 0.8,
            volume: 0.5
        });
        
        SoundManager.createSound('tetris_hold', {
            frequency: 300,
            type: 'sine',
            duration: 0.1,
            volume: 0.2
        });
        
        SoundManager.createSound('tetris_gameover', {
            frequencies: [440, 330, 220, 110],
            type: 'sawtooth',
            duration: 1,
            volume: 0.4
        });
    }

    init() {
        super.init();
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 1000;
        this.particles = [];
        this.animations = [];
        this.holdPiece = null;
        this.canHold = true;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        // 사운드 시스템 초기화
        SoundManager.init();
    }

    render() {
        // 기존 캔버스 재사용
        const existingCanvas = document.getElementById('tetris-canvas');
        const existingNextCanvas = document.getElementById('next-canvas');
        const existingHoldCanvas = document.getElementById('hold-canvas');
        
        if (existingCanvas && existingNextCanvas && existingHoldCanvas) {
            this.canvas = existingCanvas;
            this.ctx = this.canvas.getContext('2d');
            this.nextCanvas = existingNextCanvas;
            this.nextCtx = this.nextCanvas.getContext('2d');
            this.holdCanvas = existingHoldCanvas;
            this.holdCtx = this.holdCanvas.getContext('2d');
            
            this.init();
            this.bindEvents();
            this.draw();
            this.updateStats();
            return;
        }
        
        // 새로운 구조가 필요한 경우
        this.container.innerHTML = `
            <div class="tetris-game">
                <div class="tetris-sidebar tetris-left">
                    <div class="tetris-hold-section">
                        <h4>보관</h4>
                        <canvas id="hold-canvas" width="80" height="80"></canvas>
                        <div class="tetris-tip">C키로 보관</div>
                    </div>
                    <div class="tetris-stats">
                        <div class="stat-item">
                            <span class="stat-label">점수</span>
                            <span class="stat-value" id="tetris-score">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">레벨</span>
                            <span class="stat-value" id="tetris-level">1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">줄</span>
                            <span class="stat-value" id="tetris-lines">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">콤보</span>
                            <span class="stat-value" id="tetris-combo">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="tetris-main">
                    <canvas id="tetris-canvas" width="200" height="400"></canvas>
                    <div class="tetris-controls-mobile">
                        <div class="tetris-control-row">
                            <button id="tetris-rotate" class="tetris-btn">↻</button>
                            <button id="tetris-hold" class="tetris-btn">보관</button>
                            <button id="tetris-drop" class="tetris-btn">⬇️</button>
                        </div>
                        <div class="tetris-control-row">
                            <button id="tetris-left" class="tetris-btn">◀</button>
                            <button id="tetris-down" class="tetris-btn">▼</button>
                            <button id="tetris-right" class="tetris-btn">▶</button>
                        </div>
                    </div>
                </div>
                
                <div class="tetris-sidebar tetris-right">
                    <div class="tetris-next-section">
                        <h4>다음 블록</h4>
                        <canvas id="next-canvas" width="80" height="80"></canvas>
                    </div>
                    <div class="tetris-buttons">
                        <button id="tetris-start" class="btn-primary">게임 시작</button>
                        <button id="tetris-pause" class="btn-secondary">일시정지</button>
                    </div>
                    <div class="tetris-info">
                        <h5>조작법</h5>
                        <ul>
                            <li>←→: 이동</li>
                            <li>↑: 회전</li>
                            <li>↓: 빠른 낙하</li>
                            <li>Space: 즉시 낙하</li>
                            <li>C: 블록 보관</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="tetris-sound-notice">
                🔊 사운드를 켜고 플레이하면 더욱 재미있습니다!
            </div>
        `;
        
        this.canvas = document.getElementById('tetris-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.init();
        this.bindEvents();
        this.draw();
    }

    bindEvents() {
        // 버튼 이벤트
        const startBtn = document.getElementById('tetris-start');
        if (startBtn) {
            startBtn.replaceWith(startBtn.cloneNode(true));
            document.getElementById('tetris-start').addEventListener('click', () => {
                this.startGame();
            });
        }

        const pauseBtn = document.getElementById('tetris-pause');
        if (pauseBtn) {
            pauseBtn.replaceWith(pauseBtn.cloneNode(true));
            document.getElementById('tetris-pause').addEventListener('click', () => {
                this.togglePause();
            });
        }

        // 컨트롤 버튼들
        const controls = {
            'tetris-left': () => this.move(-1, 0),
            'tetris-right': () => this.move(1, 0),
            'tetris-down': () => this.softDrop(),
            'tetris-rotate': () => this.rotate(),
            'tetris-drop': () => this.hardDrop(),
            'tetris-hold': () => this.holdCurrentPiece()
        };
        
        Object.entries(controls).forEach(([id, action]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (!this.gameRunning || this.gamePaused) return;
                    action();
                });
            }
        });

        // 키보드 이벤트
        this.keyHandler = (e) => {
            if (this.container.parentElement && this.container.parentElement.classList.contains('active')) {
                this.handleKeyPress(e);
            }
        };
        
        document.removeEventListener('keydown', this.keyHandler);
        document.addEventListener('keydown', this.keyHandler);
        
        // 키 해제 이벤트
        this.keyUpHandler = (e) => {
            if (e.key === 'ArrowDown') {
                this.softDropping = false;
            }
        };
        
        document.removeEventListener('keyup', this.keyUpHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.move(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.move(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.softDropping = true;
                this.softDrop();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotate();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                this.holdCurrentPiece();
                break;
        }
    }

    startGame() {
        this.init();
        this.gameRunning = true;
        this.gameState = 'playing';
        
        this.spawnPiece();
        this.spawnNextPiece();
        
        const startBtn = document.getElementById('tetris-start');
        if (startBtn) {
            startBtn.textContent = '재시작';
        }
        
        this.lastDrop = performance.now();
        this.gameLoop = requestAnimationFrame(() => this.update());
        
        SoundManager.play('levelup');
    }

    update() {
        if (!this.gameRunning || this.gamePaused) {
            this.gameLoop = requestAnimationFrame(() => this.update());
            return;
        }
        
        const now = performance.now();
        const deltaTime = now - this.lastDrop;
        
        if (deltaTime >= this.dropTime) {
            this.drop();
            this.lastDrop = now;
        }
        
        // 파티클 업데이트
        this.updateParticles();
        
        // 애니메이션 업데이트
        this.updateAnimations();
        
        // 화면 그리기
        this.draw();
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            this.pause();
        } else {
            this.resume();
        }
        
        const pauseBtn = document.getElementById('tetris-pause');
        if (pauseBtn) {
            pauseBtn.textContent = this.gamePaused ? '재개' : '일시정지';
        }
    }

    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = this.getRandomPiece();
        }
        
        this.currentX = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;
        this.canHold = true;
        
        if (!this.isValidPosition(0, 0)) {
            this.gameOver();
        }
    }

    spawnNextPiece() {
        this.nextPiece = this.getRandomPiece();
        this.renderNextPiece();
    }

    getRandomPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        const piece = this.pieces[type];
        
        return {
            type: type,
            shape: piece.shape.map(row => [...row]),
            color: piece.color,
            gradient: piece.gradient
        };
    }

    holdCurrentPiece() {
        if (!this.canHold) return;
        
        SoundManager.play('tetris_hold');
        
        if (this.holdPiece) {
            const temp = this.holdPiece;
            this.holdPiece = this.currentPiece;
            this.currentPiece = temp;
            this.currentX = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
            this.currentY = 0;
        } else {
            this.holdPiece = this.currentPiece;
            this.spawnPiece();
            this.spawnNextPiece();
        }
        
        this.canHold = false;
        this.renderHoldPiece();
    }

    isValidPosition(offsetX, offsetY, shape = this.currentPiece.shape) {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.currentX + x + offsetX;
                    const newY = this.currentY + y + offsetY;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    move(dx, dy) {
        if (this.isValidPosition(dx, dy)) {
            this.currentX += dx;
            this.currentY += dy;
            if (dx !== 0) {
                SoundManager.play('tetris_move');
            }
            return true;
        }
        return false;
    }

    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, index) =>
            this.currentPiece.shape.map(row => row[index]).reverse()
        );
        
        // Wall kick 시도
        const kicks = [
            [0, 0],
            [-1, 0], [1, 0],
            [0, -1],
            [-1, -1], [1, -1]
        ];
        
        for (const [kickX, kickY] of kicks) {
            if (this.isValidPosition(kickX, kickY, rotated)) {
                this.currentPiece.shape = rotated;
                this.currentX += kickX;
                this.currentY += kickY;
                SoundManager.play('tetris_rotate');
                
                // T-스핀 체크
                if (this.currentPiece.type === 'T' && this.checkTSpin()) {
                    this.createParticles(this.currentX * this.blockSize + 20, 
                                       this.currentY * this.blockSize + 20, 
                                       '#ff00ff');
                    this.updateScore(400 * this.level);
                }
                return;
            }
        }
    }

    checkTSpin() {
        // 간단한 T-스핀 체크
        const corners = [
            [this.currentX - 1, this.currentY - 1],
            [this.currentX + 2, this.currentY - 1],
            [this.currentX - 1, this.currentY + 2],
            [this.currentX + 2, this.currentY + 2]
        ];
        
        let filledCorners = 0;
        for (const [x, y] of corners) {
            if (x < 0 || x >= this.cols || y < 0 || y >= this.rows || this.board[y][x]) {
                filledCorners++;
            }
        }
        
        return filledCorners >= 3;
    }

    drop() {
        if (!this.move(0, 1)) {
            this.lockPiece();
        }
    }

    softDrop() {
        if (this.move(0, 1)) {
            this.updateScore(1);
            SoundManager.play('tetris_drop');
        }
    }

    hardDrop() {
        let dropDistance = 0;
        while (this.move(0, 1)) {
            dropDistance++;
        }
        this.updateScore(dropDistance * 2);
        this.lockPiece();
        SoundManager.play('tetris_drop');
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentY + y;
                    const boardX = this.currentX + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = {
                            color: this.currentPiece.color,
                            gradient: this.currentPiece.gradient
                        };
                    }
                }
            }
        }
        
        SoundManager.play('tetris_lock');
        this.clearLines();
        this.spawnPiece();
        this.spawnNextPiece();
    }

    clearLines() {
        let linesCleared = [];
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== null)) {
                linesCleared.push(y);
            }
        }
        
        if (linesCleared.length > 0) {
            // 라인 제거 애니메이션
            linesCleared.forEach(y => {
                this.createLineParticles(y);
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(null));
            });
            
            this.lines += linesCleared.length;
            this.combo++;
            
            // 점수 계산
            let lineScore = 0;
            switch (linesCleared.length) {
                case 1: lineScore = 100 * this.level; break;
                case 2: lineScore = 300 * this.level; break;
                case 3: lineScore = 500 * this.level; break;
                case 4: lineScore = 800 * this.level; break; // 테트리스!
            }
            
            // 콤보 보너스
            if (this.combo > 1) {
                lineScore += 50 * this.combo * this.level;
            }
            
            this.updateScore(lineScore);
            
            // 사운드 재생
            if (linesCleared.length === 4) {
                SoundManager.play('tetris_tetris');
                this.showMessage('TETRIS!', '#ff00ff');
            } else {
                SoundManager.play('tetris_line');
            }
            
            // 레벨업 체크
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropTime = Math.max(50, 1000 - (this.level - 1) * 100);
                SoundManager.play('levelup');
                this.showMessage(`레벨 ${this.level}!`, '#00ff00');
            }
            
            this.updateStats();
        } else {
            this.combo = 0;
        }
    }

    createLineParticles(y) {
        for (let x = 0; x < this.cols; x++) {
            if (this.board[y][x]) {
                const color = this.board[y][x].color;
                this.createParticles(x * this.blockSize + 10, y * this.blockSize + 10, color);
            }
        }
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // 중력
            particle.life -= 0.02;
            particle.size *= 0.98;
            
            return particle.life > 0;
        });
    }

    showMessage(text, color) {
        this.animations.push({
            type: 'message',
            text: text,
            color: color,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            scale: 0,
            alpha: 1,
            life: 60
        });
    }

    updateAnimations() {
        this.animations = this.animations.filter(anim => {
            if (anim.type === 'message') {
                anim.scale = Math.min(anim.scale + 0.1, 1);
                anim.y -= 1;
                if (anim.life < 20) {
                    anim.alpha = anim.life / 20;
                }
            }
            
            anim.life--;
            return anim.life > 0;
        });
    }

    draw() {
        if (!this.ctx) return;
        
        // 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자선
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
        
        // 고스트 피스 그리기
        this.drawGhostPiece();
        
        // 보드 그리기
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x].color, this.board[y][x].gradient);
                }
            }
        }
        
        // 현재 조각 그리기
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentX + x,
                            this.currentY + y,
                            this.currentPiece.color,
                            this.currentPiece.gradient,
                            true
                        );
                    }
                }
            }
        }
        
        // 파티클 그리기
        this.drawParticles();
        
        // 애니메이션 그리기
        this.drawAnimations();
    }

    drawGhostPiece() {
        if (!this.currentPiece) return;
        
        let ghostY = this.currentY;
        while (this.isValidPosition(0, ghostY - this.currentY + 1)) {
            ghostY++;
        }
        
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawBlock(
                        this.currentX + x,
                        ghostY + y,
                        '#ffffff',
                        ['#ffffff', '#cccccc'],
                        false,
                        true
                    );
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    drawBlock(x, y, color, gradient, isActive = false, isGhost = false) {
        const padding = 1;
        const blockX = x * this.blockSize + padding;
        const blockY = y * this.blockSize + padding;
        const size = this.blockSize - padding * 2;
        
        if (!isGhost) {
            // 그라디언트 배경
            const grad = this.ctx.createLinearGradient(blockX, blockY, blockX + size, blockY + size);
            grad.addColorStop(0, gradient[0]);
            grad.addColorStop(1, gradient[1]);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(blockX, blockY, size, size);
            
            // 하이라이트
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(blockX, blockY, size, 4);
            this.ctx.fillRect(blockX, blockY, 4, size);
            
            // 그림자
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(blockX + size - 4, blockY, 4, size);
            this.ctx.fillRect(blockX, blockY + size - 4, size, 4);
        } else {
            // 고스트 피스
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(blockX, blockY, size, size);
        }
        
        // 활성 블록 효과
        if (isActive) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(blockX, blockY, size, size);
            this.ctx.shadowBlur = 0;
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, 
                             particle.size, particle.size);
        });
        this.ctx.globalAlpha = 1;
    }

    drawAnimations() {
        this.animations.forEach(anim => {
            if (anim.type === 'message') {
                this.ctx.save();
                this.ctx.globalAlpha = anim.alpha;
                this.ctx.fillStyle = anim.color;
                this.ctx.font = `bold ${30 * anim.scale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = anim.color;
                this.ctx.fillText(anim.text, anim.x, anim.y);
                this.ctx.restore();
            }
        });
    }

    renderNextPiece() {
        if (!this.nextCtx) return;
        
        this.nextCtx.fillStyle = '#1a1a2e';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = Math.floor((4 - this.nextPiece.shape[0].length) / 2);
            const offsetY = Math.floor((4 - this.nextPiece.shape.length) / 2);
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.drawBlockSmall(
                            this.nextCtx,
                            offsetX + x,
                            offsetY + y,
                            this.nextPiece.color,
                            this.nextPiece.gradient,
                            blockSize
                        );
                    }
                }
            }
        }
    }

    renderHoldPiece() {
        if (!this.holdCtx) return;
        
        this.holdCtx.fillStyle = '#1a1a2e';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.holdPiece) {
            const blockSize = 20;
            const offsetX = Math.floor((4 - this.holdPiece.shape[0].length) / 2);
            const offsetY = Math.floor((4 - this.holdPiece.shape.length) / 2);
            
            this.holdCtx.globalAlpha = this.canHold ? 1 : 0.5;
            
            for (let y = 0; y < this.holdPiece.shape.length; y++) {
                for (let x = 0; x < this.holdPiece.shape[y].length; x++) {
                    if (this.holdPiece.shape[y][x]) {
                        this.drawBlockSmall(
                            this.holdCtx,
                            offsetX + x,
                            offsetY + y,
                            this.holdPiece.color,
                            this.holdPiece.gradient,
                            blockSize
                        );
                    }
                }
            }
            
            this.holdCtx.globalAlpha = 1;
        }
    }

    drawBlockSmall(ctx, x, y, color, gradient, size) {
        const padding = 1;
        const blockX = x * size + padding;
        const blockY = y * size + padding;
        const blockSize = size - padding * 2;
        
        // 그라디언트 배경
        const grad = ctx.createLinearGradient(blockX, blockY, blockX + blockSize, blockY + blockSize);
        grad.addColorStop(0, gradient[0]);
        grad.addColorStop(1, gradient[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(blockX, blockY, blockSize, blockSize);
        
        // 하이라이트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(blockX, blockY, blockSize, 2);
    }

    updateStats() {
        const scoreEl = document.getElementById('tetris-score');
        const levelEl = document.getElementById('tetris-level');
        const linesEl = document.getElementById('tetris-lines');
        const comboEl = document.getElementById('tetris-combo');
        
        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        if (levelEl) levelEl.textContent = this.level;
        if (linesEl) linesEl.textContent = this.lines;
        if (comboEl) comboEl.textContent = this.combo > 1 ? `x${this.combo}` : '';
    }

    async gameOver() {
        this.gameRunning = false;
        this.gameState = 'gameover';
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        SoundManager.play('tetris_gameover');
        this.showMessage('GAME OVER', '#ff0000');
        
        await super.gameOver();
        
        setTimeout(() => {
            alert(`게임 오버!\n최종 점수: ${this.score.toLocaleString()}\n레벨: ${this.level}\n클리어한 줄: ${this.lines}`);
            
            const startBtn = document.getElementById('tetris-start');
            if (startBtn) {
                startBtn.textContent = '게임 시작';
            }
            
            const pauseBtn = document.getElementById('tetris-pause');
            if (pauseBtn) {
                pauseBtn.textContent = '일시정지';
            }
        }, 1000);
    }

    cleanup() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }
        super.cleanup();
    }
}