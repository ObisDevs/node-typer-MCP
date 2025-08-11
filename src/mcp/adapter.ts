import type { MCPRequest, MCPResponse, TypewriteParams, InferParams, CastParams, LogParams } from './types.js';
import { typewrite } from '../core/index.js';
import { createLogger } from '../logger/index.js';
import { inferType, cast } from '../utils/index.js';
import { generateN8NWorkflow, type N8NWorkflowParams } from '../tools/n8n-generator.js';
import { transformData, type DataTransformParams } from '../tools/data-transformer.js';
import { validateData, type ValidateDataParams } from '../tools/smart-validator.js';
import { evaluateExpression, type EvaluateExpressionParams } from '../tools/expression-evaluator.js';
import { manageSecrets, type ManageSecretsParams } from '../tools/secret-manager.js';
import { webIntelligence, type WebIntelligenceParams } from '../tools/web-intelligence.js';
import { CognitiveBrain, type CognitiveResponse } from '../brain/cognitive-core.js';
import { cognitiveSearch, type CognitiveSearchParams } from '../tools/cognitive-search.js';
import { analyticsBrain, type AnalyticsBrainParams } from '../tools/analytics-brain.js';
import { visionIntelligence, type VisionIntelligenceParams } from '../tools/vision-intelligence.js';
import { orchestratorBrain, type OrchestratorParams } from '../tools/orchestrator-brain.js';
import { systemIntelligence, type SystemIntelligenceParams } from '../tools/system-intelligence.js';
import { memoryBrain, type MemoryBrainParams } from '../tools/memory-brain.js';
import { databaseIntelligence, type DatabaseIntelligenceParams } from '../tools/database-intelligence.js';

export class MCPAdapter {
  private logger = createLogger({ animated: false });
  private cognitiveBrain = new CognitiveBrain();

