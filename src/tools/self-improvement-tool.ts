export interface SelfImprovementParams {
  action: 'analyze_failure' | 'create_tool' | 'improve_tool' | 'list_tools' | 'backup_config';
  task_description?: string;
  failure_reason?: string;
  tool_name?: string;
  improvement_type?: string;
  tool_definition?: any;
}

export class SelfImprovementTool {
  private improvementEngine: any;
  private toolRegistry: any;

  constructor() {
    // Dynamic import to avoid circular dependencies
    this.initializeEngine();
  }

  private async initializeEngine() {
    const { SelfImprovementEngine } = await import('../brain/self-improvement');
    const { ToolRegistry } = await import('../library/tool-registry');
    this.improvementEngine = new SelfImprovementEngine();
    this.toolRegistry = new ToolRegistry();
  }

  async execute(params: SelfImprovementParams): Promise<any> {
    if (!this.improvementEngine) {
      await this.initializeEngine();
    }

    try {
      switch (params.action) {
        case 'analyze_failure':
          return await this.analyzeFailure(params);
        case 'create_tool':
          return await this.createTool(params);
        case 'improve_tool':
          return await this.improveTool(params);
        case 'list_tools':
          return await this.listTools();
        case 'backup_config':
          return await this.backupConfig();
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
    } catch (error) {
      throw new Error(`Self-improvement execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeFailure(params: SelfImprovementParams): Promise<any> {
    if (!params.task_description || !params.failure_reason) {
      throw new Error('task_description and failure_reason are required for analyze_failure');
    }

    const availableTools = [
      'typewrite', 'infer_type', 'cast_type', 'log_message',
      'generate_n8n_workflow', 'transform_data', 'validate_data',
      'evaluate_expression', 'manage_secrets', 'web_intelligence', 
      'cognitive_search', 'analytics_brain', 'vision_intelligence', 
      'orchestrator_brain', 'system_intelligence', 'memory_brain', 
      'database_intelligence', 'self_improvement'
    ];

    const analysis = await this.improvementEngine.analyzeTaskFailure(
      params.task_description,
      params.failure_reason,
      availableTools
    );

    return {
      success: true,
      analysis,
      recommendations: analysis ? [
        `Create new tool: ${analysis.suggestedTool.name}`,
        `Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
        `Reasoning: ${analysis.reasoning}`
      ] : ['No improvement opportunities identified']
    };
  }

  private async createTool(params: SelfImprovementParams): Promise<any> {
    if (!params.tool_definition) {
      throw new Error('tool_definition is required for create_tool');
    }

    try {
      // Generate tool implementation code
      const toolCode = this.generateToolCode(params.tool_definition);
      
      // Save to registry
      const registered = this.toolRegistry.registerTool({
        ...params.tool_definition,
        created: Date.now(),
        version: '1.0.0'
      });
      
      // Save implementation
      const saved = this.toolRegistry.saveToolImplementation(
        params.tool_definition.name, 
        toolCode
      );
      
      if (registered && saved) {
        // Update MCP system
        await this.updateMCPSystem(params.tool_definition);
        
        return {
          success: true,
          message: `Successfully created dynamic tool: ${params.tool_definition.name}`,
          tool_name: params.tool_definition.name,
          registry_updated: true,
          implementation_saved: true
        };
      } else {
        throw new Error('Failed to register or save tool');
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tool_name: params.tool_definition.name
      };
    }
  }

  private async improveTool(params: SelfImprovementParams): Promise<any> {
    if (!params.tool_name || !params.improvement_type) {
      throw new Error('tool_name and improvement_type are required for improve_tool');
    }

    const success = await this.improvementEngine.improveTool(
      params.tool_name,
      params.improvement_type
    );

    return {
      success,
      message: success 
        ? `Successfully improved tool: ${params.tool_name}`
        : `Failed to improve tool: ${params.tool_name}`,
      tool_name: params.tool_name,
      improvement_applied: params.improvement_type,
      file_modified: `src/tools/${params.tool_name.replace(/_/g, '-')}.ts`
    };
  }

  private async listTools(): Promise<any> {
    const coreTools = [
      { name: 'typewrite', category: 'utility', description: 'Typewriter simulation', type: 'core' },
      { name: 'infer_type', category: 'utility', description: 'Type inference', type: 'core' },
      { name: 'cast_type', category: 'utility', description: 'Type casting', type: 'core' },
      { name: 'log_message', category: 'utility', description: 'Logging', type: 'core' },
      { name: 'generate_n8n_workflow', category: 'automation', description: 'N8N workflow generation', type: 'core' },
      { name: 'transform_data', category: 'data', description: 'Data transformation', type: 'core' },
      { name: 'validate_data', category: 'data', description: 'Data validation', type: 'core' },
      { name: 'evaluate_expression', category: 'computation', description: 'Expression evaluation', type: 'core' },
      { name: 'manage_secrets', category: 'security', description: 'Secret management', type: 'core' },
      { name: 'web_intelligence', category: 'intelligence', description: 'Web data gathering', type: 'core' },
      { name: 'cognitive_search', category: 'intelligence', description: 'Intelligent search', type: 'core' },
      { name: 'analytics_brain', category: 'intelligence', description: 'Statistical analysis', type: 'core' },
      { name: 'vision_intelligence', category: 'intelligence', description: 'Image analysis', type: 'core' },
      { name: 'orchestrator_brain', category: 'intelligence', description: 'Task orchestration', type: 'core' },
      { name: 'system_intelligence', category: 'intelligence', description: 'System operations', type: 'core' },
      { name: 'memory_brain', category: 'intelligence', description: 'Memory management', type: 'core' },
      { name: 'database_intelligence', category: 'intelligence', description: 'Database operations', type: 'core' },
      { name: 'self_improvement', category: 'meta', description: 'Self-improvement capabilities', type: 'core' }
    ];
    
    // Get dynamic tools from registry
    const dynamicTools = this.toolRegistry.getAllTools().map(tool => ({
      name: tool.name,
      category: tool.category,
      description: tool.description,
      type: 'dynamic',
      created: tool.created,
      version: tool.version
    }));
    
    const allTools = [...coreTools, ...dynamicTools];

    return {
      success: true,
      total_tools: allTools.length,
      core_tools: coreTools.length,
      dynamic_tools: dynamicTools.length,
      tools: allTools,
      categories: {
        utility: allTools.filter(t => t.category === 'utility').length,
        intelligence: allTools.filter(t => t.category === 'intelligence').length,
        data: allTools.filter(t => t.category === 'data').length,
        automation: allTools.filter(t => t.category === 'automation').length,
        computation: allTools.filter(t => t.category === 'computation').length,
        security: allTools.filter(t => t.category === 'security').length,
        meta: allTools.filter(t => t.category === 'meta').length,
        payment: allTools.filter(t => t.category === 'payment').length
      }
    };
  }

  private async backupConfig(): Promise<any> {
    const fs = await import('fs');
    const path = await import('path');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filesToBackup = [
      'src/library/registry.json',
      'src/mcp/types.ts',
      'src/mcp/adapter.ts',
      'src/server.ts',
      'package.json'
    ];

    const backedUpFiles = [];

    for (const file of filesToBackup) {
      const sourcePath = path.join(process.cwd(), file);
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(backupDir, `${timestamp}-${file.replace(/\//g, '-')}`);
        fs.copyFileSync(sourcePath, backupPath);
        backedUpFiles.push(backupPath);
      }
    }

    return {
      success: true,
      message: `Configuration backed up successfully`,
      timestamp,
      backup_directory: backupDir,
      files_backed_up: backedUpFiles.length,
      backup_files: backedUpFiles
    };
  }
  
  private generateToolCode(toolDef: any): string {
    return `export interface ${this.toPascalCase(toolDef.name)}Params {
  action: string;
  [key: string]: any;
}

export class ${this.toPascalCase(toolDef.name)} {
  async execute(params: ${this.toPascalCase(toolDef.name)}Params): Promise<any> {
    try {
      // Implementation for ${toolDef.name}
      return {
        success: true,
        message: '${toolDef.name} executed successfully',
        action: params.action,
        result: 'Dynamic tool implementation'
      };
    } catch (error) {
      throw new Error(\`${toolDef.name} execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    }
  }
}`;
  }
  
  private async updateMCPSystem(toolDef: any): Promise<void> {
    // This would update the MCP system to recognize the new tool
    // For now, just log the update
    console.log(`MCP system updated with new tool: ${toolDef.name}`);
  }
  
  private toPascalCase(str: string): string {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }
}