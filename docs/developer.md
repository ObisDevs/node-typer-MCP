# Developer Documentation

## API Reference

### Core Features

#### `typewrite(text: string, options?: TypewriteOptions): Promise<void>`
Simulates typing text with realistic delays.

#### `Typewriter` Class
Advanced typewriter with chaining methods.

### Logger

#### `createLogger(options?: LoggerOptions): Logger`
Creates a configurable logger instance.

### Type Utilities

#### `inferType(value: unknown): string`
Infers the type of a given value.

#### `cast<T>(value: unknown, type: string): T`
Safely casts values to specified types.

### MCP Adapter

#### Server Endpoints
- `POST /mcp/run` - Execute MCP actions

#### Supported Actions
- `typewrite` - Text typing simulation
- `infer` - Type inference
- `cast` - Type casting
- `log` - Logging operations

## Development

```bash
npm run dev    # Watch mode
npm test       # Run tests
npm run build  # Build for production
```