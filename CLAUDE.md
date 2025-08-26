# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flux Game은 지하철에서 할 수 있는 간단한 게임 꾸러미입니다. Kelly를 위한 모바일 최적화된 웹 게임 컬렉션으로, 수익화 시스템과 고품질 사운드/비주얼 효과를 갖춘 완성도 높은 게임들을 제공합니다.

## Context Summary

2024년 12월부터 개발된 이 프로젝트는 Kelly가 지하철에서 간단히 즐길 수 있는 게임 모음으로 시작되어, 현재 12개의 완성된 게임과 Next.js 기반의 현대적인 웹 게임 플랫폼으로 발전했습니다.

### 주요 특징
- **12개의 완성된 게임**: 다양한 장르와 난이도
- **Next.js + TypeScript**: 최신 웹 기술 스택 사용
- **향상된 분석 시스템**: 오늘/전체 방문수 분리 추적, 트렌딩 표시
- **테마 시스템**: 8개의 내장 테마로 게임 분위기 커스터마이징
- **모바일 퍼스트 디자인**: 터치, 제스처, 반응형 UI
- **동적 게임 로딩**: 필요한 게임만 로드하여 성능 최적화
- **로컬 저장소 활용**: 최고 점수, 게임 진행 상황, 분석 데이터 저장

## Development Commands

- **개발 서버 실행**: `npm run dev` 또는 `./dev.sh` (포트 3100)
- **프로덕션 빌드**: `npm run build`
- **프로덕션 실행**: `npm start`
- **서버 중지**: `./stop.sh`

## Architecture

### Next.js 마이그레이션 (2024년 12월 완료)

- **Next.js 15.5.0**: App Router 기반 현대적인 React 프레임워크
- **TypeScript**: 타입 안정성과 개발 생산성 향상
- **Tailwind CSS v3**: 유틸리티 우선 CSS 프레임워크
- **동적 게임 로딩**: 게임별 독립적인 TypeScript 클래스
- **GameAnalytics** (`src/lib/analytics/GameAnalytics.ts`): 게임 방문 및 플레이 시간 추적

### Game Categories & Structure

모든 게임은 TypeScript 클래스로 구현되며 mount/unmount 라이프사이클을 가집니다:

#### 🎲 Casual Games
- **쿠키 클리커**: 아이들 클리커 게임 (업그레이드, 자동 저장)
- **플럭스 점프**: 엔들리스 러너 (장애물, 별 수집, 거리 추적)

#### 🧩 Puzzle Games
- **2048**: 숫자 타일 병합 (되돌리기, 애니메이션)
- **테트리스**: 블록 퍼즐 (홀드, 레벨 시스템, 속도 증가)
- **지뢰찾기**: 논리 퍼즐 (3가지 난이도, 최고 기록)

#### ⚔️ Action Games
- **스네이크**: 뱀 게임 (터치 컨트롤, 장애물)
- **브레이크아웃**: 블록 깨기 (파워업, 멀티히트 블록)

#### 🕹️ Arcade Games
- **버블 슈터**: 색깔 매칭 슈팅 (육각 그리드, 콤보 시스템)
- **플래피 플럭스**: 파이프 피하기 (중력, 파티클 효과)

#### 🎯 Strategy Games
- **틱택토**: 전략 보드 게임 (AI 상대, 미니맥스 알고리즘)

### File Structure (Next.js 마이그레이션 후)

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx             # 메인 페이지 (게임 목록)
│   ├── layout.tsx           # 루트 레이아웃
│   └── games/
│       └── [gameId]/
│           └── page.tsx     # 동적 게임 페이지
├── lib/
│   ├── games/               # 게임 구현체 (TypeScript)
│   │   ├── Game2048.ts
│   │   ├── TicTacToe.ts
│   │   ├── SnakeGame.ts
│   │   ├── TetrisGame.ts
│   │   ├── Minesweeper.ts
│   │   ├── BreakoutGame.ts
│   │   ├── BubbleShooter.ts
│   │   ├── CookieClicker.ts
│   │   ├── FluxJump.ts
│   │   ├── FlappyFlux.ts
│   │   ├── DinoRunFixed.ts
│   │   └── WordTower.ts
│   ├── analytics/
│   │   ├── GameAnalytics.ts
│   │   └── GameAnalyticsV2.ts # 향상된 분석 시스템
│   └── core/                # 게임 기반 시스템
│       ├── BaseGame.ts      # 게임 베이스 클래스
│       ├── ThemeSystem.ts   # 테마 관리자
│       └── GameUtils.ts     # 유틸리티 함수
└── components/              # React 컴포넌트
    ├── games/
    └── ui/

public/                      # 정적 파일 (레거시)
├── index.html              # 기존 HTML 버전
└── js/                     # 기존 JavaScript 게임들
```

### Adding New Games (Next.js 가이드)

새 게임을 추가하려면:

1. **TypeScript 게임 클래스 생성**: `src/lib/games/NewGame.ts`
```typescript
export default class NewGame {
  private container: HTMLElement | null = null;
  
  mount(container: HTMLElement) {
    this.container = container;
    // 게임 초기화
  }
  
