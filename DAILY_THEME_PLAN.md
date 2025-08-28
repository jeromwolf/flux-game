# 📅 테마 시스템 일일 개발 계획

## 🎯 핵심 원칙
- **재사용성**: 한 번 만든 컴포넌트는 모든 게임에서 사용
- **모듈화**: 독립적으로 작동하는 작은 단위로 분리
- **컴포넌트화**: UI 요소를 재사용 가능한 컴포넌트로 구성
- **점진적 개선**: 매일 작은 단위로 완성도 높은 기능 추가

## 📆 Day 1: 테마 시스템 코어 구축
### 목표: 테마의 기반이 되는 핵심 시스템 구축

1. **테마 타입 정의** (`/src/lib/theme/types.ts`)
   ```typescript
   interface ThemeColors {
     primary: string;
     secondary: string;
     background: string;
     surface: string;
     text: string;
     // ...
   }
   ```

2. **테마 프로바이더** (`/src/lib/theme/ThemeProvider.tsx`)
   - React Context 기반
   - localStorage 연동
   - 시스템 다크모드 감지

3. **기본 테마 정의** (`/src/lib/theme/themes.ts`)
   - Dark, Light, Ocean 3개 테마로 시작

4. **테마 훅** (`/src/lib/theme/useTheme.ts`)
   - 컴포넌트에서 쉽게 사용할 수 있는 커스텀 훅

## 📆 Day 2: 재사용 가능한 UI 컴포넌트
### 목표: 테마를 적용받는 기본 UI 컴포넌트 라이브러리

1. **ThemedButton** (`/src/components/ui/themed/ThemedButton.tsx`)
   - Primary, Secondary, Ghost 변형
   - 크기 옵션 (sm, md, lg)
   - 아이콘 지원

2. **ThemedCard** (`/src/components/ui/themed/ThemedCard.tsx`)
   - 게임 카드, 정보 카드 등에 사용
   - 그림자 효과 테마 연동

3. **ThemedText** (`/src/components/ui/themed/ThemedText.tsx`)
   - 제목, 본문, 캡션 등 텍스트 스타일

4. **ThemedContainer** (`/src/components/ui/themed/ThemedContainer.tsx`)
   - 섹션 구분용 컨테이너

## 📆 Day 3: 게임 캔버스 테마 시스템
### 목표: 캔버스 기반 게임에 테마를 적용할 수 있는 시스템

1. **ThemedCanvas** (`/src/lib/theme/ThemedCanvas.ts`)
   - BaseGame 확장
   - 테마 색상 자동 적용
   - 그리기 메서드 테마 지원

2. **CanvasThemeUtils** (`/src/lib/theme/CanvasThemeUtils.ts`)
   - 색상 변환 유틸리티
   - 그라디언트 생성
   - 투명도 조절

3. **테마별 파티클 시스템** (`/src/lib/theme/ThemedParticles.ts`)
   - 테마 색상 기반 파티클
   - 재사용 가능한 이펙트

## 📆 Day 4: 첫 번째 게임 테마 적용 (Snake)
### 목표: Snake 게임을 완전히 테마화된 버전으로 업그레이드

1. **ThemedSnakeGame** 생성
   - 기존 Snake 게임을 ThemedCanvas 기반으로 리팩토링
   - 뱀, 먹이, 배경 모두 테마 적용

2. **게임 UI 컴포넌트화**
   - ScoreDisplay 컴포넌트
   - GameOverModal 컴포넌트
   - PauseMenu 컴포넌트

3. **테마 전환 테스트**
   - 게임 중 테마 변경 가능
   - 부드러운 전환 효과

## 📆 Day 5: 테마 선택기 & 미리보기
### 목표: 사용자가 테마를 선택하고 미리볼 수 있는 UI

1. **ThemeSelector** (`/src/components/ui/themed/ThemeSelector.tsx`)
   - 드롭다운 또는 그리드 형태
   - 실시간 미리보기

2. **ThemePreview** (`/src/components/ui/themed/ThemePreview.tsx`)
   - 미니 게임 화면으로 테마 미리보기
   - 주요 색상 표시

3. **메인 페이지 통합**
   - 헤더에 테마 선택기 추가
   - 선택한 테마 즉시 적용

## 📆 Day 6: 두 번째 게임 테마 적용 (Tetris)
### 목표: 블록 게임에 특화된 테마 시스템

