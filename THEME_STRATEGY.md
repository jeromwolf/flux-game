# 🎨 Flux Game 테마 시스템 전략

## 1. 테마 시스템 목표
- 사용자가 선호하는 시각적 스타일 선택 가능
- 일관된 사용자 경험 제공
- 게임별 특색 유지하면서 전체적인 통일성 확보
- 접근성 향상 (다크모드, 고대비 등)

## 2. 테마 종류

### 기본 테마
1. **🌙 Dark Mode (기본)**
   - 배경: #0f0f1e → #1a1a2e
   - 주 색상: #e94560
   - 보조 색상: #00ff88
   - 텍스트: #ffffff

2. **☀️ Light Mode**
   - 배경: #f5f5f5 → #e0e0e0
   - 주 색상: #d32f2f
   - 보조 색상: #00c853
   - 텍스트: #212121

3. **🌊 Ocean Theme**
   - 배경: #004d7a → #008793
   - 주 색상: #00bcd4
   - 보조 색상: #ffc107
   - 텍스트: #ffffff

4. **🌸 Sakura Theme**
   - 배경: #fce4ec → #f8bbd0
   - 주 색상: #e91e63
   - 보조 색상: #4caf50
   - 텍스트: #880e4f

5. **🎮 Retro Gaming**
   - 배경: #000000 → #1a0033
   - 주 색상: #ff0080
   - 보조 색상: #00ff00
   - 텍스트: #ffffff
   - 특징: 픽셀 폰트, 8비트 스타일

6. **🌈 High Contrast**
   - 배경: #000000 → #ffffff
   - 주 색상: #ffff00
   - 보조 색상: #00ffff
   - 텍스트: #000000 or #ffffff
   - 특징: 접근성 중시

## 3. 테마 적용 영역

### 전역 요소
- 배경 그라디언트
- 버튼 스타일
- 텍스트 색상
- 그림자 효과
- 애니메이션 색상

### 게임별 요소
1. **캔버스 게임** (Snake, Tetris, Rhythm 등)
   - 게임 보드 배경
   - 게임 오브젝트 색상
   - 파티클 효과
   - UI 오버레이

2. **보드 게임** (Tic Tac Toe, 2048 등)
   - 격자 색상
   - 타일/셀 색상
   - 하이라이트 효과

3. **액션 게임** (Breakout, Bubble Shooter 등)
   - 배경 패턴
   - 발사체 색상
   - 충돌 효과

## 4. 구현 전략

### Phase 1: 기반 구축 (1주차)
- [ ] 테마 인터페이스 정의
- [ ] 테마 컨텍스트 생성
- [ ] 기본 테마 객체 구현
- [ ] localStorage 연동

### Phase 2: 컴포넌트 적용 (2주차)
- [ ] 전역 컴포넌트 테마 적용
- [ ] 게임 선택 화면 테마화
- [ ] 게임별 BaseGame 클래스 테마 지원

### Phase 3: 게임별 적용 (3-4주차)
- [ ] 각 게임별 테마 적용 계획 수립
- [ ] 우선순위 높은 게임부터 순차 적용
- [ ] 게임별 특수 효과 테마화

### Phase 4: 고급 기능 (5주차)
- [ ] 커스텀 테마 생성 기능
- [ ] 테마 프리뷰
- [ ] 애니메이션 전환 효과
- [ ] 테마별 사운드 효과

## 5. 기술 스택

### CSS Variables
```css
:root {
  --bg-primary: #0f0f1e;
  --bg-secondary: #1a1a2e;
  --color-primary: #e94560;
  --color-secondary: #00ff88;
  --text-primary: #ffffff;
}
```

### TypeScript Interface
```typescript
interface Theme {
  name: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    primary: string;
    secondary: string;
    text: string;
    // ... more
  };
  effects: {
    shadow: string;
    glow: string;
    blur: number;
  };
}
```

### React Context
```typescript
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({...});
```

## 6. 게임별 테마 매핑

### 리듬 게임
- 노트 색상: theme.colors.secondary
- 히트라인: theme.colors.primary
- 판정 텍스트: 테마별 그라디언트
- 배경 레인: 테마 기반 명암 조절

### 스네이크 게임
- 뱀 몸체: theme.colors.primary
- 먹이: theme.colors.secondary
- 격자선: theme.colors.text (20% opacity)
- 배경: theme.colors.bgPrimary

### 테트리스
- 블록 색상: 테마 팔레트 기반 7색
- 그림자: 테마별 투명도
- 배경 그리드: 테마 기반

## 7. 성능 고려사항
- CSS 변수 사용으로 런타임 변경 최적화
- 테마 변경 시 캔버스 재렌더링 최소화
- 테마 데이터 캐싱
- 이미지 에셋 지연 로딩

## 8. 접근성
- WCAG 2.1 AA 기준 충족
- 색상 대비율 검증
- 색맹 친화적 팔레트 옵션
- 시스템 다크모드 연동

## 9. 테스트 계획
- [ ] 각 테마별 색상 대비 테스트
- [ ] 게임별 가독성 테스트
- [ ] 성능 벤치마크
- [ ] 사용자 피드백 수집

## 10. 향후 확장
- 계절별 테마 (봄, 여름, 가을, 겨울)
- 이벤트 테마 (할로윈, 크리스마스)
- 사용자 커스텀 테마 공유
- 테마 마켓플레이스