  unmount() {
    // 정리 작업
  }
}
```

2. **게임 로더에 추가**: `src/app/games/[gameId]/page.tsx`에 import 케이스 추가

3. **메인 페이지에 추가**: `src/app/page.tsx`의 games 배열에 추가

4. **로컬 스토리지 활용**: 최고 점수 저장
```typescript
localStorage.setItem('new-game-highscore', score.toString());
```

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

### 현재 완성된 게임 (18개)
1. **쿠키 클리커** (Casual) - 아이들 게임, 업그레이드 시스템
2. **플럭스 점프** (Casual) - 엔들리스 러너, 장애물 회피
3. **K-Food Rush** (Casual) - 한국 음식 조리 시간 관리
4. **2048** (Puzzle) - 숫자 타일 병합, 되돌리기 기능
5. **테트리스** (Puzzle) - 블록 쌓기, 레벨 시스템
6. **지뢰찾기** (Puzzle) - 논리 퍼즐, 3가지 난이도
7. **워드 타워** (Puzzle) - 단어 쌓기, 어휘력 향상
8. **스네이크** (Action) - 뱀 게임, 터치 컨트롤
9. **브레이크아웃** (Action) - 블록 깨기, 파워업
10. **다이노 런** (Action) - 공룡 러너, 파워업 시스템
11. **Seoul Runner** (Action) - 서울 배경 엔들리스 러너
12. **Liquid Robot** (Action) - 변신 로봇 미션 게임
13. **버블 슈터** (Arcade) - 색깔 매칭, 콤보 시스템
14. **플래피 플럭스** (Arcade) - 파이프 피하기, 중력 물리
15. **Stack Tower** (Arcade) - 블록 쌓기 타이밍 게임
16. **Cube Collector 3D** (Arcade) - 3D 큐브 수집
17. **틱택토** (Strategy) - AI 대전, 미니맥스 알고리즘
18. **Island Survival** (Strategy) - 무인도 생존 시뮬레이션

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

### 최근 업데이트 (2025년 8월)
- **Next.js 15.5.0 마이그레이션**: HTML 기반에서 현대적 React 프레임워크로 전환
- **TypeScript 도입**: 모든 게임을 타입 안전한 코드로 재작성
- **향상된 분석 시스템 (GameAnalyticsV2)**: 
  - 오늘/전체 방문수 분리 추적
  - 일별 방문 기록 (30일간 보관)
  - 트렌딩 상태 표시 (HOT/RISING/NEW)
  - 실시간 업데이트
- **테마 시스템 전면 적용 완료**: 
  - 8개의 내장 테마 (Classic, Neon Nights, Retro Arcade 등)
  - Canvas 게임용 BaseGame, DOM 게임용 ThemedDOMGame 기반 클래스
  - 모든 12개 게임에 동적 색상, 그라디언트, 시각 효과 통합
  - 게임별 테마 적용: 버튼, 배경, UI 요소 모두 테마 연동
  - 실시간 테마 변경 지원
- **16개의 완성된 게임**: Island Survival, Stack Tower, K-Food Rush, Seoul Runner 추가
- **글로벌 게임 플랫폼 전략 수립**: 
  - 사업계획서 작성 (BUSINESS_PLAN.md)
  - 매일 1개씩 새로운 게임 출시 목표
  - 3년 내 $50M 기업가치 목표

### 최신 변경사항 (2025년 8월 26일)
- **K-Wave 테마 게임 추가**:
  - **K-Food Rush**: 한국 음식 조리 시간 관리 게임
    - 김밥, 떡볶이, 불고기, 비빔밥 등 한국 음식 조리
    - 재료 순서 맞추기 시스템
    - 시간 제한과 콤보 시스템
  - **Seoul Runner**: 서울 랜드마크를 배경으로 한 엔들리스 러너
    - 실제 서울 명소 (63빌딩, 롯데타워, 경복궁, 광화문 등)
    - 한국 문화 아이템 수집 (김치, K-POP, 한복 등)
    - 사계절과 시간대 변화 시스템
    - 3개의 생명과 무적 시간으로 난이도 조절

- **3D 게임 SSR 문제 해결**:
  - CubeCollector3D, LiquidRobot Three.js 동적 임포트로 전환
  - Canvas 높이 600px 고정으로 렌더링 문제 해결

- **일일 게임 출시 시스템 구현**:
  - 게임별 releaseDate 속성 추가
  - 오늘 출시된 게임 최상단 배치
  - "NEW TODAY!" 보라색 애니메이션 배지
  - 그 외 게임은 인기순 정렬

- **타겟 시장 재정의**:
  - 기존: "지하철에서 하는 게임"
  - 변경: "언제 어디서나 5분 게임"
  - 회원가입 없는 간편한 접근성 강조

### 최신 변경사항 (2025년 8월 26일)
- **한/영 언어 지원 시스템 구현**:
  - 메인 페이지에 KO/EN 토글 버튼 추가 (LanguageSelector 컴포넌트)
  - localStorage 기반 언어 설정 저장 및 전체 앱 적용
  - 모든 게임 제목과 설명 한/영 번역 완료
  - 개별 게임 언어 지원:
    - K-Food Rush: 재료 주문 시스템과 모든 UI 다국어화
    - 2048: 게임 오버, 승리 메시지 등 완전 번역
    - Rhythm Game: 전용 페이지(/games/rhythm)의 곡 선택, 난이도 등 모든 UI 번역
    - LiquidRobot: 3D 게임의 레벨명, 변신 형태, 조작법 등 완전 다국어화
  - 게임별로 mount 시 localStorage에서 언어 설정을 읽어 동적 적용
- **K-Food Rush 게임 개선 시도**:
  - 미니게임 시스템(야채 썰기, 프라이팬 흔들기, 불 조절) 구현 시도
  - 복잡도로 인한 버그 발생으로 원래의 단순한 클릭 게임으로 복구
  - 재료 순서의 중요성을 시각적으로 표시하는 기능 추가

### 향후 계획
- **일일 게임 추가**: 매일 새로운 글로벌 타겟 게임 구현
- **글로벌 리더보드 시스템**: 전 세계 플레이어 순위
- **Progressive Web App (PWA)**: 오프라인 플레이 지원
- **모바일 앱 출시**: iOS/Android 네이티브 앱