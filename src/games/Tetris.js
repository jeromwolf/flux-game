import { BaseGame } from '../core/BaseGame.js';

export class Tetris extends BaseGame {
  constructor() {
    super('테트리스', '떨어지는 블록을 회전시켜 가로줄을 채우는 게임');
    
    this.width = 10;
    this.height = 20;
    this.board = [];
    this.currentPiece = null;
    this.currentX = 0;
    this.currentY = 0;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTimer = 0;
    this.dropSpeed = 1000; // 1초
    
    this.pieces = [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[0,1,0],[1,1,1]], // T
      [[0,1,1],[1,1,0]], // S
      [[1,1,0],[0,1,1]], // Z
      [[1,0,0],[1,1,1]], // L
      [[0,0,1],[1,1,1]]  // J
    ];
    
    this.pieceColors = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];
  }

  init() {
    this.board = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropSpeed = 1000;
    this.spawnPiece();
  }

  spawnPiece() {
    const pieceIndex = Math.floor(Math.random() * this.pieces.length);
    this.currentPiece = this.pieces[pieceIndex].map(row => [...row]);
    this.currentX = Math.floor((this.width - this.currentPiece[0].length) / 2);
    this.currentY = 0;
    
    // 새 조각을 놓을 수 없으면 게임 오버
    if (!this.isValidPosition(this.currentPiece, this.currentX, this.currentY)) {
      this.gameOver = true;
    }
  }

  isValidPosition(piece, x, y) {
    for (let row = 0; row < piece.length; row++) {
      for (let col = 0; col < piece[row].length; col++) {
        if (piece[row][col]) {
          const newX = x + col;
          const newY = y + row;
          
          if (newX < 0 || newX >= this.width || newY >= this.height) {
            return false;
          }
          
          if (newY >= 0 && this.board[newY][newX] !== ' ') {
            return false;
          }
        }
      }
    }
    return true;
  }

  rotatePiece() {
    const rotated = this.currentPiece[0].map((_, index) =>
      this.currentPiece.map(row => row[index]).reverse()
    );
    
    if (this.isValidPosition(rotated, this.currentX, this.currentY)) {
      this.currentPiece = rotated;
    }
  }

  movePiece(dx, dy) {
    if (this.isValidPosition(this.currentPiece, this.currentX + dx, this.currentY + dy)) {
      this.currentX += dx;
      this.currentY += dy;
      return true;
    }
    return false;
  }

  dropPiece() {
    if (!this.movePiece(0, 1)) {
      this.lockPiece();
    }
  }

  hardDrop() {
    while (this.movePiece(0, 1)) {
      // 계속 떨어뜨리기
    }
    this.lockPiece();
  }

  lockPiece() {
    for (let row = 0; row < this.currentPiece.length; row++) {
      for (let col = 0; col < this.currentPiece[row].length; col++) {
        if (this.currentPiece[row][col]) {
          const y = this.currentY + row;
          const x = this.currentX + col;
          if (y >= 0) {
            this.board[y][x] = '■';
          }
        }
      }
    }
    
    this.clearLines();
    this.spawnPiece();
  }

  clearLines() {
    let linesCleared = 0;
    
    for (let row = this.height - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== ' ')) {
        this.board.splice(row, 1);
        this.board.unshift(Array(this.width).fill(' '));
        linesCleared++;
        row++; // 다시 확인
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += linesCleared * 100 * this.level;
      
      // 레벨업 (10줄마다)
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
      }
    }
  }

  render() {
    console.clear();
    console.log(`\n=== ${this.name} ===`);
    console.log(`점수: ${this.score} | 레벨: ${this.level} | 줄: ${this.lines}\n`);
    
    // 게임 보드 복사
    const displayBoard = this.board.map(row => [...row]);
    
    // 현재 조각 그리기
    if (this.currentPiece && !this.gameOver) {
      for (let row = 0; row < this.currentPiece.length; row++) {
        for (let col = 0; col < this.currentPiece[row].length; col++) {
          if (this.currentPiece[row][col]) {
            const y = this.currentY + row;
            const x = this.currentX + col;
            if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
              displayBoard[y][x] = '□';
            }
          }
        }
      }
    }
    
    // 보드 출력
    console.log('┌' + '─'.repeat(this.width * 2) + '┐');
    for (let row = 0; row < this.height; row++) {
      console.log('│' + displayBoard[row].map(cell => cell + ' ').join('') + '│');
    }
    console.log('└' + '─'.repeat(this.width * 2) + '┘');
    
    if (this.gameOver) {
      console.log(`\n게임 오버! 최종 점수: ${this.score}`);
      console.log('아무 키나 누르면 메뉴로 돌아갑니다.');
    } else {
      console.log('\n조작: a/d (이동), w (회전), s (빠르게), 스페이스 (바로 떨어뜨리기), q (종료)');
    }
  }

  handleInput(input) {
    if (input === 'q' || input === 'Q') {
      return 'quit';
    }

    if (this.gameOver) {
      return 'quit';
    }

    switch (input.toLowerCase()) {
      case 'a':
        this.movePiece(-1, 0);
        break;
      case 'd':
        this.movePiece(1, 0);
        break;
      case 's':
        this.dropPiece();
        this.score += 1;
        break;
      case 'w':
        this.rotatePiece();
        break;
      case ' ':
        this.hardDrop();
        break;
      default:
        // 자동 떨어뜨리기 (시간 기반 시뮬레이션)
        this.dropTimer += 100;
        if (this.dropTimer >= this.dropSpeed) {
          this.dropPiece();
          this.dropTimer = 0;
        }
    }

    return 'continue';
  }

  getInstructions() {
    return `
=== 테트리스 게임 방법 ===
1. 떨어지는 블록을 회전시키고 이동시켜 가로줄을 채우세요
2. 가로줄이 가득 차면 사라지고 점수를 얻습니다
3. 10줄을 없앨 때마다 레벨이 올라가고 속도가 빨라집니다
4. 블록이 맨 위까지 쌓이면 게임 오버입니다

조작법:
- a/d: 좌우 이동
- w: 회전
- s: 빠르게 떨어뜨리기
- 스페이스: 바로 떨어뜨리기
- q: 종료
`;
  }
}