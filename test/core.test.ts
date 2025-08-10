import { describe, it, expect, vi } from 'vitest';
import { typewrite, Typewriter } from '../src/core/index.js';

describe('Core functionality', () => {
  it('should typewrite text', async () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await typewrite('hi', { speed: 1 });
    expect(spy).toHaveBeenCalledWith('h');
    expect(spy).toHaveBeenCalledWith('i');
    spy.mockRestore();
  });

  it('should chain typewriter actions', async () => {
    const typewriter = new Typewriter();
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await typewriter.type('hi', 1).pause(1).run();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});