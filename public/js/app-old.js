class FluxGame {
    constructor() {
        this.currentScreen = 'menu';
        this.games = {
            tictactoe: new TicTacToeGame(),
            snake: new SnakeGame(),
            tetris: new TetrisGame()
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.showScreen('menu');
    }

    bindEvents() {
        // 게임 선택 버튼
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameType = e.currentTarget.dataset.game;
                this.startGame(gameType);
            });
        });

        // 메뉴로 돌아가기 버튼들
        document.querySelectorAll('[id$="-back-to-menu"], #back-to-menu').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen('menu');
            });
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    startGame(gameType) {
        if (this.games[gameType]) {
            this.showScreen(gameType);
            this.games[gameType].start();
        }
    }
}

class TicTacToeGame {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.cells = null;
    }

    start() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        
        this.cells = document.querySelectorAll('.cell');
        this.bindEvents();
        this.render();
        this.hideResult();
    }

    bindEvents() {
        this.cells.forEach((cell, index) => {
            cell.replaceWith(cell.cloneNode(true)); // 이전 이벤트 제거
        });
        
        this.cells = document.querySelectorAll('.cell');
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => {
                this.makeMove(index);
            });
        });

        // 다시 하기 버튼
        const restartBtn = document.getElementById('restart-game');
        restartBtn.replaceWith(restartBtn.cloneNode(true));
        document.getElementById('restart-game').addEventListener('click', () => {
            this.start();
        });
    }

    makeMove(index) {
        if (this.board[index] !== '' || this.gameOver) {
            return;
        }

        this.board[index] = this.currentPlayer;
        this.render();

        if (this.checkWinner()) {
            this.gameOver = true;
            this.showResult(`🎉 ${this.currentPlayer}가 승리했습니다!`);
        } else if (this.board.every(cell => cell !== '')) {
            this.gameOver = true;
            this.showResult('무승부입니다!');
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateCurrentPlayer();
        }
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // 가로
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // 세로
            [0, 4, 8], [2, 4, 6] // 대각선
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[b] === this.board[c];
        });
    }

    render() {
        this.cells.forEach((cell, index) => {
            cell.textContent = this.board[index];
            cell.className = 'cell';
            if (this.board[index]) {
                cell.classList.add(this.board[index].toLowerCase());
            }
        });
    }

    updateCurrentPlayer() {
        document.getElementById('current-player').textContent = `현재 플레이어: ${this.currentPlayer}`;
    }

    showResult(message) {
        document.getElementById('result-text').textContent = message;
        document.getElementById('game-result').classList.remove('hidden');
    }

    hideResult() {
        document.getElementById('game-result').classList.add('hidden');
        this.updateCurrentPlayer();
    }
}

class SnakeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gridSize = 20;
        this.tileCount = 20;
        
        this.snake = [{ x: 10, y: 10 }];
        this.food = { x: 15, y: 15 };
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameLoop = null;
    }

    start() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        
        this.bindEvents();
        this.render();
        this.updateScore();
    }

    bindEvents() {
        // 시작 버튼
        const startBtn = document.getElementById('snake-start');
        startBtn.replaceWith(startBtn.cloneNode(true));
        document.getElementById('snake-start').addEventListener('click', () => {
            this.startGame();
        });

        // 방향 버튼들
        ['up', 'down', 'left', 'right'].forEach(direction => {
            const btn = document.getElementById(direction);
            btn.replaceWith(btn.cloneNode(true));
            document.getElementById(direction).addEventListener('click', () => {
                this.changeDirection(direction);
            });
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('snake').classList.contains('active')) {
                this.handleKeyPress(e);
            }
        });
    }

    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.dx = 1;
        this.dy = 0;
        
        document.getElementById('snake-start').textContent = '게임 중...';
        document.getElementById('snake-start').disabled = true;
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.render();
        }, 200);
    }

    changeDirection(direction) {
        if (!this.gameRunning) return;
        
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
        }
    }

    update() {
        if (!this.gameRunning) return;

        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // 벽 충돌 체크
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // 자신과 충돌 체크
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // 음식 먹었는지 체크
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
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

    render() {
        // 배경 그리기
        this.ctx.fillStyle = '#343a40';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 뱀 그리기
        this.ctx.fillStyle = '#28a745';
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.fillStyle = '#20c997'; // 머리는 다른 색
            } else {
                this.ctx.fillStyle = '#28a745';
            }
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // 음식 그리기
        this.ctx.fillStyle = '#dc3545';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }

    updateScore() {
        document.getElementById('score').textContent = `점수: ${this.score}`;
    }

    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        document.getElementById('snake-start').textContent = '게임 시작';
        document.getElementById('snake-start').disabled = false;
        
        alert(`게임 오버! 최종 점수: ${this.score}`);
    }
}

class TetrisGame {
    constructor() {
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

    start() {
        this.canvas = document.getElementById('tetris-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.resetGame();
        this.bindEvents();
        this.render();
    }

    resetGame() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 1000;
        
        this.updateStats();
        clearInterval(this.gameLoop);
    }

    bindEvents() {
        // 버튼 이벤트
        const startBtn = document.getElementById('tetris-start');
        startBtn.replaceWith(startBtn.cloneNode(true));
        document.getElementById('tetris-start').addEventListener('click', () => {
            this.startGame();
        });

        const pauseBtn = document.getElementById('tetris-pause');
        pauseBtn.replaceWith(pauseBtn.cloneNode(true));
        document.getElementById('tetris-pause').addEventListener('click', () => {
            this.togglePause();
        });

        // 컨트롤 버튼들
        document.getElementById('tetris-left').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.move(-1, 0);
        });

        document.getElementById('tetris-right').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.move(1, 0);
        });

        document.getElementById('tetris-down').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.move(0, 1);
        });

        document.getElementById('tetris-rotate').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.rotate();
        });

        document.getElementById('tetris-drop').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) this.hardDrop();
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('tetris').classList.contains('active')) {
                this.handleKeyPress(e);
            }
        });
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
        this.resetGame();
        this.gameRunning = true;
        
        this.spawnPiece();
        this.spawnNextPiece();
        
        document.getElementById('tetris-start').textContent = '재시작';
        
        this.gameLoop = setInterval(() => {
            if (!this.gamePaused) {
                this.drop();
            }
        }, this.dropTime);
    }

    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('tetris-pause').textContent = this.gamePaused ? '재개' : '일시정지';
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
            this.render();
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
            this.render();
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
            
            // 보너스 점수
            if (linesCleared === 4) {
                this.score += 400 * this.level; // 테트리스 보너스
            }
            
            // 레벨업
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

    render() {
        // 보드 클리어
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자선 그리기
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
        
        // 하이라이트
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
        
        // 하이라이트
        this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.nextCtx.fillRect(
            x * size + 1,
            y * size + 1,
            size - 2,
            4
        );
    }

    updateStats() {
        document.getElementById('tetris-score').textContent = `점수: ${this.score}`;
        document.getElementById('tetris-level').textContent = `레벨: ${this.level}`;
        document.getElementById('tetris-lines').textContent = `줄: ${this.lines}`;
    }

    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        alert(`게임 오버!\n최종 점수: ${this.score}\n레벨: ${this.level}\n클리어한 줄: ${this.lines}`);
        
        document.getElementById('tetris-start').textContent = '게임 시작';
        document.getElementById('tetris-pause').textContent = '일시정지';
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new FluxGame();
});