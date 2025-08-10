import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('MCP Server', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should process MCP requests', async () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    
    const response = await request(app)
      .post('/mcp/run')
      .send({
        action: 'infer',
        params: { value: 'test' }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.result.type).toBe('string');
    
    spy.mockRestore();
  });

  it('should handle invalid requests', async () => {
    const response = await request(app)
      .post('/mcp/run')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});