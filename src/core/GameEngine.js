export class GameEngine {
  constructor() {
    this.games = new Map();
    this.currentGame = null;
  }

  registerGame(name, gameClass) {
    this.games.set(name, gameClass);
  }

  getAvailableGames() {
    return Array.from(this.games.keys());
  }

  startGame(name) {
    if (!this.games.has(name)) {
      throw new Error(`게임 '${name}'을(를) 찾을 수 없습니다`);
    }
    
    const GameClass = this.games.get(name);
    this.currentGame = new GameClass();
    return this.currentGame;
  }

  getCurrentGame() {
    return this.currentGame;
  }

  stopCurrentGame() {
    if (this.currentGame && typeof this.currentGame.cleanup === 'function') {
      this.currentGame.cleanup();
    }
    this.currentGame = null;
  }
}