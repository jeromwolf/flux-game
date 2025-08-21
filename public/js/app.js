import { GameManager } from './core/GameManager.js';
import { TicTacToe } from './games/strategy/TicTacToe.js';
import { Snake } from './games/action/Snake.js';
import { Breakout } from './games/action/Breakout.js';
import { Tetris } from './games/puzzle/Tetris.js';
import { Game2048 } from './games/puzzle/Game2048.js';
import { Minesweeper } from './games/puzzle/Minesweeper.js';
import { FluxJump } from './games/casual/FluxJump.js';
import { CookieClicker } from './games/casual/CookieClicker.js';
import AdManager from './common/monetization/AdManager.js';

class FluxGameApp {
    constructor() {
        this.gameManager = new GameManager();
        this.currentScreen = 'menu';
        
        this.registerGames();
        this.init();
    }

    registerGames() {
        // 기존 게임들
        this.gameManager.registerGame(new TicTacToe());
        this.gameManager.registerGame(new Snake());
        this.gameManager.registerGame(new Tetris());
        
        // 새로운 게임들
        this.gameManager.registerGame(new Game2048());
        this.gameManager.registerGame(new Minesweeper());
        this.gameManager.registerGame(new Breakout());
        
        // 플럭스 점프 게임
        this.gameManager.registerGame(new FluxJump());
        
        // 쿠키 클리커 게임
        this.gameManager.registerGame(new CookieClicker());
    }

    init() {
        // 광고 시스템 초기화
        AdManager.init();
        
        this.bindEvents();
        this.showScreen('menu');
    }

    bindEvents() {
        // 게임 선택 버튼
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.currentTarget.dataset.game;
                this.startGame(gameId);
            });
        });

        // 메뉴로 돌아가기 버튼들 - 이벤트 위임 사용
        document.addEventListener('click', (e) => {
            if (e.target.id && e.target.id.endsWith('-back-to-menu')) {
                e.preventDefault();
                this.showScreen('menu');
                this.gameManager.stopCurrentGame();
            }
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    startGame(gameId) {
        console.log('Starting game:', gameId);
        
        const gameScreen = document.getElementById(gameId);
        if (!gameScreen) {
            console.error(`Game screen '${gameId}' not found`);
            return;
        }
        
        // 게임 화면 표시
        this.showScreen(gameId);
        
        // 게임 컨테이너 찾기
        let container = gameScreen.querySelector('.game-container');
        if (!container) {
            console.log(`No .game-container found for ${gameId}, using gameScreen`);
            container = gameScreen;
        }
        
        // 컨테이너 확인
        console.log('Container:', container);
        
        // 게임 시작
        this.gameManager.setContainer(container);
        
        try {
            const game = this.gameManager.startGame(gameId);
            console.log(`Started game: ${game.name}`);
        } catch (error) {
            console.error('Failed to start game:', error);
            console.error('Error stack:', error.stack);
            this.showScreen('menu');
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.fluxGame = new FluxGameApp();
});