  async processRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.action) {
        case 'typewrite': {
          const { text, speed, delay } = request.params as unknown as TypewriteParams;
          if (!text) throw new Error('text parameter required');
          
          // Capture output for non-TTY environments
          let output = '';
          const originalWrite = process.stdout.write;
          process.stdout.write = (chunk: any) => {
            output += chunk;
            return true;
          };
          
          await typewrite(text, { speed, delay });
          process.stdout.write = originalWrite;
          
          return { success: true, result: { output, text } };
        }
        
        case 'infer': {
          const { value } = request.params as unknown as InferParams;
          const type = inferType(value);
          return { success: true, result: { value, type } };
        }
        
        case 'cast': {
          const { value, type } = request.params as unknown as CastParams;
          if (!type) throw new Error('type parameter required');
          const result = cast(value, type);
          return { success: true, result: { original: value, casted: result, type } };
        }
        
        case 'log': {
          const { message, level = 'info', animated } = request.params as unknown as LogParams;
          if (!message) throw new Error('message parameter required');
          
          const logger = createLogger({ animated: animated ?? !process.env.CI });
          logger[level](message);
          
          return { success: true, result: { message, level, logged: true } };
        }
        
        case 'generate_n8n_workflow': {
          const { description, trigger, nodes } = request.params as unknown as N8NWorkflowParams;
          if (!description) throw new Error('description parameter required');
          
          const workflow = generateN8NWorkflow({ description, trigger, nodes });
          return { success: true, result: { workflow, nodeCount: workflow.nodes.length } };
        }
        
        case 'transform_data': {
          const { data, from_format, to_format, mapping } = request.params as unknown as DataTransformParams;
          if (!data || !from_format || !to_format) throw new Error('data, from_format, and to_format parameters required');
          
          const result = transformData({ data, from_format, to_format, mapping });
          return { success: true, result };
        }
        
        case 'validate_data': {
          const { data, schema, strict, custom_rules } = request.params as unknown as ValidateDataParams;
          if (!data || !schema) throw new Error('data and schema parameters required');
          
          const result = validateData({ data, schema, strict, custom_rules });
          return { success: true, result };
        }
        
        case 'evaluate_expression': {
          const { expression, variables, type, safe_mode } = request.params as unknown as EvaluateExpressionParams;
          if (!expression) throw new Error('expression parameter required');
          
          const result = evaluateExpression({ expression, variables, type, safe_mode });
          return { success: true, result };
        }
        
        case 'manage_secrets': {
          const { action, key, value, type, mask_pattern } = request.params as unknown as ManageSecretsParams;
          if (!action || !key) throw new Error('action and key parameters required');
          
          const result = manageSecrets({ action, key, value, type, mask_pattern });
          return { success: true, result };
        }
        
        case 'web_intelligence': {
          const { action, url, urls, query, options } = request.params as unknown as WebIntelligenceParams;
          if (!action) throw new Error('action parameter required');
          
          const result = await webIntelligence({ action, url, urls, query, options });
          return { success: true, result };
        }
        
        case 'cognitive_task': {
          const { task_action, description, task_id, context } = request.params as any;
          
          if (task_action === 'plan') {
            const result = await this.cognitiveBrain.planTask(description, context);
            return { success: true, result };
          } else if (task_action === 'execute') {
            const result = await this.cognitiveBrain.executeTask(task_id, async (tool, params) => {
              return await this.processRequest({ action: tool as any, params });
            });
            return { success: true, result };
          } else {
            throw new Error('task_action must be "plan" or "execute"');
          }
        }
        
        case 'cognitive_search': {
          const { action, query, engines, filters, options } = request.params as unknown as CognitiveSearchParams;
          if (!action || !query) throw new Error('action and query parameters required');
          
          const result = await cognitiveSearch({ action, query, engines, filters, options });
          return { success: true, result };
        }
        
        case 'analytics_brain': {
          const { action, data, options } = request.params as unknown as AnalyticsBrainParams;
          if (!action || !data) throw new Error('action and data parameters required');
          
          const result = await analyticsBrain({ action, data, options });
          return { success: true, result };
        }
        
        case 'vision_intelligence': {
          const { action, image_url, image_urls, image_data, options } = request.params as unknown as VisionIntelligenceParams;
          if (!action) throw new Error('action parameter required');
          if (!image_url && !image_urls && !image_data) throw new Error('image source required (image_url, image_urls, or image_data)');
          
          const result = await visionIntelligence({ action, image_url, image_urls, image_data, options });
          return { success: true, result };
        }
        
        case 'orchestrator_brain': {
          const { action, task_description, tools_available, constraints, context } = request.params as unknown as OrchestratorParams;
          if (!action || !task_description) throw new Error('action and task_description parameters required');
          
          const result = await orchestratorBrain({ action, task_description, tools_available, constraints, context });
          return { success: true, result };
        }
        
        case 'system_intelligence': {
          const { action, command, code, language, ssh_config, file_config, security } = request.params as unknown as SystemIntelligenceParams;
          if (!action) throw new Error('action parameter required');
          
          const result = await systemIntelligence({ action, command, code, language, ssh_config, file_config, security });
          return { success: true, result };
        }
        
        case 'memory_brain': {
          const { action, key, value, context, query, associations, learning_data, retention_policy } = request.params as unknown as MemoryBrainParams;
          if (!action) throw new Error('action parameter required');
          
          const result = await memoryBrain({ action, key, value, context, query, associations, learning_data, retention_policy });
          return { success: true, result };
        }
        
        case 'database_intelligence': {
          const { action, connection, query, schema_config, optimization_config, migration_config } = request.params as unknown as DatabaseIntelligenceParams;
          if (!action) throw new Error('action parameter required');
          
          const result = await databaseIntelligence({ action, connection, query, schema_config, optimization_config, migration_config });
          return { success: true, result };
        }
        
        default:
          throw new Error(`Unknown action: ${request.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}