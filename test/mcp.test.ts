import { describe, it, expect, vi } from 'vitest';
import { MCPAdapter } from '../src/mcp/index.js';

describe('MCP functionality', () => {
  const adapter = new MCPAdapter();

  it('should process typewrite action', async () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const response = await adapter.processRequest({
      action: 'typewrite',
      params: { text: 'test', speed: 1 }
    });
    expect(response.success).toBe(true);
    expect(response.result).toHaveProperty('text', 'test');
    spy.mockRestore();
  });

  it('should process infer action', async () => {
    const response = await adapter.processRequest({
      action: 'infer',
      params: { value: '123' }
    });
    expect(response.success).toBe(true);
    expect(response.result).toEqual({ value: '123', type: 'number' });
  });

  it('should process cast action', async () => {
    const response = await adapter.processRequest({
      action: 'cast',
      params: { value: '123', type: 'number' }
    });
    expect(response.success).toBe(true);
    expect(response.result).toEqual({ original: '123', casted: 123, type: 'number' });
  });

  it('should handle errors', async () => {
    const response = await adapter.processRequest({
      action: 'cast',
      params: { value: 'abc', type: 'number' }
    });
    expect(response.success).toBe(false);
    expect(response.error).toContain('Cannot cast');
  });
});