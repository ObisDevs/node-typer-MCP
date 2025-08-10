# node-typer

[![npm version](https://badge.fury.io/js/node-typer.svg)](https://badge.fury.io/js/node-typer)
[![CI](https://github.com/ObisDevs/node-typer-MCP/workflows/CI/badge.svg)](https://github.com/ObisDevs/node-typer-MCP/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript-first typing simulation and type inference library with MCP adapter support for AI agents.

## Features

- 🎯 **Typing Simulation**: Realistic typewriter effects with customizable speed and pauses
- 🔍 **Type Inference**: Smart type detection and casting utilities
- 📝 **Smart Logger**: Animated and static logging with color support
- 🤖 **MCP Adapter**: Built-in Model Context Protocol support for AI agents
- 🛡️ **Type Safe**: Full TypeScript support with comprehensive type definitions
- 📦 **Dual Package**: ESM and CommonJS support

## Installation

```bash
npm install node-typer
```

## Quick Start

```typescript
import { typewrite, createLogger, inferType } from 'node-typer';

// Typing simulation
await typewrite('Hello, World!', { speed: 50 });

// Smart logging
const logger = createLogger({ animated: true });
logger.info('Processing data...');

// Type inference
const type = inferType('123'); // 'number'
```

## MCP Server

Start the MCP server for AI agent integration:

```bash
npm start
```

## MCP Server

Start the MCP server for AI agent integration:

```bash
npm start
```

The server exposes a REST API at `http://localhost:3000/mcp/run` that accepts MCP requests.

### Example Request
```bash
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"action": "typewrite", "params": {"text": "Hello!", "speed": 50}}'
```

## Documentation

See [Developer Documentation](./docs/developer.md) for detailed API reference.
See [MCP Usage Examples](./examples/mcp-usage.md) for testing the server.

## License

MIT