import { GameManager } from './core/GameManager.js';
import { Game2048 } from './games/Game2048.js';
import { Minesweeper } from './games/Minesweeper.js';
import { Breakout } from './games/Breakout.js';
import { TicTacToe } from './games/TicTacToe.js';
import { Snake } from './games/Snake.js';
import { Tetris } from './games/Tetris.js';

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
    }

    init() {
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

        // 메뉴로 돌아가기 버튼들
        document.querySelectorAll('[id$="-back-to-menu"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen('menu');
                this.gameManager.stopCurrentGame();
            });
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
            // 기존 게임들을 위한 폴백
            container = gameScreen;
        }
        
        // 게임 시작
        this.gameManager.setContainer(container);
        
        try {
            const game = this.gameManager.startGame(gameId);
            console.log(`Started game: ${game.name}`);
        } catch (error) {
            console.error('Failed to start game:', error);
            this.showScreen('menu');
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.fluxGame = new FluxGameApp();
});