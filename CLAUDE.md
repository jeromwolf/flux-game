# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flux Game은 지하철에서 할 수 있는 간단한 게임 꾸러미입니다. Node.js와 Express를 사용한 웹 게임과 콘솔 기반 게임을 모두 제공합니다.

## Context Summary

이 프로젝트는 Kelly가 지하철에서 간단히 즐길 수 있는 게임 모음을 만들기 위해 시작되었습니다. 확장 가능한 컴포넌트 기반 구조로 설계되어 새로운 게임을 쉽게 추가할 수 있습니다.

### 주요 특징
- 웹과 콘솔 버전 모두 지원
- 모바일 친화적인 반응형 디자인
- 터치, 키보드, 마우스 입력 지원
- 포트 3100에서 실행되는 Express 서버
- ES6 모듈 시스템 사용
- 컴포넌트 기반 아키텍처로 확장성 확보

## Development Commands

- **웹 서버 실행**: `npm start` 또는 `npm run dev` (포트 3100)
- **콘솔 게임**: `npm run console`
- **개발 모드**: `node src/server.js`

## Architecture

### Core Components

- **GameEngine** (`src/core/GameEngine.js`): 게임 등록 및 실행 관리
- **BaseGame** (`src/core/BaseGame.js`): 모든 게임이 상속받는 기본 클래스
- **Console** (`src/utils/Console.js`): 콘솔 입출력 유틸리티
- **GameMenu** (`src/main.js`): 메인 메뉴 및 게임 선택 시스템

### Game Structure

각 게임은 `BaseGame`을 상속받아 다음 메서드를 구현해야 합니다:
- `init()`: 게임 초기화
- `render()`: 화면 렌더링
- `handleInput(input)`: 사용자 입력 처리
- `getInstructions()`: 게임 설명 제공

### Adding New Games

새 게임을 추가하려면:
1. `src/games/` 폴더에 새 게임 클래스 생성
2. `BaseGame`을 상속받아 필수 메서드 구현
3. `src/main.js`의 `registerGames()` 메서드에 게임 등록

### Current Games

- **틱택토**: 3x3 격자에서 O/X로 한 줄 만들기
- **스네이크**: 뱀 조종해서 먹이 먹고 성장시키기
- **테트리스**: 떨어지는 블록을 회전시켜 줄 없애기 (레벨, 점수 시스템 포함)
- **2048**: 숫자 타일을 합쳐서 2048 만들기
- **지뢰찾기**: 숨겨진 지뢰를 피해 모든 안전한 칸 찾기
- **브레이크아웃**: 패들로 공을 튕겨 벽돌 깨기

### File Structure

```
src/
├── core/           # 핵심 엔진 코드 (콘솔용)
├── games/          # 개별 게임 구현 (콘솔용)
├── utils/          # 유틸리티 함수
├── main.js         # 콘솔 앱 진입점
└── server.js       # 웹 서버 진입점
public/
├── css/            # 웹 스타일시트
├── js/             # 웹 JavaScript
└── index.html      # 웹 메인 페이지
```

### Web Version

포트 3100에서 실행되는 웹 버전은 반응형 디자인으로 모바일에서도 플레이 가능합니다. 게임 로직은 클라이언트 사이드에서 실행됩니다.

### Component Architecture

웹 버전은 컴포넌트 기반 구조로 되어 있습니다:
- `BaseGame`: 모든 게임이 상속받는 기본 클래스
- `GameManager`: 게임 등록 및 실행 관리
- 각 게임은 독립적인 컴포넌트로 구현

새 게임 추가 방법:
1. `public/js/games/` 폴더에 `BaseGame`을 상속받는 새 게임 클래스 생성
2. `public/js/app.js`의 `registerGames()` 메서드에 게임 등록
3. `public/index.html`에 게임 화면 HTML 추가

## Key Decisions & Implementation Notes

### 기술 스택 선택
- **Express.js**: 간단한 정적 파일 서빙을 위해 선택
- **ES6 모듈**: 클린한 import/export 구조를 위해 사용
- **Vanilla JavaScript**: 프레임워크 없이 순수 JS로 구현하여 가볍게 유지

### 아키텍처 결정사항
- **컴포넌트 기반**: 각 게임은 독립적인 컴포넌트로 구현
- **BaseGame 클래스**: 통일된 인터페이스 제공 (init, render, cleanup 메서드)
- **GameManager**: 중앙화된 게임 관리 시스템
- **콘솔/웹 분리**: src/ (콘솔용), public/ (웹용)으로 분리

### 사용자 요구사항
- Kelly는 게임을 잘 모르는 초보자
- 지하철에서 사용할 수 있도록 모바일 최적화 필요
- 확장 가능한 구조로 나중에 게임 추가 가능하도록
- 포트 3100 사용
- 쉘 스크립트로 서버 시작/중지 (start.sh, stop.sh)

### 구현된 기능
- 6개의 게임 (틱택토, 스네이크, 테트리스, 2048, 지뢰찾기, 브레이크아웃)
- 반응형 디자인으로 모바일 지원
- 터치, 키보드, 마우스 입력 모두 지원
- 게임별 점수 및 최고기록 저장 (localStorage)
- 백그라운드 실행 지원 (nohup)