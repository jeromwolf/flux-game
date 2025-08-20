import { BaseGame } from '../core/BaseGame.js';

export class Snake extends BaseGame {
    constructor() {
        super('snake', '스네이크', '뱀을 조종해서 먹이를 먹고 성장시키세요');
        
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

    init() {
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    render() {
        // 기존 캔버스 재사용
        const existingCanvas = document.getElementById('snake-canvas');
        if (existingCanvas) {
            this.canvas = existingCanvas;
            this.ctx = this.canvas.getContext('2d');
            this.bindEvents();
            this.draw();
            this.updateScore();
            return;
        }
        
        // 새로운 구조가 필요한 경우
        this.container.innerHTML = `
            <div class="snake-game">
                <div class="game-controls">
                    <button id="snake-start" class="btn-primary">게임 시작</button>
                    <span id="score">점수: 0</span>
                </div>
                <canvas id="snake-canvas" width="400" height="400"></canvas>
                <div class="snake-controls">
                    <button id="up">↑</button>
                    <div class="snake-move-buttons">
                        <button id="left">←</button>
                        <button id="down">↓</button>
                        <button id="right">→</button>
                    </div>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.bindEvents();
        this.draw();
        this.updateScore();
    }

    bindEvents() {
        // 시작 버튼
        const startBtn = document.getElementById('snake-start');
        if (startBtn) {
            startBtn.replaceWith(startBtn.cloneNode(true));
            document.getElementById('snake-start').addEventListener('click', () => {
                this.startGame();
            });
        }

        // 방향 버튼들
        ['up', 'down', 'left', 'right'].forEach(direction => {
            const btn = document.getElementById(direction);
            if (btn) {
                btn.replaceWith(btn.cloneNode(true));
                document.getElementById(direction).addEventListener('click', () => {
                    this.changeDirection(direction);
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

    startGame() {
        if (this.gameRunning) return;
        
        this.init();
        this.gameRunning = true;
        this.dx = 1;
        this.dy = 0;
        
        const startBtn = document.getElementById('snake-start');
        if (startBtn) {
            startBtn.textContent = '게임 중...';
            startBtn.disabled = true;
        }
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 100);
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

    draw() {
        if (!this.ctx) return;
        
        // 배경
        this.ctx.fillStyle = '#343a40';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 뱀 그리기
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#20c997' : '#28a745';
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
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `점수: ${this.score}`;
        }
    }

    gameOver() {
        this.gameRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        const startBtn = document.getElementById('snake-start');
        if (startBtn) {
            startBtn.textContent = '게임 시작';
            startBtn.disabled = false;
        }
        
        alert(`게임 오버! 최종 점수: ${this.score}`);
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