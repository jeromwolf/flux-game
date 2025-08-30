# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flux Game은 지하철에서 할 수 있는 간단한 게임 꾸러미입니다. Kelly를 위한 모바일 최적화된 웹 게임 컬렉션으로, 수익화 시스템과 고품질 사운드/비주얼 효과를 갖춘 완성도 높은 게임들을 제공합니다.

## Context Summary

2024년 12월부터 개발된 이 프로젝트는 Kelly가 지하철에서 간단히 즐길 수 있는 게임 모음으로 시작되어, 현재 26개의 완성된 게임과 Next.js 기반의 현대적인 웹 게임 플랫폼으로 발전했습니다.

### 주요 특징
- **26개의 완성된 게임**: 다양한 장르와 난이도
- **Next.js + TypeScript**: 최신 웹 기술 스택 사용
- **향상된 분석 시스템**: 오늘/전체 방문수 분리 추적, 트렌딩 표시
- **테마 시스템**: 8개의 내장 테마로 게임 분위기 커스터마이징
- **모바일 퍼스트 디자인**: 터치, 제스처, 반응형 UI
- **동적 게임 로딩**: 필요한 게임만 로드하여 성능 최적화
- **로컬 저장소 활용**: 최고 점수, 게임 진행 상황, 분석 데이터 저장
- **공유 시스템**: SNS 및 메신저를 통한 게임 공유 기능
- **게임 시스템**: 리더보드, 튜토리얼, 업적 시스템 통합

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
│   │   ├── WordTower.ts
│   │   ├── ColorMemory.ts
│   │   ├── PianoMemory.ts
│   │   └── WordMemory.ts
│   ├── analytics/
│   │   ├── GameAnalytics.ts
│   │   └── GameAnalyticsV2.ts # 향상된 분석 시스템
│   ├── core/                # 게임 기반 시스템
│   │   ├── BaseGame.ts      # 게임 베이스 클래스
│   │   ├── ThemeSystem.ts   # 테마 관리자
│   │   └── GameUtils.ts     # 유틸리티 함수
│   ├── leaderboard/         # 리더보드 시스템
│   │   └── LeaderboardSystem.ts
│   ├── tutorial/            # 튜토리얼 시스템
│   │   └── TutorialSystem.ts
│   ├── achievements/        # 업적 시스템
│   │   └── AchievementSystem.ts
│   └── share/               # 공유 시스템
│       └── ShareSystem.ts
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

### 현재 완성된 게임 (26개)
1. **쿠키 클리커** (Casual) - 아이들 게임, 업그레이드 시스템
2. **플럭스 점프** (Casual) - 엔들리스 러너, 장애물 회피
3. **K-Food Rush** (Casual) - 한국 음식 조리 시간 관리
4. **2048** (Puzzle) - 숫자 타일 병합, 되돌리기 기능
5. **테트리스** (Puzzle) - 블록 쌓기, 레벨 시스템
6. **지뢰찾기** (Puzzle) - 논리 퍼즐, 3가지 난이도
7. **워드 타워** (Puzzle) - 단어 쌓기, 어휘력 향상
8. **Merge Master** (Puzzle) - 육각형 그리드 숫자 병합
9. **Time Loop** (Puzzle) - 시간 녹화와 협력 퍼즐
10. **Color Memory** (Puzzle) - 색상 패턴 기억 게임
11. **Piano Memory** (Puzzle) - 음계 기억 게임
12. **Word Memory** (Puzzle) - 단어 패턴 기억 게임
13. **스네이크** (Action) - 뱀 게임, 터치 컨트롤
14. **브레이크아웃** (Action) - 블록 깨기, 파워업
15. **다이노 런** (Action) - 공룡 러너, 파워업 시스템
16. **Seoul Runner** (Action) - 서울 배경 엔들리스 러너
17. **Liquid Robot** (Action) - 변신 로봇 미션 게임
18. **Space Shooter** (Action) - 우주 슈팅, 보스전
19. **버블 슈터** (Arcade) - 색깔 매칭, 콤보 시스템
20. **플래피 플럭스** (Arcade) - 파이프 피하기, 중력 물리
21. **Stack Tower** (Arcade) - 블록 쌓기 타이밍 게임
22. **Cube Collector 3D** (Arcade) - 3D 큐브 수집
23. **틱택토** (Strategy) - AI 대전, 미니맥스 알고리즘
24. **Island Survival** (Strategy) - 무인도 생존 시뮬레이션
25. **Rhythm Game** (Arcade) - 리듬 게임
26. **Various Legacy Games** - 레거시 HTML/JS 게임들

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
- **23개의 완성된 게임**: 다양한 퍼즐, 액션, 아케이드, 전략 게임
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

