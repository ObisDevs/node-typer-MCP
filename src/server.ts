import express from 'express';
import { MCPAdapter } from './mcp/index.js';
import type { MCPRequest } from './mcp/types.js';

const app = express();
const adapter = new MCPAdapter();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/mcp/run', async (req, res) => {
  try {
    const request = req.body as MCPRequest;
    
    if (!request.action || !request.params) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: action and params required'
      });
    }
    
    const response = await adapter.processRequest(request);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp/run`);
  });
}

export { app, adapter };