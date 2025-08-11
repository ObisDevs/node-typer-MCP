import { describe, it, expect } from 'vitest';
import { server, adapter } from '../src/server.js';

describe('MCP Server', () => {
  it('should initialize server', () => {
    expect(server).toBeDefined();
    expect(adapter).toBeDefined();
  });

  it('should process MCP adapter requests', async () => {
    const response = await adapter.processRequest({
      action: 'infer',
      params: { value: 'test' }
    });
    
    expect(response.success).toBe(true);
    expect(response.result.type).toBe('string');
  });

  it('should handle invalid requests', async () => {
    const response = await adapter.processRequest({
      action: 'invalid_action' as any,
      params: {}
    });
    
    expect(response.success).toBe(false);
    expect(response.error).toContain('Unknown action');
  });
});