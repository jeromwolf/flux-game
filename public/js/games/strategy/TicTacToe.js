import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class TicTacToe extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'tictactoe',
            name: '틱택토',
            description: '3x3 격자에서 한 줄을 먼저 만드세요',
            category: 'strategy',
            difficulty: 'easy',
            hasAds: true,
            adPlacements: ['start', 'gameover']
        });
        
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winningLine = [];
        this.playerScore = 0;
        this.aiScore = 0;
        this.draws = 0;
        this.isAIMode = true;
        this.aiDifficulty = 'medium';
    }

    init() {
        super.init();
        
        // 사운드 초기화
        SoundManager.init();
        SoundManager.registerDefaultSounds();
        this.registerGameSounds();
        
        // 게임 초기화
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winningLine = [];
        
        this.setupUI();
    }
    
    registerGameSounds() {
        // 돌 놓기 사운드
        SoundManager.createSound('place', {
            frequency: 600,
            type: 'sine',
            duration: 0.15,
            volume: 0.3
        });
        
        // AI 턴 사운드
        SoundManager.createSound('ai-think', {
            frequencies: [400, 450, 500],
            type: 'square',
            duration: 0.3,
            volume: 0.2
        });
        
        // 승리 사운드
        SoundManager.createSound('win', {
            frequencies: [523, 659, 784],
            type: 'sine',
            duration: 0.5,
            volume: 0.4
        });
        
        // 무승부 사운드
        SoundManager.createSound('draw', {
            frequencies: [400, 350, 300],
            type: 'sine',
            duration: 0.4,
            volume: 0.3
        });
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="tictactoe-game">
                <div class="game-header">
                    <div class="game-mode">
                        <button id="mode-friend" class="mode-btn ${!this.isAIMode ? 'active' : ''}">
                            👥 친구와 플레이
                        </button>
                        <button id="mode-ai" class="mode-btn ${this.isAIMode ? 'active' : ''}">
                            🤖 AI와 플레이
                        </button>
                    </div>
                    <div class="difficulty-selector ${!this.isAIMode ? 'hidden' : ''}">
                        <button data-difficulty="easy" class="difficulty-btn ${this.aiDifficulty === 'easy' ? 'active' : ''}">쉬움</button>
                        <button data-difficulty="medium" class="difficulty-btn ${this.aiDifficulty === 'medium' ? 'active' : ''}">보통</button>
                        <button data-difficulty="hard" class="difficulty-btn ${this.aiDifficulty === 'hard' ? 'active' : ''}">어려움</button>
                    </div>
                </div>
                
                <div class="game-scores">
                    <div class="score-item">
                        <span class="score-label">${this.isAIMode ? '플레이어' : 'X'}</span>
                        <span class="score-value" id="player-score">${this.playerScore}</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">무승부</span>
                        <span class="score-value" id="draw-score">${this.draws}</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">${this.isAIMode ? 'AI' : 'O'}</span>
                        <span class="score-value" id="ai-score">${this.aiScore}</span>
                    </div>
                </div>
                
                <div class="game-info">
                    <span id="current-player" class="current-player">
                        ${this.isAIMode ? '당신의 차례입니다' : '현재 플레이어: X'}
                    </span>
                </div>
                
                <div class="board-container">
                    <div class="tictactoe-board">
                        ${Array(9).fill('').map((_, i) => 
                            `<div class="cell" data-index="${i}">
                                <div class="cell-content"></div>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                
                <div id="game-result" class="game-result hidden">
                    <div class="result-content">
                        <h3 id="result-text"></h3>
                        <div class="result-actions">
                            <button id="restart-game" class="btn-primary">다시 하기</button>
                            <button id="reset-scores" class="btn-secondary">점수 초기화</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindEvents();
        this.updateDisplay();
        
        // 버튼 사운드 추가
        setTimeout(() => {
            SoundManager.addButtonSounds(this.container);
        }, 100);
    }

    bindEvents() {
        // 셀 클릭
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.addEventListener('click', () => {
                if (!this.gameOver && this.board[index] === '') {
                    if (!this.isAIMode || this.currentPlayer === 'X') {
                        this.makeMove(index);
                    }
                }
            });
        });

        // 다시하기 버튼
        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 점수 초기화
        document.getElementById('reset-scores').addEventListener('click', () => {
            this.playerScore = 0;
            this.aiScore = 0;
            this.draws = 0;
            this.updateScores();
            this.restartGame();
        });
        
        // 게임 모드 변경
        document.getElementById('mode-friend').addEventListener('click', () => {
            this.isAIMode = false;
            this.updateGameMode();
            this.restartGame();
        });
        
        document.getElementById('mode-ai').addEventListener('click', () => {
            this.isAIMode = true;
            this.updateGameMode();
            this.restartGame();
        });
        
        // 난이도 변경
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.aiDifficulty = btn.dataset.difficulty;
                this.updateDifficulty();
            });
        });
    }
    
    updateGameMode() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (this.isAIMode) {
            document.getElementById('mode-ai').classList.add('active');
            document.querySelector('.difficulty-selector').classList.remove('hidden');
        } else {
            document.getElementById('mode-friend').classList.add('active');
            document.querySelector('.difficulty-selector').classList.add('hidden');
        }
        
        // 점수 라벨 업데이트
        const labels = document.querySelectorAll('.score-label');
        labels[0].textContent = this.isAIMode ? '플레이어' : 'X';
        labels[2].textContent = this.isAIMode ? 'AI' : 'O';
    }
    
    updateDifficulty() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${this.aiDifficulty}"]`).classList.add('active');
    }

    makeMove(index) {
        this.board[index] = this.currentPlayer;
        SoundManager.play('place');
        this.updateDisplay();
        this.animateMove(index);

        if (this.checkWinner()) {
            this.gameOver = true;
            this.handleWin();
        } else if (this.board.every(cell => cell !== '')) {
            this.gameOver = true;
            this.handleDraw();
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateCurrentPlayer();
            
            // AI 턴
            if (this.isAIMode && this.currentPlayer === 'O') {
                setTimeout(() => {
                    this.makeAIMove();
                }, 500);
            }
        }
    }
    
    makeAIMove() {
        SoundManager.play('ai-think');
        let move;
        
        switch (this.aiDifficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = Math.random() < 0.7 ? this.getBestMove() : this.getRandomMove();
                break;
            case 'hard':
                move = this.getBestMove();
                break;
        }
        
        if (move !== -1) {
            this.makeMove(move);
        }
    }
    
    getRandomMove() {
        const availableMoves = [];
        this.board.forEach((cell, index) => {
            if (cell === '') availableMoves.push(index);
        });
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    
    getBestMove() {
        // Minimax 알고리즘 간단 버전
        let bestScore = -Infinity;
        let bestMove = -1;
        
        this.board.forEach((cell, index) => {
            if (cell === '') {
                this.board[index] = 'O';
                const score = this.minimax(this.board, 0, false);
                this.board[index] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = index;
                }
            }
        });
        
        return bestMove;
    }
    
    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinnerForBoard(board);
        
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (board.every(cell => cell !== '')) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            board.forEach((cell, index) => {
                if (cell === '') {
                    board[index] = 'O';
                    const score = this.minimax(board, depth + 1, false);
                    board[index] = '';
                    bestScore = Math.max(score, bestScore);
                }
            });
            return bestScore;
        } else {
            let bestScore = Infinity;
            board.forEach((cell, index) => {
                if (cell === '') {
                    board[index] = 'X';
                    const score = this.minimax(board, depth + 1, true);
                    board[index] = '';
                    bestScore = Math.min(score, bestScore);
                }
            });
            return bestScore;
        }
    }
    
    checkWinnerForBoard(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[b] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[b] === this.board[c]) {
                this.winningLine = pattern;
                return true;
            }
        }
        return false;
    }
    
    handleWin() {
        const winner = this.currentPlayer;
        
        if (this.isAIMode) {
            if (winner === 'X') {
                this.playerScore++;
                this.showResult('🎉 승리했습니다!', 'win');
            } else {
                this.aiScore++;
                this.showResult('😢 AI가 승리했습니다', 'lose');
            }
        } else {
            if (winner === 'X') {
                this.playerScore++;
            } else {
                this.aiScore++;
            }
            this.showResult(`🎉 ${winner}가 승리했습니다!`, 'win');
        }
        
        SoundManager.play('win');
        this.updateScores();
        this.highlightWinningLine();
    }
    
    handleDraw() {
        this.draws++;
        this.showResult('🤝 무승부입니다!', 'draw');
        SoundManager.play('draw');
        this.updateScores();
    }
    
    highlightWinningLine() {
        const cells = document.querySelectorAll('.cell');
        this.winningLine.forEach(index => {
            cells[index].classList.add('winning-cell');
        });
    }
    
    animateMove(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.classList.add('move-animation');
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const content = cell.querySelector('.cell-content');
            content.textContent = this.board[index];
            cell.className = 'cell';
            if (this.board[index]) {
                cell.classList.add(this.board[index].toLowerCase());
                cell.classList.add('filled');
            }
        });
    }

    updateCurrentPlayer() {
        const element = document.getElementById('current-player');
        if (element) {
            if (this.isAIMode) {
                element.textContent = this.currentPlayer === 'X' ? '당신의 차례입니다' : 'AI가 생각 중...';
            } else {
                element.textContent = `현재 플레이어: ${this.currentPlayer}`;
            }
        }
    }
    
    updateScores() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('ai-score').textContent = this.aiScore;
        document.getElementById('draw-score').textContent = this.draws;
    }

    showResult(message, type) {
        const resultText = document.getElementById('result-text');
        const gameResult = document.getElementById('game-result');
        
        if (resultText && gameResult) {
            resultText.textContent = message;
            gameResult.className = `game-result ${type}`;
            gameResult.classList.remove('hidden');
        }
    }

    hideResult() {
        const gameResult = document.getElementById('game-result');
        if (gameResult) {
            gameResult.classList.add('hidden');
        }
        this.updateCurrentPlayer();
    }
    
    restartGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winningLine = [];
        this.updateDisplay();
        this.hideResult();
        
        // 애니메이션 클래스 제거
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('winning-cell', 'move-animation');
        });
        
        SoundManager.play('click');
    }
    
    cleanup() {
        super.cleanup();
    }
}