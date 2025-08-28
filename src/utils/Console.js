import readline from 'readline';

export class Console {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  clear() {
    console.clear();
  }

  print(text) {
    console.log(text);
  }

  printLine() {
    console.log('-'.repeat(50));
  }

  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  close() {
    this.rl.close();
  }
}