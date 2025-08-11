# node-typer-MCP
> A TypeScript-powered **Model Context Protocol (MCP) server** providing typing simulation, intelligent logging, type inference, data transformation, workflow generation, and more — fully integrable with Windsurf, Claude Desktop MCP, and AI agent platforms like n8n.

[![Build](https://github.com/ObisDevs/node-typer-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/ObisDevs/node-typer-MCP/actions)
[![License](https://img.shields.io/github/license/ObisDevs/node-typer-MCP)](LICENSE)
[![GitHub Repo](https://img.shields.io/badge/repo-node--typer--MCP-blue)](https://github.com/ObisDevs/node-typer-MCP)

---

## 📌 Overview
`node-typer-MCP` is a **multi-tool MCP server** built in TypeScript that empowers AI agents, automation platforms, and developers to perform a variety of real-world tasks through a single protocol connection.

Designed for:
- **Windsurf MCP Manager**
- **Claude Desktop MCP**
- **n8n AI Workflow Nodes**
- Any MCP-compliant agent platform

It includes **developer-friendly APIs, strong type safety, and real-time capabilities**.

---

## 🚀 Features

### **Core Tools**
1. **`typewrite`**
   - Simulates human typing with character-by-character output.
   - Supports chaining actions: `.type()`, `.pause()`, `.delete()`, `.run()`.
   - Configurable typing speed & delay.
   - Detects TTY vs CI environment for optimal output.

2. **`infer_type`**
   - Detects the data type of a given value.
   - Supports number, boolean, date, array, null, and string.
   - Auto-detects dates in ISO and natural formats.

3. **`cast_type`**
   - Safely casts a value to a target type with error handling.
   - Prevents invalid conversions and returns meaningful error messages.

4. **`log_message`**
   - Color-coded log levels: debug, info, warn, error.
   - Optional animated typing logs.
   - Filters by log level.

---

### **Extended Tools**
5. **`generate_n8n_workflow`**
   - Converts natural language descriptions into valid **n8n workflow JSON**.
   - Auto-detects required node types from keywords.
   - Supports triggers: webhook, cron, manual.

6. **`transform_data`**
   - Converts between JSON, CSV, XML, and YAML formats.
   - Supports field mapping & renaming.
   - Preserves nested object structures.

7. **`validate_data`**
   - Validates data against JSON Schema or custom rules.
   - Supports strict mode for production use.
   - Common built-in rules: email, URL, date, regex patterns.

8. **`evaluate_expression`**
   - Evaluates math, logic, string, and date expressions safely.
   - Allows variable injection for dynamic computations.
   - Supports safe mode to prevent arbitrary code execution.

9. **`manage_secrets`**
   - Securely store, retrieve, mask, and generate secrets.
   - Supports API keys, tokens, passwords, and certificates.
   - Optional masking patterns for display.

---

## 📂 Project Structure
```
src/
 ├── core/         # Core utilities: typewriter, logger, utils
 ├── mcp/          # MCP adapter and type definitions
 ├── tools/        # All extended MCP tools
 ├── server.ts     # MCP server entry point
 └── index.ts      # Package exports
tests/             # Vitest test suites for all features
```

---

## 🔧 Installation (Development Setup)
```bash
git clone https://github.com/ObisDevs/node-typer-MCP.git
cd node-typer-MCP
npm install
npm run build
npm test
```

---

## 🖥 Running the MCP Server
```bash
node dist/server.js
```
The server will **auto-select a free port** and display it in the logs.

---

## ⚙ Windsurf MCP Config Example
```json
{
  "mcpServers": {
    "node-typer": {
      "command": "node",
      "args": ["/absolute/path/to/node-typer-MCP/dist/server.js"],
      "cwd": "/absolute/path/to/node-typer-MCP"
    }
  }
}
```

---

## 📡 API Usage
Example call to **`typewrite`**:
```bash
curl -X POST http://localhost:PORT/mcp/run   -H "Content-Type: application/json"   -d '{"action": "typewrite", "params": {"text": "Hello World", "speed": 50}}'
```

Example call to **`transform_data`**:
```bash
curl -X POST http://localhost:PORT/mcp/run   -H "Content-Type: application/json"   -d '{"action": "transform_data", "params": {"data": {"hello":"world"}, "from_format": "json", "to_format": "yaml"}}'
```

---

## 🤝 Contributing
We welcome contributions!

**Steps:**
1. Fork the repo and create a branch:  
   ```bash
   git checkout -b feat/my-feature
   ```
2. Add new tools under `src/tools/`.
3. Update `src/server.ts` to register the tool.
4. Write unit tests in `tests/`.
5. Run `npm test` before committing.
6. Submit a Pull Request.

**Code Style:**
- Follow ESLint + Prettier configuration.
- Use TypeScript strict mode.
- Keep functions small and maintainable.

---

## 📜 License
MIT License — see [LICENSE](LICENSE).