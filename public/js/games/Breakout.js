import { BaseGame } from '../core/BaseGame.js';

export class Breakout extends BaseGame {
    constructor() {
        super('breakout', '브레이크아웃', '패들로 공을 튕겨 모든 벽돌을 깨세요');
        
        this.canvas = null;
        this.ctx = null;
        
        // 게임 설정
        this.canvasWidth = 480;
        this.canvasHeight = 320;
        
        // 패들
        this.paddleHeight = 10;
        this.paddleWidth = 75;
        this.paddleX = 0;
        
        // 공
        this.ballRadius = 8;
        this.x = 0;
        this.y = 0;
        this.dx = 2;
        this.dy = -2;
        
        // 벽돌
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 50;
        this.brickHeight = 20;
        this.brickPadding = 5;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 35;
        this.bricks = [];
        
        // 게임 상태
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gameOver = false;
        this.gameWon = false;
        this.animationId = null;
        
        // 컨트롤
        this.rightPressed = false;
        this.leftPressed = false;
    }

    init() {
        this.paddleX = (this.canvasWidth - this.paddleWidth) / 2;
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight - 30;
        this.dx = 3;
        this.dy = -3;
        
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gameOver = false;
        this.gameWon = false;
        
        // 벽돌 초기화
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                this.bricks[c][r] = { 
                    x: 0, 
                    y: 0, 
                    status: 1,
                    color: this.getBrickColor(r)
                };
            }
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="breakout-wrapper">
                <div class="breakout-header">
                    <div class="game-stats">
                        <span>점수: <span id="breakout-score">0</span></span>
                        <span>생명: <span id="breakout-lives">❤️❤️❤️</span></span>
                    </div>
                    <button class="btn-primary" id="breakout-start-btn">게임 시작</button>
                </div>
                <canvas id="breakout-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
                <div class="breakout-controls">
                    <button class="control-btn" id="left-btn">◀ 왼쪽</button>
                    <button class="control-btn" id="right-btn">오른쪽 ▶</button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('breakout-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('breakout-score');
        this.livesElement = document.getElementById('breakout-lives');
        
        this.bindEvents();
        this.draw();
    }

    bindEvents() {
        // 시작 버튼
        document.getElementById('breakout-start-btn').addEventListener('click', () => {
            if (!this.gameRunning && !this.gameOver) {
                this.startGame();
            } else {
                this.init();
                this.updateDisplay();
                this.draw();
            }
        });
        
        // 키보드 컨트롤
        this.keyDownHandler = (e) => {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                this.rightPressed = true;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                this.leftPressed = true;
            }
        };
        
