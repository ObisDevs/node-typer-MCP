import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCPAdapter } from './mcp/index.js';

const server = new Server({
  name: 'node-typer',
  version: '1.0.0',
  capabilities: {
    tools: {},
  },
});

const adapter = new MCPAdapter();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'typewrite',
        description: 'Simulate typing text with customizable speed',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to type' },
            speed: { type: 'number', description: 'Typing speed in ms' },
            delay: { type: 'number', description: 'Initial delay in ms' }
          },
          required: ['text']
        }
      },
      {
        name: 'infer_type',
        description: 'Infer the type of a value intelligently',
        inputSchema: {
          type: 'object',
          properties: {
            value: { description: 'Value to analyze' }
          },
          required: ['value']
        }
      },
      {
        name: 'cast_type',
        description: 'Cast a value to a specific type safely',
        inputSchema: {
          type: 'object',
          properties: {
            value: { description: 'Value to cast' },
            type: { type: 'string', description: 'Target type' }
          },
          required: ['value', 'type']
        }
      },
      {
        name: 'log_message',
        description: 'Log a message with specified level',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to log' },
            level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
            animated: { type: 'boolean', description: 'Use animated logging' }
          },
          required: ['message']
        }
      },
      {
        name: 'generate_n8n_workflow',
        description: 'Generate n8n workflow JSON from natural language description',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Natural language workflow description' },
            trigger: { type: 'string', enum: ['webhook', 'cron', 'manual'], description: 'Workflow trigger type' },
            nodes: { type: 'array', items: { type: 'string' }, description: 'Required node types' }
          },
          required: ['description']
        }
      },
      {
        name: 'transform_data',
        description: 'Transform data between different formats and structures',
        inputSchema: {
          type: 'object',
          properties: {
            data: { description: 'Input data to transform' },
            from_format: { type: 'string', enum: ['json', 'csv', 'xml', 'yaml'] },
            to_format: { type: 'string', enum: ['json', 'csv', 'xml', 'yaml'] },
            mapping: { type: 'object', description: 'Field mapping rules' }
          },
          required: ['data', 'from_format', 'to_format']
        }
      },
      {
        name: 'validate_data',
        description: 'Validate data against schemas, patterns, and business rules',
        inputSchema: {
          type: 'object',
          properties: {
            data: { description: 'Data to validate' },
            schema: { type: 'object', description: 'JSON schema or validation rules' },
            strict: { type: 'boolean', description: 'Strict validation mode' },
            custom_rules: { type: 'array', items: { type: 'string' }, description: 'Custom validation rules' }
          },
          required: ['data', 'schema']
        }
      },
      {
        name: 'evaluate_expression',
        description: 'Safely evaluate mathematical, logical, and string expressions',
        inputSchema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Expression to evaluate' },
            variables: { type: 'object', description: 'Variables for the expression' },
            type: { type: 'string', enum: ['math', 'logic', 'string', 'date'], description: 'Expression type' },
            safe_mode: { type: 'boolean', description: 'Enable safe evaluation mode' }
          },
          required: ['expression']
        }
      },
      {
        name: 'manage_secrets',
        description: 'Securely store, retrieve, and mask sensitive data',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['store', 'retrieve', 'mask', 'generate'], description: 'Secret management action' },
            key: { type: 'string', description: 'Secret identifier' },
            value: { type: 'string', description: 'Secret value (for store action)' },
            type: { type: 'string', enum: ['api_key', 'token', 'password', 'certificate'], description: 'Secret type' },
            mask_pattern: { type: 'string', description: 'Pattern for masking secrets' }
          },
          required: ['action', 'key']
        }
      },
      {
        name: 'web_intelligence',
        description: 'Fetch, scrape, and analyze web content with cognitive processing',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['fetch', 'scrape', 'analyze', 'summarize'], description: 'Web intelligence action' },
            url: { type: 'string', description: 'Single URL to process' },
            urls: { type: 'array', items: { type: 'string' }, description: 'Multiple URLs to process' },
            query: { type: 'string', description: 'Search query for web intelligence' },
            options: { type: 'object', description: 'Additional options for processing' }
          },
          required: ['action']
        }
      },
      {
        name: 'cognitive_task',
        description: 'Plan and execute multi-step cognitive tasks with brain intelligence',
        inputSchema: {
          type: 'object',
          properties: {
            task_action: { type: 'string', enum: ['plan', 'execute'], description: 'Cognitive task action' },
            description: { type: 'string', description: 'Task description for planning' },
            task_id: { type: 'string', description: 'Task ID for execution' },
            context: { type: 'object', description: 'Additional context for task' }
          },
          required: ['task_action']
        }
      },
      {
        name: 'cognitive_search',
        description: 'Advanced search with AI-powered analysis and correlation',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['search', 'semantic_search', 'fact_check', 'trend_analysis', 'knowledge_graph'], description: 'Search action type' },
            query: { type: 'string', description: 'Search query' },
            engines: { type: 'array', items: { type: 'string' }, description: 'Search engines to use' },
            filters: { type: 'object', description: 'Search filters (timeframe, domain, etc.)' },
            options: { type: 'object', description: 'Search options (max_results, credibility_threshold, etc.)' }
          },
          required: ['action', 'query']
        }
      },
      {
        name: 'analytics_brain',
        description: 'Big data processing with statistical and ML analysis',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['analyze', 'correlate', 'forecast', 'cluster', 'anomaly_detect', 'statistical_test'], description: 'Analytics action type' },
            data: { description: 'Data to analyze (arrays, objects, time series)' },
            options: { type: 'object', description: 'Analysis options (algorithm, confidence_level, features, etc.)' }
          },
          required: ['action', 'data']
        }
      },
      {
        name: 'vision_intelligence',
        description: 'Image and video frame analysis with cognitive interpretation',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['analyze', 'ocr', 'detect_objects', 'extract_data', 'compare', 'describe'], description: 'Vision analysis action' },
            image_url: { type: 'string', description: 'URL of image to analyze' },
            image_urls: { type: 'array', items: { type: 'string' }, description: 'Multiple image URLs for comparison' },
            image_data: { type: 'string', description: 'Base64 encoded image data' },
            options: { type: 'object', description: 'Analysis options (extract_text, detect_faces, analyze_charts, etc.)' }
          },
          required: ['action']
        }
      },
      {
        name: 'orchestrator_brain',
        description: 'Meta-tool that coordinates all tools for complex cognitive tasks',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['orchestrate', 'optimize', 'monitor', 'adapt', 'coordinate'], description: 'Orchestration action type' },
            task_description: { type: 'string', description: 'Complex task to orchestrate' },
            tools_available: { type: 'array', items: { type: 'string' }, description: 'Available tools for orchestration' },
            constraints: { type: 'object', description: 'Execution constraints (time, priority, resources)' },
            context: { type: 'object', description: 'Additional context for orchestration' }
          },
          required: ['action', 'task_description']
        }
      },
      {
        name: 'system_intelligence',
        description: 'Terminal, SSH, code execution, and system administration with cognitive intelligence',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['execute_command', 'ssh_connect', 'run_code', 'file_operations', 'system_monitor', 'process_manage'], description: 'System operation type' },
            command: { type: 'string', description: 'Command to execute' },
            code: { type: 'string', description: 'Code to execute' },
            language: { type: 'string', description: 'Programming language' },
            ssh_config: { type: 'object', description: 'SSH connection configuration' },
            file_config: { type: 'object', description: 'File operation configuration' },
            security: { type: 'object', description: 'Security and sandbox settings' }
          },
          required: ['action']
        }
      },
      {
        name: 'memory_brain',
        description: 'Persistent memory and continuous learning with associations',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['store', 'recall', 'learn', 'forget', 'associate', 'search_memory'], description: 'Memory operation type' },
            key: { type: 'string', description: 'Memory key identifier' },
            value: { description: 'Value to store' },
            context: { type: 'object', description: 'Contextual information' },
            query: { type: 'string', description: 'Search query' },
            associations: { type: 'array', items: { type: 'string' }, description: 'Associated keys' },
            learning_data: { type: 'object', description: 'Pattern learning data' },
            retention_policy: { type: 'object', description: 'Memory retention settings' }
          },
          required: ['action']
        }
      },
      {
        name: 'database_intelligence',
        description: 'Multi-database operations with intelligent analysis and optimization',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['query', 'schema_analysis', 'optimization', 'migration', 'backup', 'connect'], description: 'Database operation type' },
            connection: { type: 'object', description: 'Database connection configuration' },
            query: { type: 'string', description: 'SQL query to execute' },
            schema_config: { type: 'object', description: 'Schema analysis configuration' },
            optimization_config: { type: 'object', description: 'Optimization analysis settings' },
            migration_config: { type: 'object', description: 'Migration planning configuration' }
          },
          required: ['action']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  let action: string;
  let params: any;
  
  switch (name) {
    case 'typewrite':
      action = 'typewrite';
      params = args;
      break;
    case 'infer_type':
      action = 'infer';
      params = args;
      break;
    case 'cast_type':
      action = 'cast';
      params = args;
      break;
    case 'log_message':
      action = 'log';
      params = args;
      break;
    case 'generate_n8n_workflow':
      action = 'generate_n8n_workflow';
      params = args;
      break;
    case 'transform_data':
      action = 'transform_data';
      params = args;
      break;
    case 'validate_data':
      action = 'validate_data';
      params = args;
      break;
    case 'evaluate_expression':
      action = 'evaluate_expression';
      params = args;
      break;
    case 'manage_secrets':
      action = 'manage_secrets';
      params = args;
      break;
    case 'web_intelligence':
      action = 'web_intelligence';
      params = args;
      break;
    case 'cognitive_task':
      action = 'cognitive_task';
      params = args;
      break;
    case 'cognitive_search':
      action = 'cognitive_search';
      params = args;
      break;
    case 'analytics_brain':
      action = 'analytics_brain';
      params = args;
      break;
    case 'vision_intelligence':
      action = 'vision_intelligence';
      params = args;
      break;
    case 'orchestrator_brain':
      action = 'orchestrator_brain';
      params = args;
      break;
    case 'system_intelligence':
      action = 'system_intelligence';
      params = args;
      break;
    case 'memory_brain':
      action = 'memory_brain';
      params = args;
      break;
    case 'database_intelligence':
      action = 'database_intelligence';
      params = args;
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
  
  const response = await adapter.processRequest({ action: action as any, params });
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }
    ]
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main().catch(console.error);
}

export { server, adapter };