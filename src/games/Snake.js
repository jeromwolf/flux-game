import { BaseGame } from '../core/BaseGame.js';

export class Snake extends BaseGame {
  constructor() {
    super('스네이크', '뱀을 조종해서 먹이를 먹고 성장시키는 게임');
    this.width = 20;
    this.height = 10;
    this.snake = [{ x: 10, y: 5 }];
    this.food = { x: 15, y: 5 };
    this.direction = { x: 1, y: 0 };
    this.gameOver = false;
    this.score = 0;
  }

  init() {
    this.snake = [{ x: 10, y: 5 }];
    this.food = this.generateFood();
    this.direction = { x: 1, y: 0 };
    this.gameOver = false;
    this.score = 0;
  }

  generateFood() {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
    } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    return newFood;
  }

  render() {
    console.clear();
    console.log(`\n=== ${this.name} ===`);
    console.log(`점수: ${this.score}\n`);
    
    const board = Array(this.height).fill().map(() => Array(this.width).fill(' '));
    
    this.snake.forEach((segment, index) => {
      if (segment.x >= 0 && segment.x < this.width && segment.y >= 0 && segment.y < this.height) {
        board[segment.y][segment.x] = index === 0 ? '●' : '○';
      }
    });
    
    if (this.food.x >= 0 && this.food.x < this.width && this.food.y >= 0 && this.food.y < this.height) {
      board[this.food.y][this.food.x] = '🍎';
    }
    
    console.log('┌' + '─'.repeat(this.width * 2) + '┐');
    board.forEach(row => {
      console.log('│' + row.map(cell => cell + ' ').join('') + '│');
    });
    console.log('└' + '─'.repeat(this.width * 2) + '┘');
    
    if (this.gameOver) {
      console.log(`\n💀 게임 오버! 최종 점수: ${this.score}`);
      console.log('아무 키나 누르면 메뉴로 돌아갑니다.');
    } else {
      console.log('\nw/a/s/d: 방향키, q: 종료, 스페이스: 한 걸음 이동');
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
      case 'w':
        if (this.direction.y !== 1) {
          this.direction = { x: 0, y: -1 };
        }
        break;
      case 's':
        if (this.direction.y !== -1) {
          this.direction = { x: 0, y: 1 };
        }
        break;
      case 'a':
        if (this.direction.x !== 1) {
          this.direction = { x: -1, y: 0 };
        }
        break;
      case 'd':
        if (this.direction.x !== -1) {
          this.direction = { x: 1, y: 0 };
        }
        break;
      case ' ':
        this.moveSnake();
        break;
    }

    return 'continue';
  }

  moveSnake() {
    if (this.gameOver) return;

    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;
    
    if (head.x < 0 || head.x >= this.width || 
        head.y < 0 || head.y >= this.height ||
        this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver = true;
      return;
    }
    
    this.snake.unshift(head);
    
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.food = this.generateFood();
    } else {
      this.snake.pop();
    }
  }

  getInstructions() {
    return `
=== 스네이크 게임 방법 ===
1. w/a/s/d 키로 뱀의 방향을 조절합니다
2. 🍎를 먹으면 뱀이 길어지고 점수가 올라갑니다
3. 벽이나 자신의 몸에 부딪히면 게임이 끝납니다
4. 스페이스바를 눌러서 한 걸음씩 이동할 수 있습니다
5. q를 입력하면 게임을 종료합니다
`;
  }
}