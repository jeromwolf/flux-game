import { BaseGame } from '../core/BaseGame.js';

export class Minesweeper extends BaseGame {
    constructor() {
        super('minesweeper', '지뢰찾기', '숨겨진 지뢰를 피해 모든 안전한 칸을 찾으세요');
        
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.minesLeft = 0;
        this.timer = 0;
        this.timerInterval = null;
    }

    init() {
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        this.minesLeft = this.totalMines;
        
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="minesweeper-wrapper">
                <div class="minesweeper-header">
                    <div class="mines-counter">💣 <span id="mines-count">${this.minesLeft}</span></div>
                    <button class="btn-primary" id="new-game-btn">😊</button>
                    <div class="timer">⏱️ <span id="timer">0</span></div>
                </div>
                
                <div class="difficulty-selector">
                    <button class="diff-btn ${this.currentDifficulty === 'easy' ? 'active' : ''}" data-level="easy">초급</button>
                    <button class="diff-btn ${this.currentDifficulty === 'medium' ? 'active' : ''}" data-level="medium">중급</button>
                    <button class="diff-btn ${this.currentDifficulty === 'hard' ? 'active' : ''}" data-level="hard">고급</button>
                </div>
                
                <div class="minesweeper-board" id="mines-board"></div>
            </div>
        `;
        
        this.boardElement = document.getElementById('mines-board');
        this.minesCountElement = document.getElementById('mines-count');
        this.timerElement = document.getElementById('timer');
        this.newGameBtn = document.getElementById('new-game-btn');
        
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        // 새 게임 버튼
        this.newGameBtn.addEventListener('click', () => {
            this.init();
            this.updateDisplay();
            this.newGameBtn.textContent = '😊';
        });
        
        // 난이도 선택
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentDifficulty = e.target.dataset.level;
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.init();
                this.updateDisplay();
            });
        });
        
        // 보드 이벤트
        this.boardElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleClick(row, col);
            }
        });
        
        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleRightClick(row, col);
            }
        });
    }

    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (this.board[row][col] !== -1 && !(row === excludeRow && col === excludeCol)) {
                this.board[row][col] = -1;
                minesPlaced++;
                
                // 주변 칸 숫자 증가
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        
                        if (newRow >= 0 && newRow < this.rows && 
                            newCol >= 0 && newCol < this.cols && 
                            this.board[newRow][newCol] !== -1) {
                            this.board[newRow][newCol]++;
                        }
                    }
                }
            }
        }
    }

    handleClick(row, col) {
        if (this.revealed[row][col] || this.flagged[row][col]) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        this.reveal(row, col);
        this.checkWin();
        this.updateDisplay();
    }

    handleRightClick(row, col) {
        if (this.revealed[row][col] || this.firstClick) return;
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.minesLeft = this.totalMines - this.flagged.flat().filter(f => f).length;
        this.minesCountElement.textContent = this.minesLeft;
        this.updateDisplay();
    }

    reveal(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        if (this.revealed[row][col] || this.flagged[row][col]) return;
        
        this.revealed[row][col] = true;
        
        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.newGameBtn.textContent = '😵';
            this.revealAll();
            this.stopTimer();
            return;
        }
        
        if (this.board[row][col] === 0) {
            // 빈 칸이면 주변 칸도 열기
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    this.reveal(row + dr, col + dc);
                }
            }
        }
    }

    revealAll() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.revealed[i][j] = true;
            }
        }
    }

    checkWin() {
        let revealedCount = 0;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.revealed[i][j]) revealedCount++;
            }
        }
        
        if (revealedCount === this.rows * this.cols - this.totalMines) {
            this.gameWon = true;
            this.gameOver = true;
            this.newGameBtn.textContent = '😎';
            this.stopTimer();
            
            // 모든 지뢰에 깃발 표시
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    if (this.board[i][j] === -1) {
                        this.flagged[i][j] = true;
                    }
                }
            }
            this.minesLeft = 0;
            this.minesCountElement.textContent = this.minesLeft;
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateDisplay() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (this.revealed[i][j]) {
                    cell.classList.add('revealed');
                    if (this.board[i][j] === -1) {
                        cell.innerHTML = '💣';
                        if (!this.gameWon) {
                            cell.classList.add('mine');
                        }
                    } else if (this.board[i][j] > 0) {
                        cell.textContent = this.board[i][j];
                        cell.classList.add(`number-${this.board[i][j]}`);
                    }
                } else if (this.flagged[i][j]) {
                    cell.innerHTML = '🚩';
                    cell.classList.add('flagged');
                }
                
                this.boardElement.appendChild(cell);
            }
        }
    }

    cleanup() {
        this.stopTimer();
    }
}