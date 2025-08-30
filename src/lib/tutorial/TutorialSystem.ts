// TutorialSystem.ts - 게임별 튜토리얼 시스템

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightElement?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform
  condition?: () => boolean; // Optional condition to check before showing
  nextTrigger?: 'click' | 'action' | 'time' | 'manual'; // How to advance to next step
  delay?: number; // Delay before showing (ms)
}

export interface TutorialConfig {
  gameId: string;
  steps: TutorialStep[];
  showOnFirstPlay?: boolean;
  version?: number; // Tutorial version, increment to re-show to users
}

export class TutorialSystem {
  private static instance: TutorialSystem;
  private readonly STORAGE_KEY_PREFIX = 'flux-game-tutorial-';
  private currentTutorial: TutorialConfig | null = null;
  private currentStepIndex: number = 0;
  private tutorialOverlay: HTMLElement | null = null;
  private isActive: boolean = false;
  private callbacks: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): TutorialSystem {
    if (!TutorialSystem.instance) {
      TutorialSystem.instance = new TutorialSystem();
    }
    return TutorialSystem.instance;
  }

  // 튜토리얼 시작
  startTutorial(config: TutorialConfig, forceShow: boolean = false): void {
    if (this.isActive) return;

    const hasSeenKey = `${this.STORAGE_KEY_PREFIX}${config.gameId}-v${config.version || 1}`;
    const hasSeen = localStorage.getItem(hasSeenKey) === 'true';

    if (!forceShow && hasSeen && config.showOnFirstPlay) {
      return;
    }

    this.currentTutorial = config;
    this.currentStepIndex = 0;
    this.isActive = true;

    this.createOverlay();
    this.showCurrentStep();

    // Mark as seen
    localStorage.setItem(hasSeenKey, 'true');
  }

  // 튜토리얼 종료
  endTutorial(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.currentTutorial = null;
    this.currentStepIndex = 0;
    
    if (this.tutorialOverlay) {
      this.tutorialOverlay.remove();
      this.tutorialOverlay = null;
    }

    // Execute any cleanup callbacks
    this.callbacks.forEach(callback => callback());
    this.callbacks.clear();
  }

  // 다음 단계로 진행
  nextStep(): void {
    if (!this.currentTutorial || !this.isActive) return;

    this.currentStepIndex++;
    
    if (this.currentStepIndex >= this.currentTutorial.steps.length) {
      this.endTutorial();
    } else {
      this.showCurrentStep();
    }
  }

  // 이전 단계로 돌아가기
  previousStep(): void {
    if (!this.currentTutorial || !this.isActive || this.currentStepIndex === 0) return;

    this.currentStepIndex--;
    this.showCurrentStep();
  }

  // 특정 단계로 이동
  goToStep(stepId: string): void {
    if (!this.currentTutorial || !this.isActive) return;

    const index = this.currentTutorial.steps.findIndex(step => step.id === stepId);
    if (index !== -1) {
      this.currentStepIndex = index;
      this.showCurrentStep();
    }
  }

  // 현재 단계 표시
  private showCurrentStep(): void {
    if (!this.currentTutorial || !this.tutorialOverlay) return;

    const step = this.currentTutorial.steps[this.currentStepIndex];
    
    // Check condition if exists
    if (step.condition && !step.condition()) {
      this.nextStep();
      return;
    }

    // Clear previous highlights
    this.clearHighlights();

    // Apply delay if specified
    setTimeout(() => {
      this.renderStep(step);
      
      // Execute action if exists
      if (step.action) {
        step.action();
      }

      // Setup next trigger
      this.setupNextTrigger(step);
    }, step.delay || 0);
  }

  // 단계 렌더링
  private renderStep(step: TutorialStep): void {
    if (!this.tutorialOverlay) return;

    const content = `
      <div class="tutorial-content" style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        max-width: 400px;
        position: relative;
        animation: tutorialFadeIn 0.3s ease-out;
      ">
        <button class="tutorial-close" style="
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        ">×</button>
        
        <h3 style="
          margin: 0 0 10px 0;
          font-size: 20px;
          color: #333;
        ">${step.title}</h3>
        
        <p style="
          margin: 0 0 20px 0;
          font-size: 16px;
          color: #666;
          line-height: 1.5;
        ">${step.description}</p>
        
        <div class="tutorial-navigation" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div class="tutorial-progress" style="
            font-size: 14px;
            color: #999;
          ">
            ${this.currentStepIndex + 1} / ${this.currentTutorial!.steps.length}
          </div>
          
          <div class="tutorial-buttons" style="
            display: flex;
            gap: 10px;
          ">
            ${this.currentStepIndex > 0 ? `
              <button class="tutorial-prev" style="
                padding: 8px 16px;
                background: #f0f0f0;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
              ">이전</button>
            ` : ''}
            
            ${this.currentStepIndex < this.currentTutorial!.steps.length - 1 ? `
              <button class="tutorial-next" style="
                padding: 8px 16px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
              ">다음</button>
            ` : `
              <button class="tutorial-finish" style="
                padding: 8px 16px;
                background: linear-gradient(135deg, #4ade80, #22c55e);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
              ">완료</button>
            `}
          </div>
        </div>
      </div>
    `;

    this.tutorialOverlay.innerHTML = content;

    // Position the tutorial box
    this.positionTutorial(step);

    // Highlight element if specified
    if (step.highlightElement) {
      this.highlightElement(step.highlightElement);
    }

    // Add event listeners
    this.setupEventListeners();
  }

  // 튜토리얼 위치 설정
  private positionTutorial(step: TutorialStep): void {
    if (!this.tutorialOverlay) return;

    const content = this.tutorialOverlay.querySelector('.tutorial-content') as HTMLElement;
    if (!content) return;

    // Reset position
    content.style.position = 'fixed';
    content.style.transform = 'none';

    switch (step.position) {
      case 'top':
        content.style.top = '20px';
        content.style.left = '50%';
        content.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        content.style.bottom = '20px';
        content.style.left = '50%';
        content.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        content.style.left = '20px';
        content.style.top = '50%';
        content.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        content.style.right = '20px';
        content.style.top = '50%';
        content.style.transform = 'translateY(-50%)';
        break;
      case 'center':
      default:
        content.style.top = '50%';
        content.style.left = '50%';
        content.style.transform = 'translate(-50%, -50%)';
        break;
    }

    // If highlighting an element, position relative to it
    if (step.highlightElement) {
      const element = document.querySelector(step.highlightElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Position below the element by default
        content.style.position = 'absolute';
        content.style.top = `${rect.bottom + 10}px`;
        content.style.left = `${rect.left + rect.width / 2}px`;
        content.style.transform = 'translateX(-50%)';
        
        // Adjust if goes off screen
        const contentRect = content.getBoundingClientRect();
        if (contentRect.right > window.innerWidth) {
          content.style.left = 'auto';
          content.style.right = '20px';
          content.style.transform = 'none';
        }
        if (contentRect.bottom > window.innerHeight) {
          content.style.top = `${rect.top - contentRect.height - 10}px`;
        }
      }
    }
  }

  // 요소 하이라이트
  private highlightElement(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) return;

    element.classList.add('tutorial-highlight');
    
    // Add highlight styles if not already present
    if (!document.querySelector('#tutorial-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'tutorial-highlight-styles';
      style.innerHTML = `
        .tutorial-highlight {
          position: relative;
          z-index: 10001;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5);
          animation: tutorialPulse 2s infinite;
        }
        
        @keyframes tutorialPulse {
          0% { box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0.3); }
          100% { box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5); }
        }
        
        @keyframes tutorialFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 하이라이트 제거
  private clearHighlights(): void {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }

  // 다음 트리거 설정
  private setupNextTrigger(step: TutorialStep): void {
    if (!step.nextTrigger || step.nextTrigger === 'manual') return;

    switch (step.nextTrigger) {
      case 'click':
        const clickHandler = () => {
          document.removeEventListener('click', clickHandler);
          this.nextStep();
        };
        // Delay to avoid immediate trigger
        setTimeout(() => {
          document.addEventListener('click', clickHandler);
          this.callbacks.set('click', () => document.removeEventListener('click', clickHandler));
        }, 100);
        break;
        
      case 'time':
        const timeoutId = setTimeout(() => {
          this.nextStep();
        }, 3000); // 3 seconds by default
        this.callbacks.set('time', () => clearTimeout(timeoutId));
        break;
        
      case 'action':
        // Game will call nextStep() when action is completed
        break;
    }
  }

  // 이벤트 리스너 설정
  private setupEventListeners(): void {
    if (!this.tutorialOverlay) return;

    const closeBtn = this.tutorialOverlay.querySelector('.tutorial-close');
    const prevBtn = this.tutorialOverlay.querySelector('.tutorial-prev');
    const nextBtn = this.tutorialOverlay.querySelector('.tutorial-next');
    const finishBtn = this.tutorialOverlay.querySelector('.tutorial-finish');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.endTutorial());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    if (finishBtn) {
      finishBtn.addEventListener('click', () => this.endTutorial());
    }
  }

  // 오버레이 생성
  private createOverlay(): void {
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.id = 'tutorial-overlay';
    this.tutorialOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      pointer-events: none;
    `;
    
    // Allow clicks on tutorial content
    this.tutorialOverlay.addEventListener('click', (e) => {
      if (e.target === this.tutorialOverlay) {
        e.stopPropagation();
      }
    });

    document.body.appendChild(this.tutorialOverlay);
  }

  // 튜토리얼 재설정 (개발/테스트용)
  resetTutorial(gameId: string, version: number = 1): void {
    const hasSeenKey = `${this.STORAGE_KEY_PREFIX}${gameId}-v${version}`;
    localStorage.removeItem(hasSeenKey);
  }

  // 모든 튜토리얼 재설정
  resetAllTutorials(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.STORAGE_KEY_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
}

// 싱글톤 인스턴스 export
export const tutorialSystem = TutorialSystem.getInstance();