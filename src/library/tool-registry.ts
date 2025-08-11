import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface DynamicTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  implementation: string;
  category: string;
  dependencies: string[];
  created: number;
  version: string;
}

export class ToolRegistry {
  private registryPath = join(process.cwd(), 'src/library/registry.json');
  private toolsPath = join(process.cwd(), 'src/library/tools');

  constructor() {
    try {
      this.ensureDirectories();
    } catch (error) {
      console.warn('ToolRegistry initialization warning:', error);
    }
  }

  private ensureDirectories(): void {
    try {
      const libDir = join(process.cwd(), 'src/library');
      if (!existsSync(libDir)) mkdirSync(libDir, { recursive: true });
      if (!existsSync(this.toolsPath)) mkdirSync(this.toolsPath, { recursive: true });
      if (!existsSync(this.registryPath)) {
        writeFileSync(this.registryPath, JSON.stringify({ tools: [], version: '1.0.0' }, null, 2));
      }
    } catch (error) {
      // Fallback: use a temporary directory if src/library fails
      console.warn('Failed to create src/library, using temp directory');
      this.registryPath = join(process.cwd(), 'registry.json');
      this.toolsPath = join(process.cwd(), 'dynamic-tools');
      if (!existsSync(this.toolsPath)) mkdirSync(this.toolsPath, { recursive: true });
      if (!existsSync(this.registryPath)) {
        writeFileSync(this.registryPath, JSON.stringify({ tools: [], version: '1.0.0' }, null, 2));
      }
    }
  }

  registerTool(tool: DynamicTool): boolean {
    try {
      const registry = this.getRegistry();
      const existingIndex = registry.tools.findIndex(t => t.name === tool.name);
      
      if (existingIndex >= 0) {
        registry.tools[existingIndex] = { ...tool, created: Date.now() };
      } else {
        registry.tools.push({ ...tool, created: Date.now(), version: '1.0.0' });
      }
      
      writeFileSync(this.registryPath, JSON.stringify(registry, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to register tool:', error);
      return false;
    }
  }

  getTool(name: string): DynamicTool | null {
    const registry = this.getRegistry();
    return registry.tools.find(t => t.name === name) || null;
  }

  getAllTools(): DynamicTool[] {
    return this.getRegistry().tools;
  }

  removeTool(name: string): boolean {
    try {
      const registry = this.getRegistry();
      registry.tools = registry.tools.filter(t => t.name !== name);
      writeFileSync(this.registryPath, JSON.stringify(registry, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  }

  saveToolImplementation(name: string, code: string): boolean {
    try {
      const toolPath = join(this.toolsPath, `${name}.ts`);
      writeFileSync(toolPath, code);
      return true;
    } catch (error) {
      return false;
    }
  }

  loadToolImplementation(name: string): string | null {
    try {
      const toolPath = join(this.toolsPath, `${name}.ts`);
      if (existsSync(toolPath)) {
        return readFileSync(toolPath, 'utf8');
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private getRegistry(): { tools: DynamicTool[], version: string } {
    try {
      return JSON.parse(readFileSync(this.registryPath, 'utf8'));
    } catch (error) {
      return { tools: [], version: '1.0.0' };
    }
  }
}