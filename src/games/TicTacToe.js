import { BaseGame } from '../core/BaseGame.js';

export class TicTacToe extends BaseGame {
  constructor() {
    super('틱택토', '3x3 격자에서 O와 X로 한 줄을 먼저 만드는 게임');
    this.board = Array(9).fill(' ');
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.winner = null;
  }

  init() {
    this.board = Array(9).fill(' ');
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.winner = null;
  }

  render() {
    console.clear();
    console.log(`\n=== ${this.name} ===`);
    console.log(`현재 플레이어: ${this.currentPlayer}\n`);
    
    console.log(' 1 | 2 | 3 ');
    console.log('-----------');
    console.log(' 4 | 5 | 6 ');
    console.log('-----------');
    console.log(' 7 | 8 | 9 ');
    console.log('');
    
    console.log(` ${this.board[0]} | ${this.board[1]} | ${this.board[2]} `);
    console.log('-----------');
    console.log(` ${this.board[3]} | ${this.board[4]} | ${this.board[5]} `);
    console.log('-----------');
    console.log(` ${this.board[6]} | ${this.board[7]} | ${this.board[8]} `);
    
    if (this.gameOver) {
      if (this.winner) {
        console.log(`\n🎉 ${this.winner}가 승리했습니다!`);
      } else {
        console.log('\n무승부입니다!');
      }
      console.log('아무 키나 누르면 메뉴로 돌아갑니다.');
    } else {
      console.log('\n1-9 번호를 입력하여 위치를 선택하세요 (q: 종료)');
    }
  }

  handleInput(input) {
    if (input === 'q' || input === 'Q') {
      return 'quit';
    }

    if (this.gameOver) {
      return 'quit';
    }

    const position = parseInt(input) - 1;
    
    if (isNaN(position) || position < 0 || position > 8) {
      console.log('1-9 사이의 숫자를 입력하세요.');
      return 'continue';
    }

    if (this.board[position] !== ' ') {
      console.log('이미 놓인 자리입니다.');
      return 'continue';
    }

    this.board[position] = this.currentPlayer;
    
    if (this.checkWinner()) {
      this.winner = this.currentPlayer;
      this.gameOver = true;
    } else if (this.board.every(cell => cell !== ' ')) {
      this.gameOver = true;
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    return 'continue';
  }

  checkWinner() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    return winPatterns.some(pattern => {
      const [a, b, c] = pattern;
      return this.board[a] !== ' ' && 
             this.board[a] === this.board[b] && 
             this.board[b] === this.board[c];
    });
  }

  getInstructions() {
    return `
=== 틱택토 게임 방법 ===
1. 3x3 격자에서 번갈아가며 O와 X를 놓습니다
2. 가로, 세로, 대각선 중 한 줄을 먼저 만드는 사람이 승리
3. 1-9 번호를 입력하여 위치를 선택하세요
4. q를 입력하면 게임을 종료합니다
`;
  }
}