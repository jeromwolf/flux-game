import { BaseGame } from '../../core/BaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class FluxJump extends BaseGame {
    constructor() {
        super('fluxjump', '플럭스 점프');
        this.isActive = false;
    }

    init() {
        // HTML 설정
        this.container.innerHTML = `
            <div class="fluxjump-game">
                <canvas id="fluxjump-canvas"></canvas>
                <div class="fluxjump-start-hint">터치 또는 스페이스바로 점프!</div>
            </div>
        `;
        
        this.canvas = document.getElementById('fluxjump-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 사운드 초기화
        SoundManager.init();
        SoundManager.registerDefaultSounds();
        this.registerGameSounds();
        
        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 게임 상태
        this.player = {
            x: 100,
            y: 300,
            width: 40,
            height: 40,
            velocityY: 0,
            jumpPower: -15,
            gravity: 0.8,
            isJumping: false,
            color: '#4CAF50'
        };
        
        this.obstacles = [];
        this.particles = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('fluxjump-highscore') || 0);
        this.gameSpeed = 5;
        this.obstacleTimer = 0;
        this.isGameOver = false;
        this.isPaused = false;
        
        // 배경 요소
        this.backgrounds = [];
        this.clouds = [];
        this.initBackground();
        
        // 입력 처리
        this.setupControls();
        
        // 게임 활성화
        this.isActive = true;
        
        // 시작 힌트 숨기기
        setTimeout(() => {
            const hint = this.container.querySelector('.fluxjump-start-hint');
            if (hint) hint.style.display = 'none';
        }, 3000);
        
        // 게임 루프 시작
        this.gameLoop();
    }
    
    registerGameSounds() {
        // 점프 사운드
        SoundManager.createSound('jump', {
            frequencies: [200, 400, 300],
            type: 'square',
            duration: 0.2,
            volume: 0.3
        });
        
        // 충돌 사운드
        SoundManager.createSound('crash', {
            frequency: 150,
            type: 'sawtooth',
            duration: 0.5,
            volume: 0.4
        });
        
        // 점수 획득
        SoundManager.createSound('score', {
            frequencies: [800, 1000],
            type: 'sine',
            duration: 0.15,
            volume: 0.3
        });
        
        // 레벨업 사운드
        SoundManager.createSound('levelup', {
            frequencies: [523, 659, 784, 1047],
            type: 'square',
            duration: 0.5,
            volume: 0.4
        });
        
        // 클릭 사운드
        SoundManager.createSound('click', {
            frequency: 600,
            type: 'sine',
            duration: 0.1,
            volume: 0.2
        });
        
        // 성공 사운드
        SoundManager.createSound('success', {
            frequencies: [784, 988, 1175],
            type: 'sine',
            duration: 0.4,
            volume: 0.3
        });
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = Math.min(600, container.clientHeight);
    }
    
    initBackground() {
        // 구름 생성
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 200,
                width: 60 + Math.random() * 40,
                speed: 0.5 + Math.random() * 0.5
            });
        }
        
        // 배경 건물
        for (let i = 0; i < 8; i++) {
            this.backgrounds.push({
                x: i * 100,
                height: 100 + Math.random() * 150,
                width: 80 + Math.random() * 40,
                color: `hsl(220, 20%, ${30 + Math.random() * 20}%)`
            });
        }
    }
    
    setupControls() {
        // 키보드 컨트롤
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.isGameOver) {
                    this.restart();
                } else {
                    this.jump();
                }
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });
        
        // 모바일 터치 컨트롤
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isGameOver) {
                this.restart();
            } else {
                this.jump();
            }
        });
        
        // 마우스 클릭
        this.canvas.addEventListener('click', () => {
            if (this.isGameOver) {
                this.restart();
            } else {
                this.jump();
            }
        });
    }
    
    jump() {
        if (!this.player.isJumping && !this.isPaused) {
            this.player.velocityY = this.player.jumpPower;
            this.player.isJumping = true;
            this.createJumpParticles();
            SoundManager.play('jump');
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * -5,
                life: 1,
                color: this.player.color
            });
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    update() {
        if (this.isGameOver || this.isPaused) return;
        
        // 플레이어 물리
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;
        
        // 바닥 충돌
        const groundY = this.canvas.height - 100;
        if (this.player.y + this.player.height > groundY) {
            this.player.y = groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        // 천장 충돌
        if (this.player.y < 0) {
            this.player.y = 0;
            this.player.velocityY = 0;
        }
        
        // 장애물 생성
        this.obstacleTimer++;
        if (this.obstacleTimer > 60 + Math.random() * 40) {
            this.createObstacle();
            this.obstacleTimer = 0;
        }
        
        // 장애물 업데이트
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= this.gameSpeed;
            
            // 충돌 검사
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return false;
            }
            
            // 점수 획득
            if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
                obstacle.passed = true;
                this.score++;
                this.createScoreParticles(obstacle);
                SoundManager.play('score');
                
                // 난이도 증가
                if (this.score % 10 === 0) {
                    this.gameSpeed += 0.5;
                    SoundManager.play('levelup');
                    this.showLevelUpNotification();
                }
            }
            
            return obstacle.x + obstacle.width > -50;
        });
        
        // 파티클 업데이트
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            particle.life -= 0.02;
            return particle.life > 0;
        });
        
        // 배경 업데이트
        this.updateBackground();
    }
    
    createObstacle() {
        const type = Math.random() > 0.5 ? 'top' : 'bottom';
        const height = 80 + Math.random() * 120;
        
        this.obstacles.push({
            x: this.canvas.width,
            y: type === 'top' ? 0 : this.canvas.height - 100 - height,
            width: 50,
            height: height,
            color: '#E91E63',
            type: type,
            passed: false
        });
    }
    
    createScoreParticles(obstacle) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: obstacle.x + obstacle.width / 2,
                y: obstacle.y + obstacle.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: '#FFD700'
            });
        }
    }
    
    updateBackground() {
        // 구름 이동
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
            }
        });
        
        // 배경 건물 이동
        this.backgrounds.forEach(bg => {
            bg.x -= this.gameSpeed * 0.3;
            if (bg.x + bg.width < 0) {
                bg.x = this.canvas.width;
                bg.height = 100 + Math.random() * 150;
            }
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    gameOver() {
        this.isGameOver = true;
        SoundManager.play('crash');
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fluxjump-highscore', this.highScore);
            SoundManager.play('success');
        }
    }
    
    restart() {
        this.player.y = 300;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.obstacles = [];
        this.particles = [];
        this.score = 0;
        this.gameSpeed = 5;
        this.obstacleTimer = 0;
        this.isGameOver = false;
        this.isPaused = false;
        SoundManager.play('click');
    }
    
    render() {
        // 배경 그리기
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 구름 그리기
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width / 2, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.3, cloud.y, cloud.width * 0.4, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.width * 0.3, cloud.y, cloud.width * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 배경 건물
        this.backgrounds.forEach(bg => {
            this.ctx.fillStyle = bg.color;
            this.ctx.fillRect(bg.x, this.canvas.height - 100 - bg.height, bg.width, bg.height);
        });
        
        // 바닥
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // 파티클
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 3, particle.y - 3, 6, 6);
        });
        this.ctx.globalAlpha = 1;
        
        // 플레이어
        this.ctx.save();
        this.ctx.fillStyle = this.player.color;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.restore();
        
        // 플레이어 눈
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.player.x + 25, this.player.y + 10, 10, 10);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.player.x + 30, this.player.y + 12, 5, 5);
        
        // 장애물
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            this.ctx.fillStyle = obstacle.color;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 3;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 장애물 패턴
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < obstacle.width; i += 10) {
                this.ctx.fillRect(obstacle.x + i, obstacle.y, 2, obstacle.height);
            }
            this.ctx.restore();
        });
        
        // UI
        this.ctx.fillStyle = 'white';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.font = 'bold 30px Arial';
        this.ctx.fillText(`점수: ${this.score}`, 20, 40);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`최고기록: ${this.highScore}`, 20, 70);
        this.ctx.shadowBlur = 0;
        
        // 일시정지 표시
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('일시정지', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('P키를 눌러 계속하기', this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.textAlign = 'left';
        }
        
        // 게임 오버
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('게임 오버!', this.canvas.width / 2, this.canvas.height / 2 - 40);
            this.ctx.font = '30px Arial';
            this.ctx.fillText(`점수: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('클릭하여 다시 시작', this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.textAlign = 'left';
        }
    }
    
    gameLoop() {
        if (!this.isActive) return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'levelup-notification';
        notification.textContent = `레벨 업! 속도 증가 🚀`;
        this.canvas.parentElement.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    cleanup() {
        this.isActive = false;
    }
}