export class BaseGame {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    this.init();
  }

  stop() {
    this.isRunning = false;
    this.cleanup();
  }

  init() {
    throw new Error('init() 메서드를 구현해야 합니다');
  }

  cleanup() {
  }

  handleInput(input) {
    throw new Error('handleInput() 메서드를 구현해야 합니다');
  }

  render() {
    throw new Error('render() 메서드를 구현해야 합니다');
  }

  getInstructions() {
    return '게임 설명이 없습니다.';
  }
}