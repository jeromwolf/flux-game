import { BaseGame } from '../core/BaseGame.js';

export class TicTacToe extends BaseGame {
    constructor() {
        super('tictactoe', '틱택토', '3x3 격자에서 한 줄을 먼저 만드세요');
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
    }

    init() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
    }

    render() {
        // 기존 HTML 구조 재사용
        const existingBoard = document.querySelector('.tictactoe-board');
        const existingInfo = document.getElementById('current-player');
        const existingResult = document.getElementById('game-result');
        
        if (existingBoard) {
            this.bindEvents();
            this.updateDisplay();
            this.hideResult();
            return;
        }
        
        // 새로운 구조가 필요한 경우
        this.container.innerHTML = `
            <div class="tictactoe-game">
                <div class="game-info">
                    <span id="current-player">현재 플레이어: X</span>
                </div>
                <div class="tictactoe-board">
                    ${Array(9).fill('').map((_, i) => 
                        `<div class="cell" data-index="${i}"></div>`
                    ).join('')}
                </div>
                <div id="game-result" class="game-result hidden">
                    <h3 id="result-text"></h3>
                    <button id="restart-game" class="btn-primary">다시 하기</button>
                </div>
            </div>
        `;
        
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.replaceWith(cell.cloneNode(true));
        });
        
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.addEventListener('click', () => {
                if (!this.gameOver && this.board[index] === '') {
                    this.makeMove(index);
                }
            });
        });

        const restartBtn = document.getElementById('restart-game');
        if (restartBtn) {
            restartBtn.replaceWith(restartBtn.cloneNode(true));
            document.getElementById('restart-game').addEventListener('click', () => {
                this.init();
                this.updateDisplay();
                this.hideResult();
            });
        }
    }

    makeMove(index) {
        this.board[index] = this.currentPlayer;
        this.updateDisplay();

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
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[b] === this.board[c];
        });
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.textContent = this.board[index];
            cell.className = 'cell';
            if (this.board[index]) {
                cell.classList.add(this.board[index].toLowerCase());
            }
        });
    }

    updateCurrentPlayer() {
        const element = document.getElementById('current-player');
        if (element) {
            element.textContent = `현재 플레이어: ${this.currentPlayer}`;
        }
    }

    showResult(message) {
        const resultText = document.getElementById('result-text');
        const gameResult = document.getElementById('game-result');
        
        if (resultText && gameResult) {
            resultText.textContent = message;
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
}