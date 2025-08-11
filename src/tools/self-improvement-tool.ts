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

  constructor() {
    // Dynamic import to avoid circular dependencies
    this.initializeEngine();
  }

  private async initializeEngine() {
    const { SelfImprovementEngine } = await import('../brain/self-improvement');
    this.improvementEngine = new SelfImprovementEngine();
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

    const success = await this.improvementEngine.createNewTool(params.tool_definition);

    return {
      success,
      message: success 
        ? `Successfully created new tool: ${params.tool_definition.name}`
        : 'Failed to create new tool',
      tool_name: params.tool_definition.name,
      files_modified: success ? [
        'src/tools/' + params.tool_definition.name.replace(/_/g, '-') + '.ts',
        'src/mcp/types.ts',
        'src/mcp/adapter.ts',
        'src/server.ts',
        'mcp-config.json'
      ] : []
    };
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
    const availableTools = [
      { name: 'typewrite', category: 'utility', description: 'Typewriter simulation' },
      { name: 'infer_type', category: 'utility', description: 'Type inference' },
      { name: 'cast_type', category: 'utility', description: 'Type casting' },
      { name: 'log_message', category: 'utility', description: 'Logging' },
      { name: 'generate_n8n_workflow', category: 'automation', description: 'N8N workflow generation' },
      { name: 'transform_data', category: 'data', description: 'Data transformation' },
      { name: 'validate_data', category: 'data', description: 'Data validation' },
      { name: 'evaluate_expression', category: 'computation', description: 'Expression evaluation' },
      { name: 'manage_secrets', category: 'security', description: 'Secret management' },
      { name: 'web_intelligence', category: 'intelligence', description: 'Web data gathering' },
      { name: 'cognitive_search', category: 'intelligence', description: 'Intelligent search' },
      { name: 'analytics_brain', category: 'intelligence', description: 'Statistical analysis' },
      { name: 'vision_intelligence', category: 'intelligence', description: 'Image analysis' },
      { name: 'orchestrator_brain', category: 'intelligence', description: 'Task orchestration' },
      { name: 'system_intelligence', category: 'intelligence', description: 'System operations' },
      { name: 'memory_brain', category: 'intelligence', description: 'Memory management' },
      { name: 'database_intelligence', category: 'intelligence', description: 'Database operations' },
      { name: 'self_improvement', category: 'meta', description: 'Self-improvement capabilities' }
    ];

    return {
      success: true,
      total_tools: availableTools.length,
      tools: availableTools,
      categories: {
        utility: availableTools.filter(t => t.category === 'utility').length,
        intelligence: availableTools.filter(t => t.category === 'intelligence').length,
        data: availableTools.filter(t => t.category === 'data').length,
        automation: availableTools.filter(t => t.category === 'automation').length,
        computation: availableTools.filter(t => t.category === 'computation').length,
        security: availableTools.filter(t => t.category === 'security').length,
        meta: availableTools.filter(t => t.category === 'meta').length
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
      'mcp-config.json',
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
}