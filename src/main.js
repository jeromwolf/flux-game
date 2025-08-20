import { GameEngine } from './core/GameEngine.js';
import { Console } from './utils/Console.js';
import { TicTacToe } from './games/TicTacToe.js';
import { Snake } from './games/Snake.js';
import { Tetris } from './games/Tetris.js';

class GameMenu {
  constructor() {
    this.engine = new GameEngine();
    this.console = new Console();
    this.running = true;
    
    this.registerGames();
  }

  registerGames() {
    this.engine.registerGame('틱택토', TicTacToe);
    this.engine.registerGame('스네이크', Snake);
    this.engine.registerGame('테트리스', Tetris);
  }

  async start() {
    this.console.clear();
    console.log('🎮 Flux Game 시작!');
    
    while (this.running) {
      await this.showMainMenu();
    }
    
    this.console.close();
  }

  async showMainMenu() {
    this.console.clear();
    console.log('\n=== 🚇 지하철 게임 꾸러미 ===');
    console.log('Kelly의 간단한 게임 모음\n');
    
    const games = this.engine.getAvailableGames();
    
    games.forEach((game, index) => {
      console.log(`${index + 1}. ${game}`);
    });
    
    console.log('0. 종료');
    console.log('');
    
    const choice = await this.console.ask('게임을 선택하세요: ');
    
    if (choice === '0') {
      this.running = false;
      console.log('게임을 종료합니다. 안녕히 가세요! 👋');
      return;
    }
    
    const gameIndex = parseInt(choice) - 1;
    if (gameIndex >= 0 && gameIndex < games.length) {
      const gameName = games[gameIndex];
      await this.playGame(gameName);
    } else {
      console.log('잘못된 선택입니다.');
      await this.console.ask('엔터를 누르세요...');
    }
  }

  async playGame(gameName) {
    try {
      const game = this.engine.startGame(gameName);
      
      this.console.clear();
      console.log(game.getInstructions());
      await this.console.ask('엔터를 누르면 게임을 시작합니다...');
      
      game.start();
      
      while (game.isRunning) {
        game.render();
        const input = await this.console.ask('> ');
        const result = game.handleInput(input);
        
        if (result === 'quit') {
          break;
        }
      }
      
      this.engine.stopCurrentGame();
      
    } catch (error) {
      console.error('게임 실행 중 오류:', error.message);
      await this.console.ask('엔터를 누르세요...');
    }
  }
}

const menu = new GameMenu();
menu.start().catch(console.error);