export class GameManager {
    constructor() {
        this.games = new Map();
        this.currentGame = null;
        this.container = null;
    }

    registerGame(game) {
        this.games.set(game.id, game);
    }

    setContainer(container) {
        this.container = container;
    }

    getGames() {
        return Array.from(this.games.values());
    }

    startGame(gameId) {
        if (this.currentGame) {
            this.currentGame.unmount();
        }

        const game = this.games.get(gameId);
        if (!game) {
            throw new Error(`Game '${gameId}' not found`);
        }

        this.currentGame = game;
        game.mount(this.container);
        return game;
    }

    stopCurrentGame() {
        if (this.currentGame) {
            this.currentGame.unmount();
            this.currentGame = null;
        }
    }
}