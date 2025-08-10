import type { MCPRequest, MCPResponse, TypewriteParams, InferParams, CastParams, LogParams } from './types.js';
import { typewrite } from '../core/index.js';
import { createLogger } from '../logger/index.js';
import { inferType, cast } from '../utils/index.js';

export class MCPAdapter {
  private logger = createLogger({ animated: false });

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