# MCP Setup for Windsurf

## Configuration

Add this to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "node-typer": {
      "command": "node",
      "args": ["dist/server.js"],
      "cwd": "/Users/macbookair/Desktop/node-typer",
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

## Testing Steps

1. **Start the server manually first:**
```bash
cd /Users/macbookair/Desktop/node-typer
npm start
```

2. **Test endpoints with curl:**
```bash
# Health check
curl http://localhost:3000/health

# Typewrite test
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"action": "typewrite", "params": {"text": "Hello Windsurf!", "speed": 30}}'

# Type inference test
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"action": "infer", "params": {"value": "123"}}'
```

3. **Configure Windsurf to use the MCP server**

4. **Test AI agent requests:**
   - Ask Windsurf to typewrite text
   - Request type inference on values
   - Test logging functionality

## Available Actions

- `typewrite`: Simulate typing text with speed control
- `infer`: Detect types of values intelligently  
- `cast`: Convert values between types safely
- `log`: Output messages with different levels