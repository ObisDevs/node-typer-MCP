export interface MCPRequest {
  action: 'typewrite' | 'infer' | 'cast' | 'log';
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