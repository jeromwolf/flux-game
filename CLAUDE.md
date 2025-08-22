# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flux Game은 지하철에서 할 수 있는 간단한 게임 꾸러미입니다. Kelly를 위한 모바일 최적화된 웹 게임 컬렉션으로, 수익화 시스템과 고품질 사운드/비주얼 효과를 갖춘 완성도 높은 게임들을 제공합니다.

## Context Summary

2024년 12월부터 개발된 이 프로젝트는 Kelly가 지하철에서 간단히 즐길 수 있는 게임 모음으로 시작되어, 현재 9개의 완성된 게임과 확장 가능한 엔터프라이즈급 아키텍처를 갖춘 게임 플랫폼으로 발전했습니다.

### 주요 특징
- **9개의 완성된 게임**: 다양한 장르와 난이도
- **모바일 퍼스트 디자인**: 터치, 제스처, 반응형 UI
- **수익화 시스템**: 광고 통합 (AdManager)
- **프리미엄 사운드**: Web Audio API 기반 동적 사운드 생성
- **파티클 시스템**: Canvas 기반 고품질 비주얼 효과
- **컴포넌트 아키텍처**: 확장성과 유지보수성 극대화

## Development Commands

- **웹 서버 실행**: `npm start` 또는 `npm run dev` (포트 3100)
- **콘솔 게임**: `npm run console`
- **개발 모드**: `node src/server.js`

## Architecture

### Core Components (2024년 12월 리팩토링 완료)

- **EnhancedBaseGame** (`public/js/core/EnhancedBaseGame.js`): 수익화, 애널리틱스, 사운드가 통합된 게임 베이스 클래스
- **BaseGame** (`public/js/core/BaseGame.js`): 기본적인 게임 라이프사이클 관리
- **AdManager** (`public/js/common/monetization/AdManager.js`): 광고 시스템 (배너, 인터스티셜, 리워드)
- **SoundManager** (`public/js/common/utils/SoundManager.js`): Web Audio API 기반 사운드 엔진
- **Analytics** (`public/js/common/utils/Analytics.js`): 게임 분석 및 메트릭스

### Game Categories & Structure

모든 게임은 `EnhancedBaseGame`을 상속받으며 카테고리별로 체계적으로 구성됩니다:

#### 🎲 Casual Games (`public/js/games/casual/`)
- **쿠키 클리커**: 아이들 클리커 게임 (업그레이드, 부스터, 목표 시스템)
- **플럭스 점프**: 무한 러너 (파워업, 레벨 진행, 파티클 효과)  
- **미스터리 박스**: 호기심 유발 게임 (랜덤 보상, 사운드 큐)

#### 🧩 Puzzle Games (`public/js/games/puzzle/`)
- **2048**: 숫자 타일 병합 (되돌리기, 콤보 시스템, 애니메이션)
- **테트리스**: 블록 퍼즐 (홀드, T-스핀, 벽킥, 레벨 시스템)
- **지뢰찾기**: 논리 퍼즐 (코드 기능, 최고 기록, 난이도별)

#### ⚔️ Action Games (`public/js/games/action/`)  
- **스네이크**: 뱀 게임 (파워업, 특수 음식, 장애물, 보스)
- **브레이크아웃**: 블록 깨기 (파워업, 콤보, 특수 블록)

#### 🕹️ Arcade Games (`public/js/games/arcade/`)
- **버블 슈터**: 색깔 매칭 슈팅 (물리 엔진, 콤보, 파워업)

#### 🎯 Strategy Games (`public/js/games/strategy/`)
- **틱택토**: 전략 보드 게임 (AI 상대, 미니맥스 알고리즘)

### File Structure (2024년 12월 현재)

```
public/
├── games/                    # 게임별 HTML 페이지
│   ├── bubble-shooter.html
│   ├── cookieclicker.html
│   └── [8개 더...]
├── css/
│   ├── common/              # 공통 컴포넌트 스타일
│   │   ├── components.css
│   │   └── ads.css
│   └── games/               # 게임별 전용 CSS
│       ├── casual/
│       ├── puzzle/
│       ├── action/
│       └── arcade/
├── js/
│   ├── common/              # 공통 시스템
│   │   ├── monetization/    # AdManager
│   │   ├── utils/          # SoundManager, Analytics
│   │   └── components/     # ScoreManager
│   ├── core/               # 게임 엔진
│   │   ├── BaseGame.js
│   │   └── EnhancedBaseGame.js
│   └── games/              # 게임 구현체들
│       ├── casual/         # 3개 게임
│       ├── puzzle/         # 3개 게임  
│       ├── action/         # 2개 게임
│       ├── arcade/         # 1개 게임
│       └── strategy/       # 1개 게임
└── index.html              # 메인 게임 선택 페이지
```

