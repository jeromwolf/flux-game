export default class KFoodRush {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private language: 'ko' | 'en' = 'ko';
  
  // 언어별 텍스트
  private texts = {
    ko: {
      score: '점수',
      level: '레벨',
      combo: '콤보',
      won: '원',
      waitingOrder: '주문을 기다리는 중...',
      gameOver: '게임 오버!',
      finalRevenue: '최종 매출',
      levelReached: '레벨',
      achieved: '달성',
      tryAgain: '다시 도전하기',
      gameStart: '게임 시작',
      subtitle: '한국 음식을 만들어 전 세계 손님들을 만족시키세요!',
      instruction: '재료를 순서대로 클릭해서 요리를 완성하세요.',
      // 재료
      rice: '밥',
      seaweed: '김',
      beef: '소고기',
      vegetables: '야채',
      sauce: '소스',
      riceCake: '떡',
      // 음식 이름
      kimbap: '김밥',
      tteokbokki: '떡볶이',
      bulgogi: '불고기',
      bibimbap: '비빔밥'
    },
    en: {
      score: 'Score',
      level: 'Level',
      combo: 'Combo',
      won: 'won',
      waitingOrder: 'Waiting for order...',
      gameOver: 'Game Over!',
      finalRevenue: 'Final Revenue',
      levelReached: 'Level',
      achieved: 'Reached',
      tryAgain: 'Try Again',
      gameStart: 'Start Game',
      subtitle: 'Cook Korean food for customers around the world!',
      instruction: 'Click ingredients in order to complete the dish.',
      // 재료
      rice: 'Rice',
      seaweed: 'Seaweed',
      beef: 'Beef',
      vegetables: 'Vegetables',
      sauce: 'Sauce',
      riceCake: 'Rice Cake',
      // 음식 이름
      kimbap: 'Kimbap',
      tteokbokki: 'Tteokbokki',
      bulgogi: 'Bulgogi',
      bibimbap: 'Bibimbap'
    }
  };
  
  // 게임 상태
  private score: number = 0;
  private level: number = 1;
  private combo: number = 0;
  private lives: number = 5;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private currentOrderTime: number = 0;
  private orderTimeLimit: number = 30; // 30초 제한
  
  // 음식 종류
  private readonly FOODS = {
    kimbap: { 
      name: '김밥', 
      emoji: '🍙', 
      ingredients: ['rice', 'seaweed', 'vegetables'],
      time: 10,
      price: 3000
    },
    tteokbokki: { 
      name: '떡볶이', 
      emoji: '🌶️🍡', 
      ingredients: ['rice_cake', 'sauce', 'vegetables'],
      time: 8,
      price: 4000
    },
    bulgogi: { 
      name: '불고기', 
      emoji: '🥩🔥', 
      ingredients: ['beef', 'sauce', 'vegetables'],
      time: 12,
      price: 8000
    },
    bibimbap: {
      name: '비빔밥',
      emoji: '🍚🥗',
      ingredients: ['rice', 'vegetables', 'sauce'],
      time: 15,
      price: 7000
    }
  };
  
  // 현재 주문
  private currentOrder: any = null;
  private completedIngredients: string[] = [];
  private customers: any[] = [];
  private ingredients: any[] = [];
  
  // 컨트롤
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  
  constructor() {}
  
  mount(container: HTMLElement): void {
    this.container = container;
    // Load language preference
    const savedLanguage = localStorage.getItem('flux-game-language');
    if (savedLanguage === 'ko' || savedLanguage === 'en') {
      this.language = savedLanguage;
    }
    this.initializeGame();
  }
  
  unmount(): void {
    this.cleanup();
  }
  
  private initializeGame(): void {
    if (!this.container) return;
    
    // HTML 구조
    const t = this.texts[this.language];
    this.container.innerHTML = `
      <div style="width: 100%; height: 600px; position: relative; background: linear-gradient(to bottom, #fff5e6 0%, #ffe6cc 100%); overflow: hidden;">
        <!-- 상단 UI -->
        <div style="position: absolute; top: 0; left: 0; right: 0; background: rgba(255,255,255,0.9); padding: 10px; border-bottom: 3px solid #ff6b6b;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 20px;">
              <div style="font-size: 20px; font-weight: bold; color: #333;">
                ${t.score}: <span id="score" style="color: #ff6b6b;">0</span>${t.won}
              </div>
              <div style="font-size: 18px; color: #666;">
                ${t.level}: <span id="level">1</span>
              </div>
              <div style="font-size: 18px; color: #666;">
                ${t.combo}: <span id="combo" style="color: #4CAF50;">x1</span>
              </div>
            </div>
            <div style="font-size: 18px;">
              ❤️ <span id="lives">5</span>
            </div>
          </div>
        </div>
        
        <!-- 주문 영역 -->
        <div id="order-area" style="position: absolute; top: 60px; left: 10px; right: 10px; height: 120px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 15px;">
          <div id="current-order" style="text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">${t.waitingOrder}</div>
          </div>
        </div>
        
        <!-- 게임 캔버스 -->
        <canvas id="game-canvas" style="position: absolute; top: 200px; left: 0; right: 0; bottom: 100px;"></canvas>
        
        <!-- 재료 버튼 영역 -->
        <div id="ingredient-buttons" style="position: absolute; bottom: 0; left: 0; right: 0; height: 100px; background: rgba(255,255,255,0.9); border-top: 3px solid #ff6b6b; padding: 10px; overflow-x: auto;">
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="ingredient-btn" data-ingredient="rice" style="padding: 10px 20px; font-size: 16px; background: #FFF3E0; border: 2px solid #FFB74D; border-radius: 20px; cursor: pointer; color: #333; font-weight: bold;">
              🍚 ${t.rice}
            </button>
            <button class="ingredient-btn" data-ingredient="seaweed" style="padding: 10px 20px; font-size: 16px; background: #E8F5E9; border: 2px solid #66BB6A; border-radius: 20px; cursor: pointer; color: #333; font-weight: bold;">
              🌿 ${t.seaweed}
            </button>
            <button class="ingredient-btn" data-ingredient="beef" style="padding: 10px 20px; font-size: 16px; background: #FFEBEE; border: 2px solid #EF5350; border-radius: 20px; cursor: pointer; color: #333; font-weight: bold;">
              🥩 ${t.beef}
            </button>
            <button class="ingredient-btn" data-ingredient="vegetables" style="padding: 10px 20px; font-size: 16px; background: #F3E5F5; border: 2px solid #AB47BC; border-radius: 20px; cursor: pointer; color: #333; font-weight: bold;">
              🥗 ${t.vegetables}
            </button>
            <button class="ingredient-btn" data-ingredient="sauce" style="padding: 10px 20px; font-size: 16px; background: #FCE4EC; border: 2px solid #F06292; border-radius: 20px; cursor: pointer; color: #333; font-weight: bold;">
              🥫 ${t.sauce}
            </button>
            <button class="ingredient-btn" data-ingredient="rice_cake" style="padding: 10px 20px; font-size: 16px; background: #FFF8E1; border: 2px solid #FFD54F; border-radius: 20px; cursor: pointer; color: #333; font-weight: bold;">
              🍡 ${t.riceCake}
            </button>
          </div>
        </div>
        
        <!-- 게임 오버 화면 -->
        <div id="game-over" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none; text-align: center; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
          <h2 style="color: #ff6b6b; font-size: 36px; margin: 0 0 20px 0;">${t.gameOver}</h2>
          <div style="font-size: 24px; color: #333; margin-bottom: 10px;">
            ${t.finalRevenue}: <span id="final-score" style="color: #ff6b6b; font-weight: bold;">0</span>${t.won}
          </div>
          <div style="font-size: 18px; color: #666; margin-bottom: 30px;">
            ${t.levelReached} <span id="final-level">1</span> ${t.achieved}
          </div>
          <button id="restart-btn" style="padding: 15px 30px; font-size: 20px; background: #ff6b6b; color: white; border: none; border-radius: 30px; cursor: pointer;">
            ${t.tryAgain}
          </button>
        </div>
        
        <!-- 시작 화면 -->
        <div id="start-screen" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px;">
            <h1 style="color: #ff6b6b; font-size: 48px; margin: 0 0 20px 0;">🍜 K-Food Rush</h1>
            <p style="font-size: 18px; color: #666; margin-bottom: 20px;">
              ${t.subtitle}<br>
              ${t.instruction}
            </p>
            <div style="background: #fff3e0; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #ff6b6b;">
              <p style="font-size: 16px; color: #333; margin: 0;">
                <span style="color: #ff6b6b; font-weight: bold;">⚠️ ${this.language === 'ko' ? '주의' : 'Important'}:</span> 
                ${this.language === 'ko' ? '재료를 정확한 순서대로 클릭하세요!' : 'Click ingredients in the exact order shown!'}
              </p>
            </div>
            <button id="start-btn" style="padding: 15px 40px; font-size: 24px; background: #ff6b6b; color: white; border: none; border-radius: 30px; cursor: pointer;">
              ${t.gameStart}
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 캔버스 초기화
    this.canvas = this.container.querySelector('#game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.container.clientWidth;
      this.canvas.height = 280; // 고정 높이
      this.ctx = this.canvas.getContext('2d');
    }
    
    this.setupControls();
  }
  
  private setupControls(): void {
    // 시작 버튼
    const startBtn = this.container?.querySelector('#start-btn');
    startBtn?.addEventListener('click', () => {
      const startScreen = this.container?.querySelector('#start-screen') as HTMLElement;
      if (startScreen) startScreen.style.display = 'none';
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
    
    // 재료 버튼들 - 이벤트 위임 사용
    const ingredientArea = this.container?.querySelector('#ingredient-buttons');
    ingredientArea?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.ingredient-btn') as HTMLElement;
      if (btn && btn.dataset.ingredient) {
        this.selectIngredient(btn.dataset.ingredient);
      }
    });
    
    // 터치 컨트롤
    this.canvas?.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    });
    
    this.canvas?.addEventListener('touchmove', (e) => {
      e.preventDefault();
    });
  }
  
  private startGame(): void {
    this.gameOver = false;
    this.generateNewOrder();
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  private generateNewOrder(): void {
    // 랜덤으로 음식 주문 생성
    const foodKeys = Object.keys(this.FOODS);
    const randomFood = foodKeys[Math.floor(Math.random() * foodKeys.length)];
    this.currentOrder = {
      food: this.FOODS[randomFood as keyof typeof this.FOODS],
      key: randomFood,
      timeLeft: this.orderTimeLimit
    };
    
    this.completedIngredients = [];
    this.updateOrderUI();
  }
  
  private updateOrderUI(): void {
    const orderDiv = this.container?.querySelector('#current-order');
    if (!orderDiv || !this.currentOrder) return;
    
    const food = this.currentOrder.food;
    const remainingIngredients = food.ingredients.filter(
      (ing: string) => !this.completedIngredients.includes(ing)
    );
    
    const t = this.texts[this.language];
    const foodName = t[this.currentOrder.key as keyof typeof t] || food.name;
    
    orderDiv.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 10px; color: #333;">${foodName} ${food.emoji}</div>
      <div style="font-size: 16px; color: #666;">
        ${this.language === 'ko' ? '남은 재료' : 'Remaining'}: ${remainingIngredients.length}${this.language === 'ko' ? '개' : ''} | 
        ${this.language === 'ko' ? '시간' : 'Time'}: <span style="color: ${this.currentOrder.timeLeft < 10 ? '#ff0000' : '#333'};">
          ${Math.ceil(this.currentOrder.timeLeft)}${this.language === 'ko' ? '초' : 's'}
        </span>
      </div>
      <div style="margin-top: 10px;">
        <div style="font-size: 14px; color: #666; margin-bottom: 8px; font-weight: bold;">
          ${this.language === 'ko' ? '재료 순서:' : 'Ingredient Order:'}
        </div>
        <div style="display: flex; justify-content: center; gap: 8px; align-items: center;">
          ${food.ingredients.map((ing: string, index: number) => {
            const ingredientName = this.language === 'ko' 
              ? (ing === 'rice' ? '밥' : ing === 'seaweed' ? '김' : ing === 'beef' ? '소고기' : ing === 'vegetables' ? '야채' : ing === 'sauce' ? '소스' : '떡')
              : (ing === 'rice' ? 'Rice' : ing === 'seaweed' ? 'Seaweed' : ing === 'beef' ? 'Beef' : ing === 'vegetables' ? 'Vegetables' : ing === 'sauce' ? 'Sauce' : 'Rice Cake');
            const emoji = ing === 'rice' ? '🍚' : ing === 'seaweed' ? '🌿' : ing === 'beef' ? '🥩' : ing === 'vegetables' ? '🥗' : ing === 'sauce' ? '🥫' : '🍡';
            
            return `
              ${index > 0 ? '<span style="color: #999; font-size: 20px; margin: 0 5px;">→</span>' : ''}
              <div style="
                padding: 8px 12px; 
                background: ${this.completedIngredients.includes(ing) ? '#4CAF50' : '#f5f5f5'}; 
                color: ${this.completedIngredients.includes(ing) ? 'white' : '#333'}; 
                border: 2px solid ${this.completedIngredients.includes(ing) ? '#4CAF50' : '#ddd'};
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 5px;
              ">
                ${emoji} ${ingredientName}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  private selectIngredient(ingredient: string): void {
    if (!this.currentOrder || this.gameOver) return;
    
    const food = this.currentOrder.food;
    const requiredIngredients = food.ingredients;
    const currentIndex = this.completedIngredients.length;
    
    // 올바른 재료인지 확인
    if (currentIndex < requiredIngredients.length && 
        requiredIngredients[currentIndex] === ingredient) {
      this.completedIngredients.push(ingredient);
      this.combo++;
      this.playSound('correct');
      
      // 음식 완성
      if (this.completedIngredients.length === requiredIngredients.length) {
        this.completeOrder();
      }
    } else {
      // 잘못된 재료
      this.combo = 0;
      this.lives--;
      this.playSound('wrong');
      this.updateUI();
      
      if (this.lives <= 0) {
        this.endGame();
      }
    }
    
    this.updateOrderUI();
  }
  
  
  private completeOrder(): void {
    if (!this.currentOrder) return;
    
    // 점수 계산 (콤보 보너스 포함)
    const baseScore = this.currentOrder.food.price;
    const comboBonus = Math.floor(this.combo / 5) * 1000;
    const timeBonus = Math.floor(this.currentOrder.timeLeft) * 100;
    const totalScore = baseScore + comboBonus + timeBonus;
    
    this.score += totalScore;
    this.playSound('complete');
    
    // 레벨업 체크
    if (this.score > this.level * 50000) {
      this.level++;
      this.orderTimeLimit = Math.max(15, this.orderTimeLimit - 2); // 난이도 증가
    }
    
    this.updateUI();
    this.generateNewOrder();
  }
  
  private updateUI(): void {
    const scoreEl = this.container?.querySelector('#score');
    const levelEl = this.container?.querySelector('#level');
    const comboEl = this.container?.querySelector('#combo');
    const livesEl = this.container?.querySelector('#lives');
    
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    if (levelEl) levelEl.textContent = this.level.toString();
    if (comboEl) comboEl.textContent = `x${Math.floor(this.combo / 5) + 1}`;
    if (livesEl) livesEl.textContent = this.lives.toString();
  }
  
  private gameLoop = (): void => {
    if (this.gameOver) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // 주문 시간 감소
    if (this.currentOrder) {
      this.currentOrder.timeLeft -= deltaTime;
      
      if (this.currentOrder.timeLeft <= 0) {
        // 시간 초과
        this.lives--;
        this.combo = 0;
        this.playSound('timeout');
        
        if (this.lives <= 0) {
          this.endGame();
        } else {
          this.generateNewOrder();
        }
      }
      
      this.updateOrderUI();
    }
    
    // 캔버스 그리기
    this.draw();
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
  
  
  
  private draw(): void {
    if (!this.ctx || !this.canvas) return;
    
    // 캔버스 클리어
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 주방 배경 그리기
    this.ctx.fillStyle = '#FFF8E1';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 조리대 그리기
    this.ctx.fillStyle = '#8D6E63';
    this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    
    // 완성도 표시
    if (this.currentOrder) {
      const progress = this.completedIngredients.length / this.currentOrder.food.ingredients.length;
      const barWidth = 200;
      const barHeight = 20;
      const barX = (this.canvas.width - barWidth) / 2;
      const barY = this.canvas.height / 2;
      
      // 진행 바 배경
      this.ctx.fillStyle = '#ddd';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // 진행 바
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      
      // 테두리
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      // 퍼센트 텍스트
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `${Math.floor(progress * 100)}%`,
        this.canvas.width / 2,
        barY - 10
      );
    }
  }
  

  private endGame(): void {
    this.gameOver = true;
    
    const gameOverScreen = this.container?.querySelector('#game-over') as HTMLElement;
    const finalScoreEl = this.container?.querySelector('#final-score');
    const finalLevelEl = this.container?.querySelector('#final-level');
    
    if (gameOverScreen) gameOverScreen.style.display = 'block';
    if (finalScoreEl) finalScoreEl.textContent = this.score.toLocaleString();
    if (finalLevelEl) finalLevelEl.textContent = this.level.toString();
    
    this.playSound('gameOver');
  }
  
  private resetGame(): void {
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.lives = 5;
    this.currentOrder = null;
    this.completedIngredients = [];
    this.orderTimeLimit = 30;
    this.updateUI();
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
        case 'correct':
          oscillator.frequency.value = 523.25; // C5
          gainNode.gain.value = 0.1;
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;
          
        case 'wrong':
          oscillator.frequency.value = 200;
          gainNode.gain.value = 0.1;
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
          
        case 'complete':
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.1;
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
          
        case 'timeout':
        case 'gameOver':
          oscillator.frequency.value = 150;
          gainNode.gain.value = 0.1;
          oscillator.start(now);
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
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}