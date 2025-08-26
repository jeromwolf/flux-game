export default class SeoulRunner {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
  // 게임 상태
  private isRunning: boolean = false;
  private gameOver: boolean = false;
  private score: number = 0;
  private distance: number = 0;
  private speed: number = 3;
  private baseSpeed: number = 3;
  private maxSpeed: number = 8;
  private lives: number = 3;
  private invulnerable: boolean = false;
  private invulnerableTime: number = 0;
  
  // 플레이어
  private player = {
    x: 100,
    y: 0,
    width: 40,
    height: 60,
    jumping: false,
    jumpVelocity: 0,
    jumpPower: 13,
    gravity: 0.6,
    sliding: false,
    slideTime: 0,
    maxSlideTime: 30
  };
  
  // 지형
  private groundY: number = 0;
  private obstacles: any[] = [];
  private collectibles: any[] = [];
  private buildings: any[] = [];
  private particles: any[] = [];
  
  // 서울 테마 아이템
  private COLLECTIBLES = [
    { type: 'kimchi', emoji: '🥬', points: 100, name: '김치' },
    { type: 'kpop', emoji: '🎵', points: 200, name: 'K-POP' },
    { type: 'hanbok', emoji: '👘', points: 150, name: '한복' },
    { type: 'soju', emoji: '🍶', points: 120, name: '소주' },
    { type: 'namsan', emoji: '🗼', points: 300, name: '남산타워' }
  ];
  
  // 장애물 타입
  private OBSTACLES = [
    { type: 'taxi', width: 80, height: 40, color: '#FFA500', emoji: '🚕' },
    { type: 'subway', width: 60, height: 50, color: '#4CAF50', emoji: '🚇' },
    { type: 'scooter', width: 40, height: 35, color: '#2196F3', emoji: '🛵' },
    { type: 'construction', width: 50, height: 60, color: '#FF5722', emoji: '🚧' }
  ];
  
  // 배경 건물 - 한국의 랜드마크
  private BUILDINGS = [
    { name: '63빌딩', width: 60, height: 200, color: '#1976D2', type: 'building' },
    { name: '롯데타워', width: 50, height: 250, color: '#37474F', type: 'building' },
    { name: 'N서울타워', width: 40, height: 180, color: '#F44336', type: 'tower' },
    { name: '광화문', width: 120, height: 80, color: '#8D6E63', type: 'palace' },
    { name: '청와대', width: 100, height: 60, color: '#2E7D32', type: 'palace' },
    { name: '경복궁', width: 150, height: 90, color: '#795548', type: 'palace' },
    { name: '동대문', width: 80, height: 100, color: '#FF6F61', type: 'gate' },
    { name: '남대문', width: 80, height: 90, color: '#8B4513', type: 'gate' },
    { name: '명동성당', width: 60, height: 120, color: '#607D8B', type: 'church' },
    { name: '북한산', width: 200, height: 150, color: '#4CAF50', type: 'mountain' }
  ];
  
  // 컨트롤
  private keys: { [key: string]: boolean } = {};
  private touchStartY: number = 0;
  
  constructor() {}
  
  mount(container: HTMLElement): void {
    this.container = container;
    this.initializeGame();
  }
  
  unmount(): void {
    this.cleanup();
  }
  
  private initializeGame(): void {
    if (!this.container) return;
    
    // HTML 구조
    this.container.innerHTML = `
      <div style="width: 100%; height: 600px; position: relative; background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #C8E6C9 100%); overflow: hidden;">
        <!-- 상단 UI -->
        <div style="position: absolute; top: 0; left: 0; right: 0; z-index: 10; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 20px;">
              <div style="background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 20px; font-weight: bold; color: white; border: 2px solid rgba(255,255,255,0.3);">
                Score: <span id="score" style="color: #FFD700;">0</span>
              </div>
              <div style="background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 20px; color: white; border: 2px solid rgba(255,255,255,0.3);">
                Distance: <span id="distance" style="color: #00E5FF;">0</span>m
              </div>
              <div style="background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 20px; color: white; border: 2px solid rgba(255,255,255,0.3);">
                Lives: <span id="lives" style="color: #FF6B6B;">❤️❤️❤️</span>
              </div>
            </div>
            <div style="display: flex; gap: 20px;">
              <div id="season" style="background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 20px; color: white; font-weight: bold;">
                🌸 Spring
              </div>
              <div id="combo" style="background: rgba(76,175,80,0.9); padding: 10px 20px; border-radius: 20px; color: white; font-weight: bold; display: none;">
                Combo x<span id="combo-count">1</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 게임 캔버스 -->
        <canvas id="game-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
        
        <!-- 컨트롤 힌트 -->
        <div id="controls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); text-align: center; background: rgba(0,0,0,0.9); color: white; padding: 20px 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: none;">
          <div style="font-size: 18px; font-weight: bold; color: #ffffff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Space/Up: Jump | Down: Slide</div>
          <div style="font-size: 16px; margin-top: 8px; color: #ffeb3b;">Mobile: Swipe Up to Jump | Swipe Down to Slide</div>
        </div>
        
        <!-- 시작 화면 -->
        <div id="start-screen" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 20;">
          <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px;">
            <h1 style="color: #F44336; font-size: 48px; margin: 0 0 20px 0;">🏃 Seoul Runner</h1>
            <p style="font-size: 18px; color: #666; margin-bottom: 20px;">
              Run through the streets of Seoul and collect Korean cultural items!
            </p>
            <div style="text-align: left; margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 10px; border: 1px solid #ddd;">
              <div style="margin-bottom: 10px; color: #333; font-size: 16px;">🥬 Kimchi - 100 points</div>
              <div style="margin-bottom: 10px; color: #333; font-size: 16px;">🎵 K-POP - 200 points</div>
              <div style="margin-bottom: 10px; color: #333; font-size: 16px;">👘 Hanbok - 150 points</div>
              <div style="margin-bottom: 10px; color: #333; font-size: 16px;">🍶 Soju - 120 points</div>
              <div style="margin-bottom: 10px; color: #333; font-size: 16px;">🗼 Namsan Tower - 300 points</div>
            </div>
            <button id="start-btn" style="padding: 15px 40px; font-size: 24px; background: #F44336; color: white; border: none; border-radius: 30px; cursor: pointer;">
              Start Game
            </button>
          </div>
        </div>
        
        <!-- 게임 오버 화면 -->
        <div id="game-over" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: none; align-items: center; justify-content: center; z-index: 20;">
          <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="color: #F44336; font-size: 36px; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">Game Over!</h2>
            <div style="font-size: 24px; margin-bottom: 10px; color: #333;">
              Final Score: <span id="final-score" style="color: #F44336; font-weight: bold;">0</span>
            </div>
            <div style="font-size: 18px; color: #333; margin-bottom: 30px; font-weight: 500;">
              Distance: <span id="final-distance" style="color: #2196F3; font-weight: bold;">0</span>m
            </div>
            <button id="restart-btn" style="padding: 15px 30px; font-size: 20px; background: #F44336; color: white; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 10px rgba(244,67,54,0.3); transition: all 0.3s;">
              Try Again
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 캔버스 초기화
    this.canvas = this.container.querySelector('#game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      // 컨테이너 크기 직접 설정
      this.canvas.width = this.container.clientWidth || 800;
      this.canvas.height = 600;
      this.ctx = this.canvas.getContext('2d');
      
      this.groundY = this.canvas.height - 100;
      this.player.y = this.groundY - this.player.height;
      
      console.log('Canvas initialized:', {
        width: this.canvas.width,
        height: this.canvas.height,
        groundY: this.groundY,
        playerY: this.player.y
      });
    }
    
    this.setupControls();
    this.initializeBuildings();
  }
  
  private setupControls(): void {
    // 시작 버튼
    const startBtn = this.container?.querySelector('#start-btn');
    startBtn?.addEventListener('click', () => {
      const startScreen = this.container?.querySelector('#start-screen') as HTMLElement;
      if (startScreen) startScreen.style.display = 'none';
      
      const controls = this.container?.querySelector('#controls') as HTMLElement;
      if (controls) {
        controls.style.display = 'block';
        setTimeout(() => {
          controls.style.display = 'none';
        }, 3000);
      }
      
      this.startGame();
    });
    
    // 재시작 버튼
    const restartBtn = this.container?.querySelector('#restart-btn');
    restartBtn?.addEventListener('click', () => {
      this.resetGame();
      const gameOverScreen = this.container?.querySelector('#game-over') as HTMLElement;
      if (gameOverScreen) gameOverScreen.style.display = 'none';
      this.startGame();
    });
    
    // 키보드 컨트롤
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      
      if ((e.key === ' ' || e.key === 'ArrowUp') && !this.player.jumping && this.isRunning) {
        this.jump();
      }
      if (e.key === 'ArrowDown' && !this.player.sliding && this.isRunning) {
        this.startSlide();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      
      if (e.key === 'ArrowDown') {
        this.endSlide();
      }
    });
    
    // 터치 컨트롤
    this.canvas?.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    });
    
    this.canvas?.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = this.touchStartY - touchEndY;
      
      if (Math.abs(diff) > 30) {
        if (diff > 0 && !this.player.jumping && this.isRunning) {
          // 위로 스와이프 - 점프
          this.jump();
        } else if (diff < 0 && !this.player.sliding && this.isRunning) {
          // 아래로 스와이프 - 슬라이드
          this.startSlide();
          setTimeout(() => this.endSlide(), 500);
        }
      }
    });
  }
  
  private initializeBuildings(): void {
    if (!this.canvas) return;
    
    // 초기 건물 배치
    for (let i = 0; i < 10; i++) {
      const building = this.BUILDINGS[Math.floor(Math.random() * this.BUILDINGS.length)];
      this.buildings.push({
        ...building,
        x: Math.random() * this.canvas.width,
        y: this.groundY - building.height
      });
    }
  }
  
  private jump(): void {
    if (!this.player.jumping) {
      this.player.jumping = true;
      this.player.jumpVelocity = -this.player.jumpPower;
      this.playSound('jump');
    }
  }
  
  private startSlide(): void {
    if (!this.player.sliding && !this.player.jumping) {
      this.player.sliding = true;
      this.player.slideTime = 0;
      this.playSound('slide');
    }
  }
  
  private endSlide(): void {
    this.player.sliding = false;
    this.player.slideTime = 0;
  }
  
  private startGame(): void {
    this.isRunning = true;
    this.gameOver = false;
    console.log('Seoul Runner: Starting game', { canvas: this.canvas, ctx: this.ctx });
    this.gameLoop();
  }
  
  private gameLoop = (): void => {
    if (!this.isRunning || !this.ctx || !this.canvas) return;
    
    // 게임 업데이트
    this.update();
    
    // 화면 그리기
    this.draw();
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
  
  private update(): void {
    // 거리와 속도 증가
    this.distance += this.speed / 10;
    if (this.distance % 100 < 1 && this.speed < this.maxSpeed) {
      this.speed += 0.2;
    }
    
    // 무적 시간 업데이트
    if (this.invulnerable && this.invulnerableTime > 0) {
      this.invulnerableTime--;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }
    
    // 플레이어 업데이트
    this.updatePlayer();
    
    // 장애물 업데이트
    this.updateObstacles();
    
    // 수집품 업데이트
    this.updateCollectibles();
    
    // 건물 업데이트
    this.updateBuildings();
    
    // 파티클 업데이트
    this.updateParticles();
    
    // 충돌 체크
    this.checkCollisions();
    
    // UI 업데이트
    this.updateUI();
  }
  
  private updatePlayer(): void {
    // 점프 물리
    if (this.player.jumping) {
      this.player.y += this.player.jumpVelocity;
      this.player.jumpVelocity += this.player.gravity;
      
      if (this.player.y >= this.groundY - this.player.height) {
        this.player.y = this.groundY - this.player.height;
        this.player.jumping = false;
        this.player.jumpVelocity = 0;
      }
    }
    
    // 슬라이드 시간 체크
    if (this.player.sliding) {
      this.player.slideTime++;
      if (this.player.slideTime >= this.player.maxSlideTime) {
        this.endSlide();
      }
    }
  }
  
  private updateObstacles(): void {
    // 장애물 이동
    this.obstacles.forEach(obstacle => {
      obstacle.x -= this.speed;
    });
    
    // 화면 밖 장애물 제거
    this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
    
    // 새 장애물 생성
    if (Math.random() < 0.01 && this.obstacles.length < 2) {
      const lastObstacle = this.obstacles[this.obstacles.length - 1];
      const minDistance = 300;
      
      if (!lastObstacle || this.canvas!.width - lastObstacle.x > minDistance) {
        const type = this.OBSTACLES[Math.floor(Math.random() * this.OBSTACLES.length)];
        this.obstacles.push({
          ...type,
          x: this.canvas!.width,
          y: this.groundY - type.height
        });
      }
    }
  }
  
  private updateCollectibles(): void {
    // 수집품 이동
    this.collectibles.forEach(item => {
      item.x -= this.speed;
      item.y += Math.sin(item.x * 0.01) * 0.5; // 살짝 위아래로 움직임
    });
    
    // 화면 밖 아이템 제거
    this.collectibles = this.collectibles.filter(item => item.x > -50);
    
    // 새 수집품 생성
    if (Math.random() < 0.015 && this.collectibles.length < 5) {
      const type = this.COLLECTIBLES[Math.floor(Math.random() * this.COLLECTIBLES.length)];
      this.collectibles.push({
        ...type,
        x: this.canvas!.width,
        y: this.groundY - 100 - Math.random() * 100,
        size: 30
      });
    }
  }
  
  private updateBuildings(): void {
    // 건물 이동 (시차 효과)
    this.buildings.forEach(building => {
      building.x -= this.speed * 0.3;
    });
    
    // 화면 밖 건물 재활용
    this.buildings.forEach(building => {
      if (building.x + building.width < 0) {
        building.x = this.canvas!.width + Math.random() * 200;
        // 새로운 건물 타입으로 변경
        const newBuilding = this.BUILDINGS[Math.floor(Math.random() * this.BUILDINGS.length)];
        Object.assign(building, newBuilding);
        building.y = this.groundY - building.height;
      }
    });
  }
  
  private updateParticles(): void {
    // 파티클 업데이트
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.5; // 중력
      particle.life--;
      particle.opacity = particle.life / particle.maxLife;
    });
    
    // 수명이 다한 파티클 제거
    this.particles = this.particles.filter(particle => particle.life > 0);
  }
  
  private checkCollisions(): void {
    const playerHitbox = {
      x: this.player.x + 15,  // 더 관대한 충돌 박스
      y: this.player.y + 10,
      width: this.player.width - 30,
      height: this.player.sliding ? this.player.height / 3 : this.player.height - 20
    };
    
    // 장애물 충돌 체크
    for (const obstacle of this.obstacles) {
      // 슬라이딩 중이면 낮은 장애물은 피할 수 있음
      if (this.player.sliding && obstacle.type !== 'construction') {
        continue;
      }
      
      // 점프 중이면 높이 체크
      if (this.player.jumping && playerHitbox.y + playerHitbox.height < obstacle.y + 20) {
        continue;
      }
      
      // 더 관대한 충돌 체크 (장애물 크기 축소)
      const obstacleHitbox = {
        x: obstacle.x + 10,
        y: obstacle.y + 10,
        width: obstacle.width - 20,
        height: obstacle.height - 10
      };
      
      if (this.isColliding(playerHitbox, obstacleHitbox)) {
        if (!this.invulnerable) {
          this.lives--;
          this.invulnerable = true;
          this.invulnerableTime = 120; // 2초간 무적
          this.playSound('hit');
          this.updateLivesUI();
          
          if (this.lives <= 0) {
            this.endGame();
            return;
          }
        }
      }
    }
    
    // 수집품 충돌 체크
    this.collectibles = this.collectibles.filter(item => {
      if (this.isColliding(playerHitbox, {
        x: item.x,
        y: item.y,
        width: item.size,
        height: item.size
      })) {
        this.collectItem(item);
        return false;
      }
      return true;
    });
  }
  
  private isColliding(a: any, b: any): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }
  
  private collectItem(item: any): void {
    this.score += item.points;
    this.playSound('collect');
    
    // 수집 파티클 효과
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: item.x + item.size / 2,
        y: item.y + item.size / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 5 + 2,
        color: '#FFD700',
        life: 30,
        maxLife: 30,
        opacity: 1
      });
    }
    
    // 콤보 표시
    const comboDiv = this.container?.querySelector('#combo') as HTMLElement;
    if (comboDiv) {
      comboDiv.style.display = 'block';
      setTimeout(() => {
        comboDiv.style.display = 'none';
      }, 1000);
    }
  }
  
  private draw(): void {
    if (!this.ctx || !this.canvas) return;
    
    // 화면 초기화
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 계절 계산 (거리에 따라)
    const season = Math.floor(this.distance / 1000) % 4; // 0: 봄, 1: 여름, 2: 가을, 3: 겨울
    const timeOfDay = (this.distance / 500) % 3; // 시간대
    
    // 계절별 하늘 색상
    const timeGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    
    if (season === 0) { // 봄
      if (timeOfDay < 1) {
        timeGradient.addColorStop(0, '#FFE5F1');
        timeGradient.addColorStop(0.5, '#F8BBD0');
        timeGradient.addColorStop(1, '#E1BEE7');
      } else if (timeOfDay < 2) {
        timeGradient.addColorStop(0, '#87CEEB');
        timeGradient.addColorStop(0.5, '#B2EBF2');
        timeGradient.addColorStop(1, '#E0F2F1');
      } else {
        timeGradient.addColorStop(0, '#FF80AB');
        timeGradient.addColorStop(0.5, '#FFB2DD');
        timeGradient.addColorStop(1, '#FFC1E3');
      }
    } else if (season === 1) { // 여름
      if (timeOfDay < 1) {
        timeGradient.addColorStop(0, '#FFE082');
        timeGradient.addColorStop(0.5, '#81D4FA');
        timeGradient.addColorStop(1, '#80DEEA');
      } else if (timeOfDay < 2) {
        timeGradient.addColorStop(0, '#01579B');
        timeGradient.addColorStop(0.5, '#039BE5');
        timeGradient.addColorStop(1, '#81D4FA');
      } else {
        timeGradient.addColorStop(0, '#FF6F00');
        timeGradient.addColorStop(0.5, '#FF8F65');
        timeGradient.addColorStop(1, '#FFAB91');
      }
    } else if (season === 2) { // 가을
      if (timeOfDay < 1) {
        timeGradient.addColorStop(0, '#FFE0B2');
        timeGradient.addColorStop(0.5, '#FFCC80');
        timeGradient.addColorStop(1, '#FFB74D');
      } else if (timeOfDay < 2) {
        timeGradient.addColorStop(0, '#FFF3E0');
        timeGradient.addColorStop(0.5, '#FFE0B2');
        timeGradient.addColorStop(1, '#FFCCBC');
      } else {
        timeGradient.addColorStop(0, '#BF360C');
        timeGradient.addColorStop(0.5, '#E64A19');
        timeGradient.addColorStop(1, '#FF8A65');
      }
    } else { // 겨울
      if (timeOfDay < 1) {
        timeGradient.addColorStop(0, '#E1F5FE');
        timeGradient.addColorStop(0.5, '#B3E5FC');
        timeGradient.addColorStop(1, '#E0E0E0');
      } else if (timeOfDay < 2) {
        timeGradient.addColorStop(0, '#ECEFF1');
        timeGradient.addColorStop(0.5, '#CFD8DC');
        timeGradient.addColorStop(1, '#B0BEC5');
      } else {
        timeGradient.addColorStop(0, '#37474F');
        timeGradient.addColorStop(0.5, '#546E7A');
        timeGradient.addColorStop(1, '#78909C');
      }
    }
    
    this.ctx.fillStyle = timeGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 한강 그리기 (멀리)
    const riverGradient = this.ctx.createLinearGradient(0, this.groundY - 100, 0, this.groundY - 50);
    riverGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    riverGradient.addColorStop(1, 'rgba(59, 130, 246, 0.6)');
    this.ctx.fillStyle = riverGradient;
    this.ctx.fillRect(0, this.groundY - 100, this.canvas.width, 50);
    
    // 한강 물결 효과
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.width; i += 40) {
      this.ctx.beginPath();
      const waveOffset = Math.sin((i + this.distance) * 0.01) * 5;
      this.ctx.moveTo(i, this.groundY - 75 + waveOffset);
      this.ctx.lineTo(i + 20, this.groundY - 75 + waveOffset);
      this.ctx.stroke();
    }
    
    // 구름 그리기
    this.drawClouds();
    
    // 건물 그리기 (배경)
    this.drawBuildings();
    
    // 도로 그리기
    // 아스팔트
    this.ctx.fillStyle = '#2C2C2C';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    
    // 도로 테두리
    this.ctx.fillStyle = '#555';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, 5);
    
    // 중앙선
    this.ctx.fillStyle = '#FFD700';
    for (let i = 0; i < this.canvas.width; i += 60) {
      this.ctx.fillRect(i - (this.distance * 2) % 60, this.groundY + 25, 30, 4);
    }
    
    // 인도
    this.ctx.fillStyle = '#888';
    this.ctx.fillRect(0, this.groundY + 60, this.canvas.width, 40);
    
    // 계절별 파티클 효과
    if (season === 0 && Math.random() < 0.3) { // 봄 - 벚꽃
      this.particles.push({
        x: this.canvas.width + 10,
        y: Math.random() * (this.groundY - 100),
        vx: -this.speed - Math.random() * 2,
        vy: Math.random() * 2,
        size: 5,
        color: '#FFB6C1',
        life: 100,
        maxLife: 100,
        opacity: 1
      });
    } else if (season === 2 && Math.random() < 0.2) { // 가을 - 낙엽
      this.particles.push({
        x: this.canvas.width + 10,
        y: Math.random() * (this.groundY - 200),
        vx: -this.speed - Math.random() * 3,
        vy: Math.random() * 3 + 1,
        size: 8,
        color: Math.random() > 0.5 ? '#FF6F00' : '#FFB74D',
        life: 150,
        maxLife: 150,
        opacity: 1,
        rotation: Math.random() * Math.PI * 2
      });
    } else if (season === 3 && Math.random() < 0.4) { // 겨울 - 눈
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -10,
        vx: -this.speed * 0.5 + (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 4 + 2,
        color: '#FFFFFF',
        life: 200,
        maxLife: 200,
        opacity: 0.8
      });
    }
    
    // 수집품 그리기
    this.drawCollectibles();
    
    // 장애물 그리기
    this.drawObstacles();
    
    // 플레이어 그리기
    this.drawPlayer();
    
    // 파티클 그리기
    this.drawParticles();
  }
  
  private drawClouds(): void {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    // 움직이는 구름 효과
    const cloudOffset = (this.distance * 0.1) % this.canvas!.width;
    
    for (let i = 0; i < 5; i++) {
      const x = (i * 200 - cloudOffset + this.canvas!.width) % this.canvas!.width;
      const y = 30 + i * 20;
      
      // 구름 그리기
      this.ctx.beginPath();
      this.ctx.arc(x, y, 25, 0, Math.PI * 2);
      this.ctx.arc(x + 20, y, 30, 0, Math.PI * 2);
      this.ctx.arc(x + 40, y, 25, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  private drawBuildings(): void {
    if (!this.ctx) return;
    
    this.buildings.forEach(building => {
      this.ctx.save();
      
      if (building.name === '63빌딩') {
        // 63빌딩 - 금색 유리 건물
        const gradient = this.ctx.createLinearGradient(building.x, building.y, building.x + building.width, building.y);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // 창문 반사 효과
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let y = 0; y < building.height; y += 15) {
          this.ctx.fillRect(building.x + 5, building.y + y, building.width - 10, 2);
        }
        
      } else if (building.name === '롯데타워') {
        // 롯데타워 - 뾰족한 꼭대기
        this.ctx.fillStyle = '#37474F';
        this.ctx.fillRect(building.x, building.y + 50, building.width, building.height - 50);
        
        // 삼각형 꼭대기
        this.ctx.beginPath();
        this.ctx.moveTo(building.x + 5, building.y + 50);
        this.ctx.lineTo(building.x + building.width / 2, building.y);
        this.ctx.lineTo(building.x + building.width - 5, building.y + 50);
        this.ctx.closePath();
        this.ctx.fill();
        
        // LED 조명 효과
        this.ctx.fillStyle = '#00E5FF';
        for (let i = 0; i < 5; i++) {
          this.ctx.fillRect(building.x + 10, building.y + 60 + i * 30, building.width - 20, 2);
        }
        
      } else if (building.name === 'N서울타워') {
        // N서울타워 - 전망대와 안테나
        // 기둥
        this.ctx.fillStyle = '#9E9E9E';
        this.ctx.fillRect(building.x + building.width/3, building.y + 40, building.width/3, building.height - 40);
        
        // 전망대 (원형)
        this.ctx.fillStyle = '#F44336';
        this.ctx.beginPath();
        this.ctx.arc(building.x + building.width/2, building.y + 50, building.width/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 안테나
        this.ctx.fillStyle = '#616161';
        this.ctx.fillRect(building.x + building.width/2 - 2, building.y - 30, 4, 50);
        
        // 팁
        this.ctx.beginPath();
        this.ctx.arc(building.x + building.width/2, building.y - 30, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fill();
        
      } else if (building.name === '경복궁') {
        // 경복궁 - 전통 한옥 지붕
        // 기단
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(building.x, building.y + building.height - 20, building.width, 20);
        
        // 기둥들
        this.ctx.fillStyle = '#6D4C41';
        for (let i = 0; i < 4; i++) {
          this.ctx.fillRect(building.x + 10 + i * (building.width/4), building.y + 30, 8, building.height - 50);
        }
        
        // 처마
        this.ctx.fillStyle = '#D32F2F';
        this.ctx.beginPath();
        this.ctx.moveTo(building.x - 20, building.y + 30);
        this.ctx.quadraticCurveTo(building.x + building.width/2, building.y - 10, building.x + building.width + 20, building.y + 30);
        this.ctx.lineTo(building.x + building.width, building.y + 40);
        this.ctx.lineTo(building.x, building.y + 40);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 기와 무늬
        this.ctx.strokeStyle = '#B71C1C';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(building.x, building.y + 20 + i * 5);
          this.ctx.lineTo(building.x + building.width, building.y + 20 + i * 5);
          this.ctx.stroke();
        }
        
      } else if (building.name === '광화문') {
        // 광화문 - 대문 형태
        // 문 기둥
        this.ctx.fillStyle = '#795548';
        this.ctx.fillRect(building.x, building.y + 20, 20, building.height - 20);
        this.ctx.fillRect(building.x + building.width - 20, building.y + 20, 20, building.height - 20);
        
        // 문 아치
        this.ctx.beginPath();
        this.ctx.arc(building.x + building.width/2, building.y + 40, building.width/2 - 20, Math.PI, 0, true);
        this.ctx.fillStyle = '#3E2723';
        this.ctx.fill();
        
        // 지붕
        this.ctx.fillStyle = '#B71C1C';
        this.ctx.beginPath();
        this.ctx.moveTo(building.x - 15, building.y + 20);
        this.ctx.lineTo(building.x + building.width/2, building.y - 5);
        this.ctx.lineTo(building.x + building.width + 15, building.y + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
      } else if (building.name === '북한산') {
        // 북한산 - 바위산
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.moveTo(building.x, building.y + building.height);
        this.ctx.lineTo(building.x + building.width * 0.2, building.y + 20);
        this.ctx.lineTo(building.x + building.width * 0.4, building.y);
        this.ctx.lineTo(building.x + building.width * 0.6, building.y + 30);
        this.ctx.lineTo(building.x + building.width * 0.8, building.y - 10);
        this.ctx.lineTo(building.x + building.width, building.y + building.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 바위 질감
        this.ctx.fillStyle = '#616161';
        this.ctx.beginPath();
        this.ctx.arc(building.x + building.width * 0.4, building.y + 40, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(building.x + building.width * 0.7, building.y + 60, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
      } else {
        // 기본 건물
        this.ctx.fillStyle = building.color;
        this.ctx.fillRect(building.x, building.y, building.width, building.height);
      }
      
      // 건물 이름 표시 (배경 추가)
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(building.x, building.y + building.height - 20, building.width, 20);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(building.name, building.x + building.width / 2, building.y + building.height - 5);
      
      this.ctx.restore();
    });
  }
  
  private drawCollectibles(): void {
    if (!this.ctx) return;
    
    this.collectibles.forEach(item => {
      // 아이템 이모지만 표시 (배경 없이)
      this.ctx.font = `${item.size}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(item.emoji, item.x + item.size / 2, item.y + item.size / 2);
    });
  }
  
  private drawObstacles(): void {
    if (!this.ctx) return;
    
    this.obstacles.forEach(obstacle => {
      // 장애물 그림자 (도로에)
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.ellipse(
        obstacle.x + obstacle.width / 2, 
        this.groundY + 5, 
        obstacle.width / 3, 
        6, 
        0, 0, Math.PI * 2
      );
      this.ctx.fill();
      this.ctx.restore();
      
      // 장애물 이모지만 표시 (배경 없이)
      const emojiSize = obstacle.type === 'taxi' ? '36px' : '32px';
      this.ctx.font = emojiSize + ' Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(
        obstacle.emoji, 
        obstacle.x + obstacle.width / 2, 
        obstacle.y + obstacle.height
      );
    });
  }
  
  private drawPlayer(): void {
    if (!this.ctx) return;
    
    // 무적 상태일 때 깜빡임
    if (this.invulnerable && Math.floor(this.invulnerableTime / 5) % 2 === 0) {
      return;
    }
    
    const actualHeight = this.player.sliding ? this.player.height / 2 : this.player.height;
    const yOffset = this.player.sliding ? this.player.height / 2 : 0;
    
    // 플레이어 그림자 (도로에)
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.ellipse(
      this.player.x + this.player.width / 2, 
      this.groundY + 5, 
      this.player.width / 2, 
      8, 
      0, 0, Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.restore();
    
    // 플레이어를 간단한 캐릭터로 그리기
    const centerX = this.player.x + this.player.width / 2;
    const centerY = this.player.y + yOffset + actualHeight / 2;
    
    if (this.player.sliding) {
      // 슬라이딩 자세
      // 몸통
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.fillRect(this.player.x, centerY - 10, this.player.width, 20);
      
      // 머리
      this.ctx.beginPath();
      this.ctx.arc(this.player.x + this.player.width - 10, centerY, 12, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FECA57';
      this.ctx.fill();
      
      // 눈
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(this.player.x + this.player.width - 8, centerY - 2, 3, 3);
    } else {
      // 달리는 자세
      // 몸통
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.fillRect(centerX - 12, centerY - 10, 24, 30);
      
      // 머리
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY - 20, 12, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FECA57';
      this.ctx.fill();
      
      // 눈 (앞을 보는)
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(centerX + 3, centerY - 22, 3, 3);
      
      // 팔 (달리는 모션)
      this.ctx.strokeStyle = '#FECA57';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      const armOffset = Math.sin(Date.now() * 0.01) * 5;
      // 앞팔
      this.ctx.moveTo(centerX + 12, centerY - 5);
      this.ctx.lineTo(centerX + 20, centerY - 5 + armOffset);
      // 뒷팔
      this.ctx.moveTo(centerX - 12, centerY - 5);
      this.ctx.lineTo(centerX - 20, centerY - 5 - armOffset);
      this.ctx.stroke();
      
      // 다리 (달리는 모션)
      this.ctx.beginPath();
      const legOffset = Math.sin(Date.now() * 0.01) * 8;
      // 앞다리
      this.ctx.moveTo(centerX + 5, centerY + 20);
      this.ctx.lineTo(centerX + 8 + legOffset, centerY + 35);
      // 뒷다리
      this.ctx.moveTo(centerX - 5, centerY + 20);
      this.ctx.lineTo(centerX - 8 - legOffset, centerY + 35);
      this.ctx.stroke();
    }
  }
  
  private drawParticles(): void {
    if (!this.ctx) return;
    
    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.ctx.globalAlpha = 1;
  }
  
  private updateUI(): void {
    const scoreEl = this.container?.querySelector('#score');
    const distanceEl = this.container?.querySelector('#distance');
    const seasonEl = this.container?.querySelector('#season');
    
    if (scoreEl) scoreEl.textContent = this.score.toString();
    if (distanceEl) distanceEl.textContent = Math.floor(this.distance).toString();
    
    if (seasonEl) {
      const season = Math.floor(this.distance / 1000) % 4;
      const seasons = [
        '🌸 Spring',
        '☀️ Summer', 
        '🍂 Fall',
        '❄️ Winter'
      ];
      seasonEl.textContent = seasons[season];
    }
  }
  
  private updateLivesUI(): void {
    const livesEl = this.container?.querySelector('#lives');
    if (livesEl) {
      let hearts = '';
      for (let i = 0; i < this.lives; i++) {
        hearts += '❤️';
      }
      livesEl.textContent = hearts || '💔';
    }
  }
  
  private endGame(): void {
    this.isRunning = false;
    this.gameOver = true;
    
    const gameOverScreen = this.container?.querySelector('#game-over') as HTMLElement;
    const finalScoreEl = this.container?.querySelector('#final-score');
    const finalDistanceEl = this.container?.querySelector('#final-distance');
    
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
    if (finalScoreEl) finalScoreEl.textContent = this.score.toString();
    if (finalDistanceEl) finalDistanceEl.textContent = Math.floor(this.distance).toString();
    
    // 최고 점수 저장
    const highScore = localStorage.getItem('seoul-runner-highscore');
    if (!highScore || this.score > parseInt(highScore)) {
      localStorage.setItem('seoul-runner-highscore', this.score.toString());
    }
    
    this.playSound('gameOver');
  }
  
  private resetGame(): void {
    this.score = 0;
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.lives = 3;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.player.y = this.groundY - this.player.height;
    this.player.jumping = false;
    this.player.jumpVelocity = 0;
    this.player.sliding = false;
    this.player.slideTime = 0;
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.gameOver = false;
    this.isRunning = false;
    
    // 건물 다시 초기화
    this.buildings = [];
    this.initializeBuildings();
    
    // UI 초기화
    this.updateUI();
    this.updateLivesUI();
  }
  
  private playSound(type: string): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const now = audioContext.currentTime;
      
      switch (type) {
        case 'jump':
          oscillator.frequency.value = 400;
          gainNode.gain.value = 0.1;
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
          
        case 'slide':
          oscillator.frequency.value = 200;
          gainNode.gain.value = 0.08;
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;
          
        case 'collect':
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.1;
          oscillator.start(now);
          oscillator.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
          oscillator.stop(now + 0.2);
          break;
          
        case 'hit':
          oscillator.frequency.value = 150;
          gainNode.gain.value = 0.2;
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
          
        case 'gameOver':
          oscillator.frequency.value = 300;
          gainNode.gain.value = 0.15;
          oscillator.start(now);
          oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
          oscillator.stop(now + 0.5);
          break;
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }
  
  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // 이벤트 리스너 정리는 컨테이너가 제거되면 자동으로 처리됨
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}