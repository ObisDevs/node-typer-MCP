export interface TypewriteOptions {
  speed?: number;
  delay?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function typewrite(text: string, options: TypewriteOptions = {}): Promise<void> {
  const { speed = 50, delay = 0 } = options;
  
  if (delay > 0) await sleep(delay);
  
  for (const char of text) {
    process.stdout.write(char);
    await sleep(speed);
  }
}

export class Typewriter {
  private queue: Array<() => Promise<void>> = [];
  private output = '';

  type(text: string, speed = 50): this {
    this.queue.push(async () => {
      for (const char of text) {
        this.output += char;
        process.stdout.write(char);
        await sleep(speed);
      }
    });
    return this;
  }

  pause(ms: number): this {
    this.queue.push(async () => { await sleep(ms); });
    return this;
  }

  delete(count: number): this {
    this.queue.push(async () => {
      for (let i = 0; i < count; i++) {
        if (this.output.length > 0) {
          this.output = this.output.slice(0, -1);
          process.stdout.write('\b \b');
          await sleep(50);
        }
      }
    });
    return this;
  }

  async run(): Promise<void> {
    for (const action of this.queue) {
      await action();
    }
    this.queue = [];
    this.output = '';
  }
}