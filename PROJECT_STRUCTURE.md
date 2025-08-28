# 프로젝트 구조 설계

## 폴더 구조

```
flux-game/
├── public/
│   ├── index.html
│   ├── css/
│   │   ├── common/
│   │   │   ├── base.css          # 기본 스타일
│   │   │   ├── components.css    # 공통 컴포넌트
│   │   │   └── animations.css    # 애니메이션
│   │   └── games/
│   │       ├── casual/           # 캐주얼 게임
│   │       ├── puzzle/           # 퍼즐 게임
│   │       ├── action/           # 액션 게임
│   │       └── strategy/         # 전략 게임
│   └── js/
│       ├── core/
│       │   ├── GameEngine.js     # 게임 엔진
│       │   ├── BaseGame.js       # 기본 게임 클래스
│       │   ├── GameManager.js    # 게임 관리자
│       │   └── EventBus.js       # 이벤트 시스템
│       ├── common/
│       │   ├── utils/
│       │   │   ├── Math.js       # 수학 유틸리티
│       │   │   ├── Storage.js    # 로컬 스토리지
│       │   │   ├── Audio.js      # 사운드 매니저
│       │   │   └── Analytics.js  # 분석 도구
│       │   ├── components/
│       │   │   ├── Button.js     # 버튼 컴포넌트
│       │   │   ├── Modal.js      # 모달 컴포넌트
│       │   │   ├── Score.js      # 점수 표시
│       │   │   ├── Timer.js      # 타이머
│       │   │   └── Leaderboard.js # 리더보드
│       │   └── monetization/
│       │       ├── AdManager.js  # 광고 관리자
│       │       ├── IAP.js        # 인앱 결제
│       │       └── Rewards.js    # 보상 시스템
│       └── games/
│           ├── casual/
│           │   ├── CookieClicker.js
│           │   ├── FluxJump.js
│           │   └── BubbleShooter.js
│           ├── puzzle/
│           │   ├── Memory.js
│           │   ├── Sliding.js
│           │   ├── Game2048.js
│           │   └── Minesweeper.js
│           ├── action/
│           │   ├── Snake.js
│           │   ├── Breakout.js
│           │   └── SpaceInvaders.js
│           └── strategy/
│               ├── TicTacToe.js
│               ├── TowerDefense.js
│               └── Chess.js
```

## 공통 모듈 설계

### 1. BaseGame 클래스 확장
```javascript
class BaseGame {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.category = config.category;
        this.difficulty = config.difficulty;
        this.hasAds = config.hasAds || true;
        this.adPlacements = config.adPlacements || ['start', 'gameover'];
    }
    
    // 광고 표시 포인트
    showAd(placement) {
        if (this.hasAds && window.AdManager) {
            window.AdManager.show(placement);
        }
    }
    
    // 분석 이벤트
    trackEvent(eventName, params) {
        if (window.Analytics) {
            window.Analytics.track(eventName, params);
        }
    }
}
```

### 2. 광고 시스템 인터페이스
```javascript
class AdManager {
    constructor() {
        this.adContainer = null;
        this.isTestMode = true; // 개발 중에는 테스트 모드
    }
    
    init() {
        this.createAdContainer();
        this.loadAdSDK();
    }
    
    createAdContainer() {
        // 광고 컨테이너 생성
        const container = document.createElement('div');
        container.id = 'ad-container';
        container.className = 'ad-container hidden';
        document.body.appendChild(container);
        this.adContainer = container;
    }
    
    show(placement) {
        // 테스트 모드에서는 더미 광고 표시
        if (this.isTestMode) {
            this.showTestAd(placement);
        } else {
            // 실제 광고 SDK 호출
            this.showRealAd(placement);
        }
    }
    
    showTestAd(placement) {
        this.adContainer.innerHTML = `
            <div class="test-ad">
                <h3>광고 자리 (${placement})</h3>
                <p>여기에 실제 광고가 표시됩니다</p>
                <button onclick="window.AdManager.close()">닫기</button>
            </div>
        `;
        this.adContainer.classList.remove('hidden');
    }
    
    close() {
        this.adContainer.classList.add('hidden');
    }
}
```

### 3. 공통 UI 컴포넌트

#### Score Component
```javascript
class ScoreComponent {
    constructor(container) {
        this.container = container;
        this.score = 0;
        this.highScore = 0;
        this.init();
    }
    
    init() {
        this.element = document.createElement('div');
        this.element.className = 'score-display';
        this.container.appendChild(this.element);
        this.render();
    }
    
    update(score) {
        this.score = score;
        if (score > this.highScore) {
            this.highScore = score;
            this.saveHighScore();
        }
        this.render();
    }
    
    render() {
        this.element.innerHTML = `
            <div class="current-score">점수: ${this.score}</div>
            <div class="high-score">최고: ${this.highScore}</div>
        `;
    }
}
```

#### Modal Component
```javascript
class Modal {
    static show(options) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${options.title}</h2>
                <p>${options.message}</p>
                <div class="modal-buttons">
                    ${options.buttons.map(btn => 
                        `<button onclick="${btn.action}">${btn.text}</button>`
                    ).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    static close(modal) {
        modal.remove();
    }
}
```

## 게임 카테고리 정의

### 1. 캐주얼 (Casual)
- 간단한 조작
- 짧은 플레이 시간
- 즉각적인 만족감
- 예: 쿠키 클리커, 플럭스 점프

### 2. 퍼즐 (Puzzle)
- 논리적 사고 필요
- 단계별 난이도
- 명확한 목표
- 예: 2048, 지뢰찾기, 메모리

### 3. 액션 (Action)
- 빠른 반응 속도
- 실시간 조작
- 스코어 경쟁
- 예: 스네이크, 브레이크아웃

### 4. 전략 (Strategy)
- 계획적 사고
- 리소스 관리
- 장기적 목표
- 예: 틱택토, 타워 디펜스

## 수익화 전략

### 1. 광고 배치
- **게임 시작 전**: 짧은 배너 광고
- **게임 오버 시**: 전면 광고 (5초 스킵)
- **보상형 광고**: 추가 생명, 힌트, 코인
- **하단 배너**: 게임 중 지속 표시

### 2. 인앱 결제
- **광고 제거**: ₩3,300
- **프리미엄 스킨**: ₩1,100 ~ ₩5,500
- **게임 내 재화**: 코인, 젬, 에너지
- **VIP 멤버십**: 월 ₩5,500

### 3. 일일 보상
- 매일 접속 보상
- 연속 접속 보너스
- 광고 시청 보상 2배
- 주간 챌린지

## 개발 우선순위

1. **Phase 1 (1주차)**
   - 프로젝트 구조 재정비 ✓
   - 공통 모듈 구축
   - 광고 시스템 기본 구현
   - 쿠키 클리커 게임

2. **Phase 2 (2주차)**
   - 메모리 카드 게임
   - 슬라이딩 퍼즐
   - 리더보드 시스템

3. **Phase 3 (3주차)**
   - 버블 슈터
   - 스페이스 인베이더
   - 보상 시스템

4. **Phase 4 (4주차)**
   - 타워 디펜스
   - 인앱 결제 연동
   - 최적화 및 배포