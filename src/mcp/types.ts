export interface MCPRequest {
  action: 'typewrite' | 'infer' | 'cast' | 'log' | 'generate_n8n_workflow' | 'transform_data' | 'validate_data' | 'evaluate_expression' | 'manage_secrets' | 'web_intelligence' | 'cognitive_task' | 'cognitive_search' | 'analytics_brain' | 'vision_intelligence' | 'orchestrator_brain' | 'system_intelligence' | 'memory_brain' | 'database_intelligence' | 'self_improvement';
  params: Record<string, unknown>;
}

export interface MCPResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface TypewriteParams {
  text: string;
  speed?: number;
  delay?: number;
}

export interface InferParams {
  value: unknown;
}

export interface CastParams {
  value: unknown;
  type: string;
}

export interface LogParams {
  message: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  animated?: boolean;
}

export interface SelfImprovementParams {
  action: 'analyze_failure' | 'create_tool' | 'improve_tool' | 'list_tools' | 'backup_config';
  task_description?: string;
  failure_reason?: string;
  tool_name?: string;
  improvement_type?: string;
  tool_definition?: any;
}