1. **ThemedTetrisGame** 생성
   - 블록별 테마 색상 매핑
   - 배경 그리드 테마화

2. **블록 색상 시스템** (`/src/lib/theme/BlockColors.ts`)
   - 테마별 7가지 블록 색상
   - 색맹 친화적 옵션

3. **게임 효과 테마화**
   - 줄 삭제 애니메이션
   - 레벨업 효과

## 📆 Day 7: 리듬 게임 테마 적용
### 목표: 음악 게임에 어울리는 화려한 테마 시스템

1. **ThemedRhythmGame** 생성
   - 노트, 레인, 이펙트 모두 테마화
   - 테마별 특수 효과

2. **음악 시각화** (`/src/lib/theme/MusicVisualizer.ts`)
   - 테마 색상 기반 비주얼라이저
   - 비트에 반응하는 배경

3. **판정 이펙트 테마화**
   - Perfect, Good, Miss별 색상
   - 테마별 파티클 효과

## 📆 Day 8: 게임 카드 & 목록 테마화
### 목표: 메인 페이지 게임 목록을 테마 시스템과 통합

1. **ThemedGameCard** (`/src/components/games/ThemedGameCard.tsx`)
   - 호버 효과 테마 연동
   - 카테고리별 색상 구분

2. **ThemedCategoryFilter** 
   - 카테고리 버튼 테마화
   - 선택 상태 표시

3. **통계 표시 테마화**
   - 방문자 수, 인기도 등

## 📆 Day 9: 보드 게임 테마 적용 (2048, Tic Tac Toe)
### 목표: 격자 기반 게임의 테마 시스템

1. **GridTheme** (`/src/lib/theme/GridTheme.ts`)
   - 격자 게임 전용 테마 유틸리티
   - 타일 애니메이션 지원

2. **Themed2048Game**
   - 숫자별 색상 테마 매핑
   - 배경 그라디언트

3. **ThemedTicTacToe**
   - X, O 마크 테마 색상
   - 승리 라인 효과

## 📆 Day 10: 고급 테마 기능
### 목표: 사용자 경험 향상을 위한 고급 기능

1. **테마 전환 애니메이션**
   - CSS 트랜지션
   - 페이드 효과

2. **커스텀 테마 생성기**
   - 색상 피커
   - 실시간 미리보기
   - 테마 저장/공유

3. **테마별 사운드 효과**
   - 클릭음, 배경음 테마 매칭

## 🛠️ 재사용 가능한 모듈 구조

```
src/
├── lib/
│   └── theme/
│       ├── core/
│       │   ├── ThemeContext.tsx
│       │   ├── ThemeProvider.tsx
│       │   └── types.ts
│       ├── hooks/
│       │   ├── useTheme.ts
│       │   ├── useThemedCanvas.ts
│       │   └── useThemedColors.ts
│       ├── utils/
│       │   ├── colorUtils.ts
│       │   ├── canvasUtils.ts
│       │   └── animationUtils.ts
│       └── themes/
│           ├── dark.ts
│           ├── light.ts
│           └── ocean.ts
├── components/
│   └── ui/
│       └── themed/
│           ├── base/
│           │   ├── ThemedButton.tsx
│           │   ├── ThemedCard.tsx
│           │   └── ThemedText.tsx
│           ├── game/
│           │   ├── ThemedCanvas.tsx
│           │   ├── ThemedScore.tsx
│           │   └── ThemedModal.tsx
│           └── layout/
│               ├── ThemedHeader.tsx
│               └── ThemedContainer.tsx
└── games/
    └── themed/
        ├── ThemedSnake.ts
        ├── ThemedTetris.ts
        └── ThemedRhythm.ts
```

## 📊 성공 지표
- [ ] 모든 게임이 최소 3개 테마 지원
- [ ] 테마 변경 시 0.3초 이내 전환
- [ ] 컴포넌트 재사용률 80% 이상
- [ ] 새 게임 추가 시 테마 적용 시간 1시간 이내

## 💡 팁
1. **작게 시작하기**: 한 번에 하나의 컴포넌트만 완벽하게
2. **테스트 주도**: 각 컴포넌트에 스토리북 작성
3. **문서화**: 각 컴포넌트 사용법 명시
4. **일관성**: 네이밍 컨벤션 철저히 지키기