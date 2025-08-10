# MCP Usage Examples

## Starting the Server

```bash
npm start
```

## Testing with curl

### Typewrite Action
```bash
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"action": "typewrite", "params": {"text": "Hello, World!", "speed": 50}}'
```

### Type Inference
```bash
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"action": "infer", "params": {"value": "123"}}'
```

### Type Casting
```bash
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"action": "cast", "params": {"value": "123", "type": "number"}}'
```

### Logging
```bash
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"action": "log", "params": {"message": "Test log", "level": "info"}}'
```

## Health Check
```bash
curl http://localhost:3000/health
```