### Adding New Games (최신 가이드)

새 게임을 추가하려면:

1. **게임 클래스 생성**: 적절한 카테고리 폴더에 `EnhancedBaseGame` 상속
```javascript
export class NewGame extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'new-game',
            name: '새 게임',
            description: '게임 설명',
            category: 'arcade',
            difficulty: 'medium',
            hasAds: true,
            adPlacements: ['start', 'gameover']
        });
    }
}
```

2. **CSS 파일 생성**: `public/css/games/{category}/new-game.css`

3. **HTML 페이지 생성**: `public/games/new-game.html`

4. **메인 페이지에 추가**: `public/index.html`에 게임 버튼 추가

5. **사운드 등록**: `registerSounds()` 메서드에서 게임별 사운드 정의

## Key Decisions & Implementation Notes (2024년 12월 업데이트)

### 기술 스택 & 아키텍처 진화
- **Vanilla JavaScript**: 프레임워크 없이 순수 JS로 구현하여 가볍고 빠른 성능
- **Web Audio API**: 외부 파일 없이 동적으로 고품질 사운드 생성
- **Canvas API**: 부드러운 애니메이션과 파티클 효과를 위한 하드웨어 가속 렌더링
- **ES6 모듈**: 클린한 import/export와 트리 쉐이킹으로 번들 크기 최적화
- **컴포넌트 기반**: 각 게임은 독립적이며 재사용 가능한 컴포넌트로 구현

### 2024년 12월 대규모 리팩토링 
- **EnhancedBaseGame**: BaseGame을 확장하여 수익화, 분석, 사운드를 표준화
- **카테고리 기반 구조**: 5개 카테고리로 게임을 체계적으로 분류
- **공통 시스템 모듈화**: AdManager, SoundManager, Analytics를 독립적 모듈로 분리
- **개별 페이지 분리**: 각 게임마다 독립된 HTML 페이지로 성능 및 SEO 최적화

### 사운드 시스템 혁신
- **프로그래매틱 사운드**: 코드로 주파수, 파형, 지속시간을 제어하여 완벽한 커스터마이징
- **실시간 생성**: 메모리 효율적이며 파일 로딩 없는 즉시 재생
- **게임별 특화**: 각 게임마다 8-10개의 고유한 사운드 효과
- **Web Audio API 활용**: 브라우저 네이티브 API로 최고의 성능과 호환성

### 현재 완성된 게임 (9개)
1. **쿠키 클리커** (Casual) - 아이들 게임의 정석, 업그레이드와 목표 시스템
2. **플럭스 점프** (Casual) - 무한 러너, 파워업과 레벨 진행  
3. **미스터리 박스** (Casual) - 호기심 유발, 랜덤 리워드
4. **2048** (Puzzle) - 되돌리기 기능과 콤보 시스템
5. **테트리스** (Puzzle) - T-스핀, 홀드, 벽킥 등 모던 기능
6. **지뢰찾기** (Puzzle) - 코드 기능, 난이도별 최고 기록
7. **스네이크** (Action) - 파워업, 장애물, 보스 시스템  
8. **브레이크아웃** (Action) - 특수 블록, 파워업, 콤보
9. **버블 슈터** (Arcade) - 물리 엔진, 육각 그리드, 파워업

### 사용자 중심 설계 원칙
- **Kelly의 요구사항**: 게임 초보자도 쉽게 접근 가능
- **지하철 환경**: 네트워크 없이 작동, 빠른 로딩, 배터리 효율
- **모바일 퍼스트**: 터치 우선, 세로 화면 최적화, 한손 조작 가능
- **접근성**: 색맹 고려, 키보드 지원, 감소된 모션 옵션

### 수익화 전략
- **광고 통합**: 게임 시작, 종료, 레벨업 시점의 자연스러운 광고 배치
- **테스트 모드**: 개발 중 실제 광고 없이 시스템 테스트 가능
- **사용자 경험 우선**: 광고가 게임플레이를 방해하지 않도록 설계

### 성능 최적화
- **지연 로딩**: 게임별 개별 페이지로 필요한 리소스만 로딩
- **메모리 관리**: 게임 종료 시 모든 리소스 정리 (cleanup 메서드)
- **Canvas 최적화**: requestAnimationFrame과 오프스크린 캔버스 활용
- **이벤트 위임**: DOM 이벤트 리스너 최적화

### 향후 계획 (아케이드 게임 시리즈)
- **다음 예정**: 프로거 (길 건너기) - 무한 스크롤, 장애물 패턴
- **계획 중**: 팩맨 스타일 - 미로 시스템, AI 유령들