### 최신 변경사항 (2025년 8월 27일)
- **Space Shooter 게임 추가**:
  - 일론 머스크의 Blastar에 영감받은 본격 우주 슈팅 게임
  - **게임플레이 특징**:
    - 4가지 적 타입: Basic (100점), Fast (150점), Tank (300점), Boss (1,000점)
    - 무한 웨이브 시스템 (웨이브당 적 수: 5 + wave × 2)
    - 보스 3단계 공격 패턴 (산탄 → 유도탄 → 원형탄막+레이저)
  - **파워업 시스템** (7종):
    - 기본: Rapid Fire, Spread Shot, Shield, Health
    - 특수: Laser Beam (관통), Homing Missiles (자동추적), Time Slow (30% 감속)
    - 가중치 기반 희귀도 시스템
  - **업적 시스템**:
    - First Blood, Centurion (100킬), Boss Slayer
    - Untouchable (노데미지 클리어), Combo Master (10x 콤보)
    - Wave Warrior (10웨이브), Power Collector (20개 수집)
    - 실시간 업적 알림과 진행도 표시
  - **기술적 특징**:
    - 3층 구조 배경음악 (베이스, 멜로디, 앰비언트 패드)
    - 모바일 최적화: 가상 조이스틱, 자동 발사 토글
    - 동적 우주 배경: 행성, 운석대, 우주정거장
    - 파티클 효과와 시각적 피드백
  - **버그 수정**:
    - 중복 렌더링 문제 해결 (canvas 초기화 개선)
    - forEach/splice 충돌로 인한 점수 미반영 버그 수정
    - 이벤트 리스너 메모리 누수 방지

### 현재 완성된 게임 (23개)
1. **쿠키 클리커** (Casual) - 아이들 게임, 업그레이드 시스템
2. **플럭스 점프** (Casual) - 엔들리스 러너, 장애물 회피
3. **K-Food Rush** (Casual) - 한국 음식 조리 시간 관리
4. **2048** (Puzzle) - 숫자 타일 병합, 되돌리기 기능
5. **테트리스** (Puzzle) - 블록 쌓기, 레벨 시스템
6. **지뢰찾기** (Puzzle) - 논리 퍼즐, 3가지 난이도
7. **워드 타워** (Puzzle) - 단어 쌓기, 어휘력 향상
8. **Merge Master** (Puzzle) - 육각형 그리드 숫자 병합
9. **Time Loop** (Puzzle) - 시간 녹화와 협력 퍼즐
10. **Color Memory** (Puzzle) - 색상 패턴 기억 게임
11. **Piano Memory** (Puzzle) - 음계 기억 게임 **(NEW!)**
12. **스네이크** (Action) - 뱀 게임, 터치 컨트롤
13. **브레이크아웃** (Action) - 블록 깨기, 파워업
14. **다이노 런** (Action) - 공룡 러너, 파워업 시스템
15. **Seoul Runner** (Action) - 서울 배경 엔들리스 러너
16. **Liquid Robot** (Action) - 변신 로봇 미션 게임
17. **Space Shooter** (Action) - 우주 슈팅, 보스전
18. **버블 슈터** (Arcade) - 색깔 매칭, 콤보 시스템
19. **플래피 플럭스** (Arcade) - 파이프 피하기, 중력 물리
20. **Stack Tower** (Arcade) - 블록 쌓기 타이밍 게임
21. **Cube Collector 3D** (Arcade) - 3D 큐브 수집
22. **틱택토** (Strategy) - AI 대전, 미니맥스 알고리즘
23. **Island Survival** (Strategy) - 무인도 생존 시뮬레이션

### 최신 변경사항 (2025년 8월 28일)
- **Merge Master 게임 추가**:
  - 5x5 육각형 그리드 기반 숫자 병합 퍼즐 게임
  - **게임플레이 특징**:
    - 인접한 같은 숫자를 선택하여 병합 (2+2=4, 4+4=8...)
    - 터치/클릭 컨트롤로 타일 선택 및 병합
    - 병합 후 자동으로 새 타일 추가
    - 콤보 시스템: 연속 병합 시 보너스 점수
  - **특수 타일 3종**:
    - 💣 폭탄: 주변 6개 타일 모두 제거
    - ✨ 와일드카드: 어떤 숫자와도 병합 가능
    - x2 배수: 병합 결과값 2배
  - **기술적 특징**:
    - 순수 TypeScript 클래스로 구현
    - Canvas 기반 렌더링과 파티클 효과
    - Web Audio API 동적 사운드 (단일 인스턴스로 최적화)
    - 육각형 그리드 수학적 계산
    - 자동 병합 AI 모드
  - **UI/UX 개선**:
    - 공간 활용 최적화 (캔버스 크기 95% 활용)
    - 도움말 버튼 추가로 튜토리얼 재확인 가능
    - 첫 플레이 시 상세한 게임 설명 제공
    - 한/영 언어 지원
  - **버그 수정**:
    - 육각형 그리드 렌더링 문제 해결
    - 캔버스 리사이징 최적화
    - 초기화 타이밍 개선
    - Web Audio API 자동 재생 정책 대응 (suspended state 처리)
  - **출시일**: 2025-08-28

