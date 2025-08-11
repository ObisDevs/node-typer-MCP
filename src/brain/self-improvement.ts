import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  implementation: string;
  category: string;
  dependencies: string[];
}

export interface ImprovementAnalysis {
  missingCapability: string;
  suggestedTool: ToolDefinition;
  confidence: number;
  reasoning: string;
}

export class SelfImprovementEngine {
  private toolsPath = join(process.cwd(), 'src/tools');
  private configPath = join(process.cwd(), 'mcp-config.json');
  private typesPath = join(process.cwd(), 'src/mcp/types.ts');
  private adapterPath = join(process.cwd(), 'src/mcp/adapter.ts');
  private serverPath = join(process.cwd(), 'src/server.ts');

  async analyzeTaskFailure(taskDescription: string, failureReason: string, availableTools: string[]): Promise<ImprovementAnalysis | null> {
    const analysis = this.identifyMissingCapability(taskDescription, failureReason, availableTools);
    
    if (analysis.confidence > 0.7) {
      return analysis;
    }
    
    return null;
  }

  async createNewTool(toolDef: ToolDefinition): Promise<boolean> {
    try {
      // Generate tool implementation
      const toolCode = this.generateToolImplementation(toolDef);
      const toolPath = join(this.toolsPath, `${toolDef.name.replace(/_/g, '-')}.ts`);
      
      writeFileSync(toolPath, toolCode);
      
      // Update MCP types
      await this.updateMCPTypes(toolDef);
      
      // Update adapter
      await this.updateAdapter(toolDef);
      
      // Update server
      await this.updateServer(toolDef);
      
      // Update config
      await this.updateConfig(toolDef);
      
      return true;
    } catch (error) {
      console.error('Failed to create new tool:', error);
      return false;
    }
  }

  async improveTool(toolName: string, improvement: string): Promise<boolean> {
    try {
      const toolPath = join(this.toolsPath, `${toolName.replace(/_/g, '-')}.ts`);
      
      if (!existsSync(toolPath)) return false;
      
      const currentCode = readFileSync(toolPath, 'utf8');
      const improvedCode = this.applyImprovement(currentCode, improvement);
      
      writeFileSync(toolPath, improvedCode);
      
      return true;
    } catch (error) {
      console.error('Failed to improve tool:', error);
      return false;
    }
  }

  private identifyMissingCapability(task: string, failure: string, tools: string[]): ImprovementAnalysis {
    const lower = task.toLowerCase();
    const failureLower = failure.toLowerCase();
    
    // API Integration needs
    if ((lower.includes('api') || lower.includes('rest') || lower.includes('graphql')) && 
        !tools.includes('api_client')) {
      return {
        missingCapability: 'API Integration',
        suggestedTool: {
          name: 'api_client',
          description: 'Advanced API client for REST, GraphQL, and webhook integrations',
          parameters: {
            action: { type: 'string', enum: ['get', 'post', 'put', 'delete', 'graphql', 'webhook'] },
            url: { type: 'string' },
            headers: { type: 'object' },
            data: { type: 'object' },
            auth: { type: 'object' }
          },
          implementation: 'api-client',
          category: 'integration',
          dependencies: ['axios', 'graphql-request']
        },
        confidence: 0.9,
        reasoning: 'Task requires API integration capabilities not available in current toolset'
      };
    }

    // File Processing needs
    if ((lower.includes('file') || lower.includes('document') || lower.includes('pdf')) && 
        !tools.includes('file_processor')) {
      return {
        missingCapability: 'File Processing',
        suggestedTool: {
          name: 'file_processor',
          description: 'Advanced file processing for documents, PDFs, images, and archives',
          parameters: {
            action: { type: 'string', enum: ['read', 'convert', 'extract', 'compress', 'merge'] },
            file_path: { type: 'string' },
            format: { type: 'string' },
            options: { type: 'object' }
          },
          implementation: 'file-processor',
          category: 'utility',
          dependencies: ['pdf-parse', 'sharp', 'archiver']
        },
        confidence: 0.85,
        reasoning: 'Task requires file processing capabilities beyond current scope'
      };
    }

    // Machine Learning needs
    if ((lower.includes('ml') || lower.includes('model') || lower.includes('train')) && 
        !tools.includes('ml_engine')) {
      return {
        missingCapability: 'Machine Learning',
        suggestedTool: {
          name: 'ml_engine',
          description: 'Machine learning model training, inference, and optimization',
          parameters: {
            action: { type: 'string', enum: ['train', 'predict', 'evaluate', 'optimize'] },
            model_type: { type: 'string' },
            data: { type: 'object' },
            config: { type: 'object' }
          },
          implementation: 'ml-engine',
          category: 'ai',
          dependencies: ['tensorflow', 'scikit-learn']
        },
        confidence: 0.8,
        reasoning: 'Task requires machine learning capabilities not in current toolset'
      };
    }

    return {
      missingCapability: 'Unknown',
      suggestedTool: {
        name: 'generic_tool',
        description: 'Generic tool for unidentified capabilities',
        parameters: { action: { type: 'string' }, params: { type: 'object' } },
        implementation: 'generic',
        category: 'utility',
        dependencies: []
      },
      confidence: 0.3,
      reasoning: 'Could not identify specific missing capability'
    };
  }

