import { BaseGame } from '../core/BaseGame.js';

export class Game2048 extends BaseGame {
    constructor() {
        super('game2048', '2048', '숫자 타일을 합쳐서 2048을 만드세요');
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('2048-best') || 0;
        this.gameOver = false;
        this.won = false;
        this.tiles = [];
    }

    init() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        
        this.addNewTile();
        this.addNewTile();
        
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="game2048-wrapper">
                <div class="game2048-header">
                    <div class="scores">
                        <div class="score-box">
                            <div class="score-label">점수</div>
                            <div class="score-value" id="current-score">0</div>
                        </div>
                        <div class="score-box">
                            <div class="score-label">최고기록</div>
                            <div class="score-value" id="best-score">${this.bestScore}</div>
                        </div>
                    </div>
                    <button class="btn-primary" id="new-game-btn">새 게임</button>
                </div>
                <div class="game2048-board" id="game-board"></div>
                <div class="game-message" id="game-message"></div>
            </div>
        `;
        
        this.boardElement = document.getElementById('game-board');
        this.scoreElement = document.getElementById('current-score');
        this.bestScoreElement = document.getElementById('best-score');
        this.messageElement = document.getElementById('game-message');
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.init();
            this.updateDisplay();
        });
        
        this.updateDisplay();
    }

    bindEvents() {
        // 키보드 이벤트
        this.handleKeyPress = (e) => {
            if (this.gameOver) return;
            
            let moved = false;
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    moved = this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    moved = this.move('right');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    moved = this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    moved = this.move('down');
                    break;
            }
            
            if (moved) {
                this.addNewTile();
                this.updateDisplay();
                this.checkGameStatus();
            }
        };
        
        // 터치 이벤트
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.handleTouchStart = (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
        
        this.handleTouchEnd = (e) => {
            if (this.gameOver) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 30) {
                    if (this.move('right')) {
                        this.addNewTile();
                        this.updateDisplay();
                        this.checkGameStatus();
                    }
                } else if (dx < -30) {
                    if (this.move('left')) {
                        this.addNewTile();
                        this.updateDisplay();
                        this.checkGameStatus();
                    }
                }
            } else {
                if (dy > 30) {
                    if (this.move('down')) {
                        this.addNewTile();
                        this.updateDisplay();
                        this.checkGameStatus();
                    }
                } else if (dy < -30) {
                    if (this.move('up')) {
                        this.addNewTile();
                        this.updateDisplay();
                        this.checkGameStatus();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', this.handleKeyPress);
        this.container.addEventListener('touchstart', this.handleTouchStart);
        this.container.addEventListener('touchend', this.handleTouchEnd);
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    move(direction) {
        const oldBoard = this.board.map(row => [...row]);
        let moved = false;
        
        switch (direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                this.rotateBoard();
                this.rotateBoard();
                moved = this.moveLeft();
                this.rotateBoard();
                this.rotateBoard();
                break;
            case 'up':
                this.rotateBoard();
                this.rotateBoard();
                this.rotateBoard();
                moved = this.moveLeft();
                this.rotateBoard();
                break;
            case 'down':
                this.rotateBoard();
                moved = this.moveLeft();
                this.rotateBoard();
                this.rotateBoard();
                this.rotateBoard();
                break;
        }
        
        return moved;
    }

    moveLeft() {
        let moved = false;
        
        for (let i = 0; i < this.size; i++) {
            const row = this.board[i].filter(val => val !== 0);
            const merged = [];
            
            for (let j = 0; j < row.length; j++) {
                if (j < row.length - 1 && row[j] === row[j + 1]) {
                    merged.push(row[j] * 2);
                    this.score += row[j] * 2;
                    j++;
                } else {
                    merged.push(row[j]);
                }
            }
            
            const newRow = merged.concat(Array(this.size - merged.length).fill(0));
            
            if (newRow.some((val, idx) => val !== this.board[i][idx])) {
                moved = true;
            }
            
            this.board[i] = newRow;
        }
        
        return moved;
    }

    rotateBoard() {
        const rotated = Array(this.size).fill().map(() => Array(this.size).fill(0));
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                rotated[i][j] = this.board[this.size - 1 - j][i];
            }
        }
        this.board = rotated;
    }

    checkGameStatus() {
        // 2048 체크
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 2048 && !this.won) {
                    this.won = true;
                    this.showMessage('승리! 2048을 만들었습니다!', 'win');
                }
            }
        }
        
        // 게임 오버 체크
        if (!this.hasValidMoves()) {
            this.gameOver = true;
            this.showMessage('게임 오버!', 'lose');
        }
        
        // 최고 점수 업데이트
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048-best', this.bestScore);
            this.bestScoreElement.textContent = this.bestScore;
        }
    }

    hasValidMoves() {
        // 빈 칸 체크
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) return true;
            }
        }
        
        // 인접한 같은 숫자 체크
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.board[i][j];
                if ((i < this.size - 1 && current === this.board[i + 1][j]) ||
                    (j < this.size - 1 && current === this.board[i][j + 1])) {
                    return true;
                }
            }
        }
        
        return false;
    }

    updateDisplay() {
        this.boardElement.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                const value = this.board[i][j];
                
                if (value > 0) {
                    tile.textContent = value;
                    tile.classList.add(`tile-${value}`);
                }
                
                this.boardElement.appendChild(tile);
            }
        }
        
        this.scoreElement.textContent = this.score;
    }

    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.className = `game-message ${type}`;
        this.messageElement.style.display = 'block';
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyPress);
        if (this.container) {
            this.container.removeEventListener('touchstart', this.handleTouchStart);
            this.container.removeEventListener('touchend', this.handleTouchEnd);
        }
    }
}