### 최신 변경사항 (2025년 8월 29일)
- **Time Loop 게임 추가**:
  - 10초간의 행동을 녹화하고 과거의 자신과 협력하는 독창적인 퍼즐 게임
  - **게임플레이 특징**:
    - 10초 동안 플레이어의 모든 행동을 녹화
    - 최대 4번의 루프에서 과거의 자신들과 함께 플레이
    - 스위치와 문을 활용한 퍼즐 해결
    - 일부 스위치는 지속적인 압력 필요 (needsWeight)
  - **레벨 디자인 (3개)**:
    - Level 1: 튜토리얼 - 간단한 스위치와 문
    - Level 2: 동시 압력 - 2개의 스위치를 동시에 눌러야 함
    - Level 3: 이동 플랫폼 - 타이밍이 중요한 퍼즐
  - **기술적 특징**:
    - 행동 녹화/재생 시스템 (Action 인터페이스)
    - 고스트 플레이어 렌더링 (반투명, 색상 구분)
    - 타임라인 UI로 루프 진행상황 표시
    - 파티클 효과와 시각적 피드백
  - **UI/UX 특징**:
    - 실시간 타이머와 루프 카운터
    - 고스트별 색상 구분 (빨강, 청록, 파랑, 노랑)
    - 스위치 활성화 시각 표시
    - 녹화 중 빨간 점 표시
  - **버그 수정**:
    - TypeScript 인터페이스를 클래스 외부로 이동
    - macOS ExFAT 드라이브의 ._ 파일 자동 생성 문제 해결
  - **출시일**: 2025-08-29

### 최신 변경사항 (2025년 8월 30일)
- **Color Memory 게임 추가**:
  - 색상 패턴을 기억하고 재현하는 시각적 기억력 게임
  - **게임플레이 특징**:
    - 점점 길어지는 색상 시퀀스를 기억하고 재현
    - 4가지 색상: 빨강, 파랑, 초록, 노랑
    - 레벨이 올라갈수록 시퀀스 길이 증가
    - 실수 시 한 단계 뒤로 돌아가는 관대한 시스템
  - **기술적 특징**:
    - Canvas 기반 반응형 UI
    - 터치/클릭 이벤트 통합 처리
    - 시각적 피드백 애니메이션
    - Web Audio API 동적 사운드
  - **출시일**: 2025-08-30

### 최신 변경사항 (2025년 8월 31일)
- **Piano Memory 게임 추가**:
  - 음계를 듣고 순서대로 연주하는 청각적 기억력 게임
  - **게임플레이 특징**:
    - 점점 길어지는 음계 시퀀스를 듣고 재현
    - 8개의 피아노 건반 (도레미파솔라시도)
    - 레벨이 올라갈수록 시퀀스 길이 증가
    - 실수 시 한 단계 뒤로 돌아가는 관대한 시스템
  - **기술적 특징**:
    - Canvas 기반 피아노 건반 UI
    - Web Audio API로 실시간 피아노 사운드 생성
    - 시각적 + 청각적 피드백 동시 제공
    - 터치/클릭 이벤트 통합 처리
  - **출시일**: 2025-08-31 (오늘 출시!)

### 최신 변경사항 (2025년 8월 30일) 
- **게임 시스템 대규모 업데이트**:
  - **LeaderboardSystem 추가**: 
    - 로컬 스토리지 기반 글로벌 리더보드
    - 일간/주간/월간 순위 지원
    - 플레이어 통계 및 랭킹 추적
  - **TutorialSystem 추가**:
    - 단계별 튜토리얼 가이드
    - 하이라이트 및 포지션 기반 설명
    - 다양한 트리거 타입 지원
  - **AchievementSystem 추가**:
    - 게임별 업적 정의 및 추적
    - 실시간 업적 알림
    - 진행도 추적 시스템
  - **ShareSystem 추가**:
    - 멀티 플랫폼 공유 (트위터, 페이스북, 카카오톡)
    - 네이티브 공유 API 우선 지원
    - 커스터마이징 가능한 공유 메시지

- **3개의 새로운 메모리 게임 추가**:
  - **Color Memory**: Simon Says 스타일 색상 패턴 기억
  - **Piano Memory**: 15곡 이상의 멜로디 기억 게임
  - **Word Memory**: 8가지 다양한 암기 패턴 제공

- **공유 기능 통합**:
  - 메인 페이지 상단 공유 버튼
  - 각 게임 카드별 개별 공유
  - 게임 중/게임 오버 화면 공유
  - 한국어/영어 지원

- **버그 수정**:
  - WordMemory 검은 화면 문제 해결 (setupGame 메서드 추가)
  - BaseGame 클래스에 공유 기능 통합

### 향후 계획
- **일일 게임 추가**: 매일 새로운 글로벌 타겟 게임 구현
- **글로벌 리더보드 시스템**: 전 세계 플레이어 순위
- **Progressive Web App (PWA)**: 오프라인 플레이 지원
- **모바일 앱 출시**: iOS/Android 네이티브 앱