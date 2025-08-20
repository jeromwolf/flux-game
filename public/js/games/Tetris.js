import { BaseGame } from '../core/BaseGame.js';

export class Tetris extends BaseGame {
    constructor() {
        super('tetris', '테트리스', '떨어지는 블록을 회전시켜 줄을 없애세요');
        
        this.canvas = null;
        this.ctx = null;
        this.nextCanvas = null;
        this.nextCtx = null;
        
        this.blockSize = 20;
        this.cols = 10;
        this.rows = 20;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;
        this.dropTime = 1000;
        
        this.pieces = {
            I: [[1,1,1,1]],
            O: [[1,1],[1,1]],
            T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]],
            Z: [[1,1,0],[0,1,1]],
            L: [[1,0,0],[1,1,1]],
            J: [[0,0,1],[1,1,1]]
        };
        
        this.colors = {
            I: '#00f0f0',
            O: '#f0f000',
            T: '#a000f0',
            S: '#00f000',
            Z: '#f00000',
            L: '#f0a000',
            J: '#0000f0'
        };
    }

    init() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 1000;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    render() {
        // 기존 캔버스 재사용
        const existingCanvas = document.getElementById('tetris-canvas');
        const existingNextCanvas = document.getElementById('next-canvas');
        
        if (existingCanvas && existingNextCanvas) {
            this.canvas = existingCanvas;
            this.ctx = this.canvas.getContext('2d');
            this.nextCanvas = existingNextCanvas;
            this.nextCtx = this.nextCanvas.getContext('2d');
            
            this.init();
            this.bindEvents();
            this.draw();
            this.updateStats();
            return;
        }
        
        // 새로운 구조가 필요한 경우
        this.container.innerHTML = `
            <div class="tetris-game">
                <div class="tetris-info">
                    <div class="stats">
                        <div>점수: <span id="tetris-score">0</span></div>
                        <div>레벨: <span id="tetris-level">1</span></div>
                        <div>줄: <span id="tetris-lines">0</span></div>
                    </div>
                    <div class="next-piece">
                        <h4>다음 블록</h4>
                        <canvas id="next-canvas" width="80" height="80"></canvas>
                    </div>
                    <button id="tetris-start" class="btn-primary">게임 시작</button>
                    <button id="tetris-pause" class="btn-secondary">일시정지</button>
                </div>
                <canvas id="tetris-canvas" width="200" height="400"></canvas>
            </div>
        `;
        
        this.canvas = document.getElementById('tetris-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
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

        // 컨트롤 버튼들 (기존 HTML에 있는 경우)
        const controls = ['tetris-left', 'tetris-right', 'tetris-down', 'tetris-rotate', 'tetris-drop'];
        controls.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (!this.gameRunning || this.gamePaused) return;
                    
                    switch(id) {
                        case 'tetris-left': this.move(-1, 0); break;
                        case 'tetris-right': this.move(1, 0); break;
                        case 'tetris-down': this.move(0, 1); break;
                        case 'tetris-rotate': this.rotate(); break;
                        case 'tetris-drop': this.hardDrop(); break;
                    }
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
                this.move(0, 1);
                this.score += 1;
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotate();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
        }
    }

    startGame() {
        this.init();
        this.gameRunning = true;
        
        this.spawnPiece();
        this.spawnNextPiece();
        
        const startBtn = document.getElementById('tetris-start');
        if (startBtn) {
            startBtn.textContent = '재시작';
        }
        
        this.gameLoop = setInterval(() => {
            if (!this.gamePaused) {
                this.drop();
            }
        }, this.dropTime);
    }

    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('tetris-pause');
        if (pauseBtn) {
            pauseBtn.textContent = this.gamePaused ? '재개' : '일시정지';
        }
    }

    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            const pieceTypes = Object.keys(this.pieces);
            const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
            this.currentPiece = {
                type: type,
                shape: this.pieces[type].map(row => [...row]),
                color: this.colors[type]
            };
        }
        
        this.currentX = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;
        
        if (!this.isValidPosition(0, 0)) {
            this.gameOver();
        }
    }

    spawnNextPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        this.nextPiece = {
            type: type,
            shape: this.pieces[type].map(row => [...row]),
            color: this.colors[type]
        };
        
        this.renderNextPiece();
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
            this.draw();
            return true;
        }
        return false;
    }

    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, index) =>
            this.currentPiece.shape.map(row => row[index]).reverse()
        );
        
        if (this.isValidPosition(0, 0, rotated)) {
            this.currentPiece.shape = rotated;
            this.draw();
        }
    }

    drop() {
        if (!this.move(0, 1)) {
            this.lockPiece();
        }
    }

    hardDrop() {
        let dropDistance = 0;
        while (this.move(0, 1)) {
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.lockPiece();
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentY + y;
                    const boardX = this.currentX + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
        this.spawnNextPiece();
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== null)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(null));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            
            if (linesCleared === 4) {
                this.score += 400 * this.level;
            }
            
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropTime = Math.max(100, 1000 - (this.level - 1) * 100);
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => {
                    if (!this.gamePaused && this.gameRunning) {
                        this.drop();
                    }
                }, this.dropTime);
            }
            
            this.updateStats();
        }
    }

    draw() {
        if (!this.ctx) return;
        
        // 보드 클리어
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자선
        this.ctx.strokeStyle = '#dee2e6';
        this.ctx.lineWidth = 0.5;
        
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
        
        // 보드 그리기
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
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
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
    }

    renderNextPiece() {
        if (!this.nextCtx) return;
        
        this.nextCtx.fillStyle = '#f8f9fa';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const offsetX = Math.floor((4 - this.nextPiece.shape[0].length) / 2);
            const offsetY = Math.floor((4 - this.nextPiece.shape.length) / 2);
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.drawBlockNext(
                            offsetX + x,
                            offsetY + y,
                            this.nextPiece.color
                        );
                    }
                }
            }
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize + 1,
            y * this.blockSize + 1,
            this.blockSize - 2,
            this.blockSize - 2
        );
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * this.blockSize + 1,
            y * this.blockSize + 1,
            this.blockSize - 2,
            4
        );
    }

    drawBlockNext(x, y, color) {
        const size = 20;
        this.nextCtx.fillStyle = color;
        this.nextCtx.fillRect(
            x * size + 1,
            y * size + 1,
            size - 2,
            size - 2
        );
        
        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.nextCtx.fillRect(
            x * size + 1,
            y * size + 1,
            size - 2,
            4
        );
    }

    updateStats() {
        const scoreEl = document.getElementById('tetris-score');
        const levelEl = document.getElementById('tetris-level');
        const linesEl = document.getElementById('tetris-lines');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (levelEl) levelEl.textContent = this.level;
        if (linesEl) linesEl.textContent = this.lines;
    }

    gameOver() {
        this.gameRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        alert(`게임 오버!\n최종 점수: ${this.score}\n레벨: ${this.level}\n클리어한 줄: ${this.lines}`);
        
        const startBtn = document.getElementById('tetris-start');
        if (startBtn) {
            startBtn.textContent = '게임 시작';
        }
        
        const pauseBtn = document.getElementById('tetris-pause');
        if (pauseBtn) {
            pauseBtn.textContent = '일시정지';
        }
    }

    cleanup() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
}