  private generateToolImplementation(toolDef: ToolDefinition): string {
    return `export interface ${this.toPascalCase(toolDef.name)}Params {
  action: string;
  [key: string]: any;
}

export class ${this.toPascalCase(toolDef.name)} {
  async execute(params: ${this.toPascalCase(toolDef.name)}Params): Promise<any> {
    try {
      switch (params.action) {
        ${this.generateActionCases(toolDef)}
        default:
          throw new Error(\`Unknown action: \${params.action}\`);
      }
    } catch (error) {
      throw new Error(\`${toolDef.name} execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    }
  }

  ${this.generateHelperMethods(toolDef)}
}
`;
  }

  private generateActionCases(toolDef: ToolDefinition): string {
    const actions = toolDef.parameters.action?.enum || ['execute'];
    return actions.map(action => `
        case '${action}':
          return await this.${action}(params);`).join('');
  }

  private generateHelperMethods(toolDef: ToolDefinition): string {
    const actions = toolDef.parameters.action?.enum || ['execute'];
    return actions.map(action => `
  private async ${action}(params: any): Promise<any> {
    // TODO: Implement ${action} functionality
    return { success: true, action: '${action}', result: 'Implementation needed' };
  }`).join('\n');
  }

  private async updateMCPTypes(toolDef: ToolDefinition): Promise<void> {
    const typesContent = readFileSync(this.typesPath, 'utf8');
    const newAction = `  | '${toolDef.name}'`;
    const updatedContent = typesContent.replace(
      /export type MCPAction = [^;]+;/,
      match => match.replace(';', newAction + ';')
    );
    writeFileSync(this.typesPath, updatedContent);
  }

  private async updateAdapter(toolDef: ToolDefinition): Promise<void> {
    const adapterContent = readFileSync(this.adapterPath, 'utf8');
    const importStatement = `import { ${this.toPascalCase(toolDef.name)} } from '../tools/${toolDef.name.replace(/_/g, '-')}';`;
    const caseStatement = `
      case '${toolDef.name}':
        const ${toolDef.name}Tool = new ${this.toPascalCase(toolDef.name)}();
        return await ${toolDef.name}Tool.execute(params);`;
    
    const updatedContent = adapterContent
      .replace(/^(import.*\n)+/, match => match + importStatement + '\n')
      .replace(/default:\s*throw new Error/, caseStatement + '\n      default:\n        throw new Error');
    
    writeFileSync(this.adapterPath, updatedContent);
  }

  private async updateServer(toolDef: ToolDefinition): Promise<void> {
    const serverContent = readFileSync(this.serverPath, 'utf8');
    const toolDefinition = `
    {
      name: '${toolDef.name}',
      description: '${toolDef.description}',
      inputSchema: {
        type: 'object',
        properties: ${JSON.stringify(toolDef.parameters, null, 8)},
        required: ['action']
      }
    },`;
    
    const updatedContent = serverContent.replace(
      /const tools: Tool\[\] = \[([^}]+)\];/s,
      match => match.replace('];', toolDefinition + '\n  ];')
    );
    
    writeFileSync(this.serverPath, updatedContent);
  }

  private async updateConfig(toolDef: ToolDefinition): Promise<void> {
    const config = JSON.parse(readFileSync(this.configPath, 'utf8'));
    config.tools = config.tools || [];
    config.tools.push({
      name: toolDef.name,
      description: toolDef.description,
      category: toolDef.category
    });
    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  private applyImprovement(currentCode: string, improvement: string): string {
    // Simple improvement application - in production, use AST manipulation
    const improvements = {
      'add_error_handling': (code: string) => code.replace(
        /async (\w+)\([^)]*\): Promise<[^>]+> {/g,
        match => match + '\n    try {'
      ).replace(/return ([^;]+);/g, 'return $1;\n    } catch (error) {\n      throw error;\n    }'),
      
      'add_logging': (code: string) => code.replace(
        /async (\w+)\([^)]*\): Promise<[^>]+> {/g,
        match => match + '\n    console.log(`Executing ${this.constructor.name}.$1`);'
      ),
      
      'optimize_performance': (code: string) => code.replace(
        /await /g, 'await Promise.resolve('
      ).replace(/;/g, ');')
    };
    
    return improvements[improvement as keyof typeof improvements]?.(currentCode) || currentCode;
  }

  private toPascalCase(str: string): string {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }
}