        this.keyUpHandler = (e) => {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                this.rightPressed = false;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                this.leftPressed = false;
            }
        };
        
        // 마우스 컨트롤
        this.mouseMoveHandler = (e) => {
            const relativeX = e.clientX - this.canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < this.canvasWidth) {
                this.paddleX = relativeX - this.paddleWidth / 2;
            }
        };
        
        // 터치 컨트롤 (모바일)
        this.touchMoveHandler = (e) => {
            const touch = e.touches[0];
            const relativeX = touch.clientX - this.canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < this.canvasWidth) {
                this.paddleX = relativeX - this.paddleWidth / 2;
            }
        };
        
        // 버튼 컨트롤
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        
        leftBtn.addEventListener('touchstart', () => this.leftPressed = true);
        leftBtn.addEventListener('touchend', () => this.leftPressed = false);
        leftBtn.addEventListener('mousedown', () => this.leftPressed = true);
        leftBtn.addEventListener('mouseup', () => this.leftPressed = false);
        
        rightBtn.addEventListener('touchstart', () => this.rightPressed = true);
        rightBtn.addEventListener('touchend', () => this.rightPressed = false);
        rightBtn.addEventListener('mousedown', () => this.rightPressed = true);
        rightBtn.addEventListener('mouseup', () => this.rightPressed = false);
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        document.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('touchmove', this.touchMoveHandler);
    }

    getBrickColor(row) {
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
        return colors[row % colors.length];
    }

    startGame() {
        this.gameRunning = true;
        document.getElementById('breakout-start-btn').textContent = '재시작';
        this.gameLoop();
    }

    gameLoop() {
        this.draw();
        
        if (!this.gameOver && this.gameRunning) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 배경
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.drawBricks();
        this.drawBall();
        this.drawPaddle();
        
        if (this.gameRunning) {
            this.collisionDetection();
            this.updateBallPosition();
            this.updatePaddlePosition();
        }
        
        if (this.gameWon) {
            this.showMessage('승리! 모든 벽돌을 깼습니다!');
        } else if (this.gameOver) {
            this.showMessage('게임 오버!');
        }
    }

    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;
                    
                    this.ctx.fillStyle = this.bricks[c][r].color;
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);
                    
                    // 하이라이트
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, 4);
                }
            }
        }
    }

    drawBall() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.closePath();
    }

    drawPaddle() {
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(this.paddleX, this.canvasHeight - this.paddleHeight - 10, this.paddleWidth, this.paddleHeight);
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(this.paddleX, this.canvasHeight - this.paddleHeight - 10, this.paddleWidth, 3);
    }

    collisionDetection() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1) {
                    if (this.x + this.ballRadius > b.x && 
                        this.x - this.ballRadius < b.x + this.brickWidth && 
                        this.y + this.ballRadius > b.y && 
                        this.y - this.ballRadius < b.y + this.brickHeight) {
                        this.dy = -this.dy;
                        b.status = 0;
                        this.score += 10;
                        this.updateDisplay();
                        
                        // 모든 벽돌을 깼는지 확인
                        if (this.checkWin()) {
                            this.gameWon = true;
                            this.gameRunning = false;
                        }
                    }
                }
            }
        }
    }

    updateBallPosition() {
        // 좌우 벽 충돌
        if (this.x + this.dx > this.canvasWidth - this.ballRadius || this.x + this.dx < this.ballRadius) {
            this.dx = -this.dx;
        }
        
        // 상단 벽 충돌
        if (this.y + this.dy < this.ballRadius) {
            this.dy = -this.dy;
        } else if (this.y + this.dy > this.canvasHeight - this.ballRadius - 10) {
            // 패들 충돌 체크
            if (this.x > this.paddleX && this.x < this.paddleX + this.paddleWidth) {
                // 패들의 어느 부분에 맞았는지에 따라 각도 조정
                const hitPos = (this.x - this.paddleX) / this.paddleWidth;
                this.dx = 6 * (hitPos - 0.5);
                this.dy = -this.dy;
            } else {
                // 공을 놓침
                this.lives--;
                this.updateDisplay();
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                    this.gameRunning = false;
                } else {
                    // 리스폰
                    this.x = this.canvasWidth / 2;
                    this.y = this.canvasHeight - 30;
                    this.dx = 3;
                    this.dy = -3;
                    this.paddleX = (this.canvasWidth - this.paddleWidth) / 2;
                }
            }
        }
        
        this.x += this.dx;
        this.y += this.dy;
    }

    updatePaddlePosition() {
        if (this.rightPressed) {
            this.paddleX += 7;
            if (this.paddleX + this.paddleWidth > this.canvasWidth) {
                this.paddleX = this.canvasWidth - this.paddleWidth;
            }
        } else if (this.leftPressed) {
            this.paddleX -= 7;
            if (this.paddleX < 0) {
                this.paddleX = 0;
            }
        }
    }

    checkWin() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    return false;
                }
            }
        }
        return true;
    }

    showMessage(text) {
        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.canvasWidth / 2, this.canvasHeight / 2);
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = '❤️'.repeat(this.lives);
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        if (this.canvas) {
            this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        }
    }
}