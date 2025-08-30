import { BaseGame } from '../core/BaseGame';
import { leaderboardSystem } from '../leaderboard/LeaderboardSystem';
import { tutorialSystem, TutorialConfig } from '../tutorial/TutorialSystem';
import { achievementSystem } from '../achievements/AchievementSystem';

// Types
interface Word {
  text: string;
  position?: { x: number; y: number };
  emotion?: string;
  rhythm?: 'short' | 'long';
}

interface Content {
  id: string;
  type: 'words' | 'poetry' | 'story';
  title: string;
  titleEn: string;
  items: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  requiredLevel: number;
}

type MemoryPattern = 
  | 'sequential'      // 순차적 증가
  | 'reverse'         // 역순 재구성
  | 'swiss-cheese'    // 중간 빈칸
  | 'chain-reaction'  // 연쇄 반응
  | 'pair-match'      // 짝 맞추기
  | 'spatial'         // 위치 기억
  | 'spot-change'     // 변형 찾기
  | 'emotion-tag';    // 감정 태그

export default class WordMemory extends BaseGame {
  // Game state
  private currentContent: Content | null = null;
  private currentPattern: MemoryPattern = 'sequential';
  private currentWords: Word[] = [];
  private displayWords: Word[] = [];
  private playerInput: string[] = [];
  private currentIndex: number = 0;
  private isShowingWords: boolean = false;
  private isPlayerTurn: boolean = false;
  private level: number = 1;
  private mistakes: number = 0;
  private maxMistakes: number = 3;
  private wordsCompleted: number = 0;
  private patternRotation: number = 0;
  
  // UI Elements
  private inputMode: 'buttons' | 'typing' | 'drag' = 'buttons';
  private wordButtons: { text: string; x: number; y: number; width: number; height: number }[] = [];
  private selectedWords: string[] = [];
  private showTimer: number = 3000; // ms to show words
  
  // Language
  private language: 'ko' | 'en' = 'ko';
  private texts = {
    ko: {
      remember: '단어를 기억하세요!',
      yourTurn: '순서대로 선택하세요',
      reverse: '거꾸로 입력하세요!',
      fillBlanks: '빈칸을 채우세요',
      findPairs: '짝을 찾으세요',
      whatChanged: '무엇이 바뀌었나요?',
      correct: '정답!',
      wrong: '틀렸어요',
      gameOver: '게임 오버',
      level: '레벨',
      words: '단어',
      mistakes: '실수',
      pattern: '패턴',
      customMode: '사용자 문장',
      addCustom: '문장 추가',
      enterText: '외우고 싶은 문장을 입력하세요',
      saved: '저장되었습니다!'
    },
    en: {
      remember: 'Remember the words!',
      yourTurn: 'Select in order',
      reverse: 'Enter in reverse!',
      fillBlanks: 'Fill the blanks',
      findPairs: 'Find pairs',
      whatChanged: 'What changed?',
      correct: 'Correct!',
      wrong: 'Wrong',
      gameOver: 'Game Over',
      level: 'Level',
      words: 'Words',
      mistakes: 'Mistakes',
      pattern: 'Pattern',
      customMode: 'Custom Text',
      addCustom: 'Add Text',
      enterText: 'Enter text you want to memorize',
      saved: 'Saved!'
    }
  };
  
  // Content database
  private contents: Content[] = [
    // Easy level
    {
      id: 'fruits',
      type: 'words',
      title: '과일 이름',
      titleEn: 'Fruit Names',
      items: ['사과', '바나나', '포도', '딸기', '수박', '오렌지'],
      difficulty: 'easy',
      requiredLevel: 1
    },
    {
      id: 'colors',
      type: 'words',
      title: '색깔',
      titleEn: 'Colors',
      items: ['빨강', '파랑', '노랑', '초록', '보라', '하양', '검정'],
      difficulty: 'easy',
      requiredLevel: 2
    },
    {
      id: 'animals',
      type: 'words',
      title: '동물',
      titleEn: 'Animals',
      items: ['고양이', '강아지', '토끼', '호랑이', '사자', '코끼리', '기린'],
      difficulty: 'easy',
      requiredLevel: 3
    },
    {
      id: 'spring-poem',
      type: 'poetry',
      title: '봄 동시',
      titleEn: 'Spring Poem',
      items: ['봄이', '오면', '산에', '들에', '진달래', '피네'],
      difficulty: 'easy',
      requiredLevel: 4
    },
    // Medium level
    {
      id: 'proverbs',
      type: 'words',
      title: '속담',
      titleEn: 'Proverbs',
      items: ['가는', '말이', '고와야', '오는', '말이', '곱다'],
      difficulty: 'medium',
      requiredLevel: 5
    },
    {
      id: 'emotions',
      type: 'words',
      title: '감정 표현',
      titleEn: 'Emotions',
      items: ['기쁨', '슬픔', '분노', '두려움', '놀람', '사랑', '희망'],
      difficulty: 'medium',
      requiredLevel: 6
    },
    {
      id: 'yun-dong-ju',
      type: 'poetry',
      title: '서시 (윤동주)',
      titleEn: 'Prologue (Yun Dong-ju)',
      items: ['죽는', '날까지', '하늘을', '우러러', '한', '점', '부끄럼이', '없기를'],
      difficulty: 'medium',
      requiredLevel: 7
    },
    // Hard level
    {
      id: 'idioms',
      type: 'words',
      title: '사자성어',
      titleEn: 'Four-character Idioms',
      items: ['일석이조', '동문서답', '우왕좌왕', '일거양득', '좌충우돌'],
      difficulty: 'hard',
      requiredLevel: 10
    }
  ];
  
  // Pattern weights for variety
  private patternWeights: Record<MemoryPattern, number> = {
    'sequential': 20,
    'reverse': 15,
    'swiss-cheese': 15,
    'chain-reaction': 10,
    'pair-match': 10,
    'spatial': 10,
    'spot-change': 10,
    'emotion-tag': 10
  };

  constructor() {
    super({
      canvasWidth: 800,
      canvasHeight: 600,
      backgroundColor: '#ffffff',
      gameName: 'Word Memory',
      gameId: 'word-memory'
    });
    
    (window as any).currentGame = this;
  }

  protected setupGame(): void {
    if (!this.container) return;
    
    // Load language
    const savedLanguage = localStorage.getItem('flux-game-language');
    if (savedLanguage === 'ko' || savedLanguage === 'en') {
      this.language = savedLanguage;
    }
    
    // Setup HTML
    this.container.innerHTML = this.createGameHTML();
    
    // Setup canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
      
      // Mouse events
      this.canvas.addEventListener('click', this.handleClick.bind(this));
    }
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
    
    // Setup custom content UI
    this.setupCustomContentUI();
    
    // Show tutorial
    this.showTutorial();
  }
  
  private setupCustomContentUI(): void {
    const addCustomBtn = document.getElementById('add-custom-btn');
    const modal = document.getElementById('custom-modal');
    const saveBtn = document.getElementById('save-custom-btn');
    const cancelBtn = document.getElementById('cancel-custom-btn');
    const textArea = document.getElementById('custom-text') as HTMLTextAreaElement;
    
    if (addCustomBtn && modal) {
      addCustomBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        textArea.focus();
      });
    }
    
    if (cancelBtn && modal) {
      cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        textArea.value = '';
      });
    }
    
    if (saveBtn && modal && textArea) {
      saveBtn.addEventListener('click', () => {
        const text = textArea.value.trim();
        if (text) {
          this.saveCustomContent(text);
          modal.style.display = 'none';
          textArea.value = '';
          
          // Show success message
          const t = this.texts[this.language];
          this.showFloatingMessage(t.saved);
        }
      });
    }
  }
  
  private saveCustomContent(text: string): void {
    // Split text into words/phrases
    const words = text.split(/[\s,，、。.!?！？]+/).filter(w => w.length > 0);
    
    if (words.length === 0) return;
    
    const customContent: Content = {
      id: `custom-${Date.now()}`,
      type: 'words',
      title: this.language === 'ko' ? '사용자 문장' : 'Custom Text',
      titleEn: 'Custom Text',
      items: words,
      difficulty: 'easy',
      requiredLevel: 1
    };
    
    // Save to localStorage
    const customContents = this.loadCustomContentFromStorage();
    customContents.push(customContent);
    localStorage.setItem('word-memory-custom', JSON.stringify(customContents));
    
    // Add to current game
    this.contents.push(customContent);
  }
  
  private loadCustomContent(): void {
    const customContents = this.loadCustomContentFromStorage();
    this.contents.push(...customContents);
  }
  
  private loadCustomContentFromStorage(): Content[] {
    try {
      const data = localStorage.getItem('word-memory-custom');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load custom content:', error);
      return [];
    }
  }
  
  private showFloatingMessage(message: string): void {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #4ecdc4;
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      font-size: 20px;
      font-weight: bold;
      z-index: 1001;
      animation: fadeInOut 2s ease-in-out;
    `;
    messageDiv.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
      style.remove();
    }, 2000);
  }

  protected setupGame(): void {
    if (!this.container) return;
    
    // Create game HTML
    this.container.innerHTML = this.createGameHTML();
    
    // Get canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;
    
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    
    this.ctx = this.canvas.getContext('2d');
    
    // Setup event listeners
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
    
    // Setup share button
    this.setupShareButton();
    
    // Setup custom content button
    const addCustomBtn = document.getElementById('add-custom-btn');
    if (addCustomBtn) {
      addCustomBtn.addEventListener('click', () => {
        const modal = document.getElementById('custom-modal');
        if (modal) modal.style.display = 'flex';
      });
    }
    
    const saveCustomBtn = document.getElementById('save-custom-btn');
    if (saveCustomBtn) {
      saveCustomBtn.addEventListener('click', () => {
        const textarea = document.getElementById('custom-text') as HTMLTextAreaElement;
        if (textarea && textarea.value.trim()) {
          this.saveCustomContent(textarea.value.trim());
          textarea.value = '';
          const modal = document.getElementById('custom-modal');
          if (modal) modal.style.display = 'none';
        }
      });
    }
    
    const cancelCustomBtn = document.getElementById('cancel-custom-btn');
    if (cancelCustomBtn) {
      cancelCustomBtn.addEventListener('click', () => {
        const modal = document.getElementById('custom-modal');
        if (modal) modal.style.display = 'none';
      });
    }
    
    // Set window reference for restart functionality
    (window as any).currentGame = this;
    
    // Show tutorial
    this.showTutorial();
  }

  protected initialize(): void {
    this.level = 1;
    this.score = 0;
    this.mistakes = 0;
    this.wordsCompleted = 0;
    this.gameOver = false;
    this.particles = [];
    
    // Load custom content
    this.loadCustomContent();
    
    // Start first content
    this.selectNextContent();
  }

  private selectNextContent(): void {
    const availableContents = this.contents.filter(c => c.requiredLevel <= this.level);
    if (availableContents.length === 0) {
      this.endGame();
      return;
    }
    
    this.currentContent = availableContents[Math.floor(Math.random() * availableContents.length)];
    this.currentIndex = 0;
    
    // Select pattern based on level
    this.selectPattern();
    
    // Start showing words
    this.startRound();
  }

  private selectPattern(): void {
    // For early levels, use simpler patterns
    if (this.level <= 3) {
      this.currentPattern = 'sequential';
      return;
    }
    
    // Weighted random selection
    const patterns = Object.keys(this.patternWeights) as MemoryPattern[];
    const weights = patterns.map(p => this.patternWeights[p]);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < patterns.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        this.currentPattern = patterns[i];
        break;
      }
    }
  }

  private async startRound(): Promise<void> {
    if (!this.currentContent || this.gameOver) return;
    
    this.isShowingWords = true;
    this.isPlayerTurn = false;
    this.selectedWords = [];
    this.playerInput = [];
    
    // Prepare words based on pattern
    this.prepareWords();
    
    // Debug log
    console.log('Starting round with words:', this.displayWords);
    console.log('Pattern:', this.currentPattern);
    
    // Show words
    await this.showWords();
    
    // Start player turn
    this.isShowingWords = false;
    this.isPlayerTurn = true;
    
    // Create input options
    this.createInputOptions();
  }

  private prepareWords(): void {
    if (!this.currentContent) return;
    
    // Determine how many words to show
    const wordCount = Math.min(
      3 + Math.floor(this.level / 2),
      this.currentContent.items.length
    );
    
    // Get words for this round
    const words = this.currentContent.items.slice(0, wordCount);
    
    // Apply pattern transformations
    switch (this.currentPattern) {
      case 'sequential':
        this.currentWords = words.map(text => ({ text }));
        this.displayWords = [...this.currentWords];
        break;
        
      case 'reverse':
        this.currentWords = words.map(text => ({ text }));
        this.displayWords = [...this.currentWords];
        break;
        
      case 'swiss-cheese':
        this.currentWords = words.map(text => ({ text }));
        // Create display with blanks
        this.displayWords = this.currentWords.map((word, index) => {
          const showBlank = Math.random() < 0.4 && index > 0 && index < words.length - 1;
          return { text: showBlank ? '___' : word.text };
        });
        break;
        
      case 'spatial':
        // Assign random positions
        const positions = this.generateRandomPositions(wordCount);
        this.currentWords = words.map((text, i) => ({
          text,
          position: positions[i]
        }));
        this.displayWords = [...this.currentWords];
        break;
        
      case 'emotion-tag':
        const emotions = ['😊', '😢', '😠', '😮', '😍'];
        this.currentWords = words.map(text => ({
          text,
          emotion: emotions[Math.floor(Math.random() * emotions.length)]
        }));
        this.displayWords = [...this.currentWords];
        break;
        
      default:
        this.currentWords = words.map(text => ({ text }));
        this.displayWords = [...this.currentWords];
    }
    
    this.currentIndex++;
  }

  private generateRandomPositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const margin = 100;
    const gridSize = 150;
    
    for (let i = 0; i < count; i++) {
      let x, y;
      let attempts = 0;
      
      do {
        x = margin + Math.random() * (this.config.canvasWidth - margin * 2);
        y = margin + Math.random() * (this.config.canvasHeight - margin * 2);
        attempts++;
      } while (
        attempts < 50 && 
        positions.some(pos => 
          Math.abs(pos.x - x) < gridSize && 
          Math.abs(pos.y - y) < gridSize
        )
      );
      
      positions.push({ x, y });
    }
    
    return positions;
  }

  private async showWords(): Promise<void> {
    // Show words for a duration based on count and pattern
    const baseTime = 1000;
    const timePerWord = 500;
    const totalTime = baseTime + (this.displayWords.length * timePerWord);
    
    // For certain patterns, show longer
    const duration = ['spatial', 'emotion-tag'].includes(this.currentPattern) 
      ? totalTime * 1.5 
      : totalTime;
    
    this.showTimer = duration;
    const startTime = Date.now();
    
    // Update timer while showing
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      this.showTimer = Math.max(0, duration - elapsed);
      
      if (this.showTimer <= 0) {
        clearInterval(timerInterval);
      }
    }, 50);
    
    await this.delay(duration);
    clearInterval(timerInterval);
  }

  private createInputOptions(): void {
    this.wordButtons = [];
    
    // Get words for buttons based on pattern
    let buttonWords: string[] = [];
    
    switch (this.currentPattern) {
      case 'sequential':
      case 'spatial':
      case 'emotion-tag':
        buttonWords = [...this.currentWords.map(w => w.text)];
        // Shuffle for buttons
        buttonWords.sort(() => Math.random() - 0.5);
        break;
        
      case 'reverse':
        buttonWords = [...this.currentWords.map(w => w.text)];
        break;
        
      case 'swiss-cheese':
        // Only show words that were blanked
        buttonWords = this.currentWords
          .filter((w, i) => this.displayWords[i].text === '___')
          .map(w => w.text);
        // Add some distractors
        const distractors = ['그리고', '하지만', '그래서', '또한'];
        buttonWords.push(...distractors.slice(0, 2));
        buttonWords.sort(() => Math.random() - 0.5);
        break;
    }
    
    // Create button layout
    const buttonWidth = 120;
    const buttonHeight = 50;
    const padding = 20;
    const startY = 400;
    
    buttonWords.forEach((word, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      
      this.wordButtons.push({
        text: word,
        x: 100 + col * (buttonWidth + padding),
        y: startY + row * (buttonHeight + padding),
        width: buttonWidth,
        height: buttonHeight
      });
    });
  }

  private handleClick(event: MouseEvent): void {
    if (!this.canvas || !this.isPlayerTurn || this.gameOver) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check button clicks
    for (const button of this.wordButtons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        this.handleWordSelection(button.text);
        break;
      }
    }
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.isPlayerTurn || this.gameOver) return;
    
    // Number keys for quick selection
    const num = parseInt(event.key);
    if (num >= 1 && num <= this.wordButtons.length) {
      this.handleWordSelection(this.wordButtons[num - 1].text);
    }
  }

  private handleWordSelection(word: string): void {
    this.selectedWords.push(word);
    
    // Check based on pattern
    let isCorrect = false;
    
    switch (this.currentPattern) {
      case 'sequential':
        isCorrect = this.checkSequential();
        break;
        
      case 'reverse':
        isCorrect = this.checkReverse();
        break;
        
      case 'swiss-cheese':
        isCorrect = this.checkSwissCheese();
        break;
        
      case 'spatial':
      case 'emotion-tag':
        isCorrect = this.checkSequential(); // Same as sequential for now
        break;
    }
    
    if (isCorrect) {
      if (this.isRoundComplete()) {
        this.handleRoundComplete();
      } else {
        // Correct but not complete yet
        this.playCorrectSound();
        this.createParticles(400, 300, 5, '#4ecdc4', 3);
      }
    } else {
      this.handleMistake();
    }
  }

  private checkSequential(): boolean {
    const index = this.selectedWords.length - 1;
    return this.selectedWords[index] === this.currentWords[index].text;
  }

  private checkReverse(): boolean {
    const index = this.selectedWords.length - 1;
    const reverseIndex = this.currentWords.length - 1 - index;
    return this.selectedWords[index] === this.currentWords[reverseIndex].text;
  }

  private checkSwissCheese(): boolean {
    // Check only blanked positions
    const blankIndices = this.displayWords
      .map((w, i) => w.text === '___' ? i : -1)
      .filter(i => i !== -1);
    
    const selectionIndex = this.selectedWords.length - 1;
    if (selectionIndex >= blankIndices.length) return false;
    
    const wordIndex = blankIndices[selectionIndex];
    return this.selectedWords[selectionIndex] === this.currentWords[wordIndex].text;
  }

  private isRoundComplete(): boolean {
    switch (this.currentPattern) {
      case 'sequential':
      case 'reverse':
      case 'spatial':
      case 'emotion-tag':
        return this.selectedWords.length === this.currentWords.length;
        
      case 'swiss-cheese':
        const blankCount = this.displayWords.filter(w => w.text === '___').length;
        return this.selectedWords.length === blankCount;
        
      default:
        return this.selectedWords.length === this.currentWords.length;
    }
  }

  private handleRoundComplete(): void {
    this.wordsCompleted += this.currentWords.length;
    this.level++;
    
    // Score calculation
    const baseScore = 100 * this.currentWords.length;
    const patternBonus = this.currentPattern === 'sequential' ? 0 : 50;
    const perfectBonus = this.mistakes === 0 ? 100 : 0;
    
    this.updateScore(baseScore + patternBonus + perfectBonus);
    
    // Success feedback
    this.playSuccessSound();
    this.showSuccessMessage();
    
    // Check achievements
    this.checkAchievements();
    
    // Next round
    setTimeout(() => {
      this.selectNextContent();
    }, 2000);
  }

  private handleMistake(): void {
    this.mistakes++;
    this.selectedWords.pop(); // Remove wrong selection
    
    // Feedback
    this.playErrorSound();
    this.createParticles(400, 300, 5, '#ff6b6b', 3);
    
    if (this.mistakes >= this.maxMistakes) {
      this.endGame();
    }
    
    this.updateUI();
  }

  private showSuccessMessage(): void {
    const messages = {
      ko: ['완벽해요!', '대단해요!', '훌륭해요!', '천재시네요!'],
      en: ['Perfect!', 'Amazing!', 'Excellent!', 'Genius!']
    };
    
    const message = messages[this.language][Math.floor(Math.random() * messages[this.language].length)];
    
    // Create floating text particle
    for (let i = 0; i < 10; i++) {
      this.createParticles(
        300 + Math.random() * 200,
        200 + Math.random() * 100,
        3,
        ['#4ecdc4', '#ffe66d', '#ff6b6b'][Math.floor(Math.random() * 3)],
        4
      );
    }
  }

  protected update(deltaTime: number): void {
    if (this.gameOver) return;
    
    // Update particles
    this.updateParticles(deltaTime);
  }

  protected draw(): void {
    if (!this.ctx) return;
    
    // Clear and draw background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    
    // Draw light grid pattern for visual appeal
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.config.canvasWidth; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.config.canvasHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.config.canvasHeight; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.config.canvasWidth, y);
      this.ctx.stroke();
    }
    
    // Draw based on state
    if (this.isShowingWords) {
      this.drawWordsDisplay();
    } else if (this.isPlayerTurn) {
      this.drawInputInterface();
    } else {
      // Loading state
      this.ctx.fillStyle = '#666';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('준비 중...', 400, 300);
    }
    
    // Draw particles
    this.drawParticles();
    
    // Draw UI
    this.drawUI();
  }

  private drawWordsDisplay(): void {
    if (!this.ctx) return;
    
    const t = this.texts[this.language];
    
    // Show content title if custom
    if (this.currentContent && this.currentContent.id.startsWith('custom-')) {
      this.ctx.fillStyle = '#667eea';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.customMode, 400, 40);
    }
    
    // Title
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.currentPattern === 'reverse' ? t.reverse : t.remember,
      400, 80
    );
    
    // Pattern-specific display
    switch (this.currentPattern) {
      case 'sequential':
      case 'reverse':
      case 'swiss-cheese':
        this.drawSequentialWords();
        break;
        
      case 'spatial':
        this.drawSpatialWords();
        break;
        
      case 'emotion-tag':
        this.drawEmotionWords();
        break;
    }
    
    // Progress bar
    if (this.showTimer > 0) {
      const baseTime = 1000;
      const timePerWord = 500;
      const totalTime = baseTime + (this.displayWords.length * timePerWord);
      const maxTime = ['spatial', 'emotion-tag'].includes(this.currentPattern) 
        ? totalTime * 1.5 
        : totalTime;
      
      const progress = this.showTimer / maxTime;
      
      this.ctx.strokeStyle = '#ddd';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(200, 500, 400, 20);
      this.ctx.fillStyle = '#4ecdc4';
      this.ctx.fillRect(202, 502, 396 * progress, 16);
    }
  }

  private drawSequentialWords(): void {
    if (!this.ctx) return;
    
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#333333';
    
    const words = this.displayWords.map(w => w.text).join(' → ');
    this.ctx.fillText(words, 400, 300);
    
    // Debug - also show word count
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#666666';
    this.ctx.fillText(`${this.displayWords.length}개 단어`, 400, 350);
  }

  private drawSpatialWords(): void {
    if (!this.ctx) return;
    
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    
    this.displayWords.forEach((word, index) => {
      if (word.position) {
        // Draw background circle
        this.ctx.fillStyle = '#667eea';
        this.ctx.globalAlpha = 0.2;
        this.ctx.beginPath();
        this.ctx.arc(word.position.x, word.position.y, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Draw word
        this.ctx.fillStyle = '#333333';
        this.ctx.fillText(word.text, word.position.x, word.position.y + 10);
      }
    });
  }

  private drawEmotionWords(): void {
    if (!this.ctx) return;
    
    this.ctx.textAlign = 'center';
    
    const startX = 200;
    const spacing = 150;
    const y = 300;
    
    this.displayWords.forEach((word, index) => {
      const x = startX + index * spacing;
      
      // Draw emotion
      if (word.emotion) {
        this.ctx.font = '48px Arial';
        this.ctx.fillText(word.emotion, x, y - 50);
      }
      
      // Draw word
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = '#333333';
      this.ctx.fillText(word.text, x, y + 20);
    });
  }

  private drawInputInterface(): void {
    if (!this.ctx) return;
    
    const t = this.texts[this.language];
    
    // Instructions
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    
    let instruction = t.yourTurn;
    switch (this.currentPattern) {
      case 'reverse': instruction = t.reverse; break;
      case 'swiss-cheese': instruction = t.fillBlanks; break;
    }
    
    this.ctx.fillText(instruction, 400, 80);
    
    // Show selected words
    if (this.selectedWords.length > 0) {
      this.ctx.font = '28px Arial';
      this.ctx.fillStyle = '#4ecdc4';
      const selected = this.selectedWords.join(' → ');
      this.ctx.fillText(selected, 400, 150);
    }
    
    // Draw word buttons
    this.wordButtons.forEach((button, index) => {
      // Button background
      this.ctx.fillStyle = this.selectedWords.includes(button.text) 
        ? '#95a5a6'
        : '#667eea';
      this.ctx.fillRect(button.x, button.y, button.width, button.height);
      
      // Button text
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        button.text,
        button.x + button.width / 2,
        button.y + button.height / 2 + 6
      );
      
      // Number hint
      this.ctx.font = '12px Arial';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${index + 1}`, button.x + 5, button.y + 15);
    });
  }

  private drawUI(): void {
    if (!this.ctx) return;
    
    const t = this.texts[this.language];
    
    // Pattern indicator
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      `${t.pattern}: ${this.getPatternName()}`,
      780, 30
    );
  }

  private getPatternName(): string {
    const names = {
      ko: {
        'sequential': '순차',
        'reverse': '역순',
        'swiss-cheese': '빈칸',
        'chain-reaction': '연쇄',
        'pair-match': '짝',
        'spatial': '위치',
        'spot-change': '변화',
        'emotion-tag': '감정'
      },
      en: {
        'sequential': 'Sequential',
        'reverse': 'Reverse',
        'swiss-cheese': 'Fill Blanks',
        'chain-reaction': 'Chain',
        'pair-match': 'Pairs',
        'spatial': 'Spatial',
        'spot-change': 'Changes',
        'emotion-tag': 'Emotions'
      }
    };
    
    return names[this.language][this.currentPattern] || this.currentPattern;
  }

  private updateUI(): void {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('highscore')!.textContent = this.highScore.toString();
    document.getElementById('level')!.textContent = this.level.toString();
    document.getElementById('mistakes')!.textContent = '❌'.repeat(this.mistakes);
  }

  private checkAchievements(): void {
    if (this.wordsCompleted >= 50) {
      achievementSystem.checkAchievement('word-memory-50-words');
    }
    if (this.level >= 10) {
      achievementSystem.checkAchievement('word-memory-level-10');
    }
    if (this.score >= 5000 && this.mistakes === 0) {
      achievementSystem.checkAchievement('word-memory-perfect');
    }
  }

  private playCorrectSound(): void {
    // Simple correct sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  private playSuccessSound(): void {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C E G
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }, i * 100);
    });
  }

  private playErrorSound(): void {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private showTutorial(): void {
    const tutorialConfig: TutorialConfig = {
      gameId: 'word-memory',
      showOnFirstPlay: true,
      version: 1,
      steps: [
        {
          id: 'welcome',
          title: this.language === 'ko' ? '단어 기억 게임!' : 'Word Memory Game!',
          description: this.language === 'ko' ?
            '다양한 패턴으로 단어를 기억하는 게임입니다.' :
            'Remember words with various patterns.',
          position: 'center',
          nextTrigger: 'click'
        },
        {
          id: 'patterns',
          title: this.language === 'ko' ? '다양한 패턴' : 'Various Patterns',
          description: this.language === 'ko' ?
            '순차, 역순, 빈칸 채우기 등 다양한 방식으로 도전하세요!' :
            'Challenge yourself with sequential, reverse, fill-in-the-blank patterns!',
          position: 'center',
          nextTrigger: 'click'
        }
      ]
    };
    
    tutorialSystem.startTutorial(tutorialConfig);
  }

  protected createGameHTML(): string {
    const t = this.texts[this.language];
    
    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">${t.level}</div>
        <div id="level" style="font-size: 24px; font-weight: bold;">1</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">${t.mistakes}</div>
        <div id="mistakes" style="font-size: 24px; font-weight: bold;"></div>
      </div>
    `;
    
    const html = super.createGameHTML(additionalStats);
    
    // Add custom content button
    const customButton = `
      <div style="
        position: absolute;
        bottom: 20px;
        right: 20px;
      ">
        <button id="add-custom-btn" style="
          padding: 10px 20px;
          font-size: 16px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">
          ✏️ ${t.addCustom}
        </button>
      </div>
      
      <!-- Custom Content Modal -->
      <div id="custom-modal" style="
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
        justify-content: center;
        align-items: center;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          max-width: 500px;
          width: 90%;
        ">
          <h3 style="margin-bottom: 20px;">${t.addCustom}</h3>
          <textarea id="custom-text" style="
            width: 100%;
            height: 150px;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            resize: vertical;
          " placeholder="${t.enterText}"></textarea>
          <div style="
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          ">
            <button id="save-custom-btn" style="
              padding: 10px 20px;
              background: #4ecdc4;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
            ">저장</button>
            <button id="cancel-custom-btn" style="
              padding: 10px 20px;
              background: #999;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
            ">취소</button>
          </div>
        </div>
      </div>
    `;
    
    return html.replace('</div>', customButton + '</div>');
  }

  private endGame(): void {
    this.gameOver = true;
    
    // Submit score
    this.submitScoreToLeaderboard();
    
    const t = this.texts[this.language];
    this.createGameOverlay(t.gameOver, this